/* V574 — Modal de pagamento em lote centralizado no viewport real.
   Usa o modo de iframe em tela inteira já existente (V563), sem disputar
   coordenadas com ele. Não altera a lógica financeira nem os eventos. */
(function(){
 'use strict';
 const selector='iframe[src*="folha-pagamento/"]';
 const configured=new WeakSet();
 function update(){
  document.querySelectorAll(selector).forEach(frame=>{
   try{
    const doc=frame.contentDocument;
    if(!doc||configured.has(doc))return;
    const css=doc.createElement('style');
    css.setAttribute('data-ll-batch-v574','');
    css.textContent=`
      dialog#modal.ll-batch-viewport[open]{
        position:fixed!important;top:50%!important;left:50%!important;
        right:auto!important;bottom:auto!important;margin:0!important;
        transform:translate(-50%,-50%)!important;
        width:min(760px,calc(100vw - 32px))!important;
        max-width:calc(100vw - 32px)!important;
        max-height:calc(100dvh - 32px)!important;
        overflow-y:auto!important;overscroll-behavior:contain!important;
        padding:12px!important;border-radius:10px!important;
      }
      dialog#modal.ll-batch-viewport #modalTitle{margin:0 0 12px!important;padding:13px!important;}
      dialog#modal.ll-batch-viewport .batch-list{max-height:min(32dvh,230px)!important;overflow-y:auto!important;}
      dialog#modal.ll-batch-viewport #fechar{display:inline-block!important;margin:10px 0 0 8px!important;}
      dialog#modal.ll-batch-viewport #confirmBatch{margin-top:4px!important;}
      @media(max-height:650px){
       dialog#modal.ll-batch-viewport .batch-list{max-height:18dvh!important;}
       dialog#modal.ll-batch-viewport .batch-row{padding:6px!important;}
       dialog#modal.ll-batch-viewport .batch-total{padding:8px!important;margin:6px 0!important;}
      }
    `;
    doc.head.appendChild(css);configured.add(doc);
   }catch(e){}
  });
  requestAnimationFrame(update);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',update);
 else update();
})();
