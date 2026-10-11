export const maxDuration=60;
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {renderStore} from "@/lib/store-page";
import {products,initialize} from "@/lib/db";
import type {Lang} from "@/lib/types";
export const dynamic="force-dynamic";
const pages=["products","about","contact","delivery","returns","faq","lookbook","press","privacy","terms","information","offer","payment","sign-in","sign-up","profile","saved-products","checkout","stores"];
type Props={params:Promise<{segments:string[]}>;searchParams:Promise<Record<string,string|string[]|undefined>>};
function parse(segments:string[]){const copy=[...segments];const locale:Lang=["uz","ru","en"].includes(copy[0])?copy.shift() as Lang:"uz";return {locale,page:copy[0]||"home",id:copy[1]||"",extra:copy.length>2};}
export async function generateMetadata({params}:Props):Promise<Metadata>{const {segments}=await params;const {page,id}=parse(segments);let title=page==="home"?"O‘z uslubing. O‘z hikoyang.":page;if(id){await initialize();title=(await products()).find(p=>p.id===id)?.title||title;}return {title:title+" | UZER"};}
export default async function Page({params,searchParams}:Props){const {segments}=await params;const {locale,page,id,extra}=parse(segments);if(extra||page!=="home"&&!pages.includes(page)||id&&page!=="products")notFound();if(id){await initialize();if(!(await products()).some(p=>p.id===id))notFound();}const search=await searchParams;const query=Object.fromEntries(Object.entries(search).map(([k,v])=>[k,Array.isArray(v)?v[0]:v||""]));return renderStore(id?"product":page,locale,id,query);}
