import type { MiddlewareHandler } from 'hono';
import { paymentMiddleware } from '@x402/hono';
import { HTTPFacilitatorClient,x402ResourceServer,type FacilitatorClient,type HTTPRequestContext } from '@x402/core/server';
import type { Network } from '@x402/core/types';
import { ExactEvmScheme,registerExactEvmScheme } from '@x402/evm/exact/server';
import { declareDiscoveryExtension } from '@x402/extensions/bazaar';
import type { PaymentConfig } from './config.js';

const healthDescription='Deterministic public-domain DNS, HTTPS and mail posture report.';
const deepDescription='Deep public-domain posture report with evidence-linked security findings and score.';
export function createFacilitatorClient(url:string){return new HTTPFacilitatorClient({url,timeoutMs:90_000});}

export function createX402PaymentMiddleware(config:Extract<PaymentConfig,{enabled:true}>,facilitator?:FacilitatorClient):MiddlewareHandler{
 const client=facilitator??createFacilitatorClient(config.facilitatorUrl);
 const server=new x402ResourceServer(client); registerExactEvmScheme(server,{networks:[config.network as Network]});
 const parser=new ExactEvmScheme();
 const discovery=declareDiscoveryExtension({bodyType:'json',input:{domain:'example.com'},inputSchema:{properties:{domain:{type:'string',description:'Public domain name to analyze.'}},required:['domain'],additionalProperties:false},output:{example:{domain:'example.com',score:85,findings:[]}}});
 const unpaid=(price:string,description:string,includeDiscovery:boolean)=>async(context:HTTPRequestContext)=>{const parsed=await parser.parsePrice(price,config.network as Network);const body:any={x402Version:2,error:'Payment required',resource:{url:context.adapter.getUrl(),description,mimeType:'application/json'},accepts:[{scheme:'exact',network:config.network,amount:parsed.amount,asset:parsed.asset,payTo:config.receiver,maxTimeoutSeconds:300,extra:parsed.extra}]};if(includeDiscovery)body.extensions=discovery;return{contentType:'application/json',body};};
 const paid=(price:string,description:string)=>({accepts:[{scheme:'exact' as const,price,network:config.network as Network,payTo:config.receiver}],description,mimeType:'application/json',extensions:discovery,unpaidResponseBody:unpaid(price,description,true)});
 const probe=(price:string,description:string)=>({accepts:[{scheme:'exact' as const,price,network:config.network as Network,payTo:config.receiver}],description,mimeType:'application/json',unpaidResponseBody:unpaid(price,description,false)});
 const routes={
  'POST /domain/health':paid(config.healthPrice,healthDescription),
  'POST /domain/deep':paid(config.deepPrice,deepDescription),
  'GET /domain/health':probe(config.healthPrice,healthDescription),
  'GET /domain/deep':probe(config.deepPrice,deepDescription),
 };
 return paymentMiddleware(routes,server,undefined,undefined,true);
}
