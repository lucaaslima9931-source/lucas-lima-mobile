/* V505 — seletor padronizado para os módulos de estoque. Não altera dados de estoque. */
(function(){'use strict';
window.LL_selecionarProdutoEstoque=function(op){
 const produtos=typeof op.produtos==='function'?op.produtos():[];
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 document.querySelector('.ll-prod-picker-overlay')?.remove();
 const overlay=document.createElement('div');overlay.className='ll-prod-picker-overlay';
 overlay.innerHTML=`<section class="ll-prod-picker" role="dialog" aria-modal="true" aria-label="SELECIONE O PRODUTO"><header><strong>SELECIONE O PRODUTO</strong><button type="button" data-close aria-label="Fechar">×</button></header><div class="ll-prod-picker-body"><div class="ll-prod-picker-filters"><label>PESQUISAR POR<select data-mode><option value="descricao">DESCRIÇÃO</option><option value="codigo">CÓDIGO</option></select></label><label>TEXTO DA PESQUISA<input data-query type="search" autocomplete="off" placeholder="DIGITE PARA PESQUISAR..."></label><button type="button" data-search>PESQUISAR</button></div><div class="ll-prod-picker-scroll"><table><thead><tr><th>CÓDIGO</th><th>DESCRIÇÃO DO PRODUTO</th><th>SITUAÇÃO</th></tr></thead><tbody data-results><tr><td colspan="3">CLIQUE EM PESQUISAR PARA EXIBIR OS PRODUTOS.</td></tr></tbody></table></div><footer><small>DÊ DOIS CLIQUES PARA SELECIONAR.</small><button type="button" data-close>CANCELAR</button></footer></div></section>`;
 document.body.appendChild(overlay);
 const $=s=>overlay.querySelector(s), close=()=>{document.removeEventListener('keydown',keys,true);overlay.remove()};
 const keys=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}else if(e.key==='Enter'&&e.target===$('[data-query]')){e.preventDefault();search()}};
 const search=()=>{const mode=$('[data-mode]').value,q=$('[data-query]').value.trim().toLocaleLowerCase('pt-BR');const list=(typeof op.produtos==='function'?op.produtos():produtos).filter(p=>String(mode==='codigo'?p.codigo:(p.descricao??p.nome??'')).toLocaleLowerCase('pt-BR').includes(q)).slice(0,200);$('[data-results]').innerHTML=list.map(p=>`<tr tabindex="0" data-code="${esc(p.codigo)}" title="DÊ DOIS CLIQUES PARA SELECIONAR"><td>${esc(p.codigo)}</td><td>${esc(p.descricao)}</td><td><span class="ll-prod-picker-status">${esc(p.situacao||p.status||(p.ativo===false?'INATIVO':'ATIVO'))}</span></td></tr>`).join('')||'<tr><td colspan="3">NENHUM PRODUTO ENCONTRADO.</td></tr>';
 $('[data-results]').querySelectorAll('[data-code]').forEach(row=>{const choose=()=>{const p=list.find(x=>String(x.codigo)===row.dataset.code);if(p){close();op.selecionar(p)}};row.ondblclick=choose;row.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();choose()}}});};
 overlay.querySelectorAll('[data-close]').forEach(b=>b.onclick=close);overlay.onclick=e=>{if(e.target===overlay)close()};$('[data-search]').onclick=search;
 document.addEventListener('keydown',keys,true);$('[data-query]').focus();
};
})();
