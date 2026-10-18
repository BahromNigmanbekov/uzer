import Store from "@/components/store";
import {readStoreData} from "@/lib/store-data";
import {unavailableMessage} from "@/lib/storage-status";
import type {Lang} from "@/lib/types";
import {siteOrigin,pageUrl,jsonLd} from "@/lib/seo";
import {productText} from "@/lib/i18n";
import {siteCopy} from "@/lib/site-content";
export async function renderStore(page="home",locale:Lang="uz",productId="",query:Record<string,string>={}){
  const data=await readStoreData();
  const product=data.products.find(p=>p.id===productId);
  const organization={"@type":"Organization","@id":siteOrigin+"/#organization",name:"UZER7",url:siteOrigin,telephone:data.shop.phone||undefined,address:data.shop.address||undefined,sameAs:[data.shop.instagram,data.shop.telegram,data.shop.tiktok].filter(Boolean)};
  const graph:unknown[]=page==="home"?[organization,{"@type":"WebSite","@id":siteOrigin+"/#website",name:"UZER7",url:siteOrigin,inLanguage:["uz","ru","en"],publisher:{"@id":siteOrigin+"/#organization"}}]:[];
  if(product){
    const text=productText(product,locale),url=pageUrl("products",locale,product.id);
    graph.push({"@type":"Product",name:text.title,description:text.desc||undefined,sku:product.id,category:product.category,image:product.images.map(src=>new URL(src,siteOrigin).href),url,...(data.available?{offers:{"@type":"Offer",url,price:product.price,priceCurrency:"UZS",availability:product.stock>0?"https://schema.org/InStock":"https://schema.org/OutOfStock",seller:{"@type":"Organization",name:"UZER7",url:siteOrigin}}}: {})});
    graph.push({"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:siteCopy[locale].home,item:pageUrl("home",locale)},{"@type":"ListItem",position:2,name:siteCopy[locale].collection,item:pageUrl("products",locale)},{"@type":"ListItem",position:3,name:text.title,item:url}]});
  }
  return <>{graph.length>0&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd({"@context":"https://schema.org","@graph":graph})}}/>}<Store initial={data.products} initialError={data.available?"":unavailableMessage(locale)} storageAvailable={data.available} page={page} locale={locale} productId={productId} initialQuery={query} shop={data.shop} ranking={data.ranking}/></>;
}
