import assert from 'node:assert/strict';
import {loadCatalogSource} from '../src/topics-worker.js';
const source={id:'test',name:'Fixture',url:'https://example.com/feed',homepage:'https://example.com',categories:['ai']};
assert.equal((await loadCatalogSource(source,async()=>new Response('',{status:403}))).check.status,'http-error');
assert.equal((await loadCatalogSource(source,async()=>new Response('',{status:429}))).check.httpStatus,429);
assert.equal((await loadCatalogSource(source,async()=>new Response('<html>challenge</html>'))).check.status,'not-feed');
assert.equal((await loadCatalogSource(source,async()=>new Response('<rss><channel></channel></rss>'))).check.status,'empty-feed');
assert.equal((await loadCatalogSource(source,async()=>{throw new DOMException('secret must not be copied','TimeoutError');})).check.status,'timeout');
const failure=await loadCatalogSource(source,async()=>{throw new Error('sensitive transport detail');});
assert.equal(failure.check.status,'transport-or-parse-error');assert.ok(!JSON.stringify(failure).includes('sensitive'));
const valid=await loadCatalogSource(source,async()=>new Response('<rss><channel><item><title>AI release</title><link>https://example.com/a</link><pubDate>Tue, 20 Oct 2026 06:00:00 GMT</pubDate></item></channel></rss>'));
assert.equal(valid.check.status,'ok');assert.equal(valid.check.items,1);
console.log('Source diagnostics: HTTP errors, timeout, challenge HTML, empty feed and safe error reporting passed.');
for(const url of ['https://ubuntu.com/blog/feed','https://ubuntu.com/security/notices/rss.xml','https://canonical.com/blog/feed']){
 const loaded=await loadCatalogSource({...source,url},async(_,options)=>{
  assert.equal(options.headers['User-Agent'],'news-aggregator/1.0');
  assert.match(options.headers.Accept,/application\/rss\+xml/);
  return new Response('<rss><channel><item><title>Ubuntu update</title><link>https://ubuntu.com/blog/update</link><pubDate>Tue, 20 Oct 2026 10:00:00 GMT</pubDate></item></channel></rss>');
 });assert.equal(loaded.check.status,'ok');assert.equal(loaded.items.length,1);
}
await loadCatalogSource(source,async(_,options)=>{assert.equal(options.headers,undefined);return new Response('<rss><channel/></rss>');});
