/* BIG BROTHER — Receivable Payment History Mobile (clean rebuild) */
(async function(){
'use strict';
const SUPABASE_URL='https://sjfhlaclgmkwwofzstok.supabase.co';
const SUPABASE_KEY='sb_publishable_w762jR65CWwlO30fKQsYOw_6L9grx8S';
const SESSION_KEY='BB_SUPABASE_DEV_SESSION_V1';
const DASHBOARD='https://angsokhey11-cloud.github.io/big-brother-dashboard/';
const $=id=>document.getElementById(id);
let rows=[];
let filtered=[];
let session=null;

function readSession(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(_){return null}}
function saveSession(s){try{if(!s){localStorage.removeItem(SESSION_KEY);return}if(!s.expires_at&&s.expires_in)s.expires_at=Math.floor(Date.now()/1000)+Number(s.expires_in);localStorage.setItem(SESSION_KEY,JSON.stringify(s))}catch(_){}}
async function parse(r){const t=await r.text();let d={};try{d=t?JSON.parse(t):{}}catch(_){d={message:t}}if(!r.ok)throw new Error(d.message||d.error_description||d.error||('Request failed ('+r.status+')'));return d}
async function ensureSession(){session=readSession();if(!session?.access_token)throw new Error('Please sign in to BIG BROTHER first.');if(session.expires_at&&Number(session.expires_at)<Math.floor(Date.now()/1000)+45){if(!session.refresh_token)throw new Error('Your BIG BROTHER session has expired.');const r=await fetch(SUPABASE_URL+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token}),cache:'no-store'});session=await parse(r);saveSession(session)}return session}
async function rpc(fn,args={}){await ensureSession();let r=await fetch(SUPABASE_URL+'/rest/v1/rpc/'+fn,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify(args||{}),cache:'no-store'});if(r.status===401){await ensureSession();r=await fetch(SUPABASE_URL+'/rest/v1/rpc/'+fn,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify(args||{}),cache:'no-store'})}return parse(r)}
function key(v){return String(v||'').trim().toLowerCase()}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
function money(v,c){const k=String(c||'USD').toUpperCase()==='KHR';return (k?'៛':'$')+num(v).toLocaleString(undefined,{minimumFractionDigits:k?0:2,maximumFractionDigits:k?0:2})}

async function assertPermission(){
  const p=await rpc('bb_current_access_profile');
  if(p?.user?.isAdmin===true)return;
  const mods=Array.isArray(p?.modules)?p.modules:[];
  const grant=mods.find(x=>key(x.moduleKey)==='*')||mods.find(x=>key(x.moduleKey)==='route.ar-payment-history')||mods.find(x=>key(x.moduleKey)==='ar_payment_history');
  if(!grant||grant.canView!==true)throw new Error('You do not have permission to view Receivable Payment History.');
}

function invoiceText(r){
  const allocated=Array.isArray(r.allocatedInvoices)?r.allocatedInvoices.filter(Boolean):[];
  if(Number(r.allocationCount||0)>0||allocated.length){
    const count=Number(r.allocationCount||allocated.length||0);
    return `<span>${count} invoice${count===1?'':'s'}</span>${allocated.length?`<small>${esc(allocated.join(', '))}</small>`:''}`;
  }
  return esc(r.invoiceNo||'-');
}

function populateLocations(){
  const select=$('locationFilter');
  const current=select.value;
  const vals=[...new Set(rows.map(r=>String(r.locationCode||'').trim()).filter(Boolean))].sort();
  select.innerHTML='<option value="">All locations</option>'+vals.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
  if(vals.includes(current))select.value=current;
}

function render(){
  const q=key($('search').value);
  const loc=$('locationFilter').value;
  const method=$('methodFilter').value;
  const from=$('dateFrom').value;
  const to=$('dateTo').value;

  filtered=rows.filter(r=>{
    const date=String(r.paymentDate||'').slice(0,10);
    const hay=key([r.paymentId,r.invoiceNo,(r.allocatedInvoices||[]).join(' '),r.customer,r.locationCode,r.paymentMethod].join(' '));
    return(!q||hay.includes(q))&&(!loc||String(r.locationCode||'')===loc)&&(!method||String(r.paymentMethod||'')===method)&&(!from||date>=from)&&(!to||date<=to);
  });

  let usd=0,khr=0;
  filtered.forEach(r=>String(r.currency||'').toUpperCase()==='KHR'?khr+=num(r.amount):usd+=num(r.amount));
  $('count').textContent=filtered.length.toLocaleString();
  $('usd').textContent=money(usd,'USD');
  $('khr').textContent=money(khr,'KHR');
  $('foot').textContent=`${filtered.length} record${filtered.length===1?'':'s'}`;

  if(!filtered.length){$('body').innerHTML='<tr><td colspan="6" class="empty">No receivable payment records found.</td></tr>';return}

  $('body').innerHTML=filtered.map(r=>`<tr>
    <td class="dateCell">${esc(String(r.paymentDate||'').slice(0,10)||'-')}</td>
    <td class="invoiceCell">${invoiceText(r)}</td>
    <td class="customerCell">${esc(r.customer||'-')}</td>
    <td class="locCell">${esc(r.locationCode||'-')}</td>
    <td class="methodCell">${esc(r.paymentMethod||'-')}</td>
    <td class="amountCell">${money(r.amount,r.currency)}</td>
  </tr>`).join('');
}

async function load(){
  const btn=$('refreshBtn');
  const old=btn.textContent;
  btn.disabled=true;btn.textContent='…';
  try{
    const d=await rpc('bb_payment_history',{p_source:'receivable'});
    rows=Array.isArray(d?.payments)?d.payments:[];
    populateLocations();
    render();
  }finally{btn.disabled=false;btn.textContent=old}
}

function openFilters(){$('drawerBackdrop').classList.add('show');$('drawer').classList.add('show')}
function closeFilters(){$('drawerBackdrop').classList.remove('show');$('drawer').classList.remove('show')}
function resetFilters(){$('search').value='';$('locationFilter').value='';$('methodFilter').value='';$('dateFrom').value='';$('dateTo').value='';render()}
function showError(e){$('bootCard').innerHTML='Could not open Receivable Payment History<span>'+esc(e?.message||e||'Unknown error')+'</span>'}

$('search').addEventListener('input',render);
$('filterBtn').addEventListener('click',openFilters);
$('drawerBackdrop').addEventListener('click',closeFilters);
$('doneBtn').addEventListener('click',()=>{render();closeFilters()});
$('resetBtn').addEventListener('click',resetFilters);
$('locationFilter').addEventListener('change',render);
$('methodFilter').addEventListener('change',render);
$('dateFrom').addEventListener('change',render);
$('dateTo').addEventListener('change',render);
$('refreshBtn').addEventListener('click',()=>load().catch(showError));
$('backBtn').addEventListener('click',()=>{try{window.top.location.href=DASHBOARD}catch(_){location.href=DASHBOARD}});

try{
  await ensureSession();
  await assertPermission();
  await load();
  $('boot').classList.add('hidden');
}catch(e){console.error('Receivable Payment History Mobile:',e);showError(e)}
})();
