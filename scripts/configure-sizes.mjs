import {DatabaseSync} from 'node:sqlite';
import {resolve} from 'node:path';
const database=resolve(process.env.DATABASE_PATH||'data/uzer.sqlite');
const db=new DatabaseSync(database);db.exec('PRAGMA busy_timeout=5000');
const key='clothing_sizes_s3_m5_l4_xl2_v1';
if(db.prepare('SELECT key FROM settings WHERE key=?').get(key)){console.log('Size setup already applied; admin edits preserved.');db.close();process.exit(0);}
const backup=database+'.before-sizes-'+Date.now()+'.sqlite';db.exec("VACUUM INTO '"+backup.replaceAll("'","''")+"'");
let count=0;db.exec('BEGIN IMMEDIATE');try{for(const row of db.prepare('SELECT id,data FROM products').all()){const p=JSON.parse(row.data);if(['Cap','Bag'].includes(p.category)||Object.keys(p.sizes).join(',')!=='ONE SIZE')continue;p.sizes={S:3,M:5,L:4,XL:2};p.stock=14;db.prepare('UPDATE products SET data=? WHERE id=?').run(JSON.stringify(p),p.id);count++;}db.prepare('INSERT INTO settings VALUES(?,?)').run(key,'1');db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}finally{db.close();}console.log('Configured '+count+' clothing products: S=3, M=5, L=4, XL=2. Backup: '+backup);
