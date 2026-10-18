import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {spawn} from 'node:child_process';
import {resolve,dirname,basename} from 'node:path';
import {mkdirSync,rmSync,readFileSync,existsSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {chromium} from '@playwright/test';
import {remoteFixture} from './remote-fixture.mjs';

const dir=resolve('data','test-cloud-'+randomUUID());
mkdirSync(dir,{recursive:true});
const file=resolve(dir,'remote.sqlite');
const d=new DatabaseSync(file);
d.exec('PRAGMA journal_mode=WAL');
for(const sql of JSON.parse(readFileSync('lib/database-schema.json','utf8')))d.exec(sql);
const product={id:'cloud',title:'Cloud Shirt',desc:'Remote DB fixture',category:'T-Shirt',price:220000,images:[],stock:3,sizes:{M:3},position:0,active:true,isNew:true,translations:{}};
d.prepare('INSERT INTO products VALUES(?,?)').run(product.id,JSON.stringify(product));
d.prepare("INSERT INTO settings VALUES('imported','1')").run();
d.close();
const snapshot=JSON.parse(readFileSync('lib/initial-products.json','utf8'));
const publicProduct=snapshot.find(p=>p.active&&Object.keys(p.sizes).length>1);
assert.ok(publicProduct,'A clothing product is required to verify cached size availability');
const fixture=await remoteFixture(file),processes=new Map(),results=[];
let log='',checks=0,browser;
function check(value,label){assert.ok(value,label);checks++;results.push(label);console.log('PASS '+label);}
async function start(port,configured=true,overrides={}){
  const p=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{
    env:{...process.env,PRODUCT_API_SYNC:"false",VERCEL:'1',PRODUCT_API_URL:'http://127.0.0.1:1/offline',TURSO_DATABASE_URL:configured?fixture.url:'',TURSO_AUTH_TOKEN:configured?'fixture-token':'',BLOB_READ_WRITE_TOKEN:'',DATABASE_PATH:resolve(dir,'forbidden','db.sqlite'),ADMIN_PASSWORD:'cloud-test-password',SESSION_SECRET:'cloud-test-session-secret-32-characters',CRON_SECRET:'cloud-test-cron-secret',STOCK_BOT_TOKEN:'',ORDER_BOT_TOKEN:'',SUPPORT_BOT_TOKEN:'',NEXT_TELEMETRY_DISABLED:'1',...overrides},
    stdio:['ignore','pipe','pipe']
  });
  processes.set(port,p);p.stdout.on('data',b=>log+=b);p.stderr.on('data',b=>log+=b);
  for(let i=0;i<80;i++){
    if(p.exitCode!==null)throw new Error('Cloud fixture server exited before becoming ready');
    try{if((await fetch('http://127.0.0.1:'+port+'/api/auth')).ok)return;}catch{}
    await new Promise(r=>setTimeout(r,250));
  }
  throw new Error('Cloud fixture server failed to start');
}
async function stop(port){
  const p=processes.get(port);if(!p)return;processes.delete(port);p.kill();
  await new Promise(r=>{p.once('exit',r);setTimeout(r,2000);});
}
async function call(port,path,method='GET',body,cookie=''){
  const r=await fetch('http://127.0.0.1:'+port+path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});
  let data;try{data=await r.json();}catch{}return {r,data};
}
function safeFailure(data,code,secrets=[]){
  const raw=JSON.stringify(data);
  return data?.code===code&&typeof data.error==='string'&&data.error.length>0&&!secrets.some(s=>s&&raw.includes(s))&&!/(?:node_modules|\.next\/server|SELECT .*FROM|LibsqlError)/i.test(raw);
}
async function verifyUnavailable(port,label,code,missing=[],secrets=[]){
  let a=await call(port,'/api/health');
  check(a.r.status===503&&a.data.database===false&&safeFailure(a.data,code,secrets),label+': health reports a safe database failure');
  check(Array.isArray(a.data.missing)&&missing.every(key=>a.data.missing.includes(key))&&a.data.missing.length===missing.length,label+': health identifies only missing environment names');
  for(const path of ['/','/uz','/uz/products','/uz/products/'+publicProduct.id]){
    const r=await fetch('http://127.0.0.1:'+port+path),html=await r.text();
    check(r.status===200&&html.includes('storage-unavailable')&&!html.includes('id="__next_error__"')&&!html.includes('NEXT_HTTP_ERROR_FALLBACK;500')&&!/(?:\\?")digest(?:\\?")\s*:/.test(html)&&!secrets.some(s=>s&&html.includes(s)),label+': '+path+' renders the public catalog without a server render digest');
    if(path.endsWith('/'+publicProduct.id))check(html.includes(publicProduct.title),label+': metadata and product existence checks use the cached public product');
  }
  const missingProduct=await fetch('http://127.0.0.1:'+port+'/uz/products/missing-cloud-product');
  check(missingProduct.status===404,label+': an unknown product remains a real 404');
  const writes=[
    ['/api/orders',{requestId:randomUUID(),firstName:'Unavailable',lastName:'Customer',phone:'+998901234567',telegram:'',address:'Test Street 1',items:[{productId:publicProduct.id,size:'M',quantity:1}]}],
    ['/api/support',{name:'Unavailable Customer',phone:'+998901234567',message:'This message must never be accepted without persistent storage.'}],
    ['/api/auth',{password:'cloud-test-password'}],
    ['/api/customer/register',{firstName:'Unavailable',lastName:'Customer',email:'unavailable@example.test',password:'unavailable-customer-password'}]
  ];
  for(const [path,body] of writes){
    a=await call(port,path,'POST',body);
    check(a.r.status===503&&safeFailure(a.data,code,secrets),label+': '+path+' rejects writes safely rather than accepting unsaved data');
  }
  check(!existsSync(resolve(dir,'forbidden')),label+': no ephemeral local database is created');
}
async function verifyMissingConfigBrowser(port){
  const installedChrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
  browser=await chromium.launch({...(existsSync(installedChrome)?{executablePath:installedChrome}:{}),headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844}}),pageErrors=[],renderErrors=[];
  page.on('pageerror',e=>pageErrors.push(e.message));
  page.on('console',message=>{if(message.type()==='error'&&/Minified React error|UZER page unavailable|hydration/i.test(message.text()))renderErrors.push(message.text());});
  const base='http://127.0.0.1:'+port;
  await page.goto(base+'/uz');await page.locator('.storage-unavailable').waitFor();
  check(await page.locator('.home-hero').isVisible(),'missing configuration: mobile homepage hydrates and shows its availability notice');
  await page.reload();await page.locator('.storage-unavailable').waitFor();
  check(await page.locator('.home-hero').isVisible(),'missing configuration: mobile refresh keeps the storefront visible');
  await page.goto(base+'/uz/products/'+publicProduct.id);await page.locator('.product-page').waitFor();
  check(await page.locator('.sizes button').count()===Object.keys(publicProduct.sizes).length&&await page.locator('.sizes button:enabled').count()===0&&await page.locator('.product-options .button').first().isDisabled(),'missing configuration: cached sizes show no live stock and cannot be purchased');
  await page.evaluate(({productId})=>localStorage.setItem('uzer-cart',JSON.stringify([{productId,size:'M',quantity:1}])),{productId:publicProduct.id});
  await page.goto(base+'/uz/checkout');await page.locator('.checkout-grid').waitFor();
  check(await page.locator('.checkout-grid button[type=submit], .checkout-grid .button').last().isDisabled(),'missing configuration: an existing saved cart cannot submit checkout');
  await page.goto(base+'/uz/contact');await page.locator('.contact-form').waitFor();
  check(await page.locator('.contact-form .button').isDisabled(),'missing configuration: support form cannot report a message as sent');
  await page.goto(base+'/uz/sign-up');await page.locator('.auth-page form').waitFor();
  check(await page.locator('.auth-page form .button').isDisabled(),'missing configuration: customer registration cannot submit without storage');
  await page.goto(base+'/en');await page.locator('.storage-unavailable').waitFor();
  check((await page.locator('.storage-unavailable').innerText()).includes('Orders are temporarily unavailable'),'missing configuration: the storage notice follows the selected language');
  check(pageErrors.length===0&&renderErrors.length===0,'missing configuration: browser has no React 441, hydration or page render errors');
  await browser.close();browser=undefined;
}
try{
  await Promise.all([start(3111),start(3112)]);
  let a=await call(3111,'/api/products');
  check(a.data[0].stock===3,'Vercel-mode products come from HTTP database');
  a=await call(3111,'/api/health');
  check(a.r.status===503&&a.data.database===true&&a.data.images===false,'missing Blob setup is reported separately from healthy database');
  a=await call(3111,'/api/customer/register','POST',{firstName:'Cloud',lastName:'Customer',email:'cloud@example.test',password:'cloud-customer-password'});
  check(a.r.status===201,'customer registration uses remote database');
  const customer=a.r.headers.get('set-cookie').split(';')[0];
  a=await call(3112,'/api/customer/auth','GET',undefined,customer);
  check(a.data.customer.email==='cloud@example.test','customer session survives another function instance');
  const body={requestId:randomUUID(),firstName:'Cloud',lastName:'Customer',phone:'+998901234567',telegram:'',address:'Cloud Test Street 1',items:[{productId:'cloud',size:'M',quantity:2}]},other={...body,requestId:randomUUID()};
  const attempts=await Promise.all([call(3111,'/api/orders','POST',body,customer),call(3112,'/api/orders','POST',other,customer)]);
  check(attempts.filter(x=>x.r.status===201).length===1&&attempts.filter(x=>x.r.status===400).length===1,'parallel orders across instances cannot oversell');
  const successful=attempts.findIndex(x=>x.r.status===201),accepted=successful===0?body:other,id=attempts[successful].data.id;
  a=await call(3112,'/api/products');
  check(a.data[0].stock===1&&a.data[0].sizes.M===1,'remote stock deducted exactly once');
  a=await call(3111,'/api/orders','POST',accepted,customer);
  check(a.data.id===id&&a.r.status===200,'duplicate checkout remains idempotent across instances');
  a=await call(3112,'/api/customer/orders','GET',undefined,customer);
  check(a.data.length===1&&a.data[0].id===id,'customer order history is shared remotely');
  await stop(3111);await start(3111);
  a=await call(3111,'/api/products');
  check(a.data[0].stock===1,'inventory survives function restart');
  const page=await fetch('http://127.0.0.1:3111/uz/products/cloud');
  check(page.ok&&(await page.text()).includes('Cloud Shirt'),'direct product URL and refresh render after restart');
  a=await call(3111,'/api/auth','POST',{password:'cloud-test-password'});
  const admin=a.r.headers.get('set-cookie').split(';')[0];
  a=await call(3112,'/api/admin/order','POST',{id,status:'cancelled'},admin);
  check(a.r.ok,'admin can cancel from another instance');
  a=await call(3111,'/api/products');
  check(a.data[0].stock===3,'cancelled remote order restores selected size');
  a=await call(3111,'/api/admin/order','POST',{id,status:'cancelled'},admin);
  a=await call(3112,'/api/products');
  check(a.data[0].stock===3,'repeat remote cancellation does not add stock twice');
  a=await call(3111,'/api/cron');
  check(a.r.status===401,'cron endpoint rejects unauthenticated requests');
  const cron=await fetch('http://127.0.0.1:3111/api/cron',{headers:{Authorization:'Bearer cloud-test-cron-secret'}});
  check(cron.ok,'authorized serverless queue retry works');
  check(!existsSync(resolve(dir,'forbidden')),'Vercel mode never creates a local database');

  await start(3113,false);
  await verifyUnavailable(3113,'missing configuration','MISSING_TURSO_CONFIG',['TURSO_DATABASE_URL','TURSO_AUTH_TOKEN']);
  await verifyMissingConfigBrowser(3113);
  const cases=[
    {label:'missing token',code:'MISSING_TURSO_CONFIG',missing:['TURSO_AUTH_TOKEN'],env:{TURSO_DATABASE_URL:fixture.url,TURSO_AUTH_TOKEN:''}},
    {label:'invalid database URL',code:'INVALID_TURSO_CONFIG',env:{TURSO_DATABASE_URL:'invalid-database-url',TURSO_AUTH_TOKEN:'fixture-token'}},
    {label:'rejected database token',code:'DATABASE_AUTH_FAILED',env:{TURSO_DATABASE_URL:fixture.url,TURSO_AUTH_TOKEN:'rejected-token-must-not-leak'},secrets:['rejected-token-must-not-leak']},
    {label:'unreachable database',code:'DATABASE_UNAVAILABLE',env:{TURSO_DATABASE_URL:'http://127.0.0.1:1',TURSO_AUTH_TOKEN:'unreachable-token-must-not-leak'},secrets:['unreachable-token-must-not-leak']}
  ];
  for(const testCase of cases){
    await start(3114,true,testCase.env);
    await verifyUnavailable(3114,testCase.label,testCase.code,testCase.missing||[],testCase.secrets||[]);
    await stop(3114);
  }
  a=await call(3111,'/api/products');
  check(a.data.length===1&&a.data[0].stock===3,'failed cloud configuration cannot alter the working database inventory');
  const reset=new DatabaseSync(file);
  reset.exec("DELETE FROM products;DELETE FROM settings WHERE key='imported';");reset.close();
  const catalogs=await Promise.all([call(3111,'/api/products'),call(3112,'/api/products')]);
  check(catalogs.every(x=>x.r.ok&&x.data.length===snapshot.filter(p=>p.active!==false).length),'parallel cold starts initialize active products when source API is offline');
  a=await call(3111,'/api/products');
  check(a.data.every(p=>{const source=snapshot.find(x=>x.id===p.id);return source&&source.stock===p.stock&&JSON.stringify(source.sizes)===JSON.stringify(p.sizes);}), 'cached first import preserves exact snapshot size stock');
  console.log(checks+' cloud checks passed.');
}catch(e){console.error(e);console.error(log);process.exitCode=1;}
finally{
  await browser?.close();
  mkdirSync('artifacts',{recursive:true});
  writeFileSync('artifacts/cloud-checks.json',JSON.stringify({checks,results},null,2));
  await Promise.all([...processes.keys()].map(stop));await fixture.close();
  if(dirname(dir)===resolve('data')&&basename(dir).startsWith('test-cloud-'))rmSync(dir,{recursive:true,force:true});
}
