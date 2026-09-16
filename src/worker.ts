import { createConfiguredApp } from './configured-app.js';
import type { PaymentEnv } from './payment/config.js';

let key=''; let app:ReturnType<typeof createConfiguredApp>|undefined;
function appFor(env:PaymentEnv){
 const next=[env.PAYMENTS_ENABLED??'',env.X402_RECEIVER??'',env.X402_FACILITATOR_URL??'',env.X402_NETWORK??'',env.X402_HEALTH_PRICE??'',env.X402_DEEP_PRICE??''].join('|');
 if(!app||next!==key){app=createConfiguredApp(env);key=next;}
 return app;
}
export default {async fetch(request:Request,env:PaymentEnv,ctx:unknown):Promise<Response>{return await appFor(env).fetch(request,env,ctx as never);}};
