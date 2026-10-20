import assert from 'node:assert/strict';
import {canonicalUrl,selectNews} from '../src/news-selection.js';
const now=Date.parse('2026-10-20T12:00:00Z');
const sources=new Map([
 ['Habr',{name:'Habr',role:'editorial',categories:['ai','git','containers','cloud','microsoft','linux']}],
 ['Docker',{name:'Docker',role:'official',categories:['containers']}],
 ['Games',{name:'Games',role:'editorial',categories:['games']}]
]);
const base={source:'Habr',publishedAt:'2026-10-20T10:00:00Z',excerpt:'',url:'https://example.com/1',title:'GitLab CI/CD update'};
const run=items=>selectNews(items,sources,{now});
assert.equal(canonicalUrl('https://example.com/a?utm_source=x&v=2#abc'),'https://example.com/a?v=2');
assert.throws(()=>canonicalUrl('javascript:alert(1)'));
assert.equal(run([base]).groups.git.length,1);
assert.equal(run([{...base,title:'A chair for your office'}]).groups.ai.length,0);
assert.equal(run([{...base,publishedAt:'2026-10-21T10:00:00Z'}]).rejected[0].reason,'future-date');
assert.equal(run([{...base,publishedAt:''}]).rejected[0].reason,'missing-date');
assert.equal(run([base,{...base,url:base.url+'?utm_source=x'}]).groups.git.length,1);
const vuln={...base,title:'Docker CVE-2026-12345 container escape'};
assert.equal(run([vuln]).groups.critical.length,0);
assert.equal(run([vuln]).securityReview.length,1);
assert.equal(run([{...vuln,knownExploited:true}]).groups.critical.length,1);
assert.equal(run([{...base,source:'Docker',title:'v29.0.1'}]).groups.containers[0].title,'Docker: v29.0.1');
assert.equal(run([{...base,title:'GitLab webinar register now'}]).rejected[0].reason,'noise');
assert.equal(run([{...base,title:'Kubernetes v2 beta'}]).rejected[0].reason,'prerelease-or-rumor');
assert.equal(run([{...base,title:'Claude может выйти в октябре'}]).rejected[0].reason,'prerelease-or-rumor');
assert.equal(run([{...base,source:'Games',url:'https://example.com/tech-and-hardware/apple',title:'Apple acquisition'}]).rejected[0].reason,'games-hardware-or-deals');
const games=run([{...base,source:'Games',title:'Another game launch'}, {...base,source:'Games',url:'https://example.com/2',title:'Diablo IV update',publishedAt:'2026-10-20T09:00:00Z'}]);
assert.equal(games.groups.games[0].title,'Diablo IV update');
console.log('news selection checks passed');
for(const title of ['В России запустили новое облако AWS','Для россиян ограничили Microsoft 365','Российский Linux получил обновление','Яндекс представил новую AI модель','Yandex introduces a new LLM','VK Cloud launches Kubernetes','Astra Linux update','Sber releases AI assistant','В РФ обновили Microsoft Office']){
 const result=run([{...base,title}]);assert.equal(Object.values(result.groups).flat().length,0,title);assert.match(result.rejected[0].reason,/russian-/);
}
for(const title of ['Docker исправил уязвимость контейнеров','Ubuntu 24.04: обновление Linux kernel','OpenAI представила новую модель','Microsoft обновила Entra','Kubernetes networking update']){
 assert.equal(Object.values(run([{...base,title}]).groups).flat().length,1,title);
}
assert.equal(run([{...vuln,title:'Docker CVE-2026-12345 exploited in Russia',knownExploited:true}]).groups.critical.length,1);
