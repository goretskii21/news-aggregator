import {routes} from './delivery-queue.js';
import {topics} from './news-selection.js';
const key='telegram:topic-icons:v1';
const byThread=Object.fromEntries(Object.entries(routes).map(([topic,id])=>[id,topic]));
export function validIcons(value){
 return Object.fromEntries(Object.entries(value||{}).filter(([topic,icon])=>topic in routes&&/^\d{5,30}$/.test(icon?.id||'')&&typeof icon.emoji==='string'&&icon.emoji.length>0&&icon.emoji.length<=20));
}
export function iconMessage(topic,text,icons){
 const icon=validIcons(icons)[topic],fallback=topics[topic]?.split(' ')[0];
 const entities=[];
 if(icon&&text.startsWith(fallback+' ')){
  text=icon.emoji+text.slice(fallback.length);
  entities.push({type:'custom_emoji',offset:0,length:icon.emoji.length,custom_emoji_id:icon.id});
 }
 // Format at send time, including already prepared retry jobs. Explicit entities
 // keep headlines literal and use UTF-16 offsets alongside custom emoji.
 const label='Читать далее...';let delta=0;
 text=text.replace(/^https?:\/\/[^\r\n]+$/gm,(url,offset)=>{
  try{const parsed=new URL(url);if(!['https:','http:'].includes(parsed.protocol))return url;}catch{return url;}
  entities.push({type:'text_link',offset:offset+delta,length:label.length,url});
  delta+=label.length-url.length;return label;
 });
 return {text,...(entities.length?{entities}:{})};
}
// This bot has no webhook or second update consumer. Store only topic icons and
// the cursor; private messages and unrelated updates are never saved or logged.
export async function syncTopicIcons(env,{fetcher=fetch}={}){
 if(!env.TG_NEWS_BOT||!env.NEWS_CACHE)return {status:'unconfigured'};
 let state={icons:{},nextOffset:0};
 const call=async(method,body)=>{
  const r=await fetcher(`https://api.telegram.org/bot${env.TG_NEWS_BOT}/${method}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
  const data=await r.json();if(!r.ok||!data.ok)throw new Error('Telegram update request failed');return data.result;
 };
 try{
  const saved=await env.NEWS_CACHE.get(key);if(saved)state=JSON.parse(saved);
  state.icons||={};let changed=false;
  for(let page=0;page<3;page++){
   const updates=await call('getUpdates',{offset:state.nextOffset||0,limit:100,timeout:0});
   if(!Array.isArray(updates))throw new Error('Invalid update list');
   for(const update of updates){
    if(!Number.isSafeInteger(update.update_id))continue;
    state.nextOffset=Math.max(state.nextOffset||0,update.update_id+1);changed=true;
    const message=update.message;
    if(String(message?.chat?.id)!==String(env.TELEGRAM_GROUP_CHAT_ID))continue;
    const topic=byThread[message.message_thread_id],event=message.forum_topic_edited||message.forum_topic_created;
    if(!topic||!event||typeof event.icon_custom_emoji_id!=='string')continue;
    const id=event.icon_custom_emoji_id;
    if(id==='')delete state.icons[topic];
    else if(/^\d{5,30}$/.test(id)&&state.icons[topic]?.id!==id)state.icons[topic]={id};
   }
   // Persist each page before requesting the next offset (which acknowledges it).
   if(changed)await env.NEWS_CACHE.put(key,JSON.stringify(state));
   if(updates.length<100)break;
  }
  const unresolved=Object.values(state.icons).filter(icon=>!icon.emoji).map(icon=>icon.id);
  if(unresolved.length){
   const stickers=await call('getCustomEmojiStickers',{custom_emoji_ids:[...new Set(unresolved)]});
   for(const sticker of stickers||[])for(const icon of Object.values(state.icons))if(icon.id===sticker.custom_emoji_id&&typeof sticker.emoji==='string')icon.emoji=sticker.emoji;
   await env.NEWS_CACHE.put(key,JSON.stringify(state));
  }
  return {status:'ok',icons:validIcons(state.icons)};
 }catch{
  return {status:'unavailable',...(Object.keys(state.icons||{}).length?{icons:validIcons(state.icons)}:{})};
 }
}
