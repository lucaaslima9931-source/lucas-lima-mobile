/* LUCAS LIMA — Formas de pagamento: configuração local e taxas por parcela. */
(()=>{'use strict';
const K='erp_matriz_formas_pagamento_v1', $=id=>document.getElementById(id), esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const num=x=>{let s=String(x??'').trim();if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');return Number(s)};
const initial=['DINHEIRO','PIX','CARTÃO DE DÉBITO','CARTÃO DE CRÉDITO','TRANSFERÊNCIA'].map((descricao,i)=>({id:i+1,descricao,tipo:['DINHEIRO','PIX','DÉBITO','CRÉDITO','TRANSFERÊNCIA'][i],conta:['CAIXA DA LOJA','CONTA BANCÁRIA','CONTA BANCÁRIA','CONTA BANCÁRIA','CONTA BANCÁRIA'][i],ativo:true,vendas:true,compras:true,parcelamento:i===3||i===4,maxParcelas:i===3?12:i===4?12:1,observacoes:'',taxas:[]}));
let db;try{db=JSON.parse(localStorage.getItem(K)||'null')}catch{}if(!db||!Array.isArray(db.formas))db={formas:initial};
// O código 5 é exclusivo de compras/entradas; não recriar carnê de vendas.
 db.formas=db.formas.filter(x=>!/CARN[EÊ]/i.test(String(x.descricao||'')) && !(String(x.tipo||'').toUpperCase()==='BOLETO' && Number(x.id)!==5));
 const boletoCompras={id:5,descricao:'BOLETO BANCÁRIO',tipo:'BOLETO',conta:'',contaId:null,ativo:true,vendas:false,compras:true,parcelamento:true,maxParcelas:120,observacoes:'UTILIZAR SOMENTE EM COMPRAS E ENTRADAS',taxas:[]};
 const posBoleto=db.formas.findIndex(x=>Number(x.id)===5);
 if(posBoleto>=0)db.formas[posBoleto]={...db.formas[posBoleto],...boletoCompras};else db.formas.push(boletoCompras);
 db.formas.sort((a,b)=>Number(a.id)-Number(b.id));
 try{localStorage.setItem(K,JSON.stringify(db))}catch(e){}
let current=null,editing=false,query='',status='TODOS',paymentsSearched=false,selectedOperator='CIELO';let rateDraft={};
const persist=()=>{try{localStorage.setItem(K,JSON.stringify(db));const stored=JSON.parse(localStorage.getItem(K));if(stored&&Array.isArray(stored.formas))db=stored;return true}catch{msg('Não foi possível gravar. Verifique o armazenamento do navegador.');return false}};
const msg=t=>{const n=$('fp-message');if(n){n.textContent=t;n.hidden=false;}};
const next=()=>Math.max(0,...db.formas.map(x=>Number(x.id)||0))+1;
const form=()=>db.formas.find(x=>x.id===current);
// Integração com o cadastro de contas do Financeiro (mesma chave persistida).
const FIN_KEY='erp_systems_financeiro_v1';
function financialAccounts(){try{const d=JSON.parse(localStorage.getItem(FIN_KEY)||'{}');return Array.isArray(d.contas)?d.contas:[]}catch{return []}}
function accountForPayment(x){
 const accounts=financialAccounts();
 const id=Number(x.contaId);
 if(Number.isInteger(id)&&id>0){const a=accounts.find(a=>Number(a.id)===id);if(a)return a}
 const legacy=String(x.conta||'').trim().toUpperCase();
 if(!legacy)return null;
 let a=accounts.find(a=>String(a.nome||'').trim().toUpperCase()===legacy);
 if(!a&&legacy==='CAIXA DA LOJA')a=accounts.find(a=>a.contaPadrao==='CAIXA')||accounts.find(a=>String(a.nome||'').toUpperCase()==='CAIXA');
 if(!a&&legacy==='CONTA BANCÁRIA')a=accounts.find(a=>a.tipo==='BANCO'&&a.ativo!==false);
 return a||null;
}
function accountLabel(x){if(x.tipo==='BOLETO')return '';const a=accountForPayment(x);return a?a.nome:(x.contaId?'CONTA NÃO ENCONTRADA':'SELECIONE UMA CONTA')}
function refreshAccountOptions(x){
 const select=$('fp-account');if(!select)return;
 const accounts=financialAccounts(),chosen=accountForPayment(x||{});
 const boleto=$('fp-type').value==='BOLETO';
 select.replaceChildren();
 if(boleto){select.add(new Option('',''));select.value='';select.disabled=true;select.closest('label').style.display='';select.closest('label').querySelector('.fp-account-required')?.remove();return}
 select.closest('label').style.display='';
 if(!select.closest('label').querySelector('.fp-account-required'))select.closest('label').insertAdjacentHTML('afterbegin','<span class="fp-account-required" hidden></span>');
 select.disabled=false;select.add(new Option('SELECIONE UMA CONTA',''));
 for(const a of accounts){if(a.ativo===false&&(!chosen||Number(chosen.id)!==Number(a.id)))continue;
  const option=new Option(a.nome+(a.ativo===false?' (INATIVA)':''),String(a.id));
  if(a.ativo===false)option.disabled=true;
  select.add(option);
 }
 if(chosen)select.value=String(chosen.id);
 if(!select.value&&accounts.length===0)select.add(new Option('CADASTRE CONTAS NO FINANCEIRO','',false,false));
}

const btn=(id,label,cls)=>`<button type="button" id="${id}" class="action-button ${cls}">${label}</button>`;
function screenPayments(){screen='FORMAS DE PAGAMENTO';root().replaceChildren();const p=document.createElement('section');p.className='fp-page fp-new-layout';p.innerHTML=`<header class="fp-titlebar"><h1>CADASTRO DE FORMAS DE PAGAMENTO</h1><button type="button" id="fp-shortcuts">ATALHOS</button></header><div class="fp-actions">${btn('fp-new','NOVO','blue')}${btn('fp-save','GRAVAR','green')}${btn('fp-edit','ALTERAR','orange')}${btn('fp-back','VOLTAR','red')}</div><p id="fp-message" class="fp-message" hidden></p><section class="fp-card"><h2>DADOS DA FORMA DE PAGAMENTO</h2><div class="fp-fields"><label>CÓDIGO<input id="fp-code" readonly></label><label>DESCRIÇÃO *<input id="fp-name" maxlength="90" placeholder="Ex.: CIELO CRÉDITO"></label><label>TIPO *<select id="fp-type"><option>DINHEIRO</option><option>PIX</option><option value="CRÉDITO">CARTÃO DE CRÉDITO</option><option value="DÉBITO">CARTÃO DE DÉBITO</option><option>TRANSFERÊNCIA</option><option value="BOLETO">BOLETO</option><option>OUTRO</option></select></label><label>CONTA DE DESTINO<select id="fp-account"><option>CAIXA DA LOJA</option><option>CONTA BANCÁRIA</option><option>CONTAS A RECEBER</option><option>OUTRA CONTA</option></select></label><label>SITUAÇÃO<select id="fp-active"><option value="SIM">ATIVO</option><option value="NÃO">INATIVO</option></select></label><label>QUANTIDADE MÁXIMA DE PARCELAS<input id="fp-max" type="number" min="1" max="120" step="1"></label><label>USUÁRIO<input id="fp-user" readonly title="Clique para consultar o histórico de alterações" style="cursor:pointer;background:#e8eef6;color:#17477e;font-weight:bold"></label><label class="fp-wide">OBSERVAÇÕES<textarea id="fp-notes" rows="2"></textarea></label></div><div class="fp-options"><label><input type="checkbox" id="fp-installments"> PERMITE PARCELAMENTO</label><label><input type="checkbox" id="fp-sales"> UTILIZAR EM VENDAS</label><label><input type="checkbox" id="fp-purchases"> UTILIZAR EM COMPRAS</label></div></section><section class="fp-card" id="fp-rate-card"><h2>TAXAS DA OPERADORA (CARTÃO)</h2><p class="fp-note">Cadastre a taxa de cada parcela no próprio cartão. A taxa é custo da loja e não altera o valor cobrado do cliente.</p><div class="fp-rate-grid" id="fp-rate-grid"></div><div class="fp-rate-legacy" hidden><input id="fp-operator"><select id="fp-parcel"></select><input id="fp-rate"><div id="fp-rates"></div><button id="fp-add-rate" type="button">SALVAR TAXA</button></div></section><section class="fp-card" id="fp-pix-card" hidden><h2>TAXA DO PIX</h2><p class="fp-note">Informe a taxa percentual cobrada pela instituição. O cliente paga o valor integral; a conta de destino recebe o valor líquido.</p><div class="fp-pix-row"><label>TAXA DO PIX (%)<input id="fp-pix-rate" type="text" inputmode="decimal" placeholder="Ex.: 0,99" autocomplete="off"></label><div id="fp-pix-preview">Exemplo: PIX de R$ 100,00 — líquido R$ 100,00</div></div></section><section class="fp-card fp-list-card"><h2>PESQUISA DE FORMAS DE PAGAMENTO</h2><div class="fp-filter fp-search-fields"><label>PESQUISAR POR CÓDIGO, DESCRIÇÃO OU TIPO<input id="fp-filter" placeholder="CÓDIGO, DESCRIÇÃO OU TIPO"></label><label>SITUAÇÃO<select id="fp-status"><option value="TODOS">TODOS</option><option value="ATIVO">ATIVO</option><option value="INATIVO">INATIVO</option></select></label><button type="button" id="fp-search-filter" class="action-button blue">PESQUISAR</button></div><div class="fp-tablewrap"><table class="fp-table"><thead><tr><th>CÓDIGO</th><th>DESCRIÇÃO</th><th>TIPO</th><th>CONTA DE DESTINO</th><th>PARCELAS</th><th>SITUAÇÃO</th></tr></thead><tbody id="fp-list"></tbody></table></div><p class="fp-note">Dê dois cliques em uma forma de pagamento para abrir seu cadastro.</p></section></section>`;root().append(p);p.querySelector('.fp-list-card').before(p.querySelector('.fp-actions'));active('CADASTROS');bind();newForm();list();$('fp-shortcuts').onclick=()=>{if(document.querySelector('.fp-overlay'))return;const overlay=document.createElement('div');overlay.className='fp-overlay fp-shortcuts-overlay';overlay.innerHTML='<div class="fp-dialog fp-shortcuts-dialog" role="dialog" aria-modal="true" aria-label="Atalhos — Formas de Pagamento"><div class="fp-shortcuts-head"><strong>⌂ ATALHOS — ▣ FORMAS DE PAGAMENTO</strong><button type="button" class="fp-shortcuts-x" aria-label="Fechar">×</button></div><div class="fp-shortcuts-body"><div class="fp-shortcuts-row"><kbd>F1</kbd><span>Abrir esta janela de atalhos</span></div><div class="fp-shortcuts-row"><kbd>F12</kbd><span>Localizar forma de pagamento por código</span></div></div><div class="fp-shortcuts-footer"><button type="button" class="fp-shortcuts-close">FECHAR</button></div></div>';document.body.append(overlay);const close=()=>{document.removeEventListener('keydown',key,true);overlay.remove()},key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}};document.addEventListener('keydown',key,true);overlay.querySelector('.fp-shortcuts-close').onclick=close;overlay.querySelector('.fp-shortcuts-x').onclick=close;overlay.onclick=e=>{if(e.target===overlay)close()};};}
function cardType(){return ['CRÉDITO','DÉBITO'].includes($('fp-type').value)}
function renderPix(){const pix=$('fp-type')?.value==='PIX',card=$('fp-pix-card');if(!card)return;card.hidden=!pix;if(!pix)return;const v=num($('fp-pix-rate').value||'0'),valid=Number.isFinite(v)&&v>=0&&v<100;const net=valid?Math.round((100-100*v/100)*100)/100:0;$('fp-pix-preview').textContent=valid?'Exemplo: PIX de R$ 100,00 | Taxa: '+money(100-net)+' | Valor líquido na conta: '+money(net):'Informe uma taxa de 0% a menos de 100%.'}
function snapshotRateDraft(){const grid=$('fp-rate-grid');if(!grid)return;for(const el of grid.querySelectorAll('input[data-parcela]'))rateDraft[Number(el.dataset.parcela)]=el.value;}
function renderRateGrid(){const grid=$('fp-rate-grid');if(!grid)return;const card=cardType();$('fp-rate-card').hidden=!card;renderPix();if(!card)return;const max=Math.max(1,Math.min(120,Number($('fp-max').value)||1));const columns=window.innerWidth<=650?1:window.innerWidth<=1000?2:4;const rows=Math.ceil(max/columns);grid.style.gridTemplateRows=`repeat(${rows},auto)`;grid.style.gridAutoFlow='column';grid.innerHTML=Array.from({length:max},(_,i)=>`<label class="fp-rate-cell"><span>${i+1}x</span><input type="text" inputmode="decimal" data-parcela="${i+1}" value="${esc(rateDraft[i+1]??'')}" placeholder="0,00" aria-label="Taxa para ${i+1} parcelas"></label>`).join('');}
function readRateGrid(){if(!cardType())return [];const arr=[];for(const el of $('fp-rate-grid').querySelectorAll('input[data-parcela]')){const v=el.value.trim();if(!v)continue;const taxa=num(v);if(!Number.isFinite(taxa)||taxa<0||taxa>=100)throw Error('Informe taxas válidas de 0% a menos de 100%.');arr.push({operadora:'TAXA DO CARTÃO',parcelas:Number(el.dataset.parcela),taxa})}return arr;}
function fill(x){if(x&&x.id!=null){const stored=db.formas.find(r=>String(r.id)===String(x.id));if(stored)x=stored;}current=x.id;editing=true;$('fp-code').value=String(x.id);$('fp-name').value=x.descricao;$('fp-type').value=x.tipo;refreshAccountOptions(x);$('fp-active').value=x.ativo?'SIM':'NÃO';$('fp-installments').checked=!!x.parcelamento;$('fp-max').value=x.maxParcelas||1;$('fp-sales').checked=x.id===5?false:!!x.vendas;$('fp-sales').disabled=x.id===5;$('fp-purchases').checked=!!x.compras;$('fp-notes').value=x.observacoes||'';$('fp-pix-rate').value=String(x.taxaPix??0).replace('.',',');rateDraft=Object.fromEntries((x.taxas||[]).map(r=>[Number(r.parcelas),String(r.taxa).replace('.',',')]));refreshParcels();rates();$('fp-message').hidden=true;if($('fp-user'))$('fp-user').value=x.usuario||'';renderRateGrid();}
function newForm(){current=null;editing=false;rateDraft={};fill({id:next(),descricao:'',tipo:'DINHEIRO',conta:'CAIXA DA LOJA',ativo:true,parcelamento:false,maxParcelas:1,vendas:true,compras:true,observacoes:'',taxas:[]});current=null;editing=false;$('fp-sales').disabled=false;$('fp-name').focus();}
function readForm(){const descricao=$('fp-name').value.trim().toUpperCase(),maxParcelas=Number($('fp-max').value);if(/CARN[EÊ]/.test(descricao))throw Error('CARNÊ NÃO ESTÁ DISPONÍVEL.');if(/BOLETO/.test(descricao)&&current!==5)throw Error('BOLETO BANCÁRIO JÁ ESTÁ CADASTRADO NO CÓDIGO 5.');if(!descricao)throw Error('Informe a descrição.');if(db.formas.some(x=>x.id!==current&&x.descricao.toUpperCase()===descricao))throw Error('Já existe uma forma de pagamento com essa descrição.');if(!Number.isInteger(maxParcelas)||maxParcelas<1||maxParcelas>120)throw Error('Informe a quantidade de parcelas entre 1 e 120.');const isBoleto=$('fp-type').value==='BOLETO';const contaId=isBoleto?null:Number($('fp-account').value);const selected=financialAccounts().find(a=>Number(a.id)===contaId);if(!isBoleto&&(!selected||selected.ativo===false))throw Error('Selecione uma conta ativa cadastrada no Financeiro.');return {descricao,tipo:$('fp-type').value,conta:isBoleto?'':selected.nome,contaId,ativo:$('fp-active').value==='SIM',parcelamento:$('fp-installments').checked,maxParcelas: cardType()?maxParcelas:($('fp-installments').checked?maxParcelas:1),vendas:current===5?false:$('fp-sales').checked,compras:$('fp-purchases').checked,observacoes:$('fp-notes').value.trim(),taxas:readRateGrid(),taxaPix:(()=>{if($('fp-type').value!=='PIX')return 0;const taxa=num($('fp-pix-rate').value||'0');if(!Number.isFinite(taxa)||taxa<0||taxa>=100)throw Error('A taxa do PIX deve estar entre 0% e menos de 100%.');return taxa})()};}
function paymentActor(){
 try{const x=JSON.parse(sessionStorage.getItem('erp_systems_demo_session')||'null');if(x?.nome)return String(x.nome).trim()}catch{}
 return String(window.LUCAS_LIMA_USUARIO_ATUAL||window.usuarioLogado?.nome||'USUÁRIO NÃO IDENTIFICADO').trim();
}
function paymentComparable(x){
 const fields=['descricao','tipo','conta','contaId','ativo','parcelamento','maxParcelas','vendas','compras','observacoes','taxas','taxaPix'];
 return JSON.stringify(fields.map(k=>x?.[k]??null));
}
function paymentHistory(){
 // Limpar modais de histórico antigos e impedir sobreposição.
 document.querySelectorAll('.fp-history-overlay,#ll-audit-modal').forEach(node=>node.remove());
 const rec=db.formas.find(x=>String(x.id)===String(current));
 if(!rec){msg('Selecione uma forma de pagamento cadastrada para consultar o histórico.');return}
 const events=Array.isArray(rec.historicoOperacoes)?rec.historicoOperacoes:[];
 const overlay=document.createElement('div');overlay.className='fp-overlay fp-history-overlay';
 const entries=events.length?events.slice().reverse().map(e=>{
  const date=e.data?new Date(e.data):null;
  const when=date&&!isNaN(date.getTime())?date.toLocaleString('pt-BR'):String(e.data||'');
  const diffs=(e.alteracoes||[]).map(d=>'<p style="font-size:12px;margin:5px 0"><b>'+esc(d.campo)+'</b>: '+esc(typeof d.anterior==='object'?JSON.stringify(d.anterior):d.anterior)+' → '+esc(typeof d.novo==='object'?JSON.stringify(d.novo):d.novo)+'</p>').join('');
  return '<div style="padding:10px 0;border-bottom:1px solid #dce6f2"><b>'+esc(e.acao||'ALTERAÇÃO')+' — '+esc(e.usuario||'')+'</b><div style="font-size:12px;color:#5b708a">'+esc(when)+'</div>'+diffs+'</div>';
 }).join(''):'<p>Não existe histórico anterior registrado para esta forma de pagamento.</p>';
 // Mesmo padrão do histórico de Cadastro da Loja: largura 440px, cabeçalho simples,
 // somente a lista rola e botão FECHAR no rodapé do conteúdo.
 overlay.innerHTML=`<div class="fp-history-dialog" role="dialog" aria-modal="true" aria-label="Histórico de alterações — Formas de pagamento">
   <div class="fp-history-head">HISTÓRICO DE ALTERAÇÕES — FORMAS DE PAGAMENTO</div>
   <div class="fp-history-content">
     <div class="fp-history-scroll">
       <p><b>FORMA DE PAGAMENTO:</b> ${esc(rec.descricao)}</p>
       <p><b>ÚLTIMO USUÁRIO:</b> ${esc(rec.usuario||'NÃO INFORMADO')}</p>
       ${entries}
     </div>
     <div class="fp-history-footer"><button type="button" data-fp-history-close>FECHAR</button></div>
   </div>
 </div>`;
 document.body.append(overlay);
 const close=()=>{document.removeEventListener('keydown',key,true);overlay.remove()};
 const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}};
 document.addEventListener('keydown',key,true);
 overlay.querySelectorAll('[data-fp-history-close]').forEach(button=>button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();close()}));
 overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
}
function saveForm(){
 try{
  const data=readForm();
  if(current===null){
   const x={id:next(),...data,usuario:paymentActor()};
   db.formas.push(x);
   if(persist()){fill(db.formas.find(r=>r.id===x.id)||x);list();msg('Forma de pagamento cadastrada com sucesso.')}
  }else{
   if(!editing){msg('Selecione um cadastro para alterar.');return}
   const i=db.formas.findIndex(x=>x.id===current);
   if(i<0){msg('Cadastro não encontrado.');return}
   const old=db.formas[i];
   if(paymentComparable(old)===paymentComparable(data)){
    fill(old);msg('Nenhuma alteração realizada. O usuário responsável foi mantido.');return;
   }
   db.formas[i]={...old,...data,usuario:old.usuario};
   if(persist()){fill(db.formas.find(r=>r.id===current)||db.formas[i]);list();msg('Cadastro atualizado com sucesso.')}
  }
 }catch(e){msg(e.message)}
}
function refreshParcels(){const sel=$('fp-parcel');sel.innerHTML='';const limit=$('fp-installments').checked?Math.max(1,Math.min(120,Number($('fp-max').value)||1)):1;for(let i=1;i<=limit;i++){const o=document.createElement('option');o.value=i;o.textContent=i===1?'1x / À VISTA':`${i}x`;sel.append(o)}if(!$('fp-installments').checked&&!cardType())$('fp-max').value=1;}
function rates(){const t=$('fp-rates');if(!t)return;t.innerHTML='';const arr=form()?.taxas||[];if(!arr.length){t.innerHTML='<tr><td colspan="5">Nenhuma taxa cadastrada.</td></tr>';return}for(const r of [...arr].sort((a,b)=>a.operadora.localeCompare(b.operadora)||a.parcelas-b.parcelas)){const tr=document.createElement('tr');tr.innerHTML=`<td>${esc(r.operadora)}</td><td>${r.parcelas}x</td><td>${r.taxa.toLocaleString('pt-BR',{minimumFractionDigits:2})}%</td><td>${money(1000*(1-r.taxa/100))}</td><td><button type="button">EXCLUIR</button></td>`;tr.querySelector('button').onclick=()=>{const x=form();if(!x)return;x.taxas=x.taxas.filter(y=>!(y.operadora===r.operadora&&y.parcelas===r.parcelas));if(persist()){rates();msg('Taxa excluída.')}};tr.ondblclick=()=>{$('fp-operator').value=r.operadora;$('fp-parcel').value=r.parcelas;$('fp-rate').value=String(r.taxa).replace('.',',')};t.append(tr)}}
function addRate(){const x=form();if(!x){msg('Grave a forma de pagamento antes de cadastrar taxas.');return}const operadora=$('fp-operator').value.trim().toUpperCase(),parcelas=Number($('fp-parcel').value),taxa=num($('fp-rate').value);if(!['CRÉDITO','DÉBITO'].includes(x.tipo)){msg('Taxas de parcelamento são exclusivas de cartões.');return}if(!operadora){msg('Informe a operadora.');return}if(!Number.isFinite(taxa)||taxa<0||taxa>=100){msg('A taxa deve estar entre 0% e menos de 100%.');return}if(parcelas>x.maxParcelas){msg('Quantidade de parcelas acima do limite cadastrado.');return}x.taxas=x.taxas.filter(r=>!(r.operadora===operadora&&r.parcelas===parcelas));x.taxas.push({operadora,parcelas,taxa});if(persist()){rates();msg('Taxa por parcelamento gravada.')}}
function list(){if(!paymentsSearched){$('fp-list').innerHTML='<tr><td colspan="6">CLIQUE EM PESQUISAR PARA EXIBIR AS FORMAS DE PAGAMENTO.</td></tr>';return;}const q=query.toUpperCase();$('fp-list').innerHTML='';const items=db.formas.filter(x=>(status==='TODOS'||(x.ativo?'ATIVO':'INATIVO')===status)&&[x.id,x.descricao,x.tipo,x.conta].some(v=>String(v).toUpperCase().includes(q)));for(const x of items){const tr=document.createElement('tr');tr.innerHTML=`<td>${String(x.id)}</td><td>${esc(x.descricao)}</td><td>${esc(x.tipo)}</td><td>${esc(accountLabel(x))}</td><td>${x.parcelamento?x.maxParcelas+'x':'NÃO'}</td><td>${x.ativo?'ATIVO':'INATIVO'}</td>`;tr.ondblclick=()=>fill(x);tr.onclick=()=>{$('fp-list').querySelectorAll('tr').forEach(r=>r.classList.remove('fp-selected'));tr.classList.add('fp-selected')};$('fp-list').append(tr)}if(!items.length)$('fp-list').innerHTML='<tr><td colspan="6">Nenhuma forma de pagamento encontrada.</td></tr>';}
function searchDialog(){if(document.querySelector('.fp-overlay'))return;const overlay=document.createElement('div');overlay.className='fp-overlay';overlay.innerHTML=`<div class="fp-dialog fp-search-dialog" role="dialog" aria-modal="true"><h2>PESQUISAR FORMAS DE PAGAMENTO</h2><label>PESQUISAR POR CÓDIGO, DESCRIÇÃO OU TIPO<input id="fp-search-term" placeholder="Digite para filtrar..."></label><div class="fp-tablewrap"><table class="fp-table"><thead><tr><th>CÓDIGO</th><th>DESCRIÇÃO</th><th>TIPO</th><th>SITUAÇÃO</th></tr></thead><tbody id="fp-search-results"></tbody></table></div><p class="fp-note">Dê dois cliques para abrir o cadastro.</p><div>${btn('fp-select','SELECIONAR','blue')}${btn('fp-search-close','CANCELAR','gray')}</div></div>`;document.body.append(overlay);let chosen=null;const close=()=>{document.removeEventListener('keydown',key,true);overlay.remove()},choose=()=>{const x=db.formas.find(y=>y.id===chosen);if(x){close();fill(x)}},draw=()=>{const q=$('fp-search-term').value.trim().toUpperCase(),rows=$('fp-search-results');rows.innerHTML='';for(const x of db.formas.filter(y=>[y.id,y.descricao,y.tipo].some(v=>String(v).toUpperCase().includes(q)))){const tr=document.createElement('tr');tr.innerHTML=`<td>${x.id}</td><td>${esc(x.descricao)}</td><td>${esc(x.tipo)}</td><td>${x.ativo?'ATIVO':'INATIVO'}</td>`;tr.onclick=()=>{chosen=x.id;rows.querySelectorAll('tr').forEach(r=>r.style.background='');tr.style.background='#dceeff'};tr.ondblclick=()=>{chosen=x.id;choose()};rows.append(tr)}if(!rows.children.length)rows.innerHTML='<tr><td colspan="4">Nenhum cadastro encontrado.</td></tr>'},key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}else if(e.key==='Enter'&&chosen!==null){e.preventDefault();e.stopImmediatePropagation();choose()}};document.addEventListener('keydown',key,true);$('fp-search-term').oninput=()=>{chosen=null;draw()};$('fp-select').onclick=choose;$('fp-search-close').onclick=close;draw();$('fp-search-term').focus()}
function lookup(){
  if(document.querySelector('.fp-overlay'))return;
  const overlay=document.createElement('div');
  overlay.className='fp-overlay fp-lookup-overlay';
  overlay.innerHTML=`<section class="fp-lookup-dialog" role="dialog" aria-modal="true" aria-labelledby="fp-lookup-title">
    <header class="fp-lookup-head"><strong id="fp-lookup-title">▣ LOCALIZAR FORMA DE PAGAMENTO — F12</strong><button type="button" class="fp-lookup-x" aria-label="Fechar">×</button></header>
    <div class="fp-lookup-body"><p>Informe o código da forma de pagamento.</p><label for="fp-lcode">CÓDIGO</label><input id="fp-lcode" inputmode="numeric" autocomplete="off" placeholder="DIGITE O CÓDIGO..."><p id="fp-lerr" role="alert" aria-live="polite"></p>
      <footer class="fp-lookup-actions"><button type="button" id="fp-go">LOCALIZAR</button><button type="button" id="fp-cancel">CANCELAR</button></footer></div>
  </section>`;
  document.body.append(overlay);
  const close=()=>{document.removeEventListener('keydown',key,true);overlay.remove()},
  go=()=>{const raw=$('fp-lcode').value.trim();const x=raw?db.formas.find(y=>Number(y.id)===Number(raw)):null;if(x){close();fill(x)}else $('fp-lerr').textContent=raw?'FORMA DE PAGAMENTO NÃO ENCONTRADA.':'INFORME O CÓDIGO.'},
  key=e=>{if(['Escape','Enter','F12'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();if(e.key==='Escape')close();else if(e.key==='Enter')go()}};
  document.addEventListener('keydown',key,true);
  overlay.querySelector('.fp-lookup-x').onclick=close;
  $('fp-go').onclick=go;$('fp-cancel').onclick=close;
  overlay.onclick=e=>{if(e.target===overlay)close()};
  $('fp-lcode').focus();
}
function bind(){$('fp-user').addEventListener('click',paymentHistory);$('fp-user').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();paymentHistory()}});$('fp-new').onclick=newForm;$('fp-save').onclick=saveForm;$('fp-edit').onclick=saveForm;$('fp-back').onclick=()=>category('CADASTROS');$('fp-add-rate').onclick=()=>{};$('fp-search-filter').onclick=()=>{query=$('fp-filter').value.trim();status=$('fp-status').value;paymentsSearched=true;list()};$('fp-installments').onchange=()=>{snapshotRateDraft();if($('fp-installments').checked&&Number($('fp-max').value)<2)$('fp-max').value=12;refreshParcels();renderRateGrid()};$('fp-max').oninput=()=>{snapshotRateDraft();renderRateGrid()};$('fp-pix-rate').oninput=renderPix;$('fp-type').onchange=()=>{snapshotRateDraft();const t=$('fp-type').value;$('fp-installments').checked=['CRÉDITO','DÉBITO','BOLETO'].includes(t);$('fp-max').value=$('fp-installments').checked?Math.max(12,Number($('fp-max').value)||1):1;refreshAccountOptions({tipo:t,conta:t==='DINHEIRO'?'CAIXA DA LOJA':''});refreshParcels();renderRateGrid()};}
const prev=open;open=function(name){if(name==='FORMAS DE PAGAMENTO')return screenPayments();return prev(name)};
document.addEventListener('keydown',e=>{if(screen!=='FORMAS DE PAGAMENTO'||document.querySelector('.fp-overlay')||document.querySelector('.erp-modal-overlay'))return;const id={F1:'fp-shortcuts',F2:'fp-new',F3:'fp-save',F4:'fp-edit',F5:'fp-search-filter',F12:'fp-shortcuts'}[e.key];if(!id)return;e.preventDefault();e.stopImmediatePropagation();if(!e.repeat){if(e.key==='F12')lookup();else $(id)?.click()}},true);
})();
