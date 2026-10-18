import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const dir='artifacts/blackstop-import';mkdirSync(dir,{recursive:true});
const endpoint='https://6a4d3ee4e1cf82a4a17e4001.mockapi.io/product/api/v1/todo';
const source=JSON.parse(readFileSync(dir+'/source-products.json','utf8')).products;
const selection=[
 ['Social Media Killed Romance Tshirt | Red',239,'red'],
 ['Social Media Killed Romance Tshirt | White',239,'white'],
 ['Basic Regular Fit Unisex - Black',159,'black'],
 ['Basic Regular Fit Unisex - White',159,'white'],
 ['Basic Sweatshirt - Navy Blue',329,'navy'],
 ['Red Car Oversized Tshirt',229,'black'],
 ['Basic Oversized Tshirt - Taupe',179,'taupe'],
 ['MJ Vintage Style Tshirt',249,'black'],
 ["I'm Bored Baby Tshirt",239,'white'],
 ['Need Money For Porsche White Oversized T-Shirt',249,'white'],
 ['Emotionally Available R',239,'white'],
 ["I'm So Poor B T-shirt",239,'blue'],
 ['Even A Girl Boss Tshirt',239,'red'],
 ['Your Energy Is Your Currency Oversized T-shirt',249,'white'],
 ["I'm So Poor I Can't Even...B Oversized T-shirt",249,'white'],
 ['Porsche 911 GT3 F&B Black Oversized Tshirt',279,'black'],
 ['Sorry If I Looked Tshirt',239,'white'],
 ['Basic Oversized Tshirt - White',189,'white'],
 ['Unemployed And Beautiful Oversized T-shirt',249,'white'],
 ['Blonde Ferrari Black Oversized Tshirt',279,'black']
];
const colors={red:['qizil','красный','red'],white:['oq','белый','white'],black:['qora','чёрный','black'],blue:['ko‘k','синий','blue'],navy:["to‘q ko‘k",'тёмно-синий','navy blue'],taupe:['taupe — kulrang-jigarrang','тауп — серо-коричневый','taupe']};
function makeProduct([title,price,color],index){
 const p=source.find(p=>p.title===title);assert.ok(p,'Missing exact product: '+title);
 const text=p.body_html.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
 const optionFits=p.options.find(o=>/fit/i.test(o.name))?.values||[];
 const fits=optionFits.length?[...new Set(optionFits.map(v=>/over/i.test(v)?'oversize':'regular'))]:[/oversiz/i.test(title)?'oversize':'regular'];
 const sizesList=p.options.find(o=>/size/i.test(o.name))?.values;assert.ok(sizesList?.length);
 const sizes=Object.fromEntries(sizesList.map(s=>[s,2]));
 const sweat=/sweatshirt/i.test(title),kind=sweat?['svitshot','свитшот','sweatshirt']:['futbolka','футболка','T-shirt'];
 const name=title.replace(/\s*\|\s*(Red|White)$/i,'').replace(/\s*-\s*(Black|White|Taupe)$/i,'');
 const c=colors[color], fit=fits.length===2?['Regular va Oversize','Regular и Oversize','Regular and Oversize']:fits[0]==='oversize'?['Oversize','Oversize','Oversize']:['Regular','Regular','Regular'];
 const gsm=[...text.matchAll(/(\d+)\s*GSM/gi)].map(m=>m[1]);
 const weight=gsm.length>1?['Regular: 180 GSM; Oversize: 220 GSM.','Regular: 180 GSM; Oversize: 220 GSM.','Regular: 180 GSM; Oversize: 220 GSM.']:gsm.length?[`Mato zichligi: ${gsm[0]} GSM.`,`Плотность ткани: ${gsm[0]} GSM.`,`Fabric weight: ${gsm[0]} GSM.`]:['','',''];
 const translations={
  uz:{title:`${name} | ${c[0]}`,desc:`${c[0][0].toUpperCase()+c[0].slice(1)} rangdagi ${kind[0]}, ${fit[0]} bichim. ${/Basic/.test(title)?'Yozuvsiz sodda dizayn turli kundalik obrazlarga mos tushadi.':`“${name.replace(/ Tshirt.*| T-shirt.*| Oversized.*| T-Shirt.*/i,'')}” dizayni kundalik obrazga o‘ziga xos urg‘u beradi.`} Manbada 100% taralgan paxta ko‘rsatilgan. ${weight[0]} O‘lchamlar: ${sizesList.join(', ')}. Barcha ko‘rinishlarni galereyada ko‘ring.`},
  ru:{title:`${name} | ${c[1]}`,desc:`${kind[1][0].toUpperCase()+kind[1].slice(1)} в цвете «${c[1]}», крой ${fit[1]}. ${/Basic/.test(title)?'Лаконичный дизайн без принта легко сочетать с повседневным гардеробом.':'Выразительный принт добавляет характер повседневному образу.'} В составе на сайте производителя указан 100% гребенной хлопок. ${weight[1]} Размеры: ${sizesList.join(', ')}. Все фотографии доступны в галерее.`},
  en:{title:p.title,desc:`${c[2][0].toUpperCase()+c[2].slice(1)} ${kind[2]} in ${fit[2]} fit. ${/Basic/.test(title)?'A clean, unprinted design for versatile everyday outfits.':'An expressive graphic brings character to an everyday outfit.'} The source lists 100% combed cotton. ${weight[2]} Sizes: ${sizesList.join(', ')}. Explore every view in the photo gallery.`}
 };
 if(!new RegExp('\\b'+color+'\\b','i').test(translations.en.title))translations.en.title+=' | '+c[2];
 const img=[...new Set(p.images.map(i=>i.src))];assert.ok(img.length>=2);
 return {title:p.title,desc:translations.uz.desc,translations,img,price,category:sweat?'Sweatshirt':'T-Shirt',fits,sizes,stock:Object.values(sizes).reduce((a,b)=>a+b,0),sharedStock:false,active:true,status:'active',isNew:true,position:index+1,color,sourceUrl:`https://blackstop.in/products/${p.handle}`,sourceProductId:String(p.id),externalId:'blackstop-'+p.id,sourceVariants:p.variants.map(v=>({title:v.title,available:v.available})),pricing:{currency:'UZS',recommendedRetail:price*1000,kind:'market-informed-estimate',reviewedAt:'2026-10-19',includesVerifiedImportCosts:false}};
}
const products=selection.map(makeProduct);
assert.equal(new Set(products.map(p=>p.externalId)).size,20);
writeFileSync(dir+'/prepared-products.json',JSON.stringify(products,null,2));
const checks=[];
const urls=[...new Set(products.flatMap(p=>p.img))];
let cursor=0;await Promise.all(Array.from({length:6},async()=>{while(cursor<urls.length){const url=urls[cursor++];const r=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(30000)});assert.ok(r.ok&&r.headers.get('content-type')?.startsWith('image/'),'Invalid image: '+url);checks.push({url,status:r.status,type:r.headers.get('content-type')});}}));
writeFileSync(dir+'/image-checks.json',JSON.stringify(checks,null,2));
console.log(`Prepared ${products.length} products, ${urls.length} verified images; two units per size, shared across fits.`);
if(!process.argv.includes('--write'))process.exit(0);
async function getAll(){const r=await fetch(endpoint);assert.ok(r.ok,'Catalog read failed');return r.json();}
const before=await getAll();writeFileSync(dir+'/remote-before.json',JSON.stringify(before,null,2));
const results=[];
for(const p of products){
 const current=await getAll();const existing=current.find(x=>x.externalId===p.externalId||x.sourceUrl===p.sourceUrl||x.title===p.title);
 if(existing){results.push({id:existing.id,title:p.title,action:'preserved-existing'});continue;}
 const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});
 assert.ok(r.ok,`Create failed ${r.status}: ${p.title}`);const saved=await r.json();
 results.push({id:saved.id,title:p.title,action:'created'});writeFileSync(dir+'/import-results.json',JSON.stringify(results,null,2));
}
const after=await getAll();
for(const old of before)assert.deepEqual(after.find(x=>x.id===old.id),old,'Existing record altered: '+old.id);
for(const p of products){const row=after.find(x=>x.externalId===p.externalId);assert.ok(row);for(const key of ['img','translations','sizes','fits','stock','price'])assert.deepEqual(row[key],p[key],p.title+': '+key);}
writeFileSync(dir+'/remote-after.json',JSON.stringify(after,null,2));
writeFileSync(dir+'/import-results.json',JSON.stringify(results,null,2));
console.log(`Verified ${results.length} selected products in Mock API; ${before.length} existing records unchanged.`);
