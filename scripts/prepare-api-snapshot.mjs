import {readFileSync,writeFileSync,existsSync,mkdirSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import {createHash} from "node:crypto";
import {stripTypeScriptTypes} from "node:module";
import vm from "node:vm";
if(existsSync(".env.local"))process.loadEnvFile(".env.local");
const endpoint=process.env.PRODUCT_API_URL.replace(/\/+$/,"");
const response=await fetch(endpoint);if(!response.ok)throw new Error("API unavailable: "+response.status);const rows=await response.json();if(!Array.isArray(rows)||!rows.length)throw new Error("API is empty");
mkdirSync("tests/fixtures",{recursive:true});
if(!existsSync("tests/fixtures/legacy-products.json")){const d=new DatabaseSync("data/uzer.sqlite",{readOnly:true});const old=d.prepare("SELECT data FROM products").all().map(r=>JSON.parse(r.data));d.close();writeFileSync("tests/fixtures/legacy-products.json",JSON.stringify(old,null,2)+"\n");}
const code=stripTypeScriptTypes(readFileSync("lib/product-api-data.ts","utf8"));const names=[...code.matchAll(/export (?:const|function) (\w+)/g)].map(m=>m[1]);const api=vm.runInNewContext(`(()=>{${code.replace(/export (?=const|function)/g,"")}\nreturn {${names.join(",")}}})()`,{process,URL});
const source=createHash("sha256").update(endpoint).digest("hex").slice(0,10);
const products=rows.map((row,i)=>api.parseApiProduct(row,"api-"+source+"-"+row.id,i));
writeFileSync("lib/initial-products.json",JSON.stringify(products,null,2)+"\n");
console.log(`Prepared ${products.length} API records; ${products.filter(p=>p.active).length} active. Legacy browser fixtures retained.`);
