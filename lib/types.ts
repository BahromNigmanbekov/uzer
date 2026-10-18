export type Lang="uz"|"ru"|"en";
export type Fit="regular"|"oversize";
export type Product={id:string;title:string;desc:string;price:number;category:string;images:string[];stock:number;sizes:Record<string,number>;position:number;active:boolean;isNew:boolean;translations:Record<string,{title:string;desc:string}>;fits?:Fit[];sharedStock?:boolean};
export type CartItem={productId:string;size:string;quantity:number;fit?:Fit};
export type Order={id:string;firstName:string;lastName:string;phone:string;telegram:string;address:string;items:{productId:string;title:string;image:string;size:string;quantity:number;price:number;fit?:Fit}[];total:number;status:string;createdAt:string;requestId:string;customerId?:string;deliveryMethod?:string;comment?:string};
