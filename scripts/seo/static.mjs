import http from 'http'; import fs from 'fs'; import path from 'path';
const ROOT = 'C:/Users/Admin/Desktop/mulle-studio';
const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.mp4':'video/mp4','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.ico':'image/x-icon','.webp':'image/webp','.xml':'application/xml','.txt':'text/plain'};
function resolve(p){
  if(p.endsWith('/')) return path.join(ROOT, p, 'index.html');
  const fp = path.join(ROOT, p);
  if(fs.existsSync(fp) && fs.statSync(fp).isFile()) return fp;
  if(path.extname(fp)==='' && fs.existsSync(fp+'.html')) return fp+'.html';   // cleanUrls
  if(fs.existsSync(fp) && fs.statSync(fp).isDirectory()) return path.join(fp,'index.html');
  return fp;
}
http.createServer((req,res)=>{
  let p = decodeURIComponent(req.url.split('?')[0]); if(p==='/')p='/index.html';
  const fp = resolve(p);
  fs.readFile(fp,(e,d)=>{ if(e){res.writeHead(404);res.end('404 '+p);return;} res.writeHead(200,{'Content-Type':MIME[path.extname(fp).toLowerCase()]||'application/octet-stream'}); res.end(d); });
}).listen(4180,()=>console.log('static (cleanUrls) on 4180'));
