import { Hono,type Context,type MiddlewareHandler } from 'hono';
import { analyzeDeep,analyzeHealth } from '../domain/analyze.js';
import type { DomainEvidence } from '../domain/collect.js';

export interface AppDeps{
 collect:(domain:string)=>Promise<DomainEvidence>;
 resolveDmarc:(domain:string)=>Promise<string[]>;
 paymentMiddleware?:MiddlewareHandler;
}

const openApi={openapi:'3.1.0',info:{title:'NightFall Domain Intelligence',version:'0.1.0'},paths:{
 '/domain/health':{post:{summary:'Domain health posture',responses:{'402':{description:'Payment required'}},'x-payment-info':{protocols:['x402'],price:{mode:'fixed',currency:'USD',amount:'0.005'}},requestBody:{required:true,content:{'application/json':{schema:{type:'object',properties:{domain:{type:'string'}},required:['domain']}}}}}},
 '/domain/deep':{post:{summary:'Deep domain posture',responses:{'402':{description:'Payment required'}},'x-payment-info':{protocols:['x402'],price:{mode:'fixed',currency:'USD',amount:'0.03'}},requestBody:{required:true,content:{'application/json':{schema:{type:'object',properties:{domain:{type:'string'}},required:['domain']}}}}}},
}};
const manifest={version:1,resources:[
 'https://nightfall-domain-intel-api.planet-teacher.workers.dev/domain/health',
 'https://nightfall-domain-intel-api.planet-teacher.workers.dev/domain/deep',
]};

async function domainFromRequest(c:Context){
 let body:unknown; try{body=await c.req.json();}catch{return null;}
 if(!body||typeof body!=='object')return null;
 const domain=(body as Record<string,unknown>).domain;
 return typeof domain==='string'&&domain.length>0?domain:null;
}
export function createApp(deps:AppDeps){
 const app=new Hono();
 app.use('*',async(c,next)=>{c.header('Access-Control-Allow-Origin','*');c.header('Access-Control-Allow-Methods','GET,POST,OPTIONS');c.header('Access-Control-Allow-Headers','content-type,payment-signature,x-payment');c.header('Access-Control-Expose-Headers','payment-required,payment-response,x-payment-response');if(c.req.method==='OPTIONS')return c.body(null,204);await next();});
 app.get('/',c=>c.json({service:'NightFall Domain Intelligence',network:'Base',asset:'USDC',resources:[{method:'POST',path:'/domain/health',price:'0.005 USDC'},{method:'POST',path:'/domain/deep',price:'0.03 USDC'}]}));
 app.get('/health',c=>c.json({ok:true,service:'nightfall-domain-intelligence',version:'0.1.0'}));
 app.get('/demo',c=>c.json({domain:'example.com',purpose:'deterministic DNS, HTTPS, mail and security-header posture'}));
 app.get('/openapi.json',c=>c.json(openApi));
 app.get('/.well-known/x402',c=>c.json(manifest));
 app.get('/.well-known/x402-manifest.json',c=>c.json(manifest));
 if(deps.paymentMiddleware){app.use('/domain/health',deps.paymentMiddleware);app.use('/domain/deep',deps.paymentMiddleware);}
 app.post('/domain/health',async c=>{const domain=await domainFromRequest(c);if(!domain)return c.json({error:'domain_required'},400);try{return c.json(analyzeHealth(await deps.collect(domain)));}catch(error){return c.json({error:error instanceof Error?error.message:'analysis_failed'},400);}});
 app.post('/domain/deep',async c=>{const domain=await domainFromRequest(c);if(!domain)return c.json({error:'domain_required'},400);try{const evidence=await deps.collect(domain);const dmarc=await deps.resolveDmarc(evidence.domain);return c.json(analyzeDeep(evidence,dmarc));}catch(error){return c.json({error:error instanceof Error?error.message:'analysis_failed'},400);}});
 return app;
}
