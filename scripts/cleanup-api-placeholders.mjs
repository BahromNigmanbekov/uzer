import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const endpoint='https://6a4d3ee4e1cf82a4a17e4001.mockapi.io/product/api/v1/todo';
async function catalog(){const r=await fetch(endpoint);assert.ok(r.ok);return r.json();}
const before=await catalog();
const empty=before.filter(p=>/^title\s+\d+$/i.test(p.title||'')&&Array.isArray(p.img)&&p.img.length===0&&!p.externalId&&!p.sourceUrl);
const real=before.filter(p=>!empty.some(e=>e.id===p.id));
assert.equal(real.length,21,'Unexpected real product count; stop before deleting');
mkdirSync('artifacts/api-cleanup',{recursive:true});
writeFileSync('artifacts/api-cleanup/before.json',JSON.stringify(before,null,2));
for(const p of empty){const current=await (await fetch(endpoint+'/'+p.id)).json();assert.deepEqual(current,p,'Record changed; stop');const r=await fetch(endpoint+'/'+p.id,{method:'DELETE'});assert.ok(r.ok,'Delete failed '+p.id);}
const after=await catalog();assert.equal(after.length,real.length);for(const p of real)assert.deepEqual(after.find(x=>x.id===p.id),p,'Real product changed');
writeFileSync('artifacts/api-cleanup/after.json',JSON.stringify(after,null,2));
console.log(JSON.stringify({removed:empty.length,remaining:after.length,realProductsUnchanged:true,ids:after.map(p=>p.id)}));
