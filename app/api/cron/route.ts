import {timingSafeEqual} from "node:crypto";
import {deliver} from "@/lib/telegram";
export const runtime="nodejs";export const dynamic="force-dynamic";export const maxDuration=60;
export async function GET(req:Request){const secret=process.env.CRON_SECRET,header=req.headers.get("authorization")||"",expected="Bearer "+secret;if(!secret||Buffer.byteLength(header)!==Buffer.byteLength(expected)||!timingSafeEqual(Buffer.from(header),Buffer.from(expected)))return Response.json({error:"Unauthorized"},{status:401});try{await deliver();return Response.json({ok:true});}catch{return Response.json({error:"Retry unavailable"},{status:503});}}
