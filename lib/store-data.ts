import "server-only";
import {cache} from "react";
import {initialize,products,orders} from "./db";
import {shopSettings,resolvedShopSettings} from "./shop-settings";
import {storageFailure} from "./storage-status";
import initialProducts from "./initial-products.json";
import type {Product} from "./types";

// Metadata and the page share one read and one availability decision per request.
export const readStoreData=cache(async()=>{
  try{
    await initialize();
    const list=await products(),shop=await shopSettings(),ranking:Record<string,number>={};
    for(const o of (await orders()).filter(o=>o.status==="completed"))for(const i of o.items)ranking[i.productId]=(ranking[i.productId]||0)+i.quantity;
    return {products:list,shop,ranking,available:true};
  }catch(e){
    console.error("UZER_STORAGE",{code:storageFailure(e).code});
    // The saved public catalog is for browsing only. Never advertise cached inventory as live stock.
    const list=(initialProducts as unknown as Product[]).filter(p=>p.active).map(p=>({...p,stock:0,sizes:Object.fromEntries(Object.keys(p.sizes).map(s=>[s,0]))}));
    return {products:list,shop:resolvedShopSettings(),ranking:{},available:false};
  }
});
