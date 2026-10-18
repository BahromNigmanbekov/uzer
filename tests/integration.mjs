import sharp from "sharp";
import assert from "node:assert/strict";import {spawn} from "node:child_process";import {DatabaseSync} from "node:sqlite";import {mkdirSync,rmSync,readFileSync} from "node:fs";import {resolve} from "node:path";import {randomUUID} from "node:crypto";
const dir=resolve("data","test-"+randomUUID());mkdirSync(dir,{recursive:true});const database=resolve(dir,"test.sqlite");const d=new DatabaseSync(database);d.exec("CREATE TABLE products(id TEXT PRIMARY KEY,data TEXT NOT NULL); CREATE TABLE settings(key TEXT PRIMARY KEY,value TEXT NOT NULL); INSERT INTO settings VALUES('imported','1');");const product={id:"test",title:"Test Shirt",desc:"Test product",price:220000,category:"T-Shirt",images:[],stock:3,sizes:{M:3},position:0,active:true,isNew:false,translations:{}};d.prepare("INSERT INTO products VALUES(?,?)").run(product.id,JSON.stringify(product));d.close();
const port=3107,base="http://127.0.0.1:"+port;const server=spawn(process.execPath,["node_modules/next/dist/bin/next","start","--hostname","127.0.0.1","--port",String(port)],{env:{...process.env,PRODUCT_API_SYNC:"false",TURSO_DATABASE_URL:"",TURSO_AUTH_TOKEN:"",BLOB_READ_WRITE_TOKEN:"",VERCEL:"",DATABASE_PATH:database,UPLOAD_PATH:resolve(dir,"uploads"),ADMIN_PASSWORD:"isolated-test-password",SESSION_SECRET:"isolated-test-session-secret-32-characters",STOCK_BOT_TOKEN:"",ORDER_BOT_TOKEN:"",SUPPORT_BOT_TOKEN:"",NEXT_TELEMETRY_DISABLED:"1"},stdio:["ignore","pipe","pipe"]});let log="";server.stdout.on("data",s=>log+=s);server.stderr.on("data",s=>log+=s);let cookie="",checks=0;
async function call(path,method="GET",body,auth=false){const res=await fetch(base+path,{method,headers:{...(auth?{Cookie:cookie}:{}),...(body instanceof FormData?{}:body?{"Content-Type":"application/json"}:{})},body:body?body instanceof FormData?body:JSON.stringify(body):undefined});const raw=await res.text();let data;try{data=JSON.parse(raw);}catch{data=raw;}return {res,data};}
function check(condition,label){assert.ok(condition,label);checks++;console.log("PASS "+label);}
try{for(let i=0;i<100;i++){try{const r=await fetch(base+"/api/auth");if(r.ok)break;}catch{}if(i===99)throw new Error("Server not ready: "+log);await new Promise(r=>setTimeout(r,300));}
let r=await call("/api/admin/data");check(r.res.status===401,"anonymous admin access rejected");
r=await call("/api/products");check(r.data.length===1&&r.data[0].stock===3,"products returned from persistent database");
r=await call("/api/auth","POST",{password:"wrong"});check(r.res.status===401,"incorrect password rejected");
r=await call("/api/auth","POST",{password:"isolated-test-password"});check(r.res.ok,"admin login");cookie=r.res.headers.get("set-cookie").split(";")[0];check(cookie.includes("HttpOnly")===false&&r.res.headers.get("set-cookie").includes("HttpOnly"),"HttpOnly admin session");
r=await fetch(base+"/api/admin/products",{method:"POST",headers:{Cookie:cookie,Origin:"https://attacker.example","Content-Type":"application/json"},body:JSON.stringify(product)});check(r.status===403,"cross-origin mutation rejected");
const body={requestId:randomUUID(),firstName:"Test",lastName:"Customer",phone:"+998901234567",telegram:"",address:"Test Street 10",items:[{productId:"test",size:"M",quantity:2}],total:1};
r=await call("/api/orders","POST",body);check(r.res.status===201,"checkout accepted");const id=r.data.id;
r=await call("/api/products");check(r.data[0].stock===1&&r.data[0].sizes.M===1,"stock deducted by size");
r=await call("/api/orders","POST",body);check(r.res.ok&&r.data.id===id,"retry is idempotent");
r=await call("/api/products");check(r.data[0].stock===1,"retry does not deduct twice");
r=await call("/api/orders","POST",{...body,requestId:randomUUID()});check(r.res.status===400,"overselling rejected");
r=await call("/api/admin/data","GET",undefined,true);check(r.data.orders[0].total===440000,"server calculates price and ignores client total");check(r.data.outbox.some(x=>x.kind==="stock")&&r.data.outbox.some(x=>x.kind==="order"),"stock and order notifications queued");
r=await call("/api/admin/order","POST",{id,status:"cancelled"},true);check(r.res.ok,"cancel order");
r=await call("/api/admin/order","POST",{id,status:"cancelled"},true);check(r.res.ok,"repeat cancellation safe");
r=await call("/api/products");check(r.data[0].stock===3,"stock restored exactly once");
r=await call("/api/admin/order","POST",{id,status:"confirmed"},true);check(r.res.status===400,"cancelled order cannot reopen without stock reservation");
r=await call("/api/orders","POST",{...body,requestId:randomUUID(),items:[{productId:"test",size:"M",quantity:2},{productId:"test",size:"M",quantity:2}]});check(r.res.status===400,"duplicate lines cannot bypass stock checks");
r=await call("/api/products");check(r.data[0].stock===3,"failed transaction rolls back stock");
r=await call("/api/admin/products","POST",{...product,sizes:{M:1}},true);check(r.res.status===400,"inconsistent stock totals rejected");
r=await call("/api/admin/products","POST",{...product,id:"test-two",title:"Second",position:1},true);check(r.res.ok,"create product");
r=await call("/api/admin/reorder","POST",{ids:["test-two","test"]},true);check(r.res.ok,"reorder products");
r=await call("/api/products");check(r.data[0].id==="test-two","catalog order persisted");
r=await call("/api/support","POST",{name:"Test User",phone:"+998901234567",message:"Please contact me"});check(r.res.status===201,"support submitted");
r=await call("/api/admin/data","GET",undefined,true);check(r.data.messages.length===1&&r.data.outbox.some(x=>x.kind==="support"),"support message and notification persisted");
const form=new FormData();form.append("file",new Blob([await sharp({create:{width:4,height:4,channels:3,background:"white"}}).png().toBuffer()],{type:"image/png"}),"test.png");r=await call("/api/admin/upload","POST",form,true);check(r.res.ok&&r.data.url.startsWith("/api/media/"),"phone image upload");const media=r.data.url;r=await fetch(base+media);check(r.ok&&r.headers.get("content-type")==="image/webp","uploaded image served");
r=await call("/api/admin/products","POST",{...product,images:[media]},true);check(r.res.ok,"uploaded image can be saved on product");
const invalid=new FormData();invalid.append("file",new Blob(["<script>alert(1)</script>"],{type:"image/png"}),"fake.png");r=await call("/api/admin/upload","POST",invalid,true);check(r.res.status===400,"fake image rejected");
r=await call("/api/admin/products","DELETE",{id:"test-two"},true);check(r.res.ok,"delete product");
r=await call("/api/admin/data","GET",undefined,true);check(r.data.orders.length===1,"product deletion preserves order history");
r=await fetch(base+"/");check(r.ok&&(await r.text()).includes("UZER"),"storefront SSR");r=await fetch(base+"/admin");check(r.ok,"admin page serves");
console.log(checks+" integration checks passed.");}catch(e){console.error(e);console.error(log);process.exitCode=1;}finally{server.kill();await new Promise(resolveExit=>{server.once("exit",resolveExit);setTimeout(resolveExit,5000);});const target=resolve(dir);if(target.startsWith(resolve("data")+resolve("/").slice(-1))||target.startsWith(resolve("data")+"\\")||target.startsWith(resolve("data")+"/")){rmSync(target,{recursive:true,force:true});}}
