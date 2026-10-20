import { topics, canonicalUrl } from './news-selection.js';
export const routes = {critical:3,ai:5,git:7,containers:9,cloud:11,microsoft:13,linux:15,apple:17,games:19};
export const hours = Object.fromEntries(Object.keys(routes).filter(t=>t!=='critical').map(t=>[t,[0,6,12,18]]));
export function slotFor(topic, now) {
  if(topic==='critical')return 'immediate';
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Kyiv',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(now)).map(p=>[p.type,p.value]));
  // Allow the eight topic messages to drain sequentially, with limited catch-up.
  return hours[topic]?.includes(Number(parts.hour)) && Number(parts.minute)<30 ? `${parts.year}-${parts.month}-${parts.day}/${parts.hour}:00` : null;
}
export const silentDigest=(topic,slot)=>topic!=='critical' && slot.endsWith('/00:00');
export function emptyState(){return {pending:[],seen:{},slots:{},jobs:{},sent:0};}
export function enqueue(state,groups,now){
  const inFlight=new Set(Object.values(state.jobs).flatMap(j=>j.items.map(i=>i.key)));
  const before=state.pending.length;
  state.pending=state.pending.filter(i=>i.topic==='critical'||inFlight.has(i.key)||i.addedAt>=now-48*3600000);
  state.expired=(state.expired||0)+before-state.pending.length;
  for(const [key,at] of Object.entries(state.seen))if(at<now-30*86400000)delete state.seen[key];
  for(const [key,at] of Object.entries(state.slots))if(at<now-7*86400000)delete state.slots[key];
  for(const [topic,items]of Object.entries(groups)){
    if(!(topic in routes))continue;
    for(const item of items){
      const key=canonicalUrl(item.url);
      if(key.length>700)throw new Error('Article URL exceeds supported message length');
      if(state.seen[key] || state.pending.some(x=>x.key===key))continue;
      if(state.pending.length>=2000)throw new Error('Queue capacity reached; ingestion must retry');
      state.pending.push({key,topic,title:String(item.title).slice(0,230),url:key,source:String(item.source).slice(0,80),publishedAt:item.publishedAt,addedAt:now});
    }
  }
}
export function messageFor(topic,items,offset=0){
  return `${topics[topic]}\n\n`+items.map((i,n)=>`${offset+n+1}. ${i.title}\n${i.source}\n${i.url}`).join('\n\n\n');
}
export function messageParts(topic,items){
  const groups=[];let current=[];
  for(const item of items){
    if(current.length && messageFor(topic,[...current,item],10).length>3800){groups.push(current);current=[];}
    current.push(item);
  }
  if(current.length)groups.push(current);
  let offset=0;
  return groups.map((chunk,index)=>{
    let text=messageFor(topic,chunk,offset);offset+=chunk.length;
    if(groups.length>1)text=text.replace(topics[topic],`${topics[topic]} (${index+1}/${groups.length})`);
    return {items:chunk,text};
  });
}
export function pendingBatch(state,topic){
  const items=[],sourceCounts=new Map();
  for(const item of state.pending.filter(i=>i.topic===topic)){
    if(items.length>=(topic==='critical'?1:10))break;
    if((sourceCounts.get(item.source)||0)>=3)continue;
    if(messageFor(topic,[item]).length<=3800){items.push(item);sourceCounts.set(item.source,(sourceCounts.get(item.source)||0)+1);}
  }
  return items;
}
// Called only inside a serialized Durable Object. Persist before external side effects.
export async function deliver(state,{now,save,send,enabled}){
  if(!enabled || (state.nextSendAt||0)>now)return;
  for(const topic of Object.keys(routes)){
    let job=state.jobs[topic];
    if(!job){
      const slot=slotFor(topic,now);
      if(!slot || (topic!=='critical' && state.slots[topic+'/'+slot]))continue;
      const items=pendingBatch(state,topic);
      if(!items.length)continue;
      job={slot,items,parts:messageParts(topic,items),partIndex:0,attempts:0,nextAt:now};state.jobs[topic]=job;
      await save(state);
    }
    if(job.nextAt>now)continue;
    // Freeze parts for retries and support jobs saved before multipart delivery.
    job.parts ||= messageParts(topic,job.items);job.partIndex ||= 0;
    const part=job.parts[job.partIndex];
    // Persist a recovery delay before the request: a crash must not cause an immediate storm.
    job.nextAt=now+60000;state.nextSendAt=now+10000;await save(state);
    let result;
    try{result=await send(topic,part.text,{silent:silentDigest(topic,job.slot)});}catch{result={ok:false};}
    if(result.ok){
      const keys=new Set(part.items.map(i=>i.key));
      state.pending=state.pending.filter(i=>!keys.has(i.key));
      for(const key of keys)state.seen[key]=now;
      job.partIndex++;state.sent++;
      if(job.partIndex===job.parts.length){
        if(topic!=='critical')state.slots[topic+'/'+job.slot]=now;
        delete state.jobs[topic];
      }else{job.attempts=0;job.nextAt=now+4000;delete job.lastError;}
    }else{
      job.attempts++;
      job.nextAt=now+Math.max(60000*Math.min(60,2**Math.min(job.attempts,6)),(result.retryAfter||0)*1000);
      job.lastError=result.code||'transport-or-response';
    }
    state.nextSendAt=now+Math.max(4000,(result.retryAfter||0)*1000);
    await save(state);
    return; // One group-wide attempt per invocation, including urgent messages and retries.
  }
}
