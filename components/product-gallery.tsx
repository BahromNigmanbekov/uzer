"use client";
import {useEffect,useRef,useState} from "react";
import ProductImage from "./product-image";
export default function ProductGallery({images,title,id}:{images:string[];title:string;id:string}){
 const track=useRef<HTMLDivElement>(null);const [index,setIndex]=useState(0);
 useEffect(()=>{setIndex(0);track.current?.scrollTo({left:0,behavior:"instant"});},[id]);
 const photos=images.length?images:[""];
 return <div className="product-gallery"><div className="u7-gallery-grid" ref={track} onScroll={e=>{const element=e.currentTarget;const item=element.firstElementChild as HTMLElement|null;if(item)setIndex(Math.min(photos.length-1,Math.max(0,Math.round(element.scrollLeft/(item.offsetWidth+8)))));}}>{photos.map((src,i)=><div key={src+"-"+i} className="u7-gallery-photo" role="group" aria-label={`${i+1} / ${photos.length}`}><ProductImage src={src} alt={`${title} — ${i+1}`} priority={i===0} sizes="(max-width:767px) 88vw, (max-width:1100px) 45vw, 30vw"/></div>)}</div>{photos.length>1&&<div className="u7-gallery-pagination"><span aria-live="polite">{index+1} / {photos.length}</span><div>{photos.map((_,i)=><button key={i} type="button" aria-label={`${i+1} / ${photos.length}`} aria-pressed={index===i} onClick={()=>{const element=track.current;const item=element?.children[i] as HTMLElement|undefined;if(element&&item)element.scrollTo({left:item.offsetLeft-element.offsetLeft,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});}}/>)}</div></div>}</div>;
}
