/* V581: janela de lote no documento principal, no mesmo viewport do F12. */
(function(){'use strict';
let overlay=null,origin=null,dialog=null,mirror=null,watch=null;
function close(){if(watch){watch.disconnect();watch=null;}if(overlay){overlay.remove();overlay=null;}if(dialog){dialog.style.visibility='';}dialog=null;mirror=null;origin=null;document.removeEventListener('keydown',key,true);}
function key(e){if(e.key==='Escape'&&overlay){e.preventDefault();e.stopImmediatePropagation();close();}}
function sync(){if(!mirror||!dialog)return;
 for(const id of ['batchCount','batchTotal','batchError']){let a=dialog.querySelector('#'+id),b=mirror.querySelector('#'+id);if(a&&b)b.textContent=a.textContent;}
 const checks=[...dialog.querySelectorAll('.batch-check')];mirror.querySelectorAll('.batch-check').forEach((c,i)=>c.checked=!!checks[i]?.checked);
 const all=dialog.querySelector('#selectAll');if(all&&mirror.querySelector('#selectAll'))mirror.querySelector('#selectAll').checked=all.checked;
}
function open(frame,html){close();origin=frame;
 overlay=document.createElement('div');overlay.id='ll-lote-v581';overlay.style.cssText='position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;z-index:2147483647!important;background:rgba(4,24,55,.65)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:16px!important;box-sizing:border-box!important;';
 const section=document.createElement('section');section.setAttribute('role','dialog');section.setAttribute('aria-modal','true');section.style.cssText='box-sizing:border-box;width:min(620px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto;background:#fff;border-radius:12px;box-shadow:0 18px 48px #001a3955;color:#173c6d;font:13px Arial,sans-serif;';
 const title=document.createElement('header');title.textContent='PAGAR FOLHAS — PAGAMENTO EM LOTE';title.style.cssText='background:#1e477c;color:white;padding:20px;font-size:16px;font-weight:800;';section.appendChild(title);
 mirror=document.createElement('div');mirror.innerHTML=html;mirror.style.cssText='padding:18px 20px;';
 const style=document.createElement('style');style.textContent=`#ll-lote-v581 .batch-tools{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}#ll-lote-v581 input[type=checkbox]{accent-color:#185ca6}#ll-lote-v581 .batch-list{border:1px solid #c8dbf5;border-radius:5px;max-height:28dvh;overflow:auto}#ll-lote-v581 .batch-row{display:grid;grid-template-columns:20px minmax(0,1fr) auto;align-items:center;gap:10px;padding:11px;border-bottom:1px solid #e2eaf5;cursor:pointer}#ll-lote-v581 .batch-row small{display:block;color:#5e7897;margin-top:3px}#ll-lote-v581 .batch-total{display:flex;justify-content:space-between;background:#e7f1ff;padding:13px;margin:10px 0;font-weight:bold}#ll-lote-v581 .batch-fields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}#ll-lote-v581 .batch-fields label{font-size:10px;font-weight:bold}#ll-lote-v581 .batch-fields input,#ll-lote-v581 .batch-fields select{display:block;width:100%;min-width:0;box-sizing:border-box;padding:10px 7px;margin-top:5px;border:1px solid #b7d0f5;border-radius:5px;color:#173c6d;background:#f7f9fe}#ll-lote-v581 .batch-actions{display:flex;justify-content:center;gap:8px;margin-top:14px;flex-wrap:wrap}#ll-lote-v581 .batch-actions button{padding:12px 16px;border:1px solid #b7d0f5;border-radius:6px;background:#eef4ff;color:#185495;font-weight:700;cursor:pointer}#ll-lote-v581 #confirmBatch{background:#195ca6;border-color:#195ca6;color:white}#ll-lote-v581 .batch-warning{color:#bb2634;margin:4px 0;min-height:0;font-weight:bold}@media(max-width:550px){#ll-lote-v581 .batch-fields{grid-template-columns:1fr}}`;
 overlay.appendChild(style);section.appendChild(mirror);overlay.appendChild(section);document.body.appendChild(overlay);
 const send=a=>{if(origin?.contentWindow)origin.contentWindow.postMessage({llAction:'folha-lote-v597-action',...a},'*');};
 mirror.addEventListener('change',e=>{const el=e.target;if(!el.matches('input,select'))return;const key=el.classList.contains('batch-check')?'batch-check':el.id;const index=key==='batch-check'?[...mirror.querySelectorAll('.batch-check')].indexOf(el):-1;send({action:'change',key,index,checked:el.checked,value:el.value});});
 mirror.addEventListener('click',e=>{const btn=e.target.closest('button');if(!btn)return;if(btn.id==='batchClose'){send({action:'close'});close();return;}send({action:'click',key:btn.id});});
 overlay.onclick=e=>{if(e.target===overlay){send({action:'close'});close();}};document.addEventListener('keydown',key,true);
}
window.llAbrirPagamentoLote=function(frame){if(frame)open(frame,'');};
window.addEventListener('message',e=>{const d=e.data;if(!d?.llAction)return;if(d.llAction==='folha-lote-close'){close();return;}const f=[...document.querySelectorAll('iframe')].find(x=>x.contentWindow===e.source);if(!f||!String(f.getAttribute('src')||'').includes('folha-pagamento'))return;
if(d.llAction==='folha-lote-v597-open')open(f,String(d.html||''));
if(d.llAction==='folha-lote-v597-sync'&&f===origin&&mirror){const v=d.values||{};for(const id of ['batchCount','batchTotal','batchError']){const el=mirror.querySelector('#'+id);if(el)el.textContent=v[id]||'';}const all=mirror.querySelector('#selectAll');if(all)all.checked=!!v.selectAll;mirror.querySelectorAll('.batch-check').forEach((el,i)=>el.checked=!!v.checks?.[i]);}
});
})();
