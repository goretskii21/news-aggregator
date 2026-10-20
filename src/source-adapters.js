import {parseFeed} from './worker.js';

// Public, read-only endpoints. No GitHub token or browser session is required.
export const adapterSources = [
 ...[['Moby','moby/moby'],['Ansible','ansible/ansible'],['containerd','containerd/containerd'],['runc','opencontainers/runc']].map(([name,repo])=>({id:`advisories-${repo.replace('/','-')}`,name:`${name} advisories`,kind:'github',repo,categories:['critical'],url:`https://api.github.com/repos/${repo}/security-advisories?state=published&sort=published&direction=desc&per_page=100`})),
 {id:'anthropic-news',name:'Anthropic News',kind:'anthropic',categories:['ai'],url:'https://www.anthropic.com/news'},
 {id:'google-developers',name:'Google Developers AI',kind:'feed',categories:['ai'],url:'https://developers.googleblog.com/feeds/posts/default?alt=rss'},
 {id:'hetzner-news',name:'Hetzner News',kind:'html',categories:['cloud'],url:'https://www.hetzner.com/news/'},
 {id:'blizzard-news',name:'Blizzard News',kind:'blizzard',categories:['games'],url:'https://news.blizzard.com/en-us/api/feed/blizzard?offset=0'},
 {id:'aion2-notices',name:'AION 2 official announcements',kind:'aion',categories:['games'],url:'https://api-global-community.plaync.com/aion2_global/board/notice_en/article/search/moreArticle?size=30'}
].map(s=>({...s,role:'official'}));

export function plain(value=''){
 return String(value).replace(/<[^>]*>/g,' ').replace(/&#(x[\da-f]+|\d+);/gi,(_,n)=>{const v=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return v>0&&v<=0x10ffff?String.fromCodePoint(v):' ';}).replace(/&(?:amp|quot|apos|lt|gt|nbsp);/g,s=>({'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>','&nbsp;':' '}[s])).replace(/\s+/g,' ').trim();
}
function normalized(source,rows){
 const seen=new Set();
 return rows.flatMap(row=>{
  try{
   if(typeof row.url!=='string'||!row.url.trim())return [];
   const url=new URL(row.url,source.url),title=plain(row.title).slice(0,500),date=Date.parse(row.publishedAt);
   if(url.protocol!=='https:'||!title||!Number.isFinite(date)||seen.has(url.href))return [];
   // Only publisher links, never URLs introduced by unrelated embedded data.
   const allowed=source.kind==='github'?url.hostname==='github.com'&&url.pathname.startsWith(`/${source.repo}/security/advisories/`):source.kind==='aion'?url.hostname==='aion2.plaync.com':source.kind==='blizzard'?url.hostname==='news.blizzard.com':url.hostname===new URL(source.url).hostname;
   if(!allowed)return [];
   seen.add(url.href);
   return [{...row,source:source.name,role:'official',categories:source.categories,title,url:url.href,publishedAt:new Date(date).toISOString(),excerpt:plain(row.excerpt).slice(0,3000)}];
  }catch{return [];}
 }).slice(0,100);
}
export function parseAdapter(source,body){
 let rows=[];
 if(source.kind==='feed')rows=parseFeed(body,source).filter(i=>/\b(?:AI|Gemini|Gemma|LLM|machine learning|artificial intelligence|DeepMind)\b/i.test(i.title+' '+i.excerpt));
 else if(source.kind==='github'){
  const data=JSON.parse(body);if(!Array.isArray(data))throw new Error('Invalid advisory list');
  rows=data.filter(a=>a.state==='published'&&!a.withdrawn_at).map(a=>({title:`${source.repo.split('/')[1]}: ${a.cve_id||a.ghsa_id} — ${a.summary}`,url:a.html_url,publishedAt:a.published_at,excerpt:`${source.repo} ${a.severity||'unknown'} security advisory. ${a.description||''}`,advisory:{id:a.ghsa_id,cve:a.cve_id,severity:a.severity,affected:(a.vulnerabilities||[]).map(v=>({package:v.package?.name,ecosystem:v.package?.ecosystem,range:v.vulnerable_version_range,fixed:v.patched_versions})).slice(0,30)}}));
 }else if(source.kind==='blizzard'){
  const data=JSON.parse(body);if(!Array.isArray(data.contentItems))throw new Error('Invalid Blizzard list');
  rows=data.contentItems.map(i=>i.properties).filter(Boolean).map(p=>({title:`${p.cxpProduct?.title||'Blizzard'}: ${p.title}`,url:p.newsUrl,publishedAt:p.publishDate||p.publishedAt||p.lastUpdated,excerpt:p.summary}));
 }else if(source.kind==='aion'){
  const data=JSON.parse(body);if(!Array.isArray(data.contentList))throw new Error('Invalid AION list');
  rows=data.contentList.filter(i=>i.statusCode===1&&i.visibilityCode===1).map(i=>({title:`AION 2: ${i.title}`,url:`https://aion2.plaync.com/en-us/board/notice/view?articleId=${encodeURIComponent(i.id)}`,publishedAt:i.timestamps?.publishedAt||i.timestamps?.postedAt,excerpt:i.summary}));
 }else if(source.kind==='anthropic'){
  for(const match of body.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)){
   const date=match[2].match(/<time\b[^>]*>([\s\S]*?)<\/time>/i)?.[1];
   const title=match[2].match(/<(?:h[1-6]|span)\b[^>]*class="[^"]*__[^"]*title[^\"]*"[^>]*>([\s\S]*?)<\/(?:h[1-6]|span)>/i)?.[1];
   if(date&&title)rows.push({url:match[1],title,excerpt:'Anthropic Claude announcement',publishedAt:plain(date)+' 00:00:00 GMT'});
  }
 }else{
  // Prefer publisher-provided structured data; undated links are never news.
  const visit=value=>{if(!value||typeof value!=='object')return;if(Array.isArray(value)){value.forEach(visit);return;}if(value.headline&&value.datePublished)rows.push({title:value.headline,url:value.url||(typeof value.mainEntityOfPage==='string'?value.mainEntityOfPage:value.mainEntityOfPage?.['@id']),publishedAt:value.datePublished,excerpt:value.description});Object.values(value).filter(v=>v&&typeof v==='object').forEach(visit);};
  for(const m of body.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{visit(JSON.parse(m[1]));}catch{}}
  for(const m of body.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/gi)){
   const date=m[1].match(/<time\b[^>]*datetime=["']([^"']+)/i)?.[1];
   const link=m[1].match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
   const title=m[1].match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i)?.[1];
   if(date&&link&&title)rows.push({title,url:link[1],publishedAt:date});
  }
 }
 return normalized(source,rows);
}

export function parseGithubHtml(source,body){
 const rows=[];
 for(const match of body.matchAll(/<li\b[^>]*class="[^"]*Box-row[^\"]*"[^>]*>([\s\S]*?)<\/li>/gi)){
  const link=match[1].match(/<a\b[^>]*href="([^"]+\/security\/advisories\/GHSA-[^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
  const date=match[1].match(/<relative-time\b[^>]*datetime="([^"]+)"/i)?.[1];
  if(!link||!date||!/published/i.test(match[1]))continue;
  const id=link[1].split('/').pop(),severity=match[1].match(/title="Severity: ([^"]+)"/i)?.[1];
  rows.push({title:`${source.repo.split('/')[1]}: ${id} — ${plain(link[2])}`,url:`https://github.com${link[1]}`,publishedAt:date,excerpt:`${source.repo} ${severity||'unknown'} security advisory`,advisory:{id,severity,affected:[],metadataIncomplete:true}});
 }
 if(!rows.length&&!/There (?:aren.t|are no).*?(?:published )?security advisories|No published advisories/i.test(plain(body)))throw new Error('Unrecognized GitHub advisory page');
 return normalized(source,rows);
}

export async function loadAdapter(source,fetcher=fetch,{cache,now=Date.now()}={}){
 const key=`adapters:v2:${source.id}`,started=Date.now();let httpStatus,apiStatus,transport=source.kind;
 let previous;
 if(cache){try{previous=JSON.parse(await cache.get(key));}catch{} }
 if(previous?.nextAt>now)return {items:previous.items||[],check:{...previous.check,cached:true,nextCheckAt:new Date(previous.nextAt).toISOString()}};
 let items=[],status,retryMs=3600000;
 try{
  const response=await fetcher(source.url,{headers:{'User-Agent':'news-aggregator/1.0','Accept':source.kind==='github'?'application/vnd.github+json':'*/*'},signal:AbortSignal.timeout(15000),redirect:'follow'});httpStatus=response.status;
  if(!response.ok){
   status='http-error';const retry=Number(response.headers.get('retry-after'));if(Number.isFinite(retry)&&retry>0)retryMs=Math.min(86400000,Math.max(retryMs,retry*1000));
   if(source.kind==='github'&&[403,429].includes(httpStatus)){
    apiStatus=httpStatus;transport='github-html';
    const fallback=await fetcher(`https://github.com/${source.repo}/security/advisories`,{headers:{'User-Agent':'news-aggregator/1.0'},signal:AbortSignal.timeout(15000)});httpStatus=fallback.status;
    if(fallback.ok){items=parseGithubHtml(source,await fallback.text());status=items.length?'ok':'empty-source';}
   }
  }
  else{
   let text=await response.text();if(text.length>2000000)throw new Error('Oversized source');
   if(source.kind==='feed'){
    // Google's official RSS omits dates. Resolve only the bounded current page,
    // then cache the result for an hour; never substitute the collection time.
    const missing=parseFeed(text,source).filter(i=>!i.publishedAt).slice(0,10);
    const dates=new Map();let next=0;
    await Promise.all(Array.from({length:3},async()=>{
     while(next<missing.length){const row=missing[next++];try{
      const url=new URL(row.url);if(url.hostname!==new URL(source.url).hostname||url.protocol!=='https:')continue;
      const article=await fetcher(url.href,{signal:AbortSignal.timeout(10000)});if(!article.ok)continue;
      const html=await article.text(),date=html.match(/"datePublished"\s*:\s*"([^"\n]+)"/)?.[1];
      if(Number.isFinite(Date.parse(date)))dates.set(row.url,new Date(date).toUTCString());
     }catch{}}
    }));
    text=text.replace(/<item\b[^>]*>[\s\S]*?<\/item>/gi,entry=>{
     const link=entry.match(/<link[^>]*>([^<]+)<\/link>/i)?.[1];
     return dates.has(link)?entry.replace('</item>',`<pubDate>${dates.get(link)}</pubDate></item>`):entry;
    });
   }
   items=parseAdapter(source,text);status=items.length?'ok':source.kind==='github'?'empty-source':'schema-or-empty-source';
  }
 }catch(error){status=/Timeout|Abort/.test(error.name)?'timeout':'transport-or-parse-error';}
 const check={name:source.name,adapter:source.kind,transport,apiStatus,status,httpStatus,items:items.length,durationMs:Date.now()-started,checkedAt:new Date(now).toISOString()};
 // Bounded normalized cache: one refresh/hour, including failures. Never cache secrets.
 if(cache)await cache.put(key,JSON.stringify({nextAt:now+retryMs,items,check}),{expirationTtl:Math.ceil(retryMs/1000)+3600});
 return {items,check};
}
