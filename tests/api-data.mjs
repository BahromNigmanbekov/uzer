import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {stripTypeScriptTypes} from "node:module";
import vm from "node:vm";
function load(file){const source=stripTypeScriptTypes(readFileSync(file,"utf8"));const names=[...source.matchAll(/export (?:const|function) (\w+)/g)].map(m=>m[1]);return vm.runInNewContext(`(()=>{${source.replace(/export (?=const|function)/g,"")}\nreturn {${names.join(",")}}})()`,{process:{env:{}},URL});}
const api=load("lib/product-api-data.ts");
const product=api.parseApiProduct({id:"1",title:"Black T-Shirt",price:240,category:"Black T-shirts",stock:70,img:["https://example.com/front.jpg","https://example.com/back.jpg"],translations:{uz:{title:"Qora futbolka",desc:"O‘zbekcha"},ru:{title:"Футболка",desc:"Русский"},en:{title:"T-Shirt",desc:"English"}}},"source-1",0);
assert.equal(product.category,"T-Shirt");assert.equal(product.stock,70);assert.equal(product.sharedStock,true);assert.ok(Object.values(product.sizes).every(q=>q===70));assert.equal(product.price,240000);assert.equal(product.images.length,2);assert.equal(product.translations.ru.desc,"Русский");
assert.deepEqual(Array.from(api.availableFits(product)),["regular","oversize"]);
const payload=api.apiProductPayload(product,"https://www.uzer7.uz");assert.equal(payload.price,240);assert.equal(payload.img.length,2);assert.equal(payload.translations.en.desc,"English");
assert.equal(api.parseApiProduct({title:"title 2",price:85,category:"category 2",stock:95,img:[]},"source-2",1).active,false);
assert.throws(()=>api.parseApiProduct({title:"Bad",price:"invalid"},"bad",0));
const {telegramTextChunks}=load("lib/telegram-text.ts");const long=Array.from({length:50},(_,i)=>`Item ${i}: ${"description ".repeat(25)}`).join("\n");const chunks=telegramTextChunks(long);assert.ok(chunks.length>1&&chunks.every(c=>c.length<=3500));assert.equal(chunks.join("\n"),long);
console.log("PASS: API stock, translations, image arrays, fit defaults, currency roundtrip and long Telegram text chunks");
