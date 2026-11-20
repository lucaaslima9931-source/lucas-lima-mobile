/* V573 — Alinha o pagamento em lote ao viewport principal sem mover o iframe
   nem recarregar a folha. Mantém os elementos e seus eventos originais. */
(function(){
 'use strict';
 function align(){
  document.querySelectorAll('iframe[src*="folha-pagamento/"]').forEach(frame=>{
   try{
    const doc=frame.contentDocument;
    const modal=doc&&doc.querySelector('dialog#modal.ll-batch-viewport');
    if(!modal)return;
    if(!modal.open){modal.classList.remove('ll-batch-viewport');return;}
    const rect=frame.getBoundingClientRect();
    // Coordenadas do centro do navegador convertidas para o viewport do iframe.
    const x=window.innerWidth/2-rect.left;
    const y=window.innerHeight/2-rect.top;
    modal.style.setProperty('position','fixed','important');
    modal.style.setProperty('left',x+'px','important');
    modal.style.setProperty('top',y+'px','important');
    modal.style.setProperty('right','auto','important');
    modal.style.setProperty('bottom','auto','important');
    modal.style.setProperty('margin','0','important');
    modal.style.setProperty('transform','translate(-50%, -50%)','important');
    modal.style.setProperty('max-height','calc(100dvh - 32px)','important');
    modal.style.setProperty('overflow-y','auto','important');
   }catch(e){}
  });
  requestAnimationFrame(align);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',align);
 else align();
})();
