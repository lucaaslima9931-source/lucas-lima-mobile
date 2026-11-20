/* V622 — Avisos de Férias exibidos no viewport do index.html, sem afetar outros módulos. */
(function(){
 'use strict';
 var overlay=null,previous=null;
 function close(){
  if(!overlay)return;
  overlay.remove();overlay=null;
  if(previous&&previous.isConnected){try{previous.focus()}catch(e){}}
  previous=null;
 }
 function open(message){
  close();previous=document.activeElement;
  overlay=document.createElement('div');
  overlay.id='ll-ferias-aviso-viewport-v622';
  overlay.style.cssText='position:fixed!important;inset:0!important;z-index:2147483647!important;background:rgba(7,22,48,.59)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:20px!important;box-sizing:border-box!important;';
  var panel=document.createElement('section');
  panel.setAttribute('role','alertdialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','ll-ferias-aviso-title-v622');panel.setAttribute('aria-describedby','ll-ferias-aviso-message-v622');
  panel.style.cssText='background:#fff;color:#15345c;width:min(475px,100%);max-height:calc(100dvh - 40px);display:flex;flex-direction:column;overflow:hidden;border-radius:11px;box-shadow:0 18px 60px rgba(0,0,0,.28);font-family:Arial,sans-serif;';
  var header=document.createElement('header');header.id='ll-ferias-aviso-title-v622';header.textContent='AVISO — FÉRIAS';
  header.style.cssText='background:#1b447b;color:#fff;padding:19px 20px;font-size:16px;font-weight:700;';
  var body=document.createElement('div');body.id='ll-ferias-aviso-message-v622';body.textContent=String(message||'');
  body.style.cssText='padding:24px 20px 12px;overflow-y:auto;min-height:0;line-height:1.55;font-size:14px;';
  var footer=document.createElement('footer');footer.style.cssText='padding:8px 20px 20px;display:flex;justify-content:flex-end;';
  var btn=document.createElement('button');btn.type='button';btn.textContent='OK';
  btn.style.cssText='background:#195ca6;color:#fff;border:0;border-radius:6px;padding:12px 20px;min-width:62px;font-weight:700;cursor:pointer;';
  btn.addEventListener('click',close);footer.appendChild(btn);
  panel.append(header,body,footer);overlay.appendChild(panel);document.body.appendChild(overlay);
  btn.focus();
 }
 window.addEventListener('message',function(e){
  if(e.origin!==location.origin&&e.origin!=='null')return;
  if(!e.data||e.data.type!=='LL_FERIAS_AVISO_VIEWPORT_V622')return;
  var frame=Array.from(document.querySelectorAll('iframe')).find(function(f){return f.contentWindow===e.source});
  if(!frame||!/(?:^|\/)ferias\/index\.html(?:[?#]|$)/i.test(frame.getAttribute('src')||''))return;
  open(e.data.mensagem);
 });
 document.addEventListener('keydown',function(e){
  if(!overlay)return;
  if(e.key==='Escape'||e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();close()}
  else if(e.key==='Tab'){e.preventDefault();overlay.querySelector('button').focus()}
 },true);
})();
