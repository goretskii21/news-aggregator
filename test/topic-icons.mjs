import assert from 'node:assert/strict';
import {syncTopicIcons,iconMessage} from '../src/topic-icons.js';
import {NewsDelivery} from '../src/news-delivery.js';
import {emptyState,enqueue} from '../src/delivery-queue.js';
const values=new Map(),calls=[],cache={get:async k=>values.get(k)||null,put:async(k,v)=>values.set(k,v)};
const env={TG_NEWS_BOT:'fixture',TELEGRAM_GROUP_CHAT_ID:'-100123',NEWS_CACHE:cache};
let updates=[{update_id:1,message:{chat:{id:-100123},message_thread_id:13,forum_topic_edited:{icon_custom_emoji_id:'123456789'}}},{update_id:2,message:{chat:{id:-999},message_thread_id:13,forum_topic_edited:{icon_custom_emoji_id:'999999999'}}},{update_id:3,message:{chat:{id:123},text:'PRIVATE TEXT MUST NOT BE STORED'}}];
const fetcher=async(url,options)=>{const body=JSON.parse(options.body);calls.push({url,body});return Response.json({ok:true,result:url.endsWith('/getUpdates')?updates:[{custom_emoji_id:'123456789',emoji:'🖥️'}]});};
let result=await syncTopicIcons(env,{fetcher});assert.equal(result.status,'ok');assert.deepEqual(result.icons.microsoft,{id:'123456789',emoji:'🖥️'});assert.ok(![...values.values()].join('').includes('PRIVATE TEXT'));assert.equal(JSON.parse([...values.values()][0]).nextOffset,4);
let message=iconMessage('microsoft','🪟 Microsoft (2/2)\n\nNews',result.icons);assert.equal(message.text,'🖥️ Microsoft (2/2)\n\nNews');assert.equal(message.entities[0].length,'🖥️'.length);assert.equal(message.entities[0].offset,0);
updates=[{update_id:4,message:{chat:{id:-100123},message_thread_id:13,forum_topic_edited:{name:'Microsoft renamed'}}}];result=await syncTopicIcons(env,{fetcher});assert.equal(result.icons.microsoft.id,'123456789');assert.equal(calls.filter(c=>c.url.endsWith('getCustomEmojiStickers')).length,1);assert.equal(calls[2].body.offset,4);
result=await syncTopicIcons(env,{fetcher:async()=>{throw new Error('secret token');}});assert.equal(result.status,'unavailable');assert.equal(result.icons.microsoft.id,'123456789');assert.ok(!JSON.stringify(result).includes('secret'));
updates=[{update_id:5,message:{chat:{id:-100123},message_thread_id:13,forum_topic_edited:{icon_custom_emoji_id:''}}}];result=await syncTopicIcons(env,{fetcher});assert.deepEqual(result.icons,{});assert.deepEqual(iconMessage('microsoft','🪟 Microsoft',result.icons),{text:'🪟 Microsoft'});
let requests=0;const failingCache={get:async()=>null,put:async()=>{throw new Error('storage error');}};await syncTopicIcons({...env,NEWS_CACHE:failingCache},{fetcher:async()=>{requests++;return Response.json({ok:true,result:Array.from({length:100},(_,update_id)=>({update_id}))});}});assert.equal(requests,1,'never acknowledge the next page before saving cursor');
console.log('Topic icons: updates, chat isolation, UTF-16 entities, rename/removal, cursor durability, cache recovery and private-message exclusion passed.');

const originalFetch=globalThis.fetch,originalNow=Date.now;let payload;
try{
 const now=Date.parse('2026-10-20T15:00:00Z');Date.now=()=>now;
 globalThis.fetch=async(_,options)=>{payload=JSON.parse(options.body);return Response.json({ok:true,result:{message_id:1}});};
 const data=new Map(),storage={get:async k=>structuredClone(data.get(k)),put:async(k,v)=>data.set(k,structuredClone(v)),delete:async k=>data.delete(k),transaction:async fn=>fn(storage),setAlarm:async()=>{},deleteAlarm:async()=>{}};
 let object=new NewsDelivery({storage},{TELEGRAM_DELIVERY_ENABLED:'false',TG_NEWS_BOT:'fixture',TELEGRAM_GROUP_CHAT_ID:'-100123'});
 const state=emptyState();state.selectionVersion=4;await object.save(state);
 await object.fetch(new Request('https://internal/',{method:'POST',headers:{'X-Topic-Icons':encodeURIComponent(JSON.stringify({microsoft:{id:'123456789',emoji:'🖥️'}}))},body:JSON.stringify({microsoft:[{title:'Entra update',source:'Microsoft',url:'https://example.com/entra'}]})}));
 object=new NewsDelivery({storage},{...object.env,TELEGRAM_DELIVERY_ENABLED:'true'});await object.alarm();
 assert.equal(payload.entities[0].custom_emoji_id,'123456789');assert.equal(payload.entities[0].length,'🖥️'.length);assert.ok(payload.text.startsWith('🖥️ Microsoft'));assert.equal((await object.load()).sent,1);assert.equal(payload.entities.find(e=>e.type==='text_link').url,'https://example.com/entra');assert.ok(payload.text.includes('Читать далее...'));assert.ok(!payload.text.includes('https://example.com/entra'));
}finally{globalThis.fetch=originalFetch;Date.now=originalNow;}

const linked=iconMessage('git','🦊 GitLab / GitHub\n\n1. Новость 👩‍💻 <literal>\nИсточник\nhttps://example.com/a?x=1&y=2\n\n\n2. Next\nSource\nhttps://example.com/b',{git:{id:'123456789',emoji:'👩‍💻'}});
assert.ok(!linked.text.includes('https://'));assert.ok(linked.text.includes('<literal>'));const links=linked.entities.filter(e=>e.type==='text_link');assert.equal(links.length,2);
for(const link of links)assert.equal(linked.text.slice(link.offset,link.offset+link.length),'Читать далее...');
assert.equal(links[0].url,'https://example.com/a?x=1&y=2');assert.equal(linked.entities[0].length,'👩‍💻'.length);assert.ok(linked.text.includes('Читать далее...\n\n\n2.'));
const plainLinks=iconMessage('ai','🤖 AI\n\nhttps://example.com/plain',{});assert.equal(plainLinks.entities[0].type,'text_link');assert.equal(plainLinks.text.slice(plainLinks.entities[0].offset),'Читать далее...');
