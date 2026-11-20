/* V632 — F12 de Férias na página principal, independente do iframe/rolagem. */
(function(){'use strict';
let overlay=null,origin=null,previous=null;
function close(){if(overlay){overlay.remove();overlay=null;}origin=null;if(previous&&previous.isConnected)try{previous.focus()}catch(e){}previous=null;}
function validFrame(source){return [...document.querySelectorAll('iframe')].find(f=>f.contentWindow===source&&/(?:^|\/)ferias\/index\.html(?:[?#]|$)/i.test(f.getAttribute('src')||''));}
function open(frame){close();origin=frame;previous=document.activeElement;
overlay=document.createElement('div');overlay.id='ll-ferias-f12-v632';overlay.style.cssText='position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;z-index:2147483647!important;background:rgba(4,24,55,.65)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:16px!important;box-sizing:border-box!important;';
overlay.innerHTML=`<section role="dialog" aria-modal="true" aria-labelledby="ll-ferias-f12-title" style="box-sizing:border-box;width:min(475px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto;background:#fff;border-radius:12px;box-shadow:0 18px 48px #001a3955;color:#24446d;font:13px Arial,sans-serif"><header id="ll-ferias-f12-title" style="background:#245b97;color:white;padding:21px 22px;font-weight:800;font-size:17px">▣ LUCAS LIMA — LOCALIZAR</header><div style="padding:26px 22px 28px"><p style="margin:4px 0 18px">NÚMERO DAS FÉRIAS:</p><label for="ll-ferias-f12-num" style="font-weight:bold;font-size:12px">INFORME O VALOR</label><input id="ll-ferias-f12-num" type="text" inputmode="numeric" placeholder="DIGITE AQUI..." style="display:block;width:100%;height:44px;margin:8px 0 12px;border:1px solid #a9c6ee;border-radius:7px;padding:12px;box-sizing:border-box;font-size:13px"><p id="ll-ferias-f12-error" role="alert" style="color:#b92636;min-height:15px;margin:0"></p><footer style="display:flex;gap:10px;justify-content:center;margin-top:14px"><button id="ll-ferias-f12-find" type="button" style="background:#195ca6;color:white;border:0;border-radius:6px;padding:12px 20px;font-weight:bold;cursor:pointer">LOCALIZAR</button><button id="ll-ferias-f12-cancel" type="button" style="background:#eef4ff;color:#185495;border:1px solid #b7d0f5;border-radius:6px;padding:12px 20px;font-weight:bold;cursor:pointer">CANCELAR</button></footer></div></section>`;
document.body.appendChild(overlay);
const find=()=>{if(origin?.contentWindow)origin.contentWindow.postMessage({type:'LL_FERIAS_F12_FIND_V632',numero:overlay.querySelector('#ll-ferias-f12-num').value},'*');};
overlay.querySelector('#ll-ferias-f12-find').onclick=find;overlay.querySelector('#ll-ferias-f12-cancel').onclick=close;
overlay.querySelector('#ll-ferias-f12-num').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();find();}};
overlay.onclick=e=>{if(e.target===overlay)close();};overlay.querySelector('#ll-ferias-f12-num').focus();}
window.addEventListener('message',e=>{if(e.origin!==location.origin&&e.origin!=='null')return;const d=e.data;if(!d||!d.type)return;const f=validFrame(e.source);if(!f)return;
if(d.type==='LL_FERIAS_F12_OPEN_V632')open(f);
else if(f===origin&&d.type==='LL_FERIAS_F12_CLOSE_V632')close();
else if(f===origin&&d.type==='LL_FERIAS_F12_ERROR_V632'&&overlay)overlay.querySelector('#ll-ferias-f12-error').textContent=String(d.message||'FÉRIAS NÃO ENCONTRADAS.');});
document.addEventListener('keydown',e=>{if(overlay&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}},true);
})();
