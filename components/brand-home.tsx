import Link from "next/link";
import {ArrowUpRight,MapPin} from "lucide-react";
import type {ReactNode} from "react";
import type {Product,Lang} from "@/lib/types";
import type {ShopSettings} from "@/lib/shop-settings";
import {brandCopy} from "@/lib/brand-copy";
import {siteCopy,categoryText} from "@/lib/site-content";
import {productText,money} from "@/lib/i18n";
import ProductImage from "./product-image";

type Props={products:Product[];lang:Lang;shop:ShopSettings;href:(path?:string,q?:Record<string,string>)=>string;renderCard:(product:Product)=>ReactNode};
export default function BrandHome({products,lang,shop,href,renderCard}:Props){
  const b=brandCopy[lang],c=siteCopy[lang];
  const firstTshirt=products.find(p=>p.category==="T-Shirt");
  const selection=[...(firstTshirt?[firstTshirt]:[]),...products.filter(p=>p.isNew),...products.filter(p=>!p.isNew)];
  const latest=selection.filter((p,i)=>selection.findIndex(other=>other.id===p.id)===i).slice(0,4);
  const categories=["Hoodie","T-Shirt","Cap","Bag"].flatMap(category=>{const product=products.find(p=>p.category===category);return product?[{category,product}]:[];});
  const edit=products.find(p=>p.category==="Hoodie")||products.find(p=>p.category==="Zip Hoodie");
  const accessories=products.filter(p=>["Cap","Bag"].includes(p.category)).slice(0,3);
  return <div className="u7-home">
    <section className="u7-intro u7-container"><div className="u7-label"><span className="u7-square"/>UZER7 — {b.intro}</div><div className="u7-intro-grid"><h2>{b.statement}</h2><div><p>{b.note}</p><Link className="u7-text-link" href={href("about")}>{c.about}<ArrowUpRight size={18}/></Link></div></div><div className="u7-index"><span>01 — {b.latest}</span><span>02 — {c.collection}</span><span>03 — {c.ourStore}</span></div></section>
    {latest.length>0&&<section className="u7-selection u7-container"><div className="u7-section-heading"><div><span className="u7-label">01 / THE SELECTION</span><h2>{b.latest}<sup>{String(latest.length).padStart(2,"0")}</sup></h2></div><Link className="u7-text-link" href={href("products",{collection:"new"})}>{c.viewAll}<ArrowUpRight size={18}/></Link></div><div className="u7-selection-grid">{latest.map(p=><div key={p.id}>{renderCard(p)}</div>)}</div></section>}
    <section className="u7-directory"><div className="u7-container u7-directory-grid"><div className="u7-directory-intro"><span className="u7-label">02 / YOUR WARDROBE</span><h2>{b.categories}</h2><p>{b.categoryNote}</p><Link className="u7-text-link" href={href("products")}>{c.viewAll}<ArrowUpRight size={18}/></Link></div><div className="u7-category-list">{categories.map(({category,product},i)=><Link key={category} href={href("products",{category})} className="u7-category"><span className="u7-category-number">0{i+1}</span><div className="u7-category-image"><ProductImage src={product.images[0]} alt={categoryText(category,lang)} sizes="120px"/></div><h3>{categoryText(category,lang)}</h3><span className="u7-category-count">{String(products.filter(p=>p.category===category).length).padStart(2,"0")}</span><ArrowUpRight size={22}/></Link>)}</div></div></section>
    {edit&&<section className="u7-edit u7-container"><div className="u7-edit-photo">{shop.editorialImages[0]?<img src={shop.editorialImages[0]} alt={b.edit} loading="lazy" decoding="async"/>:<ProductImage src={edit.images[0]} alt={productText(edit,lang).title} sizes="(max-width:767px) 100vw, 50vw"/>}<span className="u7-photo-index">UZER7 / EVERYDAY OBJECTS</span></div><div className="u7-edit-copy"><span className="u7-label">THE EVERYDAY EDIT</span><h2>{b.edit}</h2><p>{b.editNote}</p><Link className="u7-text-link" href={href("products",{category:"hoodies"})}>{c.hoodies}<ArrowUpRight size={18}/></Link><div className="u7-featured-product"><span>IN FOCUS</span><Link href={href("products/"+edit.id)}>{productText(edit,lang).title}<ArrowUpRight size={16}/></Link><strong>{money(edit.price,lang)}</strong></div></div></section>}
    {accessories.length>0&&<section className="u7-details u7-container"><div className="u7-section-heading"><div><span className="u7-label">03 / FINISHING TOUCHES</span><h2>{b.details}</h2></div><div><p>{b.detailsNote}</p><Link className="u7-text-link" href={href("products",{category:"accessories"})}>{c.accessories}<ArrowUpRight size={18}/></Link></div></div><div className="u7-accessory-grid">{accessories.map(p=><div key={p.id}>{renderCard(p)}</div>)}</div></section>}
    <section className="u7-visit"><div className="u7-container u7-visit-grid"><div><span className="u7-label">04 / TASHKENT, UZBEKISTAN</span><h2>{b.visit}</h2><p>{b.visitNote}</p></div><div className="u7-visit-card"><MapPin size={26}/><h3>{c.ourStore}</h3>{shop.address&&<p>{shop.address}</p>}{shop.hours&&<p>{shop.hours}</p>}<Link href={href("stores")} className="u7-text-link">{c.directions}<ArrowUpRight size={18}/></Link></div></div></section>
  </div>;
}
