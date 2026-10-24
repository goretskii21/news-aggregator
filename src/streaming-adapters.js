// Public Ukrainian subscription collections. No account cookies or paid APIs.
export const streamingSources = [
 {id:'sweet-subscription',name:'SWEET.TV',url:'https://sweet.tv/ua-ru/collections/7033-novinki-v-podpiske',kind:'sweet'},
 {id:'megogo-series-subscription',name:'MEGOGO',url:'https://megogo.net/ru/collection/new_series_sub',kind:'megogo'}
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
  const start=html.indexOf('Новые сериалы в подписке');if(start<0)throw Error('Subscription collection missing');
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
   rows.push({title:decode(tag.match(/data-title="([^"]+)"/)?.[1]),url:card.match(/href="(https:\/\/megogo.net\/ru\/view\/[^"?#]+)"/)?.[1],type:'сериал'});
  }
 }
 const host=new URL(source.url).hostname,seen=new Set();
 const result=rows.filter(row=>{
  try{const u=new URL(row.url);if(u.protocol!=='https:'||u.hostname!==host||!row.title||seen.has(u.href))return false;seen.add(u.href);return true;}catch{return false;}
 });
 if(!result.length)throw Error('No verified subscription cards');
 return result.slice(0,100);
}
export async function loadStreaming(source,fetcher,{cache,now=Date.now()}={}){
 const key='streaming:v1:'+source.id,started=Date.now();let httpStatus;
 try{
  // Persisted observation is required: a cold start must not announce the catalog.
  if(!cache)return {items:[],check:{name:source.name,status:'baseline-storage-required',items:0}};
  const retry=await cache.get(key+':retry','json');
  if(retry?.nextAt>now)return {items:[],check:{name:source.name,status:'subscription-adapter-error',items:0,httpStatus:retry.httpStatus,retryAt:new Date(retry.nextAt).toISOString()}};
  const previous=await cache.get(key,'json');
  let state=previous;
  if(!state||now-state.checkedAt>=3600000){
   const response=await fetcher(source.url,{headers:{'User-Agent':'news-aggregator/1.0','Accept':'text/html'},signal:AbortSignal.timeout(15000)});
   httpStatus=response.status;
   if(!response.ok)throw Error('HTTP '+response.status);
   const rows=parseSubscriptionCollection(source,await response.text());
   const seen={...(previous?.seen||{})},fresh=(previous?.fresh||[]).filter(i=>Date.parse(i.publishedAt)>=now-48*3600000);
   for(const row of rows){
    if(previous&&!seen[row.url])fresh.push({source:source.name,role:'official',categories:['watch'],title:`На ${source.name} появился ${row.type} «${row.title}».`,url:row.url,publishedAt:new Date(now).toISOString(),excerpt:'Новое наблюдаемое добавление в украинскую подборку подписки; точное время добавления неизвестно.'});
    seen[row.url]=now;
   }
   // Keep observed URLs across carousel reorder/removal and Worker deployments.
   state={checkedAt:now,seen,fresh};
   if(Object.keys(seen).length>10000)throw Error('Observation history capacity reached');
   await cache.put(key,JSON.stringify(state));
  }
  return {items:state.fresh||[],check:{name:source.name,status:'ok',items:state.fresh?.length||0,observed:Object.keys(state.seen).length,baseline:!previous,checkedAt:new Date(state.checkedAt).toISOString(),durationMs:Date.now()-started}};
 }catch{
  if(cache)await cache.put(key+':retry',JSON.stringify({nextAt:now+3600000,httpStatus}),{expirationTtl:3600});
  return {items:[],check:{name:source.name,status:'subscription-adapter-error',httpStatus,items:0,durationMs:Date.now()-started}};
 }
}
