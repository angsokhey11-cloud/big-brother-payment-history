(function(){
'use strict';
const frame=document.getElementById('paymentFrame');
if(!frame)return;
function apply(){
  let doc;
  try{doc=frame.contentDocument||frame.contentWindow.document}catch(_){return}
  if(!doc||!doc.head)return;
  let link=doc.getElementById('bb-receivable-payment-table-css');
  if(!link){
    link=doc.createElement('link');
    link.id='bb-receivable-payment-table-css';
    link.rel='stylesheet';
    doc.head.appendChild(link);
  }
  link.href='mobile-receivable-payment-table.css?v=20260915-5';

  const wrap=doc.querySelector('.tablewrap');
  const table=wrap?.querySelector('table');
  if(wrap&&table&&!wrap.querySelector('.bb-rph-grid-head')){
    const head=doc.createElement('div');
    head.className='bb-rph-grid-head';
    head.innerHTML='<div>Payment</div><div>Date</div><div>Invoice / Customer</div><div>Location / Sales</div><div>Method / Bank</div><div>Txn / Amount</div><div>Entered / Approved</div>';
    wrap.insertBefore(head,table);
  }
}
frame.addEventListener('load',function(){
  setTimeout(apply,80);
  setTimeout(apply,300);
  setTimeout(apply,900);
});
setInterval(apply,1200);
})();
