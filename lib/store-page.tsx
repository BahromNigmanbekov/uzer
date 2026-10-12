import Store from "@/components/store";
import {readStoreData} from "@/lib/store-data";
import {unavailableMessage} from "@/lib/storage-status";
import type {Lang} from "@/lib/types";
export async function renderStore(page="home",locale:Lang="uz",productId="",query:Record<string,string>={}){
  const data=await readStoreData();
  return <Store initial={data.products} initialError={data.available?"":unavailableMessage(locale)} storageAvailable={data.available} page={page} locale={locale} productId={productId} initialQuery={query} shop={data.shop} ranking={data.ranking}/>;
}
