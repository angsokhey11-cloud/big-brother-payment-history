/* BIG BROTHER — Payment History Supabase Adapter V1 */
(function(){
  'use strict';
  const URL='https://sjfhlaclgmkwwofzstok.supabase.co';
  const KEY='sb_publishable_w762jR65CWwlO30fKQsYOw_6L9grx8S';
  const SESSION_KEY='BB_SUPABASE_DEV_SESSION_V1';
  let session=null;

  function resolveSource(){
    let module='';
    try{module=new URLSearchParams(parent.location.search).get('module')||''}catch(_){}
    if(module==='ar-payment-history')return'receivable';
    if(module==='payment-history')return'invoice';
    const own=new URLSearchParams(location.search);
    return String(own.get('type')||'invoice').toLowerCase()==='receivable'?'receivable':'invoice';
  }
  function readSession(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(_){return null}}
  function saveSession(s){session=s||null;try{if(!s){localStorage.removeItem(SESSION_KEY);return}if(!s.expires_at&&s.expires_in)s.expires_at=Math.floor(Date.now()/1000)+Number(s.expires_in);localStorage.setItem(SESSION_KEY,JSON.stringify(s))}catch(_){}}
  async function parse(r){const t=await r.text();let d={};try{d=t?JSON.parse(t):{}}catch(_){d={message:t}}if(!r.ok)throw new Error(d.message||d.error_description||d.error||('Payment History request failed ('+r.status+')'));return d}
  async function refreshSession(){const s=readSession();if(!s?.refresh_token)throw new Error('Please sign in to BIG BROTHER first.');const r=await fetch(URL+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})});const next=await parse(r);saveSession(next);return next}
  async function ensureSession(){session=readSession();if(!session?.access_token)throw new Error('Please sign in to BIG BROTHER first.');if(session.expires_at&&Number(session.expires_at)<Math.floor(Date.now()/1000)+30)await refreshSession();return session}
  async function rpc(fn,args={}){await ensureSession();const r=await fetch(URL+'/rest/v1/rpc/'+fn,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify(args||{}),cache:'no-store'});return parse(r)}
  function parseInvoiceNos(v){if(Array.isArray(v))return v;if(typeof v!=='string'||!v.trim())return[];try{const x=JSON.parse(v);return Array.isArray(x)?x:[]}catch(_){return[]}}
  async function api(params={}){const action=String(params.action||'');const source=String(params.source||resolveSource()).toLowerCase()==='receivable'?'receivable':'invoice';if(action==='invoiceHistoryRevision'){const revision=await rpc('bb_payment_history_revision',{p_source:source});return{success:true,revision:String(revision||'')}}if(action==='paymentHistory')return rpc('bb_payment_history',{p_source:source});if(action==='salesCreditSummary')return rpc('bb_payment_history_credit_summary',{p_invoice_nos:parseInvoiceNos(params.invoiceNos)});throw new Error('Unsupported Payment History action: '+action)}
  async function profile(){return rpc('bb_current_access_profile')}
  async function signOut(){const s=readSession();try{if(s?.access_token)await fetch(URL+'/auth/v1/logout',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+s.access_token}})}catch(_){}saveSession(null)}
  window.BBPaymentHistoryAdapter={rpc,api,profile,ensureSession,signOut,resolveSource};
})();