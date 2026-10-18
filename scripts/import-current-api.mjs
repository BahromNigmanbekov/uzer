import assert from "node:assert/strict";
import {existsSync,mkdirSync,writeFileSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import {spawn} from "node:child_process";
import {resolve} from "node:path";
if(existsSync(".env.local"))process.loadEnvFile(".env.local");
const database=resolve("data/uzer.sqlite");const d=new DatabaseSync(database,{readOnly:true});const before=d.prepare("SELECT id,data FROM products").all();const orderCount=d.prepare("SELECT COUNT(*) AS count FROM orders").get().count;d.close();
mkdirSync("artifacts/api-migration",{recursive:true});if(!existsSync("artifacts/api-migration/local-products-before.json"))writeFileSync("artifacts/api-migration/local-products-before.json",JSON.stringify(before,null,2));
const port=3116,base=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,["node_modules/next/dist/bin/next","start","--hostname","127.0.0.1","--port",String(port)],{env:{...process.env,PRODUCT_API_SYNC:"false",DATABASE_PATH:database,VERCEL:"",TURSO_DATABASE_URL:"",TURSO_AUTH_TOKEN:"",STOCK_BOT_TOKEN:"",ORDER_BOT_TOKEN:"",SUPPORT_BOT_TOKEN:""},stdio:["ignore","pipe","pipe"]});let log="";server.stdout.on("data",b=>log+=b);server.stderr.on("data",b=>log+=b);
try{
 for(let i=0;i<100;i++){try{if((await fetch(base+"/api/auth")).ok)break;}catch{}await new Promise(r=>setTimeout(r,150));}
 const auth=await fetch(base+"/api/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:process.env.ADMIN_PASSWORD})});assert.ok(auth.ok,"Local admin auth failed");const cookie=auth.headers.get("set-cookie").split(";")[0];
 const response=await fetch(base+"/api/admin/import",{method:"POST",headers:{Cookie:cookie,"Content-Type":"application/json"},body:JSON.stringify({refresh:true})});const result=await response.json();assert.ok(response.ok,result.error);
 const products=await (await fetch(base+"/api/products")).json();assert.ok(products.length>0);assert.ok(products.some(p=>p.translations.ru?.desc&&p.translations.en?.desc&&p.images.length>=3));
 const check=new DatabaseSync(database,{readOnly:true});assert.equal(check.prepare("SELECT COUNT(*) AS count FROM orders").get().count,orderCount);check.close();
 console.log(JSON.stringify({imported:result.count,activeProducts:products.length,productUrl:"/uz/products/"+products[0].id,orderHistoryPreserved:true}));
 writeFileSync("artifacts/api-migration/local-import.json",JSON.stringify({imported:result.count,activeProducts:products.length,productId:products[0].id,orderHistoryPreserved:true},null,2));
}catch(error){console.error(error);console.error(log);process.exitCode=1;}finally{server.kill();await new Promise(r=>{server.once("exit",r);setTimeout(r,1000);});}
