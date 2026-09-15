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
  link.href='mobile-receivable-payment-table.css?v=20260915-4';
}
frame.addEventListener('load',function(){
  setTimeout(apply,80);
  setTimeout(apply,300);
  setTimeout(apply,900);
});
setTimeout(apply,1400);
})();
