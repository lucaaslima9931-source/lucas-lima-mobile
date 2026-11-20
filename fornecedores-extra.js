/* Cadastro de Fornecedores — implementação independente, 2026-11-01. */
(() => {
'use strict';
const STORE='erp_matriz_operacoes_v2';
const el=id=>document.getElementById(id);
const digits=v=>String(v||'').replace(/\D/g,'');
const fields=[['CÓDIGO','id',1],['TIPO DE PESSOA','tipo',2],['NOME / RAZÃO SOCIAL *','nome',5],['NOME FANTASIA','fantasia',4],['CPF / CNPJ','documento',3],['RG / INSCRIÇÃO ESTADUAL','rg',3],['TELEFONE / WHATSAPP','telefone',3],['E-MAIL','email',3],['NOME DO CONTATO','contato',3],['CEP','cep',2],['RUA / ENDEREÇO','rua',5],['NÚMERO','numero',2],['COMPLEMENTO','complemento',3],['BAIRRO','bairro',3],['CIDADE','cidade',4],['UF','uf',2],['SITUAÇÃO','situacao',3],['USUÁRIO','usuario',3],['OBSERVAÇÕES','observacoes',6]];
let cepRequest=0;
const cpfCnpj=v=>{const d=digits(v).slice(0,14);if(d.length<=11)return d.replace(/^(\d{3})(\d)/,'$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d{1,2})$/,'.$1-$2');return d.replace(/^(\d{2})(\d)/,'$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d)/,'.$1/$2').replace(/(\/\d{4})(\d)/,'$1-$2')};
const phoneMask=v=>{const d=digits(v).slice(0,11);if(d.length<=2)return d.length===2?'('+d+') ':d.length?'('+d:'';const area='('+d.slice(0,2)+') ';const local=d.slice(2);if(local.length<=4)return area+local;return area+local.slice(0,local.length>8?5:4)+'-'+local.slice(local.length>8?5:4)};
const cepMask=v=>{const d=digits(v).slice(0,8);return d.length>5?d.slice(0,5)+'-'+d.slice(5):d};
function formatSupplierFields(){
 const doc=el('forn-documento'),tel=el('forn-telefone'),cep=el('forn-cep'),tipo=el('forn-tipo');
 if(!doc||!tel||!cep)return;
 doc.value=cpfCnpj(doc.value);tel.value=phoneMask(tel.value);cep.value=cepMask(cep.value);
 // O CPF e o CNPJ usam a mesma entrada; a quantidade de dígitos define a máscara.
}
async function lookupSupplierCep(){
 const cep=digits(el('forn-cep')?.value);const request=++cepRequest;
 if(cep.length!==8)return;
 try{
  const response=await fetch('https://viacep.com.br/ws/'+cep+'/json/',{cache:'no-store'});
  if(!response.ok)throw new Error('Consulta indisponível');
  const data=await response.json();
  if(request!==cepRequest||digits(el('forn-cep')?.value)!==cep||data.erro)return;
  const map={rua:data.logradouro,bairro:data.bairro,cidade:data.localidade,uf:data.uf};
  for(const [key,value] of Object.entries(map))if(value)el('forn-'+key).value=String(value).toLocaleUpperCase('pt-BR');
 }catch(_){/* CEP não encontrado ou sem internet: campos continuam editáveis. */}
}
function wireSupplierFields(){
 const doc=el('forn-documento'),tel=el('forn-telefone'),cep=el('forn-cep');
 doc.setAttribute('inputmode','numeric');doc.setAttribute('maxlength','18');doc.setAttribute('placeholder','000.000.000-00 / 00.000.000/0000-00');
 tel.setAttribute('inputmode','numeric');tel.setAttribute('maxlength','15');tel.setAttribute('placeholder','(88) 99999-9999');
 cep.setAttribute('inputmode','numeric');cep.setAttribute('maxlength','9');cep.setAttribute('placeholder','00000-000');
 doc.addEventListener('input',()=>{doc.value=cpfCnpj(doc.value)});
 tel.addEventListener('input',()=>{tel.value=phoneMask(tel.value)});
 cep.addEventListener('input',()=>{cep.value=cepMask(cep.value);if(digits(cep.value).length===8)lookupSupplierCep();else cepRequest++});
 for(const [,key] of fields){if(['id','tipo','situacao','usuario','documento','telefone','cep'].includes(key))continue;
  const node=el('forn-'+key);if(!node)continue;
  node.style.textTransform='uppercase';node.addEventListener('input',()=>{const pos=node.selectionStart;node.value=node.value.toLocaleUpperCase('pt-BR');if(pos!==null)try{node.setSelectionRange(pos,pos)}catch(_){}});
 }
}
let current=null;
function read(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return {}}}
function all(){return read().fornecedores||[]}
function write(rows){const state=read();state.fornecedores=rows;localStorage.setItem(STORE,JSON.stringify(state))}
function notify(msg){if(typeof aviso==='function')aviso('FORNECEDORES',msg);else alert(msg)}
function user(){return window.LucasLimaAuditoria?.usuarioAtual?.()||document.querySelector('.top-user strong')?.textContent?.trim()||'USUÁRIO NÃO IDENTIFICADO'}
function modal(title,body){const layer=document.createElement('div');layer.className='erp-modal-overlay';layer.dataset.supplierModal='1';layer.innerHTML=`<section class="erp-modal-box" role="dialog" aria-modal="true"><div class="erp-modal-header"><strong>${title}</strong><button type="button" class="erp-modal-close" data-close>×</button></div><div class="erp-modal-body">${body}</div><div class="erp-modal-footer"><button type="button" class="erp-modal-confirm" data-close>FECHAR</button></div></section>`;document.body.append(layer);const close=()=>{layer.remove();document.removeEventListener('keydown',onkey,true)};const onkey=e=>{if(e.key==='Escape'||e.key==='F1'){e.preventDefault();e.stopImmediatePropagation();close()}};document.addEventListener('keydown',onkey,true);layer.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',close));return layer}
function shortcuts(){
 if(document.querySelector('[data-supplier-modal]'))return;
 const body='<div class="forn-shortcut-list"><div class="forn-shortcut-row"><span class="forn-shortcut-key">F1</span><span>Abrir esta janela de atalhos</span></div><div class="forn-shortcut-row"><span class="forn-shortcut-key">F12</span><span>Localizar fornecedor por código ou CPF/CNPJ</span></div></div>';
 const layer=modal('ATALHOS — CADASTRO DE FORNECEDORES',body);
 layer.classList.add('forn-shortcuts-modal');
}
function lookup(){
 if(document.querySelector('[data-supplier-modal]'))return;
 const layer=modal('LOCALIZAR FORNECEDOR — F12','<label>CÓDIGO OU CPF/CNPJ DO FORNECEDOR<input id="forn-lookup-value" class="erp-modal-input" placeholder="DIGITE O CÓDIGO OU CPF/CNPJ"></label><div class="ll-f12-actions"><button type="button" id="forn-lookup-go" class="erp-modal-confirm">LOCALIZAR</button><button type="button" class="ll-f12-cancel" data-close>CANCELAR</button></div>');
 layer.dataset.f12Lookup='1';layer.classList.add('ll-f12-standard');layer.querySelector('.erp-modal-footer').remove();layer.querySelector('.ll-f12-cancel').addEventListener('click',()=>layer.querySelector('.erp-modal-close').click());
 const find=()=>{
  const value=el('forn-lookup-value').value.trim();
  const documentoDigitado=digits(value);
  const record=all().find(x=>String(x.id)===value || (/^\d+$/.test(value) && Number(x.id)===Number(value)) || (documentoDigitado.length>=11 && digits(x.documento||'')===documentoDigitado));
  if(!record){notify('FORNECEDOR NÃO ENCONTRADO.');return}
  layer.querySelector('[data-close]').click();load(record);
 };
 el('forn-lookup-go').addEventListener('click',find);
 el('forn-lookup-value').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();find()}});
 el('forn-lookup-value').focus();
}
function load(item){current=Number(item.id);fields.forEach(([,key])=>{const node=el('forn-'+key);if(node)node.value=item[key]??''});el('forn-id').value=item.id;el('forn-usuario').value=item.usuario||item.alteradoPor||item.criadoPor||'';cepRequest++;formatSupplierFields()}
function clear(){cepRequest++;current=null;fields.forEach(([,key])=>{const node=el('forn-'+key);if(node)node.value=''});el('forn-id').value=Math.max(0,...all().map(x=>Number(x.id)||0))+1;el('forn-tipo').value='FÍSICA';el('forn-situacao').value='ATIVO';el('forn-usuario').value='';el('forn-nome').focus();resetSupplierSearch()}
function save(){
 const nome=el('forn-nome').value.trim();
 if(!nome){notify('INFORME O NOME / RAZÃO SOCIAL.');el('forn-nome').focus();return}
 const rows=all(),id=current??Number(el('forn-id').value);
 const record={id};
 fields.forEach(([,key])=>{if(key!=='id'&&key!=='usuario')record[key]=el('forn-'+key).value.trim()});record.documento=cpfCnpj(record.documento);record.telefone=phoneMask(record.telefone);record.cep=cepMask(record.cep);for(const key of Object.keys(record)){if(!['id','tipo','situacao','documento','telefone','cep'].includes(key)&&typeof record[key]==='string')record[key]=record[key].toLocaleUpperCase('pt-BR')}
 const i=rows.findIndex(x=>Number(x.id)===Number(id)),old=i>=0?rows[i]:null;
 const labels=Object.fromEntries(fields.map(([label,key])=>[key,label.replace(' *','')]));
 const changes=Object.keys(record).filter(k=>k!=='id'&&(!old||String(old[k]??'')!==String(record[k]??''))).map(k=>({campo:labels[k]||k,anterior:old?.[k]??'',novo:record[k]??''}));
 if(old&&!changes.length){notify('NENHUMA ALTERAÇÃO FOI REALIZADA.');return}
 const who=user(),now=new Date().toISOString();
 const history=[...(old?.historicoOperacoes||[]),{acao:old?'ALTERAÇÃO':'CADASTRO',usuario:who,data:now,alteracoes:changes}];
 const saved={...(old||{}),...record,usuario:who,alteradoPor:who,alteradoEm:now,historicoOperacoes:history};
 if(i>=0)rows[i]=saved;else rows.push(saved);
 write(rows);current=id;el('forn-usuario').value=who;resetSupplierSearch();notify('FORNECEDOR GRAVADO COM SUCESSO.');
 if(window.__cpSupplierReturn && typeof window.__cpSupplierReturn.restore==='function')window.__cpSupplierReturn.restore(saved);
}
function historySupplier(){
 const record=all().find(x=>Number(x.id)===current);
 if(!record){notify('SELECIONE UM FORNECEDOR PARA CONSULTAR O HISTÓRICO.');return}
 document.querySelectorAll('[data-forn-history]').forEach(n=>n.remove());
 const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const events=Array.isArray(record.historicoOperacoes)?record.historicoOperacoes:[];
 const entries=events.length?events.slice().reverse().map(event=>{
  const date=new Date(event.data||'');
  const when=Number.isNaN(date.getTime())?String(event.data||''):date.toLocaleString('pt-BR');
  const details=(event.alteracoes||[]).map(d=>'<div style="font-size:12px;margin-top:6px"><b>'+escape(d.campo)+'</b>: '+escape(d.anterior)+' → '+escape(d.novo)+'</div>').join('');
  return '<div style="padding:12px 0;border-bottom:1px solid #dce6f3"><b>'+escape(event.acao||'ALTERAÇÃO')+' — '+escape(event.usuario||'USUÁRIO NÃO IDENTIFICADO')+'</b><div style="font-size:12px;color:#60738a">'+escape(when)+'</div>'+details+'</div>';
 }).join(''):'<p>Este fornecedor ainda não possui histórico registrado. As próximas alterações serão registradas.</p>';
 const layer=document.createElement('div');layer.dataset.fornHistory='1';
 layer.style.cssText='position:fixed;inset:0;z-index:999999;background:rgba(4,24,52,.65);display:flex;align-items:center;justify-content:center;padding:16px';
 layer.innerHTML='<div role="dialog" aria-modal="true" style="width:min(650px,95vw);max-height:85vh;background:white;border-radius:9px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 15px 45px #071a3955"><div style="background:#173e77;color:white;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;gap:10px"><b style="font-size:19px">HISTÓRICO DE ALTERAÇÕES</b><button type="button" data-close style="background:#2360ab;color:white;border:1px solid #9ebee8;border-radius:5px;padding:9px 13px;cursor:pointer">✕ FECHAR</button></div><div style="padding:18px 20px;overflow:auto"><p><b>FORNECEDOR:</b> '+escape(record.nome)+'</p><p><b>ÚLTIMO USUÁRIO:</b> '+escape(record.usuario||record.alteradoPor||record.criadoPor||'NÃO INFORMADO')+'</p>'+entries+'</div></div>';
 document.body.append(layer);
 const close=()=>{document.removeEventListener('keydown',onkey,true);layer.remove()};
 const onkey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}};
 document.addEventListener('keydown',onkey,true);
 layer.querySelector('[data-close]').addEventListener('click',close);
 layer.addEventListener('click',e=>{if(e.target===layer)close()});
}

function resetSupplierSearch(){if(!el('forn-results'))return;el('forn-results').replaceChildren();el('forn-count').textContent='CLIQUE EM PESQUISAR PARA EXIBIR OS FORNECEDORES.'}
function render(){if(!el('forn-results'))return;const q=el('forn-search').value.toUpperCase(),status=el('forn-status').value;const matches=all().filter(x=>(status==='TODOS'||(x.situacao||'ATIVO')===status)&&[x.id,x.nome,x.documento,x.telefone,x.cidade,x.contato].some(v=>String(v??'').toUpperCase().includes(q)));const tbody=el('forn-results');tbody.replaceChildren();matches.forEach(x=>{const tr=document.createElement('tr');['id','nome','documento','telefone','cidade','contato','situacao'].forEach(k=>{const td=document.createElement('td');td.textContent=x[k]??'';tr.append(td)});tr.ondblclick=()=>load(x);tr.style.cursor='pointer';tbody.append(tr)});el('forn-count').textContent=matches.length+' FORNECEDOR(ES) ENCONTRADO(S)'}

function extrato(){
 const item=all().find(x=>Number(x.id)===current);
 if(!item){notify('SELECIONE UM FORNECEDOR.');return}
 if(document.querySelector('[data-supplier-statement]'))return;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=v=>(Number(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 const date=v=>{if(!v)return '';let t=String(v).slice(0,10);return /^\d{4}-\d\d-\d\d$/.test(t)?t.slice(8,10)+'/'+t.slice(5,7)+'/'+t.slice(0,4):t};
 const iso=v=>{const t=String(v||'').slice(0,10);return /^\d\d\/\d\d\/\d{4}$/.test(t)?t.slice(6)+'-'+t.slice(3,5)+'-'+t.slice(0,2):t};
 const matches=x=>{
  const code=String(item.id),name=String(item.nome||'').trim().toUpperCase();
  const refs=[x.fornecedorId,x.idFornecedor,x.codigoFornecedor,x.fornecedor_codigo,x.fornecedorCod,x.fornecedor,x.pessoa,x.fornecedor_id,x.fornecedorNome];
  if(refs.some(v=>v!=null&&typeof v!=='object'&&String(v).trim()===code))return true;
  return refs.some(v=>typeof v==='string'&&v.trim().toUpperCase()===name)||
    refs.some(v=>v&&typeof v==='object'&&(String(v.id||v.codigo||'')===code||String(v.nome||'').trim().toUpperCase()===name));
 };
 const lay=document.createElement('div');lay.dataset.supplierStatement='1';lay.className='forn-statement-overlay';
 lay.innerHTML=`<section class="forn-statement" role="dialog" aria-modal="true" aria-label="Extrato do fornecedor">
 <header class="fs-top"><b>▤ EXTRATO DO FORNECEDOR</b><button type="button" data-fs-close>FECHAR</button></header>
 <div class="fs-scroll">
 <div class="fs-title">DADOS DO FORNECEDOR</div>
 <div class="fs-supplier"><div><small>CÓDIGO</small><b>${esc(item.id)}</b></div><div><small>NOME / RAZÃO SOCIAL</small><b>${esc(item.nome)}</b></div><div><small>CPF / CNPJ</small><b>${esc(item.documento)}</b></div><div><small>TELEFONE</small><b>${esc(item.telefone)}</b></div></div>
 <div class="fs-title">RESUMO FINANCEIRO</div><div class="fs-stats">
 <div><small>TOTAL COMPRADO</small><strong id="fs-compras">R$ 0,00</strong></div>
 <div><small>TOTAL DEVOLVIDO</small><strong id="fs-devolvido">R$ 0,00</strong></div>
 <div><small>TOTAL TROCAS</small><strong id="fs-trocas">R$ 0,00</strong></div>
 <div><small>TOTAL PAGO</small><strong id="fs-pago">R$ 0,00</strong></div>
 <div><small>VALOR VENCIDO</small><strong id="fs-vencido">R$ 0,00</strong></div>
 <div><small>VALOR A VENCER</small><strong id="fs-avencer">R$ 0,00</strong></div>
 <div><small>SALDO A PAGAR</small><strong id="fs-saldo">R$ 0,00</strong></div></div>
 <div class="fs-title">FILTROS DE PESQUISA</div>
 <div class="fs-filters"><label>DATA INICIAL<input id="fs-inicio" type="date"></label><label>DATA FINAL<input id="fs-fim" type="date"></label>
 <label>TIPO DE MOVIMENTAÇÃO<select id="fs-tipo"><option value="">TODOS</option><option>COMPRA</option><option>PARCELA</option><option>PAGAMENTO</option><option>DEVOLUÇÃO</option><option>TROCA</option><option>ESTORNO</option></select></label>
 <label>SITUAÇÃO<select id="fs-situacao"><option value="">TODAS</option><option>PENDENTE</option><option>PAGA</option><option>VENCIDA</option><option>BAIXADA</option><option>CANCELADA</option></select></label>
 <button type="button" id="fs-buscar">PESQUISAR</button></div>
 <div class="fs-title">MOVIMENTAÇÕES DO FORNECEDOR</div>
 <div class="fs-tablewrap"><table><thead><tr><th>DATA</th><th>TIPO</th><th>DOCUMENTO</th><th>HISTÓRICO / DESCRIÇÃO</th><th>VALOR</th><th>VALOR PAGO</th><th>SALDO</th><th>SITUAÇÃO</th></tr></thead><tbody id="fs-linhas"></tbody></table></div>
 <div class="fs-totals"><span id="fs-count">0 movimentações encontradas.</span><b id="fs-total"></b></div>
 <div class="fs-buttons"><button type="button" id="fs-print">IMPRIMIR</button></div>
 </div></section>`;
 document.body.append(lay);
 let selected=null,visible=[];
 const close=()=>{lay.remove();document.removeEventListener('keydown',key,true)};
 const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();const notice=lay.querySelector('[data-fs-notice]');if(notice)notice.remove();else close()}};
 document.addEventListener('keydown',key,true);
 lay.querySelectorAll('[data-fs-close]').forEach(b=>b.addEventListener('click',close));
 const statementNotice=(message)=>{
  // Aviso próprio do extrato: não usa o modal global de fornecedores, que fica atrás da janela.
  const previous=lay.querySelector('[data-fs-notice]');if(previous)previous.remove();
  const shade=document.createElement('div');shade.dataset.fsNotice='1';
  shade.style.cssText='position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;background:rgba(10,35,75,.42);padding:20px';
  const panel=document.createElement('div');panel.setAttribute('role','alertdialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','EXTRATO DO FORNECEDOR');
  panel.style.cssText='width:min(475px,100%);background:white;border-radius:10px;overflow:hidden;box-shadow:0 15px 45px rgba(0,0,0,.28);font:14px Arial,sans-serif;color:#143765';
  const head=document.createElement('div');head.textContent='EXTRATO DO FORNECEDOR';head.style.cssText='background:#18549a;color:white;font-weight:bold;padding:18px 22px';
  const body=document.createElement('div');body.textContent=message;body.style.cssText='padding:26px 22px 18px;text-align:center;line-height:1.5';
  const foot=document.createElement('div');foot.style.cssText='display:flex;justify-content:center;padding:12px 20px 22px';
  const ok=document.createElement('button');ok.type='button';ok.textContent='OK';ok.style.cssText='background:#18549a;color:white;border:0;border-radius:5px;padding:12px 28px;font-weight:bold;cursor:pointer';
  const dismiss=()=>{shade.remove();};ok.addEventListener('click',dismiss);foot.append(ok);panel.append(head,body,foot);shade.append(panel);lay.append(shade);ok.focus();
 };
 const get=id=>lay.querySelector('#'+id);
 const db=read(),mov=[];
 const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
 const todayLocal=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
 const canceled=x=>['CANCELADA','CANCELADO','ESTORNADA','ESTORNADO'].includes(String(x.situacao||x.status||'').toUpperCase())||x.ccCancelado===true;
 const entryRows=(db.entradas||[]).filter(matches);
 const entryById=new Map(entryRows.map(x=>[String(x.id),x]));
 const supplierCP=x=>matches(x)||(typeof x.ref==='string'&&x.ref.startsWith('ENTRADA-')&&entryById.has(x.ref.slice(8)));
 const cpRows=(db.pagar||[]).filter(supplierCP);
 const activeCP=cpRows.filter(x=>!canceled(x));
 const cpForEntry=x=>activeCP.filter(p=>String(p.ref||'')==='ENTRADA-'+String(x.id));
 const add=(type,x,doc,value,paid,description,when,due,forceStatus)=>{
  const amount=num(value),done=Math.min(amount,Math.max(0,num(paid))),balance=Math.max(0,amount-done);
  const dt=iso(when||x.data||x.emissao||x.dataEmissao||x.criadoEm||'');
  const dueDate=iso(due||x.vencimento||'');
  const status=forceStatus||(canceled(x)?'CANCELADA':balance<=0?'BAIXADA':dueDate&&dueDate<todayLocal()?'VENCIDA':'PENDENTE');
  mov.push({type,date:dt,due:dueDate,doc:String(doc??x.id??''),description,amount,paid:done,balance,status,source:x});
 };
 // Entradas são documentos de compra; parcelas financeiras são relacionadas, nunca somadas novamente ao total comprado.
 entryRows.forEach(x=>{
  const cp=cpForEntry(x);
  const paid=cp.reduce((a,p)=>a+num(p.pago),0);
  const entryTotal=num(x.total??x.valorTotal??x.valor);
  add('COMPRA',x,'ENTRADA Nº '+(x.id??x.numero??''),entryTotal,paid,'Entrada de mercadorias',x.data,null,canceled(x)?'CANCELADA':String(x.situacao||'PENDENTE').toUpperCase());
 });
 // Parcelas a pagar têm vencimento próprio. O registro pode ter referência da entrada, mesmo sem fornecedor explícito.
 activeCP.forEach(p=>{
  const entry=p.ref&&String(p.ref).startsWith('ENTRADA-')?entryById.get(String(p.ref).slice(8)):null;
  const label=entry?'ENTRADA Nº '+entry.id:'CONTA Nº '+(p.conta||p.id);
  add('PARCELA',p,label+' / PARCELA '+(p.parcela||p.id),p.valor,p.pago,'Conta a pagar — '+(p.descricao||'fornecedor'),p.data||entry?.data||p.criadoEm,p.vencimento);
  (p.pagamentos||[]).filter(pay=>!pay.estornado).forEach((pay,i)=>{
   const val=num(pay.valor);
   if(val>0)add('PAGAMENTO',pay,'PAGAMENTO '+(i+1)+' / '+label,val,val,'Pagamento registrado — '+(pay.forma||'forma não informada'),pay.data||pay.criadoEm,null,'BAIXADA');
  });
 });
 // Pagamentos imediatos de entradas baixadas não geram CP: demonstrar pagamento sem duplicar a compra.
 entryRows.filter(x=>!canceled(x)&&String(x.situacao).toUpperCase()==='BAIXADA').forEach(x=>{
  (x.parcelas||[]).forEach((part,i)=>{
   const method=String(part.forma||'').toUpperCase();
   const deferred=/BOLETO|PRAZO|CARNÊ|CARNE/.test(method);
   if(!deferred&&num(part.valor)>0)add('PAGAMENTO',part,'ENTRADA Nº '+x.id+' / '+(i+1),part.valor,part.valor,'Pagamento imediato — '+(part.forma||''),x.data,null,'BAIXADA');
  });
 });
 for(const [key,type,desc] of [['devolucoesFornecedores','DEVOLUÇÃO','Devolução de mercadorias'],['trocasFornecedores','TROCA','Troca com fornecedor'],['estornosFornecedores','ESTORNO','Estorno de movimentação']]){
  (db[key]||[]).filter(matches).forEach(x=>add(type,x,x.numero??x.id,x.valor??x.total??0,0,desc,x.data,null));
 }
 mov.sort((a,b)=>(b.date||'').localeCompare(a.date||''));
 const totals=()=>{
  const compras=entryRows.filter(x=>!canceled(x)).reduce((a,x)=>a+num(x.total??x.valorTotal??x.valor),0);
  const sumType=t=>mov.filter(x=>x.type===t&&x.status!=='CANCELADA').reduce((a,x)=>a+x.amount,0);
  const pagoCP=activeCP.reduce((a,x)=>a+num(x.pago),0);
  const pagoImediato=mov.filter(x=>x.type==='PAGAMENTO'&&String(x.doc).startsWith('ENTRADA Nº')).reduce((a,x)=>a+x.amount,0);
  const saldo=activeCP.reduce((a,x)=>a+Math.max(0,num(x.saldo??(num(x.valor)-num(x.pago)))),0);
  const vencido=activeCP.filter(x=>iso(x.vencimento)<todayLocal()&&iso(x.vencimento)).reduce((a,x)=>a+Math.max(0,num(x.saldo??(num(x.valor)-num(x.pago)))),0);
  const aVencer=Math.max(0,saldo-vencido);
  for(const [id,v] of [['fs-compras',compras],['fs-devolvido',sumType('DEVOLUÇÃO')],['fs-trocas',sumType('TROCA')],['fs-pago',pagoCP+pagoImediato],['fs-vencido',vencido],['fs-avencer',aVencer],['fs-saldo',saldo]])get(id).textContent=money(v);
 };
 const refresh=()=>{
  const from=get('fs-inicio').value,to=get('fs-fim').value,type=get('fs-tipo').value,status=get('fs-situacao').value;
  visible=mov.filter(x=>(!from||x.date>=from)&&(!to||x.date<=to)&&(!type||x.type===type)&&(!status||x.status===status));
  const body=get('fs-linhas');body.replaceChildren();selected=null;
  visible.forEach((x,i)=>{
   const tr=document.createElement('tr');tr.innerHTML=`<td>${esc(date(x.date))}</td><td>${esc(x.type)}</td><td>${esc(x.doc)}</td><td>${esc(x.description)}</td><td>${money(x.amount)}</td><td>${money(x.paid)}</td><td>${money(x.balance)}</td><td>${esc(x.status)}</td>`;
   tr.addEventListener('click',()=>{body.querySelectorAll('tr').forEach(t=>t.classList.remove('fs-selected'));tr.classList.add('fs-selected');selected=x});
   tr.addEventListener('dblclick',details);body.append(tr);
  });
  if(!visible.length){const tr=document.createElement('tr');tr.innerHTML='<td colspan="8" style="text-align:center;padding:22px">NENHUMA MOVIMENTAÇÃO ENCONTRADA PARA ESTE FORNECEDOR.</td>';body.append(tr)}
  get('fs-count').textContent=visible.length+' MOVIMENTAÇÃO(ÕES) ENCONTRADA(S)';
  get('fs-total').textContent='TOTAL COMPRADO NA PESQUISA: '+money(visible.filter(x=>x.type==='COMPRA'&&x.status!=='CANCELADA').reduce((a,x)=>a+x.amount,0));
 };
 const details=()=>{
  if(!selected){notify('SELECIONE UMA MOVIMENTAÇÃO NA LISTA.');return}
  modal('DETALHES DA MOVIMENTAÇÃO','<p><b>TIPO:</b> '+esc(selected.type)+'</p><p><b>DOCUMENTO:</b> '+esc(selected.doc)+'</p><p><b>DATA:</b> '+esc(date(selected.date))+'</p><p><b>VALOR:</b> '+money(selected.amount)+'</p><p><b>VALOR PAGO:</b> '+money(selected.paid)+'</p><p><b>SITUAÇÃO:</b> '+esc(selected.status)+'</p>');
 };
 get('fs-buscar').addEventListener('click',refresh);
 let hasSearched=false;
 const oldRefresh=refresh;
 // Impressão independente: evita que regras de etiquetas afetem o extrato.
 get('fs-buscar').addEventListener('click',()=>{hasSearched=true});
 const openPrintPreview=()=>{
  if(!hasSearched){statementNotice('CLIQUE EM PESQUISAR ANTES DE IMPRIMIR O EXTRATO.');return}
  if(document.querySelector('[data-fs-preview]'))return;
  let orient='portrait';
  const dataFiltro=[get('fs-inicio').value&&'DE '+date(get('fs-inicio').value),get('fs-fim').value&&'ATÉ '+date(get('fs-fim').value),get('fs-tipo').value,get('fs-situacao').value].filter(Boolean).join(' · ');
  const stats=[['TOTAL COMPRADO','fs-compras'],['TOTAL DEVOLVIDO','fs-devolvido'],['TOTAL TROCAS','fs-trocas'],['TOTAL PAGO','fs-pago'],['VALOR VENCIDO','fs-vencido'],['VALOR A VENCER','fs-avencer'],['SALDO A PAGAR','fs-saldo']];
  const statsHtml=stats.map(([name,id])=>'<div class="stat"><small>'+name+'</small><b>'+esc(get(id).textContent)+'</b></div>').join('');
  const rows=visible.map(x=>'<tr><td>'+esc(date(x.date))+'</td><td>'+esc(x.type)+'</td><td>'+esc(x.doc)+'</td><td>'+esc(x.description)+'</td><td class="num">'+money(x.amount)+'</td><td class="num">'+money(x.paid)+'</td><td class="num">'+money(x.balance)+'</td><td>'+esc(x.status)+'</td></tr>').join('');
  let html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Extrato do Fornecedor</title><style>
  @page{size:A4 ${orient};margin:12mm}*{box-sizing:border-box}html,body{margin:0;padding:0;color:#15345c;font:10px Arial,sans-serif;background:white}h1{font-size:16px;text-align:center;margin:12px 0 16px}h2{font-size:11px;margin:17px 0 7px;padding-bottom:5px;border-bottom:1px solid #a9bfd8;color:#103e7b}.header{display:flex;justify-content:space-between;gap:12px;align-items:start;border-bottom:2px solid #103e7b;padding-bottom:9px}.header b{font-size:15px}.muted{font-size:9px;color:#52677f}.supplier{display:grid;grid-template-columns:1fr 3fr 2fr 1.5fr;gap:8px}.supplier div{padding:5px 0}.supplier small,.stat small{display:block;font-size:8px;color:#52677f;margin-bottom:4px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.stat{padding:7px 0;border-bottom:1px solid #d5e0ed}.stat b{font-size:12px}table{width:100%;border-collapse:collapse;table-layout:fixed}th{text-align:left;background:#e8f0fa;color:#123e75;padding:7px 4px;font-size:8px}td{padding:7px 4px;vertical-align:top;border-bottom:1px solid #e3eaf2;overflow-wrap:anywhere}th:nth-child(1){width:11%}th:nth-child(2){width:10%}th:nth-child(3){width:17%}th:nth-child(4){width:24%}th:nth-child(5),th:nth-child(6),th:nth-child(7){width:10%}th:nth-child(8){width:8%}.num{text-align:right;white-space:nowrap;font-size:9px}tr{break-inside:avoid}thead{display:table-header-group}.bottom{margin-top:12px;display:flex;justify-content:space-between;font-weight:bold;font-size:10px}.foot{margin-top:20px;text-align:right;color:#15345c;font-size:9px;font-weight:bold}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><h1>EXTRATO DO FORNECEDOR</h1><h2>DADOS DO FORNECEDOR</h2><div class="supplier"><div><small>CÓDIGO</small><b>${esc(item.id)}</b></div><div><small>NOME / RAZÃO SOCIAL</small><b>${esc(item.nome)}</b></div><div><small>CPF / CNPJ</small><b>${esc(item.documento)}</b></div><div><small>TELEFONE</small><b>${esc(item.telefone)}</b></div></div><h2>RESUMO FINANCEIRO</h2><div class="stats">${statsHtml}</div><h2>MOVIMENTAÇÕES DO FORNECEDOR</h2><p class="muted">${esc(dataFiltro||'TODAS AS MOVIMENTAÇÕES')} · ${visible.length} MOVIMENTAÇÃO(ÕES)</p><table><thead><tr><th>DATA</th><th>TIPO</th><th>DOCUMENTO</th><th>HISTÓRICO / DESCRIÇÃO</th><th>VALOR</th><th>VALOR PAGO</th><th>SALDO</th><th>SITUAÇÃO</th></tr></thead><tbody>${rows||'<tr><td colspan="8">NENHUMA MOVIMENTAÇÃO ENCONTRADA.</td></tr>'}</tbody></table><div class="bottom"><span>TOTAL COMPRADO NA PESQUISA</span><span>${money(visible.filter(x=>x.type==='COMPRA'&&x.status!=='CANCELADA').reduce((a,x)=>a+x.amount,0))}</span></div><div class="foot">EMITIDO EM ${new Date().toLocaleDateString('pt-BR')}, POR ${esc(user())}.</div></body></html>`;
  const overlay=document.createElement('div');overlay.dataset.fsPreview='1';overlay.style.cssText='position:fixed;inset:0;z-index:350000;background:rgba(5,20,42,.65);display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;font-family:Arial,sans-serif;color:#123b70';
  overlay.innerHTML=`<section style="width:min(1160px,98vw);height:min(88vh,790px);background:#fff;border-radius:10px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 15px 50px #0004" role="dialog" aria-modal="true" aria-label="Pré-visualização do extrato do fornecedor">
  <header style="background:#174b88;color:white;padding:18px 22px;font-size:19px;font-weight:bold;display:flex;justify-content:space-between;align-items:center">IMPRIMIR EXTRATO DO FORNECEDOR <button type="button" data-preview-close style="background:transparent;color:white;border:0;font-size:23px;cursor:pointer">×</button></header>
  <div style="padding:17px;display:grid;grid-template-columns:minmax(270px,40%) minmax(0,60%);gap:15px;overflow:auto;flex:1">
   <div style="border:1px solid #c7d9ef;border-radius:7px;padding:14px;align-self:start">
    <div style="background:#e4eefb;padding:12px;font-weight:bold">DADOS DO FORNECEDOR SELECIONADO</div>
    <p><b>CÓDIGO:</b> ${esc(item.id)}</p><p><b>FORNECEDOR:</b> ${esc(item.nome)}</p><p><b>CPF/CNPJ:</b> ${esc(item.documento)}</p><p><b>TELEFONE:</b> ${esc(item.telefone)}</p>
    <div style="background:#e4eefb;padding:12px;font-weight:bold">RESUMO FINANCEIRO</div>
    ${stats.map(([name,id])=>'<p style="margin:10px 0"><b>'+esc(name)+':</b> '+esc(get(id).textContent)+'</p>').join('')}
    <div style="background:#e4eefb;padding:12px;font-weight:bold">MOVIMENTAÇÕES</div><p>${visible.length} movimentação(ões) encontrada(s).</p>
    <div style="background:#e4eefb;padding:12px;font-weight:bold;margin-top:14px">ORIENTAÇÃO DA FOLHA</div>
    <label for="fs-preview-orientation" style="display:block;margin:12px 0 6px;font-size:12px;font-weight:bold">SELECIONE A ORIENTAÇÃO A4</label>
    <select id="fs-preview-orientation" data-preview-orientation style="width:100%;padding:12px;border:1px solid #b7cde8;border-radius:5px;color:#153e75;background:white;font-weight:bold">
     <option value="portrait">RETRATO</option><option value="landscape">PAISAGEM</option>
    </select>
   </div>
   <div style="border:1px solid #c7d9ef;border-radius:7px;padding:13px;min-width:0">
    <div style="background:#e4eefb;padding:12px;font-weight:bold;margin-bottom:10px">PRÉ-VISUALIZAÇÃO A4</div>
    <iframe title="Pré-visualização A4 do extrato" data-preview-frame style="display:block;width:100%;height:100%;min-height:420px;border:1px solid #c7d9ef;background:white"></iframe>
   </div>
  </div>
  <footer style="display:flex;gap:10px;justify-content:flex-end;padding:14px 18px;border-top:1px solid #d8e4f3;background:#fff">
   <button type="button" data-preview-print style="background:#1763ce;color:#fff;border:0;border-radius:5px;padding:12px 26px;font-weight:bold;cursor:pointer">IMPRIMIR</button>
   <button type="button" data-preview-save style="background:#07986b;color:#fff;border:0;border-radius:5px;padding:12px 26px;font-weight:bold;cursor:pointer">SALVAR</button>
   <button type="button" data-preview-close style="background:#e7f1ff;color:#16467e;border:1px solid #b7d2f2;border-radius:5px;padding:12px 26px;font-weight:bold;cursor:pointer">FECHAR</button>
  </footer></section>`;
  document.body.append(overlay);
  const frame=overlay.querySelector('[data-preview-frame]');
  const orientationInput=overlay.querySelector('[data-preview-orientation]');
  const refreshPreview=()=>{
   const updated=html.replace(/@page\{size:A4 (?:portrait|landscape);/, '@page{size:A4 '+orient+';').replace(/EMITIDO EM \d{2}\/\d{2}\/\d{4}, POR [^<]*\./, 'EMITIDO EM '+new Date().toLocaleDateString('pt-BR')+', POR '+esc(user())+'.');
   frame.srcdoc=updated;
   frame.style.minHeight=orient==='landscape'?'360px':'420px';
  };
  orientationInput.addEventListener('change',()=>{orient=orientationInput.value;refreshPreview()});
  refreshPreview();
  const dismiss=()=>{overlay.remove();document.removeEventListener('keydown',previewKey,true)};
  const previewKey=e=>{if(e.key==='Escape'){e.stopImmediatePropagation();e.preventDefault();dismiss()}};
  document.addEventListener('keydown',previewKey,true);
  overlay.querySelectorAll('[data-preview-close]').forEach(b=>b.addEventListener('click',dismiss));
  let busy=false;
  overlay.querySelector('[data-preview-print]').addEventListener('click',()=>{
   if(busy)return;busy=true;
   try{refreshPreview();frame.onload=()=>{frame.contentWindow.focus();frame.contentWindow.print()}}catch(e){statementNotice('NÃO FOI POSSÍVEL ABRIR A JANELA DE IMPRESSÃO.')}
   setTimeout(()=>{busy=false},1500);
  });
  overlay.querySelector('[data-preview-save]').addEventListener('click',async()=>{
   if(busy)return;busy=true;
   const btn=overlay.querySelector('[data-preview-save]');btn.disabled=true;
   try{
    if(typeof window.LucasExtratoFornecedorPDF!=='function')throw Error('Gerador de PDF indisponível.');
    await window.LucasExtratoFornecedorPDF({company:(db.loja&&db.loja.nome)||'LOJA',supplier:item.nome,code:item.id,document:item.documento,phone:item.telefone,orientation:orient,issuedBy:user(),issuedAt:new Date().toLocaleDateString('pt-BR'),stats:stats.map(([name,id])=>[name,get(id).textContent]),filter:dataFiltro,rows:visible.map(x=>({date:date(x.date),type:x.type,doc:x.doc,description:x.description,amount:money(x.amount),paid:money(x.paid),balance:money(x.balance)})),total:money(visible.filter(x=>x.type==='COMPRA'&&x.status!=='CANCELADA').reduce((a,x)=>a+x.amount,0))});
   }catch(e){statementNotice('NÃO FOI POSSÍVEL SALVAR O PDF: '+(e.message||e))}
   finally{busy=false;btn.disabled=false}
  });
 };
 get('fs-print').addEventListener('click',openPrintPreview);

 totals();get('fs-linhas').innerHTML='<tr><td colspan="8" style="text-align:center;padding:22px">INFORME OS FILTROS E CLIQUE EM PESQUISAR.</td></tr>';get('fs-count').textContent='CLIQUE EM PESQUISAR PARA EXIBIR AS MOVIMENTAÇÕES.';get('fs-total').textContent='';
}

const style=document.createElement('style');style.textContent=`
#forn-main{background:#fff;border:1px solid #d9e4f1;border-radius:7px;overflow:hidden;margin-bottom:8px}
/* Modal de fornecedores independente: não depende de outra janela ter sido aberta. */
.erp-modal-overlay[data-supplier-modal]{
 position:fixed;inset:0;z-index:300001;background:rgba(8,25,52,.62);
 display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;
}
.erp-modal-overlay[data-supplier-modal] .erp-modal-box{
 width:min(475px,100%);background:#fff;border-radius:9px;overflow:hidden;
 box-shadow:0 18px 55px rgba(0,0,0,.35);font-family:Arial,sans-serif;
}
.erp-modal-overlay[data-supplier-modal] .erp-modal-header{
 background:#14549b;color:#fff;padding:15px 18px;display:flex;
 align-items:center;justify-content:space-between;font-size:15px;
}
.erp-modal-overlay[data-supplier-modal] .erp-modal-close{
 border:0;background:transparent;color:#fff;font-size:25px;cursor:pointer;
}
.erp-modal-overlay[data-supplier-modal] .erp-modal-body{
 padding:22px;color:#15345c;font-size:14px;line-height:1.6;
}
.erp-modal-overlay[data-supplier-modal] .erp-modal-footer{
 padding:12px 18px;display:flex;justify-content:flex-end;
}
.erp-modal-overlay[data-supplier-modal] .erp-modal-confirm{
 border:0;border-radius:5px;padding:10px 16px;background:#14549b;
 color:white;font-weight:700;cursor:pointer;
}
.erp-modal-overlay[data-supplier-modal] .erp-modal-input{
 display:block;width:100%;height:38px;box-sizing:border-box;margin:6px 0 12px;
 border:1px solid #b9cbe0;border-radius:5px;padding:7px;
}

.forn-statement-overlay{position:fixed;inset:0;z-index:250000;background:rgba(5,20,42,.65);padding:18px;display:flex;align-items:center;justify-content:center;box-sizing:border-box}
.forn-statement{width:min(1250px,100%);height:min(900px,96vh);display:flex;flex-direction:column;background:#fff;border-radius:9px;overflow:hidden;color:#12345e;font-family:Arial,sans-serif;box-shadow:0 18px 60px #001a3b88}
.fs-top{display:flex;align-items:center;justify-content:space-between;background:#103e7b;color:#fff;padding:14px 18px;font-size:17px}
.fs-top button{background:#e7f1ff;border:1px solid #b7d2f2;border-radius:5px;color:#12467e;padding:8px 14px;cursor:pointer}
.fs-scroll{padding:13px;overflow:auto;flex:1}
.fs-title{background:#dbe9fc;color:#123e75;padding:8px 10px;font-size:13px;font-weight:700;border-radius:5px;margin:5px 0 8px}
.fs-supplier{display:grid;grid-template-columns:1fr 3fr 1.8fr 1.5fr;gap:9px;margin-bottom:14px}
.fs-supplier>div{border:1px solid #c7d9ef;background:#f3f7fd;border-radius:5px;padding:8px;min-width:0}
.fs-supplier small,.fs-stats small{display:block;font-size:10px;font-weight:bold;margin-bottom:5px}
.fs-supplier b{display:block;font-size:12px;overflow-wrap:anywhere}
.fs-stats{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:9px;margin-bottom:14px}
.fs-stats>div{padding:13px 8px;border:1px solid #b9d2f0;background:#edf5ff;border-radius:8px;text-align:center}
.fs-stats>div:nth-child(2){background:#fff4e9;border-color:#ffca97}
.fs-stats>div:nth-child(4){background:#eaf9ef;border-color:#a6d7b5}
.fs-stats>div:nth-child(5){background:#fff0f0;border-color:#eab1b1}
.fs-stats strong{font-size:16px;white-space:nowrap}
.fs-filters{display:grid;grid-template-columns:1fr 1fr 1.4fr 1fr auto;gap:8px;align-items:end;margin-bottom:15px}
.fs-filters label{font-size:10px;font-weight:700}
.fs-filters input,.fs-filters select{display:block;width:100%;height:36px;box-sizing:border-box;border:1px solid #b7cce5;border-radius:5px;padding:5px;margin-top:4px;background:#fff}
.fs-filters button,.fs-buttons button{border:0;border-radius:5px;background:#165ca8;color:white;font-weight:700;cursor:pointer;padding:11px 14px}
.fs-tablewrap{overflow:auto;max-height:300px}
.fs-tablewrap table{border-collapse:collapse;width:100%;font-size:11px}
.fs-tablewrap th{background:#e1edfa;text-align:left;white-space:nowrap}
.fs-tablewrap td,.fs-tablewrap th{padding:10px 7px;border-bottom:1px solid #d7e4f1}
.fs-tablewrap tr{cursor:pointer}
.fs-tablewrap .fs-selected{background:#cde6ff}
.fs-totals{display:flex;justify-content:space-between;gap:10px;background:#edf3fa;padding:10px;font-size:12px}
.fs-buttons{display:flex;justify-content:flex-end;align-items:end;gap:10px;margin-top:15px}.fs-orientation{font-size:11px;font-weight:bold;color:#153e75;display:flex;flex-direction:column;gap:5px}.fs-orientation select{min-width:165px;height:40px;border:1px solid #b9cbe0;border-radius:5px;padding:6px;background:#fff;color:#153e75}.fs-buttons button{min-width:220px}
.forn-statement-overlay #fs-print{background:#1763ce}
@media(max-width:950px){.fs-stats{grid-template-columns:repeat(3,1fr)}.fs-filters{grid-template-columns:repeat(3,1fr)}.fs-supplier{grid-template-columns:repeat(2,1fr)}}
@media print{body>*:not(.forn-statement-overlay){display:none!important}.forn-statement-overlay{position:static;padding:0;background:#fff}.forn-statement{width:100%;height:auto;box-shadow:none}.fs-scroll{overflow:visible}.fs-top button,.fs-buttons,.fs-filters button{display:none!important}.fs-tablewrap{max-height:none;overflow:visible}}
#forn-head{display:flex;justify-content:space-between;align-items:center;background:#153e73;color:#fff;padding:9px 13px;font-size:14px;font-weight:700}
#forn-shortcut{background:#1b5595;border:1px solid #a4c4ed;color:#fff;border-radius:5px;padding:6px 12px;font-weight:700;cursor:pointer;font-size:12px}
#forn-actions{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;padding:8px 2px 9px} #forn-actions .action-button{width:100%;min-width:0;min-height:34px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:11px;font-weight:700;padding:7px 5px;white-space:normal} #forn-actions .action-button:nth-child(1){background:#195ba5;color:#fff} #forn-actions .action-button:nth-child(2){background:#119b79;color:#fff} #forn-actions .action-button:nth-child(3){background:#e99a12;color:#fff} #forn-actions .action-button:nth-child(4){background:#195ba5;color:#fff} #forn-actions .action-button:nth-child(5){background:#d74855;color:#fff}
#forn-form{padding:8px 13px 12px}
#forn-form h3{background:#eaf1fb;color:#153e73;font-size:12px;padding:8px;margin:0 0 10px}
#forn-fields{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:9px 11px}
#forn-fields label{display:flex;flex-direction:column;font-size:11px;font-weight:700;color:#28415e;gap:4px;min-width:0}
#forn-fields input,#forn-fields select{height:32px;box-sizing:border-box;border:1px solid #c5d5e7;border-radius:5px;padding:5px 8px;font-size:12px;width:100%;background:#fff}
#forn-search-panel{background:#fff;border:1px solid #d9e4f1;border-radius:7px;padding:12px}
#forn-search-panel h3{color:#163f73;margin:0 0 10px;font-size:14px}
#forn-search-tools{display:flex;gap:10px;align-items:end;flex-wrap:wrap;margin-bottom:10px}
#forn-search-tools input,#forn-search-tools select{height:34px;border:1px solid #c5d5e7;border-radius:5px;padding:5px 8px}
#forn-search-tools input{flex:1;min-width:220px}
#forn-search-panel table{width:100%;border-collapse:collapse;font-size:11px}
#forn-search-panel th{background:#e8eff8;text-align:left;padding:9px 6px}
#forn-search-panel td{padding:8px 6px;border-bottom:1px solid #e5ebf4}
#forn-count{padding-top:10px;font-size:11px;color:#49637f}
`;document.head.append(style);
function show(){screen='FORNECEDORES';const workspace=root();workspace.replaceChildren();const main=document.createElement('section');main.id='forn-main';main.innerHTML='<header id="forn-head"><span>CADASTRO DE FORNECEDORES</span></header><div id="forn-form"><h3>DADOS DO FORNECEDOR</h3><div id="forn-fields"></div></div><div id="forn-actions"></div>';workspace.append(main);const actions=[['NOVO','blue',clear],['GRAVAR','green',save],['ALTERAR','orange',()=>current===null?notify('SELECIONE UM FORNECEDOR.'):save()],['EXTRATO DO FORNECEDOR','blue',extrato],['VOLTAR','red',()=>{if(window.__cpSupplierReturn?.restore)window.__cpSupplierReturn.restore(null);else category('CADASTROS')}]];if(window.__cpSupplierReturn?.restore)actions[actions.length-1][0]='VOLTAR PARA CONTAS A PAGAR';actions.forEach(([label,color,fn])=>{const b=document.createElement('button');b.type='button';b.className='action-button '+color;b.textContent=label;b.addEventListener('click',fn);el('forn-actions').append(b)});fields.forEach(([label,key,span])=>{const wrap=document.createElement('label');wrap.style.gridColumn='span '+span;wrap.textContent=label;const control=['tipo','situacao'].includes(key)?document.createElement('select'):document.createElement('input');control.id='forn-'+key;if(key==='tipo'||key==='situacao')(key==='tipo'?['FÍSICA','JURÍDICA']:['ATIVO','INATIVO']).forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;control.append(o)});if(['id','usuario'].includes(key))control.readOnly=true;if(key==='usuario'){control.style.cursor='pointer';control.title='Clique para consultar o histórico de alterações';control.addEventListener('click',historySupplier)}wrap.append(control);el('forn-fields').append(wrap)});const panel=document.createElement('section');panel.id='forn-search-panel';panel.innerHTML='<h3>⌕ PESQUISA DE FORNECEDORES</h3><div id="forn-search-tools"><input id="forn-search" placeholder="Pesquisar código, nome, CPF/CNPJ, telefone ou cidade"><label>SITUAÇÃO <select id="forn-status"><option>TODOS</option><option>ATIVO</option><option>INATIVO</option></select></label><button type="button" id="forn-search-button" class="action-button blue">PESQUISAR</button></div><div style="overflow-x:auto"><table><thead><tr><th>CÓDIGO</th><th>NOME / RAZÃO SOCIAL</th><th>CPF / CNPJ</th><th>TELEFONE</th><th>CIDADE</th><th>CONTATO</th><th>SITUAÇÃO</th></tr></thead><tbody id="forn-results"></tbody></table></div><div id="forn-count"></div>';workspace.append(panel);
// Um único botão, criado DIRETAMENTE no cabeçalho.
const botaoAtalhosFuncional=document.createElement('button');
botaoAtalhosFuncional.type='button';
botaoAtalhosFuncional.id='forn-shortcut';
botaoAtalhosFuncional.textContent='⌂ ATALHOS';
botaoAtalhosFuncional.addEventListener('click',function(event){
 event.preventDefault();event.stopPropagation();shortcuts();
});
el('forn-head').append(botaoAtalhosFuncional);
// Retira apenas botões ATALHOS adicionais injetados por rotinas antigas.
function removerAtalhosDuplicados(){
 const main=el('forn-main');if(!main)return;
 main.querySelectorAll('button').forEach(b=>{
  if(b!==botaoAtalhosFuncional && /ATALHOS/i.test(b.textContent||''))b.remove();
 });
}
removerAtalhosDuplicados();
wireSupplierFields();el('forn-search-button').addEventListener('click',render);clear();active('CADASTROS')}
const originalOpen=open;open=function(name){if(name==='FORNECEDORES')return show();return originalOpen(name)};
document.addEventListener('keydown',e=>{if(screen!=='FORNECEDORES'||!el('forn-main')||document.querySelector('[data-supplier-modal]'))return;if(e.key==='F1'){e.preventDefault();e.stopImmediatePropagation();shortcuts()}else if(e.key==='F12'){e.preventDefault();e.stopImmediatePropagation();lookup()}},true);
})();

/* Atalhos do fornecedor — padrão visual do cadastro de categorias */
(function(){const style=document.createElement('style');style.textContent=`
.forn-shortcuts-modal .erp-modal-box{width:min(475px,calc(100vw - 32px));max-width:475px;border-radius:14px;overflow:hidden}
.forn-shortcuts-modal .erp-modal-header{background:#215995;color:#fff;padding:19px 21px}
.forn-shortcuts-modal .erp-modal-body{padding:24px 21px 10px}
.forn-shortcuts-modal .erp-modal-footer{padding:14px 20px 18px;display:flex;justify-content:flex-end}
.forn-shortcut-row{display:flex;align-items:center;gap:16px;padding:9px 0;border-bottom:1px solid #d8e4f3;color:#173d70;font-size:14px}
.forn-shortcut-key{display:inline-flex;align-items:center;justify-content:center;min-width:54px;height:36px;border:1px solid #bed4f9;border-radius:5px;background:#eef4ff;font-weight:700;color:#133b70}
`;document.head.append(style)})();
