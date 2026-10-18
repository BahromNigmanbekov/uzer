import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const p=JSON.parse(readFileSync('artifacts/blackstop-import/prepared-products.json','utf8'));
const b=await chromium.launch({channel:'chrome',headless:true});
try{const page=await b.newPage({viewport:{width:1400,height:1500}});await page.setContent(`<style>body{margin:0;font:12px Arial;display:grid;grid-template-columns:repeat(5,1fr)}article{padding:10px;border:1px solid #ddd}img{width:250px;height:270px;object-fit:contain}p{height:30px}</style>`+p.map(x=>`<article><img src="${x.img[0]}"><p>${x.title}</p></article>`).join(''));await page.waitForFunction(()=>[...document.images].every(i=>i.complete),{timeout:60000});await page.screenshot({path:'artifacts/blackstop-import/contact-sheet.png',fullPage:true});}finally{await b.close();}
