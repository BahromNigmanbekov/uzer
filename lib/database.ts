import "server-only";
import type {Client,Transaction,InValue,InStatement} from "@libsql/client";
import {AsyncLocalStorage} from "node:async_hooks";
import {mkdirSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {pathToFileURL} from "node:url";
import {storageConfiguration,storageFailure} from "./storage-status";
import schema from "./database-schema.json";
const scope=new AsyncLocalStorage<Transaction>();
let ready:Promise<Client>|undefined,tail:Promise<void>=Promise.resolve();
async function exclusive<T>(work:()=>Promise<T>):Promise<T>{const previous=tail;let release!:()=>void;tail=new Promise<void>(r=>release=r);await previous;try{return await work();}finally{release();}}
async function client(){
  if(!ready)ready=(async()=>{
    const config=storageConfiguration();let url=config.url;
    if(!url){const filename=resolve(process.env.DATABASE_PATH||"./data/uzer.sqlite");mkdirSync(dirname(filename),{recursive:true});url=pathToFileURL(filename).href;}
    // Remote connections do not load the operating-system-specific SQLite module.
    const {createClient}=url.startsWith("file:")?await import("@libsql/client"):await import("@libsql/client/http");
    const c=createClient({url,authToken:config.authToken});
    try{
      await c.batch(schema,"write");
      const columns=await c.execute("PRAGMA table_info(outbox)");
      if(!columns.rows.some(r=>r.name==="lock_until")){
        try{await c.execute("ALTER TABLE outbox ADD COLUMN lock_until INTEGER DEFAULT 0");}
        catch(e){const again=await c.execute("PRAGMA table_info(outbox)");if(!again.rows.some(r=>r.name==="lock_until"))throw e;}
      }
      return c;
    }catch(e){c.close();throw e;}
  })().catch(e=>{ready=undefined;throw storageFailure(e);});
  return ready;
}
function queryError(error:unknown){
  // Unique constraints are validation conflicts; connection failures are service outages.
  if(error instanceof Error&&/SQLITE_CONSTRAINT/.test(error.message))return error;
  return storageFailure(error);
}
async function execute(sql:string,args:InValue[]=[]){
  try{const tx=scope.getStore();if(tx)return await tx.execute({sql,args});return await exclusive(async()=>{const c=await client();return c.execute({sql,args});});}
  catch(e){throw queryError(e);}
}
export function db(){return {
  async batch(statements:InStatement[]){try{const tx=scope.getStore();if(tx)return await tx.batch(statements);return await exclusive(async()=>(await client()).batch(statements,"write"));}catch(e){throw queryError(e);}},
  prepare(sql:string){return {async all(...args:InValue[]){return (await execute(sql,args)).rows;},async get(...args:InValue[]){return (await execute(sql,args)).rows[0];},async run(...args:InValue[]){const r=await execute(sql,args);return {changes:r.rowsAffected};}};}
};}
export async function transaction<T>(work:()=>Promise<T>):Promise<T>{
  if(scope.getStore())return work();
  return exclusive(async()=>{
    const tx=await (await client()).transaction("write").catch(e=>{throw storageFailure(e);});
    try{const result=await scope.run(tx,work);try{await tx.commit();}catch(e){throw storageFailure(e);}return result;}
    catch(e){try{await tx.rollback();}catch{}throw e;}
    finally{tx.close();}
  });
}
