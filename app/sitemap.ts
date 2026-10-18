import type {MetadataRoute} from "next";
import {readStoreData} from "@/lib/store-data";
import {languages,publicPages,pageUrl,alternates} from "@/lib/seo";
export const dynamic="force-dynamic";
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const {products}=await readStoreData();
  const pages=publicPages.map(page=>({page,id:""})).concat(products.map(p=>({page:"products",id:p.id})));
  return pages.flatMap(({page,id})=>languages.map(lang=>({url:pageUrl(page,lang,id),alternates:{languages:alternates(page,id)}})));
}
