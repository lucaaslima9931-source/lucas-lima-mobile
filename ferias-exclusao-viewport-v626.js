/* V626: confirmação de exclusão de Férias no viewport principal, igual à Folha. */
(function(){
 'use strict';
 let overlay=null,origin=null,requestId=null,responseType=null;
 function close(confirmed){
  if(!overlay)return;
  overlay.remove();overlay=null;
  document.removeEventListener('keydown',onKey,true);
  const target=origin,id=requestId,type=responseType;origin=null;requestId=null;responseType=null;
  if(target)try{target.postMessage({type:type||'LL_FERIAS_EXCLUSAO_RESPOSTA_V626',id,confirmado:confirmed===true},'*')}catch(_){}
 }
 function onKey(e){
  if(!overlay)return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close(false)}
  if(e.key==='Tab'){
   const btns=[...overlay.querySelectorAll('button')];
   if(btns.length){e.preventDefault();btns[(btns.indexOf(document.activeElement)+1)%btns.length].focus()}
  }
 }
 function open(source,id,message,title,replyType,confirmLabel){
  close(false);origin=source;requestId=id;
  responseType=replyType;overlay=document.createElement('div');
  overlay.id='ll-ferias-exclusao-viewport-v626';
  overlay.style.cssText='position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;z-index:2147483647!important;background:rgba(4,24,55,.65)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:16px!important;box-sizing:border-box!important;';
  const panel=document.createElement('section');panel.setAttribute('role','alertdialog');panel.setAttribute('aria-modal','true');
  panel.style.cssText='box-sizing:border-box;width:min(475px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto;background:#fff;border-radius:10px;box-shadow:0 18px 48px #001a3955;color:#173c6d;font:14px Arial,sans-serif;';
  const header=document.createElement('header');header.textContent=title||'CONFIRMAÇÃO — FÉRIAS';header.style.cssText='background:#1e477c;color:white;padding:18px 20px;font-size:16px;font-weight:800';
  const body=document.createElement('div');body.textContent=String(message||'EXCLUIR ESTAS FÉRIAS?');body.style.cssText='padding:23px 20px;line-height:1.5;white-space:pre-line';
  const footer=document.createElement('footer');footer.style.cssText='display:flex;gap:10px;justify-content:flex-end;padding:0 20px 20px';
  function btn(label,primary,action){const b=document.createElement('button');b.type='button';b.textContent=label;b.style.cssText='background:'+(primary?'#195ca6':'#eef4ff')+';color:'+(primary?'#fff':'#185495')+';border:1px solid '+(primary?'#195ca6':'#b7d0f5')+';border-radius:6px;padding:11px 20px;font-weight:bold;cursor:pointer';b.addEventListener('click',action);footer.appendChild(b);return b}
  btn('CANCELAR',false,()=>close(false));const confirm=btn(confirmLabel||'CONFIRMAR',true,()=>close(true));
  panel.append(header,body,footer);overlay.appendChild(panel);document.body.appendChild(overlay);
  overlay.addEventListener('click',e=>{if(e.target===overlay)close(false)});
  document.addEventListener('keydown',onKey,true);confirm.focus();
 }
 window.addEventListener('message',e=>{
  const d=e.data;
  if(!d||!['LL_FERIAS_EXCLUSAO_PEDIDO_V626','LL_FERIAS_CONFIRMACAO_PEDIDO_V628'].includes(d.type)||typeof d.id!=='string'||!/^ferias-(exclusao|confirmacao)-/.test(d.id))return;
  if(e.origin!==location.origin&&e.origin!=='null')return;
  const frame=[...document.querySelectorAll('iframe')].find(f=>f.contentWindow===e.source&&/(?:^|\/)ferias\/index\.html(?:[?#]|$)/i.test(f.getAttribute('src')||''));
  if(!frame)return;
  open(e.source,d.id,d.mensagem,d.type==='LL_FERIAS_CONFIRMACAO_PEDIDO_V628'?(String(d.titulo||'CONFIRMAÇÃO — FÉRIAS')):'CONFIRMAÇÃO — FÉRIAS',d.type==='LL_FERIAS_CONFIRMACAO_PEDIDO_V628'?'LL_FERIAS_CONFIRMACAO_RESPOSTA_V628':'LL_FERIAS_EXCLUSAO_RESPOSTA_V626',d.type==='LL_FERIAS_CONFIRMACAO_PEDIDO_V628'?String(d.rotuloConfirmar||'CONFIRMAR'):'CONFIRMAR');
 });
})();
