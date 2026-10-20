import assert from 'node:assert/strict';
import {reviewPending} from '../src/queue-review.js';
import {emptyState,enqueue,pendingBatch} from '../src/delivery-queue.js';
import {selectNews} from '../src/news-selection.js';
import {sources} from '../src/source-catalog.js';
const now=Date.parse('2026-10-20T12:00:00Z'),base={publishedAt:new Date(now).toISOString(),excerpt:''};
const state=emptyState();
enqueue(state,{microsoft:[{...base,title:'KDE Plasma 6.8.1: fixes for Wayland',source:'Comss',url:'https://www.comss.ru/page.php?id=22507'}],apple:[{...base,title:'Apple manufacturing partners for latest iPhone lineup',source:'Apple Newsroom',url:'https://www.apple.com/newsroom/sales'},{...base,title:'iOS 27.1 security update',source:'Apple Newsroom',url:'https://www.apple.com/newsroom/ios'}],critical:[{...base,title:'Keep urgent alert',source:'CISA KEV',url:'https://example.com/critical'}]},now);
reviewPending(state,now);
assert.equal(state.pending.find(i=>i.source==='Comss').topic,'linux');assert.equal(state.filtered,1);assert.equal(state.reclassified,1);assert.ok(state.pending.some(i=>i.topic==='critical'));assert.ok(state.pending.some(i=>i.title==='iOS 27.1 security update'));
const snapshot=structuredClone(state);reviewPending(state,now);assert.deepEqual(state,snapshot);
const queued=emptyState();enqueue(queued,{ai:[{...base,title:'Protected job',source:'Source',url:'https://example.com/job'}]},now);queued.jobs.ai={items:[queued.pending[0]]};reviewPending(queued,now);assert.equal(queued.pending.length,1);
const selection=selectNews([{...base,title:'Release 1.21.2',source:'Ansible community releases',url:'https://github.com/containers/ansible-podman-collections/releases/tag/1.21.2'}],new Map(sources.map(s=>[s.name,s])),{now});assert.match(selection.groups.linux[0].title,/ansible-podman-collections/);
const games=selectNews([{...base,title:'World of Warcraft: Forever stress test',source:'PC Gamer',url:'https://example.com/forever'},{...base,publishedAt:new Date(now-3600000).toISOString(),title:'Diablo IV season update',source:'PC Gamer',url:'https://example.com/diablo'}],new Map([['PC Gamer',{name:'PC Gamer',categories:['games'],role:'editorial'}]]),{now});assert.match(games.groups.games[0].title,/Diablo/);
const batchState=emptyState();enqueue(batchState,{cloud:Array.from({length:6},(_,i)=>({...base,title:'Cloud news '+i,source:i<4?'First':'Second',url:'https://example.com/'+i}))},now);assert.equal(pendingBatch(batchState,'cloud').length,4);assert.equal(pendingBatch(batchState,'cloud').filter(i=>i.source==='First').length,2);
console.log('Queue review: Linux routing, Apple scope, protected jobs, idempotent migration, release names, favorites and source diversity passed.');

const appleReview=selectNews(['Release candidates of iOS 27.2 and macOS 27.2 land','Third RCs for macOS Sequoia rolling out','Old iPhone parts reused for smartphones'].map((title,i)=>({...base,title,source:'3DNews',url:'https://3dnews.ru/test'+i})),new Map(sources.map(s=>[s.name,s])),{now});assert.equal(appleReview.groups.apple.length,0);
