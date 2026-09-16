import type { DomainEvidence } from './collect.js';

export interface Finding { id:string; severity:'low'|'medium'|'high'; summary:string; evidence:string[]; deduction:number; }

function hasPrefix(values:string[],prefix:string){return values.some(v=>v.toLowerCase().startsWith(prefix));}
export function analyzeHealth(e:DomainEvidence){
 return {
  domain:e.domain, observedAt:e.observedAt,
  https:{reachable:e.web.ok,status:e.web.status,finalUrl:e.web.finalUrl},
  dns:{a:e.dns.A.length>0,aaaa:e.dns.AAAA.length>0,ns:e.dns.NS.length>0},
  mail:{mx:e.dns.MX.length>0,spf:hasPrefix(e.dns.TXT,'v=spf1')},
 };
}

export function analyzeDeep(e:DomainEvidence,dmarc:string[]){
 const findings:Finding[]=[];
 const add=(id:string,severity:Finding['severity'],summary:string,evidence:string[],deduction:number)=>findings.push({id,severity,summary,evidence,deduction});
 if(!e.web.ok)add('https_unreachable','high','HTTPS could not be reached.',[e.web.error??'https_unreachable'],25);
 if(e.web.ok&&!e.web.headers.hsts)add('missing_hsts','medium','HSTS header was not observed.',[`hsts=${String(e.web.headers.hsts)}`],10);
 if(!hasPrefix(e.dns.TXT,'v=spf1'))add('missing_spf','medium','SPF record was not observed.',[`txt=${JSON.stringify(e.dns.TXT)}`],10);
 if(!hasPrefix(dmarc,'v=dmarc1'))add('missing_dmarc','medium','DMARC record was not observed.',[`dmarc=${JSON.stringify(dmarc)}`],12);
 if(e.dns.MX.length===0)add('missing_mx','low','No MX record was observed.',[`mx=${JSON.stringify(e.dns.MX)}`],5);
 if(e.web.ok&&!e.web.headers.csp)add('missing_csp','low','Content-Security-Policy header was not observed.',[`csp=${String(e.web.headers.csp)}`],5);
 const deduction=findings.reduce((sum,f)=>sum+f.deduction,0);
 return {
  ...analyzeHealth(e),
  dmarc:{present:hasPrefix(dmarc,'v=dmarc1'),records:dmarc},
  score:Math.max(0,100-deduction),
  findings,
  evidence:{dns:e.dns,dnsErrors:e.dnsErrors,web:e.web},
 };
}
