import {existsSync,writeFileSync} from 'node:fs';
const images={};for(const name of ['hero-desktop','hero-mobile',...Array.from({length:8},(_,i)=>'style-'+(i+1))])for(const ext of ['webp','jpg','jpeg','png']){const url='/campaign/'+name+'.'+ext;if(existsSync('public'+url)){images[name]=url;break;}}
writeFileSync('lib/campaign-assets.json',JSON.stringify(images,null,2)+'\n');
