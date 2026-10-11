import Store from "@/components/store";
import {initialize,products,orders} from "@/lib/db";
import {shopSettings} from "@/lib/shop-settings";
import type {Lang} from "@/lib/types";
export async function renderStore(page="home",locale:Lang="uz",productId="",query:Record<string,string>={}){let error="";try{await initialize();}catch(e){error=e instanceof Error?e.message:"API xatosi";}const ranking:Record<string,number>={};for(const o of (await orders()).filter(o=>o.status==="completed"))for(const i of o.items)ranking[i.productId]=(ranking[i.productId]||0)+i.quantity;return <Store initial={await products()} initialError={error} page={page} locale={locale} productId={productId} initialQuery={query} shop={await shopSettings()} ranking={ranking}/>;}
