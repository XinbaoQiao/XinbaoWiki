import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const wiki=path.join(root,'wiki');
const files=fs.readdirSync(wiki).filter(f=>f.endsWith('.md'));
const pages=new Set(files.map(f=>f.replace(/\.md$/,'')));
function norm(s){return s.trim().replace(/\s+/g,'_')}
let missing=[];
for(const f of files){ const txt=fs.readFileSync(path.join(wiki,f),'utf8'); for(const m of txt.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)){ const t=m[1].trim(); if(!pages.has(t)&&!pages.has(norm(t))) missing.push(`${f}: [[${t}]]`); } }
if(missing.length){ console.error('Missing WikiLinks:\n'+missing.join('\n')); process.exit(1); }
console.log(`WikiLink check passed for ${files.length} pages.`);
