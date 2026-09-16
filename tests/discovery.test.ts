import { expect,it } from 'vitest';
import { createApp } from '../src/http/app.js';
const app=createApp({collect:async()=>{throw new Error('unused')},resolveDmarc:async()=>[]});

it('publishes x402scan-compatible OpenAPI payment metadata',async()=>{
 const doc:any=await (await app.request('/openapi.json')).json();
 for(const path of ['/domain/health','/domain/deep']){
  const post=doc.paths[path].post;
  expect(post.responses['402']).toBeTruthy();
  expect(post['x-payment-info'].protocols).toContain('x402');
  expect(post['x-payment-info'].price).toMatchObject({mode:'fixed',currency:'USD'});
 }
});
it('publishes well-known fan-out as absolute resource URLs',async()=>{
 const doc:any=await (await app.request('/.well-known/x402')).json();
 expect(doc.version).toBe(1);
 expect(doc.resources).toEqual([
  'https://nightfall-domain-intel-api.planet-teacher.workers.dev/domain/health',
  'https://nightfall-domain-intel-api.planet-teacher.workers.dev/domain/deep']);
});