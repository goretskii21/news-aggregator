import assert from 'node:assert/strict';
import {emptyState,enqueue,deliver,nextRelease,silentDigest} from '../src/delivery-queue.js';
const now=Date.parse('2026-10-24T07:00:00Z'); // Kyiv10:00, outside fixed windows.
const items=(topic,n)=>Array.from({length:n},(_,i)=>({title:topic+' news '+i,source:'Source '+i%4,url:'https://example.com/'+topic+'/'+i,publishedAt:new Date(now).toISOString()}));
let state=emptyState(),calls=[];const save=async()=>{},send=async(topic,text,options)=>{calls.push({topic,text,...options});return {ok:true};};
enqueue(state,{ai:items('ai',9)},now);await deliver(state,{now,enabled:true,save,send});assert.equal(calls.length,0);
enqueue(state,{ai:items('ai',10)},now);await deliver(state,{now,enabled:true,save,send});assert.equal(calls.length,1);assert.equal(state.pending.length,0);assert.deepEqual(state.slots,{});
// A new ten-item batch can publish even after that topic's fixed slot completed.
state=emptyState();const at=Date.parse('2026-10-24T09:05:00Z');state.slots['ai/2026-10-24/12:00']=at-60000;enqueue(state,{ai:items('second',19)},at);calls=[];
await deliver(state,{now:at,enabled:true,save,send});assert.equal(calls.length,1);assert.equal(state.pending.length,9);assert.equal(nextRelease(state,'ai',at+60000),null);
await deliver(state,{now:Date.parse('2026-10-24T15:00:00Z'),enabled:true,save,send});assert.equal(calls.length,2);assert.equal(state.pending.length,0);
state=emptyState();enqueue(state,{ai:items('one-source',10).map(i=>({...i,source:'Only'}))},now);assert.equal(nextRelease(state,'ai',now),null);
// Backlog in an earlier topic must not starve another full batch.
state=emptyState();enqueue(state,{ai:items('ai',20),git:items('git',10)},now);calls=[];
await deliver(state,{now,enabled:true,save,send});state=structuredClone(state);
await deliver(state,{now:now+60000,enabled:true,save,send});assert.deepEqual(calls.map(c=>c.topic),['ai','git']);assert.equal(state.pending.length,10);
await deliver(state,{now:now+120000,enabled:true,save,send});assert.equal(state.pending.length,0);
assert.equal(silentDigest('ai','batch/123',Date.parse('2026-10-23T23:00:00Z')),true);assert.equal(silentDigest('critical','immediate',Date.parse('2026-10-23T23:00:00Z')),false);
console.log('Threshold digests:9wait/10send, source cap, completed-slot independence, scheduled leftovers, round-robin and night silence passed.');
