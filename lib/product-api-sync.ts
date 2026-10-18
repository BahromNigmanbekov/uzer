import "server-only";
import {randomUUID} from "node:crypto";
import {db,transaction} from "./database";
import {apiProductPayload,productApiUrl} from "./product-api-data";
import type {Product} from "./types";

export async function queueProductSync(p:Product,origin:string,action="upsert"){
  if(process.env.PRODUCT_API_SYNC==="false")return;
  await db().prepare("INSERT INTO product_api_jobs(product_id,endpoint,action,payload,revision,error,attempts,lock_until) VALUES(?,?,?,?,?,'',0,0) ON CONFLICT(product_id) DO UPDATE SET endpoint=excluded.endpoint,action=excluded.action,payload=excluded.payload,revision=excluded.revision,error='',attempts=0").run(p.id,productApiUrl(),action,JSON.stringify(apiProductPayload(p,origin)),randomUUID());
}
export async function queueStockSync(p:Product,origin:string){
  if(process.env.PRODUCT_API_SYNC==="false")return;
  if(await db().prepare("SELECT remote_id FROM product_api_links WHERE product_id=? AND endpoint=?").get(p.id,productApiUrl()))await queueProductSync(p,origin);
}
async function request(url:string,method="GET",payload?:unknown){
  const response=await fetch(url,{method,cache:"no-store",...(payload?{headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}:{}),signal:AbortSignal.timeout(10000)});
  if(method==="DELETE"&&response.status===404)return {};
  if(!response.ok)throw new Error(`Mock API ${response.status}: ${method}`);
  return await response.json();
}
let running=false;
export async function flushProductSync(productId?:string){
  if(running||process.env.PRODUCT_API_SYNC==="false")return;running=true;
  try{
    const jobs=await db().prepare("SELECT * FROM product_api_jobs WHERE lock_until < ?"+(productId?" AND product_id=?":"")+" ORDER BY attempts, rowid LIMIT 10").all(...(productId?[Date.now(),productId]:[Date.now()])) as unknown as {product_id:string;endpoint:string;action:string;payload:string;revision:string}[];
    const deadline=Date.now()+25000;
    for(const job of jobs){
      if(Date.now()>deadline)break;if(productId&&job.product_id!==productId)continue;
      if(job.endpoint!==productApiUrl())continue;
      const claim=await db().prepare("UPDATE product_api_jobs SET lock_until=? WHERE product_id=? AND lock_until < ?").run(Date.now()+120000,job.product_id,Date.now());if(!claim.changes)continue;
      try{
        const payload=JSON.parse(job.payload);
        const link=await db().prepare("SELECT remote_id FROM product_api_links WHERE product_id=? AND endpoint=?").get(job.product_id,job.endpoint);
        let remoteId=link?String(link.remote_id):"";
        if(!remoteId){
          // Recover a POST whose response was lost before its local mapping was saved.
          const rows=await request(job.endpoint);
          if(Array.isArray(rows)){const existing=rows.find(r=>String(r.externalId)===job.product_id);if(existing)remoteId=String(existing.id);}
        }
        if(job.action==="delete"){if(remoteId)await request(job.endpoint+"/"+encodeURIComponent(remoteId),"DELETE");}
        else {
          const result=remoteId?await request(job.endpoint+"/"+encodeURIComponent(remoteId),"PUT",payload):await request(job.endpoint,"POST",payload);
          if(!remoteId)remoteId=String(result.id||"");if(!remoteId)throw new Error("Mock API mahsulot ID qaytarmadi");
          await db().prepare("INSERT INTO product_api_links(product_id,endpoint,remote_id) VALUES(?,?,?) ON CONFLICT(product_id,endpoint) DO UPDATE SET remote_id=excluded.remote_id").run(job.product_id,job.endpoint,remoteId);
        }
        await transaction(async()=>{
          await db().prepare("DELETE FROM product_api_jobs WHERE product_id=? AND revision=?").run(job.product_id,job.revision);
          await db().prepare("UPDATE product_api_jobs SET lock_until=0 WHERE product_id=?").run(job.product_id);
        });
      }catch(error){await db().prepare("UPDATE product_api_jobs SET error=?,attempts=attempts+1,lock_until=0 WHERE product_id=?").run(error instanceof Error?error.message:"API yuborish xatosi",job.product_id);}
    }
  }finally{running=false;}
}
export async function productSyncStatus(){return await db().prepare("SELECT product_id,action,error,attempts FROM product_api_jobs ORDER BY rowid").all();}
