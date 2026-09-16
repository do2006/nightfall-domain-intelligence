import { expect,it,vi } from 'vitest';
import { createConfiguredApp } from '../src/configured-app.js';

it('gates paid routes before collection work',async()=>{
 const collect=vi.fn();
 const gate=()=>async(c:any)=>c.json({error:'Payment required'},402);
 const app=createConfiguredApp(
  {PAYMENTS_ENABLED:'true',X402_RECEIVER:'0x1111111111111111111111111111111111111111'},
  gate,collect,async()=>[]);
 const response=await app.request('/domain/health',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({domain:'example.com'})});
 expect(response.status).toBe(402);
 expect(collect).not.toHaveBeenCalled();
});