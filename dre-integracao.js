/* LUCAS LIMA — DRE GERENCIAL POR COMPETÊNCIA.
   Usa apenas valores rastreáveis; não confunde pagamento com despesa nem compra com CMV.
   Dados locais do navegador; integrações não implementadas são explicitamente sinalizadas. */
(()=>{'use strict';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brl=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const load=k=>{try{return JSON.parse(localStorage.getItem(k)||'{}')}catch{return {}}};
const num=x=>Number(x)||0;
const date=x=>String(x||'').slice(0,10);
const period=(d,a,b)=>d&&(!a||d>=a)&&(!b||d<=b);
const pName=x=>String(x||'').toUpperCase();
const today=new Date();const currentMonth=today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0');const state={month:'all',year:today.getFullYear(),from:'',to:'',searched:false,compare:false,view:'detalhado',selected:null};
const style=`<style id="dre-css">
.dre{font:12px Arial,sans-serif;color:#08366c;padding:8px 12px 24px;max-width:1500px;margin:auto}.dre *{box-sizing:border-box}.dre .hero{background:#1b4177;color:white;border-radius:5px;padding:13px 15px;font-size:16px;font-weight:800}.dre .month-heading{font-weight:800;color:#073d79;margin:14px 0 9px;font-size:13px}.dre .panel{background:#fff;border:1px solid #d2e0f1;border-radius:6px;padding:10px;margin:10px 0}.dre .section{background:#e0edfc;color:#08407d;padding:9px 10px;font-weight:800;margin-bottom:10px}.dre .controls{display:flex;align-items:end;gap:10px;flex-wrap:wrap}.dre label{display:flex;flex-direction:column;gap:5px;font-size:11px;font-weight:800;min-width:145px}.dre input,.dre select{height:37px;border:1px solid #bfd3ed;border-radius:5px;background:#fff;padding:7px;color:#102d50;font-weight:600;max-width:100%}.dre button{height:37px;border:0;border-radius:5px;background:#1467c4;color:#fff;font-size:11px;font-weight:800;padding:0 15px;cursor:pointer}.dre button:hover{filter:brightness(.93)}.dre #dre-print{background:#14529b!important;color:#fff!important;border:0!important}.dre #dre-csv,.dre #dre-compare{background:#e6f0ff;color:#0b4889;border:1px solid #a8c8f5}.dre .cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:12px}.dre .card{border:1px solid #94bdff;background:#dceaff;padding:14px 12px;border-radius:6px;min-height:77px}.dre .card:nth-child(2){background:#dcfbe6;border-color:#86e4a5}.dre .card:nth-child(3){background:#ffe4e4;border-color:#ff9f9f}.dre .card:nth-child(4){background:#fff3c5;border-color:#ffcb51}.dre .card span{font-size:11px;font-weight:700}.dre .card b{display:block;font-size:19px;margin-top:8px}.dre table{width:100%;border-collapse:collapse;background:#fff}.dre th{background:#e8f1fc;color:#06376e;text-align:left}.dre th,.dre td{padding:10px;border-bottom:1px solid #d9e6f5}.dre td:last-child,.dre th:last-child{text-align:right}.dre tr.clickable{cursor:pointer}.dre tr.clickable:hover{background:#eaf4ff}.dre .indent{padding-left:28px}.dre .total{background:#e8f2ff;font-weight:700}.dre .detail{border:1px solid #d1e1f4;padding:12px;border-radius:5px;margin-top:12px}.dre .muted{color:#61738b;font-size:11px}.dre .notice{color:#61738b;font-size:11px;margin-top:10px}.dre .backrow{text-align:right;margin-top:16px}.dre .backrow button{background:#ed3048;min-width:125px}.dre .chart{display:flex;align-items:flex-end;gap:12px;height:170px;border-bottom:1px solid #9db6cf;padding:20px 10px 0;overflow:auto}.dre .bar{min-width:65px;text-align:center;font-size:11px}.dre .bar div{background:#2b79be;margin:auto;width:35px}.dre .printhead{display:none}@media(max-width:900px){.dre .cards{grid-template-columns:repeat(2,1fr)}}@media print{body *{visibility:hidden!important}.dre,.dre *{visibility:visible!important}.dre{position:absolute;left:0;top:0;width:100%;max-width:none;padding:0}.dre .controls,.dre .noprint,.dre .backrow{display:none!important}.dre .hero{background:white!important;color:black!important;border-bottom:2px solid black}.dre .printhead{display:block}@page{size:A4;margin:12mm}}
.dre-v722{padding:12px 14px 24px}.dre-v722 .dre-title{background:#164780;color:#fff;border-radius:6px;padding:16px 20px;font-size:21px;font-weight:800;margin-bottom:12px}.dre-v722 .dre-toolbar{display:flex;align-items:end;gap:10px;background:#f2f6ff;border:1px solid #cfdef4;border-radius:8px;padding:12px;flex-wrap:wrap}.dre-v722 .dre-toolbar label{min-width:135px}.dre-v722 .dre-toolbar label:first-child{min-width:165px}.dre-v722 .dre-toolbar select{width:100%;font-size:13px}.dre-v722 .toolbar-spacer{flex:1}.dre-v722 .light{background:#e9f2ff;color:#073e80;border:1px solid #9cbfed}.dre-v722 .dre-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:14px 0}.dre-v722 .metric{display:flex;align-items:center;gap:12px;border:1px solid #cddff6;border-radius:9px;padding:16px 12px;min-height:94px}.dre-v722 .metric.blue{background:#e0efff}.dre-v722 .metric.red{background:#ffe5e5;color:#a51616}.dre-v722 .metric.yellow{background:#fff4d2;color:#845700}.dre-v722 .metric-icon{font-size:28px;font-weight:bold}.dre-v722 .metric strong{display:block;font-size:11px;margin-bottom:8px}.dre-v722 .metric b{font-size:18px}.dre-v722 .dre-columns{display:grid;grid-template-columns:minmax(0,1.8fr) minmax(290px,1fr);gap:14px}.dre-v722 .dre-left,.dre-v722 .dre-side-panel{background:#fff;border:1px solid #cbdcf0;border-radius:8px;padding:8px}.dre-v722 .dre-statement th{background:#103d77;color:white;font-size:13px}.dre-v722 .dre-statement td{padding:9px 12px}.dre-v722 .dre-statement .group{background:#d8eaff;font-weight:800}.dre-v722 .dre-statement .subtotal{background:#d8eaff;font-weight:800}.dre-v722 .dre-statement .result-row{background:#09396f;color:#fff;font-weight:800;font-size:13px}.dre-v722 .dre-statement .result-row td:last-child{background:#087c23;font-size:17px}.dre-v722 .dre-detail{margin:10px 2px 0;padding:10px;border:1px solid #d4e3f4;border-radius:5px}.dre-v722 .dre-right{display:flex;flex-direction:column;gap:10px}.dre-v722 .dre-result{display:grid;grid-template-columns:1fr 1fr;background:#e5fff0;border:1px solid #b6e8cd;border-radius:8px;padding:18px 12px;text-align:center;gap:8px}.dre-v722 .dre-result>div+div{border-left:1px solid #a8cbb7}.dre-v722 .dre-result small{display:block;font-weight:800;font-size:11px}.dre-v722 .dre-result b{display:block;color:#087328;font-size:21px;margin-top:8px}.dre-v722 .dre-side-panel h3{background:#dcecff;color:#073b79;font-size:13px;margin:0 0 6px;padding:9px}.dre-v722 .dre-side-panel>div{padding:7px 9px;border-bottom:1px solid #d5e2f2;display:flex;justify-content:space-between;gap:8px}.dre-v722 .dre-side-panel .highlight{background:#cbe3ff;font-weight:800}.dre-v722 .dre-caution{font-size:10px;color:#5a718c;margin-top:10px}.dre-v722 .backrow button{background:#ed3048}@media(max-width:1050px){.dre-v722 .dre-metrics{grid-template-columns:repeat(3,1fr)}.dre-v722 .dre-columns{grid-template-columns:1fr}}@media(max-width:600px){.dre-v722 .dre-metrics{grid-template-columns:repeat(2,1fr)}}@media print{.dre-v722 .dre-toolbar,.dre-v722 .backrow,.dre-v722 .dre-detail{display:none!important}.dre-v722 .dre-columns{grid-template-columns:1.8fr 1fr}.dre-v722 .dre-metrics{grid-template-columns:repeat(5,1fr)}}
</style>`;
function collect(){
 // A tela VENDAS grava na chave própria; erp_matriz_operacoes_v2 guarda recebíveis,
 // não a relação de vendas. Ler ambas como vendas causava DRE sempre zerado.
 const sales=load('erp_matriz_vendas_v1');
 const products=load('erp_matriz_produtos_teste_v1');
 const saleList=Array.isArray(sales)?sales:[];
 const productList=Array.isArray(products)?products:[];
 const records=[];let missing=0;let hasRevenue=false;
 for(const sale of saleList){
  if(pName(sale.situacao)!=='BAIXADA')continue;
  const d=date(sale.data||sale.baixadaEm||sale.atualizadoEm);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d))continue;
  const items=Array.isArray(sale.itens)?sale.itens:[];
  const calculatedGross=items.reduce((sum,item)=>sum+num(item.quantidade??item.qtd)*num(item.preco??item.precoUnitario),0);
  const gross=Number.isFinite(Number(sale.bruto))?num(sale.bruto):calculatedGross;
  const discount=num(sale.desconto),extra=num(sale.acrescimo);
  const ded=discount-extra;
  const id=sale.numero??sale.id;
  records.push({kind:'RECEITA',date:d,amount:gross,description:`Venda nº ${id}`,source:'VENDAS',id});
  records.push({kind:'DEDUCOES',date:d,amount:ded,description:`Descontos e acréscimos — venda nº ${id}`,source:'VENDAS',id});
  hasRevenue=true;
  for(const [index,item] of items.entries()){
   // Não usar custo atual do cadastro: pode ter mudado depois da venda.
   const historic=item.custoHistorico??item.custoNaBaixa??item.custoUnitarioBaixa??item.custoVendaHistorico;
   const qty=num(item.quantidade??item.qtd);
   if(historic===undefined||historic===null||historic===''){missing++;continue;}
   records.push({kind:'CMV',date:d,amount:qty*num(historic),description:`Venda nº ${id}, item ${index+1} — ${productList.find(p=>String(p.codigo)===String(item.codigo))?.descricao||item.descricao||item.codigo||'produto'}`,source:'VENDAS',id});
  }
 }
 // Centro de custos: a baixa representa a competência registrada no documento.
 // Pagamento da conta vinculada não deve ser somado novamente.
 const centers=load('erp_systems_centros_custos_v1');
 const centersList=Array.isArray(centers)?centers:[];
 const centerNames=new Map(centersList.map(c=>[String(c.id),String(c.nome||c.descricao||'DESPESAS OPERACIONAIS')]));
 const cc=load('lucas_lima_cc_lancamentos_v2');
 const ccList=Array.isArray(cc)?cc:[];
 for(const c of ccList){
  if(!['BAIXADO','BAIXADA'].includes(pName(c.status))||!/^\d{4}-\d{2}-\d{2}$/.test(date(c.data)))continue;
  records.push({kind:'DESPESA',category:centerNames.get(String(c.centro))||'CENTRO DE CUSTOS',date:date(c.data),amount:num(c.valor),description:c.descricao||`Centro de custos nº ${c.id}`,source:'FINANCEIRO',originType:'CENTRO',id:c.id});
 }
 // Contas a pagar que não vieram de um centro de custos: lançamento próprio,
 // uma única vez, independentemente da quantidade de parcelas/pagamentos.
 const ops=load('erp_matriz_operacoes_v2');
 const payList=Array.isArray(ops.pagar)?ops.pagar:[];
 const payGroups=new Map();
 for(const p of payList){
  if(p.ccLancamentoId!=null||p.ccCancelado||p.situacao==='CANCELADA')continue;
  const d=date(p.dataCompetencia||p.data||p.criadoEm);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d))continue;
  const key=String(p.conta??p.documento??p.id);
  if(!payGroups.has(key))payGroups.set(key,{date:d,amount:0,description:p.descricao||`Conta a pagar nº ${key}`,id:key});
  payGroups.get(key).amount+=num(p.valor);
 }
 for(const p of payGroups.values())records.push({kind:'DESPESA',category:'CONTAS A PAGAR',date:p.date,amount:p.amount,description:p.description,source:'FINANCEIRO',originType:'PAGAR',id:p.id});
 // Trocas baixadas: contabilizar apenas o acerto adicional, pois a venda
 // original já consta na receita. Troca cancelada não gera novo resultado.
 const tradeData=load('erp_matriz_trocas_v1');
 const trades=Array.isArray(tradeData)?tradeData:[];
 for(const t of trades){
  if(pName(t.situacao)!=='BAIXADA')continue;
  const d=date(t.baixadaEm||t.data);if(!/^\d{4}-\d{2}-\d{2}$/.test(d))continue;
  const difference=num(t.valorNovo)-num(t.valorDevolvido)-num(t.desconto)+num(t.acrescimo);
  if(difference)records.push({kind:'TROCAS',date:d,amount:-difference,description:`Acerto da troca nº ${t.numero} (venda nº ${t.venda})`,source:'VENDAS',originType:'TROCA',id:t.numero});
 }
 const finance=load('erp_systems_financeiro_v1');
 for(const m of Array.isArray(finance.movimentos)?finance.movimentos:[]){
  if(pName(m.tipo)!=='SAIDA'||!m.dataCompetencia||!m.categoriaDRE||m.estorno||m.ref?.startsWith('CP-')||['TRANSFERENCIA','SANGRIA','CONTAS A PAGAR'].includes(pName(m.categoria)))continue;
  records.push({kind:'DESPESA',category:String(m.categoriaDRE),date:date(m.dataCompetencia),amount:num(m.valor),description:m.descricao||`Lançamento ${m.id}`,source:'FINANCEIRO',originType:'MOVIMENTO',id:m.id});
 }
 return {records,missing,hasRevenue};
}
function sum(rows,k){return rows.filter(r=>r.kind===k).reduce((s,r)=>s+r.amount,0)}
function summary(rows){const gross=sum(rows,'RECEITA'),ded=sum(rows,'DEDUCOES'),trades=sum(rows,'TROCAS'),cmv=sum(rows,'CMV'),expenses=sum(rows,'DESPESA');return {gross,ded,trades,net:gross-ded-trades,cmv,profit:gross-ded-trades-cmv,expenses,result:gross-ded-trades-cmv-expenses};}
function view(){
 const {records,missing}=collect(),rows=state.searched?records.filter(r=>period(r.date,state.from,state.to)):[],s=summary(rows);
 const rootEl=typeof root==='function'?root():document.getElementById('app');if(typeof active==='function')active('RELATÓRIOS');if(typeof screen!=='undefined')screen='DRE';
 const year=state.year,month=state.month==='all'?0:Number(state.month);
 const monthNames=['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
 const display=n=>state.searched?brl(n):'—';const card=(icon,name,value,cls)=>`<div class="metric ${cls}"><span class="metric-icon">${icon}</span><div><strong>${name}</strong><b>${display(value)}</b></div></div>`;
 const group=(name,kind,value)=>`<tr class="group clickable" data-dre-kind="${kind}"><td>⌄ &nbsp; ${name}</td><td>${brl(value)}</td></tr>`;
 const item=(name,value,kind)=>`<tr class="clickable" data-dre-kind="${kind}"><td class="indent">${name}</td><td>${brl(value)}</td></tr>`;
 const subtotal=(name,value)=>`<tr class="subtotal"><td>${name}</td><td>${brl(value)}</td></tr>`;
 const expCategories=[...new Set(rows.filter(r=>r.kind==='DESPESA').map(r=>r.category||'OUTRAS DESPESAS'))].sort();
 const expRows=expCategories.map(cat=>`<tr class="clickable" data-dre-category="${esc(cat)}"><td class="indent">${esc(cat)}</td><td>${brl(-rows.filter(r=>r.kind==='DESPESA'&&(r.category||'OUTRAS DESPESAS')===cat).reduce((a,r)=>a+r.amount,0))}</td></tr>`).join('');
 const margin=s.net?100*s.result/s.net:0;
 const monthly=Array.from({length:12},(_,i)=>{const m=year+'-'+String(i+1).padStart(2,'0');return {m,label:monthNames[i].slice(0,3)+'/'+year,result:summary(records.filter(r=>r.date.slice(0,7)===m)).result,selected:month===i+1}});
 rootEl.innerHTML=style+`<main class="dre dre-v722">
 <div class="dre-title">▥ &nbsp; DRE – DEMONSTRATIVO DO RESULTADO</div>
 <div class="dre-toolbar"><label>MÊS<select id="dre-month-select"><option value="all" ${month===0?'selected':''}>TODOS</option>${monthNames.map((n,i)=>`<option value="${i+1}" ${month===i+1?'selected':''}>${n}</option>`).join('')}</select></label><label>ANO<select id="dre-year-select">${Array.from({length:11},(_,i)=>year-5+i).map(y=>`<option ${y===year?'selected':''}>${y}</option>`).join('')}</select></label><button id="dre-filter">⌕ &nbsp; PESQUISAR</button><span class="toolbar-spacer"></span><button class="light" id="dre-print">▣ &nbsp; IMPRIMIR</button></div>
 <div id="dre-results" style="display:${state.searched?'block':'none'}"><div class="dre-metrics">${card('◇','RECEITA BRUTA',s.gross,'blue')}${card('%','DESCONTOS (-)',s.ded,'red')}${card('⇄','TROCAS / ESTORNOS (-)',s.trades,'red')}${card('⬡','CUSTO DAS VENDAS (CMV)',s.cmv,'yellow')}${card('▤','DESPESAS DO PERÍODO',s.expenses,'red')}</div>
 <div class="dre-columns"><section class="dre-left"><table class="dre-statement"><thead><tr><th>DESCRIÇÃO</th><th>VALOR (R$)</th></tr></thead><tbody>
 ${group('RECEITAS OPERACIONAIS','RECEITA',s.gross)}${item('Vendas realizadas',s.gross,'RECEITA')}${item('Acréscimos / descontos líquidos',-s.ded,'DEDUCOES')}${item('(-) Acertos de trocas baixadas',-s.trades,'TROCAS')}${subtotal('Receita Líquida',s.net)}
 ${group('CUSTO DAS VENDAS (CMV)','CMV',-s.cmv)}${item('(-) Custo dos produtos vendidos',-s.cmv,'CMV')}
 ${group('DESPESAS OPERACIONAIS','DESPESA',-s.expenses)}${expRows||item('Nenhuma despesa classificada no mês',0,'DESPESA')}${subtotal('Total das Despesas',-s.expenses)}
 <tr class="result-row"><td>RESULTADO DO PERÍODO (LUCRO / PREJUÍZO)</td><td>${brl(s.result)}</td></tr></tbody></table>
 <div id="dre-detail" class="dre-detail">Clique em uma linha para consultar os lançamentos que compõem o valor.</div>
 </section><aside class="dre-right"><div class="dre-result"><div><small>RESULTADO DO PERÍODO</small><b>${brl(s.result)}</b></div><div><small>MARGEM DE RESULTADO</small><b>${margin.toLocaleString('pt-BR',{maximumFractionDigits:2})}%</b></div></div>
 <div class="dre-side-panel"><h3>RESUMO DO PERÍODO</h3><div>Receita líquida <strong>${brl(s.net)}</strong></div><div>CMV <strong>${brl(s.cmv)}</strong></div><div>Despesas <strong>${brl(s.expenses)}</strong></div><div class="highlight">Resultado <strong>${brl(s.result)}</strong></div></div>
 <div class="dre-side-panel" id="dre-monthly"><h3>▥ &nbsp; COMPARATIVO MENSAL (RESULTADO)</h3><div class="table-head">MÊS/ANO <strong>RESULTADO (R$)</strong></div>${monthly.map(m=>`<div class="${m.selected?'highlight':''}">${m.label}${m.selected?' (SELECIONADO)':''}<strong>${brl(m.result)}</strong></div>`).join('')}</div></aside></div>
 </div><div id="dre-wait" style="display:${state.searched?'none':'block'};text-align:center;padding:42px 12px;color:#5b7494;background:white;border:1px solid #d2e0f1;border-radius:7px;margin-top:14px">SELECIONE O MÊS E O ANO E CLIQUE EM PESQUISAR PARA EXIBIR O RESULTADO.</div><p class="dre-caution" style="display:${state.searched?'block':'none'}">DRE gerencial parcial: somente vendas baixadas, custos históricos disponíveis e despesas com competência/classificação registrada. ${missing?`${missing} itens não possuem custo histórico. `:''}Estornos financeiros, folha e impostos ainda exigem conciliação específica; trocas incluem somente o acerto líquido registrado. Valores ausentes não significam necessariamente zero.</p>
 <div class="backrow noprint"><button id="dre-back">← VOLTAR</button></div></main>`;
 document.getElementById('dre-filter').onclick=()=>{const y=Number(document.getElementById('dre-year-select').value),m=document.getElementById('dre-month-select').value;state.year=y;state.month=m;state.from=m==='all'?y+'-01-01':y+'-'+String(Number(m)).padStart(2,'0')+'-01';state.to=m==='all'?y+'-12-31':y+'-'+String(Number(m)).padStart(2,'0')+'-'+String(new Date(y,Number(m),0).getDate()).padStart(2,'0');state.searched=true;view()};
 for(const id of ['dre-month-select','dre-year-select'])document.getElementById(id).addEventListener('change',()=>{state.searched=false;document.getElementById('dre-results').style.display='none';document.getElementById('dre-wait').style.display='block';document.querySelector('.dre-caution').style.display='none'});
 document.getElementById('dre-print').onclick=()=>{if(!state.searched){alert('Pesquise o DRE antes de imprimir.');return;}openDrePrint()};
 const dreToolbar=document.querySelector('.dre-v722 .dre-toolbar');
 const removeShortcuts=()=>{if(!dreToolbar)return;dreToolbar.querySelectorAll('button').forEach(b=>{if(/ATALHOS/i.test(b.textContent||''))b.remove()})};
 removeShortcuts();
 if(dreToolbar){const observer=new MutationObserver(removeShortcuts);observer.observe(dreToolbar,{childList:true,subtree:true});}
 document.getElementById('dre-back').onclick=()=>{if(typeof category==='function')category('RELATÓRIOS');else if(typeof open==='function')open('RELATÓRIOS')};
 document.querySelectorAll('[data-dre-kind],[data-dre-category]').forEach(tr=>tr.onclick=()=>detail(rows,tr.dataset.dreKind,tr.dataset.dreCategory));
}
function openDrePrint(){
 const all=collect().records;
 const rows=all.filter(r=>period(r.date,state.from,state.to));
 const s=summary(rows), margin=s.net?s.result/s.net*100:0;
 const months=['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
 const monthLabel=state.month==='all'?'ANO COMPLETO':months[Number(state.month)-1];
 const monthly=months.map((m,i)=>({label:m+'/'+state.year,value:summary(all.filter(r=>r.date.slice(0,7)===state.year+'-'+String(i+1).padStart(2,'0'))).result}));
 const user=(document.querySelector('[data-usuario-logado]')?.textContent||document.querySelector('#usuarioLogado')?.textContent||'LUCAS').trim();
 const line=(label,value,cls='')=>`<div class="line ${cls}"><span>${esc(label)}</span><b>${brl(value)}</b></div>`;
 const expenses=[...new Set(rows.filter(r=>r.kind==='DESPESA').map(r=>r.category||'Outras despesas'))].map(cat=>line(cat,-rows.filter(r=>r.kind==='DESPESA'&&(r.category||'Outras despesas')===cat).reduce((a,r)=>a+r.amount,0))).join('');
 const documentHtml=(landscape)=>`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
 @page{size:A4 ${landscape?'landscape':'portrait'};margin:9mm}*{box-sizing:border-box}html,body{margin:0;background:#fff;color:#102b4e;font:10px Arial,sans-serif}body{padding:14px}.sheet{max-width:100%;margin:auto}.top{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #174778;padding:2px 3px 10px}.brand{font-size:21px;font-weight:900;color:#103b70}.small{font-size:9px;font-weight:400}.shop{text-align:right;font-size:13px;font-weight:800}.heading{margin:12px 0;background:#eef5ff;text-align:center;padding:12px 5px;border-radius:5px}.heading h1{margin:0;font-size:19px}.heading small{letter-spacing:1.3px}.meta{display:flex;justify-content:space-between;gap:6px;padding:10px 8px;border:1px solid #c8d9ee;border-radius:5px;margin-bottom:10px;font-size:10px}.metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin-bottom:12px}.metric{background:#e8f3ff;border-radius:6px;padding:9px 6px;min-height:51px}.metric.red{background:#ffe9e9;color:#a51414}.metric.gold{background:#fff2d4;color:#825000}.metric span{display:block;font-size:9px;font-weight:bold}.metric b{display:block;font-size:13px;margin-top:7px}.columns{display:grid;grid-template-columns:1.7fr 1fr;gap:10px}.section-title{background:#154777;color:white;font-size:11px;font-weight:bold;padding:8px;border-radius:4px}.line{display:flex;justify-content:space-between;gap:8px;padding:6px 7px;border-bottom:1px solid #d9e4f1;break-inside:avoid}.line b{white-space:nowrap}.line.group,.line.total{background:#dcecff;font-weight:bold}.line.result{background:#103b70;color:#fff;font-weight:bold;font-size:12px;margin-top:8px;border-radius:4px}.line.result b{color:#a8f5b5}.side{border:1px solid #d0deee;border-radius:6px;padding:6px;margin-bottom:9px;break-inside:avoid}.side h2{background:#e0edff;color:#103b70;padding:7px;margin:0;font-size:11px}.margin{font-size:18px;font-weight:bold;text-align:center;color:${s.result<0?'#c12b2b':'#078334'};padding:12px}.month-row{display:flex;justify-content:space-between;border-bottom:1px solid #d8e4f1;padding:4px 6px}.month-row.active{background:#dcecff;font-weight:bold}.chart{height:90px;display:flex;align-items:end;gap:4px;border-bottom:1px solid #9eb5d0;margin:10px 5px 16px}.chartbar{flex:1;text-align:center;font-size:8px}.chartbar i{display:block;margin:auto auto 4px;width:65%;background:#1e67ac;min-height:2px}.chartbar.active i{background:#09833a}.footer{border-top:1px solid #9ab2cc;margin-top:20px;padding:12px 4px 0;display:flex;justify-content:space-between;align-items:end;gap:10px;font-size:9px}.sign{text-align:center;border-top:1px solid #4e6380;padding-top:4px;min-width:130px}.note{font-size:8px;color:#65758a;margin-top:8px}@media print{body{padding:0} .sheet{width:100%} .side,.line,.metric{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
 </style></head><body><div class="sheet"><div class="top"><div><div class="brand">LUCAS LIMA</div><div class="small">SISTEMA DE GESTÃO EMPRESARIAL</div></div><div class="shop">LOJA: 01 – MATRIZ<div class="small">DOCE ENCANTO TRUFAS E DOCES</div></div></div><div class="heading"><h1>DRE – DEMONSTRATIVO DO RESULTADO</h1><small>DEMONSTRAÇÃO GERENCIAL DO RESULTADO</small></div><div class="meta"><b>PERÍODO: ${monthLabel}/${state.year}</b><b>REGIME: COMPETÊNCIA</b><b>USUÁRIO: ${esc(user)}</b></div><div class="metrics"><div class="metric"><span>RECEITA BRUTA</span><b>${brl(s.gross)}</b></div><div class="metric red"><span>DESCONTOS LÍQUIDOS (-)</span><b>${brl(s.ded)}</b></div><div class="metric red"><span>TROCAS / ESTORNOS*</span><b>Não conciliado</b></div><div class="metric gold"><span>CMV</span><b>${brl(s.cmv)}</b></div><div class="metric red"><span>DESPESAS</span><b>${brl(s.expenses)}</b></div></div><div class="columns"><section><div class="section-title">DESCRIÇÃO <span style="float:right">VALOR (R$)</span></div>${line('RECEITAS OPERACIONAIS',s.gross,'group')}${line('Vendas realizadas',s.gross)}${line('Acréscimos / descontos líquidos',-s.ded)}${line('Receita líquida',s.net,'total')}${line('CUSTO DAS VENDAS (CMV)',-s.cmv,'group')}${line('Custo dos produtos vendidos',-s.cmv)}${line('DESPESAS OPERACIONAIS',-s.expenses,'group')}${expenses||line('Nenhuma despesa classificada',0)}${line('Total das despesas',-s.expenses,'total')}${line('RESULTADO DO PERÍODO',s.result,'result')}</section><section><div class="side"><h2>RESUMO DO PERÍODO</h2>${line('Receita líquida',s.net)}${line('CMV',s.cmv)}${line('Despesas',s.expenses)}${line('Resultado',s.result,'total')}</div><div class="side"><h2>MARGEM DE RESULTADO</h2><div class="margin">${margin.toLocaleString('pt-BR',{maximumFractionDigits:2})}%</div></div><div class="side"><h2>COMPARATIVO MENSAL (RESULTADO)</h2>${monthly.map((m,i)=>`<div class="month-row ${state.month!=='all'&&Number(state.month)===i+1?'active':''}"><span>${m.label}</span><b>${brl(m.value)}</b></div>`).join('')}</div></section></div><div class="side"><h2>EVOLUÇÃO DO RESULTADO — ${state.year}</h2><div class="chart">${monthly.map((m,i)=>`<div class="chartbar ${state.month!=='all'&&Number(state.month)===i+1?'active':''}"><i style="height:${Math.max(2,Math.round(Math.abs(m.value)/Math.max(1,...monthly.map(x=>Math.abs(x.value)))*65))}px;background:${m.value<0?'#bd3838':''}"></i>${months[i]}</div>`).join('')}</div></div><div class="note">* DRE gerencial parcial. Trocas, estornos, folha e impostos podem não estar conciliados; valores ausentes não representam necessariamente zero.</div><div class="footer"><span>LUCAS LIMA — LOJA 01 – MATRIZ</span><span class="sign">ASSINATURA / CARIMBO</span><span>EMITIDO EM ${new Date().toLocaleDateString('pt-BR')}, POR ${esc(user)}.</span></div></div></body></html>`;
 const overlay=document.createElement('div');overlay.id='dre-print-modal';overlay.style.cssText='position:fixed;inset:0;z-index:999999;background:#061c3bbd;display:flex;align-items:center;justify-content:center;padding:18px;font-family:Arial,sans-serif';
 overlay.innerHTML=`<div style="background:white;border-radius:12px;width:min(1250px,98vw);height:min(740px,94vh);display:flex;flex-direction:column;overflow:hidden"><header style="background:#20558e;color:white;padding:17px 20px;font-size:18px;font-weight:bold">IMPRIMIR DRE — DEMONSTRATIVO DO RESULTADO <button id="dre-modal-x" style="float:right;background:none;color:white;border:0;font-size:24px;cursor:pointer">×</button></header><div style="display:grid;grid-template-columns:minmax(240px,38%) minmax(0,62%);gap:12px;padding:12px;flex:1;min-height:0"><div style="border:1px solid #c9d9f1;padding:13px;overflow:auto;border-radius:5px;color:#133e77"><h3 style="background:#e0ecfc;padding:12px;margin:0 0 15px">DADOS DO DRE SELECIONADO</h3><p><b>PERÍODO:</b> ${monthLabel}/${state.year}</p><p><b>RECEITA BRUTA:</b> ${brl(s.gross)}</p><p><b>DESCONTOS LÍQUIDOS:</b> ${brl(s.ded)}</p><p><b>CMV:</b> ${brl(s.cmv)}</p><p><b>DESPESAS:</b> ${brl(s.expenses)}</p><p><b>RESULTADO:</b> ${brl(s.result)}</p><h3 style="background:#e0ecfc;padding:12px">TIPO DE IMPRESSÃO</h3><label style="display:block;margin:12px 0"><input type="radio" name="dre-orientation" value="portrait" checked> A4 — RETRATO</label><label><input type="radio" name="dre-orientation" value="landscape"> A4 — PAISAGEM</label></div><div style="border:1px solid #c9d9f1;background:#f2f6ff;padding:12px;display:flex;flex-direction:column;min-width:0;min-height:0"><h3 id="dre-preview-title" style="background:#e0ecfc;text-align:center;padding:10px;margin:0 0 10px;color:#123e75">PRÉ-VISUALIZAÇÃO A4 — RETRATO</h3><div style="flex:1;min-height:0;overflow:auto;background:#dce5f0;display:flex;justify-content:center;padding:10px"><iframe id="dre-preview" title="Pré-visualização do DRE" style="background:white;border:0;width:100%;height:100%;min-height:430px"></iframe></div></div></div><footer style="padding:14px 20px;border-top:1px solid #d6e3f3;display:flex;justify-content:flex-end;gap:10px"><button id="dre-modal-print" style="background:#1263dc;color:white;border:0;border-radius:5px;padding:12px 22px;font-weight:bold;cursor:pointer">IMPRIMIR</button><button id="dre-modal-save" style="background:#009d76;color:white;border:0;border-radius:5px;padding:12px 22px;font-weight:bold;cursor:pointer">SALVAR</button><button id="dre-modal-close" style="background:#e4eeff;color:#17467c;border:0;border-radius:5px;padding:12px 22px;font-weight:bold;cursor:pointer">FECHAR</button></footer></div>`;
 document.body.appendChild(overlay);
 const frame=overlay.querySelector('#dre-preview');let orientation='portrait';
 const refresh=()=>{frame.srcdoc=documentHtml(orientation==='landscape');overlay.querySelector('#dre-preview-title').textContent='PRÉ-VISUALIZAÇÃO A4 — '+(orientation==='landscape'?'PAISAGEM':'RETRATO')};refresh();
 overlay.querySelectorAll('[name="dre-orientation"]').forEach(r=>r.onchange=()=>{orientation=r.value;refresh()});
 const close=()=>overlay.remove();overlay.querySelector('#dre-modal-close').onclick=close;overlay.querySelector('#dre-modal-x').onclick=close;
 const print=()=>{if(frame.contentWindow)frame.contentWindow.print()};overlay.querySelector('#dre-modal-print').onclick=print;
 overlay.querySelector('#dre-modal-save').onclick=async()=>{
  const btn=overlay.querySelector('#dre-modal-save');btn.disabled=true;
  try{
    const landscape=orientation==='landscape', W=landscape?297:210,H=landscape?210:297,scale=4;
    const canvas=document.createElement('canvas');canvas.width=W*scale;canvas.height=H*scale;
    const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas indisponível');
    const pages=[];const m=12;let y=0;
    const draw=(txt,x,yy,size=3.1,bold=false,color='#173e72')=>{ctx.fillStyle=color;ctx.font=(bold?'bold ':'')+(size*scale)+'px Arial';ctx.textBaseline='top';ctx.fillText(String(txt),x*scale,yy*scale)};
    const rect=(x,yy,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x*scale,yy*scale,w*scale,h*scale)};
    const page=()=>{rect(0,0,W,H,'#fff');y=12;draw('LUCAS LIMA',m,y,5.5,true);draw('LOJA: 01 - MATRIZ',W-67,y,3.2,true);y+=10;rect(m,y,W-2*m,.5,'#1c528e');y+=5;rect(m,y,W-2*m,12,'#e4efff');draw('DRE - DEMONSTRATIVO DO RESULTADO',m+3,y+3,4.4,true);y+=18;draw('PERIODO: '+monthLabel+'/'+state.year+'   |   REGIME: COMPETENCIA   |   USUARIO: '+user,m,y,2.8);y+=12};
    const savePage=()=>{const bin=atob(canvas.toDataURL('image/jpeg',.92).split(',')[1]);const b=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)b[i]=bin.charCodeAt(i);pages.push(b)};
    const need=(h)=>{if(y+h>H-15){savePage();page()}};
    const line=(name,value,head=false)=>{need(9);if(head)rect(m,y,W-2*m,8,'#dceaff');draw(name,m+2,y+2,3.1,head);draw(brl(value),W-47,y+2,3.1,true);y+=9};
    page();line('RECEITA BRUTA',s.gross,true);line('Descontos e acrescimos liquidos',-s.ded);line('RECEITA LIQUIDA',s.net,true);line('CUSTO DAS VENDAS (CMV)',s.cmv,true);line('DESPESAS OPERACIONAIS',s.expenses,true);
    for(const cat of [...new Set(rows.filter(r=>r.kind==='DESPESA').map(r=>r.category||'Outras despesas'))])line(cat,rows.filter(r=>r.kind==='DESPESA'&&(r.category||'Outras despesas')===cat).reduce((a,r)=>a+r.amount,0));
    line('RESULTADO DO PERIODO',s.result,true);need(17);y+=5;draw('MARGEM DE RESULTADO: '+margin.toLocaleString('pt-BR',{maximumFractionDigits:2})+'%',m,y,3.5,true);y+=12;
    need(20);draw('COMPARATIVO MENSAL - '+state.year,m,y,3.8,true);y+=8;
    for(const item of monthly){need(7);draw(item.label,m+2,y,2.9);draw(brl(item.value),W-47,y,2.9);y+=7}
    need(15);y+=5;draw('Emitido em '+new Date().toLocaleDateString('pt-BR')+', por '+user+'.',m,y,2.6);
    savePage();
    const enc=new TextEncoder(),parts=[],offsets=[0];let len=0;
    const add=v=>{const b=typeof v==='string'?enc.encode(v):v;parts.push(b);len+=b.length};
    const obj=(n,v)=>{offsets[n]=len;add(n+' 0 obj\n'+v+'\nendobj\n')};
    add('%PDF-1.4\n');obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,'<< /Type /Pages /Kids ['+pages.map((_,i)=>(3+i*3)+' 0 R').join(' ')+'] /Count '+pages.length+' >>');
    const pw=W*72/25.4,ph=H*72/25.4;
    pages.forEach((jpeg,i)=>{const pn=3+i*3,im=pn+1,ct=pn+2;obj(pn,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+pw+' '+ph+'] /Resources << /XObject << /Im'+i+' '+im+' 0 R >> >> /Contents '+ct+' 0 R >>');offsets[im]=len;add(im+' 0 obj\n<< /Type /XObject /Subtype /Image /Width '+canvas.width+' /Height '+canvas.height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpeg.length+' >>\nstream\n');add(jpeg);add('\nendstream\nendobj\n');const cmd='q '+pw+' 0 0 '+ph+' 0 0 cm /Im'+i+' Do Q\n';obj(ct,'<< /Length '+enc.encode(cmd).length+' >>\nstream\n'+cmd+'endstream')});
    const xref=len;add('xref\n0 '+(3+pages.length*3)+'\n0000000000 65535 f \n');for(let i=1;i<3+pages.length*3;i++)add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');add('trailer\n<< /Size '+(3+pages.length*3)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF');
    const blob=new Blob(parts,{type:'application/pdf'}),filename='DRE_'+state.year+'_'+monthLabel.replace(/[^A-Z]/g,'')+'.pdf';
    if(typeof window.showSaveFilePicker==='function'){
      try{const handle=await window.showSaveFilePicker({suggestedName:filename,types:[{description:'Documento PDF',accept:{'application/pdf':['.pdf']}}]});const writer=await handle.createWritable();await writer.write(blob);await writer.close();return}catch(e){if(e.name==='AbortError')return;throw e}
    }
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
  }catch(e){alert('Não foi possível salvar o PDF: '+e.message)}finally{btn.disabled=false}
};
}
function line(kind,name,value){return `<tr class="clickable" data-dre-kind="${kind}"><td>${name}</td><td>${brl(value)}</td></tr>`}function total(name,value){return `<tr class="total"><td>${name}</td><td>${brl(value)}</td></tr>`}
function openDreOrigin(record){
 if(!record)return;
 const saved={...state,detailKind:document.querySelector('#dre-detail h3')?.textContent||''};
 let ok=false;
 if(record.originType==='CENTRO')ok=!!window.LLopenCostFromDRE?.(record.id);
 else if(record.originType==='PAGAR')ok=!!window.LLopenPayableFromDRE?.(record.id);
 else if(record.originType==='TROCA')ok=!!window.LLopenTradeFromDRE?.(record.id);
 else if(record.source==='VENDAS')ok=!!window.LLopenSaleFromDRE?.(record.id);
 else if(record.originType==='MOVIMENTO'){
  // A visão geral não possui editor de movimento por ID. Não abrir um documento diferente.
  alert('ESTE MOVIMENTO FINANCEIRO NÃO POSSUI TELA INDIVIDUAL DE EDIÇÃO.');return;
 }
 if(!ok){alert('NÃO FOI POSSÍVEL LOCALIZAR O DOCUMENTO DE ORIGEM Nº '+record.id+'.');return;}
 window.LL_dreReturnState=saved;
 const sourceRoot=typeof root==='function'?root():document.getElementById('app');
 if(sourceRoot){const bar=document.createElement('div');bar.id='dre-return-source';bar.style.cssText='display:flex;justify-content:flex-end;padding:8px 14px';bar.innerHTML='<button type="button" style="background:#e93048;color:#fff;border:0;border-radius:5px;padding:11px 22px;font-weight:bold;cursor:pointer">← VOLTAR AO DRE</button>';bar.querySelector('button').onclick=()=>window.LLreturnToDRE();sourceRoot.prepend(bar);}
 // Voltar das telas de origem retorna ao DRE sem perder os filtros e o detalhamento.
}
function detail(rows,kind,category){
 const selected=rows.filter(r=>category?r.kind==='DESPESA'&&r.category===category:r.kind===kind),target=document.getElementById('dre-detail');
 target.innerHTML=`<h3>DETALHAMENTO — ${esc(category||kind)}</h3><table><thead><tr><th>DATA</th><th>DESCRIÇÃO</th><th>ORIGEM</th><th>VALOR</th></tr></thead><tbody>${selected.map((r,i)=>`<tr data-dre-origin="${i}" title="DUPLO CLIQUE PARA ABRIR O LANÇAMENTO" style="cursor:pointer"><td>${esc(r.date)}</td><td>${esc(r.description)}</td><td>${esc(r.source)} #${esc(r.id)}</td><td>${brl(r.amount)}</td></tr>`).join('')||'<tr><td colspan="4">Nenhum lançamento encontrado.</td></tr>'}</tbody></table>`;
 target.querySelectorAll('[data-dre-origin]').forEach(tr=>tr.ondblclick=()=>openDreOrigin(selected[Number(tr.dataset.dreOrigin)]));
}

function compare(rows){const groups={};for(const r of rows){const m=r.date.slice(0,7);(groups[m]??=[]).push(r)}const entries=Object.entries(groups).sort(([a],[b])=>a.localeCompare(b));const max=Math.max(1,...entries.map(([,r])=>Math.abs(summary(r).result)));return `<h2>COMPARATIVO MENSAL</h2><div class="chart">${entries.map(([m,r])=>`<div class="bar"><div title="${brl(summary(r).result)}" style="height:${Math.max(2,Math.round(Math.abs(summary(r).result)/max*125))}px;background:${summary(r).result<0?'#ba4a4a':'#2b79be'}"></div><small>${esc(m)}</small></div>`).join('')||'<span>Sem dados no período.</span>'}</div><table><thead><tr><th>MÊS</th><th>RECEITA LÍQUIDA</th><th>CMV</th><th>DESPESAS</th><th>RESULTADO</th></tr></thead><tbody>${entries.map(([m,r])=>{const x=summary(r);return `<tr><td>${esc(m)}</td><td>${brl(x.net)}</td><td>${brl(x.cmv)}</td><td>${brl(x.expenses)}</td><td>${brl(x.result)}</td></tr>`}).join('')}</tbody></table>`;}
function exportCsv(rows){const lines=[['DATA','TIPO','CATEGORIA','DESCRIÇÃO','ORIGEM','NÚMERO','VALOR'],...rows.map(r=>[r.date,r.kind,r.category||'',r.description,r.source,r.id,r.amount.toFixed(2).replace('.',',')])];const csv='\ufeff'+lines.map(a=>a.map(x=>'"'+String(x??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='ERP_SYSTEMS_DRE_'+(state.from||'inicio')+'_'+(state.to||'fim')+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}
window.LLreturnToDRE=()=>{if(!window.LL_dreReturnState)return false;Object.assign(state,window.LL_dreReturnState);delete window.LL_dreReturnState;view();return true};
const previous=window.open;window.open=function(name){if(name==='DRE')return view();return previous(name)};
})();
