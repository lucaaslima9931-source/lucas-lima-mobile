(function(){
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function dialog(title,message,mode,initial=''){
 return new Promise(resolve=>{
  const overlay=document.createElement('div');overlay.className='erp-dialog-back';
  overlay.innerHTML=`<section class="erp-dialog" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header><strong>▣ ${esc(title)}</strong><button type="button" data-close aria-label="Fechar">×</button></header><div class="erp-dialog-body"><p>${esc(message)}</p>${mode==='prompt'?`<label>INFORME O VALOR<input class="erp-dialog-input" type="text" value="${esc(initial)}" placeholder="Digite aqui..."></label>`:''}</div><footer><button type="button" class="erp-dialog-ok">${mode==='alert'?'ENTENDI':'CONFIRMAR'}</button>${mode!=='alert'?'<button type="button" class="erp-dialog-cancel">CANCELAR</button>':''}</footer></section>`;
  const close=v=>{document.removeEventListener('keydown',key,true);overlay.remove();resolve(v)};
  const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close(mode==='confirm'?false:null)}else if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();ok()}};
  const ok=()=>close(mode==='prompt'?overlay.querySelector('input').value:mode==='confirm'?true:undefined);
  overlay.querySelector('.erp-dialog-ok').onclick=ok;
  overlay.querySelector('[data-close]').onclick=()=>close(mode==='confirm'?false:null);
  overlay.querySelector('.erp-dialog-cancel')?.addEventListener('click',()=>close(mode==='confirm'?false:null));
  document.body.appendChild(overlay);document.addEventListener('keydown',key,true);
  (overlay.querySelector('input')||overlay.querySelector('.erp-dialog-ok')).focus();
 });
}
window.erpAlert=(message,title='LUCAS LIMA — ATENÇÃO')=>dialog(title,message,'alert');
window.erpConfirm=(message,title='LUCAS LIMA — CONFIRMAÇÃO')=>dialog(title,message,'confirm');
window.erpPrompt=(message,initial='')=>dialog('LUCAS LIMA — LOCALIZAR',message,'prompt',initial);
})();
