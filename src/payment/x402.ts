import type { MiddlewareHandler } from 'hono';
import { HonoAdapter,paymentMiddleware } from '@x402/hono';
import { HTTPFacilitatorClient,x402ResourceServer,type FacilitatorClient,type HTTPRequestContext } from '@x402/core/server';
import type { Network } from '@x402/core/types';
import { ExactEvmScheme,registerExactEvmScheme } from '@x402/evm/exact/server';
import { declareDiscoveryExtension } from '@x402/extensions/bazaar';
import type { PaymentConfig } from './config.js';

const healthDescription='Deterministic public-domain DNS, HTTPS and mail posture report.';
const deepDescription='Deep public-domain posture report with evidence-linked security findings and score.';
const MAX_TIMEOUT_SECONDS=60;

export function createFacilitatorClient(url:string){
 return new HTTPFacilitatorClient({url,timeoutMs:90_000});
}

export function createX402PaymentMiddleware(
 config:Extract<PaymentConfig,{enabled:true}>,
 facilitator?:FacilitatorClient,
):MiddlewareHandler{
 const client=facilitator??createFacilitatorClient(config.facilitatorUrl);
 const server=new x402ResourceServer(client);
 registerExactEvmScheme(server,{networks:[config.network as Network]});
 const parser=new ExactEvmScheme();
 const discovery=declareDiscoveryExtension({
  bodyType:'json',input:{domain:'example.com'},
  inputSchema:{properties:{domain:{type:'string',description:'Public domain name to analyze.'}},required:['domain'],additionalProperties:false},
  output:{example:{domain:'example.com',score:85,findings:[]}},
 });
 const buildChallenge=async(
  context:HTTPRequestContext,
  price:string,
  description:string,
  includeDiscovery:boolean,
 )=>{
  const parsed=await parser.parsePrice(price,config.network as Network);
  const body:Record<string,unknown>={
   x402Version:2,
   error:'Payment required',
   resource:{url:context.adapter.getUrl(),description,mimeType:'application/json'},
   accepts:[{
    scheme:'exact',network:config.network,amount:parsed.amount,asset:parsed.asset,
    payTo:config.receiver,maxTimeoutSeconds:MAX_TIMEOUT_SECONDS,extra:parsed.extra,
   }],
  };
  if(includeDiscovery)body.extensions=server.enrichExtensions(discovery,context);
  return body;
 };
 const unpaid=(price:string,description:string,includeDiscovery:boolean)=>
  async(context:HTTPRequestContext)=>({
   contentType:'application/json',
   body:await buildChallenge(context,price,description,includeDiscovery),
  });
 const paid=(price:string,description:string)=>({
  accepts:[{scheme:'exact' as const,price,network:config.network as Network,payTo:config.receiver,maxTimeoutSeconds:MAX_TIMEOUT_SECONDS}],
  description,mimeType:'application/json',extensions:discovery,
  unpaidResponseBody:unpaid(price,description,true),
 });
 const probe=(price:string,description:string)=>({
  accepts:[{scheme:'exact' as const,price,network:config.network as Network,payTo:config.receiver,maxTimeoutSeconds:MAX_TIMEOUT_SECONDS}],
  description,mimeType:'application/json',
  unpaidResponseBody:unpaid(price,description,false),
 });
 const routes={
  'POST /domain/health':paid(config.healthPrice,healthDescription),
  'POST /domain/deep':paid(config.deepPrice,deepDescription),
  'GET /domain/health':probe(config.healthPrice,healthDescription),
  'GET /domain/deep':probe(config.deepPrice,deepDescription),
 };
 const protocolMiddleware=paymentMiddleware(routes,server,undefined,undefined,false);
 let facilitatorInitialization:Promise<void>|null=null;

 const ensureFacilitatorInitialized=async()=>{
  if(!facilitatorInitialization){
   facilitatorInitialization=server.initialize().catch(error=>{
    facilitatorInitialization=null;
    throw error;
   });
  }
  await facilitatorInitialization;
 };

 const challengeFor=async(context:HTTPRequestContext)=>{
  const route=`${context.method.toUpperCase()} ${context.path}`;
  switch(route){
   case 'POST /domain/health': return buildChallenge(context,config.healthPrice,healthDescription,true);
   case 'POST /domain/deep': return buildChallenge(context,config.deepPrice,deepDescription,true);
   case 'GET /domain/health': return buildChallenge(context,config.healthPrice,healthDescription,false);
   case 'GET /domain/deep': return buildChallenge(context,config.deepPrice,deepDescription,false);
   default:return null;
  }
 };
 return async(c,next)=>{
  const paymentHeader=c.req.header('payment-signature')||c.req.header('x-payment');
  const context:HTTPRequestContext={
   adapter:new HonoAdapter(c),
   path:c.req.path,
   method:c.req.method,
   ...(paymentHeader?{paymentHeader}:{}),
  };
  const challenge=await challengeFor(context);
  if(challenge&&!paymentHeader){
   c.header('payment-required',Buffer.from(JSON.stringify(challenge),'utf8').toString('base64'));
   c.header('Cache-Control','no-store');
   return c.json(challenge,402);
  }
  if(challenge&&paymentHeader){
   try{await ensureFacilitatorInitialized();}
   catch(error){
    console.error('Failed to initialize x402 facilitator for paid request:',error);
    return c.json({error:'Payment facilitator unavailable.'},502);
   }
  }
  return protocolMiddleware(c,next);
 };
}
