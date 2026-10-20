import { parseFeed,readResponseBody,looksLikeFeed } from './worker.js';
import { sources } from './source-catalog.js';
import { selectNews } from './news-selection.js';
import {adapterSources,loadAdapter} from './source-adapters.js';
export { NewsDelivery } from './news-delivery.js';
export async function loadCatalogSource(source,fetcher=fetch){
 const started=Date.now();let httpStatus;
 try{
  const response=await fetcher(source.url,{signal:AbortSignal.timeout(15000)});httpStatus=response.status;
  if(!response.ok)return {items:[],check:{name:source.name,status:'http-error',httpStatus,durationMs:Date.now()-started}};
  const body=await readResponseBody(response);
  if(!looksLikeFeed(body))return {items:[],check:{name:source.name,status:'not-feed',httpStatus,durationMs:Date.now()-started}};
  const items=parseFeed(body,source);
  return {items,check:{name:source.name,status:items.length?'ok':'empty-feed',httpStatus,items:items.length,durationMs:Date.now()-started}};
 }catch(error){
  return {items:[],check:{name:source.name,status:/Timeout|Abort/.test(error.name)?'timeout':'transport-or-parse-error',httpStatus,durationMs:Date.now()-started}};
 }
}
export async function collect(fetcher=fetch, now=Date.now(), {cache,adapters=adapterSources}={}){
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
 return {selection:selectNews(items,new Map([...sources,...adapters].map(s=>[s.name,s])),{now,hours:48}),failures:checks.filter(c=>!['ok','empty-source'].includes(c.status)).map(c=>c.name),checks};
}
export default {
 async fetch(){return new Response('Not Found',{status:404});},
 async scheduled(event,env){
  const stub=env.NEWS_DELIVERY.get(env.NEWS_DELIVERY.idFromName('private-news-group-v1'));
  const {selection,failures,checks}=await collect(fetch,Date.now(),{cache:env.NEWS_CACHE});
  console.log(JSON.stringify({failedSources:failures,sourceErrors:checks.filter(c=>c.status!=='ok'),securityReview:selection.securityReview.length}));
  const response=await stub.fetch('https://queue.internal/enqueue',{method:'POST',body:JSON.stringify(selection.groups)});
  if(!response.ok)throw new Error('Delivery queue rejected ingestion');
  const queue=await response.json();
  const {preview,...stats}=queue;
  console.log(JSON.stringify({pipeline:'topics',deliveryEnabled:env.TELEGRAM_DELIVERY_ENABLED==='true',...stats}));
  // Private diagnostics in the existing KV; no HTTP endpoint, credentials or article bodies.
  if(env.NEWS_CACHE)await env.NEWS_CACHE.put('topics:diagnostics',JSON.stringify({checkedAt:new Date().toISOString(),pipeline:'topics',deliveryEnabled:env.TELEGRAM_DELIVERY_ENABLED==='true',...queue,checks,securityReview:selection.securityReview.length}));
 }
};
