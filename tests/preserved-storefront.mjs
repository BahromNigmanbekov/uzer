import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
const source=readFileSync("components/store.tsx","utf8").replace(/\r\n/g,"\n");
const expected=JSON.parse(readFileSync("tests/fixtures/preserved-storefront.json","utf8"));
const parts={
  header:source.slice(source.indexOf("<header className="),source.indexOf("</header>")+9),
  hero:source.slice(source.indexOf('<section className="home-hero">'),source.indexOf("</section>",source.indexOf('<section className="home-hero">'))+10),
  navLogic:source.slice(source.indexOf(" useEffect(()=>{let previous="),source.indexOf(" useEffect(()=>{if(!panel)"))
};
for(const [name,value] of Object.entries(parts))assert.equal(createHash("sha256").update(value).digest("hex"),expected[name],`${name} must remain unchanged`);
console.log("PASS: original header, hero and navbar scroll logic are unchanged");
