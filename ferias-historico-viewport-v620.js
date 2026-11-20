/* V620: Histórico de alterações de Férias no viewport do index.html. */
(function(){
 'use strict';
 var overlay=null,previous=null;
 function close(){
  if(!overlay)return;
  overlay.remove();overlay=null;
  if(previous&&previous.isConnected){try{previous.focus()}catch(e){}}
  previous=null;
 }
 function open(title,content){
  close();previous=document.activeElement;
  overlay=document.createElement('div');
  overlay.id='ll-ferias-historico-viewport-v620';
  overlay.style.cssText='position:fixed!important;inset:0!important;z-index:2147483647!important;background:rgba(7,22,48,.59)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:20px!important;box-sizing:border-box!important;';
  var panel=document.createElement('section');
  panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
  panel.setAttribute('aria-labelledby','ll-ferias-historico-title-v620');
  panel.style.cssText='background:#fff;color:#15345c;width:min(640px,100%);max-height:calc(100dvh - 40px);display:flex;flex-direction:column;overflow:hidden;border-radius:11px;box-shadow:0 18px 60px rgba(0,0,0,.28);font-family:Arial,sans-serif;';
  var header=document.createElement('header');header.id='ll-ferias-historico-title-v620';
  header.textContent=title||'HISTÓRICO DE ALTERAÇÕES — FÉRIAS';
  header.style.cssText='background:#1b447b;color:#fff;padding:14px 16px;font-size:16px;font-weight:700;';
  var body=document.createElement('div');
  body.style.cssText='padding:15px 16px;overflow-y:auto;min-height:0;line-height:1.55;font-size:13px;';
  // Content originates from the local Férias app and escapes all record values.
  body.innerHTML=content||'';
  var footer=document.createElement('footer');
  footer.style.cssText='padding:12px 16px;display:flex;justify-content:flex-end;border-top:1px solid #d7e3f2;';
  var btn=document.createElement('button');btn.type='button';btn.textContent='FECHAR';
  btn.style.cssText='background:#07539e;color:#fff;border:0;border-radius:5px;padding:10px 17px;font-weight:700;cursor:pointer;';
  btn.addEventListener('click',close);footer.appendChild(btn);
  panel.append(header,body,footer);overlay.appendChild(panel);document.body.appendChild(overlay);
  overlay.addEventListener('click',function(e){if(e.target===overlay)close()});
  btn.focus();
 }
 window.addEventListener('message',function(e){
  if(e.origin!==location.origin&&e.origin!=='null')return;
  if(!e.data||e.data.type!=='LL_FERIAS_HISTORICO_VIEWPORT_V620')return;
  var frame=Array.from(document.querySelectorAll('iframe')).find(function(f){return f.contentWindow===e.source});
  if(!frame||!/(?:^|\/)ferias\/index\.html(?:[?#]|$)/i.test(frame.getAttribute('src')||''))return;
  open(e.data.titulo,e.data.conteudo);
 });
 document.addEventListener('keydown',function(e){
  if(!overlay)return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}
  if(e.key==='Tab'){
   e.preventDefault();overlay.querySelector('button').focus();
  }
 },true);
})();
