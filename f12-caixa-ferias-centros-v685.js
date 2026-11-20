/* V685 — F12 em Caixa, Férias e Centros de Custos, inclusive com foco fora do iframe. */
(function(){'use strict';
function activeDialog(){return !!document.querySelector('[role="dialog"][aria-modal="true"],dialog[open],#ll-ferias-f12-v632,#cc-localizar-f12,.cx-shortcut-overlay,.erp-overlay,.erp-modal-overlay,#erp-shortcuts-modal');}
window.addEventListener('keydown',function(e){
 if(e.key!=='F12'||e.repeat||e.ctrlKey||e.altKey||e.metaKey||activeDialog())return;
 const frame=document.querySelector('iframe[src*="ferias/index.html"]');
 if(frame&&frame.isConnected&&frame.getClientRects().length){
   // Se o foco está no iframe, seu próprio listener já encaminha o F12.
   if(document.activeElement===frame)return;
   e.preventDefault();e.stopImmediatePropagation();frame.contentWindow?.postMessage({type:'LL_FERIAS_F12_TRIGGER_V685'},'*');return;
 }
 if(document.querySelector('#app .cx-dashboard')){
   if(typeof window.LucasLimaCaixaLocalizarF12!=='function')return;
   e.preventDefault();e.stopImmediatePropagation();window.LucasLimaCaixaLocalizarF12();return;
 }
 if(document.querySelector('.cc-page .cc-launch')){
   if(typeof window.LucasLimaCentrosAtalhos?.localizar!=='function')return;
   e.preventDefault();e.stopImmediatePropagation();window.LucasLimaCentrosAtalhos.localizar();
 }
},true);
})();
