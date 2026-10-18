import "server-only";
import {createHash,randomUUID} from "node:crypto";
import {db,transaction} from "./database";
import type {Product,Order} from "./types";
import initialProducts from "./initial-products.json";
import {productApiUrl,legacyProductApi,parseApiProduct} from "./product-api-data";
export {db,transaction};
export async function products(includeHidden=false):Promise<Product[]>{return (await db().prepare("SELECT data FROM products").all() as unknown as {data:string}[]).map(r=>JSON.parse(r.data)).filter((p:Product)=>includeHidden||p.active).sort((a:Product,b:Product)=>a.position-b.position);}
export async function saveProduct(p:Product){await db().prepare("INSERT INTO products(id,data) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data").run(p.id,JSON.stringify(p));}
export async function saveProducts(items:Product[]){if(items.length)await db().batch(items.map(p=>({sql:"INSERT INTO products(id,data) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",args:[p.id,JSON.stringify(p)]})));}
export async function orders():Promise<Order[]>{return (await db().prepare("SELECT data FROM orders ORDER BY rowid DESC").all() as unknown as {data:string}[]).map(r=>JSON.parse(r.data));}
export async function queue(kind:string,data:unknown){await db().prepare("INSERT INTO outbox(id,kind,data) VALUES(?,?,?)").run(randomUUID(),kind,JSON.stringify(data));}
export async function limited(key:string,max:number,seconds:number){return transaction(async()=>{const now=Date.now();await db().prepare("DELETE FROM limits WHERE expires < ?").run(now);const r=await db().prepare("SELECT count FROM limits WHERE key=?").get(key) as unknown as {count:number}|undefined;if(r&&r.count>=max)return true;await db().prepare("INSERT INTO limits(key,expires,count) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET count=count+1").run(key,now+seconds*1000);return false;});}
let importing:Promise<void>|undefined;
export async function initialize(){if((await products(true)).length||await db().prepare("SELECT key FROM settings WHERE key='imported'").get())return;if(!importing)importing=importProducts(false,true).then(()=>{}).catch(async()=>{await transaction(async()=>{if((await products(true)).length||await db().prepare("SELECT key FROM settings WHERE key='imported'").get())return;await saveProducts(initialProducts as unknown as Product[]);const snapshotPrefix="api-"+createHash("sha256").update(productApiUrl()).digest("hex").slice(0,10)+"-";if(initialProducts.every(p=>p.id.startsWith(snapshotPrefix)))await db().prepare("INSERT OR REPLACE INTO settings(key,value) VALUES('product_api_source',?)").run(productApiUrl());await db().prepare("INSERT OR REPLACE INTO settings(key,value) VALUES('imported','cached-api')").run();});}).finally(()=>{importing=undefined});return importing;}
export async function importProducts(overwrite:boolean,initialOnly=false){
 const endpoint=productApiUrl();const response=await fetch(endpoint,{cache:"no-store",signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error("Mahsulot API javob bermadi: "+response.status);
 const rows=await response.json();if(!Array.isArray(rows))throw new Error("API mahsulotlar ro?yxatini qaytarmadi");
 const sourceKey=createHash("sha256").update(endpoint).digest("hex").slice(0,10);
 return transaction(async()=>{
  if(overwrite&&await db().prepare("SELECT product_id FROM product_api_jobs WHERE endpoint=? LIMIT 1").get(endpoint))throw new Error("Avval Mock API navbatidagi ozgarishlarni yuboring");
  const current=await products(true);if(initialOnly&&(current.length||await db().prepare("SELECT key FROM settings WHERE key='imported'").get()))return 0;
  const source=await db().prepare("SELECT value FROM settings WHERE key='product_api_source'").get();
  const previousSource=source?String(source.value):current.length?legacyProductApi:endpoint;
  const switching=previousSource!==endpoint;
  if(switching&&!rows.length)throw new Error("Yangi API bo?sh. Mavjud katalog saqlandi.");
  const existing=new Set(current.map(p=>p.id));const seen=new Set<string>();const imported:Product[]=[];
  for(const [index,row] of rows.entries()){
   if(!row||typeof row!=="object"||!row.id)throw new Error("API mahsulot ID noto?g?ri");
   const link=await db().prepare("SELECT product_id FROM product_api_links WHERE endpoint=? AND remote_id=?").get(endpoint,String(row.id));
   const id=link?String(link.product_id):endpoint===legacyProductApi?String(row.id):"api-"+sourceKey+"-"+row.id;
   seen.add(id);if(!overwrite&&existing.has(id))continue;
   const p=parseApiProduct(row,id,index);imported.push(p);
   await db().prepare("INSERT INTO product_api_links(product_id,endpoint,remote_id) VALUES(?,?,?) ON CONFLICT(product_id,endpoint) DO UPDATE SET remote_id=excluded.remote_id").run(id,endpoint,String(row.id));
  }
  if(switching)await saveProducts(current.map(p=>seen.has(p.id)?p:{...p,active:false}));
  await saveProducts(imported);
  await db().prepare("INSERT OR REPLACE INTO settings(key,value) VALUES('imported','1')").run();
  await db().prepare("INSERT OR REPLACE INTO settings(key,value) VALUES('product_api_source',?)").run(endpoint);
  return imported.length;
 });
}
