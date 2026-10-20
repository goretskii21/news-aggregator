import assert from 'node:assert/strict';
import {NewsDelivery} from '../src/news-delivery.js';
import {emptyState,enqueue,routes} from '../src/delivery-queue.js';
const originalNow=Date.now,originalFetch=globalThis.fetch;
let now=Date.parse('2026-10-20T15:00:00Z'),alarm=null,calls=[];
const map=new Map(),storage={get:async k=>structuredClone(map.get(k)),put:async(k,v)=>map.set(k,structuredClone(v)),delete:async k=>map.delete(k),transaction:async fn=>fn(storage),setAlarm:async t=>{alarm=t;},deleteAlarm:async()=>{alarm=null;}};
try{
 Date.now=()=>now;
 globalThis.fetch=async(_,options)=>{calls.push(JSON.parse(options.body));return Response.json({ok:true,result:{message_id:calls.length}});};
 const state=emptyState();
 const groups=Object.fromEntries(Object.keys(routes).filter(t=>t!=='critical').map(t=>[t,Array.from({length:t==='ai'?11:1},(_,i)=>({title:'News '+i+' '+ 'x'.repeat(220),source:'Source '+i%4,url:'https://example.com/'+t+'/'+i,publishedAt:new Date(now).toISOString()}))]));
 enqueue(state,groups,now);
 let object=new NewsDelivery({storage},{TELEGRAM_DELIVERY_ENABLED:'true',TG_NEWS_BOT:'fixture',TELEGRAM_GROUP_CHAT_ID:'-100123'});
 await object.save(state);await object.process(state);
 for(let i=0;i<25;i++){
  const saved=await object.load();if(Object.keys(saved.slots).length===8)break;
  assert.equal(alarm,now+60000,'eligible releases must continue every minute');
  now=alarm;object=new NewsDelivery({storage},object.env);await object.alarm();
 }
 const saved=await object.load();assert.equal(Object.keys(saved.slots).length,8);assert.equal(new Set(calls.map(c=>c.message_thread_id)).size,8);assert.ok(now<Date.parse('2026-10-20T15:30:00Z'));assert.equal(saved.pending.length,1);assert.equal(alarm,now+600000,'completed slot waits despite leftover stories');
 console.log('Scheduled drain: all eight topics and multipart AI complete within one window across object restarts; leftovers do not repeat.');
}finally{Date.now=originalNow;globalThis.fetch=originalFetch;}
