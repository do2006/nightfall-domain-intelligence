import { isIP } from 'node:net';

export function normalizeDomain(input:string):string{
 if(typeof input!=='string')throw new Error('domain_invalid');
 const domain=input.trim().toLowerCase().replace(/\.$/,'');
 if(!domain||domain.length>253||domain.includes('/')||domain.includes('@')||domain.includes(':')||isIP(domain))throw new Error('domain_invalid');
 const labels=domain.split('.');
 if(labels.length<2)throw new Error('domain_invalid');
 for(const label of labels){if(!label||label.length>63||! /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label))throw new Error('domain_invalid');}
 return domain;
}

function ipv4Public(ip:string){const p=ip.split('.').map(Number); const [a,b]=p; if(a===0||a===10||a===127||a>=224)return false; if(a===100&&b>=64&&b<=127)return false; if(a===169&&b===254)return false; if(a===172&&b>=16&&b<=31)return false; if(a===192&&(b===168||b===0||b===2))return false; if(a===198&&(b===18||b===19||b===51))return false; if(a===203&&b===0)return false; return true;}
export function isPublicIp(ip:string):boolean{
 const kind=isIP(ip); if(kind===4)return ipv4Public(ip); if(kind!==6)return false;
 const value=ip.toLowerCase();
 if(value==='::'||value==='::1'||value.startsWith('fc')||value.startsWith('fd')||/^fe[89ab]/.test(value)||value.startsWith('ff')||value.startsWith('2001:db8:'))return false;
 return true;
}