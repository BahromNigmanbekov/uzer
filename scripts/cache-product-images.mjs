import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import sharp from 'sharp';
fs.mkdirSync('public/products',{recursive:true});
const d=new DatabaseSync('data/uzer.sqlite',{readOnly:true});
const rows=d.prepare('SELECT data FROM products').all().map(r=>JSON.parse(r.data));d.close();
const urls=[...new Set(rows.flatMap(p=>p.images))];const assets={};const prior=fs.existsSync('lib/product-assets.json')?JSON.parse(fs.readFileSync('lib/product-assets.json','utf8')):{};let cursor=0;
await Promise.all(Array.from({length:4},async()=>{while(cursor<urls.length){const index=cursor++,url=urls[index];try{const cached=prior[url];const dest=cached?.startsWith('/products/')?'public'+cached:`public/products/${createHash('sha256').update(url).digest('hex').slice(0,20)}.webp`;if(!fs.existsSync(dest)){const r=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw new Error(String(r.status));const data=Buffer.from(await r.arrayBuffer());await sharp(data).rotate().resize({width:1200,height:1500,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toFile(dest);}assets[url]='/'+dest.replace('public/','');console.log(`Image ${index+1}/${urls.length}`);}catch(e){console.log(`Image ${index+1} unavailable: ${e.message}`);}}}));
fs.writeFileSync('lib/product-assets.json',JSON.stringify(assets,null,2));
try{if(fs.existsSync('public/fonts/manrope.ttf')){console.log('Manrope font already cached');}else{const r=await fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/Manrope%5Bwght%5D.ttf',{signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error(String(r.status));fs.writeFileSync('public/fonts/manrope.ttf',Buffer.from(await r.arrayBuffer()));const license=await fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/OFL.txt');if(license.ok)fs.writeFileSync('public/fonts/Manrope-LICENSE.txt',await license.text());console.log('Manrope font saved');}}catch(e){console.log('Font error '+e.message);process.exitCode=1;}
console.log(JSON.stringify({cached:Object.keys(assets).length,total:urls.length}));
