import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {sources as catalog} from '../src/source-catalog.js';
import {parseFeed,readResponseBody,looksLikeFeed} from '../src/worker.js';
import {selectNews,topics} from '../src/news-selection.js';
const output=process.env.NEWS_REPORT_DIR?pathToFileURL(path.resolve(process.env.NEWS_REPORT_DIR)+path.sep):new URL('../outputs/',import.meta.url);
const cache=new URL('../.wrangler/source-preview/',import.meta.url);
await fs.mkdir(cache,{recursive:true});
await fs.mkdir(output,{recursive:true});
let audit;
try{audit=JSON.parse(await fs.readFile(new URL('news-sources-audit.json',output),'utf8'));}
catch(e){if(e.code!=='ENOENT')throw e;audit={sources:catalog.map(s=>({...s,format:'feed'}))};}
const feeds=audit.sources.filter(s=>s.format==='feed');
let results=[];let all=[];let next=0;let kevStatus;let collectedAt=Date.now();
if (!process.argv.includes('--cached')) {
await Promise.all(Array.from({length:6},async()=>{
 while(next<feeds.length){
  const s=feeds[next++];const id=s.name.toLowerCase().replace(/[^a-z0-9]+/g,'-');const result={name:s.name,url:s.url,language:s.language,categories:s.categories};
  try{
   const response=await fetch(s.url,{headers:{'user-agent':'Mozilla/5.0 NewsAggregator parser preview','accept':'application/rss+xml,application/atom+xml,application/xml,text/xml'},signal:AbortSignal.timeout(20000)});
   result.http=response.status;if(!response.ok)throw new Error('HTTP '+response.status);
   const body=await readResponseBody(response);
   await fs.writeFile(new URL(id+'.xml',cache),body);
   if(!looksLikeFeed(body))throw new Error('Not an XML feed');
   const rawEntries=(body.match(/<(?:item|entry)\b/gi)||[]).length;
   const items=parseFeed(body,{id,name:s.name,homepage:s.finalUrl||s.url,categories:s.categories});
   result.rawEntries=rawEntries;result.parsed=items.length;
   result.missingDates=items.filter(i=>!i.publishedAt).length;
   result.nonHttpLinks=items.filter(i=>!/^https?:\/\//i.test(i.url)).length;
   result.markupInText=items.filter(i=>/<\/?[a-z][^>]*>/i.test(i.title+' '+i.excerpt)).length;
   result.status=items.length?'parsed':'empty';
   all.push(...items.map(i=>({...i,language:s.language,role:s.role})));
  }catch(e){result.status='failed';result.error=e.cause?.code||e.message;}
  results.push(result);console.log(`${result.status}: ${s.name} (${result.parsed||0})`);
 }
}));
// Structured CISA adapter for this read-only preview; not connected to production.
try{
 const kevResponse=await fetch('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',{signal:AbortSignal.timeout(20000)});
 if(!kevResponse.ok)throw new Error('HTTP '+kevResponse.status);
 const kev=await kevResponse.json();const source={name:'CISA KEV',role:'official',categories:['critical']};
 const items=kev.vulnerabilities.map(v=>({id:v.cveID,source:source.name,title:`${v.cveID}: ${v.vulnerabilityName}`,excerpt:`${v.vendorProject} ${v.product}. ${v.shortDescription}`,url:`https://www.cisa.gov/known-exploited-vulnerabilities-catalog?search_api_fulltext=${encodeURIComponent(v.cveID)}`,publishedAt:v.dateAdded+'T00:00:00Z',knownExploited:true,categories:['critical'],language:'EN',role:'official'}));
 all.push(...items);kevStatus={status:'parsed',records:items.length};
}catch(e){kevStatus={status:'failed',error:e.cause?.code||e.message};}
} else {
 all=JSON.parse(await fs.readFile(new URL('normalized.json',cache),'utf8'));
 const previous=JSON.parse(await fs.readFile(new URL('feed-parser-check.json',output),'utf8'));
 results=previous.checks;kevStatus=previous.kev;collectedAt=Date.parse(previous.collectedAt);
}
const now=collectedAt;
const selected=selectNews(all,new Map(audit.sources.map(s=>[s.name,s])),{now,hours:48});
await fs.writeFile(new URL('normalized.json',cache),JSON.stringify(all));
await fs.writeFile(new URL('selection.json',cache),JSON.stringify(selected));
const summary={collectedAt:new Date(now).toISOString(),windowHours:48,feeds:results.length,parsedFeeds:results.filter(r=>r.status==='parsed').length,failedFeeds:results.filter(r=>r.status!=='parsed'),totalRecords:all.length,kev:kevStatus,topics:Object.fromEntries(Object.entries(selected.groups).map(([k,v])=>[k,v.length])),securityReview:selected.securityReview.length,rejectedByReason:selected.rejected.reduce((a,x)=>(a[x.reason]=(a[x.reason]||0)+1,a),{}),checks:results};
await fs.writeFile(new URL('feed-parser-check.json',output),JSON.stringify(summary,null,2));
let report='# Пробные дайджесты — без отправки\n\n';
report+=`Сбор: ${new Date(now).toLocaleString('ru-RU',{timeZone:'Europe/Kyiv'})} по Киеву. Окно — последние 48 часов. Это проверка RSS и предварительных правил, а не готовая редакционная подборка. В Telegram ничего не отправлялось.\n\n`;
report+='Оригинальные заголовки и короткие выдержки из RSS сохранены на языке источника. Перевод и объяснение «почему важно» ещё не подключены. Полные статьи отдельно не проверялись. Показываем до пяти пунктов на тему, максимум два от одного источника. Сначала первоисточники, затем редакционные дополнения.\n\n';
const shown=new Map();
for(const[topic,title]of Object.entries(topics)){
 report+=`## ${title}\n\nКандидатов после предварительного отбора: ${selected.groups[topic].length}.\n\n`;
 if(topic==='critical')report+='Автоматическая тревога в этом прототипе допускается только для релевантного продукта из CISA KEV. Остальные CVE отправляются на проверку; отсутствие пунктов не означает отсутствие уязвимостей в инфраструктуре.\n\n';
 let count=0;const perSource=new Map();
 for(const i of selected.groups[topic]){
  if(count>=5)break;if((perSource.get(i.source)||0)>=2)continue;
  // Keep the total amount of excerpted material per publication small across the report.
  if((shown.get(i.source)||0)>=4)continue;
  const esc=t=>t.replace(/[\[\]]/g,'').replace(/\s+/g,' ').trim();
  report+=`- **[${esc(i.title)}](${i.url})** — ${i.source}, ${new Date(i.publishedAt).toLocaleDateString('ru-RU',{timeZone:'Europe/Kyiv'})}.\n`;
  if(i.excerpt&&!i.excerpt.startsWith('Краткое описание у источника'))report+=`  ${esc(i.excerpt).slice(0,180)}\n`;
  count++;perSource.set(i.source,(perSource.get(i.source)||0)+1);shown.set(i.source,(shown.get(i.source)||0)+1);
 }
 if(!count)report+='Нет пунктов для этого образца.\n';
 report+='\n';
}
report+='## Ограничения этой проверки\n\n- HTML-адаптеры Anthropic, GitHub advisories, Blizzard/AION 2 и Hetzner News пока не подключены.\n- Русские ленты с ошибкой доступа с Windows остаются в резерве: их проверка через целевую Cloudflare-инфраструктуру ещё нужна.\n- Дедупликация: канонический URL без UTM, точный нормализованный заголовок и отдельное правило для обнаруженного дубля WoW: Forever. Общее объединение разных русских/английских пересказов ещё не реализовано.\n- Слишком старые, будущие и недатированные записи не публикуются в образце.\n- Правила срочности консервативные: остальные релевантные security-материалы требуют оценки по первоисточнику.\n';
await fs.writeFile(new URL('digest-preview.md',output),report);
let qa='# Проверка парсера источников\n\n';
qa+=`Собрано ${summary.totalRecords} записей, распознано ${summary.parsedFeeds} из ${summary.feeds} RSS/Atom-лент. CISA KEV: ${kevStatus.status}.\n\n`;
qa+='| Лента | Результат | Записей в XML | Распознано | Без даты | Не HTTP(S) | HTML в тексте |\n|---|---|---:|---:|---:|---:|---:|\n';
for(const r of results.sort((a,b)=>a.name.localeCompare(b.name)))qa+=`| ${r.name} | ${r.status}${r.error?' — '+r.error:''} | ${r.rawEntries??'—'} | ${r.parsed??'—'} | ${r.missingDates??'—'} | ${r.nonHttpLinks??'—'} | ${r.markupInText??'—'} |\n`;
qa+='\nПроверка выполнена с Windows. Ошибки RU-сетевого доступа не являются основанием исключать источник. JSON-проверка содержит счётчики отбора; сырые XML и полные нормализованные данные оставлены только в локальном игнорируемом .wrangler/source-preview.\n';
await fs.writeFile(new URL('feed-parser-check.md',output),qa);
console.log(JSON.stringify({...summary,checks:undefined},null,2));
