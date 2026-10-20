import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.resolve('wrangler/package.json'));
const {Miniflare,convertV4MiniflareOptions}=require('miniflare');
const {build}=require('esbuild');
if(!process.argv.includes('--send')){console.log('Explicit --send required: one live post to AI topic.');process.exit(0);}
const token=process.env.TG_NEWS_BOT,chat=process.env.TELEGRAM_GROUP_CHAT_ID;
assert.ok(token && chat,'Missing local credentials');
const ledgerPath='.wrangler/telegram-topics-live-ledger.json';
try{await fs.access(ledgerPath);throw new Error('Existing live-test ledger: inspect it before any further real send.');}catch(e){if(e.code!=='ENOENT')throw e;}
await build({entryPoints:['test/fixtures/topics-live-worker.js'],bundle:true,format:'esm',platform:'browser',outfile:'.wrangler/topics-live-harness.js'});
let attempts=0,receipt;
const groups={ai:[{title:'Проверка новой очереди: отправка в тему AI работает. Это тест, не новость.',source:'Локальный тест с Windows — без деплоя',url:'https://example.com/news-aggregator/queue-live-test-v1'}]};
const persist='.wrangler/topics-live-state';
const create=enabled=>{
 const opts={modules:true,scriptPath:'.wrangler/topics-live-harness.js',compatibilityDate:'2026-06-30',durableObjects:{NEWS_DELIVERY:{className:'NewsDelivery',useSQLite:true}},durableObjectsPersist:persist,bindings:{TELEGRAM_DELIVERY_ENABLED:enabled?'true':'false',TG_NEWS_BOT:token,TELEGRAM_GROUP_CHAT_ID:chat},outboundService:async request=>{
  assert.ok(enabled,'Outbound forbidden after restart');assert.equal(attempts,0,'Only one outbound request allowed');
  assert.ok(request.url===`https://api.telegram.org/bot${token}/sendMessage`,'Unexpected outbound target');
  const payload=await request.clone().json();assert.equal(payload.message_thread_id,5);assert.equal(String(payload.chat_id),String(chat));
  assert.ok(payload.text.includes('Это тест, не новость.'));
  // Exclusive durable marker prevents accidentally repeating a send on script rerun.
  await fs.writeFile(ledgerPath,JSON.stringify({attemptedAt:new Date().toISOString(),status:'attempting',topic:'ai'}),{flag:'wx'});attempts++;
  let response;
  try{response=await fetch(request.url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});}catch{throw new Error('Telegram transport failed; inspect ledger, do not repeat blindly.');}
  const body=await response.clone().json();
  if(!response.ok || !body.ok){await fs.writeFile(ledgerPath,JSON.stringify({status:'rejected',http:response.status,code:body.error_code}));return response;}
  assert.equal(String(body.result.chat.id),String(chat));assert.equal(body.result.message_thread_id,5);
  receipt={status:'confirmed',confirmedAt:new Date().toISOString(),messageId:body.result.message_id,topicId:5,topic:'AI',topicMessage:body.result.is_topic_message===true};
  await fs.writeFile(ledgerPath,JSON.stringify(receipt,null,2));return response;
 }};
 const config=convertV4MiniflareOptions?convertV4MiniflareOptions(opts):opts;if(convertV4MiniflareOptions)config.resourcePersistencePath=persist;
 return new Miniflare(config);
};
async function run(enabled){
 const mf=create(enabled);
 try{
  const ns=await mf.getDurableObjectNamespace('NEWS_DELIVERY');const stub=ns.get(ns.idFromName('controlled-live-test-v1'));
  const response=await stub.fetch('https://internal/manual-test',{method:'POST',body:JSON.stringify(groups)});
  assert.equal(response.status,200);const state=await response.json();assert.equal(state.pending,0);assert.equal(state.sent,1);
  const repeat=await stub.fetch('https://internal/enqueue',{method:'POST',body:JSON.stringify(groups)});assert.deepEqual(await repeat.json(),state);
  return state;
 }finally{await mf.dispose();}
}
const first=await run(true);assert.ok(receipt,'Telegram did not confirm the message');assert.equal(attempts,1);
const restarted=await run(false);assert.equal(attempts,1);
await fs.mkdir('outputs',{recursive:true});
await fs.writeFile('outputs/telegram-topics-live-result.json',JSON.stringify({...receipt,attempts,first,restarted,duplicatePrevented:true,restartVerified:true},null,2));
console.log(JSON.stringify({...receipt,attempts,duplicatePrevented:true,restartVerified:true,productionChanged:false}));
