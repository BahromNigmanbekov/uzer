import fs from 'node:fs';
import {ImageOptimizerCache} from 'next/dist/server/image-optimizer.js';
import sharp from 'sharp';
const href='https://i.ibb.co/m5xvR1Rw/photo-2025-08-05-03-02-21-3.jpg';
let candidates=[];
for(const width of [256,384,640,750,828,1080,1200,1920,2048,3840])for(const mimeType of ['image/webp','image/avif','image/jpeg']){const key=ImageOptimizerCache.getCacheKey({href,width,quality:75,mimeType});const dir='.next/cache/images/'+key;if(fs.existsSync(dir))for(const file of fs.readdirSync(dir))candidates.push({width,path:dir+'/'+file});}
candidates.sort((a,b)=>b.width-a.width);
if(!candidates.length)throw new Error('No existing Pink Cap image cache');
const selected=candidates[0];await sharp(selected.path).resize({width:1200,height:1500,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toFile('public/products/product-2.webp');const manifest=JSON.parse(fs.readFileSync('lib/product-assets.json','utf8'));manifest[href]='/products/product-2.webp';fs.writeFileSync('lib/product-assets.json',JSON.stringify(manifest,null,2));console.log(JSON.stringify({pinkImageRecovered:true,width:selected.width,totalCached:Object.keys(manifest).length}));
