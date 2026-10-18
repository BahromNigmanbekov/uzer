import assert from "node:assert/strict";
import {existsSync,readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {spawn} from "node:child_process";
import {chromium} from "@playwright/test";
if(existsSync(".env.local"))process.loadEnvFile(".env.local");
const {productId}=JSON.parse(readFileSync("artifacts/api-migration/local-import.json","utf8"));
const port=3118,base=`http://127.0.0.1:${port}`,artifact="artifacts/api-migration";mkdirSync(artifact,{recursive:true});
const server=spawn(process.execPath,["node_modules/next/dist/bin/next","start","--hostname","127.0.0.1","--port",String(port)],{env:{...process.env,PRODUCT_API_SYNC:"false",DATABASE_PATH:resolve("data/uzer.sqlite"),VERCEL:"",TURSO_DATABASE_URL:"",TURSO_AUTH_TOKEN:"",STOCK_BOT_TOKEN:"",ORDER_BOT_TOKEN:"",SUPPORT_BOT_TOKEN:""},stdio:["ignore","pipe","pipe"]});let log="",browser;server.stdout.on("data",b=>log+=b);server.stderr.on("data",b=>log+=b);const errors=[];
try{
 for(let i=0;i<100;i++){try{if((await fetch(base+"/api/auth")).ok)break;}catch{}await new Promise(r=>setTimeout(r,150));}
 browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true});const page=await browser.newPage({viewport:{width:1600,height:1000}});page.on("pageerror",error=>errors.push(error.message));
 for(const lang of ["uz","ru","en"]){await page.goto(`${base}/${lang}/products/${productId}`);await page.locator(".u7-gallery-photo").first().waitFor();assert.equal(await page.locator(".u7-gallery-photo").count(),6);assert.equal(await page.locator(".u7-gallery-grid").evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(" ").length),2);assert.ok((await page.locator(".description-copy p").innerText()).length>100);assert.equal(await page.locator(".u7-fit-options button").count(),2);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 const catalog=await (await fetch(base+'/api/products')).json();
 await page.goto(base+'/uz/products');await page.locator('.product-grid').waitFor();
 assert.equal(await page.locator('.product-grid .product-card').count(),catalog.length,'every color has its own card');
 const card=page.locator(`.product-grid .product-card`).filter({has:page.locator(`a.product-open[href="/uz/products/${productId}"]`)});
 const first=card.locator('.product-open>.product-image'),second=card.locator('.u7-hover-photo img');
 assert.equal(new URL(await second.getAttribute('src'),base).href,catalog.find(p=>p.id===productId).images[1]);
 assert.equal(await first.evaluate(e=>getComputedStyle(e).padding),'0px');
 assert.equal(await card.locator('.product-visual').evaluate(e=>getComputedStyle(e).borderWidth),'0px');
 await first.hover();await page.waitForTimeout(400);assert.equal(await card.locator('.u7-hover-photo').evaluate(e=>getComputedStyle(e).opacity),'1');assert.equal(await first.evaluate(e=>getComputedStyle(e).transform),'none');
 await page.mouse.move(0,0);await page.waitForTimeout(400);assert.equal(await card.locator('.u7-hover-photo').evaluate(e=>getComputedStyle(e).opacity),'0');
 await page.screenshot({path:artifact+'/catalog-separate-colors.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});assert.equal(await first.evaluate(e=>getComputedStyle(e).padding),'0px');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:artifact+'/catalog-separate-colors-mobile.png',fullPage:true});await page.setViewportSize({width:1600,height:1000});
 await page.goto(`${base}/uz/products/${productId}`);assert.equal(await page.locator('.u7-variant-picker').count(),0);await page.evaluate(()=>document.fonts.ready);await page.locator(".u7-gallery-photo img").first().waitFor();await page.waitForFunction(()=>{const img=document.querySelector(".u7-gallery-photo img");return img?.complete&&img.naturalWidth>0;},{},{timeout:20000});await page.screenshot({path:artifact+"/product-desktop.png",fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);await page.locator(".u7-gallery-grid").evaluate(e=>e.scrollTo({left:e.firstElementChild.clientWidth+8,behavior:"instant"}));await page.waitForTimeout(200);assert.ok((await page.locator(".u7-gallery-pagination>span").innerText()).startsWith("2 /"));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:artifact+"/product-mobile.png",fullPage:true});assert.equal(errors.length,0);
 writeFileSync(artifact+"/preview-checks.json",JSON.stringify({languages:3,photos:6,mobileSwipe:true,errors},null,2));console.log("PASS: real API product: 6 photos, 3 languages, desktop grid, mobile swipe and fit selector; no orders submitted.");
}catch(error){console.error(error);console.error(log);process.exitCode=1;}finally{await browser?.close();server.kill();await new Promise(r=>{server.once("exit",r);setTimeout(r,1000);});}
