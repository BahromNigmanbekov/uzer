import "server-only";
import {randomBytes,randomUUID,scrypt as scryptCallback,timingSafeEqual,createHash} from "node:crypto";
import {promisify} from "node:util";
import {cookies} from "next/headers";
import {db,orders} from "./db";
const scrypt=promisify(scryptCallback);
export type Customer={id:string;firstName:string;lastName:string;email:string};
type Row=Customer&{password:string};
function storage(){return db();}
function hash(token:string){return createHash("sha256").update(token).digest("hex");}
function publicUser(row:Row):Customer{return {id:row.id,firstName:row.firstName,lastName:row.lastName,email:row.email};}
async function session(id:string){const token=randomBytes(32).toString("hex");await storage().prepare("INSERT INTO customer_sessions(token,customer_id,expires) VALUES(?,?,?)").run(hash(token),id,Date.now()+604800000);(await cookies()).set("uzer_customer",token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:604800});}
export async function currentCustomer(){const token=(await cookies()).get("uzer_customer")?.value;if(!token)return null;const d=storage();const r=await d.prepare("SELECT c.data FROM customer_sessions s JOIN customers c ON c.id=s.customer_id WHERE s.token=? AND s.expires>?").get(hash(token),Date.now()) as unknown as {data:string}|undefined;return r?publicUser(JSON.parse(r.data)):null;}
export async function registerCustomer(input:{firstName:string;lastName:string;email:string;password:string}){const d=storage(),email=input.email.toLowerCase();if(await d.prepare("SELECT id FROM customers WHERE email=?").get(email))throw new Error("Bu email bilan akkaunt mavjud / Account already exists");const salt=randomBytes(16).toString("hex");const key=await scrypt(input.password,salt,64) as Buffer;const row:Row={id:randomUUID(),firstName:input.firstName,lastName:input.lastName,email,password:salt+":"+key.toString("hex")};await d.prepare("INSERT INTO customers(id,email,data) VALUES(?,?,?)").run(row.id,email,JSON.stringify(row));await session(row.id);return publicUser(row);}
export async function loginCustomer(email:string,password:string){const r=await storage().prepare("SELECT data FROM customers WHERE email=?").get(email.toLowerCase()) as unknown as {data:string}|undefined;const row:Row|undefined=r?JSON.parse(r.data):undefined;const [salt,expected]=(row?.password||"00000000000000000000000000000000:"+"0".repeat(128)).split(":");const key=await scrypt(password,salt,64) as Buffer;const target=Buffer.from(expected,"hex");if(!row||target.length!==key.length||!timingSafeEqual(key,target))throw new Error("Email yoki parol noto‘g‘ri / Invalid email or password");await session(row.id);return publicUser(row);}
export async function logoutCustomer(){const token=(await cookies()).get("uzer_customer")?.value;if(token)await storage().prepare("DELETE FROM customer_sessions WHERE token=?").run(hash(token));(await cookies()).delete("uzer_customer");}
export async function customerOrders(id:string){return (await orders()).filter(o=>o.customerId===id);}
