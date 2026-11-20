/* V552 — mantém janelas e mensagens no centro da área visível, mesmo com rolagem. */
(function(){
 'use strict';
 var selectors=['[class*="overlay"]','[class*="backdrop"]','.erp-dialog-back','[role="dialog"]','[aria-modal="true"]','.modal','.modal-container'];
 var selector=selectors.join(',');
 var busy=false;
 function eligible(el){
   if(!el || el===document.body || el===document.documentElement || el.id==='app')return false;
   if(el.closest('[data-ll-viewport-modal="true"]') && el.getAttribute('data-ll-viewport-modal')!=='true')return false;
   var cs=window.getComputedStyle(el);
   if(cs.display==='none'||cs.visibility==='hidden')return false;
   var name=String(el.className||'');
   var isOverlay=/overlay|backdrop|modal-container|erp-dialog-back/i.test(name);
   return (cs.position==='fixed' || (isOverlay && cs.position==='absolute' && el.getAttribute('aria-hidden')!=='true')) && (isOverlay || el.getAttribute('role')==='dialog' || el.getAttribute('aria-modal')==='true');
 }
 function update(){
  if(busy)return;busy=true;
  try{
   document.querySelectorAll(selector).forEach(function(el){
    if(!eligible(el))return;
    if(el.parentNode!==document.body){document.body.appendChild(el);}
    el.setAttribute('data-ll-viewport-modal','true');
    el.style.setProperty('position','fixed','important');
    el.style.setProperty('inset','0','important');
    el.style.setProperty('width','100vw','important');
    el.style.setProperty('height','100dvh','important');
    el.style.setProperty('max-height','100dvh','important');
    el.style.setProperty('box-sizing','border-box','important');
    el.style.setProperty('display','flex','important');
    el.style.setProperty('align-items','center','important');
    el.style.setProperty('justify-content','center','important');
    el.style.setProperty('overflow-y','auto','important');
    el.style.setProperty('padding','16px','important');
    el.style.setProperty('z-index','999999','important');
    Array.prototype.forEach.call(el.children,function(child){
      var cc=window.getComputedStyle(child);
      if(cc.position!=='absolute' && cc.position!=='fixed'){
        child.style.setProperty('max-height','calc(100dvh - 32px)','important');
        child.style.setProperty('max-width','calc(100vw - 32px)','important');
        child.style.setProperty('box-sizing','border-box','important');
      }
    });
   });
  }finally{busy=false;}
 }
 function start(){
  update();
  var observer=new MutationObserver(function(records){
   if(busy)return;
   if(records.some(function(r){return r.type==='childList' && r.addedNodes.length;}))requestAnimationFrame(update);
  });
  observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',function(){requestAnimationFrame(update);},true);
  document.addEventListener('keydown',function(){requestAnimationFrame(update);},true);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
