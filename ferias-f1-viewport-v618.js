/* V618 — Somente F1/Atalhos de Férias no viewport do index.html. */
(function(){'use strict';
 var overlay=null,previous=null;
 function close(){if(!overlay)return;overlay.remove();overlay=null;if(previous&&previous.isConnected){try{previous.focus()}catch(e){}}previous=null;}
 function open(){document.getElementById('erp-shortcuts-modal')?.remove();close();previous=document.activeElement;
 overlay=document.createElement('div');overlay.id='ll-ferias-f1-viewport-v618';
 overlay.setAttribute('role','presentation');
 overlay.style.cssText='position:fixed!important;inset:0!important;z-index:2147483647!important;background:rgba(7,22,48,.59)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:20px!important;box-sizing:border-box!important;';
 var panel=document.createElement('section');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','ll-ferias-f1-title');
 panel.style.cssText='background:#fff;color:#15345c;width:min(480px,100%);max-height:calc(100dvh - 40px);overflow:auto;border-radius:12px;box-shadow:0 18px 60px rgba(0,0,0,.28);font-family:Arial,sans-serif;';
 panel.innerHTML='<header id="ll-ferias-f1-title" style="background:#235d9d;color:white;padding:19px 22px;font-size:17px;font-weight:700">⌂ ATALHOS — FÉRIAS</header><div style="padding:16px 22px 8px"><div style="display:flex;align-items:center;gap:18px;padding:10px 0;border-bottom:1px solid #d7e3f2"><strong style="padding:10px 13px;background:#edf4ff;border:1px solid #bcd5ff;border-radius:5px">F1</strong><span>Abrir esta janela de atalhos</span></div><div style="display:flex;align-items:center;gap:18px;padding:10px 0;border-bottom:1px solid #d7e3f2"><strong style="padding:10px 10px;background:#edf4ff;border:1px solid #bcd5ff;border-radius:5px">F12</strong><span>Localizar férias pelo número</span></div><div style="display:flex;align-items:center;gap:18px;padding:10px 0"><strong style="padding:10px 13px;background:#edf4ff;border:1px solid #bcd5ff;border-radius:5px">F5</strong><span>Gerar férias</span></div></div><footer style="padding:14px 20px;display:flex;justify-content:flex-end;border-top:1px solid #d7e3f2"><button type="button" id="ll-ferias-f1-close-v618" style="background:#07539e;color:white;border:0;border-radius:6px;padding:11px 17px;cursor:pointer;font-weight:700">FECHAR</button></footer>';
 overlay.appendChild(panel);document.body.appendChild(overlay);
 overlay.addEventListener('click',function(e){if(e.target===overlay)close()});
 panel.querySelector('button').addEventListener('click',close);panel.querySelector('button').focus();
 }
 window.addEventListener('message',function(e){if(e.origin!==location.origin&&e.origin!=='null')return;if(!e.data||e.data.type!=='LL_FERIAS_F1_VIEWPORT_V618')return;var frame=Array.from(document.querySelectorAll('iframe')).find(function(f){return f.contentWindow===e.source});if(!frame||!/(?:^|\/)ferias\/index\.html(?:[?#]|$)/i.test(frame.getAttribute('src')||frame.contentWindow?.location?.pathname||''))return;open();});
 document.addEventListener('keydown',function(e){if(e.key!=='F1'||e.repeat)return;var frame=Array.from(document.querySelectorAll('iframe')).find(function(f){return /(?:^|\/)ferias\/index\.html(?:[?#]|$)/i.test(f.getAttribute('src')||'')&&f.getClientRects().length>0});if(!frame)return;e.preventDefault();e.stopImmediatePropagation();open()},true);
 document.addEventListener('keydown',function(e){if(overlay&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}},true);
})();
