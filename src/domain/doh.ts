import type { DnsType } from './collect.js';

type DnsJson={Status?:number;Answer?:Array<{data?:string}>};
export function createDohResolver(fetchImpl:typeof fetch=fetch){
 return async(domain:string,type:DnsType):Promise<string[]>=>{
  const url=`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}`;
  const response=await fetchImpl(url,{headers:{accept:'application/dns-json'},signal:AbortSignal.timeout(5_000)});
  if(!response.ok)throw new Error(`dns_http_${response.status}`);
  const json=await response.json() as DnsJson;
  if((json.Status??0)!==0)throw new Error(`dns_status_${json.Status}`);
  return (json.Answer??[]).flatMap(answer=>typeof answer.data==='string'?[answer.data]:[]);
 };
}
