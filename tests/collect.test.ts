import { describe,expect,it,vi } from 'vitest';
import { collectDomainEvidence } from '../src/domain/collect.js';

describe('collectDomainEvidence',()=>{
 it('normalizes bounded DNS and HTTPS evidence',async()=>{
  const resolve=vi.fn(async (_d:string,type:string)=> type==='A' ? ['93.184.216.34'] : type==='MX' ? ['10 mail.example.com.'] : []);
  const fetchImpl=vi.fn(async()=>new Response('',{status:200,headers:{'strict-transport-security':'max-age=31536000','content-security-policy':"default-src 'self'"}}));
  const result=await collectDomainEvidence('Example.com',{resolve,fetch:fetchImpl as typeof fetch,now:()=>new Date('2026-09-16T23:00:00Z')});
  expect(result.domain).toBe('example.com');
  expect(result.dns.A).toEqual(['93.184.216.34']);
  expect(result.dns.MX).toEqual(['10 mail.example.com.']);
  expect(result.web).toMatchObject({ok:true,status:200,finalUrl:'https://example.com/'});
  expect(result.web.headers.hsts).toBe('max-age=31536000');
  expect(result.observedAt).toBe('2026-09-16T23:00:00.000Z');
 });

 it('refuses web fetch when DNS resolves non-public',async()=>{
  const fetchImpl=vi.fn();
  const resolve=vi.fn(async (_d:string,type:string)=> type==='A' ? ['127.0.0.1'] : []);
  await expect(collectDomainEvidence('example.com',{resolve,fetch:fetchImpl as typeof fetch})).rejects.toThrow('unsafe_destination');
  expect(fetchImpl).not.toHaveBeenCalled();
 });
 it('keeps partial DNS/HTTP failures explicit',async()=>{
  const resolve=vi.fn(async (_d:string,type:string)=>{if(type==='A')return ['93.184.216.34']; if(type==='TXT')throw new Error('dns_down'); return [];});
  const fetchImpl=vi.fn(async()=>{throw new Error('timeout');});
  const result=await collectDomainEvidence('example.com',{resolve,fetch:fetchImpl as typeof fetch});
  expect(result.dnsErrors.TXT).toBe('dns_down');
  expect(result.web.ok).toBe(false);
  expect(result.web.error).toBe('timeout');
 });
});