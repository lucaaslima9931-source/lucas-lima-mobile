/* LUCAS LIMA — PAINEL GERENCIAL. Consulta local, sem alterar dados dos módulos. */
(()=>{'use strict';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&lt;','"':'&quot;',"'":'&#39;'}[c]));
const money=x=>Number(x||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const n=x=>Number(x)||0;
const load=(key,def={})=>{try{return JSON.parse(localStorage.getItem(key)||'null')??def}catch{return def}};
const date=x=>String(x||'').slice(0,10);
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const state={preset:'mes',from:'',to:'',selected:null};
function dates(){
 const d=new Date(),end=iso(d),start=new Date(d);
 switch(state.preset){
 case 'hoje':state.from=end;state.to=end;break;
 case 'ontem':start.setDate(d.getDate()-1);state.from=iso(start);state.to=iso(start);break;
 case 'semana':start.setDate(d.getDate()-(d.getDay()+6)%7);state.from=iso(start);state.to=end;break;
 case 'mes':state.from=iso(new Date(d.getFullYear(),d.getMonth(),1));state.to=end;break;
 case 'anterior':state.from=iso(new Date(d.getFullYear(),d.getMonth()-1,1));state.to=iso(new Date(d.getFullYear(),d.getMonth(),0));break;
 case 'ano':state.from=iso(new Date(d.getFullYear(),0,1));state.to=end;break;
 default:if(!state.from)state.from=end;if(!state.to)state.to=end;
 }}
function prevPeriod(a,b){const x=new Date(a+'T12:00:00'),y=new Date(b+'T12:00:00');const days=Math.round((y-x)/86400000)+1; x.setDate(x.getDate()-days);y.setDate(y.getDate()-days);return [iso(x),iso(y)]}
function within(d,a,b){return d&&d>=a&&d<=b}
function collect(){
 const op=load('erp_matriz_operacoes_v2'),fin=load('erp_systems_financeiro_v1'),pr=load('erp_matriz_produtos_teste_v1',[]);
 const sales=Array.isArray(op.vendas)?op.vendas:[],products=Array.isArray(pr)?pr:[];
 const movements=Array.isArray(fin.movimentos)?fin.movimentos:[];
 const records=[];let missingCost=0,missingExpense=0;
 for(const v of sales){
  const status=String(v.situacao||'').toUpperCase(),d=date(v.dataBaixa||v.data);
  if(status!=='BAIXADA'||!d)continue;
  const gross=(v.itens||[]).reduce((s,i)=>s+n(i.quantidade||i.qtd)*n(i.preco||i.precoUnitario),0);
  const net=v.total!==undefined?n(v.total):gross-n(v.desconto)+n(v.acrescimo);
  records.push({kind:'vendas',d,amount:net,source:'VENDAS',id:v.id,desc:'Venda nº '+v.id,person:v.pessoa||v.cliente||'',items:v.itens||[]});
  for(const it of v.itens||[]){
   const cost=it.custoHistorico??it.custoNaBaixa??it.custoUnitarioBaixa??it.custoVendaHistorico;
   if(cost==null||cost===''){missingCost++;continue}
   records.push({kind:'cmv',d,amount:n(it.quantidade||it.qtd)*n(cost),source:'VENDAS',id:v.id,desc:'CMV — venda nº '+v.id});
  }
 }
 for(const m of movements){
  if(String(m.tipo||'').toUpperCase()!=='SAIDA'||m.estorno||String(m.categoria||'').toUpperCase()==='TRANSFERENCIA')continue;
  if(!m.dataCompetencia||!m.categoriaDRE){missingExpense++;continue}
  records.push({kind:'despesas',d:date(m.dataCompetencia),amount:n(m.valor),source:'FINANCEIRO',id:m.id,desc:m.descricao||'Despesa',category:m.categoriaDRE});
 }
 const recv=Array.isArray(op.receber)?op.receber:[],pay=Array.isArray(op.pagar)?op.pagar:[];
 return {records,sales,products,recv,pay,missingCost,missingExpense};
}
function total(arr,kind){return arr.filter(r=>r.kind===kind).reduce((s,r)=>s+r.amount,0)}
function summarize(data,a,b){
 const rr=data.records.filter(r=>within(r.d,a,b)),sales=rr.filter(r=>r.kind==='vendas');
 const revenue=total(rr,'vendas'),cmv=total(rr,'cmv'),expense=total(rr,'despesas');
 return {rr,revenue,cmv,expense,profit:revenue-cmv-expense,saleCount:sales.length,avg:sales.length?revenue/sales.length:0};
}
const css=`<style id="pg-css">.pg{font:14px Arial,sans-serif;color:#163759;max-width:1500px;margin:auto;padding:18px}.pg .head{background:linear-gradient(110deg,#093e79,#1766a9);color:white;padding:21px;border-radius:12px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}.pg h1{font-size:23px;margin:0 0 5px}.pg h2{font-size:18px;margin:20px 0 10px}.pg .filters{display:flex;flex-wrap:wrap;gap:10px;align-items:end;margin:17px 0}.pg label{display:grid;gap:5px;font-weight:bold;font-size:12px}.pg input,.pg select{border:1px solid #b9cee5;border-radius:6px;padding:10px;background:white}.pg button{border:1px solid #aac8e8;border-radius:6px;background:#e7f2ff;color:#164a81;font-weight:bold;padding:10px 12px;cursor:pointer}.pg button:hover{background:#cfe5ff}.pg .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px}.pg .card{background:#f1f7ff;border:1px solid #d3e2f3;border-radius:10px;padding:14px;text-align:left;display:block;min-height:100px}.pg .card small{display:block;color:#55708e}.pg .card strong{display:block;font-size:22px;margin:9px 0}.pg .card em{font-size:11px;color:#56718d;font-style:normal}.pg .panels{display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:14px}.pg .panel{border:1px solid #d1e0f1;border-radius:9px;padding:14px;background:white;overflow:auto}.pg table{border-collapse:collapse;width:100%;font-size:13px}.pg th{background:#195d9e;color:white;text-align:left}.pg th,.pg td{padding:9px;border-bottom:1px solid #e1eaf4}.pg .chart{height:200px;display:flex;align-items:flex-end;gap:8px;overflow:auto;border-bottom:1px solid #b3c6da;padding:14px 5px 0}.pg .bar{min-width:65px;text-align:center;font-size:11px}.pg .bar i{display:block;width:30px;background:#2477bd;margin:auto;border-radius:4px 4px 0 0}.pg .warn{padding:12px;background:#fff8e7;border:1px solid #e4cb88;border-radius:7px;margin:12px 0}.pg .detail{border:1px solid #8bb6e3;border-radius:9px;padding:14px;margin:16px 0}.pg .muted{color:#667d96}.pg .close{float:right}.pg .actions{display:flex;gap:9px;flex-wrap:wrap}@media print{body *{visibility:hidden!important}.pg,.pg *{visibility:visible!important}.pg{position:absolute;left:0;top:0;width:100%;max-width:none;padding:0}.pg .filters,.pg .actions,.pg .detail button{display:none!important}.pg .head{background:white!important;color:black!important;border-bottom:2px solid black}.pg .card{break-inside:avoid}@page{size:A4;margin:12mm}}</style>`;
function rowDetails(data,kind,from,to){
 if(kind==='estoque'){return data.products.map(p=>({d:'',desc:p.descricao||p.nome||'Produto',amount:n(p.estoque??p.provisao??p.quantidade),source:'PRODUTOS',id:p.codigo||p.id}))}
 if(kind==='receber'||kind==='pagar'){const arr=kind==='receber'?data.recv:data.pay;return arr.map(x=>({d:date(x.vencimento||x.data),desc:x.descricao||x.pessoa||x.cliente||x.fornecedor||'Parcela',amount:n(x.saldo??(n(x.valor)-n(x.pago))),source:kind==='receber'?'CONTAS A RECEBER':'CONTAS A PAGAR',id:x.id}))}
 if(kind==='clientes'){return data.summarizedSales.map(r=>({d:r.d,desc:r.person||'Cliente não identificado',amount:r.amount,source:'VENDAS',id:r.id}))}
 return data.records.filter(r=>r.kind===kind&&within(r.d,from,to));
}
function showDetail(data,kind){
 const rows=rowDetails(data,kind,state.from,state.to),box=document.getElementById('pg-detail');
 const labels={vendas:'VENDAS',cmv:'CUSTOS DAS VENDAS',despesas:'DESPESAS',profit:'RESULTADO — COMPOSIÇÃO',saleCount:'VENDAS',avg:'VENDAS',estoque:'PRODUTOS EM ESTOQUE',receber:'CONTAS A RECEBER',pagar:'CONTAS A PAGAR',clientes:'VENDAS POR CLIENTE'};
 const list=kind==='profit'?[...data.records.filter(r=>within(r.d,state.from,state.to))]:kind==='saleCount'||kind==='avg'?rowDetails(data,'vendas',state.from,state.to):rows;
 box.hidden=false;box.innerHTML=`<button class="close" id="pg-close">FECHAR</button><h2>DETALHAMENTO — ${esc(labels[kind]||kind)}</h2><div style="overflow:auto"><table><thead><tr><th>DATA</th><th>DESCRIÇÃO</th><th>ORIGEM</th><th>VALOR</th><th>AÇÃO</th></tr></thead><tbody>${list.map((r,i)=>`<tr><td>${esc(r.d||'—')}</td><td>${esc(r.desc||'')}</td><td>${esc(r.source||'')}</td><td>${money(r.amount)}</td><td><button data-pg-open="${i}">ABRIR MÓDULO</button></td></tr>`).join('')||'<tr><td colspan="5">Nenhum registro disponível.</td></tr>'}</tbody></table></div><p class="muted">O acesso abre o módulo correspondente; a abertura direta do documento individual ainda depende de integração com as telas de origem e suas permissões.</p>`;
 document.getElementById('pg-close').onclick=()=>{box.hidden=true};
 box.querySelectorAll('[data-pg-open]').forEach(b=>b.onclick=()=>{const r=list[Number(b.dataset.pgOpen)];if(r&&typeof open==='function')open(r.source||'VENDAS')});
 box.scrollIntoView({behavior:'smooth',block:'start'});
}
function render(){
 const data=collect();dates();const curr=summarize(data,state.from,state.to),[pa,pb]=prevPeriod(state.from,state.to),prev=summarize(data,pa,pb);
 data.summarizedSales=curr.rr.filter(r=>r.kind==='vendas');
 const recSum=rowDetails(data,'receber').reduce((s,r)=>s+r.amount,0),paySum=rowDetails(data,'pagar').reduce((s,r)=>s+r.amount,0);
 const items=[
 ['vendas','FATURAMENTO (VENDAS BAIXADAS)',curr.revenue,prev.revenue,'money'],
 ['profit','RESULTADO PARCIAL',curr.profit,prev.profit,'money'],
 ['cmv','CMV REGISTRADO',curr.cmv,prev.cmv,'money'],
 ['despesas','DESPESAS CLASSIFICADAS',curr.expense,prev.expense,'money'],
 ['saleCount','QUANTIDADE DE VENDAS',curr.saleCount,prev.saleCount,'count'],
 ['avg','TICKET MÉDIO',curr.avg,prev.avg,'money'],
 ['receber','SALDO A RECEBER (GERAL)',recSum,null,'money'],
 ['pagar','SALDO A PAGAR (GERAL)',paySum,null,'money'],
 ['estoque','PRODUTOS CADASTRADOS',data.products.length,null,'count']];
 const months={};for(const r of curr.rr){const m=r.d.slice(0,7);(months[m]??=[]).push(r)}
 const bars=Object.entries(months).sort(([a],[b])=>a.localeCompare(b));
 const max=Math.max(1,...bars.map(([,v])=>total(v,'vendas')));
 const byCategory={};curr.rr.filter(r=>r.kind==='despesas').forEach(r=>byCategory[r.category||'SEM CATEGORIA']=(byCategory[r.category||'SEM CATEGORIA']||0)+r.amount);
 const rootEl=typeof root==='function'?root():document.getElementById('app');
 if(typeof screen!=='undefined')screen='PAINEL GERENCIAL';
 if(typeof active==='function')active('RELATÓRIOS');
 rootEl.innerHTML=css+`<main class="pg"><header class="head"><div><h1>PAINEL GERENCIAL</h1><small>LUCAS LIMA · LOJA 01 – MATRIZ</small></div><b>VISÃO GERAL · CONSULTA LOCAL</b></header><div class="filters"><label>PERÍODO<select id="pg-preset">${[['hoje','Hoje'],['ontem','Ontem'],['semana','Esta Semana'],['mes','Este Mês'],['anterior','Mês Anterior'],['ano','Este Ano'],['custom','Personalizado']].map(([v,l])=>`<option value="${v}" ${v===state.preset?'selected':''}>${l}</option>`).join('')}</select></label><label>DATA INICIAL<input type="date" id="pg-from" value="${state.from}"></label><label>DATA FINAL<input type="date" id="pg-to" value="${state.to}"></label><button id="pg-apply">CONSULTAR</button></div><div class="warn"><b>Atenção:</b> painel de testes com dados armazenados neste navegador. O resultado é parcial quando faltam custos históricos ou despesas por competência. Contas a pagar/receber são saldos gerais, não filtrados por competência. ${data.missingCost} item(ns) sem custo histórico; ${data.missingExpense} saída(s) financeiras sem classificação de competência. Não usar como demonstrativo contábil oficial.</div><div class="cards">${items.map(([id,label,value,previous,type])=>{const delta=previous===null?'':previous===0?'Sem base comparável':`${value-previous>=0?'+':''}${money(value-previous)} · ${((value-previous)/Math.abs(previous)*100).toFixed(1)}%`;return `<button class="card" data-pg-kind="${id}"><small>${label}</small><strong>${type==='count'?value:money(value)}</strong><em>${esc(delta||'Clique para detalhar')}</em></button>`}).join('')}</div><div class="panels"><section class="panel"><h2>FATURAMENTO POR MÊS</h2><div class="chart">${bars.map(([m,rows])=>`<div class="bar"><i title="${money(total(rows,'vendas'))}" style="height:${Math.max(2,Math.round(total(rows,'vendas')/max*155))}px"></i>${esc(m)}</div>`).join('')||'<span>Sem vendas no período.</span>'}</div></section><section class="panel"><h2>DESPESAS POR CATEGORIA</h2><table><thead><tr><th>CATEGORIA</th><th>VALOR</th></tr></thead><tbody>${Object.entries(byCategory).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<tr><td>${esc(k)}</td><td>${money(v)}</td></tr>`).join('')||'<tr><td colspan="2">Sem despesas classificadas.</td></tr>'}</tbody></table></section><section class="panel"><h2>RESUMO DO RESULTADO</h2><table><tbody><tr><td>Receita líquida das vendas</td><td>${money(curr.revenue)}</td></tr><tr><td>CMV histórico registrado</td><td>${money(curr.cmv)}</td></tr><tr><td>Despesas classificadas</td><td>${money(curr.expense)}</td></tr><tr><th>Resultado parcial</th><th>${money(curr.profit)}</th></tr></tbody></table></section><section class="panel"><h2>COMPARAÇÃO COM PERÍODO ANTERIOR</h2><p>${esc(pa)} até ${esc(pb)}</p><table><thead><tr><th>INDICADOR</th><th>ATUAL</th><th>ANTERIOR</th></tr></thead><tbody>${items.slice(0,6).map(([id,label,value,old,type])=>`<tr><td>${esc(label)}</td><td>${type==='count'?value:money(value)}</td><td>${type==='count'?old:money(old)}</td></tr>`).join('')}</tbody></table></section></div><section class="detail" id="pg-detail" hidden></section><div class="actions"><button id="pg-print">IMPRIMIR / PDF</button><button id="pg-csv">EXPORTAR CSV</button><button id="pg-dre">ABRIR DRE</button><button id="pg-list">ABRIR LISTAGENS</button></div><p class="muted">Indicadores consultam dados disponíveis no ERP. Alguns módulos ainda precisam de integração para completar o painel, incluindo permissões centralizadas, vendedores, inadimplência, estoque mínimo e folha.</p></main>`;
 document.getElementById('pg-preset').onchange=e=>{state.preset=e.target.value;if(state.preset!=='custom')render()};
 document.getElementById('pg-apply').onclick=()=>{const a=document.getElementById('pg-from').value,b=document.getElementById('pg-to').value;if(!a||!b||a>b)return alert('Informe um período válido.');state.from=a;state.to=b;state.preset='custom';render()};
 document.querySelectorAll('[data-pg-kind]').forEach(b=>b.onclick=()=>showDetail(data,b.dataset.pgKind));
 document.getElementById('pg-print').onclick=()=>window.print();
 document.getElementById('pg-dre').onclick=()=>open('DRE');
 document.getElementById('pg-list').onclick=()=>open('LISTAGENS');
 document.getElementById('pg-csv').onclick=()=>{const rows=[['INDICADOR','ATUAL','ANTERIOR'],...items.map(([id,label,v,old])=>[label,v,old??''])];const csv='\ufeff'+rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='ERP_SYSTEMS_PAINEL_GERENCIAL.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
}
const prior=window.open;window.open=function(name){if(name==='PAINEL GERENCIAL')return render();return prior(name)};
})();
