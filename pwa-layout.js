
/* LUCAS LIMA — instalação PWA e ajuste real à altura útil do aplicativo. */
(function(){
 'use strict';
 if ('serviceWorker' in navigator && (location.protocol==='https:' || location.hostname==='localhost' || location.hostname==='127.0.0.1')) {
   window.addEventListener('load',function(){navigator.serviceWorker.register('./sw.js').catch(function(e){console.warn('PWA indisponível:',e.message)})});
 }
 // Ajusta o cadastro da loja à área realmente disponível, inclusive em janela instalada.
 // Evita ocultar campos; se a janela for muito pequena, a rolagem permanece acessível.
 var lastPanel=null, resizeObserver=null, queued=false;
 function adjust(){
   queued=false;
   var panel=document.querySelector('.ls-loja');
   if(!panel || !panel.isConnected) return;
   // Nunca ampliar a largura para compensar a redução de altura.
   panel.style.removeProperty('zoom');
   panel.style.removeProperty('width');
   panel.style.removeProperty('transform');
   panel.style.maxWidth='100%';
 }
 function queue(){if(!queued){queued=true;requestAnimationFrame(adjust)}}
 window.addEventListener('resize',queue);
 document.addEventListener('click',function(){setTimeout(queue,50)},true);
 if(typeof MutationObserver!=='undefined'){
  var mo=new MutationObserver(function(){queue()});
  mo.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
 }
 queue();
})();
/* Ao entrar no Cadastro da Loja, mostrar sempre o cabeçalho desde o início. */
(function(){
 let last=null;
 const workspace=()=>document.querySelector('.workspace');
 const observe=new MutationObserver(()=>{
   const panel=document.querySelector('.ls-loja');
   if(panel && panel!==last){last=panel;const area=workspace();if(area)area.scrollTop=0;}
   if(!panel)last=null;
 });
 const app=document.getElementById('app');if(app)observe.observe(app,{childList:true,subtree:true});
})();
