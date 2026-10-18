import assert from "node:assert/strict";
import {mkdirSync,writeFileSync} from "node:fs";
const endpoint="https://6a4d3ee4e1cf82a4a17e4001.mockapi.io/product/api/v1/todo";
const beforeResponse=await fetch(endpoint);assert.ok(beforeResponse.ok);const before=await beforeResponse.json();
const first=before.find(p=>p.id==="1");assert.ok(first);
const desc={
 uz:"Qora rangdagi “Social Media Killed Romance” yozuvli futbolka. Sodda rang va ifodali yozuv kundalik obrazingizga o‘ziga xos kayfiyat beradi. Oldi, orqasi va modeldagi ko‘rinishlarini galereyada ko‘rib, mos razmerni tanlang. Yetkazib berish va to‘lov tafsilotlari buyurtmadan keyin operator bilan tasdiqlanadi.",
 ru:"Чёрная футболка с надписью «Social Media Killed Romance». Лаконичный цвет и выразительный принт дополняют повседневный образ. Рассмотрите вид спереди, сзади и на модели в галерее, затем выберите подходящий размер. Условия доставки и оплаты оператор подтвердит после оформления заказа.",
 en:"Black T-shirt with the “Social Media Killed Romance” print. A simple colour and an expressive graphic bring character to your everyday look. Explore the front, back and model photos in the gallery, then choose your size. Delivery and payment details are confirmed by our team after you place an order."
};
const translations={...first.translations,uz:{title:"Social Media Killed Romance — qora futbolka",desc:desc.uz},ru:{title:"Чёрная футболка Social Media Killed Romance",desc:desc.ru},en:{title:"Social Media Killed Romance T-Shirt | Black",desc:desc.en}};
mkdirSync("artifacts/api-migration",{recursive:true});writeFileSync("artifacts/api-migration/id-1-before.json",JSON.stringify(first,null,2));
const response=await fetch(endpoint+"/1",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({desc:desc.uz,translations})});assert.ok(response.ok,`PUT failed: ${response.status}`);
const after=await (await fetch(endpoint)).json();const updated=after.find(p=>p.id==="1");assert.equal(updated.desc,desc.uz);
for(const lang of ["uz","ru","en"])assert.equal(updated.translations[lang].desc,desc[lang]);
for(const key of ["img","title","price","category","stock"])assert.deepEqual(updated[key],first[key],`${key} must be preserved`);
assert.deepEqual(after.filter(p=>p.id!=="1"),before.filter(p=>p.id!=="1"),"Other records must be untouched");
writeFileSync("artifacts/api-migration/id-1-after.json",JSON.stringify(updated,null,2));
console.log("Updated and verified only ID 1: Uzbek, Russian and English descriptions; photos, title, price, stock and all other records preserved.");
