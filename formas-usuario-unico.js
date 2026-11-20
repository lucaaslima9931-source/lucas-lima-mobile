/* V157: somente Formas de Pagamento. Preserva #fp-user e remove campos de auditoria extras. */
(()=>{
 'use strict';
 function clean(){
  const page=document.querySelector('#app .fp-page');
  if(!page)return;
  const keep=page.querySelector('#fp-user');
  if(!keep)return;
  for(const label of Array.from(page.querySelectorAll('label'))){
   if(label.contains(keep))continue;
   const first=Array.from(label.childNodes).filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ').trim().toUpperCase();
   if(/^USU[AÁ]RIO\s*:?$/.test(first)){
    const wrapper=label.closest('.pc-userline,[data-user-audit],.erp-user-next-to-field');
    (wrapper && !wrapper.contains(keep) ? wrapper : label).remove();
   }
  }
  for(const extra of Array.from(page.querySelectorAll('.pc-userline,[data-user-audit]'))){
   if(!extra.contains(keep))extra.remove();
  }
 }
 let pending=false;
 const observer=new MutationObserver(()=>{
  if(pending)return;
  pending=true;
  requestAnimationFrame(()=>{pending=false;clean()});
 });
 document.addEventListener('DOMContentLoaded',()=>{
  observer.observe(document.querySelector('#app'),{childList:true,subtree:true});
  clean();
 });
})();
