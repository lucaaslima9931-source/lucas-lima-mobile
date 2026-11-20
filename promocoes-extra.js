/* LUCAS LIMA - PROMOÇÕES DO PRODUTO. Integração ao cálculo de Vendas será feita no módulo Vendas. */
const Promo=(()=>{'use strict';
 const KEY='erp_matriz_promocoes_v1', PAYMENT_KEY='erp_matriz_formas_pagamento_v1';
 const HISTORY_KEY='erp_matriz_promocoes_historico_v1';
 const logHistory=(acao,registro,anterior=null)=>{try{const list=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');if(!Array.isArray(list))return;list.push({acao,registro:{...registro},anterior:anterior?{...anterior}:null,data:new Date().toISOString()});localStorage.setItem(HISTORY_KEY,JSON.stringify(list))}catch(e){console.warn('Histórico de promoções não salvo',e)}};
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 const decimal=v=>{let s=String(v??'').trim();if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');return Number(s)};
 const read=()=>{try{const d=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(d)?d:[]}catch{return []}};
 const payments=()=>{try{return (JSON.parse(localStorage.getItem(PAYMENT_KEY)||'{}').formas||[]).filter(x=>x.ativo&&x.vendas!==false)}catch{return []}};
 const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
 let dialog=null,closeKey=null;
 function open(){
  if(dialog)return;
  const p=products.find(x=>Number(x.codigo)===Number(current));
  if(!p){aviso('PROMOÇÕES','GRAVE OU SELECIONE UM PRODUTO ANTES DE CADASTRAR PROMOÇÕES.');return}
  const forms=payments();if(!forms.length){aviso('PROMOÇÕES','CADASTRE UMA FORMA DE PAGAMENTO ATIVA PARA VENDAS ANTES DE CRIAR A PROMOÇÃO.');return}
  let editing=null, searched=false;
  dialog=document.createElement('div');dialog.className='promo-overlay';dialog.innerHTML=`<section class="promo-dialog" role="dialog" aria-modal="true" aria-label="PROMOÇÕES DO PRODUTO"><header><strong>◆ PROMOÇÕES DO PRODUTO</strong><button type="button" id="promo-close" aria-label="Fechar">×</button></header><div class="promo-body"><div class="promo-info"><strong>PRODUTO ${esc(String(p.codigo).padStart(6,'0'))} — ${esc(p.descricao)}</strong><span>PREÇO NORMAL: ${money(p.preco)}</span></div><h3>NOVA PROMOÇÃO / ALTERAÇÃO</h3><div class="promo-fields"><label>DATA INICIAL *<input id="promo-start" type="date"></label><label>DATA FINAL *<input id="promo-end" type="date"></label><label>FORMA DE PAGAMENTO *<select id="promo-payment">${forms.map(f=>`<option value="${f.id}">${esc(f.descricao)}</option>`).join('')}</select></label><label>TIPO DE DESCONTO *<select id="promo-type"><option value="PERCENTUAL">PERCENTUAL (%)</option><option value="VALOR">VALOR (R$)</option></select></label><label>DESCONTO *<input id="promo-discount" type="text" inputmode="decimal" value="10,00"></label><label>PREÇO PROMOCIONAL <output id="promo-price">—</output></label><label class="promo-wide">OBSERVAÇÕES<input id="promo-notes" maxlength="250"></label></div><p id="promo-error" role="status" class="promo-error"></p><div class="promo-actions"><button id="promo-clear">NOVO</button><button id="promo-save" class="promo-primary">GRAVAR</button><button id="promo-update">ALTERAR</button><button id="promo-delete">EXCLUIR</button><button id="promo-replicate">REPLICAR</button></div><h3>PESQUISA DE PROMOÇÕES</h3><div class="promo-search"><label>DATA INICIAL<input id="promo-filter-start" type="date"></label><label>DATA FINAL<input id="promo-filter-end" type="date"></label><button id="promo-search-btn" class="promo-primary">PESQUISAR</button></div><h3>PROMOÇÕES CADASTRADAS</h3><div class="promo-table-wrap"><table><thead><tr><th>PERÍODO</th><th>FORMA DE PAGAMENTO</th><th>DESCONTO</th><th>PREÇO</th><th>SITUAÇÃO</th></tr></thead><tbody id="promo-list"></tbody></table></div><p class="promo-note">Para o mesmo produto e a mesma forma de pagamento, não são permitidos períodos sobrepostos. Formas diferentes podem ter promoções no mesmo período. A aplicação proporcional em pagamentos mistos será integrada ao módulo de Vendas.</p><div class="promo-footer"><button id="promo-exit">FECHAR</button></div></div></section>`;
  document.body.append(dialog);modalAberto=true;
  const $=id=>dialog?.querySelector('#'+id);
  const close=()=>{if(!dialog)return;document.removeEventListener('keydown',closeKey,true);dialog.remove();dialog=null;modalAberto=false};
  closeKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}else if(/^F\d+$/.test(e.key)){e.preventDefault();e.stopImmediatePropagation()}};
  document.addEventListener('keydown',closeKey,true);
  $('promo-close').onclick=close;$('promo-exit').onclick=close;
  const error=s=>{$('promo-error').textContent=s};
  const calc=()=>{const n=decimal($('promo-discount').value),base=Number(p.preco)||0;const price=$('promo-type').value==='PERCENTUAL'?base*(1-n/100):base-n;$('promo-price').textContent=Number.isFinite(price)&&price>=0?money(price):'VALOR INVÁLIDO'};
  const clear=()=>{editing=null;$('promo-start').value=today();$('promo-end').value=today();$('promo-payment').value=String(forms[0].id);$('promo-type').value='PERCENTUAL';$('promo-discount').value='10,00';$('promo-notes').value='';error('');calc()};
  const draw=()=>{const now=today(),start=$('promo-filter-start').value,end=$('promo-filter-end').value,rows=searched?read().filter(x=>String(x.produto)===String(p.codigo)&&(!start||x.fim>=start)&&(!end||x.inicio<=end)).sort((a,b)=>a.inicio.localeCompare(b.inicio)):[];$('promo-list').innerHTML=rows.map(x=>{const f=forms.find(y=>String(y.id)===String(x.formaId));const situacao=x.fim<now?'ENCERRADA':x.inicio>now?'PROGRAMADA':'ATIVA';const preco=x.tipo==='PERCENTUAL'?Number(p.preco)*(1-x.desconto/100):Number(p.preco)-x.desconto;return `<tr data-edit="${esc(x.id)}" title="Dê dois cliques para selecionar"><td>${esc(x.inicio.split('-').reverse().join('/'))} a ${esc(x.fim.split('-').reverse().join('/'))}</td><td>${esc(f?.descricao||x.formaNome||'FORMA INATIVA')}</td><td>${esc(x.desconto.toLocaleString('pt-BR'))}${x.tipo==='PERCENTUAL'?'%':' R$'}</td><td>${money(preco)}</td><td>${situacao}</td></tr>`}).join('')||(searched?'<tr><td colspan="5">NENHUMA PROMOÇÃO ENCONTRADA.</td></tr>':'<tr><td colspan="5">CLIQUE EM PESQUISAR PARA EXIBIR AS PROMOÇÕES.</td></tr>');
   $('promo-list').querySelectorAll('tr[data-edit]').forEach(b=>b.ondblclick=()=>{const x=read().find(z=>String(z.id)===b.dataset.edit);if(!x)return;editing=x.id;$('promo-start').value=x.inicio;$('promo-end').value=x.fim;$('promo-payment').value=String(x.formaId);$('promo-type').value=x.tipo;$('promo-discount').value=String(x.desconto).replace('.',',');$('promo-notes').value=x.observacoes||'';error('');calc()});

  };
  $('promo-search-btn').onclick=()=>{if($('promo-filter-start').value&&$('promo-filter-end').value&&$('promo-filter-start').value>$('promo-filter-end').value)return error('DATA INICIAL MAIOR QUE A DATA FINAL.');searched=true;error('');draw()};
  $('promo-filter-start').onchange=()=>{searched=false;draw()};$('promo-filter-end').onchange=()=>{searched=false;draw()};
  $('promo-clear').onclick=clear;
  $('promo-replicate').onclick=()=>{
   if(!editing)return error('SELECIONE UMA PROMOÇÃO COM DOIS CLIQUES PARA REPLICAR.');
   const original=read().find(x=>String(x.id)===String(editing));if(!original)return error('PROMOÇÃO NÃO ENCONTRADA.');
   const choices=forms.filter(f=>String(f.id)!==String(original.formaId));
   if(!choices.length)return error('NÃO EXISTEM OUTRAS FORMAS DE PAGAMENTO ATIVAS.');
   const overlay=document.createElement('div');overlay.className='promo-rep-overlay';
   overlay.innerHTML=`<section class="promo-rep-dialog" role="dialog" aria-modal="true"><header>REPLICAR PROMOÇÃO</header><div class="promo-rep-content"><p>ESCOLHA AS FORMAS DE PAGAMENTO PARA COPIAR A PROMOÇÃO:</p>${choices.map(f=>`<label><input type="checkbox" value="${esc(f.id)}"> ${esc(f.descricao)}</label>`).join('')}<p class="promo-rep-message" role="status"></p><div class="promo-rep-actions"><button type="button" id="promo-rep-confirm" class="promo-primary">REPLICAR</button><button type="button" id="promo-rep-cancel">CANCELAR</button></div></div></section>`;
   dialog.append(overlay);const dismiss=()=>overlay.remove();overlay.querySelector('#promo-rep-cancel').onclick=dismiss;
   overlay.querySelector('#promo-rep-confirm').onclick=()=>{
    const ids=[...overlay.querySelectorAll('input:checked')].map(x=>String(x.value));
    const msg=overlay.querySelector('.promo-rep-message');if(!ids.length){msg.textContent='SELECIONE PELO MENOS UMA FORMA DE PAGAMENTO.';return}
    const all=read(),conflicts=ids.filter(id=>all.some(x=>String(x.produto)===String(p.codigo)&&String(x.formaId)===id&&original.inicio<=x.fim&&original.fim>=x.inicio));
    if(conflicts.length){msg.textContent='JÁ EXISTE PROMOÇÃO NO MESMO PERÍODO PARA: '+conflicts.map(id=>forms.find(f=>String(f.id)===id)?.descricao||id).join(', ');return}
    ids.forEach(id=>{const f=forms.find(x=>String(x.id)===id);all.push({...original,id:String(Date.now())+'-'+Math.random().toString(36).slice(2,9),formaId:id,formaNome:f.descricao,alteradoEm:new Date().toISOString()})});
    try{localStorage.setItem(KEY,JSON.stringify(all));all.slice(-ids.length).forEach(x=>logHistory('REPLICAÇÃO',x,original));dismiss();clear();draw();error(ids.length+' PROMOÇÃO(ÕES) REPLICADA(S) COM SUCESSO.')}catch{msg.textContent='NÃO FOI POSSÍVEL GRAVAR AS PROMOÇÕES.'}
   };
  };
  $('promo-delete').onclick=()=>{if(!editing)return error('SELECIONE UMA PROMOÇÃO PARA EXCLUIR.');if(!window.confirm('CONFIRMA EXCLUIR A PROMOÇÃO SELECIONADA?'))return;try{const existing=read().find(x=>String(x.id)===String(editing));localStorage.setItem(KEY,JSON.stringify(read().filter(x=>String(x.id)!==String(editing))));if(existing)logHistory('EXCLUSÃO',existing);clear();draw();error('PROMOÇÃO EXCLUÍDA.')}catch{error('NÃO FOI POSSÍVEL EXCLUIR.')}};
  $('promo-update').onclick=()=>{if(!editing)return error('SELECIONE UMA PROMOÇÃO PARA ALTERAR.');savePromotion(true)};
  $('promo-type').onchange=calc;$('promo-discount').oninput=calc;
  $('promo-save').onclick=()=>savePromotion(false);
  function savePromotion(update){
   if(update&&!editing)return error('SELECIONE UMA PROMOÇÃO PARA ALTERAR.');const inicio=$('promo-start').value,fim=$('promo-end').value,formaId=String($('promo-payment').value),tipo=$('promo-type').value,desconto=decimal($('promo-discount').value),base=Number(p.preco)||0;const forma=forms.find(x=>String(x.id)===formaId);
   if(!inicio||!fim||fim<inicio)return error('INFORME UM PERÍODO VÁLIDO.');
   if(!forma)return error('SELECIONE UMA FORMA DE PAGAMENTO ATIVA.');
   if(!Number.isFinite(desconto)||desconto<=0||(tipo==='PERCENTUAL'&&desconto>=100)||(tipo==='VALOR'&&desconto>=base))return error('DESCONTO INVÁLIDO: DEVE SER MAIOR QUE ZERO E MENOR QUE O PREÇO DO PRODUTO.');
   const all=read();if(all.some(x=>String(x.produto)===String(p.codigo)&&String(x.formaId)===formaId&&String(x.id)!==String(update?editing:null)&&inicio<=x.fim&&fim>=x.inicio))return error('JÁ EXISTE PROMOÇÃO PARA ESTA FORMA DE PAGAMENTO COM DATAS SOBREPOSTAS.');
   const id=(update?editing:null)||String(Date.now())+'-'+Math.random().toString(36).slice(2,7),record={id,produto:p.codigo,formaId,formaNome:forma.descricao,inicio,fim,tipo,desconto,observacoes:$('promo-notes').value.trim(),alteradoEm:new Date().toISOString()};const index=all.findIndex(x=>String(x.id)===String(id));const old=index>=0?{...all[index]}:null;if(index<0)all.push(record);else all[index]=record;
   try{localStorage.setItem(KEY,JSON.stringify(all));logHistory(update?'ALTERAÇÃO':'CADASTRO',record,old);clear();draw();error('PROMOÇÃO GRAVADA COM SUCESSO.')}catch{error('NÃO FOI POSSÍVEL SALVAR. VERIFIQUE O ARMAZENAMENTO DO NAVEGADOR.')}
  }
  clear();draw();
 }
 // Interface para a futura integração em Vendas: descontos por forma e por valor-base alocado.
 function discountFor(productCode,formId,date,baseValue){const x=read().find(r=>String(r.produto)===String(productCode)&&String(r.formaId)===String(formId)&&date>=r.inicio&&date<=r.fim);if(!x)return 0;const base=Math.max(0,Number(baseValue)||0);return Math.min(base,x.tipo==='PERCENTUAL'?base*x.desconto/100:base*x.desconto/Math.max(0.01,Number(products.find(p=>String(p.codigo)===String(productCode))?.preco)||0.01))}
 return {open,discountFor};
})();
