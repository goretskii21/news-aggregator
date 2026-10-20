import {selectNews} from './news-selection.js';
import {sources} from './source-catalog.js';
// Reclassify already queued, unsent material when editorial rules change.
export function reviewPending(state,now=Date.now()){
 if(state.selectionVersion===2)return;
 const protectedKeys=new Set(Object.values(state.jobs).flatMap(j=>j.items.map(i=>i.key)));
 const keep=state.pending.filter(i=>i.topic==='critical'||protectedKeys.has(i.key));
 const candidates=state.pending.filter(i=>i.topic!=='critical'&&!protectedKeys.has(i.key));
 const byKey=new Map(candidates.map(i=>[i.key,i]));
 const result=selectNews(candidates.map(i=>({...i,publishedAt:i.publishedAt||new Date(i.addedAt).toISOString(),categories:[i.topic],excerpt:''})),new Map(sources.map(s=>[s.name,s])),{now,hours:48});
 const reviewed=Object.values(result.groups).flat().map(i=>({...byKey.get(i.key),topic:i.topic,title:i.title}));
 state.filtered=(state.filtered||0)+candidates.length-reviewed.length;
 state.reclassified=(state.reclassified||0)+reviewed.filter(i=>i.topic!==byKey.get(i.key).topic).length;
 state.pending=[...keep,...reviewed];state.selectionVersion=2;
}
