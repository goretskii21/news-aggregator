import assert from 'node:assert/strict';
import {emptyState,enqueue,deliver,slotFor,routes} from '../src/delivery-queue.js';
import {NewsDelivery} from '../src/news-delivery.js';
import {collect} from '../src/topics-worker.js';
const at=s=>Date.parse(s),now=at('2026-10-20T06:00:00Z'); // Kyiv 09:00, summer time.
const item=n=>({url:`https://example.com/${n}`,title:'News '+n,source:'Source'});
let state=emptyState(),snapshot,calls=[];
const save=async s=>{snapshot=structuredClone(s);};
const send=async(topic,text)=>{assert.ok(snapshot.jobs[topic]);calls.push({topic,text});return {ok:true};};
const run=(time=now,opts={})=>deliver(state,{now:time,save,send,enabled:true,...opts});
assert.ok(slotFor('ai',now));assert.equal(slotFor('git',now),null);
assert.ok(slotFor('git',now+600000));assert.equal(slotFor('ai',now+600000),null);
assert.ok(slotFor('ai',at('2026-12-01T07:00:00Z'))); // winter UTC offset.
assert.ok(slotFor('games',at('2026-10-20T16:10:00Z')));
enqueue(state,{ai:Array.from({length:7},(_,i)=>({...item(i),source:'Source '+i%3}))},now);
enqueue(state,{ai:[item(0)]},now);assert.equal(state.pending.length,7);
await run(now,{enabled:false});assert.equal(calls.length,0);
await run();assert.equal(calls.length,1);assert.equal(state.pending.length,2);
assert.ok(calls[0].text.includes('News 4'));assert.ok(!calls[0].text.includes('News 5'));
await run(now+60000);assert.equal(calls.length,1); // one batch per slot.
state=structuredClone(snapshot);enqueue(state,{ai:[item(0)]},now);assert.equal(state.pending.length,2);
await run(at('2026-10-20T15:00:00Z'));assert.equal(state.pending.length,0);
state=emptyState();enqueue(state,{critical:[item('c')],ai:[item('a')]},now);
await run(now,{send:async()=>({ok:false,code:429,retryAfter:180})});
assert.equal(state.pending.length,2);assert.equal(state.jobs.critical.nextAt,now+180000);
await run(now+120000);assert.equal(state.pending.length,2); // group-wide retry_after.
state=structuredClone(snapshot);await run(now+180000);assert.equal(state.pending.length,1);
await run(now+181000);assert.equal(state.pending.length,1); // group-wide pacing.
await run(now+185000);assert.equal(state.pending.length,0);
state=emptyState();enqueue(state,{critical:[item('timeout')]},now);
await run(now,{send:async()=>{throw new Error('network');}});assert.equal(state.pending.length,1);
state=structuredClone(snapshot);await run(now+120000);assert.equal(state.pending.length,0);
// Recreate Durable Object with persisted storage; all nine real topic routes, no network.
const map=new Map();let alarm;
const storage={get:async k=>structuredClone(map.get(k)),put:async(k,v)=>map.set(k,structuredClone(v)),delete:async k=>map.delete(k),transaction:async fn=>fn(storage),setAlarm:async t=>{alarm=t;},deleteAlarm:async()=>{alarm=null;}};
const ctx={storage},env={TELEGRAM_DELIVERY_ENABLED:'false'};
let object=new NewsDelivery(ctx,env);
await Promise.all(Object.keys(routes).map(topic=>object.fetch(new Request('https://internal/',{method:'POST',body:JSON.stringify({[topic]:[item(topic)]})}))));
assert.equal((await object.load()).pending.length,9);
object=new NewsDelivery(ctx,env);assert.equal((await object.load()).pending.length,9);assert.equal(alarm,null);
const big=emptyState();enqueue(big,{games:Array.from({length:1000},(_,i)=>({...item('long'+i),title:'Я'.repeat(230)}))},now);
await object.save(big);assert.equal((await object.load()).pending.length,1000);
for(const value of map.values())if(typeof value==='string')assert.ok(Buffer.byteLength(value)<128*1024);
const originalFetch=globalThis.fetch;let payload;
globalThis.fetch=async(url,options)=>{payload=JSON.parse(options.body);assert.ok(String(url).startsWith('https://api.telegram.org/bot'));return Response.json({ok:true,result:{message_id:1}});};
object=new NewsDelivery(ctx,{TELEGRAM_DELIVERY_ENABLED:'true',TG_NEWS_BOT:'fake-test-token',TELEGRAM_GROUP_CHAT_ID:'-1004292521513'});
await object.save(emptyState());await object.fetch(new Request('https://internal/',{method:'POST',body:JSON.stringify({critical:[item('route')]})}));
assert.equal(payload.message_thread_id,3);assert.equal(payload.chat_id,'-1004292521513');assert.equal((await object.load()).pending.length,0);
const originalNow=Date.now;
const localTimes={critical:'06:00',ai:'06:00',git:'06:10',containers:'06:20',cloud:'06:30',microsoft:'06:40',linux:'15:50',apple:'16:00',games:'16:10'};
try{
 for(const [topic,id]of Object.entries(routes)){
  Date.now=()=>at(`2026-10-20T${localTimes[topic]}:00Z`);
  await object.save(emptyState());
  await object.fetch(new Request('https://internal/',{method:'POST',body:JSON.stringify({[topic]:[item(topic)]})}));
  assert.equal(payload.message_thread_id,id);assert.equal((await object.load()).pending.length,0);
 }
}finally{Date.now=originalNow;}
globalThis.fetch=originalFetch;
state=emptyState();enqueue(state,{games:[item('old')],critical:[item('urgent')]},now);
enqueue(state,{},now+49*3600000);assert.equal(state.pending.length,1);assert.equal(state.pending[0].topic,'critical');assert.equal(state.expired,1);
let feedRequests=0;
const collected=await collect(async url=>{
 if(String(url).includes('cisa.gov'))return Response.json({vulnerabilities:[]});
 feedRequests++;return new Response(`<rss><channel><item><title>Docker stable release</title><link>https://example.com/release</link><pubDate>Tue, 20 Oct 2026 06:00:00 GMT</pubDate></item></channel></rss>`);
},now);
assert.equal(feedRequests,74);assert.equal(collected.failures.length,0);assert.equal(Object.values(collected.selection.groups).flat().length,1);
console.log('Queue, retries, restart, concurrency, pacing, Kyiv DST, routing and 74-feed collector checks passed (mock Telegram only).');
