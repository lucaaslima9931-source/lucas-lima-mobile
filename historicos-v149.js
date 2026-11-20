/* V149: apenas estiliza outros históricos; preserva inteiramente o histórico da loja. */
(function(){'use strict';
const done=new WeakSet();
function run(){document.querySelectorAll('[role="dialog"],.ae-modal,.rh-dialog,.modal-content,.modal').forEach(function(el){
 if(done.has(el))return;
 const head=el.querySelector(':scope > header,:scope > .modal-header,:scope > div:first-child');
 if(!head)return;
 const title=(head.textContent||'').slice(0,200);
 if(!/HIST[ÓO]RICO\s+(?:DE\s+)?(?:ALTERA[ÇC][ÕO]ES|USU[ÁA]RIOS?)/i.test(title))return;
 if(/CADASTRO DA LOJA/i.test(title))return;
 const parent=el.parentElement;
 if(!parent || (!/fixed|absolute/.test(getComputedStyle(parent).position) && !el.closest('[aria-modal="true"]')))return;
 done.add(el);el.classList.add('ll-history-v149');head.classList.add('ll-history-head-v149');
 });}
let pending=false;function schedule(){if(pending)return;pending=true;requestAnimationFrame(function(){pending=false;run()})}
function init(){new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});run()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
