import {db} from "@/lib/db";
import {storageFailure,missingStorageVariables} from "@/lib/storage-status";
export const runtime="nodejs";export const dynamic="force-dynamic";
const headers={"Cache-Control":"no-store"};
export async function GET(){
  const images=!process.env.VERCEL||!!process.env.BLOB_READ_WRITE_TOKEN?.trim();
  try{
    await db().prepare("SELECT 1 AS ok").get();
    return Response.json({ok:images,database:true,images,...(!images?{code:"MISSING_BLOB_CONFIG",missing:["BLOB_READ_WRITE_TOKEN"]}:{})},{status:images?200:503,headers});
  }catch(e){
    const code=storageFailure(e).code;
    return Response.json({ok:false,database:false,images,code,missing:missingStorageVariables(),error:"Server storage configuration is incomplete or unavailable"},{status:503,headers});
  }
}
