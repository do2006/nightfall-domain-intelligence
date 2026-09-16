import { describe,expect,it } from 'vitest';
import { Hono } from 'hono';
import type { FacilitatorClient } from '@x402/core/server';
import { createX402PaymentMiddleware } from '../src/payment/x402.js';

const facilitator:FacilitatorClient={async getSupported(){return{kinds:[{x402Version:2,scheme:'exact',network:'eip155:8453'}],extensions:['bazaar'],signers:{'eip155:*':['0x2222222222222222222222222222222222222222']}};},async verify(){throw new Error('not reached');},async settle(){throw new Error('not reached');}};
const config={enabled:true as const,receiver:'0x1111111111111111111111111111111111111111',facilitatorUrl:'https://example.invalid',network:'eip155:8453',healthPrice:'$0.005',deepPrice:'$0.03'};

describe('x402 prices',()=>{
 for(const [path,amount] of [['/domain/health','5000'],['/domain/deep','30000']] as const){it(`${path} quotes ${amount}`,async()=>{const app=new Hono();app.use(path,createX402PaymentMiddleware(config,facilitator));app.post(path,c=>c.json({ok:true}));const r=await app.request(path,{method:'POST',headers:{'content-type':'application/json'},body:'{"domain":"example.com"}'});expect(r.status).toBe(402);const h=r.headers.get('payment-required');expect(h).toBeTruthy();const d=JSON.parse(Buffer.from(h!,'base64').toString('utf8'));expect(d.accepts[0]).toMatchObject({network:'eip155:8453',amount,payTo:config.receiver});expect(d.resource).toEqual(expect.objectContaining({url:expect.any(String),description:expect.any(String),mimeType:'application/json'}));expect(d.resource.serviceName).toBeUndefined();expect(d.resource.tags).toBeUndefined();});}
});