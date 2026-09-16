import { describe,expect,it } from 'vitest';
import { isPublicIp,normalizeDomain } from '../src/domain/validate.js';

describe('normalizeDomain',()=>{
 it.each(['127.0.0.1','::1','localhost','internal','example.com:443','https://example.com','example.com/path','user@example.com','exa mple.com','-bad.com','bad-.com'])('rejects unsafe input %s',(value)=>{
  expect(()=>normalizeDomain(value)).toThrow();
 });
 it('normalizes a valid public domain',()=>expect(normalizeDomain('Example.COM.')).toBe('example.com'));
});

describe('isPublicIp',()=>{
 it.each(['127.0.0.1','10.0.0.1','172.16.0.1','192.168.1.1','169.254.1.1','100.64.0.1','192.0.2.1','224.0.0.1','0.0.0.0','::1','fc00::1','fe80::1','2001:db8::1'])('refuses non-public %s',(ip)=>expect(isPublicIp(ip)).toBe(false));
 it.each(['1.1.1.1','8.8.8.8','2606:4700:4700::1111'])('accepts public %s',(ip)=>expect(isPublicIp(ip)).toBe(true));
});