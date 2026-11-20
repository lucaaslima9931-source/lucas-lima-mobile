(()=>{
'use strict';
const labelText=el=>(el?.childNodes?.[0]?.textContent||el?.textContent||'').trim().toUpperCase().replace(/\s+/g,' ');
let working=false,queued=false;
function adjust(){
 if(working)return;working=true;
 try{
  const root=document.querySelector('#app');if(!root)return;
  // Formas de Pagamento: preservar o campo nativo e retirar apenas o extra.
  // Esta rotina usa o observador já existente, sem criar observadores recursivos.
  const payment=root.querySelector('.fp-page');
  if(payment){
   const native=payment.querySelector('#fp-user');
   if(native){
    const nativeLabel=native.closest('label');
    for(const label of [...payment.querySelectorAll('label')]){
     if(label===nativeLabel || label.contains(native))continue;
     const name=(label.childNodes[0]?.textContent||'').trim().toUpperCase().replace(/\s+/g,' ');
     if(name==='USUÁRIO'||name==='USUARIO'){
      const wrapper=label.closest('.pc-userline,[data-user-audit],.vt-user-field,.erp-user-next-to-field');
      (wrapper&&!wrapper.contains(native)?wrapper:label).remove();
     }
    }
    for(const extra of [...payment.querySelectorAll('.pc-userline,[data-user-audit],.vt-user-field,.erp-user-next-to-field')]){
     if(!extra.contains(native))extra.remove();
    }
   }
   return;
  }
  // Cadastro da Loja ja posiciona USUARIO ao lado de E-MAIL; nao o mover.
  if(root.querySelector('.ls-loja'))return;
  // ORÇAMENTOS possui campo USUÁRIO próprio no cabeçalho; não reposicionar.
  if(root.querySelector('.or-page'))return;
  const heading=(root.querySelector('h1')?.textContent||'').trim().toUpperCase();
  const isOverview=['INÍCIO','CADASTROS','VENDAS','COMPRAS','ESTOQUE','FINANCEIRO','ADMINISTRATIVO','RELATÓRIOS','CONFIGURAÇÕES','CAIXA'].includes(heading)
   ||(!!root.querySelector('.module-cards,.module-grid')&&!root.querySelector('input[id]'));
  const auto=[...root.querySelectorAll('.pc-userline,[data-user-audit],.vt-user-field')];
  if(isOverview){auto.forEach(x=>x.remove());root.querySelectorAll('label').forEach(l=>{if(labelText(l)==='USUÁRIO'&&!l.closest('header,.topbar,nav,aside'))l.remove();});return;}
  // Funcionários já possui campo USUÁRIO próprio com histórico funcional.
  // Não permitir que a auditoria genérica acrescente um segundo campo.
  if(root.querySelector('.rh-employee-screen')){
   const page=root.querySelector('.rh-employee-screen');
   const keep=page.querySelector('#rh-usuario')?.closest('label');
   page.querySelectorAll('label').forEach(el=>{
    if(el!==keep&&el.querySelector('input')&&/^USUÁRIO\s*$/i.test(labelText(el)))el.remove();
   });
   page.querySelectorAll('.pc-userline,[data-user-audit],.vt-user-field,.erp-user-next-to-field').forEach(el=>{
    if(el!==keep&&!el.contains(keep))el.remove();
   });
   return;
  }
  if(root.querySelector('#al-user')){
   root.querySelectorAll('.pc-userline,[data-user-audit],.vt-user-field,.erp-user-next-to-field').forEach(el=>el.remove());
   root.querySelectorAll('label').forEach(el=>{if(el.querySelector('input')&&labelText(el)==='USUÁRIO'&&el.querySelector('input')?.id!=='al-user')el.remove()});
   return;
  }
  if(root.querySelector('.fin-page')){auto.forEach(el=>el.remove());return;}
  // O acerto já possui USUÁRIO na primeira linha. Eliminar qualquer inserção extra.
  if(root.querySelector('.ae-page')){
   const page=root.querySelector('.ae-page');
   page.querySelectorAll('.pc-userline,[data-user-audit],.vt-user-field,.erp-user-next-to-field').forEach(el=>el.remove());
   const keep=page.querySelector('.ae-card .ae-grid > label:nth-child(4)');
   page.querySelectorAll('label').forEach(el=>{
    if(el!==keep && labelText(el)==='USUÁRIO')el.remove();
   });
   return;
  }
  if(root.querySelector('.pc-page,.en-page'))return;
  // Trocas: the user and status belong to VENDA ORIGINAL, not above the buttons.
  if(root.querySelector('#tr-status')){
   root.querySelectorAll('.pc-userline,[data-user-audit]').forEach(el=>{if(!el.contains(root.querySelector('#tr-user')))el.remove()});
   auto.filter(x=>!x.closest('.vt-panel')).forEach(x=>x.remove());
   // Manter somente o USUÁRIO da VENDA ORIGINAL; retirar o duplicado fora do painel.
   root.querySelectorAll('label').forEach(el=>{
    if(el.querySelector('input')?.id==='tr-user')return;
    if(labelText(el)==='USUÁRIO' && !el.closest('header,.topbar,nav,aside')){
     const wrapper=el.closest('.pc-userline,[data-user-audit],.erp-user-next-to-field');
     (wrapper && !wrapper.contains(root.querySelector('#tr-user')) ? wrapper : el).remove();
    }
   });
   const input=root.querySelector('#tr-user');if(input)input.value=document.querySelector('.top-user strong')?.textContent?.trim()||input.value||'DEMONSTRAÇÃO';
   return;
  }
  // V440: Cadastro de Clientes — USUÁRIO ao lado de SITUAÇÃO.
  const clientPage=root.querySelector('.client-employee-layout');
  if(clientPage){
    const clientFields=clientPage.querySelector('.product-fields');
    const clientStatus=clientFields?.querySelector('#c-status')?.closest('label');
    const clientUser=clientFields?.querySelector('#c-user')?.closest('label');
    const clientNotes=clientFields?.querySelector('#c-note')?.closest('label');
    if(clientStatus&&clientUser&&clientNotes){
      if(clientStatus.nextElementSibling!==clientUser)clientStatus.insertAdjacentElement('afterend',clientUser);
      if(clientUser.nextElementSibling!==clientNotes)clientUser.insertAdjacentElement('afterend',clientNotes);
      clientUser.style.gridColumn='span 3';
      clientNotes.style.gridColumn='span 12';
      clientUser.classList.remove('erp-user-next-to-field');
      clientNotes.classList.add('erp-wide-observations');
      return;
    }
  }
  const labels=[...root.querySelectorAll('label')];
  const obs=labels.find(x=>/^OBSERVAÇÕES$/.test(labelText(x)));
  const vendedor=labels.find(x=>/^VENDEDOR(?:\s*\(OPCIONAL\))?$/.test(labelText(x)));
  const target=(/ORÇAMENTOS/.test(heading)&&vendedor)?vendedor:obs;
  if(!target)return;
  const users=labels.filter(x=>/^USUÁRIO$/.test(labelText(x))&&x.querySelector('input')&&!x.closest('header,nav,aside,.topbar'));
  const candidates=[...new Set([...auto,...users])].filter(x=>x.isConnected);
  let user=candidates.find(x=>x.querySelector('input')?.value?.trim())||candidates[0];
  if(!user)return;
  // If a wrapper holds the user label, move the wrapper as a single field.
  if(user.matches('label')&&user.parentElement?.matches('.pc-userline,[data-user-audit],.vt-user-field'))user=user.parentElement;
  const parent=target.parentElement;
  if(!parent)return;
  // Move the user field directly after observations (or vendor for quotations).
  if(user!==target&&user.previousElementSibling!==target){target.insertAdjacentElement('afterend',user)}
  user.classList.add('erp-user-next-to-field');
  target.classList.add('erp-wide-observations');
  for(const extra of candidates){if(extra!==user&&!extra.contains(user)&&extra.matches('.pc-userline,[data-user-audit]'))extra.remove()}
 }finally{working=false;}
}
const obs=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;adjust()})});
window.addEventListener('DOMContentLoaded',()=>{obs.observe(document.querySelector('#app')||document.body,{subtree:true,childList:true});adjust()});
})();
