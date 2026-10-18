import type {Metadata} from "next";
import type {Lang,Product} from "./types";
import {productText,dictionaries} from "./i18n";
import {siteCopy,infoContent} from "./site-content";

export const siteOrigin="https://www.uzer7.uz";
export const languages:Lang[]=["uz","ru","en"];
export const publicPages=["home","products","about","contact","stores","delivery","returns","faq","lookbook","press","privacy","terms","information","offer","payment"];
export const privatePages=["sign-in","sign-up","profile","saved-products","checkout"];
export function pageUrl(page="home",lang:Lang="uz",id=""){
  return `${siteOrigin}/${lang}${page==="home"?"":"/"+page}${id?"/"+encodeURIComponent(id):""}`;
}
export function alternates(page:string,id=""){
  return {...Object.fromEntries(languages.map(lang=>[lang,pageUrl(page,lang,id)])),"x-default":pageUrl(page,"uz",id)};
}
const descriptions:Record<Lang,string>={
  uz:"UZER7 — Toshkentdagi kiyim va aksessuarlar do‘koni. Hudi, futbolka, kepka va sumkalarni ko‘ring, narx va razmerlarni tanlab buyurtma bering.",
  ru:"UZER7 — магазин одежды и аксессуаров в Ташкенте. Худи, футболки, кепки и сумки: выбирайте модели, размеры и оформляйте заказ онлайн.",
  en:"UZER7 clothing and accessories store in Tashkent. Browse hoodies, T-shirts, caps and bags, compare prices and sizes, and place your order online."
};
const homeTitles:Record<Lang,string>={uz:"UZER7 — Toshkentda kiyim va aksessuarlar",ru:"UZER7 — одежда и аксессуары в Ташкенте",en:"UZER7 — Clothing & accessories in Tashkent"};
export function pageMetadata(page="home",lang:Lang="uz",product?:Product):Metadata{
  const c=siteCopy[lang],t=dictionaries[lang];
  const labels:Record<string,string>={products:t.collection,about:c.about,contact:c.contact,stores:c.ourStore,delivery:c.delivery,returns:c.returns,faq:c.faq,lookbook:c.lookbook,press:c.press,privacy:c.privacy,terms:c.terms,information:c.information,offer:c.offer,payment:c.payment,"sign-in":c.signIn,"sign-up":c.signUp,profile:c.account,"saved-products":t.favorites,checkout:t.checkout};
  const text=product?productText(product,lang):undefined;
  const title=text?`${text.title} | UZER7`:page==="home"?homeTitles[lang]:`${labels[page]||c.information} | UZER7`;
  const info=infoContent(page,lang);
  const description=(text?.desc||info?.intro||descriptions[lang]).replace(/\s+/g," ").trim().slice(0,180);
  const url=pageUrl(page,lang,product?.id);
  const images=product?.images.filter(Boolean).map(src=>new URL(src,siteOrigin).href);
  return {title,description,alternates:{canonical:url,languages:alternates(page,product?.id)},robots:{index:!privatePages.includes(page),follow:true},openGraph:{type:"website",siteName:"UZER7",title,description,url,locale:{uz:"uz_UZ",ru:"ru_RU",en:"en_US"}[lang],...(images?.length?{images}: {})},twitter:{card:images?.length?"summary_large_image":"summary",title,description,...(images?.length?{images}: {})}};
}
export function jsonLd(value:unknown){return JSON.stringify(value).replace(/</g,"\\u003c");}
