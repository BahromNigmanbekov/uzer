import "server-only";
import {createClient,type Client,type Transaction,type InValue,type InStatement} from "@libsql/client";
import {AsyncLocalStorage} from "node:async_hooks";
import {mkdirSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {pathToFileURL} from "node:url";
import schema from "./database-schema.json";
const scope=new AsyncLocalStorage<Transaction>();
let ready:Promise<Client>|undefined,tail:Promise<void>=Promise.resolve();
async function exclusive<T>(work:()=>Promise<T>):Promise<T>{const previous=tail;let release!:()=>void;tail=new Promise<void>(r=>release=r);await previous;try{return await work();}finally{release();}}
async function client(){if(!ready)ready=(async()=>{let url=process.env.TURSO_DATABASE_URL,authToken=process.env.TURSO_AUTH_TOKEN;if(process.env.VERCEL&&(!url||!authToken))throw new Error("Vercel sozlamalarida TURSO_DATABASE_URL va TURSO_AUTH_TOKEN kiritilishi kerak");if(!url){const filename=resolve(process.env.DATABASE_PATH||"./data/uzer.sqlite");mkdirSync(dirname(filename),{recursive:true});url=pathToFileURL(filename).href;}const c=createClient({url,authToken});try{await c.batch(schema,"write");const columns=await c.execute("PRAGMA table_info(outbox)");if(!columns.rows.some(r=>r.name==="lock_until")){try{await c.execute("ALTER TABLE outbox ADD COLUMN lock_until INTEGER DEFAULT 0");}catch(e){const again=await c.execute("PRAGMA table_info(outbox)");if(!again.rows.some(r=>r.name==="lock_until"))throw e;}}return c;}catch(e){c.close();throw e;}})().catch(e=>{ready=undefined;throw e;});return ready;}
async function execute(sql:string,args:InValue[]=[]){const tx=scope.getStore();if(tx)return tx.execute({sql,args});return exclusive(async()=>{const c=await client();return c.execute({sql,args});});}
export function db(){return {async batch(statements:InStatement[]){const tx=scope.getStore();if(tx)return tx.batch(statements);return exclusive(async()=>{return (await client()).batch(statements,"write");});},prepare(sql:string){return {async all(...args:InValue[]){return (await execute(sql,args)).rows;},async get(...args:InValue[]){return (await execute(sql,args)).rows[0];},async run(...args:InValue[]){const r=await execute(sql,args);return {changes:r.rowsAffected};}};}};}
export async function transaction<T>(work:()=>Promise<T>):Promise<T>{if(scope.getStore())return work();return exclusive(async()=>{const tx=await (await client()).transaction("write");try{const result=await scope.run(tx,work);await tx.commit();return result;}catch(e){try{await tx.rollback();}catch{}throw e;}finally{tx.close();}});}
