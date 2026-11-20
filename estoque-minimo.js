
/* ESTOQUE MÍNIMO — consulta dinâmica de produtos que exigem atenção */
(()=>{'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const n=v=>Number(v)||0;
const fmt=v=>n(v).toLocaleString('pt-BR',{maximumFractionDigits:3});
const state=p=>{const d=n(p.provisao)-n(p.venda),m=Math.max(0,n(p.minimo??p.estoqueMinimo));return d<0?'NEGATIVO':d===0?'ZERADO':d<m?'ABAIXO DO MÍNIMO':d===m?'NO LIMITE':'NORMAL'};
const attention=p=>state(p)!=='NORMAL';
const isActive=p=>String(p.situacao||'ATIVO').toUpperCase()!=='INATIVO';
// Usa a mesma fonte de saldos consultada pela Ficha de Estoque.
// A quantidade mínima permanece a cadastrada no próprio produto.
function atualizarEstoqueDaFicha(){
 try{
  const lista=typeof window.LL_estoqueCentralConciliar==='function'
   ?window.LL_estoqueCentralConciliar()
   :JSON.parse(localStorage.getItem('erp_matriz_produtos_teste_v1')||'[]');
  if(Array.isArray(lista))products=lista;
 }catch(e){console.warn('Não foi possível atualizar o estoque mínimo:',e)}
 return products;
}
const data=()=>products.filter(attention);
function render(){
 atualizarEstoqueDaFicha();
 screen='ESTOQUE MÍNIMO';active('ESTOQUE');
 const el=root();
 el.innerHTML=`<main class="em-page"><header class="em-heading"><h1>▣ ESTOQUE MÍNIMO</h1><button id="em-shortcuts">⌂ ATALHOS</button></header>
 <div class="em-cards">${[['NEGATIVOS','NEGATIVO'],['ZERADOS','ZERADO'],['ABAIXO DO MÍNIMO','ABAIXO DO MÍNIMO'],['NO LIMITE','NO LIMITE']].map(([label,s],i)=>`<div class="em-stat em-stat-${i}"><span>${label}</span><strong id="em-stat-${i}">0</strong></div>`).join('')}</div>
 <section class="em-panel"><h2>⚑ FILTROS</h2><div class="em-filters">
 <label>MARCA<select id="em-brand"><option value="">TODAS AS MARCAS</option></select></label>
 <label>CATEGORIA<select id="em-category"><option value="">TODAS AS CATEGORIAS</option></select></label>
 <label>SITUAÇÃO<select id="em-status"><option value="">TODAS AS SITUAÇÕES</option><option>NEGATIVO</option><option>ZERADO</option><option>ABAIXO DO MÍNIMO</option><option>NO LIMITE</option></select></label>
 <label>PESQUISAR (CÓDIGO OU DESCRIÇÃO)<input id="em-search" placeholder="DIGITE O CÓDIGO OU DESCRIÇÃO..."></label></div>
 <div class="em-filter-footer"><label class="em-check"><input type="checkbox" id="em-active" checked> MOSTRAR APENAS PRODUTOS ATIVOS</label><div><button id="em-go">PESQUISAR</button><button id="em-clear">LIMPAR FILTROS</button></div></div></section>
 <section class="em-panel"><h2 id="em-count">LISTA DE PRODUTOS</h2><div class="em-table-wrap"><table class="em-table"><thead><tr><th>CÓD.</th><th>DESCRIÇÃO DO PRODUTO</th><th>MARCA</th><th>CATEGORIA</th><th>UNID.</th><th>PROVISÃO</th><th>VENDA</th><th>DISPONÍVEL</th><th>EST. MÍNIMO</th><th>REPOR</th><th>SITUAÇÃO</th></tr></thead><tbody id="em-rows"></tbody></table></div><div class="em-bottom" id="em-bottom"></div></section>
 <div class="em-bottom-actions"><button id="em-print" type="button">▣ IMPRIMIR</button><button id="em-back">VOLTAR</button></div></main>`;
 document.querySelectorAll('#app .pc-userline,#app [data-user-audit],#app .erp-shortcut-open').forEach(x=>x.remove());
 const $=id=>document.getElementById(id);
 const brands=[...new Set(products.map(p=>String(p.marca||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
 const cats=[...new Set(products.map(p=>String(p.categoria||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
 for(const [id,items] of [['em-brand',brands],['em-category',cats]])$(id).insertAdjacentHTML('beforeend',items.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join(''));
 // Seleção exclusiva pelo botão +, sem abrir listas nativas abaixo dos campos.
 for (const [id,kind] of [['em-brand','MARCA'],['em-category','CATEGORIA']]) {
   const select=$(id);
   select.value='';
   select.style.pointerEvents='none';select.tabIndex=-1;
   const btn=document.createElement('button');
   btn.type='button';btn.className='em-select-plus';btn.textContent='+';
   btn.setAttribute('aria-label','Selecionar '+kind.toLowerCase());
   const line=document.createElement('div');line.className='em-select-line';
   select.parentNode.insertBefore(line,select);line.appendChild(select);line.appendChild(btn);
   btn.addEventListener('click',()=>{
     document.getElementById('em-choice-overlay')?.remove();
     const overlay=document.createElement('div');overlay.id='em-choice-overlay';overlay.className='em-choice-overlay';
     const opts=[...select.options];
     const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
     const rows=opts.map((o,i)=>({index:i,name:o.textContent,code:i===0?'—':String(i).padStart(6,'0'),status:i===0?'TODAS':'ATIVO'}));
     overlay.innerHTML=`<div class="em-choice-dialog" role="dialog" aria-modal="true" aria-label="Selecione a ${kind.toLowerCase()}"><div class="em-choice-head"><span>SELECIONE A ${kind}</span><button type="button" class="em-choice-close" aria-label="Fechar">×</button></div><div class="em-choice-content"><div class="em-choice-controls"><label>PESQUISAR POR<select class="em-choice-by"><option value="name">DESCRIÇÃO</option><option value="code">CÓDIGO</option></select></label><label class="em-choice-query-label">TEXTO DA PESQUISA<input type="search" class="em-choice-search" placeholder="DIGITE PARA PESQUISAR..." autocomplete="off"></label><button type="button" class="em-choice-go">PESQUISAR</button></div><div class="em-choice-table-wrap"><table class="em-choice-table"><thead><tr><th>CÓDIGO</th><th>DESCRIÇÃO DA ${kind}</th><th>SITUAÇÃO</th></tr></thead><tbody class="em-choice-results"></tbody></table></div><div class="em-choice-empty" hidden>NENHUM RESULTADO ENCONTRADO.</div></div><div class="em-choice-foot"><span>DÊ DOIS CLIQUES PARA SELECIONAR.</span><button type="button" class="em-choice-close">CANCELAR</button></div></div>`;
     document.body.appendChild(overlay);
     const close=()=>{document.removeEventListener('keydown',escKey);overlay.remove()};
     const escKey=e=>{if(e.key==='Escape'){e.preventDefault();close()}};
     document.addEventListener('keydown',escKey);
     overlay.querySelectorAll('.em-choice-close').forEach(x=>x.addEventListener('click',close));
     overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
     const searchInput=overlay.querySelector('.em-choice-search');
     const tbody=overlay.querySelector('.em-choice-results');
     const draw=()=>{const q=normalize(searchInput.value.trim()),by=overlay.querySelector('.em-choice-by').value;const found=rows.filter(r=>!q||normalize(by==='code'?r.code:r.name).includes(q));tbody.innerHTML=found.map(r=>`<tr data-choice="${r.index}" tabindex="0"><td>${esc(r.code)}</td><td>${esc(r.name)}</td><td><span class="em-choice-status">${r.status}</span></td></tr>`).join('');overlay.querySelector('.em-choice-empty').hidden=found.length>0;tbody.querySelectorAll('[data-choice]').forEach(tr=>{const choose=()=>{select.selectedIndex=Number(tr.dataset.choice);close()};tr.addEventListener('dblclick',choose);tr.addEventListener('keydown',e=>{if(e.key==='Enter')choose()})})};
     overlay.querySelector('.em-choice-go').onclick=draw;
     
     searchInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();draw()}});
     draw();searchInput.focus();
   });
 }
 // Pesquisar na mesma linha, imediatamente após Situação.
 const go=$('em-go');go.classList.add('em-go-inline');
 $('em-status').closest('label').insertAdjacentElement('afterend',go);

 let current=[];
 function filter(){
 atualizarEstoqueDaFicha();
 const brand=$('em-brand').value,cat=$('em-category').value,status=$('em-status').value,q=$('em-search').value.trim().toLocaleLowerCase('pt-BR'),activeOnly=$('em-active').checked;
 current=data().filter(p=>(!activeOnly||isActive(p))&&(!brand||p.marca===brand)&&(!cat||p.categoria===cat)&&(!status||state(p)===status)&&(!q||(String(p.codigo)+' '+String(p.descricao)).toLocaleLowerCase('pt-BR').includes(q)));
 const all=data().filter(p=>!activeOnly||isActive(p));
 ['NEGATIVO','ZERADO','ABAIXO DO MÍNIMO','NO LIMITE'].forEach((s,i)=>$('em-stat-'+i).textContent=all.filter(p=>state(p)===s).length);
 $('em-count').textContent=`LISTA DE PRODUTOS (${current.length} ENCONTRADOS)`;
 $('em-rows').innerHTML=current.map(p=>{const d=n(p.provisao)-n(p.venda),m=Math.max(0,n(p.minimo??p.estoqueMinimo)),s=state(p),cls=s==='NEGATIVO'?'negative':s==='ZERADO'?'zero':s==='NO LIMITE'?'limit':'low';return `<tr><td>${esc(p.codigo)}</td><td>${esc(p.descricao)}</td><td>${esc(p.marca)}</td><td>${esc(p.categoria)}</td><td>${esc(p.unidade)}</td><td>${fmt(p.provisao)}</td><td>${fmt(p.venda)}</td><td class="em-${cls}">${fmt(d)}</td><td>${fmt(m)}</td><td>${fmt(Math.max(0,m-d))}</td><td><span class="em-badge em-${cls}">${s}</span></td></tr>`}).join('')||'<tr><td colspan="11" class="em-empty">NENHUM PRODUTO ENCONTRADO.</td></tr>';
 $('em-bottom').textContent=`MOSTRANDO ${current.length} PRODUTO(S) QUE PRECISAM DE ATENÇÃO.`;
 }
 function buildPdf(rows,filters,orientation){
 const encode=s=>Array.from(String(s??''),c=>{const v=c.codePointAt(0);return v<256?v:({8211:150,8212:151,8364:128,8226:149}[v]||63)});
 const literal=s=>encode(s).map(c=>c===40?'\\(':c===41?'\\)':c===92?'\\\\':c<32||c>126?'\\'+c.toString(8).padStart(3,'0'):String.fromCharCode(c)).join('');
 const ops=[];let pages=[],y=orientation==='landscape'?540:785;
 const txt=(s,x,z,size=8,bold=false)=>ops.push(`BT /${bold?'F2':'F1'} ${size} Tf 1 0 0 1 ${x} ${z} Tm (${literal(s)}) Tj ET`);
 const rule=(z)=>ops.push(`30 ${z} m 565 ${z} l S`);
 const cut=(v,len)=>{const t=String(v??'');return t.length>len?t.slice(0,len-2)+'..':t};
 const header=()=>{y=orientation==='landscape'?540:785;txt('LOJA: 01 - MATRIZ',30,y,12,true);y-=19;const name=(()=>{try{return JSON.parse(localStorage.getItem('erp_systems_dados_loja_v1')||'{}')?.nome||''}catch{return ''}})()||document.querySelector('.topbar .store-company')?.textContent?.trim();if(name)txt(cut(name,85),30,y,9);y-=14;rule(y);y-=27;txt('RELATORIO DE ESTOQUE MINIMO',165,y,12,true);y-=24;txt('EMISSAO: '+new Date().toLocaleString('pt-BR'),30,y,8);y-=17;txt('MARCA: '+cut(filters.brand||'TODAS',30)+'    CATEGORIA: '+cut(filters.cat||'TODAS',28),30,y,8);y-=15;txt('SITUACAO: '+(filters.status||'TODAS')+'    PRODUTOS: '+(filters.active?'SOMENTE ATIVOS':'TODOS'),30,y,8);y-=22;const xs=[30,58,222,289,353,383,417,451,491,528,555];const heads=['COD','DESCRICAO','MARCA','CATEG.','UN','PROV.','VENDA','DISP.','MIN.','REPOR','SIT.'];heads.forEach((v,i)=>txt(v,xs[i],y,6,true));y-=8;rule(y);y-=14};
 const finish=()=>{pages.push(ops.splice(0).join('\n'))};header();
 for(const p of rows){if(y<70){finish();header()}const d=n(p.provisao)-n(p.venda),m=Math.max(0,n(p.minimo??p.estoqueMinimo));const vals=[p.codigo,cut(p.descricao,28),cut(p.marca,11),cut(p.categoria,10),cut(p.unidade,4),fmt(p.provisao),fmt(p.venda),fmt(d),fmt(m),fmt(Math.max(0,m-d)),state(p)==='ABAIXO DO MÍNIMO'?'ABAIXO':state(p)==='NEGATIVO'?'NEG':state(p)==='ZERADO'?'ZERO':'LIM'];const xs=[30,58,222,289,353,383,417,451,491,528,555];vals.forEach((v,i)=>txt(cut(v,i===1?28:i===2?11:i===3?10:i===10?5:7),xs[i],y,6));y-=18;rule(y+6)}
 if(y<90){finish();header()}y-=12;txt('TOTAL DE PRODUTOS: '+rows.length,30,y,9,true);finish();
 let obj=[null,'<< /Type /Catalog /Pages 2 0 R >>',null,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'],kids=[];
 for(const content of pages){const stream=obj.length;obj.push('<< /Length '+encode(content).length+' >>\nstream\n'+content+'\nendstream');const page=obj.length;obj.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+(orientation==='landscape'?'841.89 595.28':'595.28 841.89')+'] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents '+stream+' 0 R >>');kids.push(page+' 0 R')}
 obj[2]='<< /Type /Pages /Kids ['+kids.join(' ')+'] /Count '+kids.length+' >>';let bytes=encode('%PDF-1.4\n'),offset=[0];const add=v=>bytes.push(...encode(v));for(let i=1;i<obj.length;i++){offset[i]=bytes.length;add(i+' 0 obj\n'+obj[i]+'\nendobj\n')}const xref=bytes.length;add('xref\n0 '+obj.length+'\n0000000000 65535 f \n');for(let i=1;i<obj.length;i++)add(String(offset[i]).padStart(10,'0')+' 00000 n \n');add('trailer\n<< /Size '+obj.length+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF');return new Blob([new Uint8Array(bytes)],{type:'application/pdf'});
 }
 let searched=false,applied=null;
 function printPdf(){
 if(!searched){aviso('ESTOQUE MÍNIMO','CLIQUE EM PESQUISAR ANTES DE IMPRIMIR.');return}
 document.querySelector('.em-pdf-overlay')?.remove();
 const snapshot=current.map(p=>({...p}));const f={...applied};
 const date=new Date().toLocaleDateString('pt-BR');
 const user=String(document.querySelector('.top-user-name,.user-name,.header-user-name')?.textContent||window.LL_usuarioAtual?.nome||'USUÁRIO').trim();
 const h=esc;
 const companyName=String((()=>{try{return JSON.parse(localStorage.getItem('erp_systems_dados_loja_v1')||'{}')?.nome||''}catch{return ''}})()||document.querySelector('.topbar .store-company')?.textContent||'').trim();
 let orientation='landscape';
 const tableRows=snapshot.map(p=>{const d=n(p.provisao)-n(p.venda),m=Math.max(0,n(p.minimo??p.estoqueMinimo));return `<tr><td>${h(p.codigo)}</td><td>${h(p.descricao)}</td><td>${h(p.marca)}</td><td>${h(p.categoria)}</td><td>${h(p.unidade)}</td><td class="num">${fmt(p.provisao)}</td><td class="num">${fmt(p.venda)}</td><td class="num">${fmt(d)}</td><td class="num">${fmt(m)}</td><td class="num">${fmt(Math.max(0,m-d))}</td><td>${h(state(p))}</td></tr>`}).join('');
 const makeHtml=()=>`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Estoque Mínimo</title><style>@page{size:A4 ${orientation};margin:12mm}*{box-sizing:border-box}body{font:11px Arial,sans-serif;color:#111;margin:0}header{border-bottom:1px solid #222;padding-bottom:12px}header strong{font-size:16px}h1{text-align:center;font-size:17px;margin:24px 0}.meta{display:flex;flex-wrap:wrap;gap:12px 30px;margin-bottom:22px}table{width:100%;border-collapse:collapse}th{text-align:left;border-bottom:1px solid #333;padding:8px 3px;font-size:9px}td{border-bottom:1px solid #ddd;padding:8px 3px;vertical-align:top;overflow-wrap:anywhere}.num{text-align:right;white-space:nowrap}.total{margin-top:18px;font-weight:bold}.rodape{margin-top:30px;text-align:right;font-size:10px;color:#555}@media print{tr{break-inside:avoid}thead{display:table-header-group}}</style></head><body><header><strong>LOJA: 01 - MATRIZ</strong><div>${h(companyName)}</div></header><h1>RELATÓRIO DE ESTOQUE MÍNIMO</h1><div class="meta"><span><b>DATA:</b> ${h(date)}</span><span><b>MARCA:</b> ${h(f.brand||'TODAS')}</span><span><b>CATEGORIA:</b> ${h(f.cat||'TODAS')}</span><span><b>SITUAÇÃO:</b> ${h(f.status||'TODAS')}</span><span><b>PRODUTOS:</b> ${snapshot.length}</span></div><table><thead><tr><th>CÓD.</th><th>DESCRIÇÃO</th><th>MARCA</th><th>CATEGORIA</th><th>UN.</th><th>PROVISÃO</th><th>VENDA</th><th>DISPONÍVEL</th><th>EST. MÍNIMO</th><th>REPOR</th><th>SITUAÇÃO</th></tr></thead><tbody>${tableRows}</tbody></table><div class="total">TOTAL DE PRODUTOS: ${snapshot.length}</div><div class="rodape">Emitido em ${h(date)}, por ${h(user)}.</div></body></html>`;
 const o=document.createElement('div');o.className='em-pdf-overlay';o.style.cssText='position:fixed;inset:0;z-index:2147483000;background:rgba(5,22,49,.65);display:flex;align-items:center;justify-content:center;padding:18px';
 o.innerHTML=`<div role="dialog" aria-modal="true" aria-label="Imprimir Estoque Mínimo" style="background:#fff;border-radius:10px;width:min(1100px,98vw);height:min(740px,94vh);display:flex;flex-direction:column;overflow:hidden;font-family:Arial,sans-serif;color:#173966"><div style="background:#1d518d;color:#fff;padding:18px 22px;display:flex;justify-content:space-between;align-items:center"><strong>IMPRIMIR ESTOQUE MÍNIMO</strong><button type="button" data-em-close style="background:none;border:0;color:white;font-size:25px;cursor:pointer">×</button></div><div style="flex:1;min-height:0;display:grid;grid-template-columns:minmax(220px,40%) minmax(0,60%);gap:16px;padding:16px"><section style="border:1px solid #cbd9ea;border-radius:6px;padding:15px;overflow:auto"><h3 style="background:#e5eef9;padding:13px;margin:0 0 18px;font-size:14px">DADOS DO RELATÓRIO</h3><p><b>DATA:</b> ${h(date)}</p><p><b>MARCA:</b> ${h(f.brand||'TODAS')}</p><p><b>CATEGORIA:</b> ${h(f.cat||'TODAS')}</p><p><b>SITUAÇÃO:</b> ${h(f.status||'TODAS')}</p><p><b>PRODUTOS:</b> ${snapshot.length}</p><h3 style="background:#e5eef9;padding:13px;font-size:14px">FORMATO DA IMPRESSÃO</h3><div style="display:flex;gap:16px;flex-wrap:wrap"><label><input type="radio" name="em-orientation" value="portrait"> RETRATO</label><label><input type="radio" name="em-orientation" value="landscape" checked> PAISAGEM</label></div><p>Papel A4, sem bordas externas.</p></section><section style="background:#f0f3f8;border:1px solid #cbd9ea;border-radius:6px;min-width:0;display:flex;flex-direction:column;padding:14px"><h3 style="background:#e5eef9;padding:13px;margin:0 0 12px;font-size:14px">PRÉ-VISUALIZAÇÃO — A4</h3><iframe title="Pré-visualização do Estoque Mínimo" style="flex:1;width:100%;border:1px solid #ccd4df;background:white"></iframe></section></div><footer style="display:flex;justify-content:flex-end;gap:10px;border-top:1px solid #dce4ee;padding:12px 18px"><button type="button" data-em-print style="background:#1764c6;color:#fff;border:0;border-radius:5px;padding:13px 28px;font-weight:bold;cursor:pointer">IMPRIMIR</button><button type="button" data-em-save style="background:#009e72;color:#fff;border:0;border-radius:5px;padding:13px 28px;font-weight:bold;cursor:pointer">SALVAR</button><button type="button" data-em-close style="background:#e9f1fc;color:#244e80;border:1px solid #c2d2e6;border-radius:5px;padding:13px 25px;cursor:pointer">FECHAR</button></footer></div>`;
 document.body.appendChild(o);const frame=o.querySelector('iframe');frame.srcdoc=makeHtml();o.querySelectorAll('[name=em-orientation]').forEach(r=>r.onchange=()=>{orientation=r.value;frame.srcdoc=makeHtml()});
 const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}};
 const close=()=>{document.removeEventListener('keydown',key,true);o.remove()};
 document.addEventListener('keydown',key,true);o.querySelectorAll('[data-em-close]').forEach(b=>b.onclick=close);o.onclick=e=>{if(e.target===o)close()};
 o.querySelector('[data-em-print]').onclick=()=>{try{frame.contentWindow.focus();frame.contentWindow.print()}catch(e){aviso('IMPRESSÃO','NÃO FOI POSSÍVEL ABRIR A IMPRESSÃO.')}};
 o.querySelector('[data-em-save]').onclick=async()=>{const filename='RELATORIO_ESTOQUE_MINIMO.pdf',pdf=buildPdf(snapshot,f,orientation);try{if(window.showSaveFilePicker){const handle=await window.showSaveFilePicker({suggestedName:filename,types:[{description:'Documento PDF',accept:{'application/pdf':['.pdf']}}]});const writable=await handle.createWritable();await writable.write(pdf);await writable.close();return}}catch(e){if(e.name==='AbortError')return}const url=URL.createObjectURL(pdf);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)};
 }
 function exportCSV(){
 const rows=[['CÓDIGO','DESCRIÇÃO','MARCA','CATEGORIA','UNIDADE','PROVISÃO','VENDA','DISPONÍVEL','ESTOQUE MÍNIMO','REPOR','SITUAÇÃO'],...current.map(p=>{const d=n(p.provisao)-n(p.venda),m=Math.max(0,n(p.minimo??p.estoqueMinimo));return [p.codigo,p.descricao,p.marca,p.categoria,p.unidade,p.provisao||0,p.venda||0,d,m,Math.max(0,m-d),state(p)]})];
 const csv='\ufeff'+rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='ESTOQUE_MINIMO.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 // Os filtros apenas preparam a consulta; nenhuma mudança pesquisa automaticamente.
 $('em-go').onclick=()=>{filter();searched=true;applied={brand:$('em-brand').value,cat:$('em-category').value,status:$('em-status').value,active:$('em-active').checked}};
 $('em-clear').onclick=()=>{['em-brand','em-category','em-status','em-search'].forEach(id=>$(id).value='');$('em-active').checked=true};

 $('em-print').onclick=printPdf;
 $('em-back').onclick=()=>category('ESTOQUE');
 $('em-shortcuts').onclick=()=>aviso('ATALHOS — ESTOQUE MÍNIMO','F1 ABRIR ATALHOS\nF5 ATUALIZAR CONSULTA\nCTRL+P IMPRIMIR');
 // Indicadores permanecem informativos, mas a tabela começa sem resultados.
 const all=data().filter(isActive);
 ['NEGATIVO','ZERADO','ABAIXO DO MÍNIMO','NO LIMITE'].forEach((s,i)=>$('em-stat-'+i).textContent=all.filter(p=>state(p)===s).length);
 $('em-count').textContent='LISTA DE PRODUTOS (0 ENCONTRADOS)';
 $('em-rows').innerHTML='<tr><td colspan="11" class="em-empty">SELECIONE OS FILTROS E CLIQUE EM PESQUISAR.</td></tr>';
 $('em-bottom').textContent='';
}
const oldOpen=open;
open=function(name){if(name==='ESTOQUE MÍNIMO')return render();return oldOpen(name)};
document.addEventListener('keydown',e=>{if(screen!=='ESTOQUE MÍNIMO'||e.altKey||e.metaKey)return;if(e.key==='F1'){e.preventDefault();e.stopImmediatePropagation();document.getElementById('em-shortcuts')?.click()}else if(e.key==='F5'){e.preventDefault();e.stopImmediatePropagation();render()}},true);
})();
