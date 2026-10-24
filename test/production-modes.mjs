import assert from 'node:assert/strict';
import worker from '../src/production-worker.js';
const original=globalThis.fetch;
globalThis.fetch=async url=>String(url).includes('cisa.gov')?Response.json({vulnerabilities:[]}):new Response(`<rss><channel><item><title>OpenAI stable update</title><link>https://example.com/news</link><pubDate>${new Date().toUTCString()}</pubDate></item></channel></rss>`);
try{
 for(const mode of ['legacy','shadow','topics']){
  let enqueues=0,kvWrites=0;const pending=[];
  const env={NEWS_PIPELINE_MODE:mode,TELEGRAM_DELIVERY_ENABLED:'false',NEWS_CACHE:{get:async()=>null,put:async(key)=>{if(!key.startsWith("adapters:")&&!key.startsWith("streaming:"))kvWrites++;}},NEWS_DELIVERY:{idFromName:()=>1,get:()=>({fetch:async(url,options)=>{enqueues++;const groups=JSON.parse(options.body);assert.ok(groups.ai);return Response.json({pending:groups.ai.length,sent:0});}})}};
  await worker.scheduled({},env,{waitUntil:p=>pending.push(p)});await Promise.all(pending);
  assert.equal(enqueues,mode==='legacy'?0:1);assert.equal(kvWrites,mode==='shadow'?2:1);
 }
 assert.equal((await worker.fetch(new Request('https://example.com/'),{},{})).status,404);
}finally{globalThis.fetch=original;}
console.log('Production routing: legacy/shadow/topics modes passed, no external requests.');
