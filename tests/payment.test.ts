import { describe,expect,it } from 'vitest';
import { loadPaymentConfig } from '../src/payment/config.js';

const receiver='0x1111111111111111111111111111111111111111';
describe('payment config',()=>{
 it('fails closed without receiver',()=>expect(loadPaymentConfig({PAYMENTS_ENABLED:'true'})).toMatchObject({enabled:false,reason:'missing_receiver'}));
 it('uses Base USDC prices',()=>expect(loadPaymentConfig({PAYMENTS_ENABLED:'true',X402_RECEIVER:receiver})).toMatchObject({enabled:true,network:'eip155:8453',healthPrice:'$0.005',deepPrice:'$0.03'}));
});