import {db} from "@/lib/db";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){try{await db().prepare("SELECT 1 AS ok").get();const images=!process.env.VERCEL||!!process.env.BLOB_READ_WRITE_TOKEN;return Response.json({ok:images,database:true,images},{status:images?200:503,headers:{"Cache-Control":"no-store"}});}catch{return Response.json({ok:false,database:false,error:"Server storage configuration is incomplete or unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});}}
