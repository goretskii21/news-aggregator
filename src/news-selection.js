// Shared source selection for production collection and queue review.
import {editorialExclusion} from './editorial-policy.js';
export const topics = {
  critical: '🚨 Critical / Security', ai: '🤖 AI', git: '🦊 GitLab / GitHub',
  containers: '🐳 Docker / Kubernetes', cloud: '☁️ Cloud', microsoft: '🪟 Microsoft',
  linux: '🐧 Linux / Networking', apple: '🍎 Apple', games: '🎮 Games'
};
const rules = {
  ai: /\b(?:OpenAI|ChatGPT|Claude|Anthropic|Gemini|DeepMind|Hugging Face|Copilot|LLM|GPT[- ]?\d|AI)\b|нейросет|искусственн.{0,12}интеллект/iu,
  git: /\b(?:GitHub|GitLab|CI\/CD|Actions runner|Git for Windows)\b/iu,
  containers: /\b(?:Docker|Swarm|Kubernetes|K8s|containerd|runc|Helm|BuildKit|Compose|CNCF)\b|контейнер/iu,
  cloud: /\b(?:AWS|Amazon Web Services|Cloudflare|Hetzner|EC2|S3|Route 53)\b/iu,
  microsoft: /\b(?:Microsoft|Entra|Azure|M365|Microsoft 365|Office 365|Exchange|Intune|Windows)\b/iu,
  linux: /\b(?:Linux|Ubuntu|Ansible|systemd|OpenWrt|BIND|DNS|DHCP|TCP|OpenSSH|kernel|networking|CRIU|KDE|Plasma|GNOME|Wayland|Debian|Fedora)\b|линукс|убунту|ядр.{0,8}Linux|сетев/iu,
  apple: /\b(?:Apple|macOS|iOS|iPadOS|MacBook|iPhone|iPad|Apple Silicon)\b/iu,
  games: /\b(?:Diablo|AION|Warcraft|WoW|Steam|Xbox|PlayStation|Nintendo|game|gaming|GTA)\b|игр|гейм|диабло|варкрафт/iu
};
const noise = /\b(?:coupon|discount|deals?|giveaway|sponsored|webinar|register now|customer story|cosplay|cheats?|podcast|verdict|lawsuit|lifetime subscription|IPO|investors?|preorders?)\b|[$£€]\s*\d|скидк|промокод|косплей|чит[ыа]|розыгрыш|вебинар|инвестор|привлечь.*млрд|приобрела.*актив/iu;
const preview = /\b(?:alpha|beta|release candidates?|RC\d*s?|pre-release|preview|linux-next|next-\d+|may soon|reportedly|rumou?rs?)\b|бета|слух|утечк/iu;
const stack = /\b(?:Docker|Swarm|Moby|containerd|runc|Ansible|ansible-core|Ubuntu|Linux kernel)\b/iu;
const security = /CVE-\d{4}-\d+|\b(?:vulnerabilit|security|exploit|RCE|privilege escalation|container escape)\w*|уязвим|эксплуатац|повышени.{0,10}привилег|выход.{0,12}контейнер/iu;
const cves = s => [...new Set(s.match(/CVE-\d{4}-\d+/gi) || [])].map(s=>s.toUpperCase()).sort();

export function canonicalUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported URL scheme');
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) if (/^(?:utm_.+|fbclid|gclid|yclid)$/i.test(key)) url.searchParams.delete(key);
  return url.toString();
}

export function selectNews(items, sources, { now = Date.now(), hours = 48 } = {}) {
  const groups = Object.fromEntries(Object.keys(topics).map(k=>[k, []]));
  const rejected = []; const securityReview = []; const seenUrls = new Set(); const seenTitles = new Set(); const seenEvents = new Set();
  const ordered = [...items].sort((a,b)=>Number(sources.get(b.source)?.role==='official')-Number(sources.get(a.source)?.role==='official') || Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
  for (const item of ordered) {
    const source = sources.get(item.source);
    const reject = reason => rejected.push({source:item.source,title:item.title,url:item.url,reason});
    const date = Date.parse(item.publishedAt);
    if (!Number.isFinite(date)) { reject('missing-date'); continue; }
    if (date > now + 15 * 60000) { reject('future-date'); continue; }
    if (date < now - hours * 3600000) { reject('outside-window'); continue; }
    let url; try { url = canonicalUrl(item.url); } catch { reject('invalid-url'); continue; }
    // Bare version titles are common in Atom release feeds; attach the project name.
    let title = /^v?\d[\w.\-+ ]*$/i.test(item.title) ? `${item.source}: ${item.title}` : item.title;
    const releaseRepo=new URL(url).hostname==='github.com'?new URL(url).pathname.match(/^\/[^/]+\/([^/]+)\/releases\/tag\//)?.[1]:null;
    if(releaseRepo && /^(?:v?\d[\w.\-+ ]*|Release\s+\d[\w.\-+ ]*)$/i.test(item.title))title=`${releaseRepo}: ${item.title}`;
    const titleKey = title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
    if (seenUrls.has(url) || seenTitles.has(titleKey)) { reject('duplicate-url-or-title'); continue; }
    const text = `${title} ${item.excerpt}`;
    const editorialReason=editorialExclusion({...item,title});
    if(editorialReason){reject(editorialReason);continue;}
    if (noise.test(title) || /конференц|conference|styling outfits|where to find|what.s coming|chief discusses|bug fixes and reliability improvements/iu.test(title)) { reject('noise'); continue; }
    if ((preview.test(title) || /может выйти|готовится выпустить/iu.test(title)) && !item.knownExploited) { reject('prerelease-or-rumor'); continue; }
    if (/Status$/.test(item.source) && /maintenance|scheduled|планов/i.test(text) && /no.{0,30}(?:impact|expect)|do not expect|without.{0,20}impact|не ожида/i.test(text)) { reject('maintenance-without-impact'); continue; }
    if (/Status$/.test(item.source) && /maintenance|scheduled|планов/i.test(title)) { reject('planned-maintenance-review'); continue; }
    if (/\/(?:hardware|tech-and-hardware|deals|movies|tv)\//i.test(url) && source?.categories.includes('games')) { reject('games-hardware-or-deals'); continue; }
    if (source?.categories.includes('apple') && /accessories|power banks?|chargers?|MagSafe Monday|delivery dates|orders to two|fonts/iu.test(title)) { reject('apple-shopping-or-tips'); continue; }
    if (/Amazon Connect/i.test(title)) { reject('outside-cloud-infrastructure-focus'); continue; }
    if (source?.name==='Comss' && /ViVeTool|контекстное меню|обои|wallpaper|как включить/iu.test(title)) { reject('consumer-tweak'); continue; }
    if (source?.categories.includes('apple') && /вердикт|не понимает|doesn't understand|won record|asks for more/iu.test(title)) { reject('opinion-or-litigation'); continue; }
    const candidates = source?.categories || item.categories || [];
    const stackMatch = stack.test(text) || (source?.name==='Ubuntu Security Notices' && /Ubuntu\s+(?:22\.04|24\.04|26\.04)/i.test(text));
    if (stackMatch && security.test(text)) {
      if (item.knownExploited === true) {
        groups.critical.push({...item,title,url,topic:'critical',reason:'Relevant product in CISA KEV',cves:cves(text)});
        seenUrls.add(url);seenTitles.add(titleKey);continue;
      }
      securityReview.push({...item,title,url,cves:cves(text),reason:'Needs vendor impact, affected-version and exploitation review; not an automatic alert'});
    }
    const ordinary = candidates.filter(c=>c!=='critical');
    // Broad feeds must match the headline, not a passing mention in the excerpt.
    const hits = ordinary.filter(c=>rules[c]?.test(ordinary.length>1?title:text));
    // Product-specific sources can contain titles without the product name.
    const topic = hits[0] || (ordinary.length===1 ? ordinary[0] : null);
    if (!topic) { reject('no-topic-match'); continue; }
    if (topic==='apple' && !/macOS|iOS|iPadOS|MacBook|Apple Silicon|Mac mini|Mac Studio|Mac Pro|Apple Intelligence|Xcode|Safari|WebKit|\bM\d\b/iu.test(title)) { reject('outside-apple-focus'); continue; }
    if (topic==='ai' && /хакер.*ИИ|army.{0,30}AI|AI.{0,30}army/iu.test(title)) { reject('off-topic-ai-mention'); continue; }
    // Security-only feeds should not flood regular digests with every package notice.
    if (source?.name==='Ubuntu Security Notices' || source?.name==='Docker Security') { reject('security-review-only'); continue; }
    const event = /world.of.warcraft.{0,4}forever/i.test(title) && /стресс|stress/i.test(title) && /отлож|перен|postpon|delay/i.test(title) ? 'wow-forever-stress-test-delay' : null;
    if(event && seenEvents.has(event)){reject('duplicate-event');continue;}
    if(event)seenEvents.add(event);
    groups[topic].push({...item,title,url,topic,role:source?.role||item.role,reason:hits.length?'topic-keyword':'specialist-source'});
    seenUrls.add(url);seenTitles.add(titleKey);
  }
  for (const [topic, list] of Object.entries(groups)) list.sort((a,b)=>{
    const authority=Number(b.role==='official')-Number(a.role==='official');
    if(authority)return authority;
    if(topic==='games'){
      const fav=x=>!/(?:warcraft|wow|варкрафт).{0,8}forever/iu.test(x.title) && /diablo|aion|warcraft|\bwow\b|диабло|варкрафт/iu.test(x.title+' '+x.excerpt);
      const delta=Number(fav(b))-Number(fav(a));if(delta)return delta;
    }
    return Date.parse(b.publishedAt)-Date.parse(a.publishedAt);
  });
  return {groups,rejected,securityReview};
}
