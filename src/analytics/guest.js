const key='poop-pr-analytics-guest-key';
let fallback;
export function guestAnalyticsKey(storage,uuid=()=>crypto.randomUUID()) {
  try{
    storage??=localStorage;
    const saved=storage.getItem(key);
    if(typeof saved==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(saved))return saved;
    const value=fallback||uuid();storage.setItem(key,value);return value;
  }catch{return fallback||=uuid();}
}
