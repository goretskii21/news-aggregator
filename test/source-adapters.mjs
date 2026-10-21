import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {adapterSources,parseAdapter,parseGithubHtml,loadAdapter} from '../src/source-adapters.js';
import {selectNews} from '../src/news-selection.js';
import {collect} from '../src/topics-worker.js';
const source=kind=>adapterSources.find(s=>s.kind===kind);
const githubHtml=await readFile(new URL('fixtures/adapters/github.html',import.meta.url),'utf8');
assert.equal(parseGithubHtml(source('github'),githubHtml).length,2);
const fallback=await loadAdapter(source('github'),async url=>String(url).includes('api.github.com')?new Response('',{status:403}):new Response(githubHtml));
assert.equal(fallback.check.transport,'github-html');assert.equal(fallback.check.apiStatus,403);assert.equal(fallback.check.status,'ok');assert.equal(fallback.items[0].advisory.metadataIncomplete,true);
assert.equal((await loadAdapter(source('github'),async()=>new Response('',{status:403}))).check.status,'http-error');
assert.throws(()=>parseGithubHtml(source('github'),'<html>Sign in to GitHub</html>'));
for(const kind of ['github','blizzard','aion','anthropic']){
 const fixture=await readFile(new URL(`fixtures/adapters/${kind}.${kind==='anthropic'?'html':'json'}`,import.meta.url),'utf8');
 const rows=parseAdapter(source(kind),fixture);assert.ok(rows.length>=2,kind);
 for(const row of rows){assert.ok(Number.isFinite(Date.parse(row.publishedAt)));assert.ok(row.url.startsWith('https://'));assert.ok(!row.title.includes('<'));}
 if(kind==='github'){
  assert.ok(rows[0].advisory.affected.length);assert.equal(rows[0].knownExploited,undefined);
  const fresh=rows.map(r=>({...r,publishedAt:new Date().toISOString()}));
  const selected=selectNews(fresh,new Map([[source(kind).name,source(kind)]]));
  assert.equal(selected.groups.critical.length,0);assert.equal(selected.securityReview.length,rows.length);
  const withdrawn=JSON.parse(fixture);withdrawn.forEach(a=>a.withdrawn_at=new Date().toISOString());assert.equal(parseAdapter(source(kind),JSON.stringify(withdrawn)).length,0);
 }
}
const html='<script type="application/ld+json">{"@type":"NewsArticle","headline":"New Hetzner Cloud service","url":"https://www.hetzner.com/news/service/","datePublished":"2026-10-20T10:00:00Z"}</script>';
assert.equal(parseAdapter(source('html'),html).length,1);
assert.equal(parseAdapter(source('html'),html.replace('"url":"https://www.hetzner.com/news/service/",','')).length,0);
assert.equal(parseAdapter(source('html'),'<a href="/news/ad">Undated marketing</a>').length,0);
assert.equal(parseAdapter(source('html'),html.replace('https://www.hetzner.com/news/service/','https://evil.example/')).length,0);
assert.equal(parseAdapter(source('feed'),'<rss><channel><item><title>Gemini API update</title><link>https://developers.googleblog.com/en/gemini/</link><pubDate>Tue, 20 Oct 2026 10:00:00 GMT</pubDate></item><item><title>Android UI styling</title><link>https://developers.googleblog.com/en/android/</link><pubDate>Tue, 20 Oct 2026 10:00:00 GMT</pubDate></item></channel></rss>').length,1);
const map=new Map(),cache={get:async k=>map.get(k)||null,put:async(k,v)=>map.set(k,v)};
let calls=0;const fetcher=async()=>{calls++;return new Response(html);},now=Date.now();
assert.equal((await loadAdapter(source('html'),fetcher,{cache,now})).check.status,'ok');
assert.equal((await loadAdapter(source('html'),fetcher,{cache,now:now+600000})).check.cached,true);assert.equal(calls,1);
await loadAdapter(source('html'),fetcher,{cache,now:now+3600001});assert.equal(calls,2);
map.clear();calls=0;const limited=async()=>{calls++;return new Response('',{status:429,headers:{'Retry-After':'7200'}});};
assert.equal((await loadAdapter(source('html'),limited,{cache,now})).check.httpStatus,429);
await loadAdapter(source('html'),limited,{cache,now:now+3600001});assert.equal(calls,1);
const bad=await loadAdapter(source('aion'),async()=>new Response('<html>challenge</html>'));
assert.equal(bad.check.status,'transport-or-parse-error');assert.equal(bad.items.length,0);
assert.equal((await loadAdapter(source('github'),async()=>Response.json([]))).check.status,'empty-source');
const undated='<rss><channel><item><title>Gemini API update</title><link>https://developers.googleblog.com/en/gemini/</link></item></channel></rss>';
let articleCalls=0;
const enriched=await loadAdapter(source('feed'),async url=>{
 if(String(url).includes('feeds/'))return new Response(undated);
 articleCalls++;return new Response('<script type="application/ld+json">{"datePublished":"2026-10-20"}</script>');
});
assert.equal(articleCalls,1);assert.equal(enriched.items[0].publishedAt,'2026-10-20T00:00:00.000Z');
const noDate=await loadAdapter(source('feed'),async url=>new Response(String(url).includes('feeds/')?undated:'<html>no publication date</html>'));
assert.equal(noDate.items.length,0);
assert.equal((await loadAdapter(source('html'),async()=>{throw new DOMException('secret','TimeoutError');})).check.status,'timeout');
map.clear();let adapterRequests=0;
const integrationFetch=async url=>{
 const adapter=adapterSources.find(s=>s.url===String(url));
 if(adapter){adapterRequests++;if(adapter.kind==='github')return Response.json([]);
  if(['anthropic','blizzard','aion'].includes(adapter.kind))return new Response(await readFile(new URL(`fixtures/adapters/${adapter.kind}.${adapter.kind==='anthropic'?'html':'json'}`,import.meta.url),'utf8'));
  if(adapter.kind==='html')return new Response(html);
  return new Response('<rss><channel><item><title>Gemini release</title><link>https://developers.googleblog.com/gemini/</link><pubDate>Tue, 20 Oct 2026 10:00:00 GMT</pubDate></item></channel></rss>');
 }
 if(String(url).includes('cisa.gov'))return Response.json({vulnerabilities:[]});
 return new Response('<rss><channel><item><title>Docker update</title><link>https://example.com/docker</link><pubDate>Tue, 20 Oct 2026 10:00:00 GMT</pubDate></item></channel></rss>');
};
const integrated=await collect(integrationFetch,Date.parse('2026-10-20T13:00:00Z'),{cache});
assert.equal(integrated.checks.length,84);assert.equal(integrated.failures.length,0);assert.equal(adapterRequests,9);
assert.ok(integrated.selection.groups.games.some(i=>i.source==='AION 2 official announcements'));
await collect(integrationFetch,Date.parse('2026-10-20T13:10:00Z'),{cache});assert.equal(adapterRequests,9);
console.log('Adapters: public payloads, dates/links, withdrawn advisories, conservative Critical, schema errors, hourly cache and Retry-After passed.');

const listing=await readFile(new URL('fixtures/adapters/anthropic-listing.html',import.meta.url),'utf8');const currentAnthropic=parseAdapter(source('anthropic'),listing);assert.equal(currentAnthropic.length,3);assert.ok(currentAnthropic.every(i=>i.url.startsWith('https://www.anthropic.com/news/')&&Number.isFinite(Date.parse(i.publishedAt))));assert.equal(parseAdapter(source('anthropic'),listing.replace(/<time[^>]*>[\s\S]*?<\/time>/g,'')).length,0);assert.equal(parseAdapter(source('anthropic'),listing+listing).length,3);
