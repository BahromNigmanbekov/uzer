import {DatabaseSync} from 'node:sqlite';
import {createClient} from '@libsql/client';
import {put} from '@vercel/blob';
import {existsSync,readFileSync} from 'node:fs';
import {resolve,basename} from 'node:path';
if(existsSync('.env.local'))process.loadEnvFile('.env.local');
if(!process.env.TURSO_DATABASE_URL||!process.env.TURSO_AUTH_TOKEN)throw new Error('Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env.local.');
const source=new DatabaseSync(resolve(process.env.DATABASE_PATH||'data/uzer.sqlite'),{readOnly:true});
const target=createClient({url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN});
const tables=['products','orders','messages','outbox','settings','customers'];
try{const statements=JSON.parse(readFileSync('lib/database-schema.json','utf8'));await target.batch(statements,'write');for(const table of tables){const r=await target.execute('SELECT COUNT(*) AS n FROM '+table);if(Number(r.rows[0].n))throw new Error('Target database is not empty. Migration stopped to protect existing data.');}
const rowsByTable={};const files=new Set();for(const table of tables){if(!source.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table)){rowsByTable[table]=[];continue;}const rows=source.prepare('SELECT * FROM '+table).all();rowsByTable[table]=rows;for(const row of rows)for(const value of Object.values(row))if(typeof value==='string')for(const match of value.matchAll(/\/api\/media\/[a-f0-9-]{36}\.(?:jpg|png|webp)/g))files.add(match[0]);}
if(files.size&&!process.env.BLOB_READ_WRITE_TOKEN)throw new Error('Local uploaded images exist. Set BLOB_READ_WRITE_TOKEN before migrating.');
const replacements=new Map();for(const url of files){const file=resolve(process.env.UPLOAD_PATH||'data/uploads',basename(url));if(!existsSync(file))throw new Error('An uploaded image is missing: '+basename(url));const result=await put('uzer/'+basename(url),readFileSync(file),{access:'public',addRandomSuffix:false});replacements.set(url,result.url);}
function rewrite(value){if(typeof value!=='string')return value;for(const [from,to]of replacements)value=value.replaceAll(from,to);return value;}
const tx=await target.transaction('write');try{for(const table of tables){if(Number((await tx.execute('SELECT COUNT(*) AS n FROM '+table)).rows[0].n))throw new Error('Target changed during migration. Rolled back.');for(const row of rowsByTable[table]){const keys=Object.keys(row),data={...row};if(table==='outbox'&&Number(data.sent)===2){data.sent=0;data.lock_until=0;}await tx.execute({sql:'INSERT INTO '+table+'('+keys.join(',')+') VALUES('+keys.map(()=>'?').join(',')+')',args:keys.map(k=>rewrite(data[k]))});}}await tx.commit();}catch(e){await tx.rollback();throw e;}finally{tx.close();}console.log('Cloud migration complete. Source database unchanged. Uploaded images: '+files.size+'. Customer sessions are intentionally not copied.');}finally{source.close();target.close();}
