// Public Ukrainian subscription collections. No account cookies or paid APIs.
export const streamingSources = [
 {id:'sweet-subscription',name:'SWEET.TV',url:'https://sweet.tv/ua-ru/collections/7033-novinki-v-podpiske',kind:'sweet'},
 {id:'megogo-series-subscription',name:'MEGOGO',url:'https://megogo.net/ru/collection/new_series_sub',kind:'megogo',collectionHeading:'Новые сериалы в подписке',contentType:'сериал'},
 {id:'kyivstar-available',name:'Киевстар ТВ',url:'https://tv.kyivstar.ua/ua/something-new',kind:'kyivstar',accessLabel:'Подписка или покупка',userAgent:'Googlebot'},
 {id:'prime-ua-subscription',name:'Prime Video',url:'https://www.primevideo.com/-/ru/storefront/subscription/prime',kind:'prime',enabled:false},
 {id:'apple-ua-home',name:'Apple TV',url:'https://tv.apple.com/ua?l=ru',kind:'apple'},
 {id:'apple-ua-movies',name:'Apple TV: фильмы',serviceName:'Apple TV',url:'https://tv.apple.com/ua/room/uts.room.movies-on-apple-tv?l=ru',kind:'apple'},
 {id:'megogo-current-subscription',name:'MEGOGO: сейчас в подписке',serviceName:'MEGOGO',url:'https://megogo.net/ru/collection/new_sub_megogo_ua',kind:'megogo',collectionHeading:'Сейчас в подписке',contentType:'релиз'}
];
const decode=s=>String(s||'').replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/<[^>]*>/g,'').trim();
export function parseSubscriptionCollection(source,html){
 const rows=[];
 if(source.kind==='sweet'){
  for(const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)){
   const d=JSON.parse(m[1]);
   if(d['@type']!=='ItemList'||d.name!=='Новинки в подписке'||!String(d.url).startsWith('https://sweet.tv/ua-ru/collections/7033-'))continue;
   for(const item of d.itemListElement||[]){
    if(!['Movie','TVSeries'].includes(item['@type']))continue;
    if(/Россия|Russia|Российская/i.test(JSON.stringify(item.countryOfOrigin)))continue;
    rows.push({title:item.name,url:item.url,type:item['@type']==='Movie'?'фильм':'сериал'});
   }
  }
 }else if(source.kind==='megogo'){
  if(!/data-geo="ua"/.test(html))throw Error('Ukraine storefront not confirmed');
  const heading=[...html.matchAll(/<h[12]\b[^>]*>([\s\S]*?)<\/h[12]>/g)].find(m=>decode(m[1])===(source.collectionHeading||'Новые сериалы в подписке'));
  if(!heading)throw Error('Subscription collection missing');
  const start=heading.index+heading[0].length;
  // Restrict parsing to this widget; never parse recommended/rental collections.
  const tail=html.slice(start),end=tail.search(/<footer\b|<header\b|<section\b/);
  let section=end<0?tail:tail.slice(0,end);
  const widget=section.search(/<div\s+class="cards type-catalog"/);
  if(widget>=0){
   section=section.slice(widget);let depth=0;
   for(const tag of section.matchAll(/<\/?div\b[^>]*>/g)){
    depth+=tag[0].startsWith('</')?-1:1;
    if(depth===0){section=section.slice(0,tag.index+tag[0].length);break;}
   }
  }
  for(const m of section.matchAll(/<div\s+class="card videoItem\b([\s\S]*?)(?=<div\s+class="card videoItem\b|$)/g)){
   const card=m[1],tag=card.slice(0,card.indexOf('>'));
   if(!/data-vod-rule="svod"/.test(tag))continue;
   rows.push({title:decode(tag.match(/data-title="([^"]+)"/)?.[1]),url:card.match(/href="(https:\/\/megogo.net\/ru\/view\/[^"?#]+)"/)?.[1],type:source.contentType||'сериал'});
  }
 }else if(source.kind==='kyivstar'){
  const section=html.match(/<section\b[^>]*data-testid="new-on-ks-tv-available"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  if(!section||!section.includes('Вже на платформі'))throw Error('Available collection missing');
  for(const m of section.matchAll(/<article\b[^>]*data-testid="available-card"[^>]*>([\s\S]*?)<\/article>/g)){
   const card=m[1],title=decode(card.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/)?.[1]);
   const href=card.match(/href="(\/ua\/movie\/[a-f0-9]{24}[^"?#]*)"/)?.[1];
   if(!href)continue;
   const text=decode(card),type=/серіал|сезон/iu.test(text)?'сериал':/фільм/iu.test(text)?'фильм':null;
   if(type)rows.push({title,url:new URL(href,source.url).href,type});
  }
 }else if(source.kind==='apple'){
  const data=JSON.parse(html.match(/<script[^>]*id="serialized-server-data"[^>]*>([\s\S]*?)<\/script>/)?.[1]||'null');
  const pages=data?.data?.map(x=>x.data).filter(x=>Array.isArray(x?.shelves)&&x.channel?.id==='tvs.sbd.4000')||[];
  if(!pages.length)throw Error('Subscription collection missing');
  for(const page of pages){
   const canonical=new URL(page.canonicalURL);
   if(canonical.hostname!=='tv.apple.com'||!/^\/ua(?:\/|$)/.test(canonical.pathname))throw Error('Ukraine storefront not confirmed');
   for(const shelf of page.shelves)for(const item of shelf.items||[]){
    if(item.provider?.name!=='Apple TV'||!['Movie','Show'].includes(item.type)||!item.title)continue;
    const badge=String(item.badge||'').trim();
    if(!/^(?:Новое|Новый сезон|Новый сериал|New|New Season|New Series)$/iu.test(badge))continue;
    if(!item.buttons?.some(b=>b.action?.routeName==='subscribe'&&b.action.modalParams?.queryParams?.brandId==='tvs.sbd.4000'))continue;
    const target=item.segue?.destination,url=item.segue?.url;
    if(target?.storefront!=='ua'||!url||!/^https:\/\/tv\.apple\.com\/ua\/(?:movie|show)\//.test(url))continue;
    const u=new URL(url);u.search='?l=ru';
    rows.push({title:item.title,url:u.href,type:item.type==='Movie'?'фильм':/сезон|season/iu.test(badge)?'новый сезон сериала':'сериал'});
   }
  }
  if(!rows.length)return [];
 }else if(source.kind==='prime'){
  const json=id=>JSON.parse(html.match(new RegExp('<script[^>]*id="'+id+'"[^>]*>([\\s\\S]*?)<\\/script>'))?.[1]||'null');
  const context=json('dv-web-global-store-data')?.RequestContext;
  if(context?.currentTerritory!=='UA'||context?.recordTerritory!=='UA')throw Error('Ukraine storefront not confirmed');
  const data=json('dv-web-page-hydration-data');
  const containers=data?.init?.preparations?.body?.containers;
  if(!Array.isArray(containers)||!containers.some(c=>Array.isArray(c.entities)))throw Error('Subscription collection missing');
  for(const container of containers)for(const item of container.entities||[]){
   const cue=item.entitlementCues;
   // Explicit Prime offer, not a generic free trial for another paid channel.
   if(!/(?:доступом к Prime|Included with Prime|trial (?:of|to) Prime)/iu.test(cue?.focusMessage?.message||''))continue;
   const badge=cue?.titleMetadataBadge?.message||'';
   if(!/НОВЫЙ ФИЛЬМ|НОВЫЙ СЕРИАЛ|НОВЫЕ СЕРИАЛЫ|НОВЫЙ СЕЗОН|ПРЕМЬЕРА СЕЗОНА|НЕДАВНО ДОБАВЛЕНО|NEW MOVIE|NEW SERIES|NEW SEASON|RECENTLY ADDED|SEASON PREMIERE/iu.test(badge))continue;
   const type=item.entityType==='Movie'?'фильм':['TV Show','Season'].includes(item.entityType)?'сериал':null;
   const id=item.link?.url?.match(/^\/(?:-\/ru\/)?detail\/([A-Z0-9]{10,32})(?:[/?]|$)/)?.[1];
   if(!type||!id||!item.title)continue;
   rows.push({title:item.title,url:'https://www.primevideo.com/detail/'+id,type});
  }
  // A valid Ukrainian subscription page may contain no current novelty badges.
  if(!rows.length)return [];
 }
 const host=new URL(source.url).hostname,seen=new Set();
 const result=rows.filter(row=>{
  try{const u=new URL(row.url);if(u.protocol!=='https:'||u.hostname!==host||!row.title||seen.has(u.href))return false;seen.add(u.href);return true;}catch{return false;}
 });
 if(!result.length)throw Error('No verified subscription cards');
 return result.slice(0,100);
}
export async function loadStreaming(source,fetcher,{cache,now=Date.now()}={}){
 const key='streaming:v1:'+source.id,started=Date.now();let httpStatus,observedRegion;
 try{
  // Persisted observation is required: a cold start must not announce the catalog.
  if(!cache)return {items:[],check:{name:source.name,status:'baseline-storage-required',items:0}};
  const retry=await cache.get(key+':retry','json');
  if(retry?.nextAt>now)return {items:[],check:{name:source.name,status:'subscription-adapter-error',items:0,httpStatus:retry.httpStatus,reason:retry.reason,observedRegion:retry.observedRegion,retryAt:new Date(retry.nextAt).toISOString()}};
  const previous=await cache.get(key,'json');
  let state=previous;
  if(!state||now-state.checkedAt>=3600000){
   const response=await fetcher(source.url,{headers:{'User-Agent':source.userAgent||'news-aggregator/1.0','Accept':'text/html'},signal:AbortSignal.timeout(15000)});
   httpStatus=response.status;
   if(!response.ok)throw Error('HTTP '+response.status);
   const html=await response.text();
   if(source.kind==='megogo')observedRegion=html.match(/data-geo="([a-z]{2,3})"/)?.[1]||'missing';
   const rows=parseSubscriptionCollection(source,html);
   const seen={...(previous?.seen||{})},fresh=(previous?.fresh||[]).filter(i=>Date.parse(i.publishedAt)>=now-48*3600000);
   for(const row of rows){
    if(previous&&!seen[row.url])fresh.push({source:source.name,role:'official',categories:['watch'],title:`На ${source.serviceName||source.name} появился ${row.type} «${row.title}».${source.accessLabel?' '+source.accessLabel+'.':''}`,url:row.url,publishedAt:new Date(now).toISOString(),excerpt:'Новое наблюдаемое добавление в украинскую подборку; точное время добавления неизвестно.'});
    seen[row.url]=now;
   }
   // Keep observed URLs across carousel reorder/removal and Worker deployments.
   state={checkedAt:now,seen,fresh,...(observedRegion?{observedRegion}:{})};
   if(Object.keys(seen).length>10000)throw Error('Observation history capacity reached');
   await cache.put(key,JSON.stringify(state));
  }
  return {items:state.fresh||[],check:{name:source.name,status:'ok',items:state.fresh?.length||0,observed:Object.keys(state.seen).length,observedRegion:state.observedRegion,baseline:!previous,checkedAt:new Date(state.checkedAt).toISOString(),durationMs:Date.now()-started}};
 }catch(error){
  const reason=['Ukraine storefront not confirmed','Subscription collection missing','Available collection missing','No verified subscription cards','Observation history capacity reached'].includes(error.message)?error.message:httpStatus&&httpStatus!==200?'http-error':'transport-or-schema-error';
  if(cache)await cache.put(key+':retry',JSON.stringify({nextAt:now+3600000,httpStatus,reason,observedRegion}),{expirationTtl:3600});
  return {items:[],check:{name:source.name,status:'subscription-adapter-error',httpStatus,reason,observedRegion,items:0,durationMs:Date.now()-started}};
 }
}
