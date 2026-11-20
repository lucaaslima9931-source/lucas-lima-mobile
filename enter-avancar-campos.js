(()=>{'use strict';
function isVisible(el){return !!el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';}
function eligible(el){if(!isVisible(el)||el.disabled||el.readOnly||el.tabIndex<0)return false;if(el.matches('input'))return !['hidden','file','button','submit','reset','checkbox','radio','image','color'].includes(el.type);return el.matches('select,textarea');}
document.addEventListener('keydown',function(e){
 if(e.key!=='Enter'||e.defaultPrevented||e.isComposing||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey)return;
 const el=e.target;if(!(el instanceof HTMLElement)||!eligible(el)||el.matches('textarea'))return;
 // Dialogs (F12, confirmations, shortcut help) and the login have their own Enter behavior.
 if(el.closest('[role="dialog"],#ls-loja-modal,#erp-shortcuts-modal,#erp-demo-gate'))return;
 const app=document.querySelector('#app');if(!app||!app.contains(el))return;
 const scope=el.closest('.ls-loja,.fs-page,.pc-page,.en-page,.ae-page,form,.vt-panel,main')||app;
 const fields=[...scope.querySelectorAll('input,select,textarea')].filter(eligible);
 const i=fields.indexOf(el);if(i<0)return;
 e.preventDefault();e.stopPropagation();
 if(i+1<fields.length){fields[i+1].focus();if(fields[i+1].matches('input[type="text"],input:not([type]),input[type="number"]'))fields[i+1].select?.();}
},true);
})();
