export const maxDuration=60;
import {renderStore} from "@/lib/store-page";
import {pageMetadata} from "@/lib/seo";
export const metadata=pageMetadata();
export const dynamic="force-dynamic";
export default async function Page(){return renderStore();}
