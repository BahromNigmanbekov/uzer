export const maxDuration=60;
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {renderStore} from "@/lib/store-page";
import {readStoreData} from "@/lib/store-data";
import type {Lang} from "@/lib/types";
import {pageMetadata} from "@/lib/seo";
export const dynamic="force-dynamic";
const pages=["products","about","contact","delivery","returns","faq","lookbook","press","privacy","terms","information","offer","payment","sign-in","sign-up","profile","saved-products","checkout","stores"];
type Props={params:Promise<{segments:string[]}>;searchParams:Promise<Record<string,string|string[]|undefined>>};
function parse(segments:string[]){const copy=[...segments];const locale:Lang=["uz","ru","en"].includes(copy[0])?copy.shift() as Lang:"uz";return {locale,page:copy[0]||"home",id:copy[1]||"",extra:copy.length>2};}
export async function generateMetadata({params}:Props):Promise<Metadata>{const {segments}=await params;const {locale,page,id,extra}=parse(segments);if(extra||page!=="home"&&!pages.includes(page)||id&&page!=="products")notFound();const product=id?(await readStoreData()).products.find(p=>p.id===id):undefined;if(id&&!product)notFound();return pageMetadata(page,locale,product);}
export default async function Page({params,searchParams}:Props){const {segments}=await params;const {locale,page,id,extra}=parse(segments);if(extra||page!=="home"&&!pages.includes(page)||id&&page!=="products")notFound();if(id){if(!(await readStoreData()).products.some(p=>p.id===id))notFound();}const search=await searchParams;const query=Object.fromEntries(Object.entries(search).map(([k,v])=>[k,Array.isArray(v)?v[0]:v||""]));return renderStore(id?"product":page,locale,id,query);}
