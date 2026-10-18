import type {Lang,Product} from "./types";

export const colorNames:Record<string,[string,string,string,string]>={
  taupe:["Kulrang-jigarrang","Тауп","Taupe","#b29a7e"],
  black:["Qora","Чёрный","Black","#161616"],navy:["To‘q ko‘k","Тёмно-синий","Navy","#182b45"],
  charcoal:["To‘q kulrang","Тёмно-серый","Charcoal","#424242"],choco:["Shokolad","Шоколадный","Chocolate","#59463d"],
  brown:["Jigarrang","Коричневый","Brown","#806557"],green:["Yashil","Зелёный","Green","#687765"],
  khaki:["Xaki","Хаки","Khaki","#858064"],grey:["Kulrang","Серый","Grey","#999b9e"],
  blue:["Ko‘k","Синий","Blue","#7797ba"],red:["Qizil","Красный","Red","#c53741"],
  violet:["Binafsha","Фиолетовый","Violet","#b29bd2"],pink:["Pushti","Розовый","Pink","#d2a6ad"],
  sage:["Och yashil","Светло-зелёный","Sage green","#b5c1af"],iceblue:["Och ko‘k","Голубой","Ice blue","#c4dce4"],
  beige:["Bej","Бежевый","Beige","#e9e2cf"],white:["Oq","Белый","White","#f5f5f5"]
};
// These catalog images have no color in their titles (or an ambiguous grey label).
// Keep the mapping tied to the actual photo, rather than assigning colors by ID.
const photoColors:Record<string,string>={
  "https://i.ibb.co/fGSFHKy9/photo-2025-08-08-00-01-44-2.jpg":"iceblue",
  "https://i.ibb.co/20ZZVZFH/photo-2025-08-08-00-01-44-3.jpg":"sage",
  "https://i.ibb.co/Kpsp0GsT/photo-2025-08-08-00-01-44.jpg":"pink",
  "https://i.ibb.co/svKTfqdc/photo-2025-08-08-00-01-47.jpg":"beige",
  "https://i.ibb.co/vx9NSv1X/photo-2025-08-08-00-01-53.jpg":"white",
  "https://i.ibb.co/CpcD3V0X/photo-2025-08-05-14-57-39-2.jpg":"charcoal"
};
const colorPattern=/\b(?:ice blue|sage green|heather grey|heather gray|grey heather|gray heather|charcoal|black|white|navy|blue|pink|green|brown|choco|khaki|violet|red|beige|grey|gray|taupe)\b/gi;
export function colorOf(p:Product){
  const n=(p.title+" "+(p.translations.en?.title||"")).toLowerCase();
  const photo=photoColors[p.images[0]];if(photo)return photo;
  if(/\bice blue\b/.test(n))return "iceblue";
  if(/\bsage green\b/.test(n))return "sage";
  if(/\bgray\b/.test(n))return "grey";
  return Object.keys(colorNames).find(key=>new RegExp(`\\b${key}\\b`).test(n))||"";
}
export function colorLabel(p:Product,lang:Lang){const key=colorOf(p);return key?colorNames[key][lang==="uz"?0:lang==="ru"?1:2]:p.title;}
export function familyKey(p:Product){
  if(!colorOf(p))return "single:"+p.id;
  const title=(p.translations.en?.title||p.title).toLowerCase().replace(colorPattern,"").replace(/\bzip\b/g,"").replace(/\s+/g," ").trim();
  // One imported black polo has an inconsistent category. Use its explicit model name.
  const category=/\bpolo shirt\b/i.test(p.title)?"Polo Shirt":p.category;
  return category.toLowerCase()+":"+title;
}
const darknessOrder=Object.keys(colorNames).filter(c=>c!=="taupe");darknessOrder.splice(darknessOrder.indexOf("beige"),0,"taupe");
export function darkFirst(products:Product[]){return [...products].sort((a,b)=>{
  const aRank=darknessOrder.indexOf(colorOf(a)),bRank=darknessOrder.indexOf(colorOf(b));
  return (aRank<0?99:aRank)-(bRank<0?99:bRank)||a.position-b.position;
});}
export function productVariants(products:Product[],product:Product){return darkFirst(products.filter(p=>p.active&&familyKey(p)===familyKey(product)));}
export function groupedProducts(products:Product[]){
  const groups=new Map<string,Product[]>();
  for(const p of products){const key=familyKey(p);groups.set(key,[...(groups.get(key)||[]),p]);}
  return [...groups.values()].map(group=>group.find(p=>p.category==="Hoodie"&&p.images.includes("https://i.ibb.co/xqcggjbz/photo-2025-08-05-04-11-48-2.jpg"))||darkFirst(group)[0]);
}
