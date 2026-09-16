import type { MiddlewareHandler } from 'hono';
import { collectDomainEvidence,type DomainEvidence } from './domain/collect.js';
import { createDohResolver } from './domain/doh.js';
import { createApp } from './http/app.js';
import { loadPaymentConfig,type PaymentConfig,type PaymentEnv } from './payment/config.js';
import { createX402PaymentMiddleware } from './payment/x402.js';

type Enabled=Extract<PaymentConfig,{enabled:true}>;
type Factory=(config:Enabled)=>MiddlewareHandler;
type Collector=(domain:string)=>Promise<DomainEvidence>;
type Dmarc=(domain:string)=>Promise<string[]>;

export function createConfiguredApp(env:PaymentEnv,factory:Factory=createX402PaymentMiddleware,collector?:Collector,dmarc?:Dmarc){
 const resolver=createDohResolver(fetch);
 const collect=collector??((domain:string)=>collectDomainEvidence(domain,{resolve:resolver,fetch}));
 const resolveDmarc=dmarc??((domain:string)=>resolver(`_dmarc.${domain}`,'TXT'));
 const payment=loadPaymentConfig(env);
 return createApp({collect,resolveDmarc,paymentMiddleware:payment.enabled?factory(payment):undefined});
}
