import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import vm from "node:vm";
import {stripTypeScriptTypes} from "node:module";

// Execute the pure metadata helpers without a running database or Next server.
const cache=new Map();
function load(file){
  file=resolve(file);if(cache.has(file))return cache.get(file);
  const module={exports:{}};cache.set(file,module.exports);
  const stripped=stripTypeScriptTypes(readFileSync(file,"utf8"));
  const names=[...stripped.matchAll(/export (?:const|function) (\w+)/g)].map(match=>match[1]);
  const source=stripped.replace(/import\s*\{([^}]+)\}\s*from\s*["']([^"']+)["'];?/g,'const {$1}=require("$2");').replace(/export (?=const|function)/g,"")+`\nObject.assign(exports,{${names.join(",")}});`;
  vm.runInNewContext(`(function(require,module,exports){${source}\n})`,{URL})(name=>load(resolve(dirname(file),name+".ts")),module,module.exports);
  return module.exports;
}
const seo=load("lib/seo.ts");
const product={id:"cap-1",title:"Kepka",desc:"Kundalik kepka",price:100000,images:["/cap.webp"],translations:{en:{title:"Everyday cap",desc:"Cotton cap"}}};
for(const lang of seo.languages){
  const home=seo.pageMetadata("home",lang);
  assert.equal(home.alternates.canonical,`https://www.uzer7.uz/${lang}`);
  assert.equal(home.alternates.languages.en,"https://www.uzer7.uz/en");
  assert.equal(home.robots.index,true);assert.ok(home.title.includes("UZER7"));
  for(const page of seo.privatePages)assert.equal(seo.pageMetadata(page,lang).robots.index,false);
  for(const page of seo.publicPages)assert.ok(seo.pageMetadata(page,lang).description.length>20);
}
const detail=seo.pageMetadata("products","en",product);
assert.equal(detail.title,"Everyday cap | UZER7");
assert.equal(detail.alternates.canonical,"https://www.uzer7.uz/en/products/cap-1");
assert.equal(detail.openGraph.images[0],"https://www.uzer7.uz/cap.webp");
assert.ok(!seo.jsonLd({name:"</script><script>alert(1)</script>"}).includes("<"));
console.log("PASS: localized metadata, canonical URLs, private pages, social images and JSON-LD escaping");
