import { parseFeed,readResponseBody,looksLikeFeed } from './worker.js';
import { sources } from './source-catalog.js';
import { selectNews } from './news-selection.js';
export { NewsDelivery } from './news-delivery.js';
export async function collect(fetcher=fetch, now=Date.now()){
  const items=[],failures=[];let next=0;
  await Promise.all(Array.from({length:6},async()=>{
    while(next<sources.length){const source=sources[next++];try{
      const response=await fetcher(source.url,{signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw new Error('HTTP '+response.status);
      const body=await readResponseBody(response);if(!looksLikeFeed(body))throw new Error('Not a feed');
      items.push(...parseFeed(body,source));
    }catch{failures.push(source.name);}}
  }));
  try{
    const response=await fetcher('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',{signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw new Error('KEV request failed');
    const data=await response.json();
    items.push(...data.vulnerabilities.map(v=>({source:'CISA KEV',title:`${v.cveID}: ${v.vulnerabilityName}`,excerpt:`${v.vendorProject} ${v.product}. ${v.shortDescription}`,url:`https://www.cisa.gov/known-exploited-vulnerabilities-catalog?search_api_fulltext=${encodeURIComponent(v.cveID)}`,publishedAt:v.dateAdded+'T00:00:00Z',knownExploited:true,categories:['critical']})));
  }catch{failures.push('CISA KEV');}
  return {selection:selectNews(items,new Map(sources.map(s=>[s.name,s])),{now,hours:48}),failures};
}
export default {
  async fetch(){return new Response('Not Found',{status:404});},
  async scheduled(event,env){
    const stub=env.NEWS_DELIVERY.get(env.NEWS_DELIVERY.idFromName('private-news-group-v1'));
    const {selection,failures}=await collect();
    // No article contents, chat identifiers, or credentials in operational logs.
    console.log(JSON.stringify({failedSources:failures,securityReview:selection.securityReview.length}));
    const response=await stub.fetch('https://queue.internal/enqueue',{method:'POST',body:JSON.stringify(selection.groups)});
    if(!response.ok)throw new Error('Delivery queue rejected ingestion');
    console.log(JSON.stringify({pipeline:'topics',deliveryEnabled:env.TELEGRAM_DELIVERY_ENABLED==='true',...await response.json()}));
  }
};
