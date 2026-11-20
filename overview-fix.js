(()=>{'use strict';
let scheduled=false;
function clean(){
 const workspace=document.querySelector('#workspace')||document.querySelector('#app');
 if(!workspace)return;
 const overview=workspace.querySelector('.modern-module.module-screen');
 if(!overview)return;
 // A página de escolha de módulos não deve conter campos de auditoria.
 for(const el of [...overview.querySelectorAll('.pc-userline,[data-user-audit],.vt-user-field,.erp-user-next-to-field')])el.remove();
 for(const label of [...overview.querySelectorAll('label')]){
   if((label.textContent||'').trim().toUpperCase().startsWith('USUÁRIO')){
     const wrapper=label.closest('.pc-userline,[data-user-audit],.vt-user-field');
     (wrapper||label).remove();
   }
 }
 // Alguns módulos inseriam o campo imediatamente depois do título, fora do painel.
 const app=document.querySelector('#app');
 if(app){for(const el of [...app.querySelectorAll('.pc-userline,[data-user-audit]')]){
   if(!el.closest('header,.topbar')&&!el.closest('.module-screen:not(.modern-module)'))el.remove();
 }}
}
function init(){const root=document.querySelector('#app')||document.body;new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;clean()})}).observe(root,{childList:true,subtree:true});clean()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
