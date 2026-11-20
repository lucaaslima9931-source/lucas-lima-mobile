/* V630 — Pagamento individual de férias na janela principal do Chrome. */
(function(){
 'use strict';
 let overlay=null,source=null,requestId=null;
 function finish(data){if(!overlay)return;overlay.remove();overlay=null;document.removeEventListener('keydown',key,true);const s=source,id=requestId;source=null;requestId=null;if(s)try{s.postMessage({type:'LL_FERIAS_PAGAMENTO_RESPOSTA_V630',id,resultado:data},'*')}catch(_){}}
 function key(e){if(!overlay)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();finish(null)}}
 function el(tag,css,text){const e=document.createElement(tag);if(css)e.style.cssText=css;if(text!==undefined)e.textContent=text;return e}
 function field(name,control){const l=el('label','display:block;font-size:11px;font-weight:700;color:#183e70;flex:1;min-width:0');l.append(document.createTextNode(name));control.style.cssText+=';display:block;width:100%;box-sizing:border-box;margin-top:5px;padding:9px;border:1px solid #bfd1ed;border-radius:5px;background:#f8faff;color:#163d71;font:13px Arial';l.append(control);return l}
 function select(options){const s=document.createElement('select');for(const x of options){const o=document.createElement('option');o.value=String(x.id);o.textContent=String(x.nome);s.append(o)}return s}
 function open(d,from){finish(null);source=from;requestId=d.id;
  overlay=el('div','position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;display:flex!important;align-items:center!important;justify-content:center!important;background:rgba(4,24,55,.65)!important;z-index:2147483647!important;padding:16px!important;box-sizing:border-box!important');
  const panel=el('section','width:min(620px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto;background:white;border-radius:10px;box-shadow:0 18px 48px #001a3955;color:#173c6d;font:14px Arial');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
  panel.append(el('header','background:#1e477c;color:white;padding:20px;font-size:17px;font-weight:800','PAGAR FÉRIAS'));
  const body=el('div','padding:20px');body.append(el('div','padding:13px;background:#e8f1ff;margin-bottom:14px;font-weight:700','SALDO A PAGAR: '+String(d.saldoFormatado||'')));
  const line=el('div','display:flex;gap:10px;flex-wrap:wrap');const date=document.createElement('input');date.type='date';date.value=d.data||'';
  const accounts=select(Array.isArray(d.contas)?d.contas:[]);const methods=select(Array.isArray(d.formas)?d.formas:[]);
  line.append(field('DATA DO PAGAMENTO',date),field('CONTA DE ORIGEM',accounts),field('FORMA DE PAGAMENTO',methods));body.append(line);
  if(!methods.options.length)body.append(el('p','color:#b42318;font-size:12px','CADASTRE UMA FORMA DE PAGAMENTO ATIVA ANTES DE PAGAR.'));
  const footer=el('div','display:flex;gap:9px;justify-content:center;padding-top:18px');
  function button(text,primary,fn){const b=el('button','border:1px solid '+(primary?'#195ca6':'#b7d0f5')+';border-radius:6px;padding:12px 17px;background:'+(primary?'#195ca6':'#eef4ff')+';color:'+(primary?'white':'#195ca6')+';font-weight:bold;cursor:pointer',text);b.type='button';b.onclick=fn;footer.append(b);return b}
  button('FECHAR',false,()=>finish(null));const confirm=button('CONFIRMAR PAGAMENTO',true,()=>{if(!date.value||!accounts.value||!methods.value){error.textContent='INFORME DATA, CONTA DE ORIGEM E FORMA DE PAGAMENTO.';return}finish({data:date.value,conta:accounts.value,forma:methods.value})});confirm.disabled=!methods.options.length;
  const error=el('p','color:#b42318;font-size:12px;min-height:1em');body.append(error,footer);panel.append(body);overlay.append(panel);document.body.append(overlay);document.addEventListener('keydown',key,true);overlay.addEventListener('click',e=>{if(e.target===overlay)finish(null)});confirm.focus();
 }
 window.addEventListener('message',e=>{const d=e.data;if(!d||d.type!=='LL_FERIAS_PAGAMENTO_PEDIDO_V630'||typeof d.id!=='string'||!/^ferias-pagamento-\d+$/.test(d.id))return;if(e.origin!==location.origin&&e.origin!=='null')return;const frame=[...document.querySelectorAll('iframe')].find(f=>f.contentWindow===e.source&&/(?:^|\/)ferias\/index\.html(?:[?#]|$)/i.test(f.getAttribute('src')||''));if(!frame)return;open(d,e.source)});
})();
