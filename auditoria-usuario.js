/* LUCAS LIMA — auditoria local de alterações efetivamente gravadas.
   Não substitui auditoria/autenticação de servidor. */
(()=>{'use strict';
const SESSION='erp_systems_demo_session';
const IGNORE=new Set(['usuario','usuário','criadoPor','criadoEm','alteradoPor','alteradoEm','historicoOperacoes','_auditoria','usuarioUltimaAlteracao','dataUltimaAlteracao','usuarioUltimaAlteracao','dataUltimaAlteracao','historico','itens','pagamentos','alteracoes']);
const original=Storage.prototype.setItem;
const PRODUCT_KEY='erp_matriz_produtos_teste_v1';
const PRODUCT_STOCK_FIELDS=new Set(['provisao','venda','disponivel','disponível']);
function productCadastroOnly(x){if(!x||typeof x!=='object')return x;const out={...x};for(const key of PRODUCT_STOCK_FIELDS)delete out[key];return out}
function isStockOnlyEvent(event){if(event?.acao==='CADASTRO')return false;const changes=event?.alteracoes;if(!Array.isArray(changes)||!changes.length)return false;return changes.every(c=>PRODUCT_STOCK_FIELDS.has(String(c.campo||'').toLowerCase()))}

function actor(){try{const s=JSON.parse(sessionStorage.getItem(SESSION)||'null');return s?.nome?.trim()||null}catch{return null}}
function comparable(x){if(!x||typeof x!=='object')return x;if(Array.isArray(x))return x.map(comparable);const o={};for(const k of Object.keys(x).sort())if(!IGNORE.has(k))o[k]=comparable(x[k]);return o}
function id(x){if(!x||typeof x!=='object'||Array.isArray(x))return null;for(const k of ['id','codigo','código','numero','número','num','idVenda','idEntrada'])if(x[k]!==undefined&&x[k]!==null&&String(x[k])!=='')return k+':'+String(x[k]);return null}
function isRecord(x){return !!id(x)}
function diff(before,after){
 if(!before)return [];
 const keys=new Set([...Object.keys(before),...Object.keys(after)]);
 return [...keys].filter(k=>!IGNORE.has(k)&&JSON.stringify(before[k])!==JSON.stringify(after[k]))
 .map(k=>({campo:k,anterior:before[k]??'',novo:after[k]??''})).slice(0,35);
}
function patchArray(oldArr,newArr,who,stamp){if(!Array.isArray(newArr)||!newArr.some(isRecord))return newArr;const prior=new Map((Array.isArray(oldArr)?oldArr:[]).filter(isRecord).map(x=>[id(x),x]));return newArr.map(item=>{if(!isRecord(item))return item;const prev=prior.get(id(item));const changed=!prev||JSON.stringify(comparable(prev))!==JSON.stringify(comparable(item));if(!changed)return {...item,usuario:prev.usuario??prev.alteradoPor??prev.criadoPor??item.usuario,historicoOperacoes:prev.historicoOperacoes??item.historicoOperacoes};if(!who)return item;const hist=Array.isArray(prev?.historicoOperacoes)?prev.historicoOperacoes.slice(-99):[];hist.push({acao:prev?'ALTERAÇÃO':'CADASTRO',usuario:who,data:stamp,alteracoes:diff(prev,item)});return {...item,criadoPor:prev?.criadoPor||item.criadoPor||who,criadoEm:prev?.criadoEm||item.criadoEm||stamp,alteradoPor:who,alteradoEm:stamp,usuario:who,historicoOperacoes:hist}})}
function stampRecord(previous,current,who,stamp){
 if(!who)return current;
 const changed=!previous||JSON.stringify(comparable(previous))!==JSON.stringify(comparable(current));
 if(!changed)return {...current,usuario:previous.usuario??previous.alteradoPor??previous.criadoPor??current.usuario,alteradoPor:previous.alteradoPor,alteradoEm:previous.alteradoEm,criadoPor:previous.criadoPor,criadoEm:previous.criadoEm,historicoOperacoes:previous.historicoOperacoes??current.historicoOperacoes};
 const hist=Array.isArray(previous?.historicoOperacoes)?previous.historicoOperacoes.slice(-99):[];
 hist.push({acao:previous?'ALTERAÇÃO':'CADASTRO',usuario:who,data:stamp,alteracoes:diff(previous,current)});
 return {...current,criadoPor:previous?.criadoPor||current.criadoPor||who,criadoEm:previous?.criadoEm||current.criadoEm||stamp,alteradoPor:who,alteradoEm:stamp,usuario:who,historicoOperacoes:hist};
}
function stampOne(previous,current,who,stamp){
 const changed=!previous||JSON.stringify(comparable(previous))!==JSON.stringify(comparable(current));
 if(!changed)return {...current,usuario:previous.usuario??previous.alteradoPor??previous.criadoPor??current.usuario,criadoPor:previous.criadoPor,criadoEm:previous.criadoEm,alteradoPor:previous.alteradoPor,alteradoEm:previous.alteradoEm,historicoOperacoes:previous.historicoOperacoes??current.historicoOperacoes};
 const hist=Array.isArray(previous?.historicoOperacoes)?previous.historicoOperacoes.slice(-99):[];
 hist.push({acao:previous?'ALTERAÇÃO':'CADASTRO',usuario:who,data:stamp,alteracoes:diff(previous,current)});
 return {...current,usuario:who,criadoPor:previous?.criadoPor||current.criadoPor||who,criadoEm:previous?.criadoEm||current.criadoEm||stamp,alteradoPor:who,alteradoEm:stamp,historicoOperacoes:hist};
}
function patch(oldVal,newVal,who,stamp,depth=0){
 if(depth>9)return newVal;
 if(Array.isArray(newVal)){
  if(newVal.some(isRecord))return patchArray(oldVal,newVal,who,stamp);
  return newVal.map((v,i)=>v&&typeof v==='object'?patch(Array.isArray(oldVal)?oldVal[i]:null,v,who,stamp,depth+1):v);
 }
 if(!newVal||typeof newVal!=='object')return newVal;
 if(isRecord(newVal))return stampOne(oldVal&&id(oldVal)===id(newVal)?oldVal:null,newVal,who,stamp);
 let result=newVal;
 for(const [key,value] of Object.entries(newVal)){
  if(!value||typeof value!=='object'||IGNORE.has(key))continue;
  const updated=patch(oldVal?.[key],value,who,stamp,depth+1);
  if(updated!==value){if(result===newVal)result={...newVal};result[key]=updated}
 }
 return result;
}

function patchProductsOnly(oldArr,newArr,who,stamp){
 const prior=new Map((Array.isArray(oldArr)?oldArr:[]).map(p=>[String(p.codigo),p]));
 return newArr.map(item=>{
  const prev=prior.get(String(item.codigo));
  if(!prev)return stampOne(null,item,who,stamp);
  const changed=JSON.stringify(comparable(productCadastroOnly(prev)))!==JSON.stringify(comparable(productCadastroOnly(item)));
  // A ficha de estoque controla provisão, venda e disponível. Nenhuma movimentação
  // financeira ou de estoque deve registrar ALTERAÇÃO no cadastro do produto.
  if(!changed)return {...item,usuario:prev.usuario,alteradoPor:prev.alteradoPor,alteradoEm:prev.alteradoEm,criadoPor:prev.criadoPor,criadoEm:prev.criadoEm,historicoOperacoes:prev.historicoOperacoes};
  const next=stampOne(prev,item,who,stamp);
  const last=next.historicoOperacoes?.at(-1);
  if(last?.alteracoes)last.alteracoes=last.alteracoes.filter(d=>!PRODUCT_STOCK_FIELDS.has(String(d.campo).toLowerCase()));
  return next;
 });
}
Storage.prototype.setItem=function(key,value){if(this!==localStorage||!actor()||typeof value!=='string'||key===SESSION||/^(ls_|erp_systems_demo_session|erp_systems_auditoria_)/.test(key))return original.call(this,key,value);let next,old;try{next=JSON.parse(value);const raw=this.getItem(key);old=raw===null?null:JSON.parse(raw)}catch{return original.call(this,key,value)};if(!next||typeof next!=='object')return original.call(this,key,value);try{const updated=key===PRODUCT_KEY&&Array.isArray(next)?patchProductsOnly(old,next,actor(),new Date().toISOString()):patch(old,next,actor(),new Date().toISOString());return original.call(this,key,JSON.stringify(updated))}catch(err){console.warn('Auditoria não aplicada:',err);return original.call(this,key,value)}};
window.LucasLimaAuditoria={usuarioAtual:actor,abrirHistorico:record=>openHistory(record)};
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function display(v){if(v===null||v===undefined||v==='')return '—';if(typeof v==='object')return '[DADOS ESTRUTURADOS]';return String(v)}
function cleanChanges(changes){return (Array.isArray(changes)?changes:[]).filter(d=>d&&typeof d.campo==='string'&&!/^(historico|historicoOperacoes|itens|pagamentos|alteracoes)$/i.test(d.campo)&&typeof d.anterior!=='object'&&typeof d.novo!=='object').slice(0,35)}
function openHistory(record, accountMode=false){
 const old=document.getElementById('ll-audit-modal');if(old)old.remove();
 const overlay=document.createElement('div');overlay.id='ll-audit-modal';
 overlay.style.cssText='position:fixed;inset:0;z-index:999999;background:#071d3b99;display:flex;align-items:center;justify-content:center;padding:15px';
 const events=(Array.isArray(record?.historicoOperacoes)?record.historicoOperacoes:[]).filter(e=>!isStockOnlyEvent(e));
 const rows=events.length?events.slice().reverse().map(e=>'<div style="padding:12px 0;border-bottom:1px solid #d9e4f2"><b>'+esc(e.acao||'ALTERAÇÃO')+'</b> — '+esc(e.usuario)+'<div style="font-size:12px;color:#536a86">'+esc(e.data?new Date(e.data).toLocaleString('pt-BR'):'')+'</div>'+(cleanChanges(e.alteracoes).map(d=>'<div style="font-size:12px;margin-top:5px"><b>'+esc(d.campo)+'</b>: '+esc(display(d.anterior))+' → '+esc(display(d.novo))+'</div>').join(''))+'</div>').join(''):'<p>NÃO HÁ HISTÓRICO REGISTRADO PARA ESTE CADASTRO.</p>';
 overlay.innerHTML='<div role="dialog" aria-modal="true" style="width:min(640px,100%);max-height:85vh;display:flex;flex-direction:column;background:#fff;border-radius:8px;overflow:hidden;font-family:Arial,sans-serif;color:#183b69"><header style="background:#123e78;color:white;padding:16px;display:flex;justify-content:space-between;align-items:center"><b>HISTÓRICO DE ALTERAÇÕES</b><button type="button" id="ll-audit-close" style="border:1px solid #adc8e7;background:#1b5597;color:white;border-radius:5px;padding:8px;cursor:pointer">FECHAR</button></header><div style="padding:16px;overflow:auto"><p><b>ÚLTIMO USUÁRIO:</b> '+esc(record?.usuario||record?.alteradoPor||record?.criadoPor||'NÃO INFORMADO')+'</p>'+rows+'</div></div>';
 if(accountMode){
  const dialog=overlay.querySelector('[role="dialog"]');
  const header=dialog.querySelector('header');
  const body=header.nextElementSibling;
  dialog.style.cssText='box-sizing:border-box;min-width:0!important;max-width:440px!important;width:min(440px,calc(100vw - 32px))!important;height:min(493px,calc(100vh - 32px));display:flex;flex-direction:column;background:#fff;border-radius:11px;overflow:hidden;font-family:Arial,sans-serif;color:#183b69;box-shadow:0 14px 36px #061a3c44';
  header.style.cssText='background:#173f78;color:#fff;padding:16px 18px;flex:0 0 auto;min-height:50px;display:flex;align-items:center';
  header.innerHTML='<b style="font-size:14px;line-height:18px">HISTÓRICO DE ALTERAÇÕES — CADASTRO DE CONTAS</b>';
  body.style.cssText='padding:20px;flex:1;min-height:0;overflow-y:auto;overflow-x:hidden';
  const footer=document.createElement('footer');
  footer.style.cssText='padding:14px 20px;display:flex;justify-content:flex-end;flex:0 0 auto;border-top:1px solid #e0e9f5';
  footer.innerHTML='<button type="button" id="ll-audit-close" style="background:#195aa5;color:white;border:0;border-radius:5px;padding:10px 19px;cursor:pointer;font:700 13px Arial">FECHAR</button>';
  dialog.appendChild(footer);
 }
 document.body.append(overlay);overlay.querySelector('button').onclick=()=>overlay.remove();overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});
}
function findRecord(input){
 const scope=input.closest('form,section,article,.card,.panel,.modal,[class*="cadastro"],[class*="form"]')||document;
 const fields=[...scope.querySelectorAll('input')].filter(e=>e!==input&&/cod|n[uú]m|(^|-)id($|-)/i.test(e.id+' '+(e.name||'')+' '+(e.closest('label')?.textContent||''))&&String(e.value||'').trim());
 const codes=fields.map(e=>String(e.value).trim()).filter(Boolean);
 const shown=String(input.value||'').trim().toUpperCase();
 const area=String((scope.id||'')+' '+(scope.className||'')+' '+(document.querySelector('h1,h2')?.textContent||'')).toUpperCase();
 const entries=[];
 function collect(obj,path='',depth=0){
  if(depth>7||!obj||typeof obj!=='object')return;
  if(Array.isArray(obj)){for(const item of obj)collect(item,path,depth+1);return}
  if(isRecord(obj)&&(obj.usuario||obj.alteradoPor||obj.historicoOperacoes))entries.push({record:obj,path});
  for(const [k,v] of Object.entries(obj)){
   if(['historicoOperacoes','historico','itens','pagamentos','alteracoes'].includes(k))continue;
   if(v&&typeof v==='object')collect(v,path+'/'+k,depth+1);
  }
 }
 for(let i=0;i<localStorage.length;i++){
  const k=localStorage.key(i);if(!k||/session|backup|historico/i.test(k))continue;
  try{collect(JSON.parse(localStorage.getItem(k)),k)}catch{}
 }
 let best=null,score=-1;
 for(const e of entries){
  const r=e.record,rid=String(r.id??r.codigo??r.numero??r.num??'');
  const matched=codes.includes(rid);
  const sameUser=shown&&String(r.usuario||r.alteradoPor||r.criadoPor||'').trim().toUpperCase()===shown;
  if(!matched&&!sameUser)continue;
  let points=(matched?20:0)+(sameUser?8:0);
  for(const [word,path] of [['FORNECEDOR','forneced'],['PAGAMENTO','forma|pagamento'],['PRODUTO','produto'],['FUNCION','funcion'],['VENDEDOR','vendedor'],['CLIENTE','cliente'],['ESTOQUE','estoque|acerto'],['ENTRADA','entrada'],['VENDA','venda'],['LOJA','loja']]){
   if(area.includes(word)&&new RegExp(path,'i').test(e.path))points+=30;
  }
  if(points>score){best=r;score=points}
 }
 return best;
}

document.addEventListener('click',e=>{
 const field=e.target.closest?.('input');
 // Formas de Pagamento possui seu próprio histórico; não abrir o modal global também.
 if(field?.id==='pc-user')return;
 if(field?.id==='cb-n-user'||field?.id==='cb-c-user'||field?.id==='cb-r-user'||field?.id==='vt-user'||field?.id==='or-user'||field?.id==='tr-user')return;
 if(field?.id==='cc-user-history'||field?.id==='cc-l-user-history'||field?.id==='ae-usuario'||field?.id==='av-usuario'||field?.id==='en-user'||field?.id==='fp-user'||field?.id==='rh-usuario'||field?.id==='rh-user'||field?.dataset?.auditUser==='1'||field?.id==='ax-user'||field?.id==='forn-usuario'||field?.id==='c-user')return;
 if(!field||!(/usuario|user/i.test(field.id+' '+(field.name||'')+' '+(field.closest('label')?.textContent||''))||field.dataset.auditUser==='1'))return;
 if(!field.readOnly&&!field.disabled)return;
 const record=field.id==='p-usuario'?(()=>{const code=document.getElementById('p-code')?.value;try{return JSON.parse(localStorage.getItem(PRODUCT_KEY)||'[]').find(p=>String(p.codigo)===String(code))||null}catch{return null}})():findRecord(field);
 if(record)openHistory(record,field.id==='fin-user');
 else openHistory({usuario:field.value,historicoOperacoes:[]},field.id==='fin-user');
},true);

})();
