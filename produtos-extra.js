/* LUCAS LIMA — JANELAS AVANÇADAS DO CADASTRO DE PRODUTOS */
'use strict';
const PM = (() => {
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 const number=v=>num(v);
 const selected=()=>products.find(p=>Number(p.codigo)===Number(current));
 const data=()=>new Date().toLocaleString('pt-BR');
 const usuarioEmissao=()=>String(window.LucasLimaAuditoria?.usuarioAtual?.()||document.querySelector('.top-user strong')?.textContent?.trim()||'USUÁRIO NÃO IDENTIFICADO').trim();
 const rodapeEmissao=()=>`EMITIDO EM ${new Date().toLocaleDateString('pt-BR')}, POR ${usuarioEmissao()}.`;
 const overlay=(title,html,onReady)=>{if(document.querySelector('.pm-overlay'))return;modalAberto=true;const o=document.createElement('div');o.className='pm-overlay';o.innerHTML=`<div class="pm-dialog" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header class="pm-head"><strong>${esc(title)}</strong><button type="button" class="pm-x" data-close>×</button></header><div class="pm-body">${html}</div></div>`;document.body.append(o);const close=()=>{o.remove();modalAberto=false;document.removeEventListener('keydown',keys,true)};o.querySelectorAll('[data-close]').forEach(b=>b.onclick=close);const keys=ev=>{if(ev.key==='Escape'){ev.preventDefault();ev.stopImmediatePropagation();close();}else if(/^F\d+$/.test(ev.key)){ev.preventDefault();ev.stopImmediatePropagation();}};document.addEventListener('keydown',keys,true);onReady(o,close);};
 const button=(name,fn)=>{const b=document.createElement('button');b.type='button';b.className='action-button blue';b.textContent=name;b.onclick=fn;return b;};
 const persist=()=>save(KEY,products);
 const dateOf=x=>{const s=String(x||'');if(/^\d{2}\/\d{2}\/\d{4}/.test(s)){const [d,m,y]=s.slice(0,10).split('/');return `${y}-${m}-${d}`;}return s.slice(0,10)};
 function log(p,tipo,anterior,atual,origem='CADASTRO'){p.historico=Array.isArray(p.historico)?p.historico:[];p.historico.push({data:new Date().toISOString(),tipo,anterior,atual,origem,usuario:'DEMONSTRAÇÃO'});}
 function barcode(n){const stem='20'+String(n).padStart(10,'0');let sum=0;for(let i=0;i<12;i++)sum+=Number(stem[i])*(i%2?3:1);return stem+((10-sum%10)%10)}
 const patterns={L:['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'],G:['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'],R:['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100']};
 const parity=['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];
 function barcodeSVG(code){const c=String(code||'');if(!/^\d{13}$/.test(c))return `<div class="pm-no-bar">${esc(c||'SEM CÓDIGO DE BARRAS')}</div>`;const checksum=barcodeCheck(c);if(!checksum)return `<div class="pm-no-bar">CÓDIGO EAN-13 INVÁLIDO: ${esc(c)}</div>`;let bits='101';for(let i=1;i<=6;i++)bits+=patterns[parity[Number(c[0])][i-1]][Number(c[i])];bits+='01010';for(let i=7;i<13;i++)bits+=patterns.R[Number(c[i])];bits+='101';let rect='';for(let i=0;i<bits.length;i++)if(bits[i]==='1')rect+=`<rect x="${i+8}" y="3" width="1" height="${i<3||i>=92||i>=45&&i<50?47:42}" fill="black"/>`;return `<svg class="pm-bar-svg" viewBox="0 0 111 64" role="img" aria-label="Código de barras ${c}"><rect width="111" height="64" fill="white"/>${rect}<text x="55" y="60" text-anchor="middle" font-size="9" font-family="Arial">${c}</text></svg>`}
 function barcodeCheck(c){const body=c.slice(0,12);let sum=0;for(let i=0;i<12;i++)sum+=Number(body[i])*(i%2?3:1);return (10-sum%10)%10===Number(c[12]);}
 // A ficha do produto usa um documento de impressão próprio, independente das etiquetas.
 let productPrintBusy=false;
 function printProductSheet(title,content,landscape=false){
  if(productPrintBusy)return;
  productPrintBusy=true;
  document.getElementById('pm-product-print-frame')?.remove();
  const frame=document.createElement('iframe');
  frame.id='pm-product-print-frame';
  frame.setAttribute('aria-hidden','true');
  frame.style.cssText='position:fixed;left:-10000px;top:0;width:1px;height:1px;border:0;visibility:hidden';
  const css=`@page{size:A4 ${landscape?'landscape':'portrait'};margin:10mm}*{box-sizing:border-box}html,body{margin:0;padding:0}body{font:11px Arial,sans-serif;color:#102b4e;background:white}h1{font-size:19px;margin:0 0 7px}h2{font-size:15px;margin:10px 0 7px;padding:0;border:0}.pm-print-head{padding:0 0 10px;margin:0 0 12px;border:0}.pm-print-head p{font-size:10px;margin:0}.pm-product-photo-print{display:flex;justify-content:flex-end;margin:0 0 8px 12px;float:right;break-inside:avoid}.pm-product-photo-print img{max-width:48mm;max-height:48mm;width:auto;height:auto;object-fit:contain}.pm-print-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px 14px}.pm-has-photo{display:block;width:calc(100% - 54mm);min-height:48mm;columns:2;column-gap:10px}.pm-has-photo .pm-print-cell{break-inside:avoid;margin-bottom:6px}.pm-print-grid:after{content:"";display:block;clear:both}.pm-print-cell{border:0!important;outline:0!important;box-shadow:none!important;padding:4px 0;font-size:11px;overflow-wrap:anywhere;break-inside:avoid}.pm-print-cell strong{display:block;margin:0 0 3px;font-size:10px}.pm-bar-svg{display:block;width:175px;height:95px;margin:8px 0}table{border-collapse:collapse;width:100%;font-size:10px}th,td{border:0!important;padding:5px;text-align:left}th{font-weight:bold}tr{break-inside:avoid}button{display:none!important}.pm-emissao-footer{text-align:right;margin-top:16px;font-size:10px;font-weight:bold;break-inside:avoid}`;
  let frameLoaded=false;
  frame.onload=()=>{
   if(frameLoaded)return; // evita imprimir duas vezes quando o iframe dispara load novamente
   frameLoaded=true;
   const win=frame.contentWindow;
   if(!win)return;
   let printed=false;
   const cleanup=()=>{productPrintBusy=false;setTimeout(()=>frame.remove(),500)};
   win.addEventListener('afterprint',cleanup,{once:true});
   setTimeout(()=>{if(printed)return;printed=true;try{win.focus();win.print()}catch(e){cleanup();aviso('IMPRESSÃO','NÃO FOI POSSÍVEL ABRIR A IMPRESSÃO.')}},180);
   setTimeout(()=>{if(productPrintBusy){productPrintBusy=false}},3000);
  };
  frame.srcdoc=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${css}</style></head><body>${content}</body></html>`;
  document.body.appendChild(frame);
 }
 // Imprime etiquetas na própria janela do Chrome, sem abrir aba ou popup adicional.
 // A4: todas as etiquetas solicitadas cabem em uma única folha, em grade automática.
 // Térmica: uma etiqueta por página no tamanho físico selecionado.
 let labelsPrintBusy=false;
 function printLabelsChrome(title,content,paper='A4',landscape=false,qty=1,perPage=1,w=50,h=30){
  if(labelsPrintBusy)return;
  labelsPrintBusy=true;
  document.getElementById('pm-chrome-print-frame')?.remove();
  const frame=document.createElement('iframe');frame.id='pm-chrome-print-frame';frame.setAttribute('aria-hidden','true');frame.style.cssText='position:fixed;left:-10000px;top:0;width:1px;height:1px;border:0';
  const a4=paper==='A4',pw=a4?(landscape?297:210):w,ph=a4?(landscape?210:297):h;
  const usableW=a4?pw-16:pw,usableH=a4?ph-16:ph;
  const cols=a4?Math.max(1,Math.floor(usableW/w)):1,rows=a4?Math.max(1,Math.floor(usableH/h)):1;
  const max=cols*rows;
  if(a4&&perPage>max){labelsPrintBusy=false;aviso('ETIQUETAS',`NESTE TAMANHO CABEM NO MÁXIMO ${max} ETIQUETAS POR FOLHA A4.`);return;}
  const pages=[];const pieces=content.match(/<div class="pm-label">[\s\S]*?<\/div>/g)||[];
  for(let i=0;i<pieces.length;i+=a4?perPage:1){pages.push(`<div class="pm-print-page"><div class="pm-labels">${pieces.slice(i,i+(a4?perPage:1)).join('')}</div></div>`)}
  const css=`@page{size:${a4?'A4 '+(landscape?'landscape':'portrait'):`${w}mm ${h}mm`};margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;font-family:Arial,sans-serif;color:#102b4e}.pm-print-page{width:${pw}mm;height:${ph}mm;overflow:hidden;break-after:page;page-break-after:always;position:relative}.pm-print-page:last-child{break-after:auto;page-break-after:auto}.pm-labels{display:grid;grid-template-columns:repeat(${a4?cols:1},${w}mm);grid-auto-rows:${h}mm;gap:0;${a4?'margin:8mm':'margin:0'};align-content:start;justify-content:start}.pm-label{width:${w}mm;height:${h}mm;min-width:0;min-height:0;padding:0.8mm;border:0;outline:0;box-shadow:none;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:0.2mm}.pm-label strong{font-size:${Math.max(5,Math.min(10,w/7))}pt;line-height:1.05;overflow-wrap:anywhere}.pm-label b{font-size:${Math.max(7,Math.min(14,w/5))}pt;line-height:1.05}.pm-label small{font-size:5pt;line-height:1.05}.pm-bar-svg{display:block;width:90%;height:${Math.max(5,Math.min(13,h*.33))}mm;max-width:100%;flex-shrink:1}`;
  let started=false;
  const cleanup=()=>{labelsPrintBusy=false;setTimeout(()=>frame.remove(),300)};
  frame.addEventListener('load',()=>{if(started)return;started=true;setTimeout(()=>{try{frame.contentWindow.addEventListener('afterprint',cleanup,{once:true});frame.contentWindow.focus();frame.contentWindow.print()}catch(e){cleanup();aviso('IMPRESSÃO','NÃO FOI POSSÍVEL ABRIR A JANELA DO CHROME.')}},350)},{once:true});
  document.body.appendChild(frame);frame.srcdoc=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${css}</style></head><body>${pages.join('')}</body></html>`;
 }
 function company(){
  const read=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'null')||{}}catch{return {}}};
  const official=read('erp_systems_dados_loja_v1');
  const stores=read('erp_matriz_lojas_v1');
  const main=Array.isArray(stores)?stores[0]||{}:Array.isArray(stores.lojas)?stores.lojas[0]||{}:{};
  const current=read('erp_matriz_loja');
  const legacy=read('lucas_lima_loja');
  const valid=v=>typeof v==='string'&&v.trim()&&!/^(LOJA\s*0?1\s*[–-]\s*MATRIZ|NOME DA EMPRESA)$/i.test(v.trim());
  return [official.nomeFantasia,official.nome,official.razaoSocial,main.nomeFantasia,main.nome,main.razaoSocial,current.nomeFantasia,current.nome,current.razaoSocial,legacy.nomeFantasia,legacy.nome].find(valid)||'NOME DA LOJA NÃO CADASTRADO';
 }
 function history(){
  const p=selected();if(!p)return aviso('HISTÓRICO','SELECIONE UM PRODUTO GRAVADO.');
  const tabs=[['PREÇOS DE VENDA','PREÇO'],['CUSTOS DE COMPRA','CUSTO'],['MOVIMENTAÇÕES DE ESTOQUE','ESTOQUE'],['HISTÓRICO DE PROMOÇÕES','PROMOÇÕES']];
  const html=`<div class="pm-info"><strong>CÓDIGO: ${esc(p.codigo)}</strong><strong>PRODUTO: ${esc(p.descricao)}</strong><span>MARCA: ${esc(p.marca)}</span><span>CATEGORIA: ${esc(p.categoria)}</span></div><div class="pm-tabs">${tabs.map((t,i)=>`<button class="pm-tab ${i===0?'selected':''}" data-tab="${i}">${t[0]}</button>`).join('')}</div><div class="pm-table-wrap" id="pm-history-table"></div></div><div class="pm-footer"><button data-close>FECHAR</button></div>`;
  overlay('HISTÓRICO DO PRODUTO',html,(o,close)=>{
   let tab=0;
   const promoHistory=()=>{
    const readJSON=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||'null');return Array.isArray(v)?v:fallback}catch{return fallback}};
    const active=readJSON('erp_matriz_promocoes_v1',[]).filter(x=>String(x.produto)===String(p.codigo));
    const events=readJSON('erp_matriz_promocoes_historico_v1',[]).filter(x=>String(x.registro?.produto)===String(p.codigo));
    const seen=new Set(events.map(x=>String(x.registro?.id)));
    const rows=events.map(x=>({date:x.data,acao:x.acao,rec:x.registro,old:x.anterior}));
    active.filter(x=>!seen.has(String(x.id))).forEach(x=>rows.push({date:x.alteradoEm||x.inicio,acao:'CADASTRO (ANTERIOR)',rec:x}));
    const from='',to='';
    return rows.filter(x=>{const d=dateOf(x.date);return (!from||d>=from)&&(!to||d<=to)}).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
   };
   const drawPromos=()=>{const rows=promoHistory(),today=new Date().toLocaleDateString('en-CA');o.querySelector('#pm-history-table').innerHTML=`<table><thead><tr><th>DATA DO REGISTRO</th><th>AÇÃO</th><th>PERÍODO</th><th>FORMA DE PAGAMENTO</th><th>DESCONTO</th><th>PREÇO PROMOCIONAL</th><th>SITUAÇÃO</th></tr></thead><tbody>${rows.map(x=>{const r=x.rec||{},discount=Number(r.desconto)||0,price=r.tipo==='PERCENTUAL'?Number(p.preco||0)*(1-discount/100):Number(p.preco||0)-discount,status=x.acao==='EXCLUSÃO'?'EXCLUÍDA':r.fim<today?'ENCERRADA':r.inicio>today?'PROGRAMADA':'ATIVA';return `<tr><td>${esc(x.date?new Date(x.date).toLocaleString('pt-BR'):'—')}</td><td>${esc(x.acao)}</td><td>${esc((r.inicio||'').split('-').reverse().join('/'))} a ${esc((r.fim||'').split('-').reverse().join('/'))}</td><td>${esc(r.formaNome||r.formaId||'—')}</td><td>${esc(discount.toLocaleString('pt-BR'))}${r.tipo==='PERCENTUAL'?'%':' R$'}</td><td>${esc(fmt(Math.max(0,price)))}</td><td>${esc(status)}</td></tr>`}).join('')||'<tr><td colspan="7">NENHUMA PROMOÇÃO ENCONTRADA NESTE PERÍODO.</td></tr>'}</tbody></table>`};
   const hist=()=>{
    let records=(p.historico||[]).filter(x=>{const t=String(x.tipo||'').toUpperCase();if(tab===0)return t.includes('PREÇO')||(!t&&x.precoNovo!==undefined&&x.precoNovo!==x.precoAnterior);if(tab===1)return t.includes('CUSTO')||(!t&&x.custoNovo!==undefined&&x.custoNovo!==x.custoAnterior);return t.includes('ESTOQUE')||t.includes('MOVIMENT');});
    if(tab===2){const op=(()=>{try{return JSON.parse(localStorage.getItem('erp_matriz_operacoes_v2')||'{}')}catch{return {}}})();for(const x of op.entradas||[])if(x.situacao==='BAIXADA')for(const it of x.itens||[])if(String(it.codigo)===String(p.codigo))records.push({data:x.data,tipo:'ENTRADA',origem:`ENTRADA Nº ${x.id}`,anterior:'',atual:`+${it.quantidade}`});for(const source of [op.vendas||[],(()=>{try{return JSON.parse(localStorage.getItem('erp_matriz_vendas_v1')||'[]')}catch{return []}})()])for(const x of source){const number=x.id??x.numero;const quantity=(x.itens||[]).filter(it=>String(it.codigo??it.produtoCodigo)===String(p.codigo)).reduce((sum,it)=>sum+(Number(it.quantidade)||0),0);if(!quantity)continue;if(x.situacao==='BAIXADA')records.push({data:x.baixadaEm||x.data,tipo:'VENDA BAIXADA',origem:`VENDA Nº ${number}`,anterior:'',atual:`-${quantity}`});else if(x.situacao==='CANCELADA')records.push({data:x.canceladaEm||x.data,tipo:'VENDA CANCELADA',origem:`VENDA Nº ${number}`,anterior:'',atual:'SEM MOVIMENTAÇÃO'});}}
    if(tab===2){
     // A mesma fonte de movimentos da Ficha de Estoque; não grava novamente no estoque.
     let trades=[];try{trades=JSON.parse(localStorage.getItem('erp_matriz_trocas_v1')||'[]')}catch(e){}
     if(Array.isArray(trades))for(const t of trades){
      const code=String(p.codigo),q=(arr)=>Array.isArray(arr)?arr.filter(it=>String(it.codigo??it.produtoCodigo)===code).reduce((sum,it)=>sum+(Number(it.quantidade)||0),0):0;
      const returned=q(t.devolvidos),outgoing=q(t.novos),id=t.numero??t.id;
      const effective=t.situacao==='BAIXADA'||(t.situacao==='CANCELADA'&&!!t.baixadaEm);
      if(!effective)continue;
      const when=t.baixadaEm||t.data;
      if(returned&&t.condicao!=='AVARIA')records.push({data:when,tipo:'ENTRADA — TROCA',origem:`TROCA Nº ${id} — PRODUTO DEVOLVIDO`,anterior:'',atual:`+${returned}`});
      if(outgoing)records.push({data:when,tipo:'SAÍDA — TROCA',origem:`TROCA Nº ${id} — PRODUTO NOVO`,anterior:'',atual:`-${outgoing}`});
      if(t.situacao==='CANCELADA'){
       const cancelDate=t.canceladaEm||t.data;
       if(returned&&t.condicao!=='AVARIA')records.push({data:cancelDate,tipo:'CANCELAMENTO — TROCA',origem:`TROCA Nº ${id} — ESTORNO DA ENTRADA`,anterior:'',atual:`-${returned}`});
       if(outgoing)records.push({data:cancelDate,tipo:'CANCELAMENTO — TROCA',origem:`TROCA Nº ${id} — ESTORNO DA SAÍDA`,anterior:'',atual:`+${outgoing}`});
      }
     }
    }
    const from='',to='';
    return records.filter(x=>(!from||dateOf(x.data)>=from)&&(!to||dateOf(x.data)<=to)).sort((a,b)=>String(b.data).localeCompare(String(a.data)));
   };
   const drawEstoque=()=>{
    const host=o.querySelector('#pm-history-table');
    if(typeof window.LL_fichaEstoqueHistoricoCompartilhado!=='function'){
     host.textContent='NÃO FOI POSSÍVEL CONSULTAR A FICHA DE ESTOQUE.';return;
    }
    const latest=typeof window.LL_estoqueCentralConciliar==='function'?window.LL_estoqueCentralConciliar():products;
    const stock=Array.isArray(latest)?latest.find(x=>String(x.codigo)===String(p.codigo))||p:p;
    const {rows,base}=window.LL_fichaEstoqueHistoricoCompartilhado(p.codigo,stock);
    const from='',to='';
    const filtered=rows.filter(r=>(!from||r.day>=from)&&(!to||r.day<=to)).slice().reverse();
    let opening=base;for(const r of rows)if(from&&r.day<from)opening+=r.qty;
    const dt=d=>/^\d{4}-\d{2}-\d{2}$/.test(String(d||''))?d.slice(8)+'/'+d.slice(5,7)+'/'+d.slice(0,4):d;
    const nf=n=>Number(n||0).toLocaleString('pt-BR',{maximumFractionDigits:3});
    const tr=filtered.map((r,i)=>`<tr data-pm-stock-move="${i}" style="background:${r.kind==='cancelada'?'#ffe5e7':r.kind==='entrada'?'#e1f6e8':'#e3edfc'};cursor:pointer" title="DOIS CLIQUES PARA VISUALIZAR"><td>${esc(dt(r.day))}</td><td>${esc(r.doc)}</td><td>${esc(r.desc)}</td><td>${r.qty>0?nf(r.qty):'—'}</td><td>${r.qty<0?nf(-r.qty):'—'}</td><td>${nf(r.balance)}</td><td>${esc(r.who)}</td><td>${esc(r.obs)}</td></tr>`).join('');
    host.innerHTML=`<table><thead><tr><th>DATA</th><th>DOCUMENTO</th><th>MOVIMENTAÇÃO</th><th>ENTRADA</th><th>SAÍDA</th><th>SALDO</th><th>USUÁRIO</th><th>OBSERVAÇÕES</th></tr></thead><tbody>${tr||'<tr><td colspan="8">NENHUMA MOVIMENTAÇÃO NO PERÍODO.</td></tr>'}<tr><td>${from?esc(dt(from)):'—'}</td><td>—</td><td><strong>SALDO ANTERIOR</strong></td><td>—</td><td>—</td><td>${nf(opening)}</td><td>—</td><td>—</td></tr></tbody></table>`;
    host.querySelectorAll('[data-pm-stock-move]').forEach(el=>el.ondblclick=()=>{
     const r=filtered[Number(el.dataset.pmStockMove)];
     if(typeof window.LL_fichaEstoqueAbrirMovimento==='function'){
      close();window.LL_fichaEstoqueAbrirMovimento(r);
     }
    });
   };
   const draw=()=>{if(tab===2){drawEstoque();return;}if(tab===3){drawPromos();return;}const r=hist();o.querySelector('#pm-history-table').innerHTML=`<table><thead><tr><th>DATA</th><th>TIPO</th><th>ANTERIOR</th><th>ATUAL / NOVO</th><th>ORIGEM</th></tr></thead><tbody>${r.map(x=>`<tr><td>${esc(x.data)}</td><td>${esc(x.tipo||'ALTERAÇÃO')}</td><td>${esc(x.anterior??x.precoAnterior??x.custoAnterior??'—')}</td><td>${esc(x.atual??x.precoNovo??x.custoNovo??'—')}</td><td>${esc(x.origem||'CADASTRO')}</td></tr>`).join('')||'<tr><td colspan="5">NENHUM REGISTRO NESTE PERÍODO.</td></tr>'}</tbody></table>`};
   
   o.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=Number(b.dataset.tab);o.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('selected',x===b));draw()});
   draw();
   o.querySelectorAll('[data-close]').forEach(x=>x.onclick=close);
  });
 }
 function simulator(){const p=selected();if(!p)return aviso('SIMULAR PREÇOS','GRAVE OU SELECIONE UM PRODUTO ANTES DE SIMULAR.');const html=`<div class="pm-info"><strong>${esc(p.codigo)} — ${esc(p.descricao)}</strong><span>CUSTO ATUAL: ${fmt(p.custo)}</span><span>PREÇO ATUAL: ${fmt(p.preco)}</span></div><div class="pm-two"><section><h3>PARÂMETROS DA SIMULAÇÃO</h3><label>DESPESAS ADICIONAIS (R$)<input id="pm-exp" value="0,00"></label><label>DESPESAS ADICIONAIS (%)<input id="pm-exp-pct" value="0"></label><label>TAXA SOBRE A VENDA (%)<input id="pm-fee" value="0"></label><label>MARGEM DE LUCRO DESEJADA (%)<input id="pm-margin" value="30"></label><label>PREÇO FINAL MANUAL (OPCIONAL)<input id="pm-manual" placeholder="Deixe vazio para sugerido"></label></section><section><h3>RESULTADO DA SIMULAÇÃO</h3><div id="pm-result" class="pm-results"></div></section></div><h3>COMPARAÇÃO COM O PREÇO ATUAL</h3><div id="pm-compare" class="pm-results"></div><div class="pm-footer"><button id="pm-apply" class="pm-primary">APLICAR PREÇO</button><button data-close>FECHAR</button></div>`;overlay('SIMULAR PREÇOS',html,(o,close)=>{let final=0;const draw=()=>{const expenses=number(o.querySelector('#pm-exp').value),ep=number(o.querySelector('#pm-exp-pct').value),fee=number(o.querySelector('#pm-fee').value),margin=number(o.querySelector('#pm-margin').value),manual=o.querySelector('#pm-manual').value.trim();const base=Number(p.custo)+expenses;const denom=1-(fee+margin)/100;const suggested=denom>0?base/denom:NaN;final=manual?number(manual):suggested;const profit=final*(1-fee/100)-base;const actualMargin=final>0?profit/final*100:0;const ok=[expenses,ep,fee,margin,base,final].every(Number.isFinite)&&expenses>=0&&ep>=0&&fee>=0&&margin>=0&&denom>0&&final>base/(1-fee/100);o.querySelector('#pm-result').innerHTML=ok?`<p>CUSTO TOTAL: <strong>${fmt(base)}</strong></p><p>PREÇO SUGERIDO: <strong>${fmt(suggested)}</strong></p><p>PREÇO FINAL: <strong>${fmt(final)}</strong></p><p>TAXA DE VENDA: <strong>${fmt(final*fee/100)}</strong></p><p>LUCRO LÍQUIDO UNITÁRIO: <strong>${fmt(profit)}</strong></p><p>MARGEM REAL: <strong>${actualMargin.toFixed(2)}%</strong></p>`:'<p class="pm-error">VERIFIQUE OS VALORES: A SOMA DE TAXA E MARGEM DEVE SER MENOR QUE 100%, E O PREÇO PRECISA COBRIR OS CUSTOS.</p>';o.querySelector('#pm-compare').textContent=`PREÇO ATUAL: ${fmt(p.preco)}  |  SIMULADO: ${ok?fmt(final):'INVÁLIDO'}  |  DIFERENÇA: ${ok?fmt(final-p.preco):'—'}`;o.querySelector('#pm-apply').disabled=!ok;};const expenseValue=o.querySelector('#pm-exp'),expensePercent=o.querySelector('#pm-exp-pct');
 const cost=Number(p.custo)||0;
 expenseValue.addEventListener('input',()=>{const value=number(expenseValue.value);expensePercent.value=Number.isFinite(value)&&cost>0?String(+(value/cost*100).toFixed(4)).replace('.',','):'0';draw()});
 expensePercent.addEventListener('input',()=>{const pct=number(expensePercent.value);expenseValue.value=Number.isFinite(pct)&&cost>0?(cost*pct/100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:4}):'0,00';draw()});
 o.querySelectorAll('#pm-fee,#pm-margin,#pm-manual').forEach(x=>x.addEventListener('input',draw));o.querySelector('#pm-apply').onclick=async()=>{if(!Number.isFinite(final)||final<=Number(p.custo))return;close();if(await confirmar('APLICAR PREÇO',`ALTERAR O PREÇO DE ${p.descricao} DE ${fmt(p.preco)} PARA ${fmt(final)}?`)){const old=p.preco;log(p,'PREÇO DE VENDA',old,+final.toFixed(2),'SIMULADOR DE PREÇOS');p.preco=+final.toFixed(2);persist();loadProduct(p.codigo);renderList();await aviso('SUCESSO','PREÇO ALTERADO E REGISTRADO NO HISTÓRICO.');}};draw()});}
 function labels(){
 const p=selected();if(!p)return aviso('ETIQUETAS','SELECIONE UM PRODUTO GRAVADO.');
 const key='lucas_lima_modelos_etiquetas_v210';let models=[];try{models=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(models))models=[]}catch(e){}
 const html=`<div class="pm-info"><strong>${esc(p.codigo)} — ${esc(p.descricao)}</strong><span>PREÇO: ${fmt(p.preco)}</span><span>CÓDIGO DE BARRAS: ${esc(p.barras)}</span></div>
 <div class="pm-two"><section><h3>CADASTRO DE MODELOS</h3>
 <label>MODELOS CADASTRADOS<select id="pm-model"><option value="">SELECIONE UM MODELO</option></select></label>
 <label>NOME DO MODELO<input id="pm-model-name" placeholder="DIGITE O NOME DO MODELO"></label>
 <label>LARGURA (MM)<input id="pm-width" type="number" min="10" max="297" step="0.1" value="50"></label>
 <label>ALTURA (MM)<input id="pm-height" type="number" min="10" max="297" step="0.1" value="30"></label>
 <div class="pm-footer pm-model-actions" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;width:100%;margin-top:12px"><button id="pm-new-model" style="background:#109c73;color:#fff;border-color:#109c73;width:100%;min-width:0">NOVO</button><button id="pm-save-model" style="background:#1d5da8;color:#fff;border-color:#1d5da8;width:100%;min-width:0">GRAVAR</button><button id="pm-update-model" style="background:#ed9a16;color:#fff;border-color:#ed9a16;width:100%;min-width:0">ALTERAR</button><button id="pm-delete-model" style="background:#c62836;color:#fff;border-color:#c62836;width:100%;min-width:0">EXCLUIR</button></div>
 <p class="pm-muted">PARA UTILIZAR UM TAMANHO APENAS AGORA, INFORME AS MEDIDAS SEM GRAVAR.</p>
 <h3>CONFIGURAÇÃO DA IMPRESSÃO</h3>
 <label>TIPO DE PAPEL<select id="pm-mode"><option value="A4">FOLHA A4</option><option value="TERMICA">IMPRESSORA TÉRMICA / PAPEL PERSONALIZADO</option></select></label>
 <label id="pm-orientation-wrap">ORIENTAÇÃO DA FOLHA<select id="pm-label-orientation"><option value="portrait">RETRATO</option><option value="landscape">PAISAGEM</option></select></label>
 <label>QUANTIDADE TOTAL DE ETIQUETAS<input id="pm-qty" type="number" min="1" max="500" value="1"></label>
 <label id="pm-perpage-wrap">QUANTIDADE DE ETIQUETAS POR FOLHA<input id="pm-perpage" type="number" min="1" max="500" value="1"></label>
 <p class="pm-muted" id="pm-capacity"></p>
 <label><input type="checkbox" id="pm-show-company" checked> MOSTRAR EMPRESA</label><label><input type="checkbox" id="pm-show-price" checked> MOSTRAR PREÇO</label><label><input type="checkbox" id="pm-show-code" checked> MOSTRAR CÓDIGO INTERNO</label><label><input type="checkbox" id="pm-show-bar" checked> MOSTRAR CÓDIGO DE BARRAS</label><label><input type="checkbox" id="pm-show-brand"> MOSTRAR MARCA</label>
 </section><section><h3>VISUALIZAÇÃO DA ETIQUETA</h3><div id="pm-label-preview" class="pm-label-preview"></div><p class="pm-muted" id="pm-label-format"></p></section></div>
 <div class="pm-footer"><button id="pm-print-label" class="pm-primary">IMPRIMIR</button><button id="pm-save-label" style="background:#159b70;color:#fff;border-color:#159b70">SALVAR</button><button data-close>FECHAR</button></div>`;
 overlay('ETIQUETAS DO PRODUTO',html,(o,close)=>{
 const $=id=>o.querySelector('#'+id);let active='';
 const persist=()=>{try{localStorage.setItem(key,JSON.stringify(models));return true}catch(e){aviso('MODELOS','NÃO FOI POSSÍVEL SALVAR.');return false}};
 const refresh=()=>{$('pm-model').innerHTML='<option value="">SELECIONE UM MODELO</option>'+models.map(m=>`<option value="${esc(m.id)}">${esc(m.name)} — ${m.w} × ${m.h} MM</option>`).join('');$('pm-model').value=active};
 const label=()=>`<div class="pm-label">${$('pm-show-company').checked?`<small>${esc(company())}</small>`:''}<strong>${esc(p.descricao)}</strong>${$('pm-show-bar').checked?barcodeSVG(p.barras):''}${$('pm-show-price').checked?`<b>${fmt(p.preco)}</b>`:''}${$('pm-show-code').checked?`<small>CÓD.: ${esc(p.codigo)}</small>`:''}${$('pm-show-brand').checked?`<small>${esc(p.marca)}</small>`:''}</div>`;
 const dimensions=()=>[Number($('pm-width').value),Number($('pm-height').value)];
 const capacity=()=>{const [w,h]=dimensions(),a4=$('pm-mode').value==='A4',land=$('pm-label-orientation').value==='landscape';return a4&&w>0&&h>0?Math.floor(((land?297:210)-16)/w)*Math.floor(((land?210:297)-16)/h):1};
 const draw=()=>{const [w,h]=dimensions(),q=Number($('pm-qty').value)||1,per=Number($('pm-perpage').value)||1,a4=$('pm-mode').value==='A4',max=capacity();$('pm-orientation-wrap').style.display=a4?'block':'none';$('pm-perpage-wrap').style.display=a4?'block':'none';$('pm-capacity').textContent=a4?`CAPACIDADE MÁXIMA: ${Math.max(0,max)} ETIQUETA(S) POR FOLHA • ${Math.ceil(q/per)} FOLHA(S) PREVISTA(S)`:'UMA ETIQUETA POR PÁGINA NO TAMANHO ESCOLHIDO';const preview=$('pm-label-preview');preview.innerHTML=label();const item=preview.querySelector('.pm-label');if(item){const maxW=Math.max(140,preview.clientWidth-36),maxH=315,ratio=w>0&&h>0?w/h:5/3;let pxW=Math.min(maxW,Math.max(180,w*4));let pxH=pxW/ratio;if(pxH>maxH){pxH=maxH;pxW=pxH*ratio}item.style.cssText=`width:${pxW}px;height:${pxH}px;min-height:0;max-height:none;box-sizing:border-box;overflow:hidden;padding:${Math.max(4,Math.min(10,pxH*.06))}px;gap:2px;display:flex;flex-direction:column;justify-content:center;align-items:center`;const desc=item.querySelector('strong');if(desc){desc.style.cssText=`font-size:${Math.max(8,Math.min(17,pxH*.15))}px;line-height:1.12;overflow-wrap:anywhere;max-width:100%`};const bar=item.querySelector('.pm-bar-svg');if(bar){bar.style.cssText=`display:block;width:min(88%,${Math.max(75,pxW*.78)}px);height:${Math.max(18,Math.min(76,pxH*.31))}px;max-height:none;flex-shrink:1`};const price=item.querySelector('b');if(price)price.style.cssText=`font-size:${Math.max(11,Math.min(23,pxH*.17))}px;line-height:1.1`;item.querySelectorAll('small').forEach(el=>el.style.cssText=`font-size:${Math.max(7,Math.min(11,pxH*.09))}px;line-height:1.05`)}$('pm-label-format').textContent=`${w} × ${h} MM • ${q} ETIQUETA(S)${a4?' • '+per+' POR FOLHA':''}`};
 const clear=()=>{active='';$('pm-model').value='';$('pm-model-name').value='';$('pm-width').value=50;$('pm-height').value=30;draw()};
 $('pm-new-model').onclick=clear;
 $('pm-model').onchange=()=>{active=$('pm-model').value;const m=models.find(x=>x.id===active);if(m){$('pm-model-name').value=m.name;$('pm-width').value=m.w;$('pm-height').value=m.h;}draw()};
 $('pm-save-model').onclick=()=>{const name=$('pm-model-name').value.trim(),[w,h]=dimensions();if(!name||w<10||h<10||w>297||h>297)return aviso('MODELOS','INFORME NOME E MEDIDAS VÁLIDAS.');if(models.some(m=>m.name.toUpperCase()===name.toUpperCase()))return aviso('MODELOS','JÁ EXISTE UM MODELO COM ESTE NOME.');active='m'+Date.now();models.push({id:active,name,w,h});if(persist()){refresh();aviso('MODELOS','MODELO GRAVADO COM SUCESSO.')}};
 $('pm-update-model').onclick=()=>{const m=models.find(x=>x.id===active),name=$('pm-model-name').value.trim(),[w,h]=dimensions();if(!m)return aviso('MODELOS','SELECIONE UM MODELO PARA ALTERAR.');if(!name||w<10||h<10||w>297||h>297)return aviso('MODELOS','INFORME NOME E MEDIDAS VÁLIDAS.');if(models.some(x=>x.id!==active&&x.name.toUpperCase()===name.toUpperCase()))return aviso('MODELOS','JÁ EXISTE UM MODELO COM ESTE NOME.');Object.assign(m,{name,w,h});if(persist()){refresh();aviso('MODELOS','MODELO ALTERADO.')}};
 $('pm-delete-model').onclick=async()=>{if(!active)return aviso('MODELOS','SELECIONE UM MODELO PARA EXCLUIR.');if(await confirmar('EXCLUIR MODELO','DESEJA EXCLUIR ESTE MODELO?')){models=models.filter(x=>x.id!==active);if(persist()){clear();refresh();aviso('MODELOS','MODELO EXCLUÍDO.')}}};
 $('pm-width').addEventListener('input',()=>{if(active){active='';$('pm-model').value=''}draw()});$('pm-height').addEventListener('input',()=>{if(active){active='';$('pm-model').value=''}draw()});
 o.querySelectorAll('input,select').forEach(x=>x.addEventListener('input',draw));
 $('pm-save-label').onclick=async()=>{const [w,h]=dimensions(),qty=Number($('pm-qty').value),per=Number($('pm-perpage').value),a4=$('pm-mode').value==='A4',max=capacity();if(!Number.isInteger(qty)||qty<1||qty>500||w<10||h<10||w>297||h>297)return aviso('ETIQUETAS','INFORME QUANTIDADE E MEDIDAS VÁLIDAS.');if(a4&&(!Number.isInteger(per)||per<1||per>max))return aviso('ETIQUETAS',`NESTE TAMANHO CABEM NO MÁXIMO ${Math.max(0,max)} ETIQUETAS POR FOLHA A4.`);const btn=$('pm-save-label');btn.disabled=true;try{const result=await window.LucasEtiquetasPDF({width:w,height:h,quantity:qty,perPage:a4?per:1,mode:a4?'A4':'CUSTOM',landscape:$('pm-label-orientation').value==='landscape',product:p,company:company(),show:{company:$('pm-show-company').checked,price:$('pm-show-price').checked,code:$('pm-show-code').checked,barcode:$('pm-show-bar').checked,brand:$('pm-show-brand').checked}});if(result==='downloaded')aviso('PDF GERADO','O PDF FOI BAIXADO. NO CHROME, USE A OPÇÃO SALVAR COMO PARA ESCOLHER A PASTA, SE NECESSÁRIO.')}catch(e){aviso('SALVAR PDF',e.message||'NÃO FOI POSSÍVEL SALVAR O ARQUIVO.')}finally{btn.disabled=false}};
 $('pm-print-label').onclick=()=>{const [w,h]=dimensions(),qty=Number($('pm-qty').value),per=Number($('pm-perpage').value),a4=$('pm-mode').value==='A4',max=capacity();if(!Number.isInteger(qty)||qty<1||qty>500||w<10||h<10||w>297||h>297)return aviso('ETIQUETAS','INFORME QUANTIDADE E MEDIDAS VÁLIDAS.');if(a4&&(!Number.isInteger(per)||per<1||per>max))return aviso('ETIQUETAS',`NESTE TAMANHO CABEM NO MÁXIMO ${Math.max(0,max)} ETIQUETAS POR FOLHA A4.`);const sheet=`<div class="pm-labels">${Array.from({length:qty},label).join('')}</div>`;printLabelsChrome('ETIQUETAS — '+p.descricao,sheet,a4?'A4':`${w}mm ${h}mm`,a4&&$('pm-label-orientation').value==='landscape',qty,a4?per:1,w,h)};
 refresh();draw();o.querySelectorAll('[data-close]').forEach(x=>x.onclick=close);
 });
 }
 function printProduct(){const p=selected();if(!p)return aviso('IMPRIMIR PRODUTO','SELECIONE UM PRODUTO GRAVADO.');const html=`<div class="pm-two"><section><h3>DADOS DO PRODUTO SELECIONADO</h3><div class="pm-info"><strong>${esc(p.codigo)} — ${esc(p.descricao)}</strong><span>MARCA: ${esc(p.marca)}</span><span>CATEGORIA: ${esc(p.categoria)}</span></div><h3>TIPO DE IMPRESSÃO</h3><label><input type="radio" name="pm-sheet" value="completa" checked> FICHA COMPLETA</label><label><input type="radio" name="pm-sheet" value="simples"> FICHA SIMPLIFICADA</label><h3>OPÇÕES ADICIONAIS</h3><label><input type="checkbox" id="pm-stock" checked> INCLUIR ESTOQUE</label><label><input type="checkbox" id="pm-history"> INCLUIR HISTÓRICO</label><label>ORIENTAÇÃO<select id="pm-orientation"><option value="">RETRATO</option><option value="landscape">PAISAGEM</option></select></label></section><section><h3>PRÉ-VISUALIZAÇÃO A4</h3><div id="pm-sheet-preview" class="pm-sheet-preview"></div></section></div><div class="pm-footer"><button id="pm-print-sheet" class="pm-primary">IMPRIMIR</button><button id="pm-save-sheet" style="background:#109c73;color:#fff;border-color:#109c73">SALVAR</button><button data-close>FECHAR</button></div>`;overlay('IMPRIMIR CADASTRO DO PRODUTO',html,(o,close)=>{let doc='';const draw=()=>{const simple=o.querySelector('input[name="pm-sheet"]:checked').value==='simples';const productPhoto=typeof p.imagem==='string'&&/^data:image\/(?:png|jpeg|webp);base64,/i.test(p.imagem)?p.imagem:'';const rows=[['CÓDIGO',p.codigo],['DESCRIÇÃO',p.descricao],['MARCA',p.marca],['CATEGORIA',p.categoria],['UNIDADE',p.unidade],['SITUAÇÃO',p.situacao],['PREÇO DE VENDA',fmt(p.preco)]];if(!simple)rows.push(['TIPO',p.tipo],['CÓDIGO DE BARRAS',p.barras],['CUSTO',fmt(p.custo)],['LUCRO BRUTO',fmt(p.preco-p.custo)],['MARGEM BRUTA',p.preco?((p.preco-p.custo)/p.preco*100).toFixed(2)+'%':'—'],['ESTOQUE MÍNIMO',p.minimo??0],['PESO (KG)',p.peso||'—'],['LOCALIZAÇÃO',p.localizacao||'—'],['OBSERVAÇÕES',p.observacoes||'—']);if(o.querySelector('#pm-stock').checked)rows.push(['PROVISÃO',p.provisao||0],['VENDA',p.venda||0],['DISPONÍVEL',(Number(p.provisao)||0)-(Number(p.venda)||0)]);doc=`<div class="pm-print-head"><h1>LOJA 01 – MATRIZ</h1><p>${esc(company())}</p><p>FICHA DO PRODUTO</p></div><h2>${esc(p.descricao)}</h2>${productPhoto?`<div class="pm-product-photo-print"><img src="${productPhoto}" alt="Imagem do produto"></div>`:''}<div class="pm-print-grid${productPhoto?' pm-has-photo':''}">${rows.map(([k,v])=>`<div class="pm-print-cell"><strong>${esc(k)}</strong>${esc(v)}</div>`).join('')}</div>${!simple?barcodeSVG(p.barras):''}`;if(o.querySelector('#pm-history').checked)doc+=`<h2>HISTÓRICO DE ALTERAÇÕES</h2><table><tr><th>DATA</th><th>TIPO</th><th>ANTERIOR</th><th>NOVO</th></tr>${(p.historico||[]).map(x=>`<tr><td>${esc(x.data)}</td><td>${esc(x.tipo||'ALTERAÇÃO')}</td><td>${esc(x.anterior??x.precoAnterior??x.custoAnterior??'—')}</td><td>${esc(x.atual??x.precoNovo??x.custoNovo??'—')}</td></tr>`).join('')}</table>`;doc+=`<div class="pm-emissao-footer">${esc(rodapeEmissao())}</div>`;o.querySelector('#pm-sheet-preview').innerHTML=doc};o.querySelectorAll('input,select').forEach(x=>x.addEventListener('change',draw));o.querySelector('#pm-print-sheet').onclick=()=>printProductSheet('FICHA DO PRODUTO — '+p.descricao,doc,!!o.querySelector('#pm-orientation').value);o.querySelector('#pm-save-sheet').onclick=async()=>{const btn=o.querySelector('#pm-save-sheet');if(btn.disabled)return;btn.disabled=true;try{const rows=[...o.querySelectorAll('#pm-sheet-preview .pm-print-cell')].map(el=>[el.querySelector('strong')?.textContent||'',el.textContent.replace(el.querySelector('strong')?.textContent||'','').trim()]);const history=o.querySelector('#pm-history').checked?(p.historico||[]).map(x=>[x.data||'',x.tipo||'ALTERAÇÃO',String(x.anterior??x.precoAnterior??x.custoAnterior??'—'),String(x.atual??x.precoNovo??x.custoNovo??'—')]):[];const result=await window.LucasFichaProdutoPDF({company:company(),description:p.descricao,code:p.codigo,rows,history,barcode:o.querySelector('input[name="pm-sheet"]:checked').value==='completa'?p.barras:'',image:typeof p.imagem==='string'&&/^data:image\/(?:png|jpeg|webp);base64,/i.test(p.imagem)?p.imagem:'',landscape:!!o.querySelector('#pm-orientation').value,emission:rodapeEmissao()});if(result==='downloaded')aviso('PDF GERADO','O ARQUIVO FOI BAIXADO. PARA ESCOLHER A PASTA, ATIVE NO CHROME A OPÇÃO DE PERGUNTAR ONDE SALVAR CADA ARQUIVO.')}catch(e){aviso('SALVAR FICHA',e.message||'NÃO FOI POSSÍVEL SALVAR O PDF.')}finally{btn.disabled=false}};o.querySelectorAll('[data-close]').forEach(x=>x.onclick=close);draw()});}
 return {barcode,barcodeSVG,history,simulator,labels,printProduct,log};
})();
