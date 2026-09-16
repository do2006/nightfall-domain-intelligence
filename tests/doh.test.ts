import { expect,it,vi } from 'vitest';
import { createDohResolver } from '../src/domain/doh.js';

it('resolves DNS records through the free Cloudflare JSON endpoint',async()=>{
 const fetchImpl=vi.fn(async(input:Parameters<typeof fetch>[0])=>{void input;return new Response(JSON.stringify({Status:0,Answer:[{data:'93.184.216.34'},{data:'93.184.216.35'}]}),{status:200,headers:{'content-type':'application/dns-json'}});});
 const resolve=createDohResolver(fetchImpl as typeof fetch);
 await expect(resolve('example.com','A')).resolves.toEqual(['93.184.216.34','93.184.216.35']);
 expect(String(fetchImpl.mock.calls[0][0])).toContain('cloudflare-dns.com/dns-query');
});

it('throws a bounded DNS error on HTTP failure',async()=>{
 const resolve=createDohResolver(async()=>new Response('',{status:503}) as Response);
 await expect(resolve('example.com','A')).rejects.toThrow('dns_http_503');
});