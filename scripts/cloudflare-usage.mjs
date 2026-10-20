// Read-only account analytics. Tokens stay in memory and are never printed.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {homedir} from 'node:os';
const arg=name=>{const i=process.argv.indexOf(name);return i<0?undefined:process.argv[i+1];};
const account=arg('--account')||process.env.CLOUDFLARE_ACCOUNT_ID;
if(!/^[a-f0-9]{32}$/i.test(account||''))throw new Error('Pass --account ACCOUNT_ID');
let token=process.env.CLOUDFLARE_API_TOKEN;
if(!token){const path=process.env.APPDATA?join(process.env.APPDATA,'xdg.config/.wrangler/config/default.toml'):join(homedir(),'.config/.wrangler/config/default.toml');token=(await readFile(path,'utf8')).match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];}
if(!token)throw new Error('Cloudflare authentication unavailable');
const end=new Date(),start=arg('--start')||new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth(),1)).toISOString();
if(!Number.isFinite(Date.parse(start)))throw new Error('Invalid start date');
const filter=`datetime_geq:${JSON.stringify(start)},datetime_leq:${JSON.stringify(end.toISOString())}`;
const query=`{viewer{accounts(filter:{accountTag:"${account}"}){
 workersInvocationsAdaptive(limit:1000,filter:{${filter}}){dimensions{scriptName}sum{requests errors subrequests cpuTimeUs}quantiles{cpuTimeP50 cpuTimeP99}}
 durableObjectsInvocationsAdaptiveGroups(limit:1000,filter:{${filter}}){sum{requests errors}}
 durableObjectsPeriodicGroups(limit:1000,filter:{${filter}}){sum{duration cpuTime rowsRead rowsWritten}}
 durableObjectsStorageGroups(limit:1000,filter:{${filter}}){max{storedBytes}}
 kvOperationsAdaptiveGroups(limit:1000,filter:{${filter}}){dimensions{actionType}sum{requests}}
 kvStorageAdaptiveGroups(limit:1000,filter:{${filter}}){max{byteCount keyCount}}
}}}`;
const response=await fetch('https://api.cloudflare.com/client/v4/graphql',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({query}),signal:AbortSignal.timeout(30000)});
const data=await response.json();if(!response.ok||data.errors?.length)throw new Error('Cloudflare analytics failed: '+JSON.stringify(data.errors?.map(e=>e.message)||response.status));
const report={checkedAt:end.toISOString(),start,end:end.toISOString(),scope:'Entire account; analytics, not a billing invoice. Default start is calendar month, verify billing-period start separately.',analytics:data.data.viewer.accounts[0]};
const out=arg('--out');if(out){await mkdir(dirname(out),{recursive:true});await writeFile(out,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report,null,2));
