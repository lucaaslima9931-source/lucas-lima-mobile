/* LUCAS LIMA - CENTROS DE CUSTOS. Persistência local no navegador. */
(()=>{'use strict';
// Avisos exclusivos deste módulo: nunca usar alert/confirm nativos do navegador.
function ccDialog(message,ask=false){
 return new Promise(resolve=>{
  document.getElementById('cc-system-message')?.remove();
  const overlay=document.createElement('div');overlay.id='cc-system-message';
  overlay.style.cssText='position:fixed;inset:0;z-index:2147483600;background:rgba(5,25,55,.65);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';
  overlay.innerHTML='<section role="dialog" aria-modal="true" aria-label="LUCAS LIMA" style="width:min(470px,100%);background:white;border-radius:10px;overflow:hidden;box-shadow:0 14px 40px #0005;color:#153c72;font:14px Arial,sans-serif"><header style="background:#1c548f;color:white;padding:16px 20px;font-size:16px;font-weight:bold">LUCAS LIMA</header><div style="padding:23px 20px;line-height:1.6;white-space:pre-wrap" id="cc-system-message-text"></div><footer style="padding:0 20px 18px;display:flex;justify-content:flex-end;gap:10px">'+(ask?'<button type="button" data-no style="border:1px solid #aac6e7;border-radius:5px;background:#f2f6ff;color:#1c548f;padding:10px 18px;font-weight:bold;cursor:pointer">CANCELAR</button>':'')+'<button type="button" data-yes style="border:0;border-radius:5px;background:#1c548f;color:white;padding:10px 20px;font-weight:bold;cursor:pointer">'+(ask?'CONFIRMAR':'OK')+'</button></footer></section>';
  overlay.querySelector('#cc-system-message-text').textContent=String(message);
  const finish=value=>{document.removeEventListener('keydown',onKey,true);overlay.remove();resolve(value)};
  const onKey=event=>{if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();finish(false)}else if(event.key==='Enter'){event.preventDefault();event.stopImmediatePropagation();finish(true)}};
  overlay.querySelector('[data-yes]').onclick=()=>finish(true);
  overlay.querySelector('[data-no]')?.addEventListener('click',()=>finish(false));
  document.body.appendChild(overlay);document.addEventListener('keydown',onKey,true);overlay.querySelector('[data-yes]').focus();
 });
}
const ccNotice=message=>ccDialog(message,false);
const ccAsk=message=>ccDialog(message,true);
const KEY='erp_systems_centros_custos_v1';
const get=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch{return []}};
const put=a=>localStorage.setItem(KEY,JSON.stringify(a));
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let selected=null,filter='TODOS',query='',draft='',view='cadastro';
const css=`<style id="cc-styles">.cc-page{padding:20px;color:#173c6d;font-family:Arial,sans-serif}.cc-head{display:flex;justify-content:space-between;align-items:center;background:#0b5098;color:white;padding:18px;border-radius:8px}.cc-head h1{margin:0;font-size:25px}.cc-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.cc-toolbar button,.cc-actions button{border:1px solid #a8c4df;background:linear-gradient(white,#e3effb);color:#134b86;padding:12px 15px;border-radius:5px;cursor:pointer;font-weight:bold}.cc-toolbar button:hover,.cc-actions button:hover{background:#cce4fa}.cc-panel{background:#f9fcff;border:1px solid #c2d5e8;border-radius:7px;padding:15px;margin:12px 0}.cc-panel h3{margin:0 0 14px;color:#12437c}.cc-grid{display:grid;grid-template-columns:130px 1fr 210px;gap:14px;align-items:end}.cc-grid label,.cc-filters label{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:bold}.cc-page input,.cc-page select{padding:11px;border:1px solid #aebfd2;border-radius:4px;font:inherit;max-width:100%;box-sizing:border-box}.cc-filters{display:flex;gap:14px;flex-wrap:wrap;align-items:end}.cc-filters label:nth-child(2){flex:1;min-width:190px}.cc-table{width:100%;border-collapse:collapse;color:#253b54}.cc-table th{background:#185a9f;color:white;text-align:left;padding:11px}.cc-table td{padding:10px;border-bottom:1px solid #d8e5f1}.cc-table tbody tr{cursor:pointer}.cc-table tbody tr:hover,.cc-table tbody tr.chosen{background:#d6eaff}.cc-muted{color:#667}.cc-info{background:#e8f2ff;border:1px solid #accdf2;padding:12px;border-radius:6px;font-size:13px}.cc-bad{color:#b71c1c}.cc-good{color:#16833a}.cc-summary{display:flex;gap:15px;flex-wrap:wrap}.cc-summary span{background:#e7f1fd;padding:12px;border-radius:6px;flex:1}.cc-actions{margin-top:12px}.cc-print{display:none}@media(max-width:760px){.cc-grid{grid-template-columns:1fr}.cc-head{display:block}.cc-page{padding:8px}}@media print{body *{visibility:hidden!important}.cc-print,.cc-print *{visibility:visible!important}.cc-print{display:block!important;position:absolute;left:0;top:0;width:100%;color:#000;font-family:Arial,sans-serif}.cc-print table{width:100%;border-collapse:collapse}.cc-print th,.cc-print td{border:1px solid #888;padding:7px}.cc-print h1{font-size:20px}.cc-print small{display:block;margin-bottom:15px}@page{size:A4;margin:14mm}}</style>`;
const fichaStyle=`<style id="cc-ficha-layout">
.cc-page{padding:24px 10px!important;color:#092e65!important;font-family:Arial,sans-serif!important}
.cc-head{background:#213f73!important;border-radius:4px!important;min-height:48px!important;padding:10px 15px!important;box-sizing:border-box!important}
.cc-head h1{font-size:16px!important;font-weight:800!important}
.cc-head strong{font-size:12px!important}
.cc-toolbar{display:flex!important;gap:8px!important;flex-wrap:wrap!important;margin:14px 0!important}
.cc-toolbar button,.cc-actions button{background:#eaf3ff!important;color:#0c4d96!important;border:1px solid #b9d4fa!important;border-radius:5px!important;padding:10px 13px!important;font-size:12px!important;box-shadow:none!important}
.cc-toolbar button:hover,.cc-actions button:hover{background:#dceaff!important}
.cc-panel{background:#fff!important;border:1px solid #c4d8fa!important;border-radius:9px!important;padding:10px!important;margin:10px 0!important}
.cc-panel h3{background:#dfebfa!important;color:#002e6a!important;padding:10px!important;margin:-1px -1px 12px!important;border-radius:2px!important;text-transform:uppercase!important;font-size:13px!important}
.cc-grid label,.cc-filters label{font-size:11px!important;color:#002f6b!important;text-transform:uppercase!important}
.cc-page input,.cc-page select{border:1px solid #c3d5f7!important;border-radius:5px!important;min-height:36px!important;font-size:12px!important;background:#fff!important}
.cc-filters{display:grid!important;grid-template-columns:minmax(120px,1fr) minmax(200px,3fr) minmax(120px,1fr)!important;align-items:end!important;gap:10px!important}
.cc-filters label:nth-child(2){min-width:0!important}
.cc-table th{background:#dfebfa!important;color:#002e6a!important;text-transform:uppercase!important;font-size:12px!important;padding:10px!important}
.cc-table td{font-size:12px!important}
.cc-summary span{background:#edf4ff!important;border:1px solid #c6dcfa!important}
@media(max-width:700px){.cc-filters{grid-template-columns:1fr!important}}
@media print{.cc-page{padding:0!important}}
</style>`;
// Cabeçalho de Centros de Custos no mesmo padrão de Pedidos de Compra.
const ccHeaderPattern=`<style id="cc-header-pattern">
.cc-page .cc-head{background:#173e75!important;border-radius:6px!important;padding:7px 12px!important;margin:0 0 7px!important;min-height:44px!important;height:auto!important;display:flex!important;align-items:center!important;justify-content:space-between!important;box-sizing:border-box!important}
.cc-page .cc-head h1{font-size:15px!important;color:#fff!important;margin:0!important;line-height:1.3!important;font-weight:800!important}
.cc-page .cc-head .erp-shortcut-open{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:30px!important;padding:7px 12px!important;background:#1a4c91!important;border:1px solid #aac4e5!important;border-radius:5px!important;color:white!important;font-size:11px!important;font-weight:700!important;line-height:1.2!important;cursor:pointer!important;margin-left:auto!important;white-space:nowrap!important;position:static!important;width:auto!important;box-shadow:none!important}
.cc-page .cc-back-row{display:flex!important;justify-content:flex-end!important;margin:12px 0!important}
.cc-page .cc-back-row #cc-back{width:min(345px,100%)!important;min-height:43px!important;margin:0!important;background:#ec2945!important;color:white!important;border:0!important;border-radius:5px!important;font-weight:800!important}
@media(max-width:650px){.cc-page .cc-head{display:flex!important}.cc-page .cc-back-row #cc-back{width:100%!important}}
</style>`;
const root=()=>document.querySelector('#content, .main-content, main, #main-content')||document.getElementById('app');
function permission(){const p=localStorage.getItem('erp_systems_permissao_centros_situacao');return p==='true'}
const LK='lucas_lima_cc_lancamentos_v2';
const getL=()=>{try{const x=JSON.parse(localStorage.getItem(LK)||'[]');return Array.isArray(x)?x:[]}catch{return []}};
const putL=x=>localStorage.setItem(LK,JSON.stringify(x));
const STORE='erp_matriz_operacoes_v2';
const dbRead=()=>{try{const x=JSON.parse(localStorage.getItem(STORE)||'{}');return x&&typeof x==='object'?x:{}}catch{return {}}};
const dbWrite=x=>localStorage.setItem(STORE,JSON.stringify(x));
// Somente documentos com centro de custos explicitamente informado. Nunca contar pagamento como nova despesa.
function importedCosts(){const db=dbRead(),centers=get(),out=[],seen=new Set();for(const [group,rows] of Object.entries(db)){
 if(!Array.isArray(rows)||!['pagar','despesas','saidas','lancamentos','movimentacoes','movimentos','contasPagar'].includes(group))continue;
 for(const r of rows){if(!r||typeof r!=='object'||r.ccLancamentoId||r.origemCentroCusto)continue;
 const id=r.centroCustoId??r.centro_custo_id??r.centroCusto??r.centro_custo??r.centroCustos;
 const center=centers.find(c=>String(c.id)===String(id)||String(c.name).toUpperCase()===String(id).toUpperCase());
 if(!center||/CANCELAD|ESTORNAD|EXCLU[IÍ]D/i.test(String(r.situacao||r.status||'')))continue;
 const val=Number(r.valor??r.total??0),date=String(r.data||r.emissao||r.dataLancamento||r.vencimento||'').slice(0,10);
 if(!(val>0)||!/^\d{4}-\d{2}-\d{2}$/.test(date))continue;
 const key=String(r.custoOrigemId||r.origemId||r.ref||group+':'+(r.id??r.conta??r.numero??JSON.stringify(r)));
 if(seen.has(key))continue;seen.add(key);
 out.push({id:key,data:date,centro:String(center.id),descricao:String(r.descricao||r.historico||group).toUpperCase(),valor:val,status:'BAIXADO',origem:group.toUpperCase()});
 }}return out;}
function linkedPay(lanc){return (dbRead().pagar||[]).find(x=>String(x.ccLancamentoId)===String(lanc.id));}

let lancId=null, lp={ini:'',fim:'',centro:'TODOS',situacao:'TODAS'},pesquisado=false,resultado=[],centroPesquisado=false,centroResultado=[],tipoPesquisa='LANÇAMENTOS';
const money=n=>(Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const now=()=>new Date().toLocaleDateString('en-CA');
const monthStart=()=>{let d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-01'};
const usuario=()=>{const nome=window.LucasLimaAuditoria?.usuarioAtual?.()||window.LUCAS_LIMA_USUARIO_ATUAL||window.usuarioLogado?.nome||document.querySelector('.top-user strong')?.textContent?.trim()||'';return String(nome||'USUÁRIO NÃO IDENTIFICADO').trim();};
function render(){screen='CENTRO DE CUSTOS';if(typeof active==='function')active('FINANCEIRO');const a=get(),l=getL(),cur=a.find(x=>x.id===selected),ln=l.find(x=>x.id===lancId),valid=[...l.filter(x=>x.status!=='CANCELADO'),...importedCosts()];const total=valid.reduce((v,x)=>v+Number(x.valor||0),0);const ranking=a.map(c=>({name:c.name,total:valid.filter(x=>String(x.centro)===String(c.id)&&x.data>=monthStart()&&x.data<=now()).reduce((v,x)=>v+Number(x.valor||0),0)})).filter(x=>x.total>0).sort((x,y)=>y.total-x.total).slice(0,3);
const opt=a.filter(x=>x.status==='ATIVO'||String(x.id)===String(ln?.centro)).map(x=>`<option value="${x.id}" ${String(ln?.centro)===String(x.id)?'selected':''}>${e(x.name)}</option>`).join('');
const ccAcertoVisual=`<style id="cc-acerto-visual">
/* Mesmo padrão compacto de ACERTO DE ESTOQUE, restrito a CENTROS DE CUSTOS */
.cc-page{padding:9px 10px 15px!important;color:#092d61!important}
.cc-page .cc-head{height:45px!important;min-height:45px!important;padding:6px 10px!important;margin:0 0 8px!important;background:#1d4078!important}
.cc-page .cc-head h1{font-size:15px!important}
.cc-page .cc-panel{padding:7px 8px 9px!important;border:1px solid #cddff5!important;border-radius:9px!important;margin:8px 0!important;box-shadow:none!important;background:#fff!important}
.cc-page .cc-panel h3{font-size:11px!important;line-height:18px!important;padding:7px 9px!important;margin:0 0 9px!important;background:#e0ebfb!important;color:#092d61!important;font-weight:800!important}
.cc-page .cc-form{gap:7px 10px!important}
.cc-page .cc-form label,.cc-page .cc-search-line label{font-size:10px!important;gap:4px!important;min-width:0!important}
.cc-page .cc-form input,.cc-page .cc-form select,.cc-page .cc-search-line input,.cc-page .cc-search-line select{height:32px!important;min-height:32px!important;padding:6px 9px!important;font-size:12px!important;border-radius:5px!important;box-sizing:border-box!important}
.cc-page .cc-pick button{height:32px!important;min-height:32px!important;width:35px!important;padding:0!important}
.cc-page .cc-buttons{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:6px!important;margin:9px 0 0!important}
.cc-page .cc-buttons button{min-height:36px!important;height:36px!important;padding:7px!important;border-radius:5px!important;font-size:11px!important;font-weight:800!important}
.cc-page .cc-launch-buttons{grid-template-columns:repeat(3,minmax(0,1fr))!important}
.cc-page .cc-launch-buttons button{width:100%!important}
.cc-page .cc-search-line>#cc-p-search{width:112px!important;min-width:112px!important;max-width:112px!important;justify-self:end!important;padding:5px 8px!important;font-size:12px!important;height:32px!important;min-height:32px!important}

.cc-page .cc-dash{gap:8px!important}.cc-page .cc-stat{padding:10px!important;min-height:75px!important}
.cc-page .cc-table th,.cc-page .cc-table td{padding:9px!important;font-size:11px!important}
.cc-page .cc-search-line{gap:7px!important;margin-bottom:9px!important}
.cc-page .cc-back-row{margin:8px 0!important}
.cc-page .cc-back-row #cc-back{min-height:36px!important;height:36px!important;font-size:11px!important}
@media(max-width:650px){.cc-page .cc-buttons{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
</style>`;

root().innerHTML=css+fichaStyle+ccHeaderPattern+ccAcertoVisual+`<style>.cc-dash{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.cc-stat{border-radius:7px;padding:15px;min-height:90px}.cc-stat b{display:block;font-size:12px}.cc-stat strong{display:block;font-size:20px;margin:9px 0}.cc-stat small{display:block;overflow-wrap:anywhere}.cc-stat:nth-child(1){background:#dbeafe;color:#1d4ed8}.cc-stat:nth-child(2){background:#dcfce7;color:#166534}.cc-stat:nth-child(3){background:#fee2e2;color:#991b1b}.cc-stat:nth-child(4){background:#fef3c7;color:#92400e}.cc-form{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.cc-form label{display:flex;flex-direction:column;gap:5px;font-size:11px;font-weight:bold}.cc-form .wide{grid-column:span 2}.cc-page button{cursor:pointer}.cc-buttons{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.cc-buttons button{padding:10px 15px;border:1px solid #b9d4fa;border-radius:5px;background:#eaf3ff;color:#0c4d96;font-weight:bold}.cc-buttons .blue{background:#1768b5;color:white}.cc-buttons .red{background:#c62828;color:white}.cc-note{font-size:12px;color:#73530b;background:#fff7db;padding:9px;border-radius:5px;margin-top:8px}@media(max-width:850px){.cc-dash{grid-template-columns:repeat(2,1fr)}.cc-form{grid-template-columns:repeat(2,1fr)}}@media(max-width:500px){.cc-dash,.cc-form{grid-template-columns:1fr}.cc-form .wide{grid-column:span 1}}.cc-page .cc-buttons{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}.cc-page .cc-cadastro .cc-buttons,.cc-page .cc-launch-buttons{grid-template-columns:repeat(3,minmax(0,1fr))!important;width:100%!important}.cc-page .cc-cadastro .cc-buttons button,.cc-page .cc-launch-buttons button{width:100%!important;min-width:0!important}.cc-page .cc-buttons button{width:100%;min-height:38px;font-weight:800;border:0;border-radius:5px}.cc-page .cc-cadastro .cc-form{grid-template-columns:minmax(100px,1fr) minmax(200px,2.1fr) minmax(120px,1fr) minmax(170px,1.4fr)!important}.cc-page .cc-cadastro .cc-form label{grid-column:auto!important;min-width:0}.cc-page .cc-cadastro .cc-form input,.cc-page .cc-cadastro .cc-form select{width:100%}.cc-page .cc-cadastro>.cc-buttons~*{display:none!important}@media(max-width:800px){.cc-page .cc-cadastro .cc-form{grid-template-columns:repeat(2,minmax(0,1fr))!important}}@media(max-width:500px){.cc-page .cc-cadastro .cc-form{grid-template-columns:1fr!important}}.cc-page #cc-new{background:#009c74;color:white}.cc-page #cc-save{background:#1765e9;color:white}.cc-page #cc-edit{background:#f18a00;color:white}.cc-page #cc-l-new{background:#009c74;color:white}.cc-page #cc-l-save{background:#1765e9;color:white}.cc-page #cc-l-down{background:#009c74;color:white}.cc-page #cc-l-cancel{background:#ec2945;color:white}.cc-page #cc-l-reopen{background:#f5b500;color:#fff}.cc-page #cc-l-print{background:#526d94;color:white}.cc-page .cc-pick{display:flex;gap:7px;align-items:stretch}.cc-page .cc-pick input{flex:1;min-width:0}.cc-page .cc-pick button{width:39px;flex:none;background:#009b73;color:white;border:0;border-radius:5px;font-size:24px;font-weight:bold}.cc-page #cc-back{background:#ec2945;color:white}@media(max-width:650px){.cc-page .cc-buttons{grid-template-columns:repeat(2,minmax(0,1fr))}}.cc-page .cc-buttons.cc-launch-buttons{grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:6px!important}.cc-page .cc-buttons.cc-launch-buttons button{min-width:0!important;width:100%!important;white-space:nowrap!important}</style><div class="cc-page"><div class="cc-head"><h1>▣ CENTROS DE CUSTOS</h1></div><section class="cc-panel"><h3>VISÃO GERAL — CENTROS DE CUSTOS</h3><div class="cc-dash">${[{t:'TOTAL DE CENTROS DE CUSTOS',v:money(total),n:'ACUMULADO DE TODOS OS PERÍODOS'},...[0,1,2].map(i=>({t:(i+1)+'º CENTRO DO MÊS',v:money(ranking[i]?.total||0),n:ranking[i]?.name||'SEM DESPESAS NO MÊS'}))].map(x=>`<div class="cc-stat"><b>${e(x.t)}</b><strong>${e(x.v)}</strong><small>${e(x.n)}</small></div>`).join('')}</div></section>
<section class="cc-panel cc-cadastro"><h3>CADASTRO DE CENTROS DE CUSTOS</h3><div class="cc-form"><label>CÓDIGO<input readonly value="${cur?.id||Math.max(0,...a.map(x=>x.id))+1}"></label><label>DESCRIÇÃO<input id="cc-name" maxlength="120" value="${e(cur?.name||draft)}" placeholder="DESCRIÇÃO DO CENTRO"></label><label>SITUAÇÃO<select id="cc-status"><option value="ATIVO" ${(!cur||cur.status==='ATIVO')?'selected':''}>ATIVO</option><option value="INATIVO" ${cur?.status==='INATIVO'?'selected':''}>INATIVO</option></select></label><label>USUÁRIO<input id="cc-user-history" readonly title="CLIQUE PARA VER O HISTÓRICO" style="cursor:pointer" value="${e(cur?.usuario||usuario())}"></label></div><div class="cc-buttons"><button id="cc-new">NOVO</button><button id="cc-save" class="blue">GRAVAR</button><button id="cc-edit">ALTERAR</button>${typeof window.LL_retornoCentroCustosCaixa==='function'?'<button type="button" id="cc-voltar-despesa" style="background:#dceaff;color:#164d8a;border:1px solid #a9c9f7">VOLTAR PARA DESPESA</button>':''}</div></section>
<section class="cc-panel"><h3>LANÇAMENTOS DE CENTROS DE CUSTOS</h3><div class="cc-form cc-launch"><label>Nº LANÇAMENTO<input readonly value="${ln?.id||Math.max(0,...l.map(x=>x.id))+1}"></label><label>DATA<input type="date" id="cc-l-date" value="${e(ln?.data||now())}"></label><label>VENCIMENTO<input type="date" id="cc-l-due" value="${e(ln?.vencimento||'')}"></label><label>FORNECEDOR (OPCIONAL)<span class="cc-pick"><input id="cc-l-payee" readonly placeholder="OPCIONAL — CLIQUE NO +" value="${e(ln?.favorecido||'')}"><button type="button" id="cc-l-payee-plus" title="SELECIONAR FORNECEDOR">+</button></span></label><label class="wide">DESCRIÇÃO DA DESPESA<input id="cc-l-desc" value="${e(ln?.descricao||'')}"></label><label class="wide">CENTRO DE CUSTOS<span class="cc-pick"><input type="hidden" id="cc-l-center" value="${e(ln?.centro||'')}"><input id="cc-l-center-name" readonly value="${e(a.find(c=>String(c.id)===String(ln?.centro))?.name||'SELECIONE')}" title="CLIQUE NO + PARA SELECIONAR"><button type="button" id="cc-l-center-plus" title="SELECIONAR CENTRO DE CUSTOS">+</button></span></label><label>VALOR (R$)<input type="number" min="0.01" step="0.01" id="cc-l-value" value="${ln?.valor||''}"></label><label>SITUAÇÃO<input readonly value="${ln?.status||'PENDENTE'}"></label><label>GERAR CONTAS A PAGAR<select id="cc-l-cp"><option value="NAO" ${!ln?.gerarCP?'selected':''}>NÃO</option><option value="SIM" ${ln?.gerarCP?'selected':''}>SIM</option></select></label><label>USUÁRIO<input id="cc-l-user-history" readonly title="CLIQUE PARA VER O HISTÓRICO DO LANÇAMENTO" style="cursor:pointer" value="${e(ln?.usuario||usuario())}"></label></div><div class="cc-buttons cc-launch-buttons"><button id="cc-l-new">NOVO</button><button id="cc-l-save" class="blue">GRAVAR</button><button id="cc-l-down">BAIXAR</button><button id="cc-l-cancel" class="red">CANCELAR</button><button id="cc-l-print">IMPRIMIR</button></div></section>
<section class="cc-panel cc-unified-search"><h3>PESQUISA DE CENTROS DE CUSTOS</h3><div class="cc-search-line"><label>DATA INICIAL<input type="date" id="cc-p-ini" value="${e(lp.ini)}"></label><label>DATA FINAL<input type="date" id="cc-p-fim" value="${e(lp.fim)}"></label><label>CENTRO DE CUSTOS<span class="cc-pick"><input type="hidden" id="cc-p-center" value="${e(lp.centro)}"><input id="cc-p-center-name" readonly value="${e(lp.centro==='TODOS'?'TODOS':a.find(x=>String(x.id)===String(lp.centro))?.name||'TODOS')}"><button type="button" id="cc-p-center-plus" title="SELECIONAR CENTRO DE CUSTOS">+</button></span></label><label>SITUAÇÃO<select id="cc-p-status">${(tipoPesquisa==='LANÇAMENTOS'?['TODAS','PENDENTE','BAIXADO','CANCELADO']:['TODAS','ATIVO','INATIVO']).map(x=>`<option ${lp.situacao===x?'selected':''}>${x}</option>`).join('')}</select></label><label>TIPO<select id="cc-p-type"><option ${tipoPesquisa==='LANÇAMENTOS'?'selected':''}>LANÇAMENTOS</option><option ${tipoPesquisa==='CADASTROS'?'selected':''}>CADASTROS</option></select></label><button id="cc-p-search" class="blue">PESQUISAR</button></div><table class="cc-table"><thead>${tipoPesquisa==='LANÇAMENTOS'?'<tr><th>Nº</th><th>DATA</th><th>CENTRO</th><th>DESCRIÇÃO</th><th>VALOR</th><th>SITUAÇÃO</th><th>ORIGEM</th></tr>':'<tr><th>CÓDIGO</th><th>DESCRIÇÃO</th><th>SITUAÇÃO</th><th>USUÁRIO</th></tr>'}</thead><tbody>${tipoPesquisa==='LANÇAMENTOS'?(pesquisado?resultado.map(x=>`<tr data-l-id="${x.id}"><td>${x.id}</td><td>${e(x.data)}</td><td>${e(a.find(c=>String(c.id)===String(x.centro))?.name||'—')}</td><td>${e(x.descricao)}</td><td>${money(x.valor)}</td><td>${e(x.status)}</td><td>MANUAL</td></tr>`).join('')||'<tr><td colspan="7">NENHUM LANÇAMENTO ENCONTRADO.</td></tr>':'<tr><td colspan="7">CLIQUE EM PESQUISAR PARA EXIBIR RESULTADOS.</td></tr>'):(centroPesquisado?centroResultado.map(x=>`<tr data-cc-id="${x.id}"><td>${x.id}</td><td>${e(x.name)}</td><td>${e(x.status)}</td><td>${e(x.usuario||'—')}</td></tr>`).join('')||'<tr><td colspan="4">NENHUM CENTRO ENCONTRADO.</td></tr>':'<tr><td colspan="4">CLIQUE EM PESQUISAR PARA EXIBIR RESULTADOS.</td></tr>')}</tbody></table></section><div class="cc-back-row"><button id="cc-back" class="red">VOLTAR</button></div><div class="cc-print" id="cc-print-area"></div></div>`;
const $=id=>document.getElementById(id);
 const searchCss=document.createElement('style');searchCss.textContent='.cc-search-line{display:grid;grid-template-columns:minmax(120px,1fr) minmax(120px,1fr) minmax(190px,1.6fr) minmax(110px,1fr) minmax(130px,1.15fr) 112px;gap:9px;align-items:end;margin-bottom:12px}.cc-search-line label{display:flex;flex-direction:column;gap:6px;font-size:11px;font-weight:bold;color:#002f6b;min-width:0}.cc-search-line input,.cc-search-line select{width:100%;min-width:0;height:39px}.cc-search-line .cc-pick{min-width:0}.cc-search-line .cc-pick button{height:39px}.cc-search-line>#cc-p-search{height:39px;border:0;border-radius:5px;background:#1768b5;color:white;font-weight:800}@media(max-width:1050px){.cc-search-line{overflow-x:auto;grid-template-columns:140px 140px 210px 125px 145px 112px}}';root().appendChild(searchCss);
// Isola o clique no usuário deste módulo dos ouvintes genéricos de auditoria.
// Um único diálogo é aberto mesmo quando outros módulos registraram eventos globais.
if(!window.__llCcHistoryClickGuard){
 window.__llCcHistoryClickGuard=true;
 document.addEventListener('click',function(ev){
  const target=ev.target;
  if(target && target.id==='cc-l-user-history' && target.closest('.cc-launch')){
   ev.preventDefault();ev.stopImmediatePropagation();
   document.querySelectorAll('.ax-history-overlay').forEach(n=>n.remove());
   showLancHistory();return;
  }
  if(target && target.id==='cc-user-history' && target.closest('.cc-cadastro')){
   ev.preventDefault();ev.stopImmediatePropagation();
   document.querySelectorAll('.ax-history-overlay').forEach(n=>n.remove());
   showCenterHistory();
  }
 },true);
}

const btnVoltarDespesa=document.getElementById('cc-voltar-despesa');
if(btnVoltarDespesa)btnVoltarDespesa.onclick=()=>{
 const voltar=window.LL_retornoCentroCustosCaixa;
 if(typeof voltar!=='function')return;
 window.LL_retornoCentroCustosCaixa=null;
 open('CAIXA');
 voltar();
};
$('cc-new').onclick=()=>{selected=null;draft='';render()};$('cc-save').onclick=()=>saveCenter(false);$('cc-edit').onclick=()=>saveCenter(true);
document.querySelectorAll('[data-cc-id]').forEach(tr=>tr.ondblclick=()=>{selected=Number(tr.dataset.ccId);draft='';render()});
$('cc-l-center-plus').onclick=()=>ccChoose('CENTRO DE CUSTOS',get().filter(x=>x.status==='ATIVO'||String(x.id)===$('cc-l-center').value).map(x=>({id:x.id,name:x.name})),item=>{$('cc-l-center').value=item.id;$('cc-l-center-name').value=item.name});$('cc-l-payee-plus').onclick=()=>ccChoose('FORNECEDOR',ccSuppliers(),item=>{$('cc-l-payee').value=item.name},true);$('cc-l-print').onclick=()=>printLanc();$('cc-l-new').onclick=()=>{lancId=null;render()};$('cc-l-save').onclick=()=>saveLanc();$('cc-l-down').onclick=()=>statusLanc('BAIXADO');$('cc-l-cancel').onclick=()=>statusLanc('CANCELADO');
$('cc-p-center-plus').onclick=()=>ccChoose('CENTRO DE CUSTOS',[{id:'TODOS',name:'TODOS'},...get().map(x=>({id:x.id,name:x.name}))],item=>{$('cc-p-center').value=item.id;$('cc-p-center-name').value=item.name});
$('cc-p-type').onchange=()=>{lp={ini:$('cc-p-ini').value,fim:$('cc-p-fim').value,centro:$('cc-p-center').value,situacao:'TODAS'};tipoPesquisa=$('cc-p-type').value;pesquisado=false;centroPesquisado=false;render()};
$('cc-p-search').onclick=()=>{lp={ini:$('cc-p-ini').value,fim:$('cc-p-fim').value,centro:$('cc-p-center').value,situacao:$('cc-p-status').value};if(tipoPesquisa==='LANÇAMENTOS'){pesquisado=true;resultado=getL().filter(x=>(!lp.ini||x.data>=lp.ini)&&(!lp.fim||x.data<=lp.fim)&&(lp.centro==='TODOS'||String(x.centro)===lp.centro)&&(lp.situacao==='TODAS'||x.status===lp.situacao))}else{centroPesquisado=true;centroResultado=get().filter(x=>(lp.centro==='TODOS'||String(x.id)===lp.centro)&&(lp.situacao==='TODAS'||x.status===lp.situacao))}render()};
document.querySelectorAll('[data-l-id]').forEach(tr=>tr.ondblclick=()=>{lancId=Number(tr.dataset.lId);render()});
$('cc-back').onclick=()=>{if(typeof category==='function')category('FINANCEIRO');else if(typeof home==='function')home()};
}
function localizarLancamentoPorNumero(){
 document.getElementById('cc-localizar-f12')?.remove();
 const overlay=document.createElement('div');
 overlay.id='cc-localizar-f12';
 overlay.style.cssText='position:fixed;inset:0;z-index:2147483640;background:rgba(5,25,55,.65);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';
 overlay.innerHTML=`<section role="dialog" aria-modal="true" aria-labelledby="cc-localizar-title" style="box-sizing:border-box;width:min(475px,100%);background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 15px 40px #0005;color:#173e75;font:14px Arial,sans-serif">
 <header style="display:flex;justify-content:space-between;align-items:center;background:#1e4e86;color:#fff;padding:17px 20px;font-size:17px;font-weight:800"><span id="cc-localizar-title">▣ LUCAS LIMA — LOCALIZAR</span><button type="button" data-close aria-label="Fechar" style="border:0;background:transparent;color:white;font-size:24px;cursor:pointer">×</button></header>
 <div style="padding:22px 22px 8px"><p style="margin:0 0 18px">NÚMERO DO LANÇAMENTO:</p><label for="cc-localizar-numero" style="display:block;font-size:12px;font-weight:800;margin-bottom:9px">INFORME O VALOR</label><input id="cc-localizar-numero" type="text" inputmode="numeric" autocomplete="off" placeholder="DIGITE AQUI..." style="box-sizing:border-box;width:100%;height:43px;border:1px solid #8db8f6;border-radius:7px;padding:0 12px;font:13px Arial,sans-serif;color:#173e75;outline-color:#1a63bf"><p data-error role="alert" style="color:#b42332;min-height:17px;font-size:12px;margin:8px 0 0"></p></div>
 <footer style="display:flex;justify-content:center;gap:10px;padding:12px 20px 22px"><button type="button" data-confirm style="background:#195ba9;color:white;border:0;border-radius:6px;padding:12px 22px;font-weight:800;cursor:pointer">CONFIRMAR</button><button type="button" data-cancel style="background:#eef4ff;color:#174d89;border:1px solid #bbd2f4;border-radius:6px;padding:12px 22px;font-weight:800;cursor:pointer">CANCELAR</button></footer></section>`;
 document.body.appendChild(overlay);
 const input=overlay.querySelector('input'),error=overlay.querySelector('[data-error]');
 const close=()=>{document.removeEventListener('keydown',onKey,true);overlay.remove()};
 const locate=()=>{const raw=input.value.trim();if(!/^[1-9]\d*$/.test(raw)){error.textContent='INFORME UM NÚMERO DE LANÇAMENTO VÁLIDO.';input.focus();return}const n=Number(raw);const item=getL().find(x=>Number(x.id)===n);if(!item){error.textContent='LANÇAMENTO Nº '+n+' NÃO ENCONTRADO.';input.focus();return}close();lancId=Number(item.id);render();document.getElementById('cc-l-date')?.scrollIntoView({block:'center',behavior:'smooth'})};
 const onKey=e=>{if(e.key==='Escape'||e.key==='Enter'||e.key==='F12'){e.preventDefault();e.stopImmediatePropagation();if(e.key==='Escape')close();else if(e.key==='Enter')locate()}};
 overlay.querySelector('[data-close]').onclick=close;overlay.querySelector('[data-cancel]').onclick=close;overlay.querySelector('[data-confirm]').onclick=locate;
 document.addEventListener('keydown',onKey,true);input.focus();
}
window.LucasLimaCentrosAtalhos={localizar:localizarLancamentoPorNumero,baixar:()=>statusLanc('BAIXADO'),cancelar:()=>statusLanc('CANCELADO')};
function saveLanc(){const $=id=>document.getElementById(id),l=getL(),cur=l.find(x=>x.id===lancId);if(cur&&cur.status!=='PENDENTE')return ccNotice('REABRA O LANÇAMENTO ANTES DE ALTERAR.');
const gerar=$('cc-l-cp').value==='SIM',centro=$('cc-l-center').value,descricao=$('cc-l-desc').value.trim(),valor=Number($('cc-l-value').value),data=$('cc-l-date').value,vencimento=$('cc-l-due').value,favorecido=$('cc-l-payee').value.trim();
if(!centro||!descricao||!data||!(valor>0))return ccNotice('PREENCHA CENTRO, DATA, DESCRIÇÃO E VALOR VÁLIDO.');if(!get().some(x=>String(x.id)===centro&&x.status==='ATIVO'))return ccNotice('SELECIONE UM CENTRO ATIVO.');
if(gerar&&!vencimento)return ccNotice('PARA GERAR CONTAS A PAGAR, INFORME O VENCIMENTO.');
if(cur&&linkedPay(cur)&&!gerar)return ccNotice('ESTE LANÇAMENTO TEM CONTA A PAGAR VINCULADA. NÃO É POSSÍVEL DESVINCULAR AUTOMATICAMENTE.');
const o={id:cur?.id||Math.max(0,...l.map(x=>x.id))+1,data,centro,descricao:descricao.toUpperCase(),valor,status:'PENDENTE',usuario:usuario(),gerarCP:gerar,vencimento,favorecido};
const db=dbRead();const existing=(db.pagar||[]).find(x=>String(x.ccLancamentoId)===String(o.id));
if(existing){if(Number(existing.pago||0)>0||(existing.pagamentos||[]).some(x=>!x.estornado))return ccNotice('CONTA VINCULADA COM PAGAMENTO NÃO PODE SER ALTERADA.');db.pagar=db.pagar.filter(x=>String(x.ccLancamentoId)!==String(o.id));try{dbWrite(db)}catch{return ccNotice('FALHA AO ATUALIZAR CONTA VINCULADA.');}}
o.historico=[...(cur?.historico||[]),{acao:cur?'ALTERAÇÃO':'GRAVAÇÃO',usuario:usuario(),data:new Date().toLocaleString('pt-BR')}];if(cur)Object.assign(cur,o);else l.push(o);lancId=o.id;putL(l);render();ccNotice('LANÇAMENTO GRAVADO. A CONTA A PAGAR SERÁ GERADA SOMENTE NA BAIXA.');}
// Autorização local para baixa/cancelamento: cadastro de usuários e senha com hash.
function ccAuthorize(status){return new Promise(resolve=>{
 document.getElementById('cc-auth-overlay')?.remove();
 const ov=document.createElement('div');ov.id='cc-auth-overlay';ov.style.cssText='position:fixed;inset:0;z-index:2147483640;background:rgba(5,24,53,.65);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';
 ov.innerHTML=`<section role="dialog" aria-modal="true" style="box-sizing:border-box;width:min(470px,100%);background:white;border-radius:12px;overflow:hidden;color:#173c6d;font:14px Arial,sans-serif;box-shadow:0 18px 45px #0004"><header style="background:#245b98;color:white;font-weight:800;font-size:16px;padding:21px 20px;position:relative">IDENTIFICAÇÃO PARA ${status==='BAIXADO'?'BAIXAR':'CANCELAR'}<button data-x type="button" style="position:absolute;right:15px;top:12px;border:0;background:transparent;color:white;font-size:26px;cursor:pointer">×</button></header><div style="padding:25px 20px 5px;display:flex;flex-direction:column;gap:15px"><label style="font-weight:800">USUÁRIO (CÓDIGO)<input data-code inputmode="numeric" autocomplete="off" placeholder="INFORME O CÓDIGO DO OPERADOR" style="display:block;box-sizing:border-box;width:100%;padding:12px;margin-top:7px;border:1px solid #b7cff4;border-radius:5px;font:inherit"></label><div style="padding:12px 14px;background:#e7f0fc;border:1px solid #c3d6f4;border-radius:5px"><strong data-name>INFORME O CÓDIGO DO USUÁRIO</strong><div data-role style="font-size:12px;margin-top:5px;color:#5c769c">O NOME APARECERÁ AUTOMATICAMENTE</div></div><label style="font-weight:800">SENHA<input data-pass type="password" autocomplete="off" placeholder="DIGITE SUA SENHA" style="display:block;box-sizing:border-box;width:100%;padding:12px;margin-top:7px;border:1px solid #b7cff4;border-radius:5px;font:inherit"></label><div data-error role="alert" style="min-height:20px;color:#bd243b;font-size:12px"></div><p style="font-size:11px;color:#58749a;line-height:1.5">VALIDAÇÃO LOCAL DOS USUÁRIOS CADASTRADOS. NÃO SUBSTITUI AUTENTICAÇÃO SEGURA EM SERVIDOR.</p></div><footer style="display:flex;justify-content:center;gap:10px;padding:14px 20px 20px"><button data-go style="background:#195ba9;color:white;border:0;border-radius:6px;padding:13px 22px;font-weight:800;cursor:pointer">CONTINUAR</button><button data-no style="background:#e6f0ff;color:#164e8d;border:1px solid #b5cff2;border-radius:6px;padding:13px 22px;font-weight:800;cursor:pointer">CANCELAR</button></footer></section>`;
 const code=ov.querySelector('[data-code]'),pass=ov.querySelector('[data-pass]'),error=ov.querySelector('[data-error]');
 const users=()=>{try{const v=JSON.parse(localStorage.getItem('erp_matriz_usuarios_v1')||'[]');return Array.isArray(v)?v:Array.isArray(v.usuarios)?v.usuarios:[]}catch{return []}};
 const find=()=>users().find(u=>String(u.id??u.codigo)===code.value.trim()&&String(u.situacao||'ATIVO').toUpperCase()==='ATIVO');
 const update=()=>{const u=find();ov.querySelector('[data-name]').textContent=u?String(u.nome||u.login||'USUÁRIO'):'USUÁRIO NÃO ENCONTRADO';ov.querySelector('[data-role]').textContent=u?String(u.perfil||'USUÁRIO'):'CONFIRA O CÓDIGO INFORMADO';pass.value='';error.textContent=''};
 const finish=u=>{ov.remove();resolve(u)};ov.querySelector('[data-x]').onclick=()=>finish(null);ov.querySelector('[data-no]').onclick=()=>finish(null);
 code.addEventListener('input',update);code.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();pass.focus()}});
 const go=async()=>{const u=find();if(!u){error.textContent='USUÁRIO NÃO ENCONTRADO OU INATIVO.';return}if(!pass.value){error.textContent='INFORME A SENHA.';return}if(!u.senhaHash||!u.senhaSalt||typeof window.LL_SHA256!=='function'){error.textContent='NÃO FOI POSSÍVEL VALIDAR A SENHA DESTE USUÁRIO.';return}let valid=false;try{valid=(await window.LL_SHA256(u.senhaSalt+':'+pass.value))===u.senhaHash}catch{}if(!valid){error.textContent='SENHA INCORRETA.';pass.value='';return}finish({id:u.id,nome:u.nome||u.login||String(u.id)})};
 ov.querySelector('[data-go]').onclick=go;pass.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();go()}});ov.addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.stopPropagation();finish(null)}});
 document.body.appendChild(ov);code.focus();
})}
async function statusLanc(status){const l=getL(),x=l.find(v=>v.id===lancId);if(!x)return ccNotice('SELECIONE UM LANÇAMENTO NA PESQUISA.');if(x.status===status)return;
const db=dbRead(),pay=(db.pagar||[]).find(p=>String(p.ccLancamentoId)===String(x.id));if(pay&&(Number(pay.pago||0)>0||(pay.pagamentos||[]).some(p=>!p.estornado))&&status!=='BAIXADO')return ccNotice('A CONTA A PAGAR JÁ POSSUI PAGAMENTO. NÃO É POSSÍVEL CANCELAR OU REABRIR SEM CONCILIAÇÃO.');
const autorizado=await ccAuthorize(status);if(!autorizado)return;
if(!await ccAsk('CONFIRMA ALTERAR A SITUAÇÃO PARA '+status+'?'))return;
if(status==='BAIXADO'&&x.gerarCP&&!pay){
db.pagar=Array.isArray(db.pagar)?db.pagar:[];
const id=Math.max(0,...db.pagar.map(p=>Number(p.id)||0))+1;
const conta=Math.max(0,...db.pagar.map(p=>Number(p.conta||p.id)||0))+1;
db.pagar.push({id,conta,parcela:1,totalParcelas:1,pessoa:x.favorecido,descricao:x.descricao,valor:Number(x.valor),pago:0,saldo:Number(x.valor),vencimento:x.vencimento,situacao:'PENDENTE',pagamentos:[],ccLancamentoId:x.id,centroCustoId:x.centro,usuario:usuario()});
try{dbWrite(db)}catch{return ccNotice('NÃO FOI POSSÍVEL GERAR A CONTA A PAGAR.');}
}else if(pay&&status!=='BAIXADO'){
db.pagar=db.pagar.filter(p=>String(p.ccLancamentoId)!==String(x.id));
try{dbWrite(db)}catch{return ccNotice('FALHA AO ATUALIZAR CONTA A PAGAR.');}
}
x.status=status;x.usuario=usuario();x.historico=Array.isArray(x.historico)?x.historico:[];x.historico.push({acao:status==='BAIXADO'?'BAIXA':status==='CANCELADO'?'CANCELAMENTO':'REABERTURA',usuario:autorizado.nome,autorizadoPor:autorizado.id,data:new Date().toLocaleString('pt-BR')});putL(l);render()}
function ccSuppliers(){const db=dbRead();const lists=[db.fornecedores,db.suppliers];for(const key of ['erp_systems_fornecedores_v1','erp_fornecedores','lucas_lima_fornecedores']){try{const x=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(x))lists.push(x)}catch{}}const seen=new Set(),out=[];for(const list of lists){if(!Array.isArray(list))continue;for(const item of list){if(!item||typeof item!=='object')continue;const name=String(item.nome||item.razaoSocial||item.razao||item.descricao||item.name||'').trim();if(!name||seen.has(name.toUpperCase())||/INATIV/i.test(String(item.situacao||item.status||'')))continue;seen.add(name.toUpperCase());out.push({id:item.id||item.codigo||name,name})}}return out.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'))}
function ccChoose(title,items,callback,optional=false){
 document.getElementById('cc-choose-overlay')?.remove();
 const overlay=document.createElement('div');overlay.id='cc-choose-overlay';
 overlay.style.cssText='position:fixed;inset:0;background:#061b3ca9;z-index:2147483500;display:flex;justify-content:center;align-items:center;padding:16px;box-sizing:border-box';
 const fornecedor=title==='FORNECEDOR', label=fornecedor?'FORNECEDOR':'CENTRO DE CUSTOS';
 overlay.innerHTML=`<section role="dialog" aria-modal="true" aria-label="SELECIONE O ${e(label)}" style="box-sizing:border-box;background:white;color:#143e74;width:min(960px,100%);max-height:86vh;display:flex;flex-direction:column;border-radius:10px;overflow:hidden;font:12px Arial,sans-serif;box-shadow:0 16px 45px #0004"><header style="background:#225993;color:white;padding:20px;font-size:14px;font-weight:bold;display:flex;align-items:center;justify-content:space-between">SELECIONE O ${e(label)}<button type="button" data-close style="background:transparent;border:1px solid #9bbce2;border-radius:5px;color:white;font-size:21px;cursor:pointer;width:35px;height:35px">×</button></header><div style="padding:20px 20px 12px;display:grid;grid-template-columns:112px minmax(0,1fr) auto auto;gap:7px;align-items:end"><label style="font-size:11px;font-weight:bold">PESQUISAR POR<select data-mode style="display:block;width:100%;height:43px;margin-top:6px;border:1px solid #b7d1f4;border-radius:5px;background:white;color:#143e74"><option value="NOME">NOME</option><option value="CODIGO">CÓDIGO</option></select></label><label style="font-size:11px;font-weight:bold">TEXTO DA PESQUISA<input data-query placeholder="DIGITE PARA PESQUISAR..." style="display:block;box-sizing:border-box;width:100%;height:43px;margin-top:6px;border:1px solid #b7d1f4;border-radius:5px;padding:10px;color:#143e74"></label><button type="button" data-search style="height:40px;background:#20599b;border:0;border-radius:5px;color:white;padding:0 16px;font-weight:bold;cursor:pointer">PESQUISAR</button><button type="button" data-new style="height:40px;background:#009b73;border:0;border-radius:5px;color:white;padding:0 16px;font-weight:bold;cursor:pointer">+ NOVO ${e(label)}</button></div><div style="padding:0 20px;overflow:auto;min-height:90px"><table style="border-collapse:collapse;width:100%;font-size:12px"><thead style="background:#173e75;color:white"><tr><th style="text-align:left;padding:14px 10px;width:16%">CÓDIGO</th><th style="text-align:left;padding:14px 10px">${fornecedor?'NOME DO FORNECEDOR':'DESCRIÇÃO DO CENTRO'}</th><th style="text-align:center;padding:14px 10px;width:20%">SITUAÇÃO</th></tr></thead><tbody data-results></tbody></table></div><footer style="padding:20px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:11px">DÊ DOIS CLIQUES PARA SELECIONAR.</span><button type="button" data-cancel style="background:#eaf2ff;color:#1c548f;border:1px solid #b7d1f4;border-radius:5px;padding:12px 20px;cursor:pointer">CANCELAR</button></footer></section>`;
 document.body.appendChild(overlay);
 const q=overlay.querySelector('[data-query]'),mode=overlay.querySelector('[data-mode]'),tbody=overlay.querySelector('[data-results]');
 function rows(){const term=q.value.trim().toLocaleUpperCase('pt-BR');const list=items.filter(x=>!term||(mode.value==='CODIGO'?String(x.id).toUpperCase().includes(term):String(x.name).toLocaleUpperCase('pt-BR').includes(term)));tbody.innerHTML=(optional?'<tr data-clear style="cursor:pointer"><td colspan="3" style="padding:13px;border-bottom:1px solid #c9daf1">NENHUM — LIMPAR FORNECEDOR</td></tr>':'')+list.map((x,i)=>`<tr data-index="${i}" style="cursor:pointer;background:${i%2?'#fff':'#edf4ff'};border-bottom:1px solid #c9daf1"><td style="padding:13px 10px">${e(x.id)}</td><td style="padding:13px 10px">${e(x.name)}</td><td style="text-align:center;padding:13px 10px"><span style="border-radius:15px;background:#c9f6dc;color:#166534;padding:5px 12px;font-weight:bold">ATIVO</span></td></tr>`).join('')||'<tr><td colspan="3" style="padding:16px">NENHUM CADASTRO ENCONTRADO.</td></tr>';tbody.querySelectorAll('[data-index]').forEach(tr=>tr.ondblclick=()=>{callback(list[Number(tr.dataset.index)]);close()});tbody.querySelector('[data-clear]')?.addEventListener('dblclick',()=>{callback({id:'',name:''});close()})}
 function close(){overlay.remove();document.removeEventListener('keydown',esc,true)}function esc(ev){if(ev.key==='Escape'){ev.stopPropagation();close()}}document.addEventListener('keydown',esc,true);
 overlay.querySelector('[data-close]').onclick=close;overlay.querySelector('[data-cancel]').onclick=close;overlay.querySelector('[data-search]').onclick=rows;q.onkeydown=ev=>{if(ev.key==='Enter'){ev.preventDefault();rows()}};
 overlay.querySelector('[data-new]').onclick=()=>{close();if(fornecedor){const target=document.querySelector('[data-module="fornecedores"]');if(target)target.click();else ccNotice('ACESSE CADASTROS > FORNECEDORES PARA CADASTRAR UM NOVO FORNECEDOR.')}else{selected=null;draft='';render();document.getElementById('cc-name')?.focus()}};
 overlay.onclick=ev=>{if(ev.target===overlay)close()};rows();q.focus();
}
function printLanc(){
 const x=getL().find(v=>v.id===lancId);
 if(!x)return ccNotice('GRAVE OU SELECIONE UM LANÇAMENTO PARA IMPRIMIR.');
 const centro=get().find(c=>String(c.id)===String(x.centro));
 let loja={};try{loja=JSON.parse(localStorage.getItem('erp_systems_dados_loja_v1')||'{}')||{}}catch{}
 const endereco=[loja.rua,loja.numero,loja.bairro,loja.cidade,loja.uf,loja.cep].filter(Boolean).join(' · ');
 const logo=typeof loja.logo==='string'&&/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(loja.logo)?`<img src="${e(loja.logo)}" alt="LOGO" style="max-height:65px;max-width:105px;object-fit:contain">`:'';
 const fields=[['Nº LANÇAMENTO',x.id],['DATA',x.data],['VENCIMENTO',x.vencimento||'—'],['FORNECEDOR',x.favorecido||'—'],['DESCRIÇÃO DA DESPESA',x.descricao],['CENTRO DE CUSTOS',centro?.name||'—'],['SITUAÇÃO',x.status],['GERAR CONTAS A PAGAR',x.gerarCP?'SIM':'NÃO'],['USUÁRIO',x.usuario]];
 const rows=fields.map(([k,v])=>`<div class="ccp-field"><div class="ccp-label">${e(k)}</div><div>${e(v)}</div></div>`).join('');
 const area=document.getElementById('cc-print-area');
 if(!area)return ccNotice('NÃO FOI POSSÍVEL PREPARAR A IMPRESSÃO.');
 area.innerHTML=`<style>
 @page{size:A4 portrait;margin:0}
 @media print{html,body{margin:0!important;padding:0!important}.cc-print{box-sizing:border-box!important;position:fixed!important;top:0!important;left:0!important;width:210mm!important;min-height:297mm!important;padding:12mm 13mm!important;background:#fff!important;color:#153c72!important;visibility:visible!important}.cc-print *{visibility:visible!important}.cc-print .ccp-field{break-inside:avoid}.cc-print .ccp-sign{break-inside:avoid}}
 .ccp-doc{font:12px Arial,sans-serif;color:#153c72}.ccp-head{display:flex;align-items:flex-start;justify-content:space-between;gap:15px;padding-bottom:12px;border-bottom:1px solid #c3d5e8}.ccp-brand{display:flex;gap:12px;align-items:flex-start}.ccp-brand strong{font-size:16px}.ccp-muted{color:#526b84;font-size:10px;line-height:1.55}.ccp-title{text-align:center;background:#dfeafa;padding:10px;margin:15px 0;font-size:14px;font-weight:bold}.ccp-fields{display:grid;grid-template-columns:1fr 1fr;gap:0 15px}.ccp-field{padding:11px 4px;border-bottom:1px solid #dbe6f2;overflow-wrap:anywhere}.ccp-label{font-size:10px;font-weight:bold;color:#496788;margin-bottom:5px}.ccp-total{background:#1c548f;color:#fff;display:flex;justify-content:space-between;padding:14px;margin-top:20px;font-size:17px;font-weight:bold}.ccp-sign{margin-top:65px;display:flex;justify-content:space-around;gap:35px}.ccp-sign>div{width:45%;border-top:1px solid #334e69;text-align:center;padding-top:8px;font-size:10px}.ccp-emissao{text-align:right;font-size:10px;color:#526b84;margin-top:24px;padding-top:8px;border-top:1px solid #dbe6f2}
 </style><article class="ccp-doc"><header class="ccp-head"><div class="ccp-brand">${logo}<div><strong>${e(loja.nome||loja.razao||'NOME DA EMPRESA')}</strong><div class="ccp-muted">${e(loja.razao&&loja.nome!==loja.razao?loja.razao:'')}</div><div class="ccp-muted">${loja.cnpj?'CNPJ: '+e(loja.cnpj):''}</div><div class="ccp-muted">${e(endereco)}</div><div class="ccp-muted">${e([loja.telefone,loja.email].filter(Boolean).join(' · '))}</div></div></div><div style="text-align:right"><strong>LANÇAMENTO Nº ${e(x.id)}</strong><div class="ccp-muted">EMISSÃO: ${e(new Date().toLocaleString('pt-BR'))}</div></div></header><div class="ccp-title">COMPROVANTE DE LANÇAMENTO — CENTRO DE CUSTOS</div><div class="ccp-fields">${rows}</div><div class="ccp-total"><span>VALOR DO LANÇAMENTO</span><span>${e(money(x.valor))}</span></div><div class="ccp-sign"><div>ASSINATURA DO RESPONSÁVEL</div><div>ASSINATURA / CARIMBO DA EMPRESA</div></div><div class="ccp-emissao" data-cc-emissao></div></article>`;
 // Pré-visualização no documento principal do Chrome, fora do iframe do módulo.
 const host=(window.parent&&window.parent!==window&&window.parent.document)?window.parent.document:document;
 host.getElementById('cc-preview-overlay')?.remove();
 const overlay=host.createElement('div');overlay.id='cc-preview-overlay';
 overlay.style.cssText='position:fixed;inset:0;z-index:2147483640;background:#071c3bb5;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;font-family:Arial,sans-serif;color:#143c70';
 overlay.innerHTML=`<div style="background:white;border-radius:11px;width:min(1250px,96vw);height:min(610px,85vh);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 15px 45px #001b3b55"><header style="background:#20548d;color:white;display:flex;justify-content:space-between;align-items:center;padding:17px 22px;font-size:19px;font-weight:800">IMPRIMIR CENTRO DE CUSTOS<button data-close style="background:transparent;color:white;border:0;font-size:27px;cursor:pointer">×</button></header><div style="display:grid;grid-template-columns:40% 60%;gap:14px;padding:15px;overflow:hidden;flex:1;min-height:0;box-sizing:border-box"><div style="overflow:auto;display:flex;flex-direction:column;gap:13px"><section style="border:1px solid #c2d7f5;border-radius:6px;padding:12px"><h3 style="background:#e0ebfa;margin:0 0 12px;padding:12px;font-size:15px">DADOS DO LANÇAMENTO SELECIONADO</h3><p><b>Nº DO LANÇAMENTO:</b> ${e(x.id)}</p><p><b>CENTRO:</b> ${e(centro?.name||'—')}</p><p><b>DESCRIÇÃO:</b> ${e(x.descricao)}</p><p><b>VALOR:</b> ${e(money(x.valor))}</p><p><b>SITUAÇÃO:</b> ${e(x.status)}</p></section><section style="border:1px solid #c2d7f5;border-radius:6px;padding:12px"><h3 style="background:#e0ebfa;margin:0 0 12px;padding:12px;font-size:15px">TIPO DE IMPRESSÃO</h3><label style="display:block;margin:12px 0"><input type="radio" name="cc-print-kind" value="complete" checked> COMPLETA (Dados, Valor e Assinaturas)</label><label style="display:block;margin:12px 0"><input type="radio" name="cc-print-kind" value="simple"> SIMPLIFICADA (Dados e Valor)</label></section><section style="border:1px solid #c2d7f5;border-radius:6px;padding:12px"><h3 style="background:#e0ebfa;margin:0 0 12px;padding:12px;font-size:15px">OPÇÕES DE IMPRESSÃO</h3><label><input type="checkbox" data-sign checked> INCLUIR ASSINATURAS</label></section></div><div style="border:1px solid #c2d7f5;background:#eef5fd;border-radius:6px;padding:12px;display:flex;flex-direction:column;min-width:0;min-height:0"><h3 style="background:#e0ebfa;text-align:center;margin:0 0 10px;padding:11px;font-size:15px">PRÉ-VISUALIZAÇÃO A4</h3><iframe data-preview title="PRÉ-VISUALIZAÇÃO A4" style="width:100%;flex:1;border:1px solid #c2d7f5;background:white;min-height:0"></iframe></div></div><footer style="border-top:1px solid #d6e2f2;padding:12px 20px;display:flex;justify-content:flex-end;gap:10px"><button data-print style="background:#1765df;color:white">IMPRIMIR</button><button data-save style="background:#009d74;color:white">SALVAR</button><button data-close style="background:#e4efff;color:#10417b">FECHAR</button></footer></div>`;
 overlay.querySelectorAll('footer button').forEach(b=>b.style.cssText+=';border:0;border-radius:5px;padding:13px 22px;font-weight:bold;cursor:pointer');
 host.body.appendChild(overlay);
 const preview=overlay.querySelector('[data-preview]');
 let printHtml='';
 const refresh=()=>{
   const simple=overlay.querySelector('input[name="cc-print-kind"]:checked').value==='simple';
   const signature=overlay.querySelector('[data-sign]').checked&&!simple;
   const dataEmissao=new Date().toLocaleDateString('pt-BR');
   const rodape='EMITIDO EM '+dataEmissao+', POR '+String(usuario()||'USUÁRIO').toUpperCase()+'.';
   const content=area.innerHTML.replace(/<div class="ccp-sign">[\s\S]*?<\/div><\/div>(?=<div class="ccp-emissao")/,signature?'$&':'').replace('<div class="ccp-emissao" data-cc-emissao></div>','<div class="ccp-emissao">'+e(rodape)+'</div>');
   printHtml='<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Centro de Custos — Lançamento '+e(x.id)+'</title><style>@page{size:A4 portrait;margin:0}html,body{margin:0;padding:0;background:white}*,*::before,*::after{box-sizing:border-box}.cc-print{width:210mm;min-height:297mm;padding:12mm 13mm;background:white;color:#153c72}.ccp-field,.ccp-sign{break-inside:avoid}@media screen{body{display:flex;justify-content:center}.cc-print{box-shadow:0 0 2px #ccc}}</style></head><body><main class="cc-print">'+content+'</main></body></html>';
   preview.srcdoc=printHtml;
 };
 overlay.querySelectorAll('input').forEach(el=>el.addEventListener('change',refresh));
 overlay.querySelectorAll('[data-close]').forEach(btn=>btn.onclick=()=>overlay.remove());
 overlay.onclick=ev=>{if(ev.target===overlay)overlay.remove()};
 overlay.querySelector('[data-print]').onclick=()=>{try{preview.contentWindow.focus();preview.contentWindow.print()}catch(err){ccNotice('NÃO FOI POSSÍVEL ABRIR A IMPRESSÃO.')}};
 overlay.querySelector('[data-save]').onclick=async()=>{
   const filename='CENTRO_CUSTOS_LANCAMENTO_'+x.id+'.html';
   try{
     const picker=host.defaultView.showSaveFilePicker;
     if(picker){const handle=await picker.call(host.defaultView,{suggestedName:filename,types:[{description:'Documento HTML',accept:{'text/html':['.html']}}]});const writer=await handle.createWritable();await writer.write(printHtml);await writer.close();return}
   }catch(err){if(err.name==='AbortError')return}
   const blob=new Blob([printHtml],{type:'text/html;charset=utf-8'});const url=URL.createObjectURL(blob);const a=host.createElement('a');a.href=url;a.download=filename;host.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
 };
 refresh();

}

function showLancHistory(){
 const x=getL().find(v=>v.id===lancId);
 document.getElementById('cc-launch-history-overlay')?.remove();
 const overlay=document.createElement('div');overlay.id='cc-launch-history-overlay';
 overlay.style.cssText='position:fixed;inset:0;background:#061b3ca9;z-index:2147483550;display:flex;justify-content:center;align-items:center;padding:16px';
 const events=Array.isArray(x?.historico)?x.historico:[];
 overlay.innerHTML=`<section role="dialog" aria-modal="true" aria-label="HISTÓRICO DE ALTERAÇÕES DO LANÇAMENTO" style="background:#fff;color:#153c72;width:min(440px,100%);max-height:85vh;overflow:auto;border-radius:11px;box-shadow:0 14px 38px #0004;font:14px Arial"><header style="background:#244b7d;color:#fff;padding:20px;font-weight:bold;font-size:16px">HISTÓRICO DE ALTERAÇÕES — LANÇAMENTO</header><div style="padding:18px"><p><b>${x?'LANÇAMENTO Nº '+e(x.id):'NOVO LANÇAMENTO'}</b></p>${!x?'<p>GRAVE OU SELECIONE UM LANÇAMENTO PARA CONSULTAR SEU HISTÓRICO.</p>':events.length?`<table style="width:100%;border-collapse:collapse"><thead><tr style="background:#e1ecfa;text-align:left"><th style="padding:10px">DATA / HORA</th><th>OPERAÇÃO</th><th>USUÁRIO</th></tr></thead><tbody>${events.slice().reverse().map(h=>`<tr style="border-bottom:1px solid #dce7f6"><td style="padding:10px">${e(h.data||'—')}</td><td>${e(h.acao||'—')}</td><td>${e(h.usuario||'—')}</td></tr>`).join('')}</tbody></table>`:`<p>NÃO HÁ HISTÓRICO REGISTRADO PARA ESTE LANÇAMENTO.</p><p>ÚLTIMO USUÁRIO: <b>${e(x.usuario||'NÃO IDENTIFICADO')}</b></p><p style="font-size:12px">LANÇAMENTOS ANTERIORES À ATIVAÇÃO DO HISTÓRICO NÃO POSSUEM EVENTOS RETROATIVOS.</p>`}<div style="text-align:right;margin-top:18px"><button id="cc-launch-history-close" style="background:#1c548f;color:#fff;border:0;border-radius:5px;padding:11px 20px;cursor:pointer;font-weight:bold">FECHAR</button></div></div></section>`;
 document.body.appendChild(overlay);
 overlay.querySelector('#cc-launch-history-close').onclick=()=>overlay.remove();
 overlay.onclick=ev=>{if(ev.target===overlay)overlay.remove()};
}
function showCenterHistory(){
 const c=get().find(x=>x.id===selected);
 const old=document.getElementById('cc-history-overlay');if(old)old.remove();
 const entries=Array.isArray(c?.historico)?c.historico:[];
 const overlay=document.createElement('div');overlay.id='cc-history-overlay';
 overlay.style.cssText='position:fixed;inset:0;background:rgba(5,25,55,.65);z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:15px;box-sizing:border-box';
 overlay.innerHTML=`<div role="dialog" aria-modal="true" aria-label="HISTÓRICO DO CENTRO DE CUSTOS" style="background:white;width:min(440px,100%);max-height:85vh;overflow:auto;border-radius:11px;color:#153c72;box-shadow:0 12px 35px #0004;font:14px Arial,sans-serif"><div style="background:#244b7d;color:white;padding:20px;font-weight:bold;font-size:16px">HISTÓRICO — CENTRO DE CUSTOS</div><div style="padding:18px"><div style="margin-bottom:15px"><b>${c?e(c.id+' — '+c.name):'NOVO CADASTRO'}</b></div>${!c?'<p>GRAVE OU SELECIONE UM CENTRO DE CUSTOS PARA CONSULTAR SEU HISTÓRICO.</p>':entries.length?`<table style="width:100%;border-collapse:collapse"><thead><tr style="background:#e1ecfa;text-align:left"><th style="padding:10px">DATA / HORA</th><th>OPERAÇÃO</th><th>USUÁRIO</th></tr></thead><tbody>${entries.slice().reverse().map(h=>`<tr style="border-bottom:1px solid #dce7f6"><td style="padding:10px">${e(h.data)}</td><td>${e(h.acao)}</td><td>${e(h.usuario)}</td></tr>`).join('')}</tbody></table>`:`<p>NÃO HÁ EVENTOS DE HISTÓRICO REGISTRADOS NESTE CADASTRO.</p><p style="font-size:12px;color:#667">CADASTROS ANTERIORES À ATIVAÇÃO DO HISTÓRICO NÃO POSSUEM DATA E HORA RETROATIVAS.</p><p>ÚLTIMO USUÁRIO REGISTRADO: <b>${e(c.usuario||'NÃO IDENTIFICADO')}</b></p>`}<div style="text-align:right;margin-top:18px"><button id="cc-history-close" style="background:#1c548f;color:white;border:0;border-radius:5px;padding:11px 20px;cursor:pointer;font-weight:bold">FECHAR</button></div></div></div>`;
 document.body.appendChild(overlay);overlay.querySelector('#cc-history-close').onclick=()=>overlay.remove();overlay.onclick=ev=>{if(ev.target===overlay)overlay.remove()};overlay.querySelector('#cc-history-close').focus();
}
function saveCenter(edit){
 const a=get(),status=document.getElementById('cc-status').value,name=document.getElementById('cc-name').value.trim().replace(/\s+/g,' ').toLocaleUpperCase('pt-BR');
 if(!name)return ccNotice('INFORME A DESCRIÇÃO DO CENTRO DE CUSTOS.');
 if(a.some(x=>x.id!==selected&&x.name.toLocaleUpperCase('pt-BR')===name))return ccNotice('JÁ EXISTE UM CENTRO DE CUSTOS COM ESSA DESCRIÇÃO.');
 const c=a.find(x=>x.id===selected);
 if(edit&&!c)return ccNotice('SELECIONE UM CENTRO PARA ALTERAR.');
 if(c&&!edit)return ccNotice('PARA MODIFICAR UM CADASTRO EXISTENTE, CLIQUE EM ALTERAR.');
 const event={acao:c?'ALTERAÇÃO':'CADASTRO',usuario:usuario(),data:new Date().toLocaleString('pt-BR')};
 if(c){Object.assign(c,{name,status,usuario:event.usuario});c.historico=Array.isArray(c.historico)?c.historico:[];c.historico.push(event)}
 else{selected=Math.max(0,...a.map(x=>x.id))+1;a.push({id:selected,name,status,usuario:event.usuario,historico:[event]})}
 put(a);draft='';render();ccNotice('CADASTRO GRAVADO COM SUCESSO.');
}
async function changeStatus(status){const a=get(),c=a.find(x=>x.id===selected);if(!c)return ccNotice('SELECIONE UM CENTRO DE CUSTOS.');if(c.status===status)return ccNotice('O CENTRO JÁ ESTÁ '+status+'.');if(!permission())return ccNotice('USUÁRIO SEM ACESSO. Configure a permissão específica para inativar/reativar no cadastro de usuários.');if(!await ccAsk(`CONFIRMA ${status==='ATIVO'?'REATIVAR':'INATIVAR'} O CENTRO ${c.id} - ${c.name}?`))return;c.status=status;put(a);render()}
function printPage(type){const a=get(),c=a.find(x=>x.id===selected),shown=a.filter(x=>(filter==='TODOS'||x.status===filter)&&(!query||String(x.id).includes(query)||x.name.includes(query.toUpperCase())));if(type!=='list'&&!c)return ccNotice('SELECIONE UM CENTRO DE CUSTOS.');let title='',table='';if(type==='one'){title='CADASTRO DE CENTRO DE CUSTOS';table=`<table><tr><th>Código</th><th>Descrição</th><th>Situação</th></tr><tr><td>${c.id}</td><td>${e(c.name)}</td><td>${c.status}</td></tr></table>`}else if(type==='list'){title='LISTAGEM DE CENTROS DE CUSTOS';table=`<p>Filtro: ${filter} | Pesquisa: ${e(query||'Todas')} | Total: ${shown.length}</p><table><tr><th>Código</th><th>Descrição</th><th>Situação</th></tr>${shown.map(x=>`<tr><td>${x.id}</td><td>${e(x.name)}</td><td>${x.status}</td></tr>`).join('')}</table>`}else{title='EXTRATO DO CENTRO DE CUSTOS';table=`<p>Centro: ${c.id} - ${e(c.name)}</p><p>Não há despesas vinculadas disponíveis neste módulo. A integração com os lançamentos de despesas ainda precisa ser concluída.</p>`}document.getElementById('cc-print-area').innerHTML=`<h1>LUCAS LIMA — LOJA 01 – MATRIZ</h1><h2>${title}</h2><small>Emissão: ${new Date().toLocaleString('pt-BR')}</small>${table}`;window.print()}
const previous=window.open; // ERP usa a função global open() para navegar entre módulos.
window.LLopenCostFromDRE=id=>{const x=getL().find(x=>String(x.id)===String(id));if(!x)return false;lancId=Number(x.id);render();return true};
if(typeof open==='function'){const old=open;open=function(name){if(name==='CENTRO DE CUSTOS')return render();return old(name)}}
})();
