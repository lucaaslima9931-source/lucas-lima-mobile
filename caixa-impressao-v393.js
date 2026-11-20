/* LUCAS LIMA V393 — somente a impressão do Caixa; não altera movimentos financeiros. */
(()=>{'use strict';
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v??'').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
const money=v=>Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const date=v=>{const d=new Date(v);return Number.isNaN(+d)?'—':d.toLocaleDateString('pt-BR')};
const time=v=>{const d=new Date(v);return Number.isNaN(+d)?'—':d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})};
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
const typeOf=f=>{const n=norm((f.tipo||'')+' '+(f.descricao||''));return /DINHEIRO|ESPECIE/.test(n)?'DINHEIRO':/BOLETO|CARNE/.test(n)?'BOLETO':/DEBITO/.test(n)?'DEBITO':/PIX/.test(n)?'PIX':/CREDITO/.test(n)?'CREDITO':'OUTROS'};
const rank={DINHEIRO:0,BOLETO:1,DEBITO:2,PIX:3,CREDITO:4,OUTROS:5};
function operator(){
 // Mesmo nome exibido no cabeçalho do sistema e usado pelos outros módulos.
 let session=null;try{session=JSON.parse(sessionStorage.getItem('erp_systems_demo_session')||'null')}catch{}
 const displayed=document.querySelector('.top-user strong')?.textContent?.trim();
 const name=window.LucasLimaAuditoria?.usuarioAtual?.()||window.LUCAS_LIMA_USUARIO_ATUAL||window.usuarioLogado?.nome||displayed||session?.nome||session?.name;
 const value=String(name||'').trim();
 return value&&!/^(USUÁRIO|USUARIO|USUÁRIO NÃO IDENTIFICADO)$/i.test(value)?value.toUpperCase():'USUÁRIO NÃO IDENTIFICADO';
}
function lookupOperator(value,cash){
 const key=String(value??'').trim();if(!key)return '—';
 if(key==='300')return 'USUÁRIO DE DEMONSTRAÇÃO';
 const clean=v=>{const n=String(v??'').trim();return n&&!/^\d+$/.test(n)&&!/^USU[AÁ]RIO (?:DE DEMONSTRA[CÇ][AÃ]O|N[AÃ]O IDENTIFICADO)$/i.test(n)?n:''};
 const saved=[cash?.operadorNome,cash?.nomeOperador,cash?.criadoPor,cash?.usuarioAbertura,cash?.abertoPor].map(clean).find(Boolean);if(saved)return saved;
 const stored=read('erp_matriz_usuarios_v1',[]);
 const users=Array.isArray(stored)?stored:(stored?.usuarios||stored?.items||[]);
 const match=(Array.isArray(users)?users:[]).find(u=>[u.id,u.codigo,u.usuario,u.login].some(x=>x!=null&&String(x).trim()===key));
 const named=clean(match?.nome||match?.nomeCompleto||match?.name||match?.login);if(named)return named;
 const session=(()=>{try{return JSON.parse(sessionStorage.getItem('erp_systems_demo_session')||'null')}catch{return null}})();
 if(session&&[session.id,session.codigo,session.usuario,session.login].some(x=>x!=null&&String(x).trim()===key)){
  const name=clean(session.nome||session.name)||clean(document.querySelector('.top-user strong')?.textContent);
  if(name)return name;
 }
 return key;
}
function collection(key,field){const d=read(key,[]);return Array.isArray(d)?d:(Array.isArray(d?.[field])?d[field]:[])}
function saleNumber(m){
 const explicit=[m.vendaNumero,m.numeroVenda,m.venda,m.origemVenda,m.vendaOrigem];
 for(const x of explicit){if(x!=null&&String(x).trim()&&Number(x)>0)return String(Number(x))}
 const ref=String(m.ref||'');let match=ref.match(/^VENDA:(\d+):/i);if(match)return String(Number(match[1]));
 const carne=String(m.codigoCarne||'').match(/^V(\d+)-/i);if(carne)return String(Number(carne[1]));
 // Somente referências explícitas a vendas, nunca o número de troca ou sangria.
 const desc=String(m.descricao||'');match=desc.match(/\bVENDA\s*(?:N[º°.]?\s*)?#?\s*0*(\d+)\b/i);
 if(match)return String(Number(match[1]));
 if(m.trocaNumero!=null){const t=collection('erp_matriz_trocas_v1','trocas').find(t=>String(Number(t.numero))===String(Number(m.trocaNumero)));if(t?.venda)return String(Number(t.venda))}
 const tr=ref.match(/^TROCA:(\d+):/i);if(tr){const t=collection('erp_matriz_trocas_v1','trocas').find(t=>String(Number(t.numero))===String(Number(tr[1])));if(t?.venda)return String(Number(t.venda))}
 return null;
}
function saleRecord(n){return n?collection('erp_matriz_vendas_v1','vendas').find(v=>String(Number(v.numero))===String(Number(n))):null}
function saleClient(v){
 if(!v)return '';
 const explicit=String(v.clienteNome||v.nomeCliente||v.cliente||'').trim();
 if(explicit&&!/^SELECIONE$/i.test(explicit)&&!/^\d+$/.test(explicit))return explicit;
 const id=v.clienteId||v.clienteCodigo||v.cliente;
 if(id==null)return '';
 const customers=collection('erp_matriz_clientes_v1','clientes');
 const c=customers.find(x=>[x.id,x.codigo].some(k=>String(k??'')===String(id)));
 return String(c?.nome||c?.razao||c?.nomeFantasia||'').trim();
}
function saleNumberForPayment(m,match){return saleNumber(m)||match?.[1]||null}
function paymentIdentifier(m){
 const direct=m.identificacaoPagamento||m.identificacao||m.identificador||m.nsu||m.referenciaPagamento||m.refPagamento;
 if(String(direct??'').trim())return String(direct).trim();
 const ref=String(m.ref||'');
 const match=ref.match(/^VENDA:(\d+):(\d+):/);
 const saleNumber=saleNumberForPayment(m,match);
 if(saleNumber!=null){
  const sales=read('erp_matriz_vendas_v1',[]);
  const sale=(Array.isArray(sales)?sales:(sales.vendas||[])).find(v=>String(Number(v.numero))===String(Number(saleNumber)));
  if(sale){
   const payments=sale.pagamentos||[];
   let pay=match?payments[Number(match[2])]:null;
   if(!pay){const same=payments.filter(p=>String(p.forma)===String(m.formaId)||norm(p.descricao)===norm(m.forma)||norm(p.forma)===norm(m.forma));if(same.length===1)pay=same[0]}
   if(pay?.identificacaoPagamento)return String(pay.identificacaoPagamento);
  }
 }
 const tr=String(m.ref||'').match(/^TROCA:(\d+):(\d+)/);
 if(tr){const trades=read('erp_matriz_trocas_v1',[]);const trade=(Array.isArray(trades)?trades:[]).find(t=>String(t.numero)===tr[1]);const id=trade?.pagamentos?.[Number(tr[2])]?.identificacaoPagamento;if(id)return String(id)}
 return '—';
}
function build(c,start,end){
 const stored=read('erp_matriz_formas_pagamento_v1',{});const forms=(Array.isArray(stored)?stored:(stored.formas||[])).filter(f=>f.ativo!==false&&norm(f.situacao||'ATIVO')!=='INATIVO').map(f=>({...f,kind:typeOf(f),name:String(f.descricao||f.tipo||'').trim()})).filter(f=>f.name).sort((a,b)=>rank[a.kind]-rank[b.kind]||a.name.localeCompare(b.name,'pt-BR'));
 const groups=forms.map(f=>({id:String(f.id),kind:f.kind,name:f.name,items:[]}));
 if(!groups.some(g=>g.kind==='DINHEIRO'))groups.unshift({id:'fallback-dinheiro',kind:'DINHEIRO',name:'DINHEIRO',items:[]});
 const unknown=new Map();
 // Na impressão, lançamentos baixados e posteriormente cancelados são informativos:
 // o original recebe X e valor zero; o estorno correspondente não entra nos totais.
 // O livro-caixa real permanece intacto.
 const canceled={
  entrada:new Set(collection('lucas_lima_caixa_entradas_v1','entradas').filter(x=>norm(x.status)==='CANCELADA').map(x=>String(x.id))),
  saida:new Set(collection('lucas_lima_cc_lancamentos_v2','despesas').filter(x=>norm(x.status)==='CANCELADA').map(x=>String(x.id))),
  sangria:new Set(collection('lucas_lima_caixa_sangrias_v1','sangrias').filter(x=>norm(x.status)==='CANCELADA').map(x=>String(x.id)))
 };
 const rawMoves=(c?.movimentos||[]).filter(m=>{const d=String(m.data||'').slice(0,10);return (!start||d>=start)&&(!end||d<=end)});
 const isCanceledOriginal=m=>
  (m.entradaId!=null&&canceled.entrada.has(String(m.entradaId)))||
  (m.ccLancamentoId!=null&&canceled.saida.has(String(m.ccLancamentoId)))||
  (m.sangriaId!=null&&canceled.sangria.has(String(m.sangriaId)));
 const isCanceledReversal=m=>
  (m.estornoEntradaId!=null&&canceled.entrada.has(String(m.estornoEntradaId)))||
  (m.estornoCcLancamentoId!=null&&canceled.saida.has(String(m.estornoCcLancamentoId)))||
  (m.estornoSangriaId!=null&&canceled.sangria.has(String(m.estornoSangriaId)));
 const moves=rawMoves.filter(m=>isCanceledOriginal(m)||(!m.estornado&&!isCanceledReversal(m)));
 const find=m=>{const id=String(m.formaId??'');if(id){const g=groups.find(g=>g.id===id);if(g)return g}const name=norm(m.forma||m.tipoForma);let g=groups.find(g=>norm(g.name)===name);if(g)return g;const kind=typeOf({tipo:m.tipoForma||m.forma});if(kind==='DINHEIRO')return groups.find(g=>g.kind==='DINHEIRO');if(kind!=='OUTROS'){const same=groups.filter(g=>g.kind===kind);if(same.length===1)return same[0]}if(!name)return null;if(!unknown.has(name))unknown.set(name,{id:'extra-'+name,kind:'OUTROS',name:String(m.forma||m.tipoForma),items:[]});return unknown.get(name)};
 for(const m of moves){const g=find(m);if(!g)continue;const category=norm(m.categoria),description=norm(m.descricao),kind=norm(m.tipo);let code='E';if(/ACERTO/.test(category+' '+description))code='U';else if(/CANCEL/.test(category+' '+description))code='X';else if(/ESTORNO/.test(category+' '+description))code='O';else if(/SANGRIA/.test(category+' '+description))code='S';else if(/DESPESA/.test(category+' '+description))code='D';else if(/TROCA/.test(category+' '+description))code='T';else if(/RECEBIMENTO|PARCELA|CARNE/.test(category+' '+description))code='R';else if(/VENDA/.test(category+' '+description))code='V';else if(kind==='SAIDA')code='D';const amount=Number(m.valor||0);if(!Number.isFinite(amount)||amount<0)continue;
 const sale=saleNumber(m);
 const client=String(m.clienteNome||m.nomeCliente||m.cliente||'').trim()||saleClient(saleRecord(sale));
 const label=code==='V'&&client?client:String(m.descricao||m.categoria||'MOVIMENTAÇÃO');
 g.items.push({operator:lookupOperator(m.usuario||m.operador||c?.operador),sale:sale?String(sale).padStart(6,'0'):'—',ident:paymentIdentifier(m),code:isCanceledOriginal(m)?'X':code,label,when:m.data,amount:isCanceledOriginal(m)?0:amount,entry:kind==='ENTRADA',informativo:!!m.naoFinanceiro||kind==='INFORMATIVO',cancelamentoInformativo:!!m.cancelamentoInformativo,cancelado:isCanceledOriginal(m)});
 }
 const all=[...groups,...unknown.values()].filter(g=>g.items.length).sort((a,b)=>rank[a.kind]-rank[b.kind]||a.name.localeCompare(b.name,'pt-BR'));
 let totalIn=0,totalOut=0;const paid={DINHEIRO:0,BOLETO:0,DEBITO:0,PIX:0,CREDITO:0,OUTROS:0};
 const blocks=all.map(g=>{g.items.sort((a,b)=>Number(b.entry)-Number(a.entry)||new Date(a.when)-new Date(b.when));let ins=0,outs=0;const lines=g.items.map(m=>{if(!m.informativo){if(m.entry){ins+=m.amount;}else {outs+=m.amount;if(m.code==='S')paid[g.kind]+=m.amount}}else{paid.BOLETO+=(m.cancelamentoInformativo?-1:1)*m.amount}return `<tr><td>${safe(m.operator)}</td><td>${safe(m.sale)}</td><td>${safe(m.ident)}</td><td>${m.code}</td><td class="description">${safe(m.label)}</td><td>${date(m.when)}</td><td>${time(m.when)}</td><td class="num">${m.cancelamentoInformativo?'−':''}${money(m.amount)}</td><td class="num">${m.cancelado?money(0):m.informativo?'—':m.entry?money(m.amount):'—'}</td><td class="num">${m.cancelado?money(0):m.informativo?'—':m.entry?'—':money(m.amount)}</td></tr>`}).join('');totalIn+=ins;totalOut+=outs;return `<section class="payment"><h3>${safe(g.kind==='BOLETO'?'CARNÊ (SOMENTE CONSULTA)':g.name)}</h3><table><colgroup><col style="width:9%"><col style="width:8%"><col style="width:11%"><col style="width:3%"><col style="width:24%"><col style="width:9%"><col style="width:6%"><col style="width:10%"><col style="width:10%"><col style="width:10%"></colgroup><thead><tr>${['USUÁRIO','Nº VENDA','IDENTIFICAÇÃO','T','CLIENTE / DESCRIÇÃO','DATA PAG.','HORA','VALOR PAGO','ENTRADA','SAÍDA'].map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${lines}</tbody></table><div class="totals"><div>ENTRADAS: <strong>${money(ins)}</strong></div><div>SAÍDAS: <strong>${money(outs)}</strong></div></div></section>`});
 const paymentSummary=[['DINHEIRO',paid.DINHEIRO],['DÉBITO / CRÉDITO',paid.DEBITO+paid.CREDITO],['PIX',paid.PIX]];if(paid.OUTROS)paymentSummary.push(['OUTROS',paid.OUTROS]);paymentSummary.push(['TOTAL RECEBIDO',paymentSummary.filter(r=>r[0]!=='CARNÊ (INFORMATIVO)').reduce((s,r)=>s+r[1],0)]);
 const summary=`<div class="summaries"><section><h3>RESUMO DE PAGAMENTOS</h3><table>${paymentSummary.map(([name,value])=>`<tr><td>${safe(name)}</td><td class="num">${money(value)}</td></tr>`).join('')}</table></section><section><h3>RESUMO DO CAIXA</h3><table><tr><td>TOTAL DE ENTRADAS</td><td class="num">${money(totalIn)}</td></tr><tr><td>TOTAL DE SAÍDAS</td><td class="num">${money(totalOut)}</td></tr></table></section></div>`;
 const legend=`<div class="legend"><b>T:</b> V–Venda | O–Estorno | U–Acerto | S–Sangria | D–Despesa | T–Troca | X–Cancelamento | E–Entrada</div>`;
 const stores=read('erp_matriz_lojas_v1',{});const main=Array.isArray(stores)?stores[0]:(stores.lojas||[])[0]||{};const store=read('erp_matriz_loja',{});const legacy=read('lucas_lima_loja',{});const official=read('erp_systems_dados_loja_v1',{});const company=official.nome||official.nomeFantasia||main.nomeFantasia||main.nome||store.nomeFantasia||store.nome||legacy.nomeFantasia||legacy.nome||document.querySelector('.topbar .store-company')?.textContent?.trim()||'LOJA NÃO IDENTIFICADA';const emission=`EMITIDO EM ${new Date().toLocaleDateString('pt-BR')}, POR ${operator()}.`;
 return `<header><h2>${safe(company)}</h2><h1>IMPRESSÃO DO CAIXA</h1><div>CAIXA Nº ${safe(c?.id||'—')} | OPERADOR: ${safe(lookupOperator(c?.operador,c))} | PERÍODO: ${start?date(start+'T12:00:00'):'TODAS'} A ${end?date(end+'T12:00:00'):'TODAS'}</div></header>${blocks.join('')||'<p>NENHUMA MOVIMENTAÇÃO NO PERÍODO.</p>'}${summary}${legend}<footer>${safe(emission)}</footer>`;
}
const css=`@page{size:A4 ORIENTACAO_A4;margin:11mm 9mm}*{box-sizing:border-box}body{font:9px Arial,sans-serif;color:#111;background:#fff;margin:0}header{text-align:center;margin-bottom:15px}header h2{font-size:13px;margin:0 0 4px}header h1{font-size:16px;margin:0 0 6px}header div{font-size:9px}.payment{margin-bottom:16px}.payment h3{font-size:10px;border-bottom:1px solid #333;margin:0 0 4px;padding:4px 0}table{border-collapse:collapse;width:100%;table-layout:fixed}th,td{font-size:8px;padding:4px 3px;text-align:left;vertical-align:top;border-bottom:1px solid #ddd;overflow-wrap:anywhere}th{font-weight:bold;border-bottom:1px solid #333}thead{display:table-header-group}tr{break-inside:avoid}.num{text-align:right;white-space:nowrap}.description{white-space:normal}.totals{text-align:right;font-size:9px;margin-top:6px;padding-right:4px}.totals div{padding:2px}.totals strong{display:inline-block;min-width:90px;text-align:right}.summaries{display:grid;grid-template-columns:1fr 1fr;gap:16px;break-inside:avoid;margin-top:20px}.summaries section{border:1px solid #555;padding:9px}.summaries h3{text-align:center;font-size:10px;margin:0 0 8px}.summaries tr:last-child{font-weight:bold}.legend{text-align:center;font-size:8px;margin-top:9px;white-space:normal;break-inside:avoid}footer{text-align:right;margin-top:28px;font-size:9px;break-inside:avoid}@media print{body{color:#000}.payment{break-inside:auto}}`;
function abrir(c){if(!c){alert('NÃO HÁ CAIXA SELECIONADO PARA IMPRIMIR.');return}document.getElementById('ll-cx-print-overlay')?.remove();const root=document.createElement('div');root.id='ll-cx-print-overlay';root.style.cssText='position:fixed;inset:0;background:#071d3bb8;z-index:999999;display:flex;align-items:center;justify-content:center;padding:15px;font:13px Arial,sans-serif;color:#153d73';root.innerHTML=`<div style="width:min(1160px,98vw);height:min(90vh,800px);background:#fff;border-radius:10px;overflow:hidden;display:flex;flex-direction:column"><header style="background:#164a8c;color:#fff;padding:17px 22px;display:flex;justify-content:space-between;align-items:center;text-align:left;margin:0"><b style="font-size:17px">IMPRIMIR CAIXA</b><button data-close style="background:transparent;color:white;border:0;font-size:25px;cursor:pointer">×</button></header><div style="display:grid;grid-template-columns:minmax(265px,43%) minmax(0,57%);gap:15px;padding:16px;flex:1;min-height:0;overflow:auto"><section style="border:1px solid #c7d9ef;border-radius:7px;padding:14px"><h3 style="background:#e6f0fc;padding:12px;font-size:12px">DADOS DO CAIXA</h3><p><b>CAIXA Nº:</b> ${safe(c.id)}</p><p><b>OPERADOR:</b> ${safe(lookupOperator(c.operador,c))}</p><h3 style="background:#e6f0fc;padding:12px;font-size:12px">PERÍODO DA IMPRESSÃO</h3><label style="display:block;margin:12px 0">DATA INICIAL <input data-start type="date" style="width:100%;padding:10px;border:1px solid #b7cde8;border-radius:5px"></label><label style="display:block;margin:12px 0">DATA FINAL <input data-end type="date" style="width:100%;padding:10px;border:1px solid #b7cde8;border-radius:5px"></label><h3 style="background:#e6f0fc;padding:12px;font-size:12px">ORIENTAÇÃO</h3><label style="display:block;margin:10px 0"><input type="radio" name="ll-cx-orientation" value="portrait"> RETRATO — A4 VERTICAL</label><label style="display:block;margin:10px 0"><input type="radio" name="ll-cx-orientation" value="landscape" checked> PAISAGEM — A4 HORIZONTAL</label><p style="font-size:11px;color:#566b86">As sangrias são apresentadas pelo valor bruto, sem desconto de taxas.</p></section><section style="border:1px solid #c7d9ef;border-radius:7px;padding:14px;min-width:0;display:flex;flex-direction:column"><h3 style="background:#e6f0fc;padding:12px;font-size:12px;margin:0 0 12px">PRÉ-VISUALIZAÇÃO A4</h3><iframe data-preview title="Pré-visualização A4" style="width:100%;height:100%;min-height:390px;border:1px solid #c7d9ef;background:#fff"></iframe></section></div><div style="display:flex;gap:10px;justify-content:flex-end;padding:12px 18px;border-top:1px solid #dae5f3"><button data-print style="background:#1763ce;color:white;border:0;border-radius:5px;padding:12px 22px;font-weight:bold;cursor:pointer">IMPRIMIR</button><button data-save style="background:#07986b;color:white;border:0;border-radius:5px;padding:12px 22px;font-weight:bold;cursor:pointer">SALVAR</button><button data-close style="background:#e7f1ff;color:#16467e;border:1px solid #b7d2f2;border-radius:5px;padding:12px 22px;font-weight:bold;cursor:pointer">FECHAR</button></div></div>`;document.body.append(root);
 const start=root.querySelector('[data-start]'),end=root.querySelector('[data-end]'),frame=root.querySelector('[data-preview]'),orientations=root.querySelectorAll('[name=ll-cx-orientation]');start.value=String(c.abertura||'').slice(0,10)||new Date().toISOString().slice(0,10);end.value=new Date().toLocaleDateString('en-CA');if(end.value<start.value)end.value=start.value;
 const update=()=>{if(start.value&&end.value&&start.value>end.value){frame.srcdoc='<p>DATA INICIAL MAIOR QUE DATA FINAL.</p>';return}frame.srcdoc=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>${css.replace('ORIENTACAO_A4',root.querySelector('[name=ll-cx-orientation]:checked').value)}</style></head><body>${build(c,start.value,end.value)}</body></html>`};start.onchange=end.onchange=update;orientations.forEach(r=>r.onchange=update);root.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>root.remove());
 const print=()=>{update();frame.onload=()=>{frame.onload=null;try{frame.contentWindow.focus();frame.contentWindow.print()}catch(e){alert('NÃO FOI POSSÍVEL IMPRIMIR: '+e.message)}};};root.querySelector('[data-print]').onclick=print;root.querySelector('[data-save]').onclick=async()=>{const btn=root.querySelector('[data-save]');btn.disabled=true;try{const orient=root.querySelector('[name=ll-cx-orientation]:checked').value;const html=build(c,start.value,end.value);await window.LucasCaixaSalvarPDF(html,orient,'IMPRESSAO_CAIXA_'+new Date().toLocaleDateString('pt-BR').replaceAll('/','-')+'.pdf')}catch(e){alert('NÃO FOI POSSÍVEL SALVAR O PDF: '+e.message)}finally{btn.disabled=false}};root.onclick=e=>{if(e.target===root)root.remove()};update();}
window.LucasCaixaImpressao={abrir};
})();
