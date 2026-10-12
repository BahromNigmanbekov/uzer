import "server-only";
import {z} from "zod";
import {existsSync} from "node:fs";
import {resolve} from "node:path";
import {db} from "./db";
import campaignAssets from "./campaign-assets.json";
export type ShopSettings={phone:string;address:string;hours:string;instagram:string;telegram:string;tiktok:string;heroProductId:string;heroDesktopImage:string;heroMobileImage:string;editorialImages:string[]};
export const defaultShopSettings:ShopSettings={phone:"+998870530111",address:"Toshkent shahri, Shayxontohur tumani, Shumanay 5",hours:"",instagram:"",telegram:"",tiktok:"",heroProductId:"",heroDesktopImage:"",heroMobileImage:"",editorialImages:[]};
const social=z.string().trim().max(300).refine(v=>!v||/^https:\/\//.test(v),"Havola https:// bilan boshlanishi kerak");
const image=z.string().trim().max(500).refine(v=>!v||/^https:\/\//.test(v)||/^\/api\/media\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(v)||/^\/campaign\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(v),"Rasm manzili noto‘g‘ri");
export const shopSettingsSchema=z.object({phone:z.string().trim().max(40).refine(v=>!v||/^\+?[0-9 ()-]{9,20}$/.test(v)),address:z.string().trim().max(500),hours:z.string().trim().max(100),instagram:social,telegram:social,tiktok:social,heroProductId:z.string().max(100),heroDesktopImage:image.default(""),heroMobileImage:image.default(""),editorialImages:z.array(image).max(8).default([])});
function campaign(name:string){const cached=(campaignAssets as Record<string,string>)[name];if(cached)return cached;if(process.env.VERCEL)return "";for(const ext of ["webp","jpg","jpeg","png"]){const file=`/campaign/${name}.${ext}`;if(existsSync(resolve(process.cwd(),"public"+file)))return file;}return "";}
export async function shopSettings():Promise<ShopSettings>{const row=await db().prepare("SELECT value FROM settings WHERE key='store_profile'").get() as unknown as {value:string}|undefined;let value:ShopSettings;try{value={...defaultShopSettings,...(row?JSON.parse(row.value):{})};}catch{value={...defaultShopSettings};}return resolvedShopSettings(value);}
export function resolvedShopSettings(value:ShopSettings={...defaultShopSettings}){value={...value,editorialImages:[...value.editorialImages]};value.heroDesktopImage=value.heroDesktopImage||campaign("hero-desktop");value.heroMobileImage=value.heroMobileImage||campaign("hero-mobile");value.editorialImages=Array.from({length:8},(_,i)=>value.editorialImages[i]||campaign("style-"+(i+1)));return value;}
export async function saveShopSettings(s:ShopSettings){await db().prepare("INSERT INTO settings(key,value) VALUES('store_profile',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(JSON.stringify(s));}
