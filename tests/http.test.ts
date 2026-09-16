import { describe,expect,it,vi } from 'vitest';
import type { MiddlewareHandler } from 'hono';
import { createApp } from '../src/http/app.js';
import type { DomainEvidence } from '../src/domain/collect.js';

const evidence:DomainEvidence={domain:'example.com',observedAt:'2026-09-16T23:00:00.000Z',dns:{A:['93.184.216.34'],AAAA:[],CNAME:[],MX:[],NS:[],TXT:[]},dnsErrors:{},web:{ok:true,status:200,finalUrl:'https://example.com/',headers:{}}};

describe('HTTP API',()=>{
 it('keeps health and demo free',async()=>{
  const app=createApp({collect:async()=>evidence,resolveDmarc:async()=>[]});
  expect((await app.request('/health')).status).toBe(200);
  expect((await app.request('/demo')).status).toBe(200);
 });
 it('returns a health report for a domain',async()=>{
  const app=createApp({collect:async()=>evidence,resolveDmarc:async()=>[]});
  const r=await app.request('/domain/health',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({domain:'example.com'})});
  expect(r.status).toBe(200); expect(await r.json()).toMatchObject({domain:'example.com'});
 });
 it('gates paid work before collection',async()=>{
  const collect=vi.fn(async()=>evidence); const gate:MiddlewareHandler=async c=>c.json({error:'payment required'},402);
  const app=createApp({collect,resolveDmarc:async()=>[],paymentMiddleware:gate});
  const r=await app.request('/domain/deep',{method:'POST',headers:{'content-type':'application/json'},body:'{"domain":"example.com"}'});
  expect(r.status).toBe(402); expect(collect).not.toHaveBeenCalled();
 });
});
it('exposes free machine discovery',async()=>{
 const app=createApp({collect:async()=>evidence,resolveDmarc:async()=>[]});
 const open=await app.request('/openapi.json'); expect(open.status).toBe(200);
 const spec=await open.json() as {paths:Record<string,unknown>};
 expect(spec.paths['/domain/health']).toBeTruthy(); expect(spec.paths['/domain/deep']).toBeTruthy();
 const known=await app.request('/.well-known/x402'); expect(known.status).toBe(200);
 const manifest=await known.json() as {resources:unknown[]}; expect(manifest.resources).toHaveLength(2);
});