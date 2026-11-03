import { readFileSync, realpathSync } from 'node:fs'
import { resolve, sep, extname } from 'node:path'

const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'}
export function serveStaticWeb(root,pathname,res){
  const base=realpathSync(root)
  let filename=resolve(base,`.${decodeURIComponent(pathname)}`)
  if(filename!==base&&!filename.startsWith(base+sep))return false
  if(pathname==='/'||!extname(pathname))filename=resolve(base,'index.html')
  try{
    filename=realpathSync(filename)
    if(!filename.startsWith(base+sep))return false
    const type=mime[extname(filename)]
    if(!type)return false
    const bytes=readFileSync(filename)
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'")
    res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(bytes);return true
  }catch{return false}
}
