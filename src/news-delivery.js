import { emptyState, enqueue, deliver, routes, messageParts, pendingBatch, slotFor } from './delivery-queue.js';
import {reviewPending} from './queue-review.js';
import {validIcons,iconMessage} from './topic-icons.js';
export class NewsDelivery {
  constructor(ctx,env){this.ctx=ctx;this.env=env;this.tail=Promise.resolve();}
  serial(fn){const run=this.tail.then(fn);this.tail=run.catch(()=>{});return run;}
  async load(){
    const count=await this.ctx.storage.get('chunks');
    if(!count)return emptyState();
    const parts=[];for(let i=0;i<count;i++)parts.push(await this.ctx.storage.get('state:'+i));
    return JSON.parse(parts.join(''));
  }
  async save(state){
    // Each storage value stays below 128 KiB even with Cyrillic headlines.
    const json=JSON.stringify(state),parts=[];
    for(let i=0;i<json.length;i+=20000)parts.push(json.slice(i,i+20000));
    await this.ctx.storage.transaction(async tx=>{
      const old=await tx.get('chunks')||0;
      for(let i=0;i<parts.length;i++)await tx.put('state:'+i,parts[i]);
      for(let i=parts.length;i<old;i++)await tx.delete('state:'+i);
      await tx.put('chunks',parts.length);
    });
  }
  async fetch(request){return this.serial(async()=>{
    const state=await this.load();
    const icons=request.headers.get('X-Topic-Icons');
    if(icons!==null)state.icons=validIcons(JSON.parse(decodeURIComponent(icons)));
    reviewPending(state);
    enqueue(state,await request.json(),Date.now());
    await this.save(state);
    await this.process(state);
    const byTopic=Object.fromEntries(Object.keys(routes).map(topic=>[topic,state.pending.filter(i=>i.topic===topic).length]));
    const preview=Object.fromEntries(Object.keys(routes).map(topic=>{
      const job=state.jobs[topic];
      const parts=job?(job.parts?.slice(job.partIndex||0)||messageParts(topic,job.items)):messageParts(topic,pendingBatch(state,topic));
      return [topic,parts.length?parts.map(p=>p.text).join('\n\n———\n\n'):null];
    }));
    return Response.json({pending:state.pending.length,sent:state.sent,expired:state.expired||0,filtered:state.filtered||0,reclassified:state.reclassified||0,digestLimit:10,sourceLimit:3,schedule:{timezone:'Europe/Kyiv',hours:[0,6,12,18],silentHour:0},byTopic,preview});
  });}
  async alarm(){return this.serial(async()=>this.process(await this.load()));}
  async process(state){
    const enabled=this.env.TELEGRAM_DELIVERY_ENABLED==='true';
    // Watchdog survives eviction/crash while delivering. Disabled mode never calls Telegram.
    if(enabled && state.pending.length)await this.ctx.storage.setAlarm(Date.now()+60000);
    await deliver(state,{now:Date.now(),enabled,save:s=>this.save(s),send:async(topic,text,{silent=false}={})=>{
      if(!this.env.TG_NEWS_BOT || !/^-100\d+$/.test(this.env.TELEGRAM_GROUP_CHAT_ID||''))return {ok:false,code:'configuration'};
      const response=await fetch(`https://api.telegram.org/bot${this.env.TG_NEWS_BOT}/sendMessage`,{
        method:'POST',headers:{'content-type':'application/json'},signal:AbortSignal.timeout(8000),
        body:JSON.stringify({chat_id:this.env.TELEGRAM_GROUP_CHAT_ID,message_thread_id:routes[topic],...iconMessage(topic,text,state.icons),disable_notification:silent,link_preview_options:{is_disabled:true}})
      });
      const body=await response.json();
      return {ok:response.ok && body.ok===true && Number.isInteger(body.result?.message_id),code:body.error_code||response.status,retryAfter:body.parameters?.retry_after};
    }});
    if(enabled && state.pending.length){
      const retries=Object.values(state.jobs).map(j=>j.nextAt);
      const now=Date.now();
      // A successful send deletes its job, but other eligible topics still need
      // to drain within the same release window rather than wait ten minutes.
      const ready=state.pending.some(item=>{
        if(state.jobs[item.topic])return false;
        const slot=slotFor(item.topic,now);
        return slot&&(item.topic==='critical'||!state.slots[item.topic+'/'+slot]);
      });
      await this.ctx.storage.setAlarm(Math.max(now+60000,Math.min(now+(ready?60000:600000),...retries)));
    }else await this.ctx.storage.deleteAlarm();
  }
}
