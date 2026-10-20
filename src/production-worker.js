import legacy from './worker.js';
import topics from './topics-worker.js';
export {NewsDelivery} from './news-delivery.js';
// Keep the existing channel working until the group pipeline is deliberately enabled.
export default {
 fetch(request,env,ctx){return legacy.fetch(request,env,ctx);},
 async scheduled(event,env,ctx){
  const mode=env.NEWS_PIPELINE_MODE||'legacy';
  if(mode==='topics')return topics.scheduled(event,env,ctx);
  if(mode==='shadow'){
   const results=await Promise.allSettled([legacy.scheduled(event,env,ctx),topics.scheduled(event,env,ctx)]);
   if(results.some(r=>r.status==='rejected'))throw new Error('One of the scheduled news pipelines failed');
   return;
  }
  return legacy.scheduled(event,env,ctx);
 }
};
