import { describe,expect,it } from 'vitest';
import { analyzeDeep, analyzeHealth } from '../src/domain/analyze.js';
import type { DomainEvidence } from '../src/domain/collect.js';

const base:DomainEvidence={domain:'example.com',observedAt:'2026-09-16T23:00:00.000Z',dns:{
 A:['93.184.216.34'],AAAA:[],CNAME:[],MX:['10 mail.example.com.'],NS:['ns1.example.com.'],
 TXT:['v=spf1 -all','google-site-verification=x']},dnsErrors:{},web:{ok:true,status:200,finalUrl:'https://example.com/',headers:{
 hsts:'max-age=31536000',csp:"default-src 'self'",xContentTypeOptions:'nosniff',referrerPolicy:'strict-origin-when-cross-origin',permissionsPolicy:'geolocation=()'}}};

describe('domain analysis',()=>{
 it('returns concise health facts',()=>{
  const report=analyzeHealth(base);
  expect(report).toMatchObject({domain:'example.com',https:{reachable:true,status:200},mail:{mx:true,spf:true}});
 });
 it('scores explainable missing controls',()=>{
  const weak:DomainEvidence={...base,dns:{...base.dns,MX:[],TXT:[]},web:{ok:true,status:200,finalUrl:'https://example.com/',headers:{}}};
  const report=analyzeDeep(weak,[]);
  expect(report.score).toBeLessThan(100);
  expect(report.findings.map(x=>x.id)).toEqual(expect.arrayContaining(['missing_hsts','missing_spf','missing_dmarc']));
  expect(report.findings.every(x=>x.evidence.length>0)).toBe(true);
 });
});