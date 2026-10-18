import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {stripTypeScriptTypes} from "node:module";
import vm from "node:vm";
const source=stripTypeScriptTypes(readFileSync("lib/telegram.ts","utf8")).replace(/^import .*;\r?\n/gm,"").replace("export async function deliver","async function deliver");
async function test(networkFailure){
 const row={id:"fixture",kind:"order",sent:0,data:JSON.stringify({image:"https://example.com/photo.jpg",text:"ORDER: Regular / M and Oversize / L"})};let error="";const calls=[];
 const db=()=>({prepare(sql){return {async all(){return row.sent===0?[row]:[];},async run(...args){if(sql.includes("SET sent=2")){if(row.sent!==0)return {changes:0};row.sent=2;}else if(sql.includes("SET sent=1"))row.sent=1;else if(sql.includes("SET sent=0,error")){row.sent=0;error=args[0];}return {changes:1};}};}});
 const fetch=async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});if(networkFailure)throw new Error("fixture offline");return {async json(){return url.endsWith("sendPhoto")?{ok:false,description:"photo unavailable"}:{ok:true};}};};
 const factory=vm.runInNewContext(`(function(db,process,fetch,AbortSignal){${source}\nreturn {deliver};})`);
 const {deliver}=factory(db,{env:{ORDER_BOT_TOKEN:"fixture-token",ORDER_CHAT_ID:"fixture-chat"}},fetch,AbortSignal);await deliver();return {row,error,calls};
}
let result=await test(false);assert.equal(result.row.sent,1);assert.equal(result.calls.length,2);assert.ok(result.calls[1].url.endsWith("sendMessage"));assert.ok(result.calls[1].body.text.includes("Oversize"));
result=await test(true);assert.equal(result.row.sent,0);assert.equal(result.calls.length,1);assert.ok(result.error.length>0);
console.log("PASS: unavailable photo falls back to order text; unknown network outcome remains queued for retry");
