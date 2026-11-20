/* LUCAS LIMA — Entradas de Estoque: baixa/reabertura com reversão de estoque */
(()=>{'use strict';
const STORE='erp_matriz_operacoes_v2';let current=null,items=[],parcels=[],filter='';let pesquisaEntradasSalva=null;let entradasPesquisaExecutada=false;
function guardarPesquisaEntradas(){if(!document.getElementById('en-from'))return;pesquisaEntradasSalva={inicio:$('en-from').value,fim:$('en-to').value,fornecedor:$('en-filter-supplier').value,nome:$('en-filter-supplier-name').value,destino:$('en-filter-destination').value,situacao:$('en-filter-status').value};}
function restaurarPesquisaEntradas(){if(!pesquisaEntradasSalva)return;const p=pesquisaEntradasSalva;$('en-from').value=p.inicio;$('en-to').value=p.fim;$('en-filter-supplier').value=p.fornecedor;$('en-filter-supplier-name').value=p.nome;$('en-filter-destination').value=p.destino;$('en-filter-status').value=p.situacao;}
const load=()=>{let d;try{d=JSON.parse(localStorage.getItem(STORE)||'{}')}catch{d={}};for(const k of ['entradas','pagar','vendas'])if(!Array.isArray(d[k]))d[k]=[];return d};
const put=d=>localStorage.setItem(STORE,JSON.stringify(d));
const $=id=>document.getElementById(id);const money=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const n=v=>{let s=String(v??'').trim();if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');return Number(s)};
const today=()=>new Date().toLocaleDateString('en-CA');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const note=msg=>typeof aviso==='function'?aviso('ENTRADAS DE ESTOQUE',msg):erpAlert(msg);
const dbSup=()=>load().fornecedores||[];
// Formas de pagamento cadastradas e suas contas financeiras.
const PAYMENT_KEY='erp_matriz_formas_pagamento_v1', FINANCE_KEY='erp_systems_financeiro_v1';
function registeredMethods(){try{return (JSON.parse(localStorage.getItem(PAYMENT_KEY)||'{}').formas||[]).filter(x=>x.ativo!==false&&x.compras!==false)}catch{return []}}
function methodOptions(){const methods=registeredMethods();return '<option value="">SELECIONE</option>'+methods.map(x=>`<option value="${esc(x.descricao)}">${esc(x.descricao)}</option>`).join('')}
function methodRecord(x){return registeredMethods().find(m=>String(m.descricao)===String(x.forma)||String(m.id)===String(x.formaId))}
function isDeferred(x){const m=methodRecord(x);return m?.tipo==='BOLETO'||(x.vencimento&&x.vencimento>today())}
function financeAccount(m,d){let a=d.contas.find(x=>Number(x.id)===Number(m.contaId)&&Number(m.contaId)>0);if(a)return a;const name=String(m.conta||'').trim().toUpperCase();a=d.contas.find(x=>String(x.nome||'').trim().toUpperCase()===name);if(!a&&name==='CAIXA DA LOJA')a=d.contas.find(x=>x.contaPadrao==='CAIXA'||String(x.nome).toUpperCase()==='CAIXA');if(!a&&name==='CONTA BANCÁRIA')a=d.contas.find(x=>x.tipo==='BANCO'&&x.ativo!==false);return a}
function financeData(){let d={};try{d=JSON.parse(localStorage.getItem(FINANCE_KEY)||'{}')}catch{};d.contas=Array.isArray(d.contas)?d.contas:[];d.movimentos=Array.isArray(d.movimentos)?d.movimentos:[];return d}
function validateImmediatePayments(e){const d=financeData();for(const x of e.parcelas||[]){if(isDeferred(x))continue;const m=methodRecord(x);if(!m)return 'A forma de pagamento '+x.forma+' não está cadastrada ou está inativa.';if(!financeAccount(m,d))return 'A forma '+x.forma+' não possui conta financeira válida vinculada. Configure-a em Formas de Pagamento.'}return ''}
function syncImmediatePayments(e){const d=financeData(),prefix='ENTRADA-ESTOQUE-'+e.id+'-';d.movimentos=d.movimentos.filter(x=>!String(x.ref||'').startsWith(prefix));if(e.situacao==='BAIXADA')(e.parcelas||[]).forEach((x,i)=>{if(isDeferred(x))return;const m=methodRecord(x),account=m&&financeAccount(m,d);if(!account)return;d.movimentos.push({id:Math.max(0,...d.movimentos.map(z=>Number(z.id)||0))+1,date:e.data||today(),conta:account.id,tipo:'SAIDA',valor:Number(x.valor)||0,descricao:'PAGAMENTO DA ENTRADA Nº '+e.id+' — '+x.forma,ref:prefix+(i+1),categoria:'ENTRADA_ESTOQUE',usuario:auditUser(),created:new Date().toISOString()})});localStorage.setItem(FINANCE_KEY,JSON.stringify(d))}

const auditUser=()=>{try{return String(window.LucasLimaAuditoria?.usuarioAtual?.()||window.LUCAS_LIMA_USUARIO_ATUAL||window.usuarioLogado?.nome||JSON.parse(sessionStorage.getItem('erp_systems_demo_session')||'null')?.nome||document.querySelector('.top-user strong')?.textContent||'USUÁRIO NÃO IDENTIFICADO').trim()}catch{return 'USUÁRIO NÃO IDENTIFICADO'}};
const auditTime=()=>new Date().toISOString();
function audit(e,acao,changes=[]){e.historico=Array.isArray(e.historico)?e.historico:[];e.historico.push({data:auditTime(),acao,usuario:auditUser(),alteracoes:changes});e.usuario=auditUser();}
function diff(old,e){if(!old)return [];const names={data:'DATA',pessoa:'FORNECEDOR',destino:'DESTINO',itens:'PRODUTOS / QUANTIDADES / CUSTOS',parcelas:'PARCELAS',gerarPagar:'GERAR CONTAS A PAGAR',total:'VALOR TOTAL'};return Object.entries(names).filter(([k])=>JSON.stringify(old[k])!==JSON.stringify(e[k])).map(([k,label])=>({campo:label,anterior:JSON.stringify(old[k]??''),novo:JSON.stringify(e[k]??'')}));}
function dialog(title,content){document.getElementById('en-overlay')?.remove();const overlay=document.createElement('div');overlay.id='en-overlay';overlay.innerHTML=`<div class="en-dialog" role="dialog" aria-modal="true"><header>${esc(title)}<button type="button" data-close aria-label="Fechar">✕</button></header><div class="en-dialog-body">${content}</div></div>`;document.body.appendChild(overlay);overlay.querySelector('[data-close]').onclick=()=>overlay.remove();overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});overlay.addEventListener('keydown',e=>{if(e.key==='Escape')overlay.remove()});overlay.tabIndex=-1;overlay.focus();return overlay;}
function historyDialog(){
 const entry=load().entradas.find(x=>String(x.id)===String(current));
 const rows=entry?(entry.historico||[]).slice().reverse().map(h=>`<article class="en-audit-row"><b>${esc(h.acao||'OPERAÇÃO')}</b> — ${esc(h.usuario||'USUÁRIO NÃO REGISTRADO')}<small>${esc(h.data?new Date(h.data).toLocaleString('pt-BR'):'DATA NÃO REGISTRADA')}</small>${(h.alteracoes||[]).map(c=>`<p><b>${esc(c.campo)}:</b> ${esc(c.anterior)} → ${esc(c.novo)}</p>`).join('')}</article>`).join(''):'';
 const content=entry?`<p class="en-history-last"><b>ÚLTIMO USUÁRIO:</b> ${esc(entry.usuario||'NÃO REGISTRADO')}</p>${rows||'<p>Esta entrada é anterior ao registro detalhado de auditoria. Não é possível recuperar operações antigas.</p>'}`:'<p>Esta entrada ainda não foi gravada. O histórico começará após a gravação.</p>';
 const overlay=dialog('HISTÓRICO DE ALTERAÇÕES — ENTRADAS DE ESTOQUE',`${content}<footer class="en-history-footer"><button type="button" class="en-history-close">FECHAR</button></footer>`);
 overlay.querySelector('.en-dialog').classList.add('en-history-dialog');
 overlay.querySelector('.en-history-close').onclick=()=>overlay.remove();
}

function supplierDialog(){
 const sup=dbSup();
 const overlay=dialog('SELECIONE O FORNECEDOR',`<div class="en-sup-picker">
 <div class="en-sup-searchbar"><label>PESQUISAR POR<select id="en-sup-mode"><option value="nome">NOME</option><option value="codigo">CÓDIGO</option><option value="documento">CPF/CNPJ</option></select></label><label>TEXTO DA PESQUISA<input id="en-sup-search" placeholder="DIGITE PARA PESQUISAR..."></label><button type="button" id="en-sup-find" class="en-sup-blue">PESQUISAR</button><button type="button" id="en-sup-create" class="en-addbtn">+ NOVO FORNECEDOR</button></div>
 <div class="en-sup-list"><table><thead><tr><th>CÓDIGO</th><th>NOME DO FORNECEDOR</th><th>SITUAÇÃO</th></tr></thead><tbody id="en-sup-results"></tbody></table></div>
 <div class="en-sup-footer"><span>DÊ DOIS CLIQUES PARA SELECIONAR.</span><button type="button" id="en-sup-cancel">CANCELAR</button></div></div>`);
 overlay.querySelector('.en-dialog').classList.add('en-sup-picker-dialog');
 const input=overlay.querySelector('#en-sup-search');const mode=overlay.querySelector('#en-sup-mode');
 const draw=()=>{
  const q=input.value.trim().toLocaleLowerCase('pt-BR');const key=mode.value;
  const matches=sup.filter(x=>{const values=key==='codigo'?[x.id,x.codigo]:key==='documento'?[x.documento,x.cpfCnpj,x.cnpj,x.cpf]:[x.nome,x.razaoSocial,x.nomeFantasia];return values.some(v=>String(v||'').toLocaleLowerCase('pt-BR').includes(q));});
  overlay.querySelector('#en-sup-results').innerHTML=matches.map(x=>{const status=String(x.situacao||x.status||'ATIVO').toUpperCase();return `<tr data-sup="${esc(x.id)}" tabindex="0" title="Dê dois cliques para selecionar"><td>${esc(x.id)}</td><td>${esc(x.nome||x.razaoSocial||'')}</td><td><span class="en-sup-status ${status==='ATIVO'?'':'inactive'}">${esc(status)}</span></td></tr>`;}).join('')||'<tr><td colspan="3" class="en-sup-empty">NENHUM FORNECEDOR ENCONTRADO.</td></tr>';
  const choose=row=>{const id=row.dataset.sup;const found=sup.find(x=>String(x.id)===String(id));if(!found)return;$('en-supplier').value=id;$('en-supplier-name').value=found.nome||found.razaoSocial||'';overlay.remove();};
  overlay.querySelectorAll('tr[data-sup]').forEach(row=>{row.addEventListener('dblclick',()=>choose(row));row.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();choose(row);}});});
 };
 overlay.querySelector('#en-sup-find').onclick=draw;
 input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();draw();}});
 mode.onchange=draw;
 overlay.querySelector('#en-sup-cancel').onclick=()=>overlay.remove();
 draw();input.focus();
 overlay.querySelector('#en-sup-create').onclick=()=>{sessionStorage.setItem('en_entrada_rascunho',JSON.stringify({current,items,parcels,data:$('en-date').value,pessoa:$('en-supplier').value,destino:destination(),gerarPagar:$('en-generate').checked}));overlay.remove();open('FORNECEDORES');const workspace=typeof root==='function'?root():document.querySelector('main');if(workspace){const back=document.createElement('button');back.type='button';back.className='en-return-supplier';back.textContent='← VOLTAR À ENTRADA DE ESTOQUE';back.onclick=()=>open('ENTRADAS DE ESTOQUE');workspace.prepend(back);}};
}

function filterSupplierDialog(){
 const sup=dbSup();
 const overlay=dialog('SELECIONE O FORNECEDOR',`<div class="en-sup-picker">
 <div class="en-sup-searchbar"><label>PESQUISAR POR<select id="en-filter-sup-mode"><option value="nome">NOME</option><option value="codigo">CÓDIGO</option><option value="documento">CPF/CNPJ</option></select></label><label>TEXTO DA PESQUISA<input id="en-filter-sup-search" placeholder="DIGITE PARA PESQUISAR..."></label><button type="button" id="en-filter-sup-find" class="en-sup-blue">PESQUISAR</button><button type="button" id="en-filter-sup-create" class="en-addbtn">+ NOVO FORNECEDOR</button></div>
 <div class="en-sup-list"><table><thead><tr><th>CÓDIGO</th><th>NOME DO FORNECEDOR</th><th>SITUAÇÃO</th></tr></thead><tbody id="en-filter-sup-results"></tbody></table></div>
 <div class="en-sup-footer"><span>DÊ DOIS CLIQUES PARA SELECIONAR.</span><button type="button" id="en-filter-sup-cancel">CANCELAR</button></div></div>`);
 overlay.querySelector('.en-dialog').classList.add('en-sup-picker-dialog');
 const input=overlay.querySelector('#en-filter-sup-search'),mode=overlay.querySelector('#en-filter-sup-mode');
 const select=(id)=>{const found=sup.find(x=>String(x.id)===String(id));$('en-filter-supplier').value=id;$('en-filter-supplier-name').value=found?(found.nome||found.razaoSocial||'TODOS'):'TODOS';overlay.remove();};
 const draw=()=>{
  const q=input.value.trim().toLocaleLowerCase('pt-BR'),key=mode.value;
  const matches=sup.filter(x=>{const values=key==='codigo'?[x.id,x.codigo]:key==='documento'?[x.documento,x.cpfCnpj,x.cnpj,x.cpf]:[x.nome,x.razaoSocial,x.nomeFantasia];return values.some(v=>String(v||'').toLocaleLowerCase('pt-BR').includes(q));});
  overlay.querySelector('#en-filter-sup-results').innerHTML=`<tr data-filter-sup="" tabindex="0" title="Dê dois cliques para selecionar"><td colspan="3"><strong>TODOS OS FORNECEDORES</strong></td></tr>`+matches.map(x=>{const status=String(x.situacao||x.status||'ATIVO').toUpperCase();return `<tr data-filter-sup="${esc(x.id)}" tabindex="0" title="Dê dois cliques para selecionar"><td>${esc(x.id)}</td><td>${esc(x.nome||x.razaoSocial||'')}</td><td><span class="en-sup-status ${status==='ATIVO'?'':'inactive'}">${esc(status)}</span></td></tr>`;}).join('');
  overlay.querySelectorAll('tr[data-filter-sup]').forEach(row=>{row.ondblclick=()=>select(row.dataset.filterSup);row.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();select(row.dataset.filterSup);}};});
 };
 overlay.querySelector('#en-filter-sup-find').onclick=draw;
 input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();draw();}};
 mode.onchange=draw;
 overlay.querySelector('#en-filter-sup-cancel').onclick=()=>overlay.remove();
 overlay.querySelector('#en-filter-sup-create').onclick=()=>{overlay.remove();open('FORNECEDORES');const workspace=typeof root==='function'?root():document.querySelector('main');if(workspace){const back=document.createElement('button');back.type='button';back.className='en-return-supplier';back.textContent='← VOLTAR À ENTRADA DE ESTOQUE';back.onclick=()=>open('ENTRADAS DE ESTOQUE');workspace.prepend(back);}};
 draw();input.focus();
}
function productDialog(){
 const overlay=dialog('SELECIONE O PRODUTO',`<div class="en-sup-picker">
 <div class="en-sup-searchbar"><label>PESQUISAR POR<select id="en-prod-mode"><option value="descricao">DESCRIÇÃO</option><option value="codigo">CÓDIGO</option><option value="marca">MARCA</option><option value="barras">CÓDIGO DE BARRAS</option></select></label><label>TEXTO DA PESQUISA<input id="en-prod-search" placeholder="DIGITE PARA PESQUISAR..."></label><button type="button" id="en-prod-find" class="en-sup-blue">PESQUISAR</button><button type="button" id="en-prod-create" class="en-addbtn">+ NOVO PRODUTO</button></div>
 <div class="en-sup-list"><table><thead><tr><th>CÓDIGO</th><th>DESCRIÇÃO DO PRODUTO</th><th>SITUAÇÃO</th></tr></thead><tbody id="en-prod-results"></tbody></table></div>
 <div class="en-sup-footer"><span>DÊ DOIS CLIQUES PARA SELECIONAR.</span><button type="button" id="en-prod-cancel">CANCELAR</button></div></div>`);
 overlay.querySelector('.en-dialog').classList.add('en-sup-picker-dialog');
 const input=overlay.querySelector('#en-prod-search'),mode=overlay.querySelector('#en-prod-mode');
 const draw=()=>{
  const q=input.value.trim().toLocaleLowerCase('pt-BR'),key=mode.value;
  const matches=products.filter(x=>{const vals=key==='codigo'?[x.codigo]:key==='marca'?[x.marca,x.marcaNome]:key==='barras'?[x.codigoBarras,x.codigo_barras]:[x.descricao];return vals.some(v=>String(v||'').toLocaleLowerCase('pt-BR').includes(q));}).slice(0,100);
  overlay.querySelector('#en-prod-results').innerHTML=matches.map(x=>{const status=String(x.situacao||x.status||'ATIVO').toUpperCase();return `<tr data-prod="${esc(x.codigo)}" tabindex="0" title="Dê dois cliques para selecionar"><td>${esc(x.codigo)}</td><td>${esc(x.descricao)}</td><td><span class="en-sup-status ${status==='ATIVO'?'':'inactive'}">${esc(status)}</span></td></tr>`}).join('')||'<tr><td colspan="3" class="en-sup-empty">NENHUM PRODUTO ENCONTRADO.</td></tr>';
  const choose=row=>{$('en-product').value=row.dataset.prod;stock();overlay.remove();$('en-qty').focus()};
  overlay.querySelectorAll('tr[data-prod]').forEach(row=>{row.addEventListener('dblclick',()=>choose(row));row.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();choose(row)}})});
 };
 overlay.querySelector('#en-prod-find').onclick=draw;
 input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();draw()}});
 mode.onchange=draw;
 overlay.querySelector('#en-prod-cancel').onclick=()=>overlay.remove();
 draw();input.focus();
 overlay.querySelector('#en-prod-create').onclick=()=>{sessionStorage.setItem('en_entrada_rascunho',JSON.stringify({current,items,parcels,data:$('en-date').value,pessoa:$('en-supplier').value,destino:destination(),gerarPagar:$('en-generate').checked,produto:$('en-product').value,quantidade:$('en-qty').value,custo:$('en-cost').value}));overlay.remove();open('PRODUTOS');const workspace=typeof root==='function'?root():document.querySelector('main');if(workspace){const back=document.createElement('button');back.type='button';back.className='en-return-supplier';back.textContent='← VOLTAR À ENTRADA DE ESTOQUE';back.onclick=()=>open('ENTRADAS DE ESTOQUE');workspace.prepend(back)}};
}

const destination=()=> $('en-destination')?.value||'ESTOQUE';
const almoxQty=(codigo)=>load().entradas.reduce((total,e)=>total+(e.situacao==='BAIXADA'&&e.destino==='ALMOXARIFADO'?(e.itens||[]).reduce((q,it)=>q+(String(it.codigo)===String(codigo)?Number(it.quantidade)||0:0),0):0),0);
const sum=()=>items.reduce((a,x)=>a+Number(x.quantidade)*Number(x.preco),0);
const next=()=>Math.max(0,...load().entradas.map(x=>Number(x.id)||0))+1;
const label=(text,field)=>`<label class="en-field"><span>${text}</span>${field}</label>`;
const inp=(id,type='text',attrs='')=>`<input id="${id}" type="${type}" ${attrs}>`;
const b=(action,name,color,key='')=>`<button type="button" class="en-btn ${color}" data-en="${action}">${key?`<small>${key}</small>`:''}${name}</button>`;
function recompute(){const d=load();for(const p of products){if(p.erpSaldoBase===undefined){p.erpSaldoBase=Number(p.provisao)||0;p.erpVendaBase=Number(p.venda)||0;}let q=Number(p.erpSaldoBase)||0,v=Number(p.erpVendaBase)||0;for(const ent of d.entradas)if(ent.situacao==='BAIXADA')for(const it of ent.itens||[])if(String(it.codigo)===String(p.codigo))q+=Number(it.quantidade)||0;for(const ac of JSON.parse(localStorage.getItem('erp_systems_acertos_v1')||'[]'))if(ac.situacao==='BAIXADO')for(const it of ac.itens||[])if(String(it.codigo)===String(p.codigo))q+=Number(it.diferenca)||0;for(const sale of d.vendas)for(const it of sale.itens||[])if(String(it.codigo)===String(p.codigo)){if(sale.situacao==='BAIXADA')q-=Number(it.quantidade)||0;if(sale.situacao==='PENDENTE')v+=Number(it.quantidade)||0;}p.provisao=+q.toFixed(3);p.venda=+v.toFixed(3);}save(KEY,products);}
function costUpdate(entry){for(const it of entry.itens){const p=products.find(x=>String(x.codigo)===String(it.codigo));if(!p)continue;const old=Number(p.custo)||0,newCost=Number(it.preco)||0;if(old!==newCost){p.historico=Array.isArray(p.historico)?p.historico:[];p.historico.push({data:new Date().toISOString(),tipo:'CUSTO DE COMPRA',anterior:old,atual:newCost,origem:'ENTRADA '+entry.id});p.custo=newCost;}}save(KEY,products);}
function syncPay(entry){const d=load(),ref='ENTRADA-'+entry.id;const old=d.pagar.filter(x=>x.ref===ref);const paid=old.reduce((a,x)=>a+Number(x.pago||0),0);if(old.length&&paid>0){ // preserve received payments and existing installment identifiers
 const target=entry.parcelas||[];if(target.length!==old.length){note('Há pagamentos registrados. As parcelas existentes serão preservadas para evitar perda de histórico.');put(d);return;}old.forEach((x,i)=>{x.valor=Number(target[i].valor);x.vencimento=target[i].vencimento;x.forma=target[i].forma;x.saldo=Math.max(0,x.valor-Number(x.pago||0));x.situacao=x.saldo===0?'PAGA':'PENDENTE';});put(d);return;}
 d.pagar=d.pagar.filter(x=>x.ref!==ref);if(entry.situacao==='BAIXADA'&&entry.gerarPagar)for(const x of (entry.parcelas||[]).filter(isDeferred)){d.pagar.push({id:Math.max(0,...d.pagar.map(y=>Number(y.id)||0))+1,ref,descricao:'ENTRADA Nº '+entry.id,pessoa:entry.pessoa,valor:Number(x.valor),pago:0,saldo:Number(x.valor),vencimento:x.vencimento,forma:x.forma,situacao:'PENDENTE',pagamentos:[]});}put(d);
}
function render(){const d=load(),entry=d.entradas.find(x=>x.id===current),locked=entry?.situacao==='BAIXADA'||entry?.situacao==='CANCELADA';const sup=dbSup();const f=typeof root==='function'?root():document.querySelector('main');if(!f)return;f.innerHTML=`<div class="en-page"><div class="en-title"><h1>▣ ENTRADAS DE ESTOQUE</h1><button type="button" class="en-shortcut" data-en="shortcuts">⌂ ATALHOS</button></div><section class="en-card"><h3>DADOS DA ENTRADA</h3><div class="en-grid en-header">${label('Nº DA ENTRADA',inp('en-id','text','readonly'))}${label('DATA',inp('en-date','date'))}${label('FORNECEDOR *',`<div class="en-supplier-control"><input type="hidden" id="en-supplier"><input type="text" id="en-supplier-name" readonly placeholder="SELECIONE O FORNECEDOR" title="Utilize o botão + para selecionar um fornecedor" style="cursor:default"><button type="button" id="en-supplier-plus" class="en-supplier-plus" title="Pesquisar ou cadastrar fornecedor">+</button></div>`)}${label('DESTINO DA ENTRADA *',`<select id="en-destination"><option value="ESTOQUE">ESTOQUE — MERCADORIAS PARA VENDA</option><option value="ALMOXARIFADO">ALMOXARIFADO — USO INTERNO</option><option value="MATERIA_PRIMA">MATÉRIAS-PRIMAS — PRODUÇÃO</option></select>`)}${label('SITUAÇÃO',`<input id="en-status" readonly>`)}${label('USUÁRIO',`<input id="en-user" readonly title="Clique para visualizar o histórico" style="cursor:pointer">`)}</div></section><div class="en-two"><section class="en-card"><h3>ITENS DA ENTRADA</h3><div class="en-grid en-add">${label('CÓDIGO DO PRODUTO',`<input id="en-product" type="text" inputmode="numeric" autocomplete="off" placeholder="CÓDIGO">`)}${label('DESCRIÇÃO DO PRODUTO',`<div class="en-product-control"><input id="en-product-description" readonly placeholder="DIGITE O CÓDIGO OU PESQUISE"><button type="button" id="en-product-plus" class="en-supplier-plus" title="Pesquisar ou cadastrar produto">+</button></div>`)}${label('QUANTIDADE',inp('en-qty','number','min="0.001" step="0.001"'))}${label('CUSTO UNITÁRIO',inp('en-cost','number','min="0" step="0.01"'))}<button class="en-addbtn" data-en="additem">+ ADICIONAR</button></div><div class="en-scroll"><table class="en-table"><thead><tr><th>CÓDIGO</th><th>DESCRIÇÃO</th><th>QUANTIDADE</th><th>CUSTO UNIT.</th><th>CUSTO TOTAL</th><th>AÇÃO</th></tr></thead><tbody id="en-items"></tbody></table></div><div class="en-total">TOTAL DA ENTRADA: <strong id="en-total">R$ 0,00</strong></div></section><section class="en-card en-stock"><h3>ESTOQUE DO PRODUTO SELECIONADO</h3><strong id="en-product-name">SELECIONE UM PRODUTO</strong><div class="en-stats"><div>PROVISÃO<strong id="en-prov">—</strong></div><div>VENDA<strong id="en-sale">—</strong></div><div>DISPONÍVEL<strong id="en-avail">—</strong></div></div><h3>HISTÓRICO DE CUSTO</h3><p id="en-history">Selecione um produto para consultar o custo atual.</p></section></div><div class="en-finance-actions"><section class="en-card"><h3>FINANCEIRO DA ENTRADA (PARCELAS)</h3><div class="en-grid en-fin">${label('VENCIMENTO',inp('en-due','date'))}${label('FORMA DE PAGAMENTO',`<select id="en-method">${methodOptions()}</select>`)}${label('VALOR DA PARCELA',inp('en-value','number','min="0.01" step="0.01"'))}<button class="en-addbtn" data-en="addparcel">+ ADICIONAR PARCELA</button></div><div class="en-scroll"><table class="en-table"><thead><tr><th>#</th><th>VENCIMENTO</th><th>FORMA</th><th>VALOR</th><th>AÇÃO</th></tr></thead><tbody id="en-parcels"></tbody></table></div><label class="en-check"><input type="checkbox" id="en-generate"> GERAR CONTAS A PAGAR AO BAIXAR</label></section><section class="en-card"><div class="en-buttons">${b('new','NOVO','green','F2')}${b('save','GRAVAR','blue','F3')}${b('edit','ALTERAR','orange','F4')}${b('down','BAIXAR','green','F6')}${b('cancel','CANCELAR','red','F7')}${b('print','IMPRIMIR','slate','F9')}${b('home','VOLTAR','red','F1')}</div></section></div><section class="en-card"><h3>PESQUISA DE ENTRADAS</h3><div class="en-grid en-filters">${label('DATA INICIAL',inp('en-from','date'))}${label('DATA FINAL',inp('en-to','date'))}${label('FORNECEDOR',`<div class="en-filter-supplier-control"><input type="hidden" id="en-filter-supplier" value=""><input type="text" id="en-filter-supplier-name" value="TODOS" readonly title="Utilize o botão + para selecionar um fornecedor"><button type="button" id="en-filter-supplier-plus" class="en-supplier-plus" title="Selecionar fornecedor">+</button></div>`)}${label('DESTINO',`<select id="en-filter-destination"><option value="">TODOS</option><option value="ESTOQUE">ESTOQUE</option><option value="ALMOXARIFADO">ALMOXARIFADO</option><option value="MATERIA_PRIMA">MATÉRIAS-PRIMAS</option></select>`)}${label('SITUAÇÃO',`<select id="en-filter-status"><option value="">TODAS</option><option>PENDENTE</option><option>BAIXADA</option><option>CANCELADA</option></select>`)}<button class="en-search-button" data-en="filter">PESQUISAR</button></div><div class="en-scroll"><table class="en-table"><thead><tr><th>Nº</th><th>DATA</th><th>FORNECEDOR</th><th>DESTINO</th><th>TOTAL</th><th>SITUAÇÃO</th></tr></thead><tbody id="en-list"></tbody></table></div></section></div>`;
 $('en-id').value=entry?.id||next();$('en-date').value=entry?.data||today();$('en-supplier').value=entry?.pessoa||'';$('en-supplier-name').value=sup.find(x=>String(x.id)===String(entry?.pessoa||''))?.nome||'';$('en-destination').value=entry?.destino||'ESTOQUE';$('en-status').value=entry?.situacao||'PENDENTE';$('en-due').value=today();$('en-generate').checked=entry?.gerarPagar??false;$('en-user').value=entry?.usuario||auditUser();$('en-user').onclick=historyDialog;$('en-supplier-plus').onclick=supplierDialog;$('en-product-plus').onclick=productDialog;
 if(locked){$('en-supplier-plus').disabled=true;for(const id of ['en-date','en-supplier','en-destination','en-product','en-product-plus','en-qty','en-cost','en-due','en-method','en-value','en-generate'])$(id).disabled=true;}
 $('en-product').oninput=()=>stock();$('en-product').onchange=()=>stock();$('en-destination').onchange=stock; $('en-filter-supplier-plus').onclick=filterSupplierDialog;
 f.querySelectorAll('[data-en]').forEach(x=>x.onclick=()=>action(x.dataset.en,x.dataset.i));restaurarPesquisaEntradas();drawItems();drawParcels();drawList();stock();if(typeof active==='function')active('COMPRAS');}
function stock(consultaCodigo){const consulta=consultaCodigo!==undefined;const p=products.find(x=>String(x.codigo)===(consulta?String(consultaCodigo):$('en-product')?.value.trim()));if(!consulta&&$('en-product-description'))$('en-product-description').value=p?.descricao||'';if(!p){$('en-product-name').textContent='SELECIONE UM PRODUTO';for(const id of ['en-prov','en-sale','en-avail'])$(id).textContent='—';$('en-history').textContent='Selecione um produto para consultar o custo atual.';return;}$('en-product-name').textContent=p.codigo+' - '+p.descricao;// Mesma fonte de saldos utilizada pela Ficha de Estoque.
const saldos=typeof window.LL_estoqueCentralConciliar==='function'
 ?window.LL_estoqueCentralConciliar()
 :JSON.parse(localStorage.getItem('erp_matriz_produtos_teste_v1')||'[]');
const saldoProduto=Array.isArray(saldos)?saldos.find(x=>String(x.codigo)===String(p.codigo)):null;
const provisao=Number(saldoProduto?.provisao??p.provisao)||0;
const venda=Number(saldoProduto?.venda??p.venda)||0;$('en-prov').textContent=String(provisao);$('en-sale').textContent=String(venda);$('en-avail').textContent=String(provisao-venda);$('en-history').textContent='Custo atual: '+money(p.custo||0);if(!consulta)$('en-cost').value=p.custo||0;}
function drawItems(){const t=$('en-items');if(!t)return;t.innerHTML=items.map((x,i)=>`<tr><td><button type="button" class="en-item-select" data-en="viewitem" data-i="${i}" title="Visualizar estoque">${esc(x.codigo)}</button></td><td><button type="button" class="en-item-select" data-en="viewitem" data-i="${i}" title="Visualizar estoque">${esc(products.find(p=>String(p.codigo)===String(x.codigo))?.descricao||x.codigo)}</button></td><td>${x.quantidade}</td><td>${money(x.preco)}</td><td>${money(x.quantidade*x.preco)}</td><td><button class="en-mini" data-en="delitem" data-i="${i}">EXCLUIR</button></td></tr>`).join('')||'<tr><td colspan="6">Nenhum produto adicionado.</td></tr>';$('en-total').textContent=money(sum());t.querySelectorAll('[data-en]').forEach(x=>x.onclick=()=>action(x.dataset.en,x.dataset.i));}
function drawParcels(){const t=$('en-parcels');if(!t)return;t.innerHTML=parcels.map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.vencimento)}</td><td>${esc(x.forma)}</td><td>${money(x.valor)}</td><td><button class="en-mini" data-en="delparcel" data-i="${i}">EXCLUIR</button></td></tr>`).join('')||'<tr><td colspan="5">Nenhuma parcela cadastrada.</td></tr>';t.querySelectorAll('[data-en]').forEach(x=>x.onclick=()=>action(x.dataset.en,x.dataset.i));}
function drawList(){const t=$('en-list');if(!t)return;
 if(!entradasPesquisaExecutada){t.innerHTML='<tr><td colspan="6" style="text-align:center;padding:20px;color:#64748b">INFORME OS FILTROS E CLIQUE EM PESQUISAR PARA EXIBIR AS ENTRADAS.</td></tr>';return;}
 const d=load();t.innerHTML=d.entradas.filter(x=>(!$('en-from').value||x.data>=$('en-from').value)&&(!$('en-to').value||x.data<=$('en-to').value)&&(!$('en-filter-status').value||x.situacao===$('en-filter-status').value)&&(!$('en-filter-destination').value||(x.destino||'ESTOQUE')===$('en-filter-destination').value)&&(!$('en-filter-supplier').value||String(x.pessoa)===$('en-filter-supplier').value)).slice().sort((a,b)=>b.id-a.id).map(x=>`<tr data-entry-id="${x.id}" title="DÊ DOIS CLIQUES PARA ABRIR A ENTRADA" style="cursor:pointer"><td>${x.id}</td><td>${esc(x.data)}</td><td>${esc(dbSup().find(f=>String(f.id)===String(x.pessoa))?.nome||x.pessoa)}</td><td>${esc(x.destino||'ESTOQUE')}</td><td>${money(x.total)}</td><td><span class="en-status">${esc(x.situacao)}</span></td></tr>`).join('')||'<tr><td colspan="6">Nenhuma entrada encontrada.</td></tr>';
 t.querySelectorAll('[data-entry-id]').forEach(tr=>tr.addEventListener('dblclick',()=>select(tr.dataset.entryId)));
}

function select(id){guardarPesquisaEntradas();const e=load().entradas.find(x=>x.id===Number(id));if(!e)return note('ENTRADA NÃO ENCONTRADA.');current=e.id;items=(e.itens||[]).map(x=>({...x}));parcels=(e.parcelas||[]).map(x=>({...x}));render();}
function store(){const d=load(),old=d.entradas.find(x=>x.id===current);if(old?.situacao==='BAIXADA'||old?.situacao==='CANCELADA')return note('ENTRADAS BAIXADAS OU CANCELADAS NÃO PODEM SER ALTERADAS.');const pessoa=$('en-supplier').value;if(!pessoa||!items.length)return note('INFORME FORNECEDOR E PELO MENOS UM PRODUTO.');if(parcels.length&&Math.abs(parcels.reduce((a,x)=>a+x.valor,0)-sum())>.011)return note('A SOMA DAS PARCELAS DEVE SER IGUAL AO TOTAL DA ENTRADA.');const e={id:current||next(),data:$('en-date').value,pessoa,destino:destination(),situacao:'PENDENTE',itens:items.map(x=>({...x})),parcelas:parcels.map(x=>({...x})),gerarPagar:$('en-generate').checked,total:sum(),historico:old?.historico||[]};audit(e,old?'ALTERAÇÃO DA ENTRADA':'CADASTRO DA ENTRADA',diff(old,e));const idx=d.entradas.findIndex(x=>x.id===e.id);if(idx<0)d.entradas.push(e);else d.entradas[idx]=e;put(d);current=e.id;syncPay(e);render();note('ENTRADA GRAVADA COMO PENDENTE. ESTOQUE NÃO ALTERADO.');}
function confirmarOperacaoEntrada(tipo, numero, reversao){
 return new Promise(resolve=>{
  document.getElementById('en-confirm-overlay')?.remove();
  const overlay=document.createElement('div');
  overlay.id='en-confirm-overlay';overlay.className='fp-overlay fp-lookup-overlay';
  const acao=tipo==='down'?'BAIXAR':'CANCELAR';
  overlay.innerHTML=`<section class="fp-lookup-dialog" role="dialog" aria-modal="true" aria-labelledby="en-confirm-title">
   <header class="fp-lookup-head"><strong id="en-confirm-title">▣ CONFIRMAR ${acao} ENTRADA</strong><button type="button" class="fp-lookup-x" aria-label="Fechar">×</button></header>
   <div class="fp-lookup-body"><p>Confirma ${acao.toLowerCase()} a entrada nº ${esc(numero)}?</p>${reversao?'<p>O estoque e os lançamentos financeiros vinculados serão revertidos.</p>':''}
   <footer class="fp-lookup-actions"><button type="button" id="en-confirm-yes" style="background:#19579d;color:white;border:1px solid #19579d">CONFIRMAR</button>
   <button type="button" id="en-confirm-no" style="background:#f0f5fd;color:#19579d;border:1px solid #bfd4f2">CANCELAR</button></footer></div></section>`;
  document.body.appendChild(overlay);
  let finished=false;
  function finish(value){if(finished)return;finished=true;document.removeEventListener('keydown',key,true);overlay.remove();resolve(value)}
  function key(e){if(e.key==='Escape'||e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();finish(e.key==='Enter')}}
  document.addEventListener('keydown',key,true);
  overlay.querySelector('.fp-lookup-x').onclick=()=>finish(false);
  overlay.querySelector('#en-confirm-no').onclick=()=>finish(false);
  overlay.querySelector('#en-confirm-yes').onclick=()=>finish(true);
  overlay.onclick=e=>{if(e.target===overlay)finish(false)};
  overlay.querySelector('#en-confirm-yes').focus();
 });
}
function identificarOperadorEntrada(tipo, responsavel){
 return new Promise(resolve=>{
  document.getElementById('en-auth-overlay')?.remove();
  const ov=document.createElement('div');ov.id='en-auth-overlay';ov.className='erp-overlay';
  ov.style.cssText='position:fixed;inset:0;z-index:100001;background:rgba(5,26,57,.66);display:flex;align-items:center;justify-content:center;padding:16px';
  const title=tipo==='down'?'IDENTIFICAÇÃO PARA BAIXAR ENTRADA DE ESTOQUE':'IDENTIFICAÇÃO PARA CANCELAR ENTRADA DE ESTOQUE';
  ov.innerHTML=`<section role="dialog" aria-modal="true" aria-label="${title}" style="width:min(470px,calc(100vw - 32px));background:white;border-radius:12px;overflow:hidden;box-shadow:0 14px 35px #061f4266;font-family:inherit"><header style="background:#245b98;color:#fff;font-size:16px;font-weight:800;padding:21px 20px;display:flex;align-items:center;justify-content:space-between"><span>${title}</span><button type="button" id="en-auth-x" style="background:transparent;color:white;border:0;font-size:25px;cursor:pointer">×</button></header><div style="padding:25px 20px 5px;display:flex;flex-direction:column;gap:14px"><label style="display:flex;flex-direction:column;gap:5px;font-weight:700;font-size:13px;color:#163a6b">USUÁRIO (CÓDIGO)<input id="en-auth-code" type="text" autocomplete="off" placeholder="INFORME O CÓDIGO DO OPERADOR" style="width:100%;padding:12px;border:1px solid #b9d0f0;border-radius:5px;font-size:14px"></label><div style="padding:12px 14px;background:#e7f0fc;border:1px solid #c3d6f4;border-radius:5px;color:#184477"><strong id="en-auth-name" style="display:block">INFORME O CÓDIGO DO USUÁRIO</strong><small id="en-auth-role">O NOME APARECERÁ AUTOMATICAMENTE</small></div><label style="display:flex;flex-direction:column;gap:5px;font-weight:700;font-size:13px;color:#163a6b">SENHA<input id="en-auth-password" type="password" autocomplete="off" placeholder="DIGITE SUA SENHA" style="width:100%;padding:12px;border:1px solid #b9d0f0;border-radius:5px;font-size:14px"></label><p id="en-auth-error" role="alert" style="color:#b91c1c;font-size:12px;min-height:16px;margin:0"></p><p style="font-size:11px;color:#58749a;line-height:1.4">VALIDAÇÃO LOCAL DOS USUÁRIOS CADASTRADOS. NÃO SUBSTITUI AUTENTICAÇÃO SEGURA EM SERVIDOR.</p></div><footer style="display:flex;justify-content:center;gap:10px;padding:17px 20px 20px"><button type="button" id="en-auth-yes" style="background:#1d5ca8;color:white;border:0;border-radius:5px;padding:11px 18px;cursor:pointer;font-weight:700">CONTINUAR</button><button type="button" id="en-auth-no" style="background:#c7defb;color:#123e76;border:1px solid #7eafe9;border-radius:5px;padding:11px 18px;cursor:pointer;font-weight:700">CANCELAR</button></footer></section>`;
  document.body.appendChild(ov);
  const get=id=>ov.querySelector('#'+id),code=get('en-auth-code'),pass=get('en-auth-password'),error=get('en-auth-error');
  let finished=false;const finish=value=>{if(finished)return;finished=true;ov.remove();resolve(value)};
  const user=()=>{let raw;try{raw=JSON.parse(localStorage.getItem('erp_matriz_usuarios_v1')||'[]')}catch{raw=[]}const arr=Array.isArray(raw)?raw:(raw.usuarios||[]);const id=code.value.trim();const found=arr.find(x=>String(Number(x.id))===String(Number(id))&&String(x.situacao||'ATIVO').toUpperCase()==='ATIVO');if(found)return {id:String(found.id),nome:found.nome||found.login||'USUÁRIO',perfil:found.perfil||'USUÁRIO',record:found};return id==='300'?{id:'300',nome:'USUÁRIO DE DEMONSTRAÇÃO',perfil:'ACESSO PARA TESTES',record:null}:null};
  code.addEventListener('input',()=>{const u=user();get('en-auth-name').textContent=u?u.nome:'USUÁRIO NÃO ENCONTRADO';get('en-auth-role').textContent=u?u.perfil:'CONFIRA O CÓDIGO INFORMADO';error.textContent='';pass.value=''});
  const proceed=async()=>{const u=user();if(!u){error.textContent='USUÁRIO NÃO ENCONTRADO OU INATIVO.';code.focus();return}if(!pass.value){error.textContent='INFORME A SENHA.';pass.focus();return}let valid=false;try{valid=u.record&&u.record.senhaHash&&u.record.senhaSalt&&typeof window.LL_SHA256==='function'?(await window.LL_SHA256(u.record.senhaSalt+':'+pass.value))===u.record.senhaHash:(u.id==='300'&&pass.value==='123456')}catch{}if(!valid){error.textContent='SENHA INCORRETA.';pass.value='';pass.focus();return}if(tipo==='cancel'&&String(responsavel||'')!==String(u.id)){error.textContent='SOMENTE O USUÁRIO QUE REALIZOU A BAIXA PODE CANCELAR ESTA ENTRADA.';pass.value='';return}finish(u)};
  get('en-auth-yes').onclick=proceed;get('en-auth-no').onclick=()=>finish(null);get('en-auth-x').onclick=()=>finish(null);
  code.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();pass.focus()}};pass.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();proceed()}};code.focus();
 });
}
async function transition(type){
 const d=load(),e=d.entradas.find(x=>x.id===current);
 if(!e)return note('GRAVE A ENTRADA ANTES DE CONTINUAR.');
 if(type==='down'){
  if(e.situacao!=='PENDENTE')return note('SOMENTE ENTRADAS PENDENTES PODEM SER BAIXADAS.');
  const error=validateImmediatePayments(e);if(error)return note(error);
 }else if(type==='cancel'){
  if(e.situacao==='CANCELADA')return note('ESTA ENTRADA JÁ ESTÁ CANCELADA.');
  const linked=d.pagar.filter(x=>x.ref==='ENTRADA-'+e.id);
  if(linked.some(x=>Number(x.pago||0)>0||(x.pagamentos||[]).length))return note('NÃO É POSSÍVEL CANCELAR: EXISTEM CONTAS A PAGAR JÁ PAGAS. REGULARIZE OS PAGAMENTOS ANTES.');
 }else return;
 const before=e.situacao;
 let autorizado=null;
 if(type==='down'||(type==='cancel'&&before==='BAIXADA')){
  const responsavel=type==='cancel'?(e.baixadoPorCodigo||''):null;
  if(type==='cancel'&&!responsavel)return note('NÃO FOI POSSÍVEL IDENTIFICAR O CÓDIGO DO USUÁRIO RESPONSÁVEL PELA BAIXA. CANCELAMENTO BLOQUEADO.');
  autorizado=await identificarOperadorEntrada(type,responsavel);
  if(!autorizado)return;
 }else if(!await confirmarOperacaoEntrada(type,e.id,false))return;
 e.situacao=type==='down'?'BAIXADA':'CANCELADA';if(type==='down'){e.baixadaEm=new Date().toISOString();e.baixadoPor=autorizado.nome;e.baixadoPorCodigo=autorizado.id;}else{e.canceladaEm=new Date().toISOString();e.canceladoPor=autorizado?autorizado.nome:auditUser();e.canceladoPorCodigo=autorizado?.id||null;e.situacaoAntesCancelamento=before;e.cancelamentoDeBaixa=before==='BAIXADA';}
 e.historico=Array.isArray(e.historico)?e.historico:[];
 audit(e,type==='down'?'BAIXA DA ENTRADA':'CANCELAMENTO DA ENTRADA',[{campo:'SITUAÇÃO',anterior:before,novo:e.situacao}]);
 put(d);
 if(type==='down'&&(e.destino||'ESTOQUE')!=='ALMOXARIFADO')costUpdate(e);
 recompute();if(typeof window.LL_estoqueCentralConciliar==='function')window.LL_estoqueCentralConciliar();syncPay(e);syncImmediatePayments(e);render();
 note(type==='down'?'ENTRADA BAIXADA. SALDO DO DESTINO ATUALIZADO.':'ENTRADA CANCELADA. MOVIMENTAÇÕES VINCULADAS REVERTIDAS.');
}
function atalhosEntradaPadrao(){
 document.getElementById('en-overlay')?.remove();
 const rows=[['F1','Abrir esta janela de atalhos'],['F12','Localizar entrada pelo número'],['F2','Baixar entrada'],['F3','Cancelar entrada']];
 const overlay=document.createElement('div');overlay.id='en-overlay';
 overlay.style.cssText='position:fixed;inset:0;background:rgba(4,25,57,.68);display:flex;align-items:center;justify-content:center;z-index:99999;padding:16px';
 overlay.innerHTML=`<div role="dialog" aria-modal="true" aria-label="Atalhos — Entradas de Estoque" style="width:475px;max-width:100%;background:#fff;border-radius:13px;overflow:hidden;box-shadow:0 16px 45px #001b3b55;color:#0b3775;font-family:Arial,sans-serif"><header style="background:#195596;color:white;padding:20px 22px;display:flex;justify-content:space-between;align-items:center"><strong>⌂ ATALHOS — ▣ ENTRADAS DE ESTOQUE</strong><button type="button" data-close style="background:transparent;border:0;color:white;font-size:24px;cursor:pointer">×</button></header><div style="padding:18px 22px">${rows.map(([key,label])=>`<div style="display:flex;align-items:center;gap:16px;padding:10px 0;border-bottom:1px solid #e4ebf5"><span style="display:inline-flex;align-items:center;justify-content:center;min-width:54px;height:34px;background:#eaf2ff;border:1px solid #bfd4f5;border-radius:5px;color:#0b3775;font-weight:bold">${key}</span><span>${label}</span></div>`).join('')}</div><footer style="padding:12px 20px;text-align:right;border-top:1px solid #e4ebf5"><button type="button" data-close style="background:#195596;color:white;padding:12px 22px;border:0;border-radius:5px;cursor:pointer">FECHAR</button></footer></div>`;
 document.body.appendChild(overlay);
 const close=()=>{overlay.remove();document.removeEventListener('keydown',onKey,true)};
 const onKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}};
 document.addEventListener('keydown',onKey,true);
 overlay.querySelectorAll('[data-close]').forEach(b=>b.onclick=close);
 overlay.onclick=e=>{if(e.target===overlay)close()};
}
function imprimirEntrada(){
 const entry=load().entradas.find(x=>String(x.id)===String(current));
 if(!entry)return note('SELECIONE UMA ENTRADA GRAVADA PARA IMPRIMIR.');
 let loja={};try{loja=JSON.parse(localStorage.getItem('erp_systems_dados_loja_v1')||'{}')}catch{}
 const sup=dbSup().find(x=>String(x.id)===String(entry.pessoa));
 const date=v=>{if(!v)return '—';const a=String(v).slice(0,10).split('-');return a.length===3?a.reverse().join('/'):String(v)};
 const dest={ESTOQUE:'ESTOQUE — MERCADORIAS PARA VENDA',ALMOXARIFADO:'ALMOXARIFADO — USO INTERNO',MATERIA_PRIMA:'MATÉRIAS-PRIMAS — PRODUÇÃO'};
 const rows=(entry.itens||[]).map(it=>{const prod=products.find(p=>String(p.codigo)===String(it.codigo));return `<tr><td>${esc(it.codigo)}</td><td>${esc(prod?.descricao||it.descricao||'PRODUTO')}</td><td class="num">${esc(it.quantidade)}</td><td class="num">${money(it.preco)}</td><td class="num">${money(Number(it.quantidade)*Number(it.preco))}</td></tr>`}).join('');
 const parts=(entry.parcelas||[]).map((x,i)=>`<tr><td>${i+1}</td><td>${date(x.vencimento)}</td><td>${esc(x.forma)}</td><td class="num">${money(x.valor)}</td></tr>`).join('');
 const doc=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Entrada de estoque Nº ${esc(entry.id)}</title><style>
 @page{size:A4;margin:0}*{box-sizing:border-box}body{font:12px Arial,sans-serif;color:#17263c;background:white;margin:0 auto;padding:7mm;width:100%;max-width:210mm;overflow-wrap:anywhere}header{text-align:center;border:0;padding:0;margin-bottom:16px}.company-head{display:flex;align-items:center;justify-content:center;gap:22px;text-align:left;width:100%;max-width:180mm;margin:0 auto 15px;padding:7px 0 14px;border-bottom:1px solid #c5d8f0}.company-details{flex:1;min-width:0}.company-head img{display:block;max-height:100px;max-width:135px;object-fit:contain;flex-shrink:0;margin:0}.company-details h1{margin:0 0 7px;font-size:17px;line-height:1.25}.company-details .sub{margin:3px 0;line-height:1.55}.document-title{font-size:17px;letter-spacing:.2px;text-align:center;background:#e5effc;color:#153f79;padding:12px 8px;margin:0 0 14px;border-radius:3px}h1{font-size:18px;margin:5px 0}h2{font-size:13px;color:#153f79;margin:22px 0 8px;border-bottom:1px solid #b8c7da;padding-bottom:5px}.sub{font-size:11px;color:#555;line-height:1.5}.meta{display:grid;grid-template-columns:1fr 1fr;gap:9px 18px;margin:15px 0}.meta div{line-height:1.5}.meta b{color:#153f79}table{width:100%;border-collapse:collapse;table-layout:fixed}th{text-align:left;background:#e9eff7;color:#153f79;padding:8px 5px;font-size:10px}td{padding:8px 5px;border-bottom:1px solid #e1e6ee;overflow-wrap:anywhere}.num{text-align:right}th.num{text-align:right}.total{text-align:right;font-size:16px;font-weight:bold;margin:14px 0}.foot{margin-top:25px;color:#555;font-size:11px}.sign{margin:48px auto 0;display:flex;justify-content:center;width:100%;break-inside:avoid}.sign div{width:85mm;max-width:100%;border-top:1px solid #333;text-align:center;padding-top:7px}.emission-footer{margin:24px 0 0;text-align:right;font-size:10px;font-weight:bold;color:#153f79;break-inside:avoid}@media print{body{margin:0 auto;padding:7mm;width:100%;max-width:210mm}tr{break-inside:avoid}h2{break-after:avoid}}</style></head><body>
 <header><div class="company-head">${loja.logo?`<img src="${esc(loja.logo)}" alt="Logomarca">`:''}<div class="company-details"><h1>${esc(loja.nome||loja.fantasia||loja.razao||'LOJA NÃO CADASTRADA')}</h1><div class="sub">${esc([loja.razao,loja.cnpj].filter(Boolean).join(' · '))}</div><div class="sub">${esc([loja.rua,loja.numero,loja.bairro,loja.cidade,loja.uf].filter(Boolean).join(' · '))}</div><div class="sub">${esc([loja.telefone,loja.email].filter(Boolean).join(' · '))}</div></div></div><h1 class="document-title">COMPROVANTE DE ENTRADA DE ESTOQUE</h1></header>
 <div class="meta"><div><b>Nº DA ENTRADA:</b> ${esc(entry.id)}</div><div><b>DATA:</b> ${date(entry.data)}</div><div><b>FORNECEDOR:</b> ${esc(sup?.nome||entry.pessoa||'—')}</div><div><b>SITUAÇÃO:</b> ${esc(entry.situacao)}</div><div><b>DESTINO:</b> ${esc(dest[entry.destino]||entry.destino||'ESTOQUE')}</div><div><b>USUÁRIO:</b> ${esc(entry.usuario||'—')}</div></div>
 <h2>PRODUTOS DA ENTRADA</h2><table><thead><tr><th style="width:12%">CÓDIGO</th><th>DESCRIÇÃO</th><th class="num" style="width:12%">QTD.</th><th class="num" style="width:18%">CUSTO UNIT.</th><th class="num" style="width:18%">TOTAL</th></tr></thead><tbody>${rows}</tbody></table><div class="total">TOTAL DA ENTRADA: ${money(entry.total)}</div>
 <h2>FINANCEIRO DA ENTRADA</h2><table><thead><tr><th style="width:12%">Nº</th><th>VENCIMENTO</th><th>FORMA</th><th class="num">VALOR</th></tr></thead><tbody>${parts||'<tr><td colspan="4">SEM PARCELAS REGISTRADAS</td></tr>'}</tbody></table><div class="sign"><div>RESPONSÁVEL PELA ENTRADA</div></div><div class="emission-footer" id="en-emission-footer"></div></body></html>`;
 document.getElementById('en-print-preview')?.remove();
 const overlay=document.createElement('div');overlay.id='en-print-preview';overlay.style.cssText='position:fixed;inset:0;z-index:999999;background:rgba(0,19,46,.70);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Arial,sans-serif;color:#102c55';
 overlay.innerHTML=`<section role="dialog" aria-modal="true" aria-label="Imprimir entrada de estoque" style="background:#fff;width:min(1250px,98vw);height:min(850px,95vh);display:flex;flex-direction:column;border-radius:10px;overflow:hidden;box-shadow:0 12px 42px #0004">
 <header style="background:#174b88;color:white;padding:17px 22px;font-weight:700;font-size:19px;display:flex;justify-content:space-between;align-items:center"><span>IMPRIMIR ENTRADA DE ESTOQUE</span><button type="button" id="en-prev-x" style="border:0;background:transparent;color:white;font-size:26px;cursor:pointer">×</button></header>
 <div style="display:grid;grid-template-columns:minmax(290px,40%) minmax(0,60%);gap:14px;padding:16px;flex:1;min-height:0;overflow:auto">
 <div style="display:flex;flex-direction:column;gap:14px;min-width:0">
 <section style="border:1px solid #c5d8f0;border-radius:7px;padding:12px"><div style="background:#e5effc;padding:10px;font-weight:bold">DADOS DA ENTRADA SELECIONADA</div><div style="line-height:2;padding:10px"><b>Nº DA ENTRADA:</b> ${esc(entry.id)} &nbsp; <b>DATA:</b> ${date(entry.data)}<div><b>FORNECEDOR:</b> ${esc(sup?.nome||entry.pessoa||'—')}</div><div><b>DESTINO:</b> ${esc(dest[entry.destino]||entry.destino||'ESTOQUE')}</div><div><b>SITUAÇÃO:</b> ${esc(entry.situacao)} &nbsp; <b>USUÁRIO:</b> ${esc(entry.usuario||'—')}</div></div></section>
 <section style="border:1px solid #c5d8f0;border-radius:7px;padding:12px"><div style="background:#e5effc;padding:10px;font-weight:bold">TIPO DE IMPRESSÃO</div><label style="display:block;margin:14px 0"><input type="radio" name="en-print-type" value="complete" checked> COMPLETA (Produtos, Financeiro e Assinatura)</label><label><input type="radio" name="en-print-type" value="simple"> SIMPLIFICADA (Produtos e Total)</label></section>
 <section style="border:1px solid #c5d8f0;border-radius:7px;padding:12px"><div style="background:#e5effc;padding:10px;font-weight:bold">OPÇÕES DE IMPRESSÃO</div><label style="display:block;margin:14px 0"><input type="checkbox" id="en-show-items" checked> INCLUIR PRODUTOS DA ENTRADA</label><label style="display:block;margin:14px 0"><input type="checkbox" id="en-show-fin" checked> INCLUIR FINANCEIRO (PARCELAS)</label><label style="display:block;margin:14px 0"><input type="checkbox" id="en-show-sign" checked> INCLUIR ASSINATURA</label></section>
 <section style="border:1px solid #c5d8f0;border-radius:7px;padding:12px"><div style="background:#e5effc;padding:10px;font-weight:bold">ORIENTAÇÃO DA FOLHA</div><select id="en-orientation" style="margin-top:10px;width:100%;padding:10px;border:1px solid #b7cde9;border-radius:5px"><option value="portrait">RETRATO</option><option value="landscape">PAISAGEM</option></select></section></div>
 <section style="border:1px solid #c5d8f0;border-radius:7px;padding:12px;display:flex;flex-direction:column;min-height:440px;min-width:0"><div style="background:#e5effc;padding:10px;font-weight:bold;margin-bottom:10px">PRÉ-VISUALIZAÇÃO A4</div><iframe id="en-print-frame" title="Pré-visualização A4" style="width:100%;height:700px;flex:none;min-height:0;overflow:hidden;border:1px solid #b7cde9;background:white" scrolling="no"></iframe></section></div>
 <footer style="display:flex;gap:10px;justify-content:flex-end;padding:13px 20px;border-top:1px solid #d6e2f0"><button type="button" id="en-do-print" style="background:#1765d5;color:white;border:0;border-radius:5px;padding:13px 24px;font-weight:bold;cursor:pointer">IMPRIMIR</button><button type="button" id="en-do-save" style="background:#07975c;color:white;border:0;border-radius:5px;padding:13px 24px;font-weight:bold;cursor:pointer">SALVAR</button><button type="button" id="en-do-close" style="background:#e8f1fd;color:#174b88;border:1px solid #b7cde9;border-radius:5px;padding:13px 24px;font-weight:bold;cursor:pointer">FECHAR</button></footer></section>`;
 document.body.appendChild(overlay);
 const frame=overlay.querySelector('#en-print-frame');let ready=false;
 function refresh(){
  const simple=overlay.querySelector('input[name="en-print-type"]:checked').value==='simple';
  const showItems=overlay.querySelector('#en-show-items').checked,showFin=!simple&&overlay.querySelector('#en-show-fin').checked,showSign=!simple&&overlay.querySelector('#en-show-sign').checked;
  const orient=overlay.querySelector('#en-orientation').value;
  const style=`<style>@page{size:A4 ${orient};margin:0}body{max-width:${orient==='portrait'?'210mm':'297mm'};margin:0 auto;padding:8mm}header{margin-bottom:12px}h2{margin-top:12px}.sign{margin-top:55px}</style>`;
  let html=doc.replace('</head>',style+'</head>');
  const emission='EMITIDO EM '+new Date().toLocaleDateString('pt-BR')+', POR '+auditUser()+'.';
  html=html.replace('<div class="emission-footer" id="en-emission-footer"></div>','<div class="emission-footer" id="en-emission-footer">'+esc(emission)+'</div>');
  if(!showItems)html=html.replace(/<h2>PRODUTOS DA ENTRADA<\/h2>[\s\S]*?<div class="total">/,'<div class="total">');
  if(!showFin)html=html.replace(/<h2>FINANCEIRO DA ENTRADA<\/h2>[\s\S]*?<div class="foot">/,'<div class="foot">');
  if(!showSign)html=html.replace(/<div class="sign">[\s\S]*?<\/div><\/div>/,'');
  frame.onload=()=>{
   try{
    const inner=frame.contentDocument;
    inner.documentElement.style.overflow='hidden';
    inner.body.style.overflow='hidden';
    const resize=()=>{
     if(!frame.isConnected)return;
     const height=Math.max(inner.documentElement.scrollHeight,inner.body.scrollHeight,390);
     frame.style.height=(height+8)+'px';
    };
    resize();
    if(inner.fonts&&inner.fonts.ready)inner.fonts.ready.then(resize);
    inner.querySelectorAll('img').forEach(img=>{if(!img.complete)img.addEventListener('load',resize,{once:true})});
   }catch(e){frame.style.height='900px'}
   ready=true;
  };ready=false;frame.srcdoc=html;
 }
 overlay.querySelectorAll('input,select').forEach(el=>el.addEventListener('change',refresh));
 const close=()=>{document.removeEventListener('keydown',onKey,true);overlay.remove()};
 const onKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}};
 document.addEventListener('keydown',onKey,true);
 overlay.querySelector('#en-prev-x').onclick=close;overlay.querySelector('#en-do-close').onclick=close;
 overlay.onclick=e=>{if(e.target===overlay)close()};
 overlay.querySelector('#en-do-print').onclick=()=>{if(!ready)return note('AGUARDE A PRÉ-VISUALIZAÇÃO CARREGAR.');try{frame.contentWindow.focus();frame.contentWindow.print()}catch{note('NÃO FOI POSSÍVEL ABRIR A IMPRESSÃO.')}};
 overlay.querySelector('#en-do-save').onclick=async()=>{
  if(!ready)return note('AGUARDE A PRÉ-VISUALIZAÇÃO CARREGAR.');
  const simple=overlay.querySelector('input[name="en-print-type"]:checked').value==='simple';
  const cfg={number:entry.id,date:date(entry.data),supplier:sup?.nome||entry.pessoa||'—',destination:dest[entry.destino]||entry.destino||'ESTOQUE',status:entry.situacao,user:entry.usuario||'—',company:loja.nome||loja.fantasia||loja.razao||'LOJA NÃO CADASTRADA',logo:loja.logo||'',details:[[loja.razao,loja.cnpj].filter(Boolean).join(' · '),[loja.rua,loja.numero,loja.bairro,loja.cidade,loja.uf].filter(Boolean).join(' · '),[loja.telefone,loja.email].filter(Boolean).join(' · ')],orientation:overlay.querySelector('#en-orientation').value,showItems:overlay.querySelector('#en-show-items').checked,showFinance:!simple&&overlay.querySelector('#en-show-fin').checked,showSignature:!simple&&overlay.querySelector('#en-show-sign').checked,issuedAt:new Date().toLocaleDateString('pt-BR'),issuedBy:auditUser(),total:money(entry.total),items:(entry.itens||[]).map(it=>{const prod=products.find(p=>String(p.codigo)===String(it.codigo));return [String(it.codigo),prod?.descricao||it.descricao||'PRODUTO',String(it.quantidade),money(it.preco),money(Number(it.quantidade)*Number(it.preco))]}),installments:(entry.parcelas||[]).map((x,i)=>[String(i+1),date(x.vencimento),String(x.forma||''),money(x.valor)])};
  try{if(typeof window.LucasEntradaPDF!=='function')throw Error('Gerador de PDF não carregado.');const result=await window.LucasEntradaPDF(cfg);if(result==='downloaded')note('PDF BAIXADO. ESCOLHA A PASTA NAS CONFIGURAÇÕES DE DOWNLOAD DO CHROME.')}catch(e){note('NÃO FOI POSSÍVEL SALVAR O PDF: '+(e.message||e))}
 };
 refresh();
}
function localizarEntradaF12(){
 if(document.getElementById('en-f12-overlay'))return;
 const overlay=document.createElement('div');
 overlay.id='en-f12-overlay';overlay.className='fp-overlay fp-lookup-overlay';
 overlay.innerHTML=`<section class="fp-lookup-dialog" role="dialog" aria-modal="true" aria-labelledby="en-f12-title">
 <header class="fp-lookup-head"><strong id="en-f12-title">▣ LOCALIZAR ENTRADA — F12</strong><button type="button" class="fp-lookup-x" aria-label="Fechar">×</button></header>
 <div class="fp-lookup-body"><p>Informe o número da entrada.</p><label for="en-f12-code">NÚMERO DA ENTRADA</label>
 <input id="en-f12-code" inputmode="numeric" autocomplete="off" placeholder="DIGITE O NÚMERO...">
 <p id="en-f12-error" role="alert" aria-live="polite" style="min-height:17px;margin:5px 0 11px;color:#b22b39;font-size:12px;font-weight:600"></p>
 <footer class="fp-lookup-actions"><button type="button" id="en-f12-go" style="background:#19579d;color:white;border:1px solid #19579d">LOCALIZAR</button>
 <button type="button" id="en-f12-cancel" style="background:#f0f5fd;color:#19579d;border:1px solid #bfd4f2">CANCELAR</button></footer></div></section>`;
 document.body.appendChild(overlay);
 const close=()=>{document.removeEventListener('keydown',key,true);overlay.remove()};
 const go=()=>{const raw=document.getElementById('en-f12-code').value.trim();const entry=raw?load().entradas.find(x=>String(x.id)===String(Number(raw))):null;
 if(!entry){document.getElementById('en-f12-error').textContent=raw?'ENTRADA NÃO ENCONTRADA.':'INFORME O NÚMERO DA ENTRADA.';return;}
 close();select(entry.id);};
 const key=e=>{if(['Escape','Enter','F12'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();if(e.key==='Escape')close();else if(e.key==='Enter')go();}};
 document.addEventListener('keydown',key,true);
 overlay.querySelector('.fp-lookup-x').onclick=close;
 document.getElementById('en-f12-go').onclick=go;
 document.getElementById('en-f12-cancel').onclick=close;
 overlay.onclick=e=>{if(e.target===overlay)close()};
 document.getElementById('en-f12-code').focus();
}
async function action(a,i){const e=load().entradas.find(x=>x.id===current);const locked=e&&e.situacao!=='PENDENTE';if(a==='shortcuts')return atalhosEntradaPadrao();if(a==='home')return category('COMPRAS');if(a==='new'){guardarPesquisaEntradas();current=null;items=[];parcels=[];return render();}if(a==='load')return select(i);if(a==='locate'){localizarEntradaF12();return;}if(a==='print')return imprimirEntrada();if(a==='search'||a==='filter'){entradasPesquisaExecutada=true;guardarPesquisaEntradas();drawList();return;}if(a==='save')return store();if(a==='down'||a==='cancel')return transition(a);if(a==='edit'){if(!e)return note('SELECIONE UMA ENTRADA GRAVADA.');if(locked)return note('ENTRADAS BAIXADAS OU CANCELADAS NÃO PODEM SER ALTERADAS.');$('en-supplier').focus();return;}if(a==='viewitem'){const item=items[Number(i)];if(!item)return;stock(item.codigo);return;}if(locked)return note('ENTRADAS BAIXADAS OU CANCELADAS NÃO PODEM SER ALTERADAS.');if(a==='additem'){const codigo=$('en-product').value,quantidade=n($('en-qty').value),preco=n($('en-cost').value);if(!products.some(x=>String(x.codigo)===codigo)||!Number.isFinite(quantidade)||quantidade<=0||!Number.isFinite(preco)||preco<0)return note('PRODUTO, QUANTIDADE OU CUSTO INVÁLIDOS.');items.push({codigo,quantidade,preco});$('en-product').value='';$('en-product-description').value='';$('en-qty').value='';$('en-cost').value='';drawItems();stock();$('en-product').focus();return;}if(a==='delitem'){items.splice(Number(i),1);drawItems();return;}if(a==='addparcel'){const valor=n($('en-value').value);if(!Number.isFinite(valor)||valor<=0||!$('en-due').value)return note('INFORME VENCIMENTO E VALOR VÁLIDOS.');if(!methodRecord({forma:$('en-method').value}))return note('SELECIONE UMA FORMA DE PAGAMENTO CADASTRADA.');parcels.push({vencimento:$('en-due').value,forma:$('en-method').value,formaId:methodRecord({forma:$('en-method').value})?.id,valor});$('en-value').value='';drawParcels();return;}if(a==='delparcel'){parcels.splice(Number(i),1);drawParcels();}}
const previous=open;open=function(name){if(name==='ENTRADAS DE ESTOQUE'||name==='ENTRADAS'){const draft=sessionStorage.getItem('en_entrada_rascunho');current=null;items=[];parcels=[];if(draft){try{const x=JSON.parse(draft);current=x.current;items=x.items||[];parcels=x.parcels||[];render();$('en-date').value=x.data||today();$('en-supplier').value=x.pessoa||'';$('en-destination').value=x.destino||'ESTOQUE';$('en-generate').checked=!!x.gerarPagar;$('en-product').value=x.produto||'';stock();$('en-qty').value=x.quantidade||'';if(x.custo!==undefined)$('en-cost').value=x.custo;sessionStorage.removeItem('en_entrada_rascunho');return;}catch{sessionStorage.removeItem('en_entrada_rascunho')}}return render();}return previous(name)};
document.addEventListener('keydown',ev=>{if(!$('en-id')||ev.altKey||ev.ctrlKey||ev.metaKey)return;const map={F1:'shortcuts',F2:'down',F3:'cancel',F12:'locate'};if(map[ev.key]){ev.preventDefault();ev.stopImmediatePropagation();action(map[ev.key]);}},true);
window.LLopenEntryFromStock=n=>{if(!load().entradas.some(x=>Number(x.id)===Number(n)))return false;select(Number(n));return true};
})();

/* Seleção dos itens da entrada para consulta de estoque */

(function(){const st=document.createElement('style');st.textContent='.en-item-select{background:transparent;border:0;color:#0753a3;cursor:pointer;font:inherit;text-align:left;padding:3px 0;width:100%}.en-item-select:hover{text-decoration:underline;color:#0871e4}.en-item-select:focus-visible{outline:2px solid #0871e4;border-radius:3px}';document.head.appendChild(st)})();
