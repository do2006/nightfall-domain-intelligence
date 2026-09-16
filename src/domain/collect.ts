import { isPublicIp, normalizeDomain } from './validate.js';

export type DnsType='A'|'AAAA'|'CNAME'|'MX'|'NS'|'TXT';
export interface CollectDeps {
 resolve:(domain:string,type:DnsType)=>Promise<string[]>;
 fetch:typeof fetch;
 now?:()=>Date;
}
export interface WebEvidence {
 ok:boolean; status?:number; finalUrl?:string; error?:string;
 headers:{hsts?:string;csp?:string;xContentTypeOptions?:string;referrerPolicy?:string;permissionsPolicy?:string};
}
export interface DomainEvidence {
 domain:string; observedAt:string;
 dns:Record<DnsType,string[]>; dnsErrors:Partial<Record<DnsType,string>>;
 web:WebEvidence;
}

const TYPES:DnsType[]=['A','AAAA','CNAME','MX','NS','TXT'];
function message(error:unknown){return error instanceof Error?error.message:String(error);}
function header(response:Response,name:string){return response.headers.get(name)??undefined;}
export async function collectDomainEvidence(input:string,deps:CollectDeps):Promise<DomainEvidence>{
 const domain=normalizeDomain(input);
 const dns={A:[],AAAA:[],CNAME:[],MX:[],NS:[],TXT:[]} as Record<DnsType,string[]>;
 const dnsErrors:Partial<Record<DnsType,string>>={};
 await Promise.all(TYPES.map(async type=>{
  try{dns[type]=await deps.resolve(domain,type);}catch(error){dnsErrors[type]=message(error);}
 }));
 const addresses=[...dns.A,...dns.AAAA];
 if(addresses.some(ip=>!isPublicIp(ip)))throw new Error('unsafe_destination');
 if(addresses.length===0)throw new Error('no_public_address');
 const requested=`https://${domain}/`;
 let web:WebEvidence;
 try{
  const response=await deps.fetch(requested,{redirect:'follow',signal:AbortSignal.timeout(8_000)});
  web={ok:true,status:response.status,finalUrl:response.url||requested,headers:{
   hsts:header(response,'strict-transport-security'),csp:header(response,'content-security-policy'),
   xContentTypeOptions:header(response,'x-content-type-options'),referrerPolicy:header(response,'referrer-policy'),
   permissionsPolicy:header(response,'permissions-policy'),
  }};
 }catch(error){web={ok:false,error:message(error),headers:{}};}
 return {domain,observedAt:(deps.now?.()??new Date()).toISOString(),dns,dnsErrors,web};
}
