import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
const require=createRequire(import.meta.resolve('wrangler/package.json'));
const {Miniflare,convertV4MiniflareOptions}=require('miniflare');
const persist=await fs.mkdtemp('.wrangler/delivery-runtime-');
const options={modules:true,scriptPath:'.wrangler/topics-build/topics-worker.js',compatibilityDate:'2026-06-30',durableObjects:{NEWS_DELIVERY:{className:'NewsDelivery',useSQLite:true}},durableObjectsPersist:persist,bindings:{TELEGRAM_DELIVERY_ENABLED:'false'}};
for(let restart=0;restart<2;restart++){
 const config=convertV4MiniflareOptions?convertV4MiniflareOptions(options):options;
 if(convertV4MiniflareOptions)config.resourcePersistencePath=persist;
 const mf=new Miniflare(config);
 try{
  const ns=await mf.getDurableObjectNamespace('NEWS_DELIVERY');const stub=ns.get(ns.idFromName('test'));
  const send=groups=>stub.fetch('https://internal/enqueue',{method:'POST',body:JSON.stringify(groups)});
  if(!restart)assert.equal((await(await send({games:[{title:'Local runtime test',url:'https://example.com/runtime',source:'Fixture'}]})).json()).pending,1);
  assert.equal((await(await send({})).json()).pending,1);
  assert.equal((await(await send({games:[{title:'Local runtime test',url:'https://example.com/runtime',source:'Fixture'}]})).json()).pending,1);
 }finally{await mf.dispose();}
}
console.log('Real workerd / SQLite Durable Object: queue survived full runtime restart; dedup passed; Telegram disabled.');
