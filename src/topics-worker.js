import { parseFeed,readResponseBody,looksLikeFeed } from './worker.js';
import { sources } from './source-catalog.js';
import { selectNews } from './news-selection.js';
import {adapterSources,loadAdapter} from './source-adapters.js';
import {streamingSources,loadStreaming} from './streaming-adapters.js';
import {syncTopicIcons} from './topic-icons.js';
export { NewsDelivery } from './news-delivery.js';
export async function loadCatalogSource(source,fetcher=fetch){
 const started=Date.now();let httpStatus;
 try{
  const hostname=new URL(source.url).hostname;
  // These publishers reject or stall Workers requests without explicit headers.
  const headers=(['ubuntu.com','canonical.com','feeds.ign.com','www.playground.ru'].includes(hostname)||hostname==='microsoft.com'||hostname.endsWith('.microsoft.com'))?{
   'User-Agent':'news-aggregator/1.0',
   'Accept':'application/rss+xml, text/html;q=0.9, */*;q=0.8'
  }:undefined;
  const response=await fetcher(source.url,{signal:AbortSignal.timeout(15000),...(headers?{headers}:{})});httpStatus=response.status;
  if(!response.ok)return {items:[],check:{name:source.name,status:'http-error',httpStatus,durationMs:Date.now()-started}};
  let body,bounded=false;
  if(hostname==='www.playground.ru'&&response.body){
   // This feed stalls from Workers after already delivering 20 complete items.
   // Read only that bounded recent page and cancel the remainder, never parse
   // an unfinished item or increase the network timeout indefinitely.
   const reader=response.body.getReader(),decoder=new TextDecoder();body='';
   try{
    while(true){
     const {done,value}=await reader.read();if(done){body+=decoder.decode();break;}
     body+=decoder.decode(value,{stream:true});
     if(body.length>2000000)throw new Error('Feed exceeds size limit');
     if(parseFeed(body,source).length>=20){bounded=true;break;}
    }
   }finally{await reader.cancel().catch(()=>{});}
  }else body=await readResponseBody(response);
  if(!looksLikeFeed(body))return {items:[],check:{name:source.name,status:'not-feed',httpStatus,durationMs:Date.now()-started}};
  const items=parseFeed(body,source).slice(0,bounded?20:undefined);
  return {items,check:{name:source.name,status:items.length?'ok':'empty-feed',httpStatus,items:items.length,...(bounded?{bounded:true}:{}),durationMs:Date.now()-started}};
 }catch(error){
  return {items:[],check:{name:source.name,status:/Timeout|Abort/.test(error.name)?'timeout':'transport-or-parse-error',httpStatus,durationMs:Date.now()-started}};
 }
}
export async function collect(fetcher=fetch, now=Date.now(), {cache,adapters=adapterSources,streaming=streamingSources.filter(s=>s.enabled!==false)}={}){
 const items=[],checks=[];let next=0;
 await Promise.all(Array.from({length:6},async()=>{
  while(next<sources.length){const loaded=await loadCatalogSource(sources[next++],fetcher);items.push(...loaded.items);checks.push(loaded.check);}
 }));
 const started=Date.now();let httpStatus;
 try{
  const response=await fetcher('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',{signal:AbortSignal.timeout(15000)});httpStatus=response.status;
  if(!response.ok)throw new Error('KEV request failed');
  const data=await response.json();
  items.push(...data.vulnerabilities.map(v=>({source:'CISA KEV',title:`${v.cveID}: ${v.vulnerabilityName}`,excerpt:`${v.vendorProject} ${v.product}. ${v.shortDescription}`,url:`https://www.cisa.gov/known-exploited-vulnerabilities-catalog?search_api_fulltext=${encodeURIComponent(v.cveID)}`,publishedAt:v.dateAdded+'T00:00:00Z',knownExploited:true,categories:['critical']})));
  checks.push({name:'CISA KEV',status:'ok',httpStatus,items:data.vulnerabilities.length,durationMs:Date.now()-started});
 }catch(error){checks.push({name:'CISA KEV',status:httpStatus&&!((httpStatus>=200)&&(httpStatus<300))?'http-error':/Timeout|Abort/.test(error.name)?'timeout':'transport-or-parse-error',httpStatus,durationMs:Date.now()-started});}
 let adapterNext=0;
 await Promise.all(Array.from({length:3},async()=>{
  while(adapterNext<adapters.length){const loaded=await loadAdapter(adapters[adapterNext++],fetcher,{cache,now});items.push(...loaded.items);checks.push(loaded.check);}
 }));
 for(const source of streaming){const loaded=await loadStreaming(source,fetcher,{cache,now});items.push(...loaded.items);checks.push(loaded.check);}
 return {selection:selectNews(items,new Map([...sources,...adapters,...streaming.map(s=>({...s,categories:['watch'],role:'official'}))].map(s=>[s.name,s])),{now,hours:48}),failures:checks.filter(c=>!['ok','empty-source'].includes(c.status)).map(c=>c.name),checks};
}
export default {
 async fetch(){return new Response('Not Found',{status:404});},
 async scheduled(event,env){
  const stub=env.NEWS_DELIVERY.get(env.NEWS_DELIVERY.idFromName('private-news-group-v1'));
  const iconSync=await syncTopicIcons(env);
  const {selection,failures,checks}=await collect(fetch,Date.now(),{cache:env.NEWS_CACHE});
  const rejectedByReason=selection.rejected.reduce((counts,item)=>{counts[item.reason]=(counts[item.reason]||0)+1;return counts;},{});
  console.log(JSON.stringify({failedSources:failures,sourceErrors:checks.filter(c=>!['ok','empty-source'].includes(c.status)),securityReview:selection.securityReview.length}));
  const response=await stub.fetch('https://queue.internal/enqueue',{method:'POST',headers:iconSync.icons?{'X-Topic-Icons':encodeURIComponent(JSON.stringify(iconSync.icons))}:{},body:JSON.stringify(selection.groups)});
  if(!response.ok)throw new Error('Delivery queue rejected ingestion');
  const queue=await response.json();
  const {preview,...stats}=queue;
  console.log(JSON.stringify({pipeline:'topics',deliveryEnabled:env.TELEGRAM_DELIVERY_ENABLED==='true',...stats}));
  // Private diagnostics in the existing KV; no HTTP endpoint, credentials or article bodies.
  if(env.NEWS_CACHE)await env.NEWS_CACHE.put('topics:diagnostics',JSON.stringify({checkedAt:new Date().toISOString(),pipeline:'topics',deliveryEnabled:env.TELEGRAM_DELIVERY_ENABLED==='true',...queue,checks,rejectedByReason,topicIcons:{status:iconSync.status,count:Object.keys(iconSync.icons||{}).length},securityReview:selection.securityReview.length}));
 }
};
