export function telegramTextChunks(text:string,limit=3500){
 const chunks:string[]=[];let current="";
 for(const original of text.split("\n")){
  let line=original;while(line.length>limit){if(current){chunks.push(current);current="";}chunks.push(line.slice(0,limit));line=line.slice(limit);}
  if(current.length+line.length+1>limit){chunks.push(current);current=line;}else current+=(current?"\n":"")+line;
 }
 if(current)chunks.push(current);return chunks;
}
