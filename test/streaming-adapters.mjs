import {emptyState,enqueue,deliver,silentDigest} from '../src/delivery-queue.js';
import assert from 'node:assert/strict';
import {streamingSources,loadStreaming,parseSubscriptionCollection} from '../src/streaming-adapters.js';
import {selectNews} from '../src/news-selection.js';
const [sweet,megogo]=streamingSources;
const page=(names)=>`<script type="application/ld+json">${JSON.stringify({'@type':'ItemList',name:'Новинки в подписке',url:sweet.url,itemListElement:names.map(name=>({'@type':'Movie',name,url:'https://sweet.tv/ua-ru/movie/'+name}))})}</script>`;
const map=new Map(),cache={get:async k=>map.has(k)?JSON.parse(map.get(k)):null,put:async(k,v)=>map.set(k,v)};
let now=Date.parse('2026-10-24T08:00:00Z'),html=page(['old']),requests=0;
const fetcher=async()=>{requests++;return new Response(html);};
let r=await loadStreaming(sweet,fetcher,{cache,now});assert.equal(r.items.length,0);assert.equal(r.check.baseline,true);
html=page(['new','old']);r=await loadStreaming(sweet,fetcher,{cache,now:now+1000});assert.equal(requests,1);
now+=3600000;r=await loadStreaming(sweet,fetcher,{cache,now});assert.equal(r.items.length,1);assert.equal(r.items[0].title,'На SWEET.TV появился фильм «new».');
html=page(['old','new']);now+=3600000;r=await loadStreaming(sweet,fetcher,{cache,now});assert.equal(r.items.length,1,'reorder does not create another event');
now+=3600000;r=await loadStreaming(sweet,async()=>new Response('bad',{status:503}),{cache,now});assert.equal(r.check.status,'subscription-adapter-error');assert.equal(JSON.parse(map.get('streaming:v1:'+sweet.id)).fresh.length,1);
const card=(id,rule)=>`<div class="card videoItem" data-title="Series ${id}" data-vod-rule="${rule}"><a href="https://megogo.net/ru/view/${id}.html">watch</a></div>`;
const m=`<html data-geo="ua">Новые сериалы в подписке${card(1,'svod')}${card(2,'tvod')}${card(3,'dto')}<footer>${card(4,'svod')}</footer>`;
assert.deepEqual(parseSubscriptionCollection(megogo,m).map(i=>i.title),['Series 1']);assert.throws(()=>parseSubscriptionCollection(megogo,m.replace('data-geo="ua"','data-geo="pl"')));
const source={name:'Cinema',categories:['cinema']};const items=['Film trailer for a new movie','Actor wedding and movie star girlfriend','New movie starts filming'].map((title,i)=>({title,source:'Cinema',url:'https://example.com/'+i,publishedAt:new Date(now).toISOString()}));
assert.equal(selectNews(items,new Map([['Cinema',source]]),{now}).groups.cinema.length,2);
console.log('Media: silent baseline, hourly polling, persistent new additions, reorder, failed fetch, Ukraine storefront, rental exclusion and cinema gossip filtering passed.');

const state=emptyState();enqueue(state,{watch:[{title:'На SWEET.TV появился фильм «Example».',source:'SWEET.TV',url:'https://sweet.tv/ua-ru/movie/example',publishedAt:new Date(now).toISOString()}]},now);let posted;await deliver(state,{now,enabled:true,save:async()=>{},send:async(topic,text,options)=>{posted={topic,text,...options};return {ok:true};}});assert.equal(posted.topic,'watch');assert.equal(posted.silent,true);assert.equal(state.pending.length,0);assert.equal(silentDigest('cinema'),true);

const kyiv=streamingSources[2];const kcard=(name)=>'<article data-testid="available-card"><h3>'+name+'</h3><p>Фільм</p><a href="/ua/movie/6ad0add0b714dff6d92b303d">Дивитися</a></article>';const kpage=(name)=>'<section data-testid="new-on-ks-tv-coming-soon">'+kcard('Future')+'</section><section data-testid="new-on-ks-tv-available"><h2>Вже на платформі</h2>'+kcard(name)+'</section>';
assert.equal(parseSubscriptionCollection(kyiv,kpage('Present'))[0].title,'Present');assert.equal(parseSubscriptionCollection(kyiv,kpage('Present')).length,1);assert.throws(()=>parseSubscriptionCollection(kyiv,'<html>Loading</html>'));
const km=new Map(),kc={get:async k=>km.has(k)?JSON.parse(km.get(k)):null,put:async(k,v)=>km.set(k,v)};let kp='<section data-testid="new-on-ks-tv-available"><h2>Вже на платформі</h2>'+kcard('Old').replace('6ad0add0b714dff6d92b303d','68c029f89bb45746b41bb6de')+'</section>';const kfetch=async()=>new Response(kp);assert.equal((await loadStreaming(kyiv,kfetch,{cache:kc,now})).items.length,0);kp=kpage('Present');const kr=await loadStreaming(kyiv,kfetch,{cache:kc,now:now+3600000});assert.equal(kr.items.length,1);assert.ok(kr.items[0].title.endsWith('Подписка или покупка.'));
