// Local live-test harness only. No RSS collection and no public deployment.
import { NewsDelivery as Base } from '../../src/news-delivery.js';
import { enqueue } from '../../src/delivery-queue.js';
export class NewsDelivery extends Base {
 async fetch(request){
  if(new URL(request.url).pathname==='/status'){
   const state=await this.load();return Response.json({pending:state.pending.length,sent:state.sent});
  }
  if(new URL(request.url).pathname==='/manual-test'){
   const groups=await request.json();
   await this.serial(async()=>{
    const state=await this.load();enqueue(state,groups,Date.now());
    const items=state.pending.filter(i=>i.topic==='ai');
    if(items.length && !state.jobs.ai)state.jobs.ai={slot:'manual-live-test',items,attempts:0,nextAt:Date.now()};
    await this.save(state);
   });
   return super.fetch(new Request('https://internal/enqueue',{method:'POST',body:'{}'}));
  }
  return super.fetch(request);
 }
}
export default {fetch(){return new Response('Local test fixture',{status:404});}};
