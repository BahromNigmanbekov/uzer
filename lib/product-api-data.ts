import type {Product,Fit} from "./types";
export const defaultProductApi="https://6a4d3ee4e1cf82a4a17e4001.mockapi.io/product/api/v1/todo";
export const legacyProductApi="https://68d6bbe4c2a1754b426bbe49.mockapi.io/app/v1/product";
export function productApiUrl(){return (process.env.PRODUCT_API_URL||defaultProductApi).replace(/\/+$/,"");}
export function priceMultiplier(){const n=Number(process.env.PRODUCT_PRICE_MULTIPLIER||1000);if(!Number.isFinite(n)||n<=0)throw new Error("PRODUCT_PRICE_MULTIPLIER musbat son bo‘lsin");return n;}
export function availableFits(p:Product):Fit[]{return p.fits??(["Cap","Bag"].includes(p.category)?[]:["regular","oversize"]);}
export function fitTitle(fit?:Fit){return fit==="regular"?"Regular":fit==="oversize"?"Oversize":"";}
export const fitHeadings={uz:"Bichim",ru:"Крой",en:"Fit"};
export function parseApiProduct(row:Record<string,unknown>,id:string,index:number):Product{
  const title=String(row.title||row.name||"Mahsulot");
  const rawCategory=String(row.category||"Boshqa"),match=(rawCategory+" "+title).toLowerCase();
  const category=/zip.*hood|zip.*hudi/.test(match)?"Zip Hoodie":/hoodie|\bhudi\b/.test(match)?"Hoodie":/polo/.test(match)?"Polo Shirt":/t[- ]?shirts?|tshirts?/.test(match)?"T-Shirt":/\bcap\b/.test(match)?"Cap":/\bbag\b|backpack/.test(match)?"Bag":rawCategory;
  const stock=Math.max(0,Math.floor(Number(row.stock)||0));
  const rawSizes=row.sizes&&typeof row.sizes==="object"&&!Array.isArray(row.sizes)?row.sizes as Record<string,unknown>:null;
  const sizes:Record<string,number>=rawSizes?Object.fromEntries(Object.entries(rawSizes).map(([s,q])=>[s,Math.max(0,Math.floor(Number(q)||0))])):["Cap","Bag"].includes(category)?{"ONE SIZE":stock}:Object.fromEntries(["S","M","L","XL"].map((s,i)=>[s,stock]));
  if(!Object.keys(sizes).length)throw new Error("API razmerlar ro‘yxati bo‘sh");
  const sharedStock=row.sharedStock===true||!rawSizes&&!["Cap","Bag"].includes(category);
  if(sharedStock)for(const size of Object.keys(sizes))sizes[size]=stock;
  const translations:Product["translations"]={};
  const rawTranslations=row.translations&&typeof row.translations==="object"?row.translations as Record<string,unknown>:{};
  for(const lang of ["uz","ru","en"]){const value=rawTranslations[lang];if(value&&typeof value==="object"){const text=value as Record<string,unknown>;translations[lang]={title:String(text.title||title),desc:String(text.desc||text.description||"")};}}
  const photos=row.img??row.images??[];
  const images=(Array.isArray(photos)?photos:[photos]).filter((p):p is string=>typeof p==="string"&&/^https?:\/\//.test(p));
  const fits:Fit[]|undefined=Array.isArray(row.fits)?row.fits.filter((f):f is Fit=>f==="regular"||f==="oversize"):row.fit==="regular"||row.fit==="oversize"?[row.fit]:undefined;
  const price=Number(row.price);if(!Number.isFinite(price)||price<0)throw new Error("API mahsulot narxi noto‘g‘ri");
  const placeholder=!images.length&&/^title\s+\d+$/i.test(title);
  return {id,title:translations.uz?.title||title,desc:translations.uz?.desc||String(row.desc||row.description||""),category,price:price*priceMultiplier(),images,stock:sharedStock?stock:Object.values(sizes).reduce((s,q)=>s+q,0),sharedStock,sizes,position:Number.isFinite(Number(row.position))?Number(row.position):index,active:row.active!==false&&String(row.status).toLowerCase()!=="inactive"&&!placeholder,isNew:row.isNew===true,translations,...(fits?{fits}: {})};
}
export function apiProductPayload(p:Product,origin:string){return {title:p.title,desc:p.desc,img:p.images.map(src=>new URL(src,origin).href),price:p.price/priceMultiplier(),category:p.category,stock:p.stock,sizes:p.sizes,sharedStock:p.sharedStock||false,fits:availableFits(p),translations:p.translations,active:p.active,status:p.active?"active":"inactive",isNew:p.isNew,position:p.position,externalId:p.id};}
