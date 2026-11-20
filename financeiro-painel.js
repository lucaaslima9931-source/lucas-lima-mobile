/* LUCAS LIMA — Painel financeiro local. Dados persistidos no navegador. */
(()=>{'use strict';

// Mensagens padronizadas do Financeiro: não usar alert/confirm nativos do navegador.
function finDialog(message, ask=false){
 return new Promise(resolve=>{
  const previous=document.getElementById('fin-standard-message');if(previous)previous.remove();
  const shade=document.createElement('div');shade.id='fin-standard-message';shade.style.cssText='position:fixed;inset:0;background:rgba(0,20,55,.68);z-index:2147483640;display:flex;align-items:center;justify-content:center;padding:16px';
  const panel=document.createElement('section');panel.style.cssText='width:min(490px,95vw);background:white;border-radius:11px;overflow:hidden;box-shadow:0 15px 45px #001a3b66;color:#173d72';
  const title=document.createElement('header');title.textContent=ask?'LUCAS LIMA — CONFIRMAÇÃO':'LUCAS LIMA — AVISO';title.style.cssText='background:#205a96;color:white;font-size:17px;font-weight:800;padding:18px 20px';
  const body=document.createElement('div');body.textContent=String(message);body.style.cssText='padding:26px 22px;line-height:1.55;text-align:center;font-weight:600;white-space:pre-wrap';
  const footer=document.createElement('footer');footer.style.cssText='display:flex;justify-content:center;gap:10px;padding:0 20px 22px';
  const ok=document.createElement('button');ok.textContent=ask?'CONFIRMAR':'OK';ok.style.cssText='background:#14569c;color:white;border:0;border-radius:6px;padding:12px 22px;font-weight:800;cursor:pointer';footer.append(ok);
  let cancel=null;if(ask){cancel=document.createElement('button');cancel.textContent='CANCELAR';cancel.style.cssText='background:#e6f0ff;color:#174c8a;border:1px solid #b7cff0;border-radius:6px;padding:12px 22px;font-weight:800;cursor:pointer';footer.append(cancel)}
  panel.append(title,body,footer);shade.append(panel);document.body.append(shade);
  function finish(v){document.removeEventListener('keydown',keys,true);shade.remove();resolve(v)}
  function keys(e){if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();finish(false)}else if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();finish(true)}}
  document.addEventListener('keydown',keys,true);ok.onclick=()=>finish(true);if(cancel)cancel.onclick=()=>finish(false);ok.focus();
 });
}
function finAlert(message){void finDialog(message,false)}
function finConfirm(message){return finDialog(message,true)}

const KEY='erp_systems_financeiro_v1',OPS='erp_matriz_operacoes_v2';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cash=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}),today=()=>new Date().toISOString().slice(0,10),fmt=s=>s?String(s).slice(0,10).split('-').reverse().join('/'):'—';
const load=()=>{let d={};try{d=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{};d.contas=Array.isArray(d.contas)?d.contas:[];d.movimentos=Array.isArray(d.movimentos)?d.movimentos:[];d.importacoes=Array.isArray(d.importacoes)?d.importacoes:[];d.extrato=Array.isArray(d.extrato)?d.extrato:[];d.transferencias=Array.isArray(d.transferencias)?d.transferencias:[];return d};
// V718: conciliação de leitura com o livro-caixa. Não grava cópias no Financeiro:
// evita lançamentos duplicados e reflete automaticamente entradas/saídas já registradas.
function conciliarLivroCaixa(d){
 let caixas=[];try{caixas=JSON.parse(localStorage.getItem('erp_systems_caixas_v1')||'[]')}catch{}
 if(!Array.isArray(caixas))return;
 const conta=d.contas.find(c=>c.contaPadrao==='CAIXA')||d.contas.find(c=>String(c.tipo||'').toUpperCase()==='CAIXA');
 if(!conta)return;
 const seen=new Set(d.movimentos.map(m=>String(m.ref||'')).filter(Boolean));
 const normal=v=>String(v||'').trim().toUpperCase();
 const money=m=>{
  let f=normal(m.forma||m.tipoForma);
  if(!f&&m.formaId!=null){try{const v=JSON.parse(localStorage.getItem('erp_matriz_formas_pagamento_v1')||'[]');const arr=Array.isArray(v)?v:(v.formas||[]);const x=arr.find(x=>String(x.id)===String(m.formaId));f=normal(x?.tipo||x?.descricao)}catch{}}
  return /DINHEIRO|ESP[EÉ]CIE/.test(f);
 };
 caixas.forEach((c,ci)=>{
  // Saldo inicial: somente a primeira abertura conhecida. Aberturas posteriores
  // podem carregar dinheiro da sessão anterior e não são receita nova.
  if(ci===0&&Number(c.inicial)>0){const ref='LIVRO-ABERTURA-'+c.id;if(!seen.has(ref))d.movimentos.push({id:ref,conta:conta.id,tipo:'ENTRADA',valor:Number(c.inicial),date:String(c.abertura||'').slice(0,10)||today(),descricao:'SALDO INICIAL DO CAIXA Nº '+c.id,ref,categoria:'SALDO INICIAL',usuario:c.operadorNome||c.operador,origem:'CAIXA',virtual:true})}
  (Array.isArray(c.movimentos)?c.movimentos:[]).forEach((m,i)=>{
   const kind=normal(m.tipo),cat=normal(m.categoria);
   if(m.naoFinanceiro||m.contabilizaSaldo===false||!['ENTRADA','SAIDA','SAÍDA'].includes(kind)||!money(m))return;
   // Sangrias já possuem lançamento financeiro de saída e entrada na Tesouraria.
   // A reversão da sangria também é tratada no registro original.
   if(cat.includes('SANGRIA'))return;
   const amount=Number(m.valor);if(!Number.isFinite(amount)||amount<=0)return;
   const ref='LIVRO-CAIXA-'+c.id+'-'+i;
   if(seen.has(ref))return;
   d.movimentos.push({id:ref,conta:conta.id,tipo:kind==='ENTRADA'?'ENTRADA':'SAIDA',valor:amount,date:String(m.data||c.abertura||'').slice(0,10)||today(),descricao:m.descricao||cat||'MOVIMENTAÇÃO DO CAIXA',ref,categoria:cat||'CAIXA',usuario:m.usuario||m.operador||c.operadorNome||c.operador,origem:'CAIXA',caixaId:c.id,virtual:true});
  });
 });
}
const store=d=>localStorage.setItem(KEY,JSON.stringify(d));
const ops=()=>{try{return JSON.parse(localStorage.getItem(OPS)||'{}')}catch{return {}}};
const user=()=>document.querySelector('.top-user strong,.user-name')?.textContent?.trim()||'DEMONSTRAÇÃO';
const newid=a=>Math.max(0,...a.map(x=>Number(x.id)||0))+1;
let tab='menu',bank='',from='',to='',editingAccount=null,moveType='',editingTransfer=null,transferQuery='',transferStart='',transferEnd='',transferSearched=false,transferOrigin='',transferTarget='',extractSearched=false,generalSearched=false,generalBank='',accountQuery='',accountSearched=false;
function addMove(d,{date=today(),conta,tipo,valor,descricao,ref='',categoria='MANUAL'}){d.movimentos.push({id:newid(d.movimentos),date,conta,tipo,valor:Number(valor),descricao,ref,categoria,usuario:user(),created:new Date().toISOString()})}
const balance=(d,id)=>d.movimentos.filter(m=>String(m.conta)===String(id)&&m.contabilizaSaldo!==false&&['ENTRADA','SAIDA'].includes(m.tipo)).reduce((a,m)=>a+(m.tipo==='ENTRADA'?1:-1)*Number(m.valor||0),0);
const period=m=>(!from||m.date>=from)&&(!to||m.date<=to);
function section(title,body){return `<section class="fin-card"><h3>${title}</h3>${body}</section>`}
function selectBank(d,id,placeholder='SELECIONE'){return `<select id="${id}"><option value="">${placeholder}</option>${d.contas.filter(x=>x.ativo!==false).map(x=>`<option value="${x.id}">${esc(x.nome)}</option>`).join('')}</select>`}
function header(){return `<div class="fin-new-header"><strong>▣ FINANCEIRO</strong></div>${tab==='menu'?`<div class="fin-menu-caption"><b>CONTROLE FINANCEIRO</b><span>Acesse as opções abaixo para gerenciar suas contas, movimentações e transferências.</span></div><div class="fin-menu-cards">${[['geral','▥','VISÃO GERAL','Acompanhe os saldos, entradas, saídas e o resumo financeiro da loja.','green'],['contas','▤','CONTAS BANCÁRIAS','Cadastre e gerencie contas bancárias, caixa da loja e tesouraria.','blue'],['extrato','▤','EXTRATO BANCÁRIO','Consulte as movimentações de todas as contas no período desejado.','orange'],['transferir','⇄','TRANSFERÊNCIAS','Transfira valores entre contas, com registro do usuário e histórico.','purple']].map(([id,ico,n,desc,color])=>`<button class="fin-menu-card" data-fin-tab="${id}"><span class="fin-card-icon ${color}">${ico}</span><span><b>${n}</b><small>${desc}</small></span><strong>›</strong></button>`).join('')}</div>`:`<div class="fin-subnav"><strong>${{geral:'VISÃO GERAL',contas:'CONTAS BANCÁRIAS',extrato:'EXTRATO BANCÁRIO',transferir:'TRANSFERÊNCIAS'}[tab]||''}</strong></div>`}`}
function ensureDefaults(d){
 // Contas automáticas são criadas somente na primeira inicialização.
 // Não recriar a conta se o administrador mudar seu nome ou tipo.
 const initKey=KEY+'_contas_inicializadas';
 if(localStorage.getItem(initKey)==='1')return;
 let changed=false;
 for(const [nome,tipo] of [['CAIXA DA LOJA','CAIXA'],['TESOURARIA','TESOURARIA']]){
   const existing=d.contas.find(c=>String(c.nome||'').trim().toUpperCase()===nome);
   if(existing){existing.contaPadrao=tipo;changed=true;continue}
   // Legado: CAIXA já cadastrado equivale ao caixa da loja. Não criar outro.
   if(tipo==='CAIXA'&&d.contas.some(c=>String(c.nome||'').trim().toUpperCase()==='CAIXA')){
     const legacy=d.contas.find(c=>String(c.nome||'').trim().toUpperCase()==='CAIXA');
     legacy.contaPadrao='CAIXA';changed=true;continue;
   }
   d.contas.push({id:newid(d.contas),nome,banco:'',agencia:'',numero:'',tipo,ativo:true,usuario:'SISTEMA',contaPadrao:tipo});changed=true;
 }
 if(changed)store(d);
 localStorage.setItem(initKey,'1');
}

function movements(d){return d.movimentos.filter(period).sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id)}
function summary(d){const mm=movements(d).filter(m=>m.categoria!=='TRANSFERENCIA'),en=mm.filter(m=>m.tipo==='ENTRADA').reduce((s,m)=>s+m.valor,0),sa=mm.filter(m=>m.tipo==='SAIDA'&&m.categoria!=='TAXA').reduce((s,m)=>s+m.valor,0),fee=mm.filter(m=>m.categoria==='TAXA').reduce((s,m)=>s+m.valor,0);return `<div class="fin-summary fin-general-summary">${[['SALDO DAS CONTAS',cash(d.contas.reduce((s,c)=>s+balance(d,c.id),0))],['ENTRADAS DO PERÍODO',cash(en)],['SAÍDAS DO PERÍODO',cash(sa)],['TAXAS REGISTRADAS',cash(fee)]].map(([t,v])=>`<div><small>${t}</small><strong>${v}</strong></div>`).join('')}</div>`}

function tableMoves(d,arr){return `<div class="fin-scroll"><table class="fin-table"><thead><tr><th>DATA</th><th>DESCRIÇÃO</th><th>TIPO</th><th>CONTA</th><th>VALOR</th></tr></thead><tbody>${arr.map(m=>`<tr data-fin-movement="${esc(m.id)}" title="DUPLO CLIQUE PARA ABRIR A MOVIMENTAÇÃO" style="cursor:pointer"><td>${fmt(m.date)}</td><td>${esc(m.descricao)}</td><td>${m.tipo}</td><td>${esc(d.contas.find(c=>c.id===m.conta)?.nome||m.conta)}</td><td>${cash(m.valor)}</td></tr>`).join('')||'<tr><td colspan="5">Nenhuma movimentação registrada.</td></tr>'}</tbody></table></div>`}
// Abre o registro de origem quando a movimentação possui vínculo identificável.
// Registros antigos sem identificador não são associados por valor ou descrição.
function openMovement(d,id){
 const m=d.movimentos.find(x=>String(x.id)===String(id));if(!m)return;
 const ref=String(m.ref||''),cat=String(m.categoria||'').toUpperCase();
 if((m.origem==='RH'||cat==='ADIANTAMENTO FUNCIONÁRIO'||String(m.id).startsWith('RH-'))&&m.origemId){
   if(window.LL_openRhMovement?.(m))return;
   finAlert('O LANÇAMENTO ORIGINAL DO FUNCIONÁRIO NÃO FOI ENCONTRADO.');return;
 }
 if(cat==='TRANSFERENCIA'&&ref.startsWith('TRANSF-')){
   tab='transferir';transferSearched=true;transferStart=m.date;transferEnd=m.date;page();
   const row=[...document.querySelectorAll('[data-fin-transfer]')].find(x=>x.dataset.finTransfer===ref);
   if(row){row.dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));return}
   finAlert('A TRANSFERÊNCIA ORIGINAL NÃO FOI ENCONTRADA.');return;
 }
 finAlert('ESTA MOVIMENTAÇÃO AINDA NÃO POSSUI VÍNCULO COM O DOCUMENTO ORIGINAL. NÃO É POSSÍVEL ABRI-LO COM SEGURANÇA.');
}
function general(d){return summary(d)+`<div class="fin-grid">${section('SALDOS POR CONTA',`<div class="fin-scroll"><table class="fin-table"><thead><tr><th>CONTA</th><th>TIPO</th><th>SALDO</th></tr></thead><tbody>${d.contas.map(c=>`<tr><td>${esc(c.nome)}</td><td>${esc(c.tipo||'BANCO')}</td><td>${cash(balance(d,c.id))}</td></tr>`).join('')}</tbody></table></div>`)}${section('MOVIMENTAÇÕES DO PERÍODO',generalFilters(d)+(generalSearched?tableMoves(d,movements(d).filter(m=>!generalBank||String(m.conta)===String(generalBank)).slice(0,30)):'<div class="fin-extract-prompt">SELECIONE AS DATAS E CLIQUE EM PESQUISAR PARA EXIBIR AS MOVIMENTAÇÕES.</div>'))}</div>`}
function generalFilters(d){const c=d.contas.find(x=>String(x.id)===String(generalBank));return `<div class="fin-filters fin-general-filters"><label>DE<input type="date" id="fin-from" value="${from}"></label><label>ATÉ<input type="date" id="fin-to" value="${to}"></label><label class="fin-general-account-label">CONTA<span class="fin-general-account-picker"><input type="text" id="fin-general-account" readonly value="${esc(c?.nome||'TODAS')}" title="SELECIONAR CONTA PELO BOTÃO +"><button type="button" id="fin-general-pick-account" title="SELECIONAR CONTA">+</button></span></label><button type="button" id="fin-filter">PESQUISAR</button></div>`}
function showGeneralAccountPicker(d){
 document.getElementById('fin-general-picker-modal')?.remove();
 const overlay=document.createElement('div');overlay.id='fin-general-picker-modal';overlay.className='fin-account-modal-overlay fin-general-modal-overlay';
 overlay.innerHTML=`<div class="fin-account-modal fin-general-modal" role="dialog" aria-modal="true" aria-label="SELECIONE A CONTA"><div class="fin-account-modal-header"><strong>SELECIONE A CONTA</strong><button type="button" data-close aria-label="FECHAR">×</button></div><div class="fin-account-modal-body"><div class="fin-general-modal-search"><label>PESQUISAR POR<select id="fin-general-search-type"><option value="nome">NOME</option><option value="codigo">CÓDIGO</option></select></label><label>TEXTO DA PESQUISA<input type="search" id="fin-general-picker-search" placeholder="DIGITE PARA PESQUISAR..."></label><button type="button" id="fin-general-search-button">PESQUISAR</button></div><div class="fin-general-results"><table><thead><tr><th>CÓDIGO</th><th>NOME DA CONTA</th><th>TIPO</th><th>SITUAÇÃO</th></tr></thead><tbody id="fin-general-results-body"></tbody></table></div><div class="fin-general-modal-footer"><span>DÊ DOIS CLIQUES PARA SELECIONAR.</span><button type="button" data-close>CANCELAR</button></div></div></div>`;
 document.body.appendChild(overlay);
 const close=()=>overlay.remove();overlay.querySelectorAll('[data-close]').forEach(b=>b.onclick=close);overlay.onclick=e=>{if(e.target===overlay)close()};
 const select=id=>{generalBank=String(id);const c=d.contas.find(x=>String(x.id)===String(generalBank));const field=$('fin-general-account');if(field)field.value=c?.nome||'TODAS';close()};
 const render=()=>{const q=overlay.querySelector('#fin-general-picker-search').value.trim().toLocaleUpperCase('pt-BR'),by=overlay.querySelector('#fin-general-search-type').value;
 const contas=d.contas.filter(c=>c.ativo!==false||String(c.id)===String(generalBank)).filter(c=>!q||(by==='codigo'?String(c.id).toLocaleUpperCase('pt-BR'):String(c.nome||'').toLocaleUpperCase('pt-BR')).includes(q));
 const body=overlay.querySelector('#fin-general-results-body');body.innerHTML=`<tr data-account=""><td>—</td><td>TODAS</td><td>TODOS</td><td>—</td></tr>${contas.map(c=>`<tr data-account="${esc(c.id)}"><td>${esc(c.id)}</td><td>${esc(c.nome)}</td><td>${esc(c.tipo||'BANCO')}</td><td>${c.ativo===false?'INATIVA':'ATIVA'}</td></tr>`).join('')}`;
 body.querySelectorAll('tr[data-account]').forEach(tr=>tr.ondblclick=()=>select(tr.dataset.account));};
 overlay.querySelector('#fin-general-search-button').onclick=render;
 overlay.querySelector('#fin-general-picker-search').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();render()}};
 overlay.querySelector('#fin-general-picker-search').focus();render();
}
function filters(){return `<div class="fin-filters"><label>DE<input type="date" id="fin-from" value="${from}"></label><label>ATÉ<input type="date" id="fin-to" value="${to}"></label><button id="fin-filter">PESQUISAR</button></div>`}
function accounts(d){return section('CADASTRO DE CONTAS',`<div class="fin-form"><label>CÓDIGO<input id="fin-code" readonly value="${newid(d.contas)}"></label><label>NOME DA CONTA<input id="fin-name" placeholder="EX.: NUBANK"></label><label>TIPO<select id="fin-type"><option value="BANCO">CONTA BANCÁRIA</option><option value="CAIXA">CAIXA</option><option value="TESOURARIA">TESOURARIA</option></select></label><label>BANCO<input id="fin-bank"></label><label>AGÊNCIA<input id="fin-agency"></label><label>Nº DA CONTA<input id="fin-account"></label><label>SITUAÇÃO<select id="fin-active"><option value="true">ATIVA</option><option value="false">INATIVA</option></select></label><label>USUÁRIO<input id="fin-user" readonly value="${esc(user())}"></label><label>OBSERVAÇÕES<input id="fin-notes"></label></div><div class="fin-actions"><button id="fin-new-bank" type="button">NOVO</button><button id="fin-save-bank">GRAVAR</button><button id="fin-edit-bank" type="button">ALTERAR</button></div>`)+section('CONTAS CADASTRADAS',`<div class="fin-account-search-row"><label>PESQUISAR CONTA<input id="fin-search-account" placeholder="CÓDIGO OU NOME" value="${esc(accountQuery)}"></label><button type="button" id="fin-search-account-button">PESQUISAR</button></div>${accountSearched?`<div class="fin-scroll"><table class="fin-table"><thead><tr><th>CÓDIGO</th><th>CONTA</th><th>TIPO</th><th>BANCO</th><th>SALDO</th><th>SITUAÇÃO</th><th>USUÁRIO</th></tr></thead><tbody>${d.contas.filter(c=>!accountQuery||String(c.id).includes(accountQuery.trim())||[c.nome,c.tipo,c.banco].some(v=>String(v||'').toLocaleUpperCase('pt-BR').includes(accountQuery.trim().toLocaleUpperCase('pt-BR')))).map(c=>`<tr data-fin-account="${c.id}" title="Duplo clique para alterar"><td>${c.id}</td><td>${esc(c.nome)}</td><td>${esc(c.tipo||'BANCO')}</td><td>${esc(c.banco||'—')}</td><td>${cash(balance(d,c.id))}</td><td>${c.ativo!==false?'ATIVA':'INATIVA'}</td><td>${esc(c.usuario||'—')}</td></tr>`).join('')||'<tr><td colspan="7">NENHUMA CONTA ENCONTRADA.</td></tr>'}</tbody></table></div>`:'<div class="fin-extract-prompt">INFORME OS FILTROS E CLIQUE EM PESQUISAR PARA EXIBIR AS CONTAS.</div>'}`)}

function extract(d){
 const relevant=d.movimentos.filter(m=>!bank||m.conta===Number(bank));
 const arr=movements(d).filter(m=>(!bank||m.conta===Number(bank))&&(!moveType||(moveType==='TRANSFERENCIA'?m.categoria==='TRANSFERENCIA':m.tipo===moveType)));
 const opening=relevant.filter(m=>from&&m.date<from).reduce((s,m)=>s+(m.tipo==='ENTRADA'?1:-1)*m.valor,0);
 const allPeriod=relevant.filter(period),ins=allPeriod.filter(m=>m.tipo==='ENTRADA').reduce((s,m)=>s+m.valor,0),outs=allPeriod.filter(m=>m.tipo==='SAIDA').reduce((s,m)=>s+m.valor,0);
 const values=extractSearched?[cash(opening),cash(ins),cash(outs),cash(opening+ins-outs)]:['—','—','—','—'];
 return section('FILTROS DO EXTRATO',`<div class="fin-extract-filters"><label>CONTA <span class="fin-account-picker"><input id="fin-bank-filter" type="text" readonly value="${esc(d.contas.find(c=>String(c.id)===String(bank))?.nome||'TODAS AS CONTAS')}"><button type="button" id="fin-pick-account" title="SELECIONAR CONTA">+</button></span></label><label>DATA INICIAL<input type="date" id="fin-from" value="${from}"></label><label>DATA FINAL<input type="date" id="fin-to" value="${to}"></label><label>TIPO<select id="fin-move-type"><option value="">TODOS</option><option value="ENTRADA">ENTRADAS</option><option value="SAIDA">SAÍDAS</option><option value="TRANSFERENCIA">TRANSFERÊNCIAS</option></select></label></div><div class="fin-extract-buttons"><button id="fin-filter">PESQUISAR</button><button type="button" id="fin-print">IMPRIMIR</button></div><div class="fin-summary fin-extract-summary">${['SALDO ANTERIOR','ENTRADAS','SAÍDAS','SALDO FINAL'].map((t,i)=>`<div class="fin-extract-metric fin-extract-metric-${i}"><small>${t}</small><strong>${values[i]}</strong></div>`).join('')}</div>`)+section('MOVIMENTAÇÕES DO PERÍODO',`<div id="fin-extract">${extractSearched?tableMoves(d,arr):'<div class="fin-extract-prompt">SELECIONE OS FILTROS E CLIQUE EM PESQUISAR PARA EXIBIR O EXTRATO.</div>'}</div>`)
}
function showExtractAccountPicker(d){
 document.getElementById('fin-account-picker-modal')?.remove();
 if(!document.getElementById('fin-extract-picker-style')){
  const style=document.createElement('style');style.id='fin-extract-picker-style';
  style.textContent=`
  #fin-account-picker-modal{position:fixed;inset:0;z-index:99999;background:rgba(5,25,60,.66);display:flex;align-items:center;justify-content:center;padding:16px}
  #fin-account-picker-modal .fin-extract-dialog{width:min(960px,96vw);max-height:90vh;overflow:hidden;background:white;border-radius:11px;box-shadow:0 15px 45px #001a3b55;color:#153c70}
  #fin-account-picker-modal .fin-extract-head{background:#24598d;color:white;padding:20px;display:flex;align-items:center;justify-content:space-between;font-weight:800}
  #fin-account-picker-modal .fin-extract-head button{background:transparent;color:white;border:1px solid #a9c4e2;border-radius:5px;font-size:24px;width:36px;height:36px;cursor:pointer}
  #fin-account-picker-modal .fin-extract-content{padding:20px}
  #fin-account-picker-modal .fin-extract-search{display:grid;grid-template-columns:110px minmax(0,1fr) 90px;align-items:end;gap:7px;margin-bottom:12px}
  #fin-account-picker-modal .fin-extract-search label{display:flex;flex-direction:column;gap:5px;font-size:11px;font-weight:700}
  #fin-account-picker-modal .fin-extract-search input,#fin-account-picker-modal .fin-extract-search select{height:45px;width:100%;box-sizing:border-box;border:1px solid #b7cdf0;border-radius:5px;padding:9px;color:#173b70;background:white}
  #fin-account-picker-modal #fin-extract-find{height:45px;border:0;border-radius:5px;background:#20599b;color:white;font-weight:700;cursor:pointer}
  #fin-account-picker-modal .fin-extract-list{max-height:40vh;overflow:auto}
  #fin-account-picker-modal table{border-collapse:collapse;width:100%;font-size:13px}
  #fin-account-picker-modal th{background:#1c4277;color:white;text-align:left;padding:13px}
  #fin-account-picker-modal td{padding:12px;border-bottom:1px solid #cbdaf1}
  #fin-account-picker-modal tr[data-fin-id]{cursor:pointer}
  #fin-account-picker-modal tr[data-fin-id]:hover{background:#e6f0ff}
  #fin-account-picker-modal .fin-extract-footer{display:flex;align-items:center;justify-content:space-between;border-top:1px solid #d6e2f1;margin-top:18px;padding-top:16px;font-size:11px}
  #fin-account-picker-modal .fin-extract-footer button{background:#eaf2ff;color:#20599b;border:1px solid #b7cdf0;border-radius:5px;padding:12px 20px;cursor:pointer}
  @media(max-width:650px){#fin-account-picker-modal .fin-extract-search{grid-template-columns:1fr 1fr}#fin-account-picker-modal .fin-extract-search label:nth-child(2){grid-column:1 / -1;grid-row:2}#fin-account-picker-modal #fin-extract-find{grid-column:2;grid-row:1}}
  `;
  document.head.appendChild(style);
 }
 const overlay=document.createElement('div');overlay.id='fin-account-picker-modal';
 overlay.innerHTML=`<div class="fin-extract-dialog" role="dialog" aria-modal="true" aria-label="SELECIONE A CONTA">
 <div class="fin-extract-head"><strong>SELECIONE A CONTA</strong><button type="button" data-fin-close aria-label="Fechar">×</button></div>
 <div class="fin-extract-content">
 <div class="fin-extract-search"><label>PESQUISAR POR<select id="fin-extract-mode"><option value="nome">NOME</option><option value="codigo">CÓDIGO</option></select></label>
 <label>TEXTO DA PESQUISA<input type="text" id="fin-extract-query" placeholder="DIGITE PARA PESQUISAR..."></label>
 <button type="button" id="fin-extract-find">PESQUISAR</button></div>
 <div class="fin-extract-list"><table><thead><tr><th>CÓDIGO</th><th>NOME DA CONTA</th><th>TIPO</th><th>SITUAÇÃO</th></tr></thead><tbody id="fin-extract-rows"></tbody></table></div>
 <div class="fin-extract-footer"><span>DÊ DOIS CLIQUES PARA SELECIONAR.</span><button type="button" data-fin-close>CANCELAR</button></div>
 </div></div>`;
 document.body.appendChild(overlay);
 const close=()=>{document.removeEventListener('keydown',keyHandler,true);overlay.remove()};
 const keyHandler=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}};
 document.addEventListener('keydown',keyHandler,true);
 overlay.querySelectorAll('[data-fin-close]').forEach(b=>b.onclick=close);
 overlay.onclick=e=>{if(e.target===overlay)close()};
 const input=overlay.querySelector('#fin-extract-query'),mode=overlay.querySelector('#fin-extract-mode'),tbody=overlay.querySelector('#fin-extract-rows');
 function search(){
  const q=input.value.trim().toLocaleLowerCase('pt-BR');
  const accounts=d.contas.filter(c=>(mode.value==='codigo'?String(c.id??c.codigo??''):String(c.nome||'')).toLocaleLowerCase('pt-BR').includes(q));
  tbody.innerHTML=`<tr data-fin-id=""><td>—</td><td>TODAS AS CONTAS</td><td>—</td><td>—</td></tr>`+
   accounts.map(c=>`<tr data-fin-id="${esc(c.id)}"><td>${esc(c.id)}</td><td>${esc(c.nome||'')}</td><td>${esc(c.tipo||'—')}</td><td>${c.ativo===false?'INATIVA':'ATIVA'}</td></tr>`).join('');
  tbody.querySelectorAll('tr[data-fin-id]').forEach(row=>{
   const select=()=>{bank=row.dataset.finId;const c=d.contas.find(x=>String(x.id)===String(bank));const field=$('fin-bank-filter');if(field)field.value=c?.nome||'TODAS AS CONTAS';close()};
   row.ondblclick=select;
   row.tabIndex=0;
   row.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();select()}};
  });
 }
 overlay.querySelector('#fin-extract-find').onclick=search;
 input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();search()}};
 search();input.focus();
}
function transferRecords(d){return d.transferencias.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))||b.id-a.id)}
function transferStatus(t){return t.situacao||'PENDENTE'}
function transferAuth(action){return new Promise(resolve=>{
 const shade=document.createElement('div');shade.style.cssText='position:fixed;inset:0;z-index:2147483640;background:#061b3ba9;display:flex;align-items:center;justify-content:center;padding:15px';
 shade.innerHTML=`<form role="dialog" aria-modal="true" style="width:min(470px,calc(100vw - 32px));background:white;border-radius:12px;overflow:hidden;color:#173c6d;font:14px Arial,sans-serif;box-shadow:0 18px 45px #0004"><header style="background:#245b98;color:white;padding:21px 20px;font-size:16px;font-weight:800;position:relative">IDENTIFICAÇÃO PARA ${action} TRANSFERÊNCIA<button type="button" data-close aria-label="Fechar" style="position:absolute;right:14px;top:12px;background:transparent;color:white;border:0;font-size:26px;cursor:pointer">×</button></header><div style="padding:25px 20px 5px;display:flex;flex-direction:column;gap:14px"><label style="font-weight:800">USUÁRIO (CÓDIGO)<input name="codigo" autocomplete="off" placeholder="INFORME O CÓDIGO DO OPERADOR" style="display:block;width:100%;box-sizing:border-box;margin-top:7px;padding:12px;border:1px solid #b7cff4;border-radius:5px;font:inherit"></label><div style="padding:12px 14px;background:#e7f0fc;border:1px solid #c3d6f4;border-radius:5px"><strong data-name>INFORME O CÓDIGO DO USUÁRIO</strong><div data-role style="font-size:12px;margin-top:5px;color:#5c769c">O NOME APARECERÁ AUTOMATICAMENTE</div></div><label style="font-weight:800">SENHA<input name="senha" type="password" autocomplete="off" placeholder="DIGITE SUA SENHA" style="display:block;width:100%;box-sizing:border-box;margin-top:7px;padding:12px;border:1px solid #b7cff4;border-radius:5px;font:inherit"></label><div data-error role="alert" style="min-height:20px;color:#bd243b;font-size:12px"></div><p style="font-size:11px;color:#58749a;line-height:1.5;margin:0 0 10px">VALIDAÇÃO LOCAL DOS USUÁRIOS CADASTRADOS. NÃO SUBSTITUI AUTENTICAÇÃO SEGURA EM SERVIDOR.</p></div><footer style="display:flex;justify-content:center;gap:10px;padding:14px 20px 20px"><button type="submit" style="background:#195ba9;color:white;border:0;border-radius:6px;padding:13px 22px;font-weight:800;cursor:pointer">CONTINUAR</button><button type="button" data-close style="background:#e6f0ff;color:#164e8d;border:1px solid #b5cff2;border-radius:6px;padding:13px 22px;font-weight:800;cursor:pointer">CANCELAR</button></footer></form>`;
 document.body.append(shade);const form=shade.querySelector('form'),code=form.elements.codigo,pass=form.elements.senha,person=shade.querySelector('[data-name]'),role=shade.querySelector('[data-role]'),error=shade.querySelector('[data-error]');
 function users(){try{const data=JSON.parse(localStorage.getItem('erp_matriz_usuarios_v1')||'{}');return Array.isArray(data)?data:(data.usuarios||[])}catch{return []}}
 function selected(){const id=code.value.trim();if(!id)return null;const u=users().find(x=>String(Number(x.id))===String(Number(id))&&String(x.situacao||'ATIVO').toUpperCase()==='ATIVO');return u||((id==='300')?{id:'300',nome:'USUÁRIO DE DEMONSTRAÇÃO',perfil:'ACESSO PARA TESTES',demo:true}:null)}
 function update(){const u=selected();person.textContent=u?(u.nome||u.login||'USUÁRIO'):(code.value.trim()?'USUÁRIO NÃO ENCONTRADO':'INFORME O CÓDIGO DO USUÁRIO');role.textContent=u?(u.perfil||'USUÁRIO'):(code.value.trim()?'CONFIRA O CÓDIGO INFORMADO':'O NOME APARECERÁ AUTOMATICAMENTE');error.textContent='';pass.value=''}
 function finish(v){shade.remove();resolve(v)}shade.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>finish(null));code.oninput=update;code.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();if(selected())pass.focus();else error.textContent='USUÁRIO NÃO ENCONTRADO OU INATIVO.'}};
 form.onsubmit=async e=>{e.preventDefault();const u=selected();if(!u){error.textContent='USUÁRIO NÃO ENCONTRADO OU INATIVO.';code.focus();return}if(!pass.value){error.textContent='INFORME A SENHA.';pass.focus();return}let valid=false;try{if(u.demo)valid=pass.value==='123456';else if(u.senhaHash&&typeof window.LL_SHA256==='function')valid=(await window.LL_SHA256(u.senhaSalt+':'+pass.value))===u.senhaHash;else if(typeof window.verifyCashPassword==='function')valid=await window.verifyCashPassword(pass.value,u)}catch{}if(!valid){error.textContent='USUÁRIO OU SENHA INVÁLIDOS.';pass.value='';pass.focus();return}finish(u.nome||u.login||'USUÁRIO')};code.focus();
})}
function transferAccountField(d,id,label,value){const account=d.contas.find(c=>String(c.id)===String(value));return `<label>${label}<span class="fin-transfer-picker"><input id="${id}" type="hidden" value="${esc(value)}"><input class="fin-transfer-display" type="text" readonly value="${esc(account?.nome||'SELECIONE')}"><button type="button" class="fin-transfer-pick" data-fin-pick-transfer="${id}" title="LOCALIZAR CONTA">+</button></span></label>`}
function showTransferAccountPicker(d,id){
 document.getElementById('fin-transfer-picker-modal')?.remove();
 if(!document.getElementById('fin-transfer-picker-v711-style')){
  const style=document.createElement('style');style.id='fin-transfer-picker-v711-style';
  style.textContent=`
  #fin-transfer-picker-modal{position:fixed;inset:0;z-index:99999;background:rgba(5,25,60,.66);display:flex;align-items:center;justify-content:center;padding:16px}
  #fin-transfer-picker-modal .fin-v711-dialog{width:min(960px,96vw);max-height:90vh;overflow:hidden;background:white;border-radius:11px;box-shadow:0 15px 45px #001a3b55;color:#153c70}
  #fin-transfer-picker-modal .fin-v711-head{background:#24598d;color:white;padding:20px;display:flex;align-items:center;justify-content:space-between;font-weight:800}
  #fin-transfer-picker-modal .fin-v711-head button{background:transparent;color:white;border:1px solid #a9c4e2;border-radius:5px;font-size:24px;width:36px;height:36px;cursor:pointer}
  #fin-transfer-picker-modal .fin-v711-content{padding:20px}
  #fin-transfer-picker-modal .fin-v711-search{display:grid;grid-template-columns:110px minmax(0,1fr) 90px;align-items:end;gap:7px;margin-bottom:12px}
  #fin-transfer-picker-modal .fin-v711-search label{display:flex;flex-direction:column;gap:5px;font-size:11px;font-weight:700}
  #fin-transfer-picker-modal .fin-v711-search input,#fin-transfer-picker-modal .fin-v711-search select{height:45px;width:100%;box-sizing:border-box;border:1px solid #b7cdf0;border-radius:5px;padding:9px;color:#173b70;background:white}
  #fin-transfer-picker-modal #fin-transfer-find{height:45px;border:0;border-radius:5px;background:#20599b;color:white;font-weight:700;cursor:pointer}
  #fin-transfer-picker-modal .fin-v711-list{max-height:40vh;overflow:auto}
  #fin-transfer-picker-modal table{border-collapse:collapse;width:100%;font-size:13px}
  #fin-transfer-picker-modal th{background:#1c4277;color:white;text-align:left;padding:13px}
  #fin-transfer-picker-modal td{padding:12px;border-bottom:1px solid #cbdaf1}
  #fin-transfer-picker-modal tr[data-fin-select]{cursor:pointer}
  #fin-transfer-picker-modal tr[data-fin-select]:hover,#fin-transfer-picker-modal tr[data-fin-select]:focus{background:#e6f0ff}
  #fin-transfer-picker-modal .fin-v711-footer{display:flex;align-items:center;justify-content:space-between;border-top:1px solid #d6e2f1;margin-top:18px;padding-top:16px;font-size:11px}
  #fin-transfer-picker-modal .fin-v711-footer button{background:#eaf2ff;color:#20599b;border:1px solid #b7cdf0;border-radius:5px;padding:12px 20px;cursor:pointer}
  @media(max-width:650px){#fin-transfer-picker-modal .fin-v711-search{grid-template-columns:1fr 1fr}#fin-transfer-picker-modal .fin-v711-search label:nth-child(2){grid-column:1 / -1;grid-row:2}#fin-transfer-picker-modal #fin-transfer-find{grid-column:2;grid-row:1}}
  `;
  document.head.appendChild(style);
 }
 const origin=id==='fin-origin';
 const overlay=document.createElement('div');overlay.id='fin-transfer-picker-modal';
 overlay.innerHTML=`<div class="fin-v711-dialog" role="dialog" aria-modal="true" aria-label="SELECIONE A CONTA DE ${origin?'ORIGEM':'DESTINO'}">
 <div class="fin-v711-head"><strong>SELECIONE A CONTA DE ${origin?'ORIGEM':'DESTINO'}</strong><button type="button" data-fin-close aria-label="Fechar">×</button></div>
 <div class="fin-v711-content">
 <div class="fin-v711-search"><label>PESQUISAR POR<select id="fin-transfer-mode"><option value="nome">NOME</option><option value="codigo">CÓDIGO</option></select></label>
 <label>TEXTO DA PESQUISA<input type="text" id="fin-transfer-query" placeholder="DIGITE PARA PESQUISAR..."></label>
 <button type="button" id="fin-transfer-find">PESQUISAR</button></div>
 <div class="fin-v711-list"><table><thead><tr><th>CÓDIGO</th><th>NOME DA CONTA</th><th>TIPO</th><th>SITUAÇÃO</th></tr></thead><tbody id="fin-transfer-rows"></tbody></table></div>
 <div class="fin-v711-footer"><span>DÊ DOIS CLIQUES PARA SELECIONAR.</span><button type="button" data-fin-close>CANCELAR</button></div>
 </div></div>`;
 document.body.appendChild(overlay);
 const close=()=>{document.removeEventListener('keydown',keyHandler,true);overlay.remove()};
 const keyHandler=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}};
 document.addEventListener('keydown',keyHandler,true);
 overlay.querySelectorAll('[data-fin-close]').forEach(b=>b.onclick=close);
 overlay.onclick=e=>{if(e.target===overlay)close()};
 const input=overlay.querySelector('#fin-transfer-query'),mode=overlay.querySelector('#fin-transfer-mode'),tbody=overlay.querySelector('#fin-transfer-rows');
 function search(){
  const q=input.value.trim().toLocaleLowerCase('pt-BR');
  const accounts=d.contas.filter(c=>(c.ativo!==false||String(c.id)===String($(id)?.value))&&(mode.value==='codigo'?String(c.id??c.codigo??''):String(c.nome||'')).toLocaleLowerCase('pt-BR').includes(q));
  tbody.innerHTML=accounts.map(c=>`<tr data-fin-select="${esc(c.id)}" tabindex="0" title="Duplo clique para selecionar"><td>${esc(c.id)}</td><td>${esc(c.nome||'')}</td><td>${esc(c.tipo||'—')}</td><td>${c.ativo===false?'INATIVA':'ATIVA'}</td></tr>`).join('')||'<tr><td colspan="4">NENHUMA CONTA ENCONTRADA.</td></tr>';
  tbody.querySelectorAll('tr[data-fin-select]').forEach(row=>{
   const select=()=>{
    const c=d.contas.find(c=>String(c.id)===row.dataset.finSelect);if(!c)return;
    $(id).value=String(c.id);$(id).parentElement.querySelector('.fin-transfer-display').value=c.nome;
    if(origin)transferOrigin=String(c.id);else transferTarget=String(c.id);
    close();
   };
   row.ondblclick=select;
   row.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();select()}};
  });
 }
 overlay.querySelector('#fin-transfer-find').onclick=search;
 input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();search()}};
 search();input.focus();
}
function transfers(d){const rows=transferSearched?transferRecords(d).filter(m=>(!transferStart||m.date>=transferStart)&&(!transferEnd||m.date<=transferEnd)):[];return section('NOVA TRANSFERÊNCIA',`<div class="fin-form">${transferAccountField(d,'fin-origin','CONTA DE ORIGEM',transferOrigin)}${transferAccountField(d,'fin-target','CONTA DE DESTINO',transferTarget)}<label>DATA<input type="date" id="fin-date" value="${today()}"></label><label>VALOR<input type="number" id="fin-value" min="0.01" step="0.01"></label><label>MOTIVO<input id="fin-desc"></label><label>USUÁRIO<input id="fin-transfer-user" readonly value="${esc(user())}"></label></div><div class="fin-actions fin-transfer-actions"><button id="fin-new-transfer">NOVO</button><button id="fin-transfer">GRAVAR</button><button id="fin-edit-transfer">ALTERAR</button><button id="fin-pay-transfer">BAIXAR</button><button id="fin-cancel-transfer">CANCELAR</button><button type="button" id="fin-print-transfer">IMPRIMIR</button><button id="fin-delete-transfer">EXCLUIR</button></div>`)+section('HISTÓRICO DE TRANSFERÊNCIAS',`<div class="fin-transfer-search-area"><label class="fin-history-search">DATA INICIAL<input type="date" id="fin-transfer-start" value="${esc(transferStart)}"></label><label class="fin-history-search">DATA FINAL<input type="date" id="fin-transfer-end" value="${esc(transferEnd)}"></label><button type="button" id="fin-search-transfer">PESQUISAR</button></div><div class="fin-transfer-results">${transferSearched?`<div class="fin-scroll"><table class="fin-table"><thead><tr><th>CÓDIGO</th><th>DATA</th><th>ORIGEM / DESTINO</th><th>VALOR</th><th>USUÁRIO</th><th>SITUAÇÃO</th></tr></thead><tbody>${rows.map(m=>`<tr data-fin-transfer="${m.id}" title="Duplo clique para selecionar"><td>${m.id}</td><td>${fmt(m.date)}</td><td>${esc((d.contas.find(c=>c.id===m.a)?.nome||m.a)+' / '+(d.contas.find(c=>c.id===m.b)?.nome||m.b))}</td><td>${cash(m.v)}</td><td>${esc(m.usuario||'—')}</td><td>${esc(transferStatus(m))}</td></tr>`).join('')||'<tr><td colspan="6">Nenhuma transferência encontrada.</td></tr>'}</tbody></table></div><small>Duplo clique para selecionar a transferência.</small>`:'<div class="fin-extract-prompt">INFORME OS FILTROS E CLIQUE EM PESQUISAR PARA EXIBIR AS TRANSFERÊNCIAS.</div>'}</div>`)}

function reconcile(d){return section('IMPORTAR EXTRATO BANCÁRIO',`<div class="fin-form"><label>CONTA ${selectBank(d,'fin-import-bank')}</label><label>ARQUIVO OFX OU CSV<input id="fin-file" type="file" accept=".csv,.ofx"></label><button id="fin-import">IMPORTAR EXTRATO</button></div>`)+section('MOVIMENTAÇÕES IMPORTADAS — CONFERÊNCIA MANUAL',`<div class="fin-scroll"><table class="fin-table"><thead><tr><th>DATA</th><th>DESCRIÇÃO</th><th>VALOR</th><th>SITUAÇÃO</th><th>AÇÕES</th></tr></thead><tbody>${d.extrato.map(e=>`<tr><td>${fmt(e.date)}</td><td>${esc(e.descricao)}</td><td>${cash(e.valor)}</td><td>${esc(e.status||'NÃO CONCILIADO')}</td><td>${e.status==='CONCILIADO'?'—':`<button data-match="${e.id}">CONCILIAR</button> <button data-create="${e.id}">CRIAR LANÇAMENTO</button>`}</td></tr>`).join('')}</tbody></table></div>`)+section('HISTÓRICO DE IMPORTAÇÕES',`<div class="fin-scroll"><table class="fin-table"><thead><tr><th>DATA</th><th>ARQUIVO</th><th>CONTA</th><th>REGISTROS</th><th>USUÁRIO</th></tr></thead><tbody>${d.importacoes.map(i=>`<tr><td>${fmt(i.date)}</td><td>${esc(i.nome)}</td><td>${esc(d.contas.find(c=>c.id===i.conta)?.nome)}</td><td>${i.quantidade}</td><td>${esc(i.usuario)}</td></tr>`).join('')}</tbody></table></div>`)}
function printTransfer(d){
 const t=d.transferencias.find(x=>x.id===editingTransfer);
 if(!t)return finAlert('SELECIONE UMA TRANSFERÊNCIA NO HISTÓRICO COM DUPLO CLIQUE.');
 document.getElementById('fin-transfer-print-overlay')?.remove();
 const source=d.contas.find(c=>c.id===t.a),dest=d.contas.find(c=>c.id===t.b);
 const issued=new Date().toLocaleString('pt-BR');
 const info=[['Nº DA TRANSFERÊNCIA',t.id],['DATA',fmt(t.date)],['CONTA DE ORIGEM',source?.nome||t.a],['CONTA DE DESTINO',dest?.nome||t.b],['VALOR',cash(t.v)],['MOTIVO',t.desc],['SITUAÇÃO',transferStatus(t)],['USUÁRIO DO LANÇAMENTO',t.usuario||'—'],['BAIXADO POR',t.baixadoPor||'—'],['CANCELADO POR',t.canceladoPor||'—']];
 const overlay=document.createElement('div');overlay.id='fin-transfer-print-overlay';overlay.style.cssText='position:fixed;inset:0;z-index:2147483000;background:rgba(5,25,60,.7);display:flex;align-items:center;justify-content:center;padding:15px;box-sizing:border-box;font:14px Arial,sans-serif;color:#123d76';
 overlay.innerHTML=`<div style="width:min(1250px,96vw);height:min(610px,88vh);background:#fff;border-radius:10px;display:flex;flex-direction:column;overflow:hidden"><header style="background:#20548d;color:#fff;padding:20px 22px;font-size:19px;font-weight:800;display:flex;justify-content:space-between">IMPRIMIR TRANSFERÊNCIA <button data-close style="background:transparent;color:white;border:0;font-size:25px;cursor:pointer">×</button></header><div style="display:grid;grid-template-columns:40% minmax(0,60%);gap:14px;padding:15px;flex:1;min-height:0;box-sizing:border-box"><div style="overflow:auto"><section style="border:1px solid #c2d7f5;border-radius:5px;padding:12px"><h3 style="background:#e0ebfa;padding:12px;margin:0 0 10px;font-size:15px">DADOS DA TRANSFERÊNCIA SELECIONADA</h3>${info.map(([k,v])=>`<p><b>${esc(k)}:</b> ${esc(v)}</p>`).join('')}</section><section style="border:1px solid #c2d7f5;border-radius:5px;padding:12px;margin-top:12px"><h3 style="background:#e0ebfa;padding:12px;margin:0 0 10px;font-size:15px">TIPO DE IMPRESSÃO</h3><label><input type="radio" name="fin-t-type" value="complete" checked> COMPLETA (Dados e Assinatura)</label><p><label><input type="radio" name="fin-t-type" value="simple"> SIMPLIFICADA (Dados)</label></p></section><section style="border:1px solid #c2d7f5;border-radius:5px;padding:12px;margin-top:12px"><h3 style="background:#e0ebfa;padding:12px;margin:0 0 10px;font-size:15px">ORIENTAÇÃO DA PÁGINA</h3><label><input type="radio" name="fin-t-orient" value="portrait" checked> RETRATO — A4 VERTICAL</label><p><label><input type="radio" name="fin-t-orient" value="landscape"> PAISAGEM — A4 HORIZONTAL</label></p></section></div><div style="border:1px solid #c2d7f5;border-radius:5px;background:#eef5fd;padding:12px;display:flex;flex-direction:column;min-height:0;min-width:0"><h3 style="background:#e0ebfa;text-align:center;padding:11px;margin:0 0 10px;font-size:15px">PRÉ-VISUALIZAÇÃO A4</h3><iframe data-preview title="PRÉ-VISUALIZAÇÃO A4" style="width:100%;flex:1;min-height:0;background:white;border:1px solid #c2d7f5"></iframe></div></div><footer style="display:flex;justify-content:flex-end;gap:10px;border-top:1px solid #d6e2f2;padding:12px 20px"><button data-print style="background:#1765df;color:#fff;border:0;border-radius:5px;padding:12px 24px;font-weight:bold;cursor:pointer">IMPRIMIR</button><button data-save style="background:#009d74;color:#fff;border:0;border-radius:5px;padding:12px 24px;font-weight:bold;cursor:pointer">SALVAR</button><button data-close style="background:#e4efff;color:#10417b;border:0;border-radius:5px;padding:12px 24px;font-weight:bold;cursor:pointer">FECHAR</button></footer></div>`;
 document.body.appendChild(overlay);
 const frame=overlay.querySelector('[data-preview]');let html='';
 function render(){const orient=overlay.querySelector('input[name="fin-t-orient"]:checked').value;const complete=overlay.querySelector('input[name="fin-t-type"]:checked').value==='complete';html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Transferência ${esc(t.id)}</title><style>@page{size:A4 ${orient};margin:12mm}*{box-sizing:border-box}body{margin:0;background:#fff;color:#123d76;font:12px Arial,sans-serif}.paper{padding:25px;max-width:${orient==='portrait'?'210mm':'297mm'};margin:auto}header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #1d4e86;padding-bottom:20px;margin-bottom:25px}h1{font-size:22px;margin:0}h2{font-size:18px;text-align:center}.muted{font-size:10px}h3{background:#e0ebfa;padding:12px;font-size:14px}.fields{display:grid;grid-template-columns:1fr 1fr;gap:14px 22px}.field{border-bottom:1px solid #d3e0ef;padding:8px 0;overflow-wrap:anywhere}.field b{display:block;font-size:10px;margin-bottom:6px}.amount{margin-top:24px;padding:14px;background:#e0ebfa;display:flex;justify-content:space-between;font-size:18px;font-weight:bold}.sign{text-align:center;margin:65px auto 30px;width:55%;border-top:1px solid #123d76;padding-top:8px}.foot{text-align:right;margin-top:40px;font-size:10px}@media print{.paper{max-width:none;padding:0}}</style></head><body><main class="paper"><header><div><h1>LUCAS LIMA</h1><div class="muted">SISTEMA DE GESTÃO EMPRESARIAL</div></div><h2>COMPROVANTE DE TRANSFERÊNCIA</h2></header><h3>DADOS DA TRANSFERÊNCIA</h3><div class="fields">${info.map(([k,v])=>`<div class="field"><b>${esc(k)}</b>${esc(v)}</div>`).join('')}</div><div class="amount"><span>VALOR DA TRANSFERÊNCIA</span><span>${cash(t.v)}</span></div>${complete?'<div class="sign">ASSINATURA DO RESPONSÁVEL</div>':''}<div class="foot">EMITIDO EM ${esc(issued)}, POR ${esc(user())}.</div></main></body></html>`;frame.srcdoc=html;}
 overlay.querySelectorAll('input').forEach(x=>x.onchange=render);overlay.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>overlay.remove());
 overlay.querySelector('[data-print]').onclick=()=>{const w=frame.contentWindow;if(w){w.focus();w.print()}};
 overlay.querySelector('[data-save]').onclick=async()=>{const filename='TRANSFERENCIA-'+t.id+'.html';try{if(window.showSaveFilePicker){const handle=await window.showSaveFilePicker({suggestedName:filename,types:[{description:'Documento HTML',accept:{'text/html':['.html']}}]});const writable=await handle.createWritable();await writable.write(html);await writable.close();return}}catch(e){if(e.name==='AbortError')return}const blob=new Blob([html],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)};
 render();
}
function reports(d){return section('RELATÓRIO DE MOVIMENTAÇÕES',filters()+tableMoves(d,movements(d))+`<button id="fin-csv">EXPORTAR CSV</button><button type="button" id="fin-print">IMPRIMIR</button>`)}
// Garante que os atalhos sejam exibidos somente no cabeçalho de CONTAS BANCÁRIAS.
function removeDuplicatedFinancialShortcuts(){
 const area=document.querySelector('.fin-page');
 if(!area)return;
 area.querySelectorAll('button').forEach(button=>{
  if(!/^(?:⌂\s*)?ATALHOS$/i.test(button.textContent.trim()))return;
  if(tab==='contas' && button.id==='fin-shortcuts' && button.closest('.fin-new-header'))return;
  button.remove();
 });
}
const financialShortcutObserver=new MutationObserver(()=>removeDuplicatedFinancialShortcuts());
function watchFinancialShortcuts(){
 const area=document.querySelector('.fin-page');
 financialShortcutObserver.disconnect();
 if(area){removeDuplicatedFinancialShortcuts();financialShortcutObserver.observe(area,{childList:true,subtree:true});}
}
function page(){screen='FINANCEIRO';active('FINANCEIRO');const d=load();ensureDefaults(d);conciliarLivroCaixa(d);root().innerHTML=`<div class="fin-page">${header()}${tab==='menu'?'<div class="fin-menu-bottom"><button type="button" id="fin-back-home">← VOLTAR</button></div>':({geral:general,contas:accounts,extrato:extract,transferir:transfers})[tab](d)+'<div class="fin-menu-bottom fin-inner-bottom"><button type="button" id="fin-menu-back">← VOLTAR</button></div>'}</div>`;watchFinancialShortcuts();
 if($('fin-menu-back'))$('fin-menu-back').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();tab='menu';page()},true);if($('fin-back-home'))$('fin-back-home').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();category('FINANCEIRO')},true);if($('fin-shortcuts'))$('fin-shortcuts').onclick=()=>showBankShortcuts();document.querySelectorAll('[data-fin-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.finTab;if(tab==='extrato')extractSearched=false;if(tab==='geral')generalSearched=false;if(tab==='contas'){accountQuery='';accountSearched=false;}page()});
 document.querySelectorAll('[data-fin-movement]').forEach(r=>r.ondblclick=()=>openMovement(d,r.dataset.finMovement));
 if($('fin-filter'))$('fin-filter').onclick=()=>{const nextFrom=$('fin-from').value,nextTo=$('fin-to').value;if(nextFrom&&nextTo&&nextFrom>nextTo)return finAlert('DATA INICIAL NÃO PODE SER MAIOR QUE DATA FINAL.');from=nextFrom;to=nextTo;if($('fin-move-type'))moveType=$('fin-move-type').value;if(tab==='extrato')extractSearched=true;if(tab==='geral')generalSearched=true;page()};
 if($('fin-general-pick-account'))$('fin-general-pick-account').onclick=()=>showGeneralAccountPicker(d);
 if($('fin-pick-account'))$('fin-pick-account').onclick=()=>showExtractAccountPicker(d);document.querySelectorAll('[data-fin-pick-transfer]').forEach(b=>b.onclick=()=>showTransferAccountPicker(d,b.dataset.finPickTransfer));if($('fin-move-type'))$('fin-move-type').value=moveType;
 if($('fin-edit-bank'))$('fin-edit-bank').onclick=()=>saveAccount(true);if($('fin-new-bank'))$('fin-new-bank').onclick=()=>{editingAccount=null;page()};
 document.querySelectorAll('[data-fin-account]').forEach(r=>r.ondblclick=()=>{const c=d.contas.find(x=>x.id===Number(r.dataset.finAccount));if(!c)return;editingAccount=c.id;$('fin-code').value=c.id;$('fin-name').value=c.nome;$('fin-type').value=c.tipo||'BANCO';$('fin-bank').value=c.banco||'';$('fin-agency').value=c.agencia||'';$('fin-account').value=c.numero||'';$('fin-active').value=String(c.ativo!==false);$('fin-notes').value=c.observacoes||'';$('fin-user').value=c.usuario||'';});
 if($('fin-search-account-button'))$('fin-search-account-button').onclick=()=>{accountQuery=$('fin-search-account').value;accountSearched=true;page()};if($('fin-search-account'))$('fin-search-account').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('fin-search-account-button').click()}};
 function saveAccount(alterar){const nome=$('fin-name').value.trim(),banco=$('fin-bank').value.trim(),tipo=$('fin-type').value;if(!nome||(tipo==='BANCO'&&!banco))return finAlert('INFORME O NOME E, PARA CONTAS BANCÁRIAS, O BANCO.');if(alterar&&!editingAccount)return finAlert('SELECIONE UMA CONTA NA LISTA OU USE F12.');if(!alterar&&editingAccount)return finAlert('CONTA CARREGADA. UTILIZE ALTERAR OU CLIQUE NOVO.');if(d.contas.some(c=>c.nome.toUpperCase()===nome.toUpperCase()&&c.id!==editingAccount))return finAlert('CONTA JÁ CADASTRADA.');const data={nome,banco,agencia:$('fin-agency').value,numero:$('fin-account').value,tipo,ativo:$('fin-active').value==='true',observacoes:$('fin-notes').value};if(alterar){const c=d.contas.find(x=>x.id===editingAccount);if(!c)return;if(Object.keys(data).every(k=>String(c[k]??'')===String(data[k])))return finAlert('NENHUMA ALTERAÇÃO IDENTIFICADA.');Object.assign(c,data,{usuario:user()})}else d.contas.push({id:newid(d.contas),...data,usuario:user()});store(d);editingAccount=null;page()}
 if($('fin-save-bank'))$('fin-save-bank').onclick=()=>saveAccount(false);
 function transferFields(){return {a:Number($('fin-origin').value),b:Number($('fin-target').value),v:Number($('fin-value').value),date:$('fin-date').value,desc:$('fin-desc').value.trim()}}
 function validateTransfer(x,checkBalance=false){if(!x.a||!x.b||x.a===x.b||!(x.v>0)||!x.date||!x.desc){finAlert('PREENCHA AS CONTAS DIFERENTES, DATA, VALOR E MOTIVO.');return false}if(!d.contas.some(c=>c.id===x.a&&c.ativo!==false)||!d.contas.some(c=>c.id===x.b&&c.ativo!==false)){finAlert('SELECIONE CONTAS ATIVAS.');return false}if(checkBalance&&balance(d,x.a)<x.v){finAlert('SALDO INSUFICIENTE NA CONTA DE ORIGEM.');return false}return true}
 function selectedTransfer(){return d.transferencias.find(t=>t.id===editingTransfer)}
 function loadTransfer(id){const t=d.transferencias.find(t=>t.id===Number(id));if(!t)return;editingTransfer=t.id;transferOrigin=String(t.a);transferTarget=String(t.b);$('fin-origin').value=t.a;$('fin-target').value=t.b;$('fin-origin').parentElement.querySelector('.fin-transfer-display').value=d.contas.find(c=>c.id===t.a)?.nome||'SELECIONE';$('fin-target').parentElement.querySelector('.fin-transfer-display').value=d.contas.find(c=>c.id===t.b)?.nome||'SELECIONE';$('fin-date').value=t.date;$('fin-value').value=t.v;$('fin-desc').value=t.desc;$('fin-transfer-user').value=t.usuario||'';document.querySelectorAll('[data-fin-transfer]').forEach(r=>r.classList.toggle('fin-selected',Number(r.dataset.finTransfer)===t.id));window.scrollTo({top:0,behavior:'smooth'})}
 document.querySelectorAll('[data-fin-transfer]').forEach(r=>r.ondblclick=()=>loadTransfer(r.dataset.finTransfer));
 if($('fin-transfer-start'))$('fin-transfer-start').onchange=()=>{transferStart=$('fin-transfer-start').value};if($('fin-transfer-end'))$('fin-transfer-end').onchange=()=>{transferEnd=$('fin-transfer-end').value};
 if($('fin-search-transfer'))$('fin-search-transfer').onclick=()=>{transferStart=$('fin-transfer-start').value;transferEnd=$('fin-transfer-end').value;if(transferStart&&transferEnd&&transferStart>transferEnd)return finAlert('A DATA INICIAL NÃO PODE SER POSTERIOR À DATA FINAL.');transferSearched=true;transferOrigin=$('fin-origin')?.value||'';transferTarget=$('fin-target')?.value||'';page()};
 if($('fin-new-transfer'))$('fin-new-transfer').onclick=()=>{editingTransfer=null;transferOrigin='';transferTarget='';page()};
 if($('fin-transfer'))$('fin-transfer').onclick=()=>{if(editingTransfer)return finAlert('CLIQUE NOVO PARA GRAVAR OUTRA TRANSFERÊNCIA.');const x=transferFields();if(!validateTransfer(x))return;d.transferencias.push({id:newid(d.transferencias),...x,situacao:'PENDENTE',usuario:user(),criadoEm:new Date().toISOString()});store(d);editingTransfer=null;page();finAlert('TRANSFERÊNCIA GRAVADA COMO PENDENTE. NENHUM SALDO FOI MOVIMENTADO.')};
 if($('fin-edit-transfer'))$('fin-edit-transfer').onclick=()=>{const t=selectedTransfer();if(!t)return finAlert('SELECIONE UMA TRANSFERÊNCIA COM DUPLO CLIQUE.');if(transferStatus(t)!=='PENDENTE')return finAlert('SOMENTE TRANSFERÊNCIAS PENDENTES PODEM SER ALTERADAS.');const x=transferFields();if(!validateTransfer(x))return;Object.assign(t,x,{alteradoPor:user(),alteradoEm:new Date().toISOString()});store(d);page();finAlert('TRANSFERÊNCIA ALTERADA.')};
 if($('fin-pay-transfer'))$('fin-pay-transfer').onclick=async()=>{const t=selectedTransfer();if(!t)return finAlert('SELECIONE UMA TRANSFERÊNCIA COM DUPLO CLIQUE.');if(transferStatus(t)!=='PENDENTE')return finAlert('SOMENTE TRANSFERÊNCIAS PENDENTES PODEM SER BAIXADAS.');if(!validateTransfer(t,true))return;const operador=await transferAuth('BAIXAR');if(!operador)return;if(transferStatus(t)!=='PENDENTE')return finAlert('TRANSFERÊNCIA JÁ PROCESSADA.');addMove(d,{date:t.date,conta:t.a,tipo:'SAIDA',valor:t.v,descricao:'TRANSFERÊNCIA PARA '+(d.contas.find(c=>c.id===t.b)?.nome||t.b)+': '+t.desc,ref:'TRANSF-'+t.id,categoria:'TRANSFERENCIA'});addMove(d,{date:t.date,conta:t.b,tipo:'ENTRADA',valor:t.v,descricao:'TRANSFERÊNCIA DE '+(d.contas.find(c=>c.id===t.a)?.nome||t.a)+': '+t.desc,ref:'TRANSF-'+t.id,categoria:'TRANSFERENCIA'});Object.assign(t,{situacao:'BAIXADA',baixadoPor:operador,baixadoEm:new Date().toISOString()});store(d);editingTransfer=null;page();finAlert('TRANSFERÊNCIA BAIXADA COM SUCESSO.')};
 if($('fin-cancel-transfer'))$('fin-cancel-transfer').onclick=async()=>{const t=selectedTransfer();if(!t)return finAlert('SELECIONE UMA TRANSFERÊNCIA COM DUPLO CLIQUE.');if(transferStatus(t)==='CANCELADA')return finAlert('TRANSFERÊNCIA JÁ CANCELADA.');const operador=await transferAuth('CANCELAR');if(!operador)return;if(!await finConfirm('CANCELAR ESTA TRANSFERÊNCIA?'))return;if(transferStatus(t)==='BAIXADA'){const pair=d.movimentos.filter(m=>m.ref==='TRANSF-'+t.id&&m.categoria==='TRANSFERENCIA');if(pair.length!==2)return finAlert('MOVIMENTAÇÕES ORIGINAIS NÃO ENCONTRADAS. CANCELAMENTO BLOQUEADO.');if(balance(d,t.b)<t.v)return finAlert('SALDO INSUFICIENTE NA CONTA DE DESTINO PARA REVERTER A TRANSFERÊNCIA.');addMove(d,{date:today(),conta:t.a,tipo:'ENTRADA',valor:t.v,descricao:'ESTORNO DA TRANSFERÊNCIA '+t.id,ref:'ESTORNO-TRANSF-'+t.id,categoria:'TRANSFERENCIA'});addMove(d,{date:today(),conta:t.b,tipo:'SAIDA',valor:t.v,descricao:'ESTORNO DA TRANSFERÊNCIA '+t.id,ref:'ESTORNO-TRANSF-'+t.id,categoria:'TRANSFERENCIA'})}Object.assign(t,{situacao:'CANCELADA',canceladoPor:operador,canceladoEm:new Date().toISOString()});store(d);editingTransfer=null;page();finAlert('TRANSFERÊNCIA CANCELADA.')};
 if($('fin-print-transfer'))$('fin-print-transfer').onclick=()=>printTransfer(d);
 if($('fin-delete-transfer'))$('fin-delete-transfer').onclick=async()=>{const t=selectedTransfer();if(!t)return finAlert('SELECIONE UMA TRANSFERÊNCIA COM DUPLO CLIQUE.');if(transferStatus(t)!=='PENDENTE')return finAlert('SOMENTE TRANSFERÊNCIAS PENDENTES PODEM SER EXCLUÍDAS.');if(!await finConfirm('EXCLUIR ESTA TRANSFERÊNCIA PENDENTE?'))return;d.transferencias=d.transferencias.filter(x=>x.id!==t.id);store(d);editingTransfer=null;page();finAlert('TRANSFERÊNCIA EXCLUÍDA.')};

 if($('fin-csv'))$('fin-csv').onclick=()=>{const rows=[['Data','Descrição','Tipo','Conta','Valor'],...movements(d).filter(m=>tab!=='extrato'||!bank||m.conta===Number(bank)).map(m=>[m.date,m.descricao,m.tipo,d.contas.find(c=>c.id===m.conta)?.nome||'',m.valor])];const csv='\ufeff'+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='extrato-financeiro.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
function showBankShortcuts(){
 document.getElementById('fin-shortcuts-overlay')?.remove();
 const overlay=document.createElement('div');overlay.id='fin-shortcuts-overlay';overlay.style.cssText='position:fixed;inset:0;background:rgba(0,18,45,.58);z-index:99999;display:flex;align-items:center;justify-content:center;padding:18px';
 overlay.innerHTML='<div role="dialog" aria-modal="true" aria-label="Atalhos de contas bancárias" style="width:min(440px,100%);background:white;border-radius:10px;overflow:hidden;box-shadow:0 12px 50px #0005;font:14px Arial"><div style="background:#195aa5;color:white;padding:18px 22px;font-weight:bold;font-size:16px;display:flex;justify-content:space-between;align-items:center"><span>⌂ ATALHOS — CONTAS BANCÁRIAS</span><button type="button" id="fin-shortcuts-x" aria-label="Fechar" style="border:0;background:transparent;color:white;font-size:25px;cursor:pointer">×</button></div><div style="padding:16px 22px;color:#123d76"><div style="display:flex;align-items:center;gap:18px;padding:10px 0;border-bottom:1px solid #e1e8f3"><b style="display:inline-block;background:#eaf2ff;border:1px solid #c4d7f5;border-radius:5px;padding:9px 14px;min-width:54px;text-align:center">F1</b><span>Abrir esta janela de atalhos</span></div><div style="display:flex;align-items:center;gap:18px;padding:10px 0"><b style="display:inline-block;background:#eaf2ff;border:1px solid #c4d7f5;border-radius:5px;padding:9px 14px;min-width:54px;text-align:center">F12</b><span>Localizar conta pelo código</span></div></div><div style="padding:0 20px 20px;text-align:right"><button type="button" id="fin-close-shortcuts" style="background:#1264bd;color:white;border:0;border-radius:5px;padding:11px 22px;font-weight:bold;cursor:pointer">FECHAR</button></div></div>';
 document.body.appendChild(overlay);overlay.querySelector('#fin-close-shortcuts').onclick=()=>overlay.remove();overlay.querySelector('#fin-shortcuts-x').onclick=()=>overlay.remove();overlay.onclick=e=>{if(e.target===overlay)overlay.remove()};overlay.querySelector('button').focus();
}
function printExtract(d){
 // Imprime exclusivamente a última pesquisa realizada, sem alterar filtros.
 if(!extractSearched){finAlert('CLIQUE EM PESQUISAR ANTES DE IMPRIMIR O EXTRATO.');return}
 const selected=bank;
 const start=from,end=to;
 const kind=moveType;
 if(start&&end&&start>end){finAlert('DATA INICIAL NÃO PODE SER MAIOR QUE DATA FINAL.');return}
 const account=d.contas.find(c=>c.id===Number(selected));
 const inAccount=m=>!selected||m.conta===Number(selected);
 const signed=m=>(m.tipo==='ENTRADA'?1:-1)*Number(m.valor||0);
 const base=d.movimentos.filter(inAccount);
 const previous=base.filter(m=>start&&m.date<start).reduce((a,m)=>a+signed(m),0);
 const periodRows=base.filter(m=>(!start||m.date>=start)&&(!end||m.date<=end));
 const ins=periodRows.filter(m=>m.tipo==='ENTRADA').reduce((a,m)=>a+Number(m.valor||0),0);
 const outs=periodRows.filter(m=>m.tipo==='SAIDA').reduce((a,m)=>a+Number(m.valor||0),0);
 const final=previous+ins-outs;
 const filtered=periodRows.filter(m=>!kind||(kind==='TRANSFERENCIA'?m.categoria==='TRANSFERENCIA':m.tipo===kind));
 const ordered=filtered.slice().sort((a,b)=>a.date.localeCompare(b.date)||a.id-b.id);
 // Saldo por lançamento inclui movimentações ocultas pelo filtro de tipo.
 const allSorted=base.slice().sort((a,b)=>a.date.localeCompare(b.date)||a.id-b.id);
 const balances=new Map();let running=0;
 for(const m of allSorted){running+=signed(m);balances.set(m.id,running)}
 const fmtNum=n=>Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
 const formatDate=s=>s?fmt(s):'TODAS';
 const stamp=new Date().toLocaleString('pt-BR');
 const titleAccount=account?.nome||'TODAS AS CONTAS';
 const types={ENTRADA:'ENTRADAS',SAIDA:'SAÍDAS',TRANSFERENCIA:'TRANSFERÊNCIAS'};
 const printRows=ordered.map(m=>`<tr><td>${esc(fmt(m.date))}</td><td>${esc(m.descricao)}</td><td>${esc(m.categoria==='TRANSFERENCIA'?'TRANSFERÊNCIA':m.tipo)}</td><td>${esc(d.contas.find(c=>c.id===m.conta)?.nome||'—')}</td><td class="num">${m.tipo==='ENTRADA'?fmtNum(m.valor):'—'}</td><td class="num out">${m.tipo==='SAIDA'?fmtNum(m.valor):'—'}</td><td class="num">${fmtNum(balances.get(m.id))}</td><td>${esc(m.usuario||'—')}</td></tr>`).join('')||'<tr><td colspan="8" style="text-align:center">Nenhuma movimentação encontrada para os filtros selecionados.</td></tr>';
 const info=(label,value)=>`<p><b>${label}</b><span>${esc(value??'—')}</span></p>`;
 const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Extrato Bancário — LUCAS LIMA</title><style>
 *{box-sizing:border-box}body{margin:0;background:#e8edf4;color:#182a40;font:12px Arial,sans-serif}.toolbar{max-width:1120px;margin:18px auto;display:flex;align-items:center;justify-content:space-between;gap:16px}.toolbar b{font-size:16px;color:#123d76}.toolbar button{background:#1264bd;color:#fff;border:0;border-radius:5px;padding:12px 20px;font-weight:700;cursor:pointer}.paper{max-width:1120px;margin:0 auto 25px;background:white;padding:20px;box-shadow:0 3px 20px #0002}.head{display:grid;grid-template-columns:1fr 1.2fr 1fr;gap:10px;align-items:start;padding-bottom:12px}.brand{font-size:29px;color:#123d76;font-weight:900}.sub{font-size:10px;margin-top:4px}.center{text-align:center}.right{text-align:right}.report{font-size:22px;font-weight:800;color:#123d76}.period{font-size:13px;margin-top:6px}.store{font-size:14px;color:#123d76;font-weight:bold}.details{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:10px 0;margin:13px 0 9px}.details p{margin:5px 0;display:grid;grid-template-columns:105px 1fr;gap:6px}.details b{color:#123d76}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin:9px 0}.metric{padding:10px 6px;text-align:center}.metric label{display:block;font-weight:bold;color:#123d76}.metric strong{display:block;font-size:20px;color:#0957b2;margin-top:6px}.metric.in strong{color:#008850}.metric.out strong{color:#d62937}.section{color:#11509b;padding:9px 0;font-size:14px;font-weight:bold;margin-top:12px}table{border-collapse:collapse;width:100%;font-size:10px}th{color:#123d76}th,td{border:0;padding:7px 6px;text-align:left}tbody tr:nth-child(even){background:transparent}.num{text-align:right;white-space:nowrap}.out{color:#c72d37}tfoot td{color:#123d76;font-weight:bold}.note{margin-top:12px;font-size:10px;color:#42546b}.signature{width:245px;text-align:center;margin:28px auto 12px;padding-top:5px;font-size:10px}.footer{padding-top:8px;display:flex;justify-content:space-between;font-size:10px;margin-top:10px}@page{size:A4 landscape;margin:9mm}@media print{body{background:white}.toolbar{display:none}.paper{max-width:none;box-shadow:none;margin:0;padding:0}.brand{font-size:24px}.report{font-size:19px}.metric strong{font-size:17px}th,td{font-size:9px;padding:5px}thead{display:table-header-group}tr{break-inside:avoid}.details,.summary,.head{break-inside:avoid}.footer{break-inside:avoid}}
 </style></head><body><div class="toolbar"><b>PRÉ-VISUALIZAÇÃO — EXTRATO BANCÁRIO</b><button onclick="window.print()">IMPRIMIR / SALVAR PDF</button></div><main class="paper"><header class="head"><div><div class="brand">LUCAS LIMA</div><div class="sub">SISTEMA DE GESTÃO EMPRESARIAL</div></div><div class="center"><div class="report">EXTRATO BANCÁRIO</div><div class="period">PERÍODO: ${esc(formatDate(start))} até ${esc(formatDate(end))}</div></div><div class="right"><div class="store">LOJA: 01 – MATRIZ</div><div class="sub">DOCE ENCANTO — TRUFAS E DOCES</div></div></header><div class="details"><div>${info('CONTA:',titleAccount)}${info('TIPO:',account?.tipo||'TODOS')}${info('BANCO:',account?.banco||'—')}</div><div>${info('AGÊNCIA:',account?.agencia||'—')}${info('Nº DA CONTA:',account?.numero||'—')}${info('SITUAÇÃO:',account?(account.ativo===false?'INATIVA':'ATIVA'):'TODAS')}</div><div>${info('DATA INICIAL:',formatDate(start))}${info('DATA FINAL:',formatDate(end))}${info('TIPO:',types[kind]||'TODOS')}${info('USUÁRIO:',user())}</div></div><div class="summary"><div class="metric"><label>SALDO ANTERIOR</label><strong>${cash(previous)}</strong></div><div class="metric in"><label>ENTRADAS</label><strong>${cash(ins)}</strong></div><div class="metric out"><label>SAÍDAS</label><strong>${cash(outs)}</strong></div><div class="metric"><label>SALDO FINAL</label><strong>${cash(final)}</strong></div></div><div class="section">MOVIMENTAÇÕES DO PERÍODO</div><table><thead><tr><th>DATA</th><th>DESCRIÇÃO</th><th>TIPO</th><th>CONTA</th><th class="num">ENTRADA (R$)</th><th class="num">SAÍDA (R$)</th><th class="num">SALDO (R$)</th><th>USUÁRIO</th></tr></thead><tbody>${printRows}</tbody><tfoot><tr><td colspan="4">TOTAIS DO PERÍODO (TODOS OS TIPOS)</td><td class="num">${fmtNum(ins)}</td><td class="num out">${fmtNum(outs)}</td><td class="num">${fmtNum(final)}</td><td>—</td></tr></tfoot></table><div class="note">${kind?'As movimentações listadas seguem o filtro de tipo. Os saldos e totais consideram todas as movimentações do período. ':''}${!account?'Na consulta de todas as contas, transferências internas aparecem em ambas as contas, sem representar nova receita ou despesa. ':''}Extrato gerado a partir dos registros disponíveis neste navegador.</div><div class="signature">ASSINATURA / CARIMBO</div><footer class="footer"><div><b>LUCAS LIMA — LOJA: 01 – MATRIZ</b><br>DOCE ENCANTO — TRUFAS E DOCES</div><div class="right">IMPRESSÃO: ${esc(stamp)}<br>USUÁRIO: ${esc(user())}</div></footer></main></body></html>`;
 // Pré-visualização no padrão de Contas a Pagar: painel de dados, opções e A4.
 document.getElementById('fin-extract-preview-overlay')?.remove();
 const overlay=document.createElement('div');
 overlay.id='fin-extract-preview-overlay';
 overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
 overlay.setAttribute('aria-label','IMPRIMIR EXTRATO BANCÁRIO');
 overlay.style.cssText='position:fixed;inset:0;z-index:2147483000;background:rgba(5,25,60,.68);display:flex;align-items:center;justify-content:center;padding:15px;box-sizing:border-box;font-family:Arial,sans-serif;color:#123d76';
 const shell=document.createElement('div');
 shell.style.cssText='background:#fff;border-radius:11px;width:min(1250px,96vw);height:min(610px,85vh);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 15px 45px #001b3b55';
 shell.innerHTML=`<header style="background:#20548d;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:17px 22px;font-size:19px;font-weight:800">IMPRIMIR EXTRATO BANCÁRIO<button type="button" data-fin-preview-close style="background:transparent;border:0;color:white;font-size:28px;cursor:pointer" aria-label="Fechar">×</button></header>
 <div style="display:grid;grid-template-columns:40% minmax(0,60%);gap:14px;padding:15px;overflow:hidden;flex:1;min-height:0;box-sizing:border-box">
 <div style="overflow:auto;display:flex;flex-direction:column;gap:13px">
 <section style="border:1px solid #c2d7f5;border-radius:6px;padding:12px"><h3 style="background:#e0ebfa;margin:0 0 12px;padding:12px;font-size:15px">DADOS DO EXTRATO SELECIONADO</h3>
 <p><b>CONTA:</b> ${esc(titleAccount)}</p><p><b>TIPO DE CONTA:</b> ${esc(account?.tipo||'TODOS')}</p><p><b>PERÍODO:</b> ${esc(formatDate(start))} até ${esc(formatDate(end))}</p><p><b>MOVIMENTAÇÕES:</b> ${ordered.length}</p><p><b>SALDO ANTERIOR:</b> ${cash(previous)}</p><p><b>ENTRADAS:</b> ${cash(ins)}</p><p><b>SAÍDAS:</b> ${cash(outs)}</p><p><b>SALDO FINAL:</b> ${cash(final)}</p></section>
 <section style="border:1px solid #c2d7f5;border-radius:6px;padding:12px"><h3 style="background:#e0ebfa;margin:0 0 12px;padding:12px;font-size:15px">TIPO DE IMPRESSÃO</h3><label style="display:block;margin:12px 0"><input type="radio" name="fin-extract-print-type" value="complete" checked> COMPLETA (Dados, Movimentações e Assinatura)</label><label style="display:block;margin:12px 0"><input type="radio" name="fin-extract-print-type" value="simple"> SIMPLIFICADA (Dados e Movimentações)</label></section>
 <section style="border:1px solid #c2d7f5;border-radius:6px;padding:12px"><h3 style="background:#e0ebfa;margin:0 0 12px;padding:12px;font-size:15px">ORIENTAÇÃO DA PÁGINA</h3>
<label style="display:block;margin:12px 0"><input type="radio" name="fin-extract-orientation" value="portrait" checked> RETRATO — A4 VERTICAL</label>
<label style="display:block;margin:12px 0"><input type="radio" name="fin-extract-orientation" value="landscape"> PAISAGEM — A4 HORIZONTAL</label></section>
<section style="border:1px solid #c2d7f5;border-radius:6px;padding:12px"><h3 style="background:#e0ebfa;margin:0 0 12px;padding:12px;font-size:15px">OPÇÕES DE IMPRESSÃO</h3><label><input type="checkbox" data-fin-extract-sign checked> INCLUIR ASSINATURA</label></section></div>
 <div style="border:1px solid #c2d7f5;background:#eef5fd;border-radius:6px;padding:12px;display:flex;flex-direction:column;min-width:0;min-height:0"><h3 style="background:#e0ebfa;text-align:center;margin:0 0 10px;padding:11px;font-size:15px">PRÉ-VISUALIZAÇÃO A4</h3><iframe title="PRÉ-VISUALIZAÇÃO A4" data-fin-extract-frame style="width:100%;flex:1;min-height:0;border:1px solid #c2d7f5;background:white"></iframe></div></div>
 <footer style="border-top:1px solid #d6e2f2;padding:12px 20px;display:flex;justify-content:flex-end;gap:10px"><button type="button" data-fin-extract-print style="background:#1765df;color:white;border:0;border-radius:5px;padding:12px 24px;font-weight:bold;cursor:pointer">IMPRIMIR</button><button type="button" data-fin-extract-save style="background:#009d74;color:white;border:0;border-radius:5px;padding:12px 24px;font-weight:bold;cursor:pointer">SALVAR</button><button type="button" data-fin-preview-close style="background:#e4efff;color:#10417b;border:0;border-radius:5px;padding:12px 24px;font-weight:bold;cursor:pointer">FECHAR</button></footer>`;
 overlay.appendChild(shell);document.body.appendChild(overlay);
 const frame=shell.querySelector('[data-fin-extract-frame]');
 const radio=()=>shell.querySelector('input[name="fin-extract-print-type"]:checked')?.value||'complete';
 const orientation=()=>shell.querySelector('input[name="fin-extract-orientation"]:checked')?.value||'portrait';
 const sign=shell.querySelector('[data-fin-extract-sign]');
 function updatePreview(){
  const portrait=orientation()==='portrait',showSign=radio()==='complete'&&sign.checked;
  const override=`<style>@page{size:A4 ${portrait?'portrait':'landscape'};margin:9mm}
  .toolbar{display:none!important}body{background:#e8edf4!important}
  .paper{box-shadow:none!important;max-width:none!important;box-sizing:border-box!important;width:${portrait?'210mm':'297mm'}!important;min-height:${portrait?'297mm':'210mm'}!important;margin:0 auto!important;padding:10mm!important;transform-origin:top left}
  .signature{display:${showSign?'block':'none'}!important}.footer .right{text-align:right!important}
  ${portrait?'.brand{font-size:23px}.report{font-size:18px}.head{grid-template-columns:1fr 1.1fr 1fr}.details{gap:4px}.details p{grid-template-columns:85px 1fr;font-size:10px}table{font-size:8px}th,td{padding:5px 3px}.metric strong{font-size:16px}':''}
  @media print{body{background:white!important}.paper{width:auto!important;min-height:0!important;margin:0!important;padding:0!important;transform:none!important}}
  </style>`;
  frame.srcdoc=html.replace('</head>',override+'</head>');
  shell.querySelector('h3').textContent='DADOS DO EXTRATO SELECIONADO';
  const previewTitle=shell.querySelector('[data-fin-extract-frame]').previousElementSibling;
  if(previewTitle)previewTitle.textContent='PRÉ-VISUALIZAÇÃO A4 — '+(portrait?'RETRATO':'PAISAGEM');
 }
 shell.querySelectorAll('input[name="fin-extract-print-type"],input[name="fin-extract-orientation"]').forEach(el=>el.onchange=()=>{sign.disabled=radio()==='simple';updatePreview()});
 sign.onchange=updatePreview;updatePreview();
 const close=()=>{document.removeEventListener('keydown',onEscape);overlay.remove()};
 const onEscape=e=>{if(e.key==='Escape'){e.preventDefault();close()}};
 document.addEventListener('keydown',onEscape);
 shell.querySelectorAll('[data-fin-preview-close]').forEach(el=>el.onclick=close);
 overlay.onclick=e=>{if(e.target===overlay)close()};
 function printDoc(){try{frame.contentWindow.focus();frame.contentWindow.print()}catch(e){finAlert('NÃO FOI POSSÍVEL ABRIR A IMPRESSÃO: '+e.message)}}
 shell.querySelector('[data-fin-extract-print]').onclick=printDoc;
 // PDF real gerado localmente; não chama o diálogo de impressão.
 function buildPdf(){
  const portrait=orientation()==='portrait',w=portrait?210:297,h=portrait?297:210,mm=3;
  const canvas=document.createElement('canvas'),scale=3;
  canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);
  const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Canvas indisponível.');
  const margin=12,cw=w-margin*2,images=[];let y=margin;
  const textColor='#173b70';
  function font(sz=3,bold=false,color=textColor){ctx.fillStyle=color;ctx.font=`${bold?'bold ':''}${sz*scale}px Arial`;ctx.textBaseline='top'}
  function wrap(value,width,sz=3,bold=false){font(sz,bold);const out=[];let line='';for(const word of String(value??'—').split(/\s+/)){const next=line?line+' '+word:word;if(ctx.measureText(next).width>width*scale&&line){out.push(line);line=word}else line=next}if(line)out.push(line);return out.length?out:['']}
  function line(value,x,top,sz=3,bold=false,width=cw,color=textColor){const arr=wrap(value,width,sz,bold);font(sz,bold,color);arr.forEach((v,i)=>ctx.fillText(v,x*scale,(top+i*(sz+1))*scale));return arr.length*(sz+1)}
  function rule(){ctx.strokeStyle='#c5d6e8';ctx.lineWidth=.3*scale;ctx.beginPath();ctx.moveTo(margin*scale,y*scale);ctx.lineTo((w-margin)*scale,y*scale);ctx.stroke()}
  function page(){ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);y=margin;line('LUCAS LIMA',margin,y,5.3,true);line('EXTRATO BANCÁRIO',w/2-25,y,4.2,true,50);y+=10;rule();y+=5}
  function store(){const raw=atob(canvas.toDataURL('image/jpeg',.88).split(',')[1]),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);images.push(bytes)}
  function need(height){if(y+height>h-margin-12){store();page()}}
  function field(label,value){const txt=label+': '+String(value??'—');const ht=wrap(txt,cw,3).length*4;need(ht+2);y+=line(txt,margin,y,3);y+=2}
  function section(name){need(12);y+=4;line(name,margin,y,3.6,true);y+=7;rule();y+=4}
  page();
  field('CONTA',titleAccount);field('TIPO',account?.tipo||'TODOS');field('BANCO',account?.banco||'—');
  field('PERÍODO',formatDate(start)+' até '+formatDate(end));field('FILTRO DE MOVIMENTAÇÕES',types[kind]||'TODOS');
  field('USUÁRIO',user());section('RESUMO FINANCEIRO');
  field('SALDO ANTERIOR',cash(previous));field('ENTRADAS',cash(ins));field('SAÍDAS',cash(outs));field('SALDO FINAL',cash(final));
  section('MOVIMENTAÇÕES DO PERÍODO');
  const cols=portrait?[22,59,25,30,25,25]:[27,94,30,43,39,39];
  const headings=['DATA','DESCRIÇÃO','TIPO','CONTA','ENTRADA','SAÍDA'];
  function tableRow(values,heading=false){
   const sz=heading?2.5:2.6,arr=values.map((v,i)=>wrap(v,cols[i]-2,sz,heading));
   const ht=Math.max(...arr.map(x=>x.length))*3.4+3;need(ht+2);
   if(heading){ctx.fillStyle='#e2edfa';ctx.fillRect(margin*scale,(y-1)*scale,cw*scale,ht*scale)}
   let x=margin;arr.forEach((ls,i)=>{font(sz,heading);ls.forEach((v,j)=>ctx.fillText(v,(x+1)*scale,(y+j*3.4)*scale));x+=cols[i]});y+=ht;rule();y+=2;
  }
  tableRow(headings,true);
  if(!ordered.length)tableRow(['—','NENHUMA MOVIMENTAÇÃO','—','—','—','—']);
  for(const m of ordered)tableRow([fmt(m.date),m.descricao,m.categoria==='TRANSFERENCIA'?'TRANSFERÊNCIA':m.tipo,d.contas.find(c=>c.id===m.conta)?.nome||'—',m.tipo==='ENTRADA'?fmtNum(m.valor):'—',m.tipo==='SAIDA'?fmtNum(m.valor):'—']);
  need(15);y+=5;line('TOTAL DE ENTRADAS: '+cash(ins)+'    TOTAL DE SAÍDAS: '+cash(outs),margin,y,3,true);y+=7;
  if(radio()==='complete'&&sign.checked){need(22);y+=13;line('___________________________________',w/2-34,y,3);y+=5;line('ASSINATURA DO RESPONSÁVEL',w/2-32,y,2.8)}
  need(12);y+=9;line('EMITIDO EM '+new Date().toLocaleDateString('pt-BR')+', POR '+user()+'.',margin,y,2.5);
  store();
  const enc=new TextEncoder(),parts=[],offsets=[0];let length=0;
  function add(v){const bytes=typeof v==='string'?enc.encode(v):v;parts.push(bytes);length+=bytes.length}
  function obj(n,v){offsets[n]=length;add(n+' 0 obj\n'+v+'\nendobj\n')}
  add('%PDF-1.4\n');obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
  obj(2,'<< /Type /Pages /Kids ['+images.map((_,i)=>(3+i*3)+' 0 R').join(' ')+'] /Count '+images.length+' >>');
  const pw=(w*72/25.4).toFixed(3),ph=(h*72/25.4).toFixed(3);
  images.forEach((jpeg,i)=>{const n=3+i*3;obj(n,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im${i} ${n+1} 0 R >> >> /Contents ${n+2} 0 R >>`);
   offsets[n+1]=length;add(`${n+1} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);add(jpeg);add('\nendstream\nendobj\n');
   const cmd=`q ${pw} 0 0 ${ph} 0 0 cm /Im${i} Do Q\n`;obj(n+2,`<< /Length ${enc.encode(cmd).length} >>\nstream\n${cmd}endstream`)});
  const xref=length;add(`xref\n0 ${3+images.length*3}\n0000000000 65535 f \n`);
  for(let i=1;i<3+images.length*3;i++)add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');
  add(`trailer\n<< /Size ${3+images.length*3} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(parts,{type:'application/pdf'});
 }
 shell.querySelector('[data-fin-extract-save]').onclick=async()=>{
  const filename='EXTRATO_BANCARIO_'+(account?.nome||'TODAS_AS_CONTAS').replace(/[^a-z0-9_-]/gi,'_')+'.pdf';
  try{
   // Chamada diretamente no clique para preservar a permissão de abertura do Explorer.
   if(typeof window.showSaveFilePicker==='function'){
    const handle=await window.showSaveFilePicker({suggestedName:filename,types:[{description:'Documento PDF',accept:{'application/pdf':['.pdf']}}]});
    const blob=buildPdf(),writer=await handle.createWritable();await writer.write(blob);await writer.close();return;
   }
   const blob=buildPdf(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
  }catch(e){if(e?.name==='AbortError')return;finAlert('NÃO FOI POSSÍVEL SALVAR O PDF: '+e.message)}
 };
}
 if($('fin-print'))$('fin-print').onclick=e=>{e.preventDefault();e.stopPropagation();printExtract(load())};
 if($('fin-import'))$('fin-import').onclick=()=>importFile(d);
 document.querySelectorAll('[data-match]').forEach(b=>b.onclick=async ()=>{const e=d.extrato.find(x=>x.id===Number(b.dataset.match));const candidates=d.movimentos.filter(m=>m.conta===e.conta&&m.date===e.date&&Math.abs((m.tipo==='ENTRADA'?1:-1)*m.valor-e.valor)<0.011);if(!candidates.length)return finAlert('NENHUM LANÇAMENTO CORRESPONDENTE. UTILIZE CRIAR LANÇAMENTO APÓS CONFERIR.');if(!await finConfirm('CONCILIAR COM O LANÇAMENTO Nº '+candidates[0].id+'?'))return;e.status='CONCILIADO';e.movimento=candidates[0].id;store(d);page()});
 document.querySelectorAll('[data-create]').forEach(b=>b.onclick=async ()=>{const e=d.extrato.find(x=>x.id===Number(b.dataset.create));if(d.movimentos.some(m=>m.conta===e.conta&&m.date===e.date&&Math.abs((m.tipo==='ENTRADA'?1:-1)*m.valor-e.valor)<0.011))return finAlert('EXISTE UM LANÇAMENTO COM MESMA DATA E VALOR. CONCILIE-O ANTES DE CRIAR OUTRO.');if(!await finConfirm(`CRIAR LANÇAMENTO DE ${cash(e.valor)} EM ${fmt(e.date)}?\n${e.descricao}`))return;addMove(d,{date:e.date,conta:e.conta,tipo:e.valor>=0?'ENTRADA':'SAIDA',valor:Math.abs(e.valor),descricao:e.descricao,categoria:'CONCILIACAO'});e.status='CONCILIADO';e.movimento=d.movimentos[d.movimentos.length-1].id;store(d);page()});
}
function parseFile(txt,name){let arr=[];if(name.toLowerCase().endsWith('.ofx')){const blocks=txt.split(/<STMTTRN>/i).slice(1);for(const b of blocks){const get=t=>b.match(new RegExp('<'+t+'>\\s*([^<\\r\\n]+)','i'))?.[1]?.trim()||'';const v=Number(get('TRNAMT').replace(',','.'));const raw=get('DTPOSTED');if(Number.isFinite(v)&&/^\d{8}/.test(raw))arr.push({date:raw.slice(0,4)+'-'+raw.slice(4,6)+'-'+raw.slice(6,8),valor:v,descricao:get('MEMO')||get('NAME')||'MOVIMENTAÇÃO OFX',ref:get('FITID')})}}else{const lines=txt.replace(/^\ufeff/,'').split(/\r?\n/).filter(Boolean);const sep=lines[0]?.includes(';')?';':',';const cells=s=>s.split(sep).map(x=>x.trim().replace(/^"|"$/g,''));const head=cells(lines.shift()||'').map(x=>x.toLowerCase());const ix=keys=>head.findIndex(h=>keys.some(k=>h.includes(k)));const di=ix(['data','date']),vi=ix(['valor','amount']),ti=ix(['descri','histórico','historico','memo']);if(di<0||vi<0)throw Error('CSV deve conter colunas DATA e VALOR.');for(const l of lines){const c=cells(l),r=c[di]||'',m=r.match(/^(\d{2})\/(\d{2})\/(\d{4})$/),date=m?`${m[3]}-${m[2]}-${m[1]}`:r.slice(0,10);const v=Number((c[vi]||'').replace(/R\$|\s/g,'').replace(/\./g,'').replace(',','.'));if(/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(v))arr.push({date,valor:v,descricao:c[ti]||'MOVIMENTAÇÃO CSV'})}}return arr}
function importFile(d){const conta=Number($('fin-import-bank').value),file=$('fin-file').files[0];if(!conta||!file)return finAlert('SELECIONE A CONTA E O ARQUIVO.');file.text().then(txt=>{let entries;try{entries=parseFile(txt,file.name)}catch(e){return finAlert(e.message)}if(!entries.length)return finAlert('NENHUMA MOVIMENTAÇÃO VÁLIDA ENCONTRADA.');const seen=new Set(d.extrato.map(x=>[x.conta,x.date,x.valor,x.descricao,x.ref||''].join('|')));let count=0;for(const x of entries){const key=[conta,x.date,x.valor,x.descricao,x.ref||''].join('|');if(seen.has(key))continue;seen.add(key);d.extrato.push({...x,id:newid(d.extrato),conta,status:'NÃO CONCILIADO'});count++}d.importacoes.push({id:newid(d.importacoes),nome:file.name,conta,date:today(),quantidade:count,usuario:user()});store(d);finAlert(count+' MOVIMENTAÇÃO(ÕES) NOVA(S) IMPORTADA(S).');page()}).catch(e=>finAlert('ERRO AO LER ARQUIVO: '+e.message))}

document.addEventListener('keydown',e=>{if(tab!=='contas'||screen!=='FINANCEIRO')return;if(e.key==='F1'){e.preventDefault();$('fin-shortcuts')?.click()}if(e.key==='F12'){e.preventDefault();const id=prompt('LOCALIZAR CONTA — INFORME O CÓDIGO:');if(id===null)return;const r=document.querySelector(`[data-fin-account="${Number(id)}"]`);if(!r)return finAlert('CONTA NÃO ENCONTRADA.');r.dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));r.scrollIntoView({block:'center',behavior:'smooth'})}});
const previous=open;open=function(name){if(name==='FINANCEIRO')return page();return previous(name)};
})();
