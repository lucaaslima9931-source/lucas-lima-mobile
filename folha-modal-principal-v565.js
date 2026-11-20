/* V565: janelas simples da Folha de Pagamento no viewport do documento principal. */
(function(){'use strict';
let overlay=null,frameOrigin=null,requestId=null;
function close(accepted){
 if(!overlay)return;
 const target=frameOrigin,id=requestId;
 overlay.remove();overlay=null;frameOrigin=null;requestId=null;
 document.removeEventListener('keydown',keys,true);
 if(target&&id&&String(id).startsWith('folha-')){
  try{target.contentWindow.postMessage({llAction:'folha-modal-response',id,accepted:!!accepted},'*');}catch(_){}
 }
}
function keys(e){if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close(false);}else if(e.key==='Enter'&&overlay&&!overlay.dataset.shortcuts){e.preventDefault();e.stopImmediatePropagation();close(true);}}
function open(frame,d){close(false);frameOrigin=frame;requestId=d.id;
 overlay=document.createElement('div');overlay.id='ll-folha-modal-principal';
 overlay.style.cssText='position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;z-index:2147483647!important;background:rgba(4,24,55,.65)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:16px!important;box-sizing:border-box!important;';
 const isHistory=d.kind==='history',isShort=d.kind==='shortcuts',isGenerate=d.kind==='generate',isReopen=d.kind==='reopen',isConfirm=d.kind==='confirm'||isGenerate||isReopen;
 if(isShort)overlay.dataset.shortcuts='1';
 const section=document.createElement('section');section.setAttribute('role','dialog');section.setAttribute('aria-modal','true');
 section.style.cssText='box-sizing:border-box;width:min('+(isHistory?'760':'475')+'px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto;background:#fff;border-radius:10px;box-shadow:0 18px 48px #001a3955;color:#173c6d;font:14px Arial,sans-serif';
 const header=document.createElement('header');header.style.cssText='background:#1e477c;color:white;padding:18px 20px;font-size:16px;font-weight:800';header.textContent=isHistory?'HISTÓRICO DE ALTERAÇÕES — FOLHA':isShort?'⌂ ATALHOS — FOLHA DE PAGAMENTO':isGenerate?'GERAR FOLHA DE PAGAMENTO':isReopen?'CONFIRMAR REABERTURA DA FOLHA':isConfirm?'CONFIRMAÇÃO — FOLHA DE PAGAMENTO':'AVISO — FOLHA DE PAGAMENTO';section.appendChild(header);
 const body=document.createElement('div');body.style.cssText='padding:23px 20px;line-height:1.5;white-space:pre-line';
 if(isHistory){
  const top=document.createElement('div');top.style.cssText='margin-bottom:15px;font-weight:bold';top.textContent='FOLHA Nº '+String(d.numero||'')+' — '+String(d.competencia||'');body.appendChild(top);
  const user=document.createElement('div');user.style.cssText='margin-bottom:12px';user.textContent='USUÁRIO DA GERAÇÃO: '+String(d.usuarioGeracao||'NÃO REGISTRADO');body.appendChild(user);
  const scroll=document.createElement('div');scroll.style.cssText='max-height:min(48vh,420px);overflow-y:auto;overscroll-behavior:contain';
  const logs=Array.isArray(d.logs)?d.logs:[];
  if(!logs.length){scroll.textContent='ESTA FOLHA AINDA NÃO POSSUI HISTÓRICO REGISTRADO.';}
  for(const item of logs){const r=document.createElement('div');r.style.cssText='padding:12px 0;border-bottom:1px solid #d9e4f2';const strong=document.createElement('strong');strong.textContent=String(item.acao||'OPERAÇÃO')+' — '+String(item.usuario||'NÃO REGISTRADO');const date=document.createElement('div');date.style.cssText='font-size:12px;color:#61748f;margin-top:3px';date.textContent=String(item.data||'');r.append(strong,date);scroll.appendChild(r);}
  body.appendChild(scroll);
 }
 else if(isShort){[['F1','Abrir esta janela de atalhos'],['F12','Localizar folha pelo número'],['F5','Gerar folha de pagamento']].forEach(([k,v])=>{const r=document.createElement('div');r.style.cssText='display:flex;align-items:center;gap:14px;padding:10px 0;border-bottom:1px solid #d8e3f2';const b=document.createElement('strong');b.textContent=k;b.style.cssText='background:#edf4ff;border:1px solid #bed3f5;border-radius:5px;padding:10px;min-width:34px;text-align:center';const t=document.createElement('span');t.textContent=v;r.append(b,t);body.appendChild(r);});}
 else{const p=document.createElement('p');p.style.cssText='margin:0';p.textContent=isReopen?'DESEJA REABRIR A FOLHA Nº '+String(d.numero||'')+'?\n\nO CONTAS A PAGAR VINCULADO SERÁ EXCLUÍDO E A FOLHA VOLTARÁ PARA A SITUAÇÃO PENDENTE.\n\nA OPERAÇÃO SERÁ REGISTRADA NO HISTÓRICO COM DATA, HORA E USUÁRIO RESPONSÁVEL.':isGenerate?'DESEJA CONFIRMAR A GERAÇÃO DA FOLHA Nº '+String(d.numero||'')+'?\n\nAO CONFIRMAR, A FOLHA SERÁ GERADA E O CONTAS A PAGAR CORRESPONDENTE SERÁ CRIADO AUTOMATICAMENTE.\n\nO USUÁRIO RESPONSÁVEL E A DATA DA GERAÇÃO SERÃO REGISTRADOS NO HISTÓRICO.':String(d.message||'');body.appendChild(p);}
 section.appendChild(body);
 const footer=document.createElement('footer');footer.style.cssText='display:flex;gap:10px;justify-content:flex-end;padding:0 20px 20px';
 function button(label,primary,fn){const b=document.createElement('button');b.type='button';b.textContent=label;b.style.cssText='background:'+(primary?'#195ca6':'#eef4ff')+';color:'+(primary?'white':'#185495')+';border:1px solid '+(primary?'#195ca6':'#b7d0f5')+';border-radius:6px;padding:11px 20px;font-weight:bold;cursor:pointer';b.onclick=fn;footer.appendChild(b);return b;}
 if(isConfirm)button('CANCELAR',false,()=>close(false));
 const focus=button(isHistory?'FECHAR':isShort?'FECHAR':isReopen?'CONFIRMAR REABERTURA':isConfirm?'CONFIRMAR':'OK',true,()=>close(true));section.appendChild(footer);overlay.appendChild(section);document.body.appendChild(overlay);overlay.onclick=e=>{if(e.target===overlay)close(false);};document.addEventListener('keydown',keys,true);focus.focus();
}
window.addEventListener('message',e=>{const d=e.data;if(!d||d.llAction!=='folha-modal-open')return;const frame=[...document.querySelectorAll('iframe')].find(f=>f.contentWindow===e.source&&String(f.getAttribute('src')||'').includes('folha-pagamento'));if(frame)open(frame,d);});
})();
