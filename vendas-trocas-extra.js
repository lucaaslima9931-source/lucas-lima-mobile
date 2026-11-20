/* LUCAS LIMA — Vendas e trocas: dados locais neste navegador. */
(()=>{'use strict';
const VK='erp_matriz_vendas_v1',TK='erp_matriz_trocas_v1',PK='erp_matriz_produtos_teste_v1',CK='erp_matriz_clientes_v1',FK='erp_matriz_formas_pagamento_v1';
const $=id=>document.getElementById(id),read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),money=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}),today=()=>new Date().toLocaleDateString('en-CA'),stamp=()=>new Date().toISOString();
let vendas=read(VK,[]),trocas=read(TK,[]),itens=[],pagamentos=[],atual=null,retorno=[],novos=[],trocaAtual=null,trocaId=null;
const produtos=()=>typeof window.LL_estoqueCentralConciliar === "function" ? window.LL_estoqueCentralConciliar() : read(PK,[]),clientes=()=>read(CK,[]),formas=()=>(read(FK,{formas:[]}).formas||[]).filter(x=>!(String(x.tipo||'').toUpperCase()==='BOLETO'||/CARN[EÊ]|BOLETO/i.test(String(x.descricao||'')))),vendedores=()=>read('erp_matriz_vendedores_v1',{}).vendedores||[];
const seq=arr=>Math.max(0,...arr.map(x=>+x.numero||0))+1;
const save=(key,value)=>{localStorage.setItem(key,JSON.stringify(value))};
const fld=(id,t,type='text',more='')=>`<label class="vt-field">${t}<input id="${id}" type="${type}" ${more}></label>`;
const opt=(arr,val,lab)=>arr.map(x=>`<option value="${esc(val(x))}">${esc(lab(x))}</option>`).join('');
const info=t=>erpAlert(t);
// Autorização independente do Caixa: senha e permissão, sem exigir Caixa aberto.
function autorizarCancelamento(tipo, executar){
 if(typeof window.LL_identificarOperadorCaixa!=='function')return info('IDENTIFICAÇÃO DO USUÁRIO INDISPONÍVEL.');
 const titulo='IDENTIFICAÇÃO PARA CANCELAR '+tipo;
 return window.LL_identificarOperadorCaixa(titulo,async codigo=>{
  const dados=read('erp_matriz_usuarios_v1',[]);
  const usuarios=Array.isArray(dados)?dados:(dados.usuarios||dados.items||[]);
  const usuario=usuarios.find(u=>String(u.id)===String(codigo));
  const permissao=tipo==='VENDA'?'Cancelar — VENDAS':'Cancelar — TROCAS';
  const alternativa=tipo==='VENDA'?'Cancelar vendas':null;
  if(usuario){
   const permissoes=usuario.permissoes;
   if(usuario.perfil!=='ADMINISTRADOR'&&(!Array.isArray(permissoes)||(!permissoes.includes(permissao)&&!(alternativa&&permissoes.includes(alternativa))))){
    return info('USUÁRIO SEM PERMISSÃO PARA CANCELAR '+tipo+'.');
   }
  }else if(String(codigo)!=='300')return info('USUÁRIO NÃO ENCONTRADO.');
  await executar(String(codigo),usuario?.nome||'USUÁRIO DE DEMONSTRAÇÃO');
 });
}
function modalERP(titulo,conteudo,aoConfirmar){
 const fundo=document.createElement('div');fundo.className='vt-modal-back';
 fundo.innerHTML=`<div class="vt-modal" role="dialog" aria-modal="true"><h2>${esc(titulo)}</h2><div class="vt-modal-content">${conteudo}</div><div class="vt-modal-actions"><button type="button" data-ok>CONFIRMAR (ENTER)</button><button type="button" data-cancel>FECHAR (ESC)</button></div></div>`;
 document.body.append(fundo);
 const fechar=()=>{document.removeEventListener('keydown',tecla,true);fundo.remove()};
 const confirmar=()=>{if(aoConfirmar(fundo,fechar)!==false)fechar()};
 const tecla=e=>{if(e.key==='Escape'||e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();e.key==='Enter'?confirmar():fechar()}};
 fundo.querySelector('[data-ok]').onclick=confirmar;fundo.querySelector('[data-cancel]').onclick=fechar;
 document.addEventListener('keydown',tecla,true);fundo.querySelector('input,select')?.focus();return fundo;
}
function selecionarImpressao(callback){
 modalERP('FORMATO DE IMPRESSÃO','<label class="vt-field">ESCOLHA O FORMATO<select id="vt-print-format"><option value="1">A4</option><option value="2">BOBINA 80 MM</option><option value="3">BOBINA 58 MM</option><option value="4">PDF (SALVAR NA IMPRESSÃO)</option></select></label>',(m)=>{callback(m.querySelector('#vt-print-format').value)});
}
function painelEstoque(prefix){
 return `<div class="vt-stock"><div class="vt-stock-box vt-stock-yellow"><small>PROVISÃO</small><strong id="${prefix}-stock-provisao">—</strong></div><div class="vt-stock-box vt-stock-red"><small>VENDA</small><strong id="${prefix}-stock-venda">—</strong></div><div class="vt-stock-box vt-stock-green"><small>DISPONÍVEL</small><strong id="${prefix}-stock-disponivel">—</strong></div></div>`;
}
function atualizarPainel(prefix,codigo){
 const p=produtos().find(x=>String(x.codigo)===String(codigo).trim()||String(x.barras||'')===String(codigo).trim());
 const provisao=Number(p?.provisao)||0,venda=Number(p?.venda)||0;
 for(const [sufixo,valor] of [['provisao',p?provisao:'—'],['venda',p?venda:'—'],['disponivel',p?provisao-venda:'—']]){
 const el=$(prefix+'-stock-'+sufixo);if(el)el.textContent=valor;
 }
}

function visualizarEstoqueItemVenda(codigo){
 // A seleção de um item apenas atualiza o painel lateral existente.
 // Não abre modal nem modifica o lançamento da venda.
 atualizarPainel('vt',codigo);
}

function clienteOpts(){return '<option value="">SELECIONE</option>'+opt(clientes(),x=>x.codigo??x.id,x=>`${x.codigo??x.id} — ${x.nome??x.razao??x.descricao??''}`)}
// V414: nome de exibição do vendedor vem do cadastro de USUÁRIOS vinculado ao funcionário.
// Mantém os identificadores originais para não alterar o histórico nem as comissões.
function nomeUsuarioVendedor(funcionario){
 const usuarios=read('erp_matriz_usuarios_v1',{usuarios:[]}).usuarios||[];
 const vinculado=usuarios.find(u=>String(u.funcionarioId||'')===String(funcionario.id)&&String(u.situacao||'ATIVO').toUpperCase()!=='INATIVO');
 return String(vinculado?.nome||funcionario.nome||'').trim();
}
function nomeVendedorHistorico(venda){
 const registro=sellerRegistros().find(s=>String(s.id)===String(venda.vendedorId));
 return registro?.nome||String(venda.vendedor||'').replace(/^\d+\s*[—-]\s*/, '');
}
function sellerOpts(){
 const rh=read('erp_matriz_rh_v1',{funcionarios:[]});
 const employees=(rh.funcionarios||[]).filter(f=>String(f.situacao||'ATIVO').toUpperCase()!=='INATIVO'&&String(f.tipo||'').toUpperCase().includes('VENDEDOR'));
 const legacy=vendedores();
 return '<option value="">SELECIONE</option>'+opt(employees,f=>{
   const previous=legacy.find(s=>Number(s.funcionarioId)===Number(f.id));
   return previous?previous.id:'F-'+f.id;
 },f=>nomeUsuarioVendedor(f));
}
function usuarioAtual(){return (document.querySelector('.top-user strong')?.textContent||document.querySelector('.top-user')?.textContent||document.querySelector('[class*=user] strong')?.textContent||'USUÁRIO DE DEMONSTRAÇÃO').trim()}
function registrarAcao(d,acao){d.historicoUsuario=Array.isArray(d.historicoUsuario)?d.historicoUsuario:[];d.historicoUsuario.push({acao,usuario:usuarioAtual(),data:stamp()});d.usuario=usuarioAtual();mostrarUsuario()}
function mostrarUsuario(){const d=vendas.find(x=>x.numero===atual);const el=$('vt-user');if(el)el.value=d?.usuario||usuarioAtual()}
function historicoVenda(){
 const d=vendas.find(x=>String(x.numero)===String(atual));
 const eventos=Array.isArray(d?.historicoUsuario)?d.historicoUsuario.slice().reverse():[];
 const ultimo=eventos[0]?.usuario||d?.usuario||usuarioAtual();
 const linhas=eventos.map(h=>{
  const acao=({GRAVAR:'CADASTRO',ALTERAR:'ALTERAÇÃO',BAIXAR:'BAIXA',CANCELAR:'CANCELAMENTO'})[String(h.acao||'').toUpperCase()]||String(h.acao||'AÇÃO');
  const data=h.data?new Date(h.data):null;
  const horario=data&&!Number.isNaN(data.getTime())?data.toLocaleString('pt-BR'):'DATA NÃO INFORMADA';
  return `<div class="vt-historico-item"><div><b>${esc(acao)}</b><span> — ${esc(h.usuario||'NÃO INFORMADO')}</span></div><small>${esc(horario)}</small></div>`;
 }).join('');
 const fundo=document.createElement('div');fundo.className='vt-modal-back vt-historico-back';
 fundo.innerHTML=`<div class="vt-historico-dialog" role="dialog" aria-modal="true" aria-label="HISTÓRICO DE ALTERAÇÕES"><div class="vt-historico-titulo">HISTÓRICO DE ALTERAÇÕES</div><div class="vt-historico-corpo"><p><b>ÚLTIMO USUÁRIO:</b> ${esc(ultimo)}</p><div class="vt-historico-lista">${linhas||'<p>NENHUMA AÇÃO REGISTRADA PARA ESTA VENDA.</p>'}</div></div><div class="vt-historico-rodape"><button type="button" data-fechar>FECHAR</button></div></div>`;
 const estilo=document.createElement('style');estilo.textContent=`.vt-historico-back{z-index:100005;display:flex;align-items:center;justify-content:center}.vt-historico-dialog{width:min(440px,92vw);background:white;color:#173f74;border-radius:13px;box-shadow:0 15px 50px #00162d70;overflow:hidden;font-family:Arial,sans-serif}.vt-historico-titulo{background:#1c427a;color:#fff;font-size:16px;font-weight:800;padding:17px 18px}.vt-historico-corpo{padding:16px 17px 10px}.vt-historico-corpo>p{font-size:16px;margin:12px 0 24px}.vt-historico-lista{max-height:42vh;overflow-y:auto}.vt-historico-item{border-bottom:1px solid #d1ddef;padding:9px 0 12px;font-size:15px}.vt-historico-item b{font-weight:800}.vt-historico-item small{display:block;font-size:12px;color:#6a819e;margin-top:3px}.vt-historico-rodape{display:flex;justify-content:flex-end;padding:18px}.vt-historico-rodape button{border:0;border-radius:5px;background:#1e5aab;color:#fff;font-weight:800;padding:11px 20px;cursor:pointer}`;
 document.head.append(estilo);document.body.append(fundo);
 const fechar=()=>{document.removeEventListener('keydown',tecla,true);fundo.remove();estilo.remove()};
 const tecla=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();fechar()}};
 document.addEventListener('keydown',tecla,true);
 fundo.querySelector('[data-fechar]').onclick=fechar;
 fundo.addEventListener('click',e=>{if(e.target===fundo)fechar()});
}

function selecionarCadastro(tipo){
 if(tipo!=='cliente'){
  const registros=sellerRegistros().map(r=>({id:String(r.id),nome:String(r.nome||''),situacao:String(r.situacao||'ATIVO').toUpperCase()}));
  const fundo=document.createElement('div');fundo.className='vt-modal-back vt-cliente-modal-back';
  fundo.innerHTML=`<div class="vt-cliente-dialog" role="dialog" aria-modal="true" aria-label="SELECIONE O VENDEDOR"><div class="vt-cliente-head"><strong>SELECIONE O VENDEDOR</strong><button type="button" data-fechar aria-label="Fechar">×</button></div><div class="vt-cliente-body"><div class="vt-cliente-filtros"><label>PESQUISAR POR<select data-tipo><option value="nome">NOME</option><option value="id">CÓDIGO</option></select></label><label>TEXTO DA PESQUISA<input data-busca type="search" placeholder="DIGITE PARA PESQUISAR..."></label><button type="button" data-pesquisar>PESQUISAR</button><button type="button" data-novo>+ NOVO VENDEDOR</button></div><div class="vt-cliente-tabela"><table><thead><tr><th>CÓDIGO</th><th>NOME DO VENDEDOR</th><th>SITUAÇÃO</th></tr></thead><tbody data-resultados><tr><td colspan="3">CLIQUE EM PESQUISAR PARA EXIBIR OS VENDEDORES.</td></tr></tbody></table></div><div class="vt-cliente-rodape"><small>DÊ DOIS CLIQUES PARA SELECIONAR.</small><button type="button" data-cancelar>CANCELAR</button></div></div></div>`;
  const style=document.createElement('style');style.textContent=`.vt-cliente-modal-back{z-index:99999;display:flex;align-items:center;justify-content:center}.vt-cliente-dialog{width:min(960px,94vw);max-height:88vh;overflow:hidden;background:#fff;border-radius:12px;box-shadow:0 18px 55px #001b3960;color:#163e70;font-family:Arial,sans-serif}.vt-cliente-head{background:#245b9a;color:white;padding:20px;display:flex;justify-content:space-between;align-items:center;font-size:15px}.vt-cliente-head button{color:white;background:transparent;border:1px solid #ffffff80;border-radius:5px;font-size:25px;width:35px;height:35px;cursor:pointer}.vt-cliente-body{padding:20px}.vt-cliente-filtros{display:grid;grid-template-columns:110px minmax(180px,1fr) 88px 148px;gap:6px;align-items:end}.vt-cliente-filtros label{font-size:11px;font-weight:800;color:#0b315e}.vt-cliente-filtros input,.vt-cliente-filtros select{display:block;width:100%;box-sizing:border-box;height:44px;margin-top:6px;border:1px solid #b9d0f4;border-radius:6px;padding:9px;font-size:13px}.vt-cliente-filtros button{height:42px;border:0;border-radius:5px;background:#205b9e;color:white;font-weight:bold;font-size:11px;cursor:pointer}.vt-cliente-filtros [data-novo]{background:#069b73}.vt-cliente-tabela{margin-top:14px;max-height:43vh;overflow:auto}.vt-cliente-tabela table{border-collapse:collapse;width:100%;font-size:13px}.vt-cliente-tabela th{background:#193e72;color:white;padding:14px;text-align:left}.vt-cliente-tabela td{border-bottom:1px solid #c8d8ed;padding:13px}.vt-cliente-tabela tbody tr[data-id]{cursor:pointer}.vt-cliente-tabela tbody tr[data-id]:hover{background:#e9f2ff}.vt-cliente-tabela .vt-inativo{background:#f7d6d6;color:#923333}.vt-cliente-tabela .vt-ativo{background:#b7edce;color:#175b39}.vt-cliente-tabela .vt-ativo,.vt-cliente-tabela .vt-inativo{padding:6px 14px;border-radius:30px;font-weight:bold}.vt-cliente-rodape{display:flex;justify-content:space-between;align-items:center;margin-top:16px}.vt-cliente-rodape small{font-size:11px}.vt-cliente-rodape button{background:#e7f0ff;color:#18549c;border:1px solid #b7d0ff;border-radius:5px;padding:12px 18px;cursor:pointer}@media(max-width:680px){.vt-cliente-filtros{grid-template-columns:1fr 1fr}.vt-cliente-dialog{width:96vw}}`;
  document.head.append(style);document.body.append(fundo);
  const escKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}};
  const close=()=>{document.removeEventListener('keydown',escKey,true);fundo.remove();style.remove()};
  document.addEventListener('keydown',escKey,true);
  fundo.querySelector('[data-fechar]').onclick=close;fundo.querySelector('[data-cancelar]').onclick=close;
  const tbody=fundo.querySelector('[data-resultados]'),input=fundo.querySelector('[data-busca]'),tipoBusca=fundo.querySelector('[data-tipo]');
  const pesquisar=()=>{const q=input.value.trim().toLocaleUpperCase('pt-BR'),campo=tipoBusca.value;const encontrados=registros.filter(r=>String(r[campo]||'').toLocaleUpperCase('pt-BR').includes(q));tbody.innerHTML='';if(!encontrados.length){tbody.innerHTML='<tr><td colspan="3">NENHUM CADASTRO ENCONTRADO.</td></tr>';return}encontrados.forEach(r=>{const tr=document.createElement('tr');tr.dataset.id=r.id;const ativo=r.situacao!=='INATIVO'&&r.situacao!=='INATIVA';tr.innerHTML=`<td>${esc(r.id)}</td><td>${esc(r.nome)}</td><td><span class="${ativo?'vt-ativo':'vt-inativo'}">${esc(r.situacao)}</span></td>`;tr.ondblclick=()=>{if(!ativo){info('VENDEDOR INATIVO. NÃO É PERMITIDO SELECIONAR.');return}const alvo=$('vt-seller');let option=[...alvo.options].find(o=>o.value===r.id);if(!option){option=new Option(r.nome,r.id);alvo.add(option)}alvo.value=r.id;alvo.dispatchEvent(new Event('change'));close()};tbody.append(tr)})};
  fundo.querySelector('[data-pesquisar]').onclick=pesquisar;input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();pesquisar()}});
  fundo.querySelector('[data-novo]').onclick=()=>{
 window.LL_vendaRetornoCadastro={
  campos:[...document.querySelectorAll('#vt-root input,#vt-root select,#vt-root textarea')].map(el=>({id:el.id,value:el.value,checked:el.checked})),
  itens:JSON.parse(JSON.stringify(itens)),pagamentos:JSON.parse(JSON.stringify(pagamentos)),atual
 };
 window.LL_cadastroVendedorDaVenda=true;
 close();open('FUNCIONÁRIOS');
};
  input.focus();return;
 }

 const registros=clientes().map(c=>({id:String(c.codigo??c.id??''),nome:String(c.nome??c.razao??c.descricao??''),cpf:String(c.cpf??c.cnpj??''),situacao:String(c.situacao??(c.ativo===false?'INATIVO':'ATIVO')).toUpperCase()}));
 const fundo=document.createElement('div');fundo.className='vt-modal-back vt-cliente-modal-back';
 fundo.innerHTML=`<div class="vt-cliente-dialog" role="dialog" aria-modal="true" aria-label="SELECIONE O CLIENTE"><div class="vt-cliente-head"><strong>SELECIONE O CLIENTE</strong><button type="button" data-fechar aria-label="Fechar">×</button></div><div class="vt-cliente-body"><div class="vt-cliente-filtros"><label>PESQUISAR POR<select data-tipo><option value="nome">NOME</option><option value="codigo">CÓDIGO</option><option value="cpf">CPF/CNPJ</option></select></label><label>TEXTO DA PESQUISA<input data-busca type="search" placeholder="DIGITE PARA PESQUISAR..."></label><button type="button" data-pesquisar>PESQUISAR</button><button type="button" data-novo>+ NOVO CLIENTE</button></div><div class="vt-cliente-tabela"><table><thead><tr><th>CÓDIGO</th><th>NOME DO CLIENTE</th><th>SITUAÇÃO</th></tr></thead><tbody data-resultados><tr><td colspan="3">CLIQUE EM PESQUISAR PARA EXIBIR OS CLIENTES.</td></tr></tbody></table></div><div class="vt-cliente-rodape"><small>DÊ DOIS CLIQUES PARA SELECIONAR.</small><button type="button" data-cancelar>CANCELAR</button></div></div></div>`;
 const style=document.createElement('style');style.textContent=`.vt-cliente-modal-back{z-index:99999;display:flex;align-items:center;justify-content:center}.vt-cliente-dialog{width:min(960px,94vw);max-height:88vh;overflow:hidden;background:#fff;border-radius:12px;box-shadow:0 18px 55px #001b3960;color:#163e70;font-family:Arial,sans-serif}.vt-cliente-head{background:#245b9a;color:white;padding:20px;display:flex;justify-content:space-between;align-items:center;font-size:15px}.vt-cliente-head button{color:white;background:transparent;border:1px solid #ffffff80;border-radius:5px;font-size:25px;width:35px;height:35px;cursor:pointer}.vt-cliente-body{padding:20px}.vt-cliente-filtros{display:grid;grid-template-columns:110px minmax(180px,1fr) 88px 148px;gap:6px;align-items:end}.vt-cliente-filtros label{font-size:11px;font-weight:800;color:#0b315e}.vt-cliente-filtros input,.vt-cliente-filtros select{display:block;width:100%;box-sizing:border-box;height:44px;margin-top:6px;border:1px solid #b9d0f4;border-radius:6px;padding:9px;font-size:13px}.vt-cliente-filtros button{height:42px;border:0;border-radius:5px;background:#205b9e;color:white;font-weight:bold;font-size:11px;cursor:pointer}.vt-cliente-filtros [data-novo]{background:#069b73}.vt-cliente-tabela{margin-top:14px;max-height:43vh;overflow:auto}.vt-cliente-tabela table{border-collapse:collapse;width:100%;font-size:13px}.vt-cliente-tabela th{background:#193e72;color:white;padding:14px;text-align:left}.vt-cliente-tabela td{border-bottom:1px solid #c8d8ed;padding:13px}.vt-cliente-tabela tbody tr[data-id]{cursor:pointer}.vt-cliente-tabela tbody tr[data-id]:hover{background:#e9f2ff}.vt-cliente-tabela .vt-inativo{background:#f7d6d6;color:#923333}.vt-cliente-tabela .vt-ativo{background:#b7edce;color:#175b39}.vt-cliente-tabela .vt-ativo,.vt-cliente-tabela .vt-inativo{padding:6px 14px;border-radius:30px;font-weight:bold}.vt-cliente-rodape{display:flex;justify-content:space-between;align-items:center;margin-top:16px}.vt-cliente-rodape small{font-size:11px}.vt-cliente-rodape button{background:#e7f0ff;color:#18549c;border:1px solid #b7d0ff;border-radius:5px;padding:12px 18px;cursor:pointer}@media(max-width:680px){.vt-cliente-filtros{grid-template-columns:1fr 1fr}.vt-cliente-dialog{width:96vw}}`;
 document.head.append(style);document.body.append(fundo);
 const close=()=>{document.removeEventListener('keydown',escKey,true);fundo.remove();style.remove()};
 const escKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}};document.addEventListener('keydown',escKey,true);
 fundo.querySelector('[data-fechar]').onclick=close;fundo.querySelector('[data-cancelar]').onclick=close;
 const tbody=fundo.querySelector('[data-resultados]'),input=fundo.querySelector('[data-busca]'),tipoBusca=fundo.querySelector('[data-tipo]');
 const pesquisar=()=>{const q=input.value.trim().toLocaleUpperCase('pt-BR'),campo=tipoBusca.value;const encontrados=registros.filter(r=>String(r[campo]||'').toLocaleUpperCase('pt-BR').includes(q));tbody.innerHTML='';if(!encontrados.length){tbody.innerHTML='<tr><td colspan="3">NENHUM CADASTRO ENCONTRADO.</td></tr>';return}encontrados.forEach(r=>{const tr=document.createElement('tr');tr.dataset.id=r.id;const ativo=r.situacao!=='INATIVO'&&r.situacao!=='INATIVA';tr.innerHTML=`<td>${esc(r.id)}</td><td>${esc(r.nome)}</td><td><span class="${ativo?'vt-ativo':'vt-inativo'}">${esc(r.situacao)}</span></td>`;tr.ondblclick=()=>{if(!ativo){info('CLIENTE INATIVO. NÃO É PERMITIDO SELECIONAR PARA NOVAS VENDAS.');return}const alvo=$('vt-client');let option=[...alvo.options].find(o=>o.value===r.id);if(!option){option=new Option(r.nome,r.id);alvo.add(option)}alvo.value=r.id;alvo.dispatchEvent(new Event('change'));close()};tbody.append(tr)})};
 fundo.querySelector('[data-pesquisar]').onclick=pesquisar;input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();pesquisar()}});
 fundo.querySelector('[data-novo]').onclick=()=>{if(typeof window.LL_abrirCadastroClienteDaVenda!=='function')return info('CADASTRO DE CLIENTES INDISPONÍVEL.');window.LL_vendaRetornoCadastro={
   campos:[...document.querySelectorAll('#vt-root input,#vt-root select,#vt-root textarea')].map(el=>({id:el.id,value:el.value,checked:el.checked})),
   itens:JSON.parse(JSON.stringify(itens)),pagamentos:JSON.parse(JSON.stringify(pagamentos)),atual
  };
  close();window.LL_abrirCadastroClienteDaVenda()};
 input.focus();
}
function sellerRegistros(){const rh=read('erp_matriz_rh_v1',{funcionarios:[]});const legacy=vendedores();return (rh.funcionarios||[]).filter(f=>String(f.tipo||'').toUpperCase().includes('VENDEDOR')).map(f=>{const previous=legacy.find(v=>Number(v.funcionarioId)===Number(f.id));return {id:previous?previous.id:'F-'+f.id,nome:nomeUsuarioVendedor(f),cpf:f.cpf,situacao:String(f.situacao||'ATIVO').toUpperCase()}})}
function payOpts(){const a=formas().filter(x=>x.ativo!==false&&x.vendas!==false);return '<option value="">SELECIONE</option>'+opt(a,x=>x.id,x=>x.descricao)}
function layoutV(){conciliarReservasVendas();screen='VENDAS';root().innerHTML=`<section class="vt-page"><h1>▣ VENDAS <button type="button" id="vt-shortcuts" class="vt-shortcuts">⌂ ATALHOS</button></h1><div class="vt-panel"><h2>DADOS DA VENDA</h2><div class="vt-grid">${fld('vt-num','Nº VENDA','text','readonly')}${fld('vt-date','DATA','date')}<label class="vt-field">CLIENTE<div class="vt-picker"><select id="vt-client" tabindex="-1" aria-label="Cliente selecionado">${clienteOpts()}</select><button type="button" id="vt-client-plus" aria-label="Selecionar cliente">+</button></div></label><label class="vt-field">VENDEDOR<div class="vt-picker"><select id="vt-seller" tabindex="-1" aria-label="Vendedor selecionado">${sellerOpts()}</select><button type="button" id="vt-seller-plus" aria-label="Selecionar vendedor">+</button></div></label><label class="vt-field">SITUAÇÃO<input id="vt-status" readonly></label><label class="vt-field vt-user-field">USUÁRIO<input id="vt-user" readonly title="CLIQUE PARA VER O HISTÓRICO DESTA VENDA" class="erp-user-display vt-user-click"></label></div></div><div class="vt-panel"><h2>PRODUTOS</h2><div class="vt-grid">${fld('vt-code','CÓDIGO / BARRAS')}${fld('vt-desc','DESCRIÇÃO')}${fld('vt-qty','QUANTIDADE','number','min="0.001" step="any" value="1"')}<input id="vt-price" type="hidden"><button id="vt-add">ADICIONAR PRODUTO</button></div>${painelEstoque("vt")}<div class="vt-scroll"><table class="vt-table"><thead><tr><th>CÓDIGO</th><th>PRODUTO</th><th>QTD.</th><th>UNIT.</th><th>TOTAL</th><th></th></tr></thead><tbody id="vt-items"></tbody></table></div></div><div class="vt-panel"><h2>PAGAMENTOS</h2><div class="vt-grid vt-pay-grid-438"><label class="vt-field">FORMA<select id="vt-method">${payOpts()}</select></label>${fld('vt-payvalue','VALOR','number','min="0.01" step="0.01"')}${fld('vt-install','PARCELAS','number','min="1" max="120" value="1"')}<input type="hidden" id="vt-due"><label class="vt-field" id="vt-transaction-wrap" hidden>IDENTIFICAÇÃO DO PAGAMENTO (OPCIONAL)<input id="vt-transaction-id" type="text" placeholder="NSU / CÓDIGO DA TRANSAÇÃO" autocomplete="off"></label><button id="vt-addpay">ADICIONAR PAGAMENTO</button></div><div class="vt-payment-columns"><div class="vt-payment-summary"><input id="vt-discount" type="hidden" value="0"><input id="vt-extra" type="hidden" value="0"><div class="vt-total-layout"><div id="vt-totals" class="vt-totals vt-total-edit"><label>BRUTO (R$)<input id="vt-bruto-view" type="number" readonly value="0.00"></label><label>DESCONTO (R$)<input id="vt-discount-edit" type="number" min="0" step="0.01" value="0.00"></label><label>DESCONTO (%)<input id="vt-discount-pct" type="number" min="0" step="0.01" value="0"></label><label>ACRÉSCIMO (R$)<input id="vt-extra-edit" type="number" min="0" step="0.01" value="0.00"></label><label>ACRÉSCIMO (%)<input id="vt-extra-pct" type="number" min="0" step="0.01" value="0"></label><label class="vt-total-due">A PAGAR (R$)<input id="vt-payable-edit" type="number" min="0" step="0.01" value="0.00"></label><div>PAGAMENTOS INFORMADOS: <b id="vt-paid-view">R$ 0,00</b></div><div>SALDO: <b id="vt-balance-view">R$ 0,00</b></div></div></div></div><div class="vt-payment-entries"><h3>LANÇAMENTOS DE PAGAMENTOS</h3><div class="vt-scroll"><table class="vt-table"><thead><tr><th>FORMA</th><th>VALOR</th><th>PARCELAS</th><th>VENCIMENTO</th><th>TAXA LOJA</th><th>IDENTIFICAÇÃO</th><th></th></tr></thead><tbody id="vt-pays"></tbody></table></div></div></div></div><div class="vt-actions"><button id="vt-new">NOVA</button><button id="vt-save">GRAVAR</button><button id="vt-edit">ALTERAR</button><button id="vt-close">BAIXAR</button><button id="vt-cancel">CANCELAR</button><button id="vt-print">IMPRIMIR</button><button id="vt-back">VOLTAR</button></div><div class="vt-panel"><h2>ENTREGA / ROMANEIO INDIVIDUAL</h2><div class="vt-grid"><label class="vt-field">TIPO DE ENTREGA<select id="vt-delivery"><option value="RETIRADA">RETIRADA NA LOJA</option><option value="CADASTRADO">ENDEREÇO DO CLIENTE</option><option value="OUTRO">OUTRO ENDEREÇO</option></select></label>${fld('vt-recipient','DESTINATÁRIO')}${fld('vt-phone','TELEFONE')}${fld('vt-address','RUA / AVENIDA')}${fld('vt-number','NÚMERO')}${fld('vt-neighborhood','BAIRRO')}${fld('vt-city','CIDADE / UF')}${fld('vt-zip','CEP')}${fld('vt-reference','COMPLEMENTO / REFERÊNCIA')}<label class="vt-field">MOTORISTA<div class="vt-picker"><input id="vt-driver" placeholder="SELECIONE" readonly><button type="button" id="vt-driver-plus">+</button></div></label></div><div class="vt-rom-actions"><button type="button" id="vt-rom-save">GRAVAR</button><button type="button" id="vt-rom-edit">ALTERAR</button><button type="button" id="vt-romaneio">IMPRIMIR ROMANEIO</button></div></div><div class="vt-panel vt-consulta"><h2>CONSULTAR VENDAS</h2><div class="vt-consulta-filtros"><label class="vt-field">DATA INICIAL<input id="vt-filter-start" type="date"></label><label class="vt-field">DATA FINAL<input id="vt-filter-end" type="date"></label><label class="vt-field">VENDEDOR<div class="vt-picker"><input id="vt-filter-seller" value="TODOS" readonly><button type="button" id="vt-filter-seller-plus">+</button></div></label><label class="vt-field">CLIENTE<div class="vt-picker"><input id="vt-filter-client" value="TODOS" readonly><button type="button" id="vt-filter-client-plus">+</button></div></label><label class="vt-field">SITUAÇÃO<select id="vt-filter-status"><option value="TODAS">TODAS</option><option value="PENDENTE">PENDENTES</option><option value="BAIXADA">BAIXADAS</option><option value="CANCELADA">CANCELADAS</option></select></label><button type="button" id="vt-filter-search">PESQUISAR</button></div><div class="vt-scroll"><table class="vt-table"><thead><tr><th>Nº</th><th>DATA</th><th>CLIENTE</th><th>VENDEDOR</th><th>SITUAÇÃO</th><th>TOTAL</th></tr></thead><tbody id="vt-list"><tr><td colspan="6">CLIQUE EM PESQUISAR PARA EXIBIR AS VENDAS.</td></tr></tbody></table></div></div></section>`;
$('vt-client-plus').onclick=()=>selecionarCadastro('cliente');$('vt-seller-plus').onclick=()=>selecionarCadastro('vendedor');$('vt-user').onclick=historicoVenda;$('vt-shortcuts').onclick=atalhosVendas;$('vt-new').onclick=newV;$('vt-save').onclick=()=>saveV(false);$('vt-edit').onclick=editV;$('vt-close').onclick=closeV;$('vt-cancel').onclick=cancelV;$('vt-print').onclick=()=>printV(false);$('vt-romaneio').onclick=()=>printV(true);$('vt-driver-plus').onclick=selecionarMotorista;$('vt-rom-save').onclick=()=>salvarRomaneio(false);$('vt-rom-edit').onclick=()=>salvarRomaneio(true);$('vt-back').onclick=()=>category('VENDAS');$('vt-add').onclick=addItem;$('vt-addpay').onclick=addPay;$('vt-method').onchange=()=>{atualizarVencimento();aplicarPromocaoFormaVenda()};atualizarVencimento();$('vt-code').oninput=lookup;$('vt-code').onchange=lookup;$('vt-code').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();lookup(true);}});$('vt-filter-search').onclick=()=>listV(true);$('vt-filter-seller-plus').onclick=()=>selecionarFiltroV('vendedor');$('vt-filter-client-plus').onclick=()=>selecionarFiltroV('cliente');$('vt-client').onchange=fillAddress;$('vt-delivery').onchange=fillAddress;$('vt-discount-edit').addEventListener('input',()=>ajustarTotalVenda('desconto'));$('vt-extra-edit').addEventListener('input',()=>ajustarTotalVenda('acrescimo'));$('vt-discount-pct').addEventListener('input',()=>ajustarTotalVenda('desconto-pct'));$('vt-extra-pct').addEventListener('input',()=>ajustarTotalVenda('acrescimo-pct'));$('vt-payable-edit').addEventListener('input',()=>ajustarTotalVenda('total'));newV();active('VENDAS')}
function newV(){descontoPromocionalAplicado=0;atual=null;itens=[];pagamentos=[];$('vt-num').value=String(seq(vendas)).padStart(6,'0');$('vt-date').value=today();$('vt-client').value='';$('vt-seller').value='';$('vt-status').value='PENDENTE';$('vt-discount').value=0;$('vt-extra').value=0;['vt-code','vt-desc','vt-price','vt-recipient','vt-phone','vt-address','vt-number','vt-neighborhood','vt-city','vt-zip','vt-reference','vt-driver'].forEach(id=>$(id).value='');$('vt-qty').value=1;$('vt-delivery').value='RETIRADA';$('vt-method').value='';$('vt-due').value='';$('vt-transaction-id').value='';atualizarVencimento();drawV();atualizarPainel('vt','');mostrarUsuario()}
function lookup(confirmar=false){
 const campo=$('vt-code'),code=campo.value.trim();
 const p=produtos().find(x=>String(x.codigo??'').trim()===code||String(x.barras??x.codigoBarras??x.codigo_barras??'').trim()===code);
 atualizarPainel('vt',p?.codigo??code);
 if(p){$('vt-desc').value=p.descricao??p.nome??'';$('vt-price').value=Number(p.preco??p.precoVenda??p.preco_venda??0).toFixed(2);if(confirmar){campo.value=String(p.codigo);$('vt-qty').focus();$('vt-qty').select();}}
 else{$('vt-desc').value='';$('vt-price').value='';if(confirmar&&code)info('PRODUTO NÃO ENCONTRADO. INFORME UM CÓDIGO OU CÓDIGO DE BARRAS CADASTRADO.');}
}
function addItem(){
 lookup(true);
 const codigo=$('vt-code').value.trim(),p=produtos().find(x=>String(x.codigo)===codigo),quantidade=+$('vt-qty').value;
 if(!p)return info('LOCALIZE UM PRODUTO CADASTRADO PELO CÓDIGO OU CÓDIGO DE BARRAS.');
 const descricao=p.descricao??p.nome??'',preco=Number(p.preco??p.precoVenda??p.preco_venda??0);
 if(!(quantidade>0)||!Number.isFinite(preco)||preco<0)return info('INFORME UMA QUANTIDADE VÁLIDA E VERIFIQUE O PREÇO CADASTRADO.');
 itens.push({codigo:String(p.codigo),descricao,quantidade,preco});atualizarPainel('vt',codigo);
 $('vt-code').value='';$('vt-desc').value='';$('vt-price').value='';$('vt-qty').value=1;drawV();$('vt-code').focus();
}
function clienteInativo(id){const c=clientes().find(x=>String(x.codigo)===String(id));return !!c&&String(c.situacao||'ATIVO').trim().toUpperCase()==='INATIVO'}
function formaBoleto(p){const f=formas().find(x=>String(x.id)===String(p.forma));return String(f?.tipo||'').trim().toUpperCase()==='BOLETO'||/BOLETO/i.test(String(f?.descricao||p.descricao||''))}
function verificarBoletoInativo(clienteId,pags){if(clienteInativo(clienteId)&&(pags||[]).some(formaBoleto))throw Error('CLIENTE INATIVO. NÃO É PERMITIDA A VENDA NO BOLETO. SELECIONE OUTRA FORMA DE PAGAMENTO.')}
function ehBoleto(ref){return String(ref?.tipo||'').toUpperCase()==='BOLETO'||/BOLETO/i.test(ref?.descricao||'')}
function atualizarIdentificacao(){const f=formas().find(x=>String(x.id)===$('vt-method')?.value);const t=String(f?.tipo||'').toUpperCase();const d=String(f?.descricao||'').toUpperCase();const show=/PIX|CART|CR[EÉ]DITO|D[EÉ]BITO/.test(t+' '+d);const el=$('vt-transaction-wrap');if(el)el.hidden=!show;if(!show&&$('vt-transaction-id'))$('vt-transaction-id').value=''}
// Promoções são cadastradas por PRODUTO e FORMA DE PAGAMENTO, com período de vigência.
// A seleção troca somente a parcela promocional, preservando o desconto manual anterior.
let descontoPromocionalAplicado=0;
function aplicarPromocaoFormaVenda(){
 const formaId=String($('vt-method')?.value||'');
 const bruto=itens.reduce((s,x)=>s+Number(x.quantidade||0)*Number(x.preco||0),0);
 let desconto=0;
 if(formaId){
  let registros=[];
  try{const dados=JSON.parse(localStorage.getItem('erp_matriz_promocoes_v1')||'[]');if(Array.isArray(dados))registros=dados}catch(e){console.warn('Não foi possível ler promoções',e)}
  const data=$('vt-date')?.value||today();
  for(const item of itens){
   const promo=registros.find(r=>String(r.produto)===String(item.codigo)&&String(r.formaId)===formaId&&r.inicio<=data&&r.fim>=data);
   if(!promo)continue;
   const quantidade=Math.max(0,Number(item.quantidade)||0),preco=Math.max(0,Number(item.preco)||0);
   const valor=String(promo.tipo).toUpperCase()==='PERCENTUAL'?preco*quantidade*(Number(promo.desconto)||0)/100:quantidade*(Number(promo.desconto)||0);
   desconto+=Math.min(preco*quantidade,Math.max(0,valor));
  }
 }
 desconto=Math.round(desconto*100)/100;
 const anterior=Math.max(0,Number($('vt-discount').value)||0);
 const manual=Math.max(0,anterior-descontoPromocionalAplicado);
 const novo=Math.min(Math.max(0,bruto+Number($('vt-extra').value||0)),Math.round((manual+desconto)*100)/100);
 descontoPromocionalAplicado=Math.min(desconto,Math.max(0,novo-manual));
 $('vt-discount').value=String(novo);
 atualizarPainelTotais();
}
function atualizarVencimento(){atualizarIdentificacao();const ref=formas().find(x=>String(x.id)===$('vt-method')?.value),boleto=ehBoleto(ref);if(!$('vt-due').value)$('vt-due').value=today()}
function adicionarMeses(data,meses){const [ano,mes,dia]=data.split('-').map(Number);const d=new Date(ano,mes-1+meses,1);const ultimo=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(Math.min(dia,ultimo)).padStart(2,'0')].join('-')}
function dividirParcelas(valor,n,primeiro){const cent=Math.round(valor*100),base=Math.floor(cent/n),resto=cent-base*n;return Array.from({length:n},(_,i)=>({parcela:i+1,totalParcelas:n,vencimento:adicionarMeses(primeiro,i),valor:(base+(i<resto?1:0))/100}))}
function addPay(){const forma=$('vt-method').value,ref=formas().find(x=>String(x.id)===forma),valor=Number($('vt-payvalue').value),parcelas=Number($('vt-install').value),boleto=ehBoleto(ref);if(!ref)return info('SELECIONE UMA FORMA DE PAGAMENTO CADASTRADA.');if(!(valor>0)||!Number.isInteger(parcelas)||parcelas<1)return info('PAGAMENTO INVÁLIDO.');if(clienteInativo($('vt-client').value)&&boleto)return info('CLIENTE INATIVO. NÃO É PERMITIDA A VENDA NO BOLETO.');if(parcelas>1&&(!ref.parcelamento||parcelas>Number(ref.maxParcelas||1)))return info('PARCELAMENTO NÃO PERMITIDO NESTA FORMA.');const primeiro=$('vt-due').value||today();if(boleto&&(!primeiro||!/^\d{4}-\d{2}-\d{2}$/.test(primeiro)))return info('INFORME A DATA DO PRIMEIRO VENCIMENTO.');const taxa=ref.tipo==='PIX'?Number(ref.taxaPix||0):Number((ref.taxas||[]).find(t=>Number(t.parcelas)===parcelas)?.taxa||0);const detalhes=boleto?dividirParcelas(valor,parcelas,primeiro):[];pagamentos.push({forma,descricao:ref.descricao,valor,parcelas,identificacaoPagamento:$('vt-transaction-id').value.trim(),operadora:'',taxa,liquido:Math.round(valor*(1-taxa/100)*100)/100,boleto,primeiroVencimento:boleto?primeiro:null,detalhes});$('vt-payvalue').value='';$('vt-transaction-id').value='';drawV()}

function ajustarTotalVenda(origem){descontoPromocionalAplicado=0;
 const bruto=Math.round(itens.reduce((s,x)=>s+x.quantidade*x.preco,0)*100)/100;
 const desc=$('vt-discount-edit'),extra=$('vt-extra-edit'),pagar=$('vt-payable-edit');
 const val=el=>Math.max(0,Number(el.value)||0);
 if(origem==='desconto-pct')desc.value=(bruto*val($('vt-discount-pct'))/100).toFixed(2);
 if(origem==='acrescimo-pct')extra.value=(bruto*val($('vt-extra-pct'))/100).toFixed(2);
 if(origem==='total'){
  const dif=Math.round((val(pagar)-bruto)*100)/100;
  $('vt-discount').value=String(Math.max(0,-dif));$('vt-extra').value=String(Math.max(0,dif));
  desc.value=Math.max(0,-dif).toFixed(2);extra.value=Math.max(0,dif).toFixed(2);
 }else{
  $('vt-discount').value=String(val(desc));$('vt-extra').value=String(val(extra));
  // O valor a pagar não pode ficar negativo.
  if(val(desc)>bruto+val(extra)){$('vt-discount').value=String(bruto+val(extra));desc.value=(bruto+val(extra)).toFixed(2)}
  pagar.value=Math.max(0,bruto-Number($('vt-discount').value)+Number($('vt-extra').value)).toFixed(2);
 }
 atualizarPainelTotais(origem);
}
function atualizarPainelTotais(origem=''){
 const t=totals();
 const set=(id,value)=>{const el=$(id);if(el&&id!==origem)el.value=value};
 set('vt-bruto-view',t.bruto.toFixed(2));
 if(origem!=='desconto')set('vt-discount-edit',t.desconto.toFixed(2));
 if(origem!=='acrescimo')set('vt-extra-edit',t.acrescimo.toFixed(2));
 if(origem!=='total')set('vt-payable-edit',t.total.toFixed(2));
 set('vt-discount-pct',t.bruto?(t.desconto/t.bruto*100).toFixed(2):'0.00');set('vt-extra-pct',t.bruto?(t.acrescimo/t.bruto*100).toFixed(2):'0.00');
 $('vt-paid-view').textContent=money(t.pago);$('vt-balance-view').textContent=money(t.saldo);
}
function totals(){const bruto=itens.reduce((s,x)=>s+x.quantidade*x.preco,0),desconto=+$('vt-discount').value||0,acrescimo=+$('vt-extra').value||0,total=Math.max(0,bruto-desconto+acrescimo),pago=pagamentos.reduce((s,x)=>s+x.valor,0);return {bruto,desconto,acrescimo,total,pago,saldo:Math.max(0,total-pago)}}
function drawV(){if(!$('vt-items'))return;const vendaAtual=vendas.find(v=>Number(v.numero)===Number(atual));
 const aplicadas=vendaAtual?(vendaAtual.trocasAplicadas||[]).filter(t=>t.situacao==='BAIXADA'):[];
 const permiteRemoverItens=!vendaAtual||String(vendaAtual.situacao||'PENDENTE').toUpperCase()==='PENDENTE';
 const devolvidosPorIndice=new Map();
 for(const t of aplicadas){for(const x of (t.devolvidos||[])){
  const indice=Number(x.indice);
  if(!Number.isInteger(indice)||indice<0||indice>=itens.length)continue;
  const registro=devolvidosPorIndice.get(indice)||{quantidade:0,trocas:[]};
  registro.quantidade+=Number(x.quantidade)||0;
  registro.trocas.push(t.numero);
  devolvidosPorIndice.set(indice,registro);
 }}
 // Exibir separadamente a quantidade devolvida e a parte original preservada.
 const linhaVenda=(x,i,qtd,classe='',acao='')=>`<tr${classe?` class="${classe}"`:''}><td class="vt-item-stock-text" data-stock="${i}" tabindex="0" title="CLIQUE PARA CONSULTAR O ESTOQUE">${esc(x.codigo)}</td><td class="vt-item-stock-text" data-stock="${i}" tabindex="0" title="CLIQUE PARA CONSULTAR O ESTOQUE">${esc(x.descricao)}</td><td>${qtd}</td><td>${money(x.preco)}</td><td>${money(qtd*x.preco)}</td><td>${acao}</td></tr>`;
 $('vt-items').innerHTML=itens.map((x,i)=>{
  const total=Number(x.quantidade)||0;
  const devolvida=Math.max(0,Math.min(total,Number(devolvidosPorIndice.get(i)?.quantidade)||0));
  const restante=Math.max(0,total-devolvida);
  if(!devolvida)return linhaVenda(x,i,total,'',permiteRemoverItens?`<button data-r="${i}">REMOVER</button>`:'NORMAL');
  return (restante>0?linhaVenda(x,i,restante,'','NORMAL'):'')+linhaVenda(x,i,devolvida,'tr-sale-return','TROCA');
 }).join('')||'<tr><td colspan="6">NENHUM PRODUTO</td></tr>';
 for(const t of aplicadas){
  const linhas=(t.novos||[]).map(x=>`<tr class="tr-sale-new"><td class="vt-item-stock-text" data-stock-code="${esc(x.codigo)}" tabindex="0" title="CLIQUE PARA CONSULTAR O ESTOQUE">${esc(x.codigo)}</td><td class="vt-item-stock-text" data-stock-code="${esc(x.codigo)}" tabindex="0" title="CLIQUE PARA CONSULTAR O ESTOQUE">${esc(x.descricao)}</td><td>${x.quantidade}</td><td>${money(x.preco)}</td><td>${money(x.quantidade*x.preco)}</td><td>NOVO</td></tr>`).join('');
  $('vt-items').insertAdjacentHTML('beforeend',linhas);
 }
 $('vt-items').querySelectorAll('[data-stock]').forEach(el=>{const selecionar=()=>visualizarEstoqueItemVenda(itens[Number(el.dataset.stock)]?.codigo);el.onclick=selecionar;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selecionar()}}});
 $('vt-items').querySelectorAll('[data-stock-code]').forEach(el=>{const selecionar=()=>visualizarEstoqueItemVenda(el.dataset.stockCode);el.onclick=selecionar;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selecionar()}}});
 $('vt-items').querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{if(!permiteRemoverItens)return;itens.splice(+b.dataset.r,1);drawV();atualizarPainel('vt',itens[0]?.codigo||'')});$('vt-pays').innerHTML=pagamentos.map((x,i)=>`<tr><td>${esc(x.descricao)}</td><td>${money(x.valor)}</td><td>${x.parcelas}x</td><td>${x.boleto?esc(x.primeiroVencimento):'—'}</td><td>${money(x.valor-x.liquido)}</td><td>${esc(x.identificacaoPagamento||'—')}</td><td><button data-r="${i}">REMOVER</button></td></tr>`).join('')||'<tr><td colspan="7">NENHUM PAGAMENTO</td></tr>';if(vendaAtual){for(const t of (vendaAtual.trocasAplicadas||[]).filter(x=>x.situacao==='BAIXADA')){
  // Priorizar o registro da troca: versões antigas da venda podem conter uma cópia incompleta dos pagamentos.
  const trocaOriginal=trocas.find(reg=>Number(reg.numero)===Number(t.numero));
  const pagamentosTroca=(trocaOriginal?.pagamentos?.length?trocaOriginal.pagamentos:t.pagamentos)||[];
  for(const p of pagamentosTroca){
   const valor=Number(p.valor||0);
   const taxaPercentual=Number(p.taxa||0);
   const taxaValor=Number(p.taxaLoja??(valor*taxaPercentual/100));
   const taxaTexto=money(taxaValor)+(taxaPercentual>0?' ('+taxaPercentual.toLocaleString('pt-BR')+'%)':'');
   $('vt-pays').insertAdjacentHTML('beforeend',`<tr><td>${esc(p.forma)} — TROCA Nº ${t.numero} (${t.acerto==='DEVOLUCAO'?'DEVOLVIDO':'RECEBIDO'})</td><td>${t.acerto==='DEVOLUCAO'?'-':''}${money(valor)}</td><td>1x</td><td>—</td><td>${taxaTexto}</td><td>${esc(p.identificacaoPagamento||'—')}</td><td>TROCA</td></tr>`);
  }
 }}
 $('vt-pays').querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{pagamentos.splice(+b.dataset.r,1);drawV()});atualizarPainelTotais()}

function selecionarMotorista(){
 const rh=read('erp_matriz_rh_v1',{funcionarios:[]});
 const empregados=(rh.funcionarios||[]).filter(f=>String(f.situacao||'ATIVO').toUpperCase()!=='INATIVO'&&String(f.situacao||'ATIVO').toUpperCase()!=='INATIVA'&&/MOTORISTA/i.test([f.cargo,f.funcao,f.cargoNome,f.funcaoNome,f.descricaoCargo,f.tipo].filter(Boolean).join(' '))).map(f=>({id:String(f.codigo??f.id??''),nome:String(f.nome||''),situacao:String(f.situacao||'ATIVO').toUpperCase()}));
 const fundo=document.createElement('div');fundo.className='vt-modal-back vt-cliente-modal-back';
 fundo.innerHTML=`<div class="vt-cliente-dialog" role="dialog" aria-modal="true" aria-label="SELECIONE O MOTORISTA"><div class="vt-cliente-head"><strong>SELECIONE O MOTORISTA</strong><button type="button" data-fechar aria-label="Fechar">×</button></div><div class="vt-cliente-body"><div class="vt-cliente-filtros"><label>PESQUISAR POR<select data-tipo><option value="nome">NOME</option><option value="id">CÓDIGO</option></select></label><label>TEXTO DA PESQUISA<input data-busca type="search" placeholder="DIGITE PARA PESQUISAR..."></label><button type="button" data-pesquisar>PESQUISAR</button><button type="button" data-novo>+ NOVO MOTORISTA</button></div><div class="vt-cliente-tabela"><table><thead><tr><th>CÓDIGO</th><th>NOME DO MOTORISTA</th><th>SITUAÇÃO</th></tr></thead><tbody data-resultados><tr><td colspan="3">CLIQUE EM PESQUISAR PARA EXIBIR OS MOTORISTAS.</td></tr></tbody></table></div><div class="vt-cliente-rodape"><small>DÊ DOIS CLIQUES PARA SELECIONAR.</small><button type="button" data-cancelar>CANCELAR</button></div></div></div>`;
 const style=document.createElement('style');style.textContent=`.vt-cliente-modal-back{z-index:99999;display:flex;align-items:center;justify-content:center}.vt-cliente-dialog{width:min(960px,94vw);max-height:88vh;overflow:hidden;background:#fff;border-radius:12px;box-shadow:0 18px 55px #001b3960;color:#163e70;font-family:Arial,sans-serif}.vt-cliente-head{background:#245b9a;color:white;padding:20px;display:flex;justify-content:space-between;align-items:center;font-size:15px}.vt-cliente-head button{color:white;background:transparent;border:1px solid #ffffff80;border-radius:5px;font-size:25px;width:35px;height:35px;cursor:pointer}.vt-cliente-body{padding:20px}.vt-cliente-filtros{display:grid;grid-template-columns:110px minmax(180px,1fr) 88px 148px;gap:6px;align-items:end}.vt-cliente-filtros label{font-size:11px;font-weight:800;color:#0b315e}.vt-cliente-filtros input,.vt-cliente-filtros select{display:block;width:100%;box-sizing:border-box;height:44px;margin-top:6px;border:1px solid #b9d0f4;border-radius:6px;padding:9px;font-size:13px}.vt-cliente-filtros button{height:42px;border:0;border-radius:5px;background:#205b9e;color:white;font-weight:bold;font-size:11px;cursor:pointer}.vt-cliente-filtros [data-novo]{background:#069b73}.vt-cliente-tabela{margin-top:14px;max-height:43vh;overflow:auto}.vt-cliente-tabela table{border-collapse:collapse;width:100%;font-size:13px}.vt-cliente-tabela th{background:#193e72;color:white;padding:14px;text-align:left}.vt-cliente-tabela td{border-bottom:1px solid #c8d8ed;padding:13px}.vt-cliente-tabela tbody tr[data-id]{cursor:pointer}.vt-cliente-tabela tbody tr[data-id]:hover{background:#e9f2ff}.vt-cliente-rodape{display:flex;justify-content:space-between;align-items:center;margin-top:16px}.vt-cliente-rodape small{font-size:11px}.vt-cliente-rodape button{background:#e7f0ff;color:#18549c;border:1px solid #b7d0ff;border-radius:5px;padding:12px 18px;cursor:pointer}@media(max-width:680px){.vt-cliente-filtros{grid-template-columns:1fr 1fr}.vt-cliente-dialog{width:96vw}}`;
 document.head.append(style);document.body.append(fundo);
 const fechar=()=>{document.removeEventListener('keydown',escKey,true);fundo.remove();style.remove()};
 const escKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();fechar()}};
 document.addEventListener('keydown',escKey,true);
 fundo.querySelector('[data-fechar]').onclick=fechar;fundo.querySelector('[data-cancelar]').onclick=fechar;
 const tbody=fundo.querySelector('[data-resultados]'),busca=fundo.querySelector('[data-busca]'),tipo=fundo.querySelector('[data-tipo]');
 const pesquisar=()=>{const q=busca.value.trim().toLocaleUpperCase('pt-BR');const encontrados=empregados.filter(r=>String(r[tipo.value]||'').toLocaleUpperCase('pt-BR').includes(q));tbody.innerHTML='';if(!encontrados.length){tbody.innerHTML='<tr><td colspan="3">NENHUM MOTORISTA ATIVO ENCONTRADO.</td></tr>';return}encontrados.forEach(r=>{const tr=document.createElement('tr');tr.dataset.id=r.id;tr.innerHTML=`<td>${esc(r.id)}</td><td>${esc(r.nome)}</td><td><span class="vt-ativo">${esc(r.situacao)}</span></td>`;tr.ondblclick=()=>{$('vt-driver').value=r.nome;fechar()};tbody.append(tr)})};
 fundo.querySelector('[data-pesquisar]').onclick=pesquisar;busca.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();pesquisar()}});
 fundo.querySelector('[data-novo]').onclick=()=>{
  window.LL_vendaRetornoCadastro={campos:[...document.querySelectorAll('#vt-root input,#vt-root select,#vt-root textarea')].map(el=>({id:el.id,value:el.value,checked:el.checked})),itens:JSON.parse(JSON.stringify(itens)),pagamentos:JSON.parse(JSON.stringify(pagamentos)),atual};
  window.LL_cadastroVendedorDaVenda=true;
  window.LL_cadastroMotoristaDaVenda=true;
  fechar();open('FUNCIONÁRIOS');
 };
 busca.focus();
}
function salvarRomaneio(alterar){
 const d=vendas.find(x=>x.numero===atual);
 if(!d)return info('GRAVE A VENDA ANTES DE GRAVAR O ROMANEIO.');
 if(alterar&&!d.romaneioGravado)return info('GRAVE O ROMANEIO ANTES DE ALTERAR.');
 if(!alterar&&d.romaneioGravado)return info('ROMANEIO JÁ GRAVADO. USE ALTERAR.');
 d.entrega={tipo:$('vt-delivery').value,destinatario:$('vt-recipient').value,telefone:$('vt-phone').value,rua:$('vt-address').value,numero:$('vt-number').value,bairro:$('vt-neighborhood').value,cidade:$('vt-city').value,cep:$('vt-zip').value,referencia:$('vt-reference').value,motorista:$('vt-driver').value};
 d.romaneioGravado=true;registrarAcao(d,alterar?'ROMANEIO ALTERADO':'ROMANEIO GRAVADO');save(VK,vendas);info(alterar?'ROMANEIO ALTERADO.':'ROMANEIO GRAVADO.');
}
function fillAddress(){if($('vt-delivery').value!=='CADASTRADO')return;const c=clientes().find(x=>String(x.codigo??x.id)===$('vt-client').value);if(!c)return;$('vt-recipient').value=c.nome||'';$('vt-phone').value=c.telefone||'';$('vt-address').value=c.rua||c.endereco||'';$('vt-number').value=c.numero||'';$('vt-neighborhood').value=c.bairro||'';$('vt-city').value=[c.cidade,c.uf].filter(Boolean).join(' / ');$('vt-zip').value=c.cep||''}
function dataV(){const c=$('vt-client'),v=$('vt-seller');return {numero:atual||seq(vendas),data:$('vt-date').value,clienteId:c.value,cliente:c.selectedOptions[0]?.textContent||'',vendedorId:v.value,vendedor:v.selectedOptions[0]?.textContent||'',itens:structuredClone(itens),pagamentos:structuredClone(pagamentos),...totals(),entrega:{tipo:$('vt-delivery').value,destinatario:$('vt-recipient').value,telefone:$('vt-phone').value,rua:$('vt-address').value,numero:$('vt-number').value,bairro:$('vt-neighborhood').value,cidade:$('vt-city').value,cep:$('vt-zip').value,referencia:$('vt-reference').value,motorista:$('vt-driver').value}}}
function validate(){const d=dataV();verificarBoletoInativo(d.clienteId,d.pagamentos);if(!d.clienteId||!d.vendedorId||!d.itens.length)throw Error('SELECIONE CLIENTE, VENDEDOR E AO MENOS UM PRODUTO.');if(d.desconto<0||d.acrescimo<0||d.desconto>d.bruto+d.acrescimo)throw Error('DESCONTO OU ACRÉSCIMO INVÁLIDO.');if(d.pago>d.total+0.001)throw Error('PAGAMENTOS MAIORES QUE O TOTAL DA VENDA.');return d}
function updateStock(oldStatus,newStatus,lines){
 // Cadastro de Produtos é a fonte única do estoque físico.
 const ps=produtos();
 if(!Array.isArray(ps))throw Error('CADASTRO DE PRODUTOS INDISPONÍVEL.');
 const changes=new Map();
 for(const x of lines||[]){
  const key=String(x.codigo??'').trim();const q=Number(x.quantidade);
  if(!key||!Number.isFinite(q)||q<=0)throw Error('ITEM DA VENDA COM CÓDIGO OU QUANTIDADE INVÁLIDA.');
  const p=ps.find(z=>String(z.codigo).trim()===key);
  if(!p)throw Error('PRODUTO '+key+' NÃO ENCONTRADO NO CADASTRO. ESTOQUE NÃO ALTERADO.');
  const row=changes.get(key)||{p,provisao:Number(p.provisao)||0,venda:Number(p.venda)||0};
  if(oldStatus==='PENDENTE')row.venda-=q;
  if(oldStatus==='BAIXADA')row.provisao+=q;
  if(newStatus==='PENDENTE')row.venda+=q;
  if(newStatus==='BAIXADA')row.provisao-=q;
  changes.set(key,row);
 }
 for(const row of changes.values()){
  if(row.provisao < -0.000001)throw Error('ESTOQUE FÍSICO INSUFICIENTE PARA BAIXAR A VENDA.');
  if(row.venda < -0.000001)throw Error('RESERVA DE ESTOQUE INCONSISTENTE. ATUALIZE A CONSULTA E TENTE NOVAMENTE.');
 }
 for(const row of changes.values()){
  row.p.provisao=Math.max(0,row.provisao);
  row.p.venda=Math.max(0,row.venda);
 }
 save(PK,ps);
 // Conferir o valor gravado diretamente: a conciliação global só pode ocorrer
 // depois de persistir a nova situação da venda, nunca durante a baixa.
 const persisted=read(PK,[]);
 for(const row of changes.values()){
  const checked=persisted.find(p=>String(p.codigo)===String(row.p.codigo));
  if(!checked||Math.abs(Number(checked.provisao)-row.p.provisao)>0.000001)
   throw Error('FALHA AO CONFIRMAR O ESTOQUE NO CADASTRO DE PRODUTOS.');
 }
}
function conciliarReservasVendas(){
 // Reconstruir a reserva a partir das vendas realmente pendentes, evitando
 // saldos negativos herdados de baixas e cancelamentos anteriores.
 const ps=produtos();const reservas=new Map();
 for(const v of vendas){if(String(v.situacao).toUpperCase()!=='PENDENTE')continue;
  for(const item of v.itens||[]){const k=String(item.codigo);reservas.set(k,(reservas.get(k)||0)+(Number(item.quantidade)||0))}
 }
 let alterado=false;
 for(const p of ps){const correto=Math.max(0,reservas.get(String(p.codigo))||0);
  if(Number(p.venda||0)!==correto){p.venda=correto;alterado=true}
 }
 if(alterado)save(PK,ps);
}

function sincronizarBoletos(venda){const chave='erp_matriz_operacoes_v2',base=read(chave,{});if(!Array.isArray(base.receber))base.receber=[];let id=Math.max(0,...base.receber.map(x=>Number(x.id)||0))+1;const referencia='VENDA '+String(venda.numero).padStart(6,'0');let sequenciaCarne=0;(venda.pagamentos||[]).forEach((pag,indice)=>{if(!pag.boleto&&!formaBoleto(pag))return;const detalhes=pag.detalhes?.length?pag.detalhes:dividirParcelas(pag.valor,pag.parcelas,pag.primeiroVencimento||venda.data);detalhes.forEach(par=>{const codigoCarne='V'+String(venda.numero)+'-'+String(++sequenciaCarne).padStart(2,'0');const chavePar=referencia+'-PAG'+indice+'-'+par.parcela;const existente=base.receber.find(x=>x.chaveVenda===chavePar);if(existente){existente.codigoCarne=existente.codigoCarne||codigoCarne;if(existente.situacao==='CANCELADA' && !(Number(existente.pago)>0)){existente.situacao='PENDENTE';existente.saldo=par.valor;}return;}base.receber.push({id:id++,codigoCarne,origemCarne:'VENDA',numeroOrigem:venda.numero,conta:referencia+'-PAG'+indice,parcela:par.parcela,totalParcelas:par.totalParcelas,pessoa:venda.clienteId,descricao:'BOLETO '+referencia,valor:par.valor,pago:0,saldo:par.valor,vencimento:par.vencimento,situacao:'PENDENTE',pagamentos:[],ref:referencia,chaveVenda:chavePar})})});save(chave,base)}
function imprimirCarneVenda(){
 const venda=atual?vendas.find(x=>x.numero===atual):null;
 if(!venda||venda.situacao!=='BAIXADA')return info('PARA IMPRIMIR O CARNÊ, É NECESSÁRIO BAIXAR A VENDA.');
 const boletos=(venda.pagamentos||[]).filter(p=>p.boleto||formaBoleto(p));
 if(!boletos.length)return info('ESTA VENDA NÃO POSSUI BOLETOS.');
 const parcelas=boletos.flatMap(p=>p.detalhes?.length?p.detalhes:dividirParcelas(p.valor,p.parcelas,p.primeiroVencimento||venda.data)).map((p,i)=>({...p,codigoCarne:'V'+String(venda.numero)+'-'+String(i+1).padStart(2,'0')}));
 if(!parcelas.length)return info('NÃO HÁ PARCELAS PARA IMPRIMIR.');
 const numero=String(venda.numero).padStart(6,'0');
 const loja=(document.querySelector('.top-loja')?.textContent||document.querySelector('.store-name')?.textContent||'LUCAS LIMA').trim();
 const dataBR=d=>{const v=String(d||'');return /^\d{4}-\d{2}-\d{2}$/.test(v)?v.split('-').reverse().join('/'):v};
 const cards=parcelas.map((p,i)=>`<section class="carne-parcela"><header class="carne-head"><div><strong>${esc(loja)}</strong><small>COMPROVANTE DE COBRANÇA · CARNÊ SIMPLES</small></div><div class="carne-tag">PARCELA ${esc(p.parcela??i+1)} / ${esc(p.totalParcelas??parcelas.length)}</div></header><div class="carne-title">CARNÊ DE PAGAMENTO</div><div style="text-align:center;font-size:18px;font-weight:800;margin:8px 0">CÓDIGO: ${esc(p.codigoCarne)}</div><div class="carne-grid"><div><span>VENDA Nº</span><b>${esc(numero)}</b></div><div><span>VENCIMENTO</span><b>${esc(dataBR(p.vencimento))}</b></div><div class="carne-client"><span>CLIENTE</span><b>${esc(venda.cliente||'NÃO INFORMADO')}</b></div><div class="carne-value"><span>VALOR DA PARCELA</span><b>${money(p.valor)}</b></div></div><div class="carne-desc"><span>DESCRIÇÃO</span><p>PAGAMENTO REFERENTE À VENDA Nº ${esc(numero)} — PARCELA ${esc(p.parcela??i+1)} DE ${esc(p.totalParcelas??parcelas.length)}</p></div><div class="carne-obs"><span>OBSERVAÇÕES</span><div></div></div><footer><div>ASSINATURA DO RESPONSÁVEL</div><div>CARIMBO DA EMPRESA</div></footer></section>`).join('');
 const w=window.open('','_blank');if(!w)return info('LIBERE POP-UPS PARA IMPRIMIR.');
 w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>CARNÊ — VENDA ${esc(numero)}</title><style>@page{size:A4 portrait;margin:10mm}*{box-sizing:border-box}body{font:12px Arial,sans-serif;color:#182a40;margin:0}.carne-parcela{border:1px solid #aab5c2;border-radius:5px;padding:12px 16px;margin:0 0 9mm;break-inside:avoid;page-break-inside:avoid;min-height:76mm}.carne-head{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #183e6a;padding-bottom:8px}.carne-head strong{display:block;font-size:17px;color:#123d74}.carne-head small{display:block;font-size:9px;margin-top:3px}.carne-tag{font-size:11px;font-weight:bold;border:1px solid #abb9c9;padding:7px}.carne-title{text-align:center;font-weight:bold;font-size:13px;margin:10px 0}.carne-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px}.carne-grid>div{min-width:0}.carne-grid span,.carne-desc span,.carne-obs span{display:block;font-size:9px;color:#526578;font-weight:bold;margin-bottom:3px}.carne-grid b{font-size:12px}.carne-value b{font-size:17px}.carne-desc{margin-top:10px}.carne-desc p{margin:0;font-size:11px}.carne-obs{margin-top:10px}.carne-obs div{border-bottom:1px solid #b6c0cc;height:13px}footer{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:20px;text-align:center;font-size:9px}footer div{border-top:1px solid #6e7883;padding-top:5px}@media screen{body{max-width:210mm;margin:15px auto;padding:10mm;background:#fff}}@media print{body{margin:0}}</style></head><body>${cards}</body></html>`);
 w.document.close();w.focus();setTimeout(()=>w.print(),350);
}
// Integração de vendas com o Caixa: eventos compensatórios, nunca apagar histórico.
function caixaMovimentarVenda(d,acao,operadorIdentificado){
 const cs=read('erp_systems_caixas_v1',[]);
 const caixasComVenda=cs.filter(c=>(c.movimentos||[]).some(m=>String(m.ref||'').startsWith('VENDA:'+d.numero+':')&&m.categoria==='VENDA'));
 const c=acao==='BAIXAR'?cs.find(x=>x.situacao==='ABERTO'&&String(x.operador)===String(operadorIdentificado)):caixasComVenda[caixasComVenda.length-1];
 if(!c)throw Error(acao==='BAIXAR'?'ABRA O CAIXA ANTES DE BAIXAR A VENDA.':'NÃO FOI ENCONTRADO O CAIXA DA VENDA PARA ESTORNAR.');
 c.movimentos=c.movimentos||[];
 const numero=String(d.numero).padStart(6,'0');
 if(acao==='CANCELAR'){
  // Compensação apenas informativa dos carnês. Nunca representa dinheiro devolvido.
  const refPrefix='VENDA:'+d.numero+':';
  cs.forEach(caixa=>{
   caixa.movimentos=caixa.movimentos||[];
   const originais=caixa.movimentos.filter(m=>m.naoFinanceiro&&String(m.ref||'').startsWith(refPrefix)&&!m.cancelamentoInformativo);
   originais.forEach(m=>{
    const refCancel=String(m.ref)+':CANCELAMENTO-CARNE';
    if(caixa.movimentos.some(x=>x.ref===refCancel))return;
    caixa.movimentos.push({tipo:'INFORMATIVO',categoria:'CANCELAMENTO DE CARNÊ',descricao:'CANCELAMENTO DA VENDA Nº '+numero+' — CARNÊ (SOMENTE CONSULTA)',forma:'CARNÊ',formaId:m.formaId,valor:Number(m.valor)||0,ref:refCancel,refOriginal:m.ref,vendaNumero:d.numero,operador:operadorIdentificado||d.usuarioCancelamento||d.usuario||m.operador,data:stamp(),naoFinanceiro:true,cancelamentoInformativo:true});
   });
  });
 }else{
  const registros=(d.pagamentos||[]);
  registros.forEach((pag,i)=>{
   const cadastro=formas().find(f=>String(f.id)===String(pag.forma));
   const forma=String(cadastro?.tipo||cadastro?.descricao||pag.descricao||pag.forma||'').toUpperCase();
   if(/BOLETO|CARNÊ|CARNE|PRAZO/.test(forma)){
    const valor=Number(pag.valor||pag.total||0);
    if(!(valor>0))return;
    const ref='VENDA:'+d.numero+':'+i+':BOLETO-INFORMATIVO';
    if(!c.movimentos.some(m=>m.ref===ref))c.movimentos.push({tipo:'INFORMATIVO',categoria:'VENDA EM BOLETO',descricao:'VENDA Nº '+numero+' — CARNÊ (SOMENTE CONSULTA)',forma:'CARNÊ',formaId:cadastro?.id||pag.forma,valor,ref,vendaNumero:d.numero,operador:c.operador,data:stamp(),naoFinanceiro:true});
    return;
   }
   const valor=Number(pag.valor||pag.total||0);if(!(valor>0))return;
   const prefix='VENDA:'+d.numero+':'+i;
   const anteriores=c.movimentos.filter(m=>m.categoria==='VENDA'&&m.tipo==='ENTRADA'&&String(m.ref||'').startsWith(prefix+':'));
   const ativos=anteriores.reduce((a,m)=>a+Number(m.valor||0)-c.movimentos.filter(e=>e.estornoRef===m.ref).reduce((v,e)=>v+Number(e.valor||0),0),0);
   if(ativos>=valor-0.005)return;
   const ref=prefix+':'+stamp()+':'+Math.random().toString(36).slice(2,8);
   c.movimentos.push({tipo:'ENTRADA',categoria:'VENDA',descricao:'VENDA Nº '+numero,forma:forma.includes('PIX')?'PIX':forma.includes('DÉBITO')||forma.includes('DEBITO')?'CARTÃO DE DÉBITO':forma.includes('CRÉDITO')||forma.includes('CREDITO')?'CARTÃO DE CRÉDITO':forma.includes('DINHEIRO')?'DINHEIRO':forma,formaId:cadastro?.id||pag.forma,contaId:cadastro?.contaId||pag.contaId,valor:Math.round((valor-ativos)*100)/100,ref,vendaNumero:d.numero,identificacaoPagamento:String(pag.identificacaoPagamento||pag.identificacao||'').trim(),operador:c.operador,data:stamp()});
  });
 }
 save('erp_systems_caixas_v1',cs);
}
// V476: crédito histórico unitário. A promoção é da DATA DA VENDA, nunca da troca.
// Valores em centavos evitam que o rateio altere o total pago.
function llCreditoHistoricoVenda(venda){
 const itens=Array.isArray(venda.itens)?venda.itens:[];
 if(Array.isArray(venda.creditosHistoricos)&&venda.creditosHistoricos.length===itens.length)return venda.creditosHistoricos;
 const totalCent=n=>Math.round((Number(n)||0)*100);
 const bruto=itens.map(x=>Math.max(0,totalCent(x.preco)*Number(x.quantidade||0)));
 const descontoTotal=Math.max(0,totalCent(venda.desconto));
 const data=String(venda.data||'').slice(0,10);
 const pagamentos=Array.isArray(venda.pagamentos)?venda.pagamentos:[];
 const ids=pagamentos.map(x=>String(x.formaId||x.forma||''));
 let promos=[];
 try{const x=JSON.parse(localStorage.getItem('erp_matriz_promocoes_v1')||'[]');if(Array.isArray(x))promos=x}catch{}
 // O histórico de promoções preserva cadastros posteriormente alterados/excluídos.
 try{const h=JSON.parse(localStorage.getItem('erp_matriz_promocoes_historico_v1')||'[]');if(Array.isArray(h))for(const x of h){if(x.registro)promos.push(x.registro);if(x.anterior)promos.push(x.anterior)}}catch{}
 const promoCents=itens.map((item,i)=>{
  const snapshot=Array.isArray(venda.promocoesHistoricas)?venda.promocoesHistoricas[i]:null;
  if(snapshot!==undefined&&snapshot!==null)return Math.min(bruto[i],Math.max(0,totalCent(snapshot)));
  if(!ids.length||ids.some(id=>!id))return 0;
  const registros=ids.map(id=>promos.filter(r=>String(r.produto)===String(item.codigo)&&String(r.formaId)===id&&r.inicio<=data&&r.fim>=data));
  if(registros.some(a=>!a.length))return 0;
  const descontos=registros.map(a=>Math.max(...a.map(r=>Math.max(0,Math.round((String(r.tipo).toUpperCase()==='PERCENTUAL'?Number(item.preco)*Number(r.desconto)/100:Number(r.desconto))*Number(item.quantidade||0)*100)))));
  return Math.min(bruto[i],Math.min(...descontos));
 });
 // Promoção só pode ser atribuída até o desconto realmente praticado na venda.
 let restante=descontoTotal;
 const promocao=promoCents.map(v=>{const n=Math.min(v,restante);restante-=n;return n});
 const elegiveis=bruto.map((v,i)=>promocao[i]===0?v:0);
 const base=elegiveis.reduce((a,b)=>a+b,0);
 const adicionais=elegiveis.map(v=>base?Math.floor(restante*v/base):0);
 let sobra=restante-adicionais.reduce((a,b)=>a+b,0);
 const ordem=elegiveis.map((v,i)=>({i,v})).filter(x=>x.v>0).sort((a,b)=>(restante*b.v%base)-(restante*a.v%base));
 for(const x of ordem){if(sobra<=0)break;adicionais[x.i]++;sobra--}
 // Sem itens elegíveis, conservar o total com rateio residual em vez de perder desconto.
 if(sobra>0){for(let i=0;i<itens.length&&sobra>0;i++){const capacidade=bruto[i]-promocao[i]-adicionais[i];const n=Math.min(sobra,capacidade);adicionais[i]+=n;sobra-=n}}
 return itens.map((item,i)=>({codigo:item.codigo,quantidade:Number(item.quantidade)||0,precoOriginal:Number(item.preco)||0,promocao:promocao[i]/100,descontoAdicional:adicionais[i]/100,creditoTotal:Math.max(0,bruto[i]-promocao[i]-adicionais[i])/100,creditoUnitario:item.quantidade?Math.max(0,bruto[i]-promocao[i]-adicionais[i])/100/Number(item.quantidade):0}));
}
function commit(d,newStatus){verificarBoletoInativo(d.clienteId,d.pagamentos);d.creditosHistoricos=llCreditoHistoricoVenda(d);const previous=vendas.find(x=>x.numero===d.numero);if(previous&&previous.situacao!=='PENDENTE')throw Error('SOMENTE VENDAS PENDENTES PODEM SER ALTERADAS.');if(previous)updateStock(previous.situacao,'',previous.itens);updateStock('',newStatus,d.itens);d.situacao=newStatus;if(newStatus==='BAIXADA')d.estoqueBaixado=true;d.criadoEm=previous?.criadoEm||stamp();d.atualizadoEm=stamp();registrarAcao(d,previous?'ALTERAR':'GRAVAR');vendas=previous?vendas.map(x=>x.numero===d.numero?d:x):[...vendas,d];save(VK,vendas);conciliarReservasVendas();if(newStatus==='BAIXADA'){sincronizarBoletos(d);caixaMovimentarVenda(d,'BAIXAR');}atual=d.numero;$('vt-status').value=newStatus;listV()}
function saveV(close){try{if(atual)return info('VENDA JÁ GRAVADA. USE ALTERAR PARA SALVAR MUDANÇAS.');const d=validate();commit(d,close?'BAIXADA':'PENDENTE');info(close?'VENDA GRAVADA E BAIXADA.':'VENDA GRAVADA COMO PENDENTE.')}catch(e){info(e.message)}}
function editV(){try{if(!atual)return info('LOCALIZE UMA VENDA PARA ALTERAR.');const d=validate();commit(d,'PENDENTE');info('VENDA ALTERADA.')}catch(e){info(e.message)}}
async function transition(to){
 if(!atual)return info('GRAVE OU LOCALIZE UMA VENDA.');
 const d=vendas.find(x=>x.numero===atual);if(!d)return;
 if(d.situacao==='CANCELADA')return info('VENDA CANCELADA. NÃO PODE SER BAIXADA OU REABERTA.');
 if(to==='PENDENTE')return info('NÃO É PERMITIDO REABRIR VENDAS.');
 if(to==='BAIXADA'){
  if(d.situacao!=='PENDENTE')return info('SOMENTE VENDAS PENDENTES PODEM SER BAIXADAS.');
  try{verificarBoletoInativo(d.clienteId,d.pagamentos)}catch(e){return info(e.message)}
  if(typeof window.LL_identificarOperadorCaixa!=='function')return info('IDENTIFICAÇÃO DO CAIXA INDISPONÍVEL.');
  return window.LL_identificarOperadorCaixa('IDENTIFICAÇÃO PARA BAIXAR VENDA',async codigo=>{
   const caixa=read('erp_systems_caixas_v1',[]).find(c=>c.situacao==='ABERTO'&&String(c.operador)===String(codigo));
   if(!caixa)return info('ESTE USUÁRIO NÃO POSSUI CAIXA ABERTO.');
   if(!await erpConfirm('CONFIRMA BAIXAR A VENDA Nº '+String(d.numero).padStart(6,'0')+' NO CAIXA DO OPERADOR '+codigo+'?'))return;
   if(d.situacao!=='PENDENTE')return info('VENDA NÃO ESTÁ MAIS PENDENTE.');
   try{
    updateStock(d.situacao,'BAIXADA',d.itens);
    caixaMovimentarVenda(d,'BAIXAR',codigo);
    d.estoqueBaixado=true; // Confirma que houve desconto físico nesta baixa.
    try{trGerarBoletos(d)}catch(e){return info('ERRO AO GERAR BOLETOS DA TROCA: '+e.message)}
 window.LL_fixarComissaoNaBaixa?.(d);d.situacao='BAIXADA';d.operadorBaixa=codigo;d.caixaBaixa=caixa.id??caixa.numero??null;
    d.atualizadoEm=stamp();registrarAcao(d,'BAIXAR');save(VK,vendas);conciliarReservasVendas();
    sincronizarBoletos(d);$('vt-status').value='BAIXADA';listV();info('VENDA BAIXADA COM SUCESSO.');
   }catch(e){info(e.message)}
  });
 }
 if(to==='CANCELADA'){
  return autorizarCancelamento('VENDA',async (codigo,nome)=>{
  if(!await erpConfirm('CONFIRMA CANCELAR A VENDA Nº '+String(d.numero).padStart(6,'0')+'? O ESTORNO SERÁ FEITO MANUALMENTE NO CAIXA.'))return;
  if(d.situacao==='CANCELADA')return info('VENDA JÁ CANCELADA. ESTOQUE NÃO SERÁ MOVIMENTADO NOVAMENTE.');
  const anterior=d.situacao;
  // Não devolver mercadorias de baixas antigas sem comprovação do desconto físico.
  // Evita gerar 53 unidades quando só entraram 50.
  if(anterior==='BAIXADA' && d.estoqueBaixado!==true) updateStock('','CANCELADA',d.itens);
  else updateStock(anterior,'CANCELADA',d.itens);
  d.estoqueBaixado=false;
  if(anterior==='BAIXADA')caixaMovimentarVenda(d,'CANCELAR');
  d.situacao='CANCELADA';d.situacaoAntesCancelamento=anterior;d.atualizadoEm=stamp();registrarAcao(d,'CANCELAR');d.autorizacaoCancelamento={codigo,usuario:nome,data:d.atualizadoEm};d.historicoUsuario[d.historicoUsuario.length-1].autorizadoPor=nome;save(VK,vendas);conciliarReservasVendas();
  const chave='erp_matriz_operacoes_v2',base=read(chave,{}),ref='VENDA '+String(d.numero).padStart(6,'0');
  (base.receber||[]).filter(x=>x.ref===ref&&x.chaveVenda).forEach(x=>{if(!(Number(x.pago)>0)){x.situacao='CANCELADA';x.saldo=0;}});save(chave,base);
  $('vt-status').value='CANCELADA';listV();info('VENDA CANCELADA. ESTORNE O DINHEIRO MANUALMENTE EM CAIXA > ESTORNAR.');
  });
 }
}
const closeV=()=>transition('BAIXADA'),cancelV=()=>transition('CANCELADA'),reopenV=()=>transition('PENDENTE');
function loadV(n){descontoPromocionalAplicado=0;const d=vendas.find(x=>x.numero===n);if(!d)return;atual=n;itens=structuredClone(d.itens||[]);pagamentos=structuredClone(d.pagamentos||[]);$('vt-num').value=String(n).padStart(6,'0');$('vt-date').value=d.data;$('vt-client').value=d.clienteId;$('vt-seller').value=d.vendedorId;if(!$('vt-seller').value&&d.vendedorId){const label=nomeVendedorHistorico(d);$('vt-seller').add(new Option(label,String(d.vendedorId)));$('vt-seller').value=d.vendedorId}$('vt-status').value=d.situacao;$('vt-discount').value=d.desconto;$('vt-extra').value=d.acrescimo;const e=d.entrega||{};$('vt-delivery').value=e.tipo||'RETIRADA';for(const [id,key] of [['recipient','destinatario'],['phone','telefone'],['address','rua'],['number','numero'],['neighborhood','bairro'],['city','cidade'],['zip','cep'],['reference','referencia'],['driver','motorista']])$('vt-'+id).value=e[key]||'';drawV();mostrarUsuario();window.scrollTo({top:0,behavior:'smooth'})}
let filtrosV={vendedor:'',cliente:''},pesquisaVExecutada=false;
// Atualização em tempo real: preserva filtros e campos em edição; atualiza consultas já pesquisadas.
window.addEventListener('ll:remote-data',event=>{
 const keys=event.detail?.keys||[];
 if(keys.includes(VK)){
  vendas=read(VK,[]);
  if(pesquisaVExecutada)listV();
  const aberta=vendas.find(v=>v.numero===atual);
  const status=$('vt-status');
  if(aberta&&status&&status.value!==aberta.situacao){
   status.value=aberta.situacao;
   // Não recarrega o formulário: pode conter campos ainda não gravados.
  }
 }
 if(keys.includes(TK))trocas=read(TK,[]);
});
function selecionarFiltroV(tipo){
 const cli=tipo==='cliente', registros=cli?clientes().map(c=>({id:String(c.codigo??c.id),nome:c.nome??c.razao??c.descricao??'',situacao:c.situacao??'ATIVO',cpf:c.cpf??c.cnpj??''})):sellerRegistros().map(x=>({...x,id:String(x.id)}));
 const campo=$(cli?'vt-filter-client':'vt-filter-seller');
 const overlay=document.createElement('div');overlay.className='vt-consulta-picker-overlay';
 overlay.innerHTML=`<section class="vt-consulta-picker" role="dialog" aria-modal="true" aria-label="SELECIONE O ${cli?'CLIENTE':'VENDEDOR'}"><header>SELECIONE O ${cli?'CLIENTE':'VENDEDOR'}<button type="button" data-fechar aria-label="Fechar">×</button></header><div class="vt-consulta-picker-body"><div class="vt-consulta-picker-filtros"><label>PESQUISAR POR<select data-tipo><option value="nome">NOME</option><option value="codigo">CÓDIGO</option></select></label><label>TEXTO DA PESQUISA<input data-termo placeholder="DIGITE PARA PESQUISAR..." autocomplete="off"></label><button type="button" data-pesquisar>PESQUISAR</button></div><div class="vt-consulta-picker-tabela"><table><thead><tr><th>CÓDIGO</th><th>NOME DO ${cli?'CLIENTE':'VENDEDOR'}</th><th>SITUAÇÃO</th></tr></thead><tbody data-resultados><tr><td colspan="3">CLIQUE EM PESQUISAR PARA EXIBIR OS ${cli?'CLIENTES':'VENDEDORES'}.</td></tr></tbody></table></div><footer><span>DÊ DOIS CLIQUES PARA SELECIONAR.</span><button type="button" data-cancelar>CANCELAR</button></footer></div></section>`;
 document.body.appendChild(overlay);
 const termo=overlay.querySelector('[data-termo]'),tipoBusca=overlay.querySelector('[data-tipo]'),resultados=overlay.querySelector('[data-resultados]');
 const fechar=()=>{document.removeEventListener('keydown',teclas,true);overlay.remove()};
 const teclas=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();fechar()}else if(e.key==='Enter'&&document.activeElement===termo){e.preventDefault();render()}};
 function selecionar(id,nome){filtrosV[tipo]=id;campo.value=nome;fechar()}
 function render(){const q=termo.value.trim().toLocaleUpperCase('pt-BR'),campoBusca=tipoBusca.value;const encontrados=registros.filter(x=>String(campoBusca==='codigo'?x.id:x.nome).toLocaleUpperCase('pt-BR').includes(q));resultados.innerHTML='<tr data-todos><td>—</td><td>TODOS</td><td>—</td></tr>'+encontrados.map((x,i)=>`<tr data-indice="${i}"><td>${esc(x.id)}</td><td>${esc(x.nome)}</td><td>${esc(x.situacao||'ATIVO')}</td></tr>`).join('');resultados.querySelector('[data-todos]').ondblclick=()=>selecionar('','TODOS');resultados.querySelectorAll('[data-indice]').forEach(tr=>{tr.ondblclick=()=>{const x=encontrados[Number(tr.dataset.indice)];selecionar(x.id,x.nome)}})}
 overlay.querySelector('[data-pesquisar]').onclick=render;
 overlay.querySelectorAll('[data-fechar],[data-cancelar]').forEach(b=>b.onclick=fechar);
 overlay.addEventListener('click',e=>{if(e.target===overlay)fechar()});document.addEventListener('keydown',teclas,true);termo.focus();
}

function listV(executar=false){
 if(executar)pesquisaVExecutada=true;
 const alvo=$('vt-list');if(!alvo)return;
 if(!pesquisaVExecutada){alvo.innerHTML='<tr><td colspan="6">CLIQUE EM PESQUISAR PARA EXIBIR AS VENDAS.</td></tr>';return}
 const inicio=$('vt-filter-start').value,fim=$('vt-filter-end').value,situacao=$('vt-filter-status').value;
 const normalizarData=v=>{const t=String(v||'');if(/^\d{4}-\d{2}-\d{2}/.test(t))return t.slice(0,10);const m=t.match(/^(\d{2})\/(\d{2})\/(\d{4})/);return m?`${m[3]}-${m[2]}-${m[1]}`:t};
 const encontrados=vendas.filter(d=>{const data=normalizarData(d.data);return (!inicio||data>=inicio)&&(!fim||data<=fim)&&(!filtrosV.cliente||String(d.clienteId)===filtrosV.cliente)&&(!filtrosV.vendedor||String(d.vendedorId)===filtrosV.vendedor)&&(situacao==='TODAS'||d.situacao===situacao)}).sort((a,b)=>b.numero-a.numero);
 alvo.innerHTML=encontrados.map(d=>`<tr data-id="${d.numero}"><td>${String(d.numero).padStart(6,'0')}</td><td>${esc(d.data)}</td><td>${esc(d.cliente)}</td><td>${esc(nomeVendedorHistorico(d))}</td><td>${esc(d.situacao)}</td><td>${money(d.total)}</td></tr>`).join('')||'<tr><td colspan="6">NENHUMA VENDA ENCONTRADA.</td></tr>';
 alvo.querySelectorAll('[data-id]').forEach(r=>r.ondblclick=()=>loadV(+r.dataset.id));
}
function atalhosVendas(){
 const antigo=document.getElementById('vt-atalhos-vendas');if(antigo){antigo.remove();return}
 const fundo=document.createElement('div');fundo.id='vt-atalhos-vendas';fundo.className='vt-shortcuts-back';
 fundo.innerHTML=`<section class="vt-shortcuts-dialog" role="dialog" aria-modal="true" aria-label="Atalhos de Vendas"><header>⌂ ATALHOS — ▣ VENDAS <button type="button" data-close aria-label="Fechar">×</button></header><div class="vt-shortcuts-list"><div><kbd>F1</kbd><span>Abrir esta janela de atalhos</span></div><div><kbd>F12</kbd><span>Localizar venda pelo número</span></div><div><kbd>F2</kbd><span>Baixar venda</span></div><div><kbd>F3</kbd><span>Cancelar venda</span></div></div><footer><button type="button" data-close>FECHAR</button></footer></section>`;
 document.body.appendChild(fundo);
 const key=e=>{if(e.key==='Escape'||e.key==='F1'){e.preventDefault();e.stopImmediatePropagation();fechar()}};
 function fechar(){document.removeEventListener('keydown',key,true);fundo.remove()}
 fundo.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',fechar));
 fundo.addEventListener('click',e=>{if(e.target===fundo)fechar()});
 document.addEventListener('keydown',key,true);
}
function atalhosTrocas(){
 const antigo=document.getElementById('tr-atalhos-modal');if(antigo){antigo.remove();return}
 const fundo=document.createElement('div');fundo.id='tr-atalhos-modal';fundo.className='vt-shortcuts-back';
 fundo.innerHTML=`<section class="vt-shortcuts-dialog" role="dialog" aria-modal="true" aria-label="Atalhos de Trocas"><header>⌂ ATALHOS — ▣ TROCAS <button type="button" data-close aria-label="Fechar">×</button></header><div class="vt-shortcuts-list"><div><kbd>F1</kbd><span>Abrir esta janela de atalhos</span></div><div><kbd>F12</kbd><span>Localizar troca pelo número</span></div><div><kbd>F2</kbd><span>Baixar troca</span></div><div><kbd>F3</kbd><span>Cancelar troca</span></div></div><footer><button type="button" data-close>FECHAR</button></footer></section>`;
 document.body.appendChild(fundo);
 const key=e=>{if(e.key==='Escape'||e.key==='F1'){e.preventDefault();e.stopImmediatePropagation();fechar()}};
 function fechar(){document.removeEventListener('keydown',key,true);fundo.remove()}
 fundo.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',fechar));
 fundo.addEventListener('click',e=>{if(e.target===fundo)fechar()});
 document.addEventListener('keydown',key,true);
}
function findV(){
 const anterior=document.getElementById('vt-localizar-venda-f12');if(anterior){anterior.querySelector('input')?.focus();return}
 const fundo=document.createElement('div');fundo.id='vt-localizar-venda-f12';fundo.className='vt-modal-back vt-venda-f12-back';
 fundo.innerHTML=`<section class="vt-venda-f12" role="dialog" aria-modal="true" aria-label="Localizar venda — F12"><header>▣ LOCALIZAR VENDA — F12 <button type="button" data-fechar aria-label="Fechar">×</button></header><div class="vt-venda-f12-corpo"><p>Informe o número da venda.</p><label for="vt-modal-num">NÚMERO DA VENDA</label><input id="vt-modal-num" type="text" inputmode="numeric" autocomplete="off" placeholder="DIGITE O NÚMERO..."><div class="vt-venda-f12-erro" role="alert" aria-live="polite"></div></div><footer><button type="button" data-localizar>LOCALIZAR</button><button type="button" data-cancelar>CANCELAR</button></footer></section>`;
 document.body.append(fundo);
 const campo=fundo.querySelector('#vt-modal-num'),erro=fundo.querySelector('.vt-venda-f12-erro');
 function fechar(){document.removeEventListener('keydown',tecla,true);fundo.remove()}
 function localizar(){const texto=campo.value.trim();if(!/^[1-9]\d*$/.test(texto)){erro.textContent='INFORME UM NÚMERO DE VENDA VÁLIDO.';campo.focus();return}const numero=Number(texto);if(!vendas.some(v=>Number(v.numero)===numero)){erro.textContent='VENDA NÃO ENCONTRADA.';campo.focus();return}fechar();loadV(numero)}
 function tecla(e){if(e.key==='Escape'||e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();if(e.key==='Escape')fechar();else localizar()}}
 fundo.querySelector('[data-fechar]').onclick=fechar;fundo.querySelector('[data-cancelar]').onclick=fechar;fundo.querySelector('[data-localizar]').onclick=localizar;
 campo.addEventListener('input',()=>{erro.textContent=''});document.addEventListener('keydown',tecla,true);campo.focus();
}
function printHtml(title,body){selecionarImpressao(f=>{const size=f==='2'?'80mm':f==='3'?'58mm':'A4',w=window.open('','_blank');if(!w)return info('LIBERE POP-UPS PARA IMPRIMIR.');w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>@page{size:${size};margin:${size==='A4'?'12mm':'3mm'}}body{font:12px Arial;color:#111}h1{font-size:19px;color:#123d74}table{width:100%;border-collapse:collapse}td,th{padding:5px;border-bottom:1px solid #ccc;text-align:left;overflow-wrap:anywhere}p{line-height:1.5}</style></head><body><h1>LUCAS LIMA — ${esc(title)}</h1>${body}</body></html>`);w.document.close();w.focus();setTimeout(()=>w.print(),300)})}
function printV(rom){
 const d=vendas.find(x=>x.numero===atual);
 if(!d)return info('GRAVE OU LOCALIZE A VENDA ANTES DE IMPRIMIR.');
 if(rom&&!d.romaneioGravado)return info('GRAVE O ROMANEIO ANTES DE IMPRIMIR.');
 const e=d.entrega||{},cl=clientes().find(c=>String(c.codigo??c.id)===String(d.clienteId))||{};
 const loja=read('erp_matriz_lojas_v1',{}), lojaAtual=Array.isArray(loja)?loja[0]:(loja.lojas||[])[0]||{};
 const nomeLoja=lojaAtual.razaoSocial||lojaAtual.nomeFantasia||lojaAtual.nome||document.querySelector('.top-store')?.textContent?.trim()||'LUCAS LIMA';
 const clienteNome=d.cliente||cl.nome||cl.razao||'';
 const linha=(rotulo,valor)=>valor?`<div class="detail"><b>${rotulo}:</b> ${esc(valor)}</div>`:'';
 const endereco=[cl.endereco||cl.rua,cl.numero,cl.bairro,cl.cidade,cl.uf,cl.cep].filter(Boolean).join(', ');
 const enderecoEntrega=[e.rua||e.endereco,e.numero,e.bairro,e.cidade,e.cep].filter(Boolean).join(', ');
 const dataBr=x=>{if(!x)return '';const v=String(x);return /^\d{4}-\d{2}-\d{2}/.test(v)?v.slice(8,10)+'/'+v.slice(5,7)+'/'+v.slice(0,4):v};
 const header=`<header class="receipt-head"><h1>${esc(nomeLoja)}</h1><div>${esc(lojaAtual.cnpj||'')}</div>${linha('ENDEREÇO',[lojaAtual.endereco||lojaAtual.rua,lojaAtual.numero,lojaAtual.bairro,lojaAtual.cidade].filter(Boolean).join(', '))}${linha('TELEFONE',lojaAtual.telefone||lojaAtual.fone)}</header>`;
 const headSale=`<div class="receipt-section"><h2>${rom?'ROMANEIO DE ENTREGA':'COMPROVANTE DE VENDA'}</h2>${linha('NÚMERO',String(d.numero).padStart(6,'0'))}${linha('DATA',dataBr(d.data))}${linha('SITUAÇÃO',d.situacao)}${linha('VENDEDOR',d.vendedor)}</div>`;
 const client=`<div class="receipt-section"><h2>DADOS DO CLIENTE</h2>${linha('CÓDIGO',cl.codigo??cl.id)}${linha('CLIENTE',clienteNome)}${linha('CPF/CNPJ',cl.cpf||cl.cnpj)}${linha('TELEFONE',cl.telefone||cl.celular||cl.whatsapp)}${linha('ENDEREÇO',endereco)}</div>`;
 const products=`<div class="receipt-section"><h2>PRODUTOS</h2><table><thead><tr><th>CÓD.</th><th>DESCRIÇÃO</th><th>QTD.</th>${rom?'':'<th>UNIT.</th>'}<th>${rom?'TOTAL':'TOTAL'}</th></tr></thead><tbody>${(d.itens||[]).map(x=>`<tr><td>${esc(x.codigo)}</td><td>${esc(x.descricao)}</td><td class="num">${esc(x.quantidade)}</td>${rom?'':`<td class="num">${money(x.preco)}</td>`}<td class="num">${money(x.quantidade*x.preco)}</td></tr>`).join('')}</tbody></table></div>`;
 const payments=`<div class="receipt-section"><h2>RESUMO DA VENDA</h2>${linha('BRUTO',money(d.bruto))}${linha('DESCONTO',money(d.desconto))}${linha('ACRÉSCIMO',money(d.acrescimo))}<div class="total">TOTAL A PAGAR: ${money(d.total)}</div>${linha('PAGAMENTOS INFORMADOS',money(d.pago))}${linha('SALDO',money(d.saldo))}<h2>PAGAMENTOS</h2>${(d.pagamentos||[]).map(x=>`<div class="payment">${esc(x.descricao||x.forma||'PAGAMENTO')} — ${money(x.valor)}${Number(x.parcelas)>1?' — '+esc(x.parcelas)+' PARCELAS':''}${x.vencimento?' — VENC.: '+esc(dataBr(x.vencimento)):''}${x.identificacaoPagamento?' — IDENTIFICAÇÃO: '+esc(x.identificacaoPagamento):''}</div>`).join('')||'<p>NENHUM PAGAMENTO INFORMADO</p>'}</div>`;
 const delivery=`<div class="receipt-section"><h2>DADOS DA ENTREGA</h2>${linha('TIPO',e.tipo==='RETIRADA'?'RETIRADA NA LOJA':e.tipo)}${linha('DESTINATÁRIO',e.destinatario||clienteNome)}${linha('TELEFONE',e.telefone)}${linha('ENDEREÇO',enderecoEntrega)}${linha('REFERÊNCIA',e.referencia)}${linha('MOTORISTA',e.motorista)}</div>`;
 const termo=`<div class="receipt-section receipt-term"><h2>T E R M O &nbsp; D E &nbsp; R E C E B I M E N T O</h2><p>RECEBI OS PRODUTOS REFERENTES À VENDA Nº ${esc(d.numero)}, CONFERI AS QUANTIDADES E AS CONDIÇÕES DOS ITENS ENTREGUES.</p><div class="signature">DATA: ______/______/________</div><div class="signature">ASSINATURA DO RECEBEDOR: ______________________________</div><div class="signature">NOME: ____________________________________________</div><div class="signature">ENTREGADOR: ${esc(e.motorista||'____________________________')}</div></div>`;
 const body=header+headSale+(rom?products+client+delivery+`<div class="total">TOTAL DA VENDA: ${money(d.total)}</div>`+termo:client+products+payments);
 if(rom){
  const numero=String(d.numero).padStart(6,'0');
  const agora=new Date().toLocaleDateString('pt-BR');
  const usuario=typeof usuarioAtual==='function'?usuarioAtual():'';
  const cpf=cl.cpf||cl.cnpj||cl.cpfCnpj||cl.documento||'';
  const tipo=e.tipo==='RETIRADA'?'RETIRADA NA LOJA':e.tipo==='OUTRO'?'NOVO ENDEREÇO':'ENDEREÇO DO CLIENTE';
  const enderecoRom=e.tipo==='RETIRADA'?'RETIRADA NA LOJA':(enderecoEntrega||endereco);
  const linhaBob=(k,v)=>`<div class="linha"><b>${esc(k)}:</b> ${esc(String(v??'—'))}</div>`;
  // O romaneio usa as mesmas trocas baixadas que o comprovante de venda.
  // Consultar a fonte persistida evita depender de cópias antigas na venda.
  const trocasFonte=read(TK,[]);
  const trocasDoRomaneio=new Map();
  for(const t of (Array.isArray(d.trocasAplicadas)?d.trocasAplicadas:[])){
   if(String(t.situacao||'').toUpperCase()==='BAIXADA')trocasDoRomaneio.set(String(t.numero),t);
  }
  for(const t of (Array.isArray(trocasFonte)?trocasFonte:[])){
   if(String(t.venda)===String(d.numero)&&String(t.situacao||'').toUpperCase()==='BAIXADA')trocasDoRomaneio.set(String(t.numero),t);
  }
  const trocasRom=[...trocasDoRomaneio.values()];
  const quantidadesDevolvidas=new Map();
  for(const t of trocasRom)for(const x of (t.devolvidos||[])){
   const i=Number(x.indice);
   if(Number.isInteger(i)&&i>=0&&i<(d.itens||[]).length)
    quantidadesDevolvidas.set(i,(quantidadesDevolvidas.get(i)||0)+(Number(x.quantidade)||0));
  }
  const itemRom=(x,qtd,etiqueta)=>`<div class="item${etiqueta==='TROCA'?' item-troca':''}"><b>${esc(x.codigo||'')} — ${esc(x.descricao||'')}${etiqueta?' — '+esc(etiqueta):''}</b><div class="valores">${esc(qtd)} × ${money(x.preco)} <b>${money((Number(qtd)||0)*(Number(x.preco)||0))}</b></div></div>`;
  const itensBob=(d.itens||[]).map((x,i)=>{
   const qtd=Math.max(0,Number(x.quantidade)||0);
   const devolvida=Math.max(0,Math.min(qtd,quantidadesDevolvidas.get(i)||0));
   return (qtd>devolvida?itemRom(x,qtd-devolvida,''):'')+(devolvida?itemRom(x,devolvida,'TROCA'):'');
  }).join('')+trocasRom.flatMap(t=>(t.novos||[]).map(x=>itemRom(x,Number(x.quantidade)||0,'NOVO — TROCA Nº '+t.numero))).join('');
  const detalhesTrocaRom=trocasRom.map(t=>`<div class="item"><b>TROCA Nº ${esc(t.numero||'—')}</b><div>DEVOLVIDOS: ${money(t.valorDevolvido??0)} | NOVOS: ${money(t.valorNovo??0)}</div><div>DIFERENÇA: ${money(t.diferenca??0)}</div></div>`).join('');
  const diferencaTrocasRom=trocasRom.reduce((s,t)=>s+(Number(t.diferenca)||0),0);
  const totalAtualRom=(Number(d.total)||0)+diferencaTrocasRom;

  const corpoBob=`<div class="loja">${esc(nomeLoja)}</div><div class="titulo">ROMANEIO DE ENTREGA</div><section>${linhaBob('VENDA Nº',numero)}${linhaBob('DATA',dataBr(d.data))}${linhaBob('CLIENTE',clienteNome)}${cpf?linhaBob('CPF/CNPJ',cpf):''}${linhaBob('VENDEDOR',d.vendedor||'—')}</section><section><h2>DADOS DA ENTREGA</h2>${linhaBob('TIPO',tipo)}${linhaBob('DESTINATÁRIO',e.destinatario||clienteNome)}${linhaBob('TELEFONE',e.telefone||cl.telefone||cl.celular||'—')}${linhaBob('ENDEREÇO',enderecoRom)}${e.referencia?linhaBob('REFERÊNCIA',e.referencia):''}${linhaBob('MOTORISTA',e.motorista||'—')}</section><section><h2>PRODUTOS</h2>${itensBob}</section>${trocasRom.length?`<section><h2>TROCAS BAIXADAS</h2>${detalhesTrocaRom}</section>`:''}<section>${linhaBob('BRUTO',money(d.bruto))}${linhaBob('DESCONTO',money(d.desconto))}${linhaBob('ACRÉSCIMO',money(d.acrescimo))}<div class="destaque">TOTAL DA VENDA: ${money(d.total)}</div>${trocasRom.length?`<div class="destaque">TOTAL APÓS TROCAS: ${money(totalAtualRom)}</div>`:''}</section><section><h2>DECLARAÇÃO DE RECEBIMENTO</h2><p>Confirmo que recebi as mercadorias relacionadas neste romaneio, nas quantidades e condições informadas.</p><div class="assinatura">RECEBIDO POR: __________________________________</div><div class="assinatura">DATA: ____/____/________</div></section><footer>EMITIDO EM ${esc(agora)}, POR ${esc(usuario)}.</footer>`;
  const cssBob=largura=>`@page{size:${largura}mm auto;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#111}body{width:${largura}mm;max-width:${largura}mm;padding:1.5mm 1.5mm 3mm;font:${largura===40?8:largura===56?9:10}px/1.3 Arial,sans-serif;overflow-wrap:anywhere}.loja,.titulo{text-align:center;font-weight:bold}.titulo{margin:5px 0}section{border-top:1px dashed #444;padding:5px 0;break-inside:avoid}h2{font-size:9px;margin:0 0 4px}.linha{margin:3px 0}.item{margin:5px 0}.item-troca{background:#d0d0d0!important;color:#000!important;-webkit-print-color-adjust:exact;print-color-adjust:exact;border-left:2px solid #555;padding:5px 4px}.item-troca .valores{font-weight:700}.valores{display:flex;justify-content:space-between;gap:3px;margin-top:2px}.destaque{font-weight:bold;border-top:1px solid #333;padding-top:4px;margin-top:5px}.assinatura{margin-top:18px;min-height:14px}footer{border-top:1px dashed #444;text-align:center;font-size:7px;padding-top:6px}`;
  const documento=largura=>`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>ROMANEIO ${numero}</title><style>${cssBob(largura)}</style></head><body>${corpoBob}</body></html>`;
  document.getElementById('ll-romaneio-preview')?.remove();
  const fundo=document.createElement('div');fundo.id='ll-romaneio-preview';fundo.style.cssText='position:fixed;inset:0;z-index:2147483600;background:#001b3cbb;display:flex;align-items:center;justify-content:center;padding:18px;font-family:Arial,sans-serif';
  fundo.innerHTML=`<div role="dialog" aria-modal="true" aria-label="IMPRIMIR ROMANEIO" style="width:min(1100px,96vw);height:min(720px,92vh);background:#fff;border-radius:10px;display:flex;flex-direction:column;overflow:hidden"><header style="background:#194b88;color:white;padding:18px 22px;display:flex;justify-content:space-between;align-items:center;font-weight:bold">IMPRIMIR ROMANEIO <button data-fechar style="border:0;background:transparent;color:white;font-size:24px;cursor:pointer">×</button></header><div style="display:grid;grid-template-columns:minmax(200px,1fr) minmax(260px,1.25fr);gap:16px;padding:16px;flex:1;min-height:0;overflow:auto"><div style="border:1px solid #cbd9ec;border-radius:6px;padding:14px"><div style="background:#e5effb;padding:12px;color:#194b88;font-weight:bold;font-size:13px">DADOS DO ROMANEIO</div><p><b>VENDA Nº:</b> ${numero}</p><p><b>CLIENTE:</b> ${esc(clienteNome)}</p>${cpf?`<p><b>CPF/CNPJ:</b> ${esc(cpf)}</p>`:''}<p><b>VENDEDOR:</b> ${esc(d.vendedor||'—')}</p><p><b>SITUAÇÃO:</b> ${esc(d.situacao||'PENDENTE')}</p><div style="background:#e5effb;padding:12px;color:#194b88;font-weight:bold;font-size:13px">FORMATO DA IMPRESSÃO</div><p style="font-size:13px;color:#52677f">SELECIONE A LARGURA DA BOBINA:</p><div style="display:flex;gap:8px;flex-wrap:wrap">${[40,56,80].map(mm=>`<label style="padding:9px 12px;border:1px solid #b5cbe6;border-radius:5px;cursor:pointer;font-weight:bold"><input type="radio" name="largura-romaneio" value="${mm}" ${mm===80?'checked':''}> ${mm} MM</label>`).join('')}</div><p style="font-size:13px;color:#52677f">Comprimento automático conforme o conteúdo.</p></div><div style="border:1px solid #cbd9ec;border-radius:6px;padding:14px;display:flex;flex-direction:column;min-height:350px"><div style="background:#e5effb;padding:12px;color:#194b88;font-weight:bold;font-size:13px">PRÉ-VISUALIZAÇÃO — BOBINA <span data-largura-label>80</span> MM</div><div style="flex:1;overflow:auto;background:#f1f4f8;display:flex;justify-content:center;align-items:flex-start;padding:16px"><iframe title="Pré-visualização do romaneio" style="width:80mm;min-width:80mm;height:100%;min-height:350px;background:#fff;border:1px solid #ccd5df;box-shadow:0 2px 8px #0002" sandbox="allow-same-origin allow-modals"></iframe></div></div></div><div style="border-top:1px solid #dce4ef;padding:12px 18px;display:flex;justify-content:flex-end;gap:10px"><button data-imprimir style="background:#1961cb;color:#fff;border:0;border-radius:5px;padding:12px 23px;cursor:pointer;font-weight:bold">IMPRIMIR</button><button data-salvar style="background:#009d79;color:#fff;border:0;border-radius:5px;padding:12px 23px;cursor:pointer;font-weight:bold">SALVAR</button><button data-fechar style="background:#e5effb;color:#174576;border:1px solid #b5cbe6;border-radius:5px;padding:12px 23px;cursor:pointer">FECHAR</button></div></div>`;
  document.body.appendChild(fundo);
  const iframe=fundo.querySelector('iframe');let largura=80;
  const atualizar=()=>{iframe.style.width=largura+'mm';iframe.style.minWidth=largura+'mm';iframe.srcdoc=documento(largura);fundo.querySelector('[data-largura-label]').textContent=largura};
  fundo.querySelectorAll('input[name="largura-romaneio"]').forEach(r=>r.onchange=()=>{largura=Number(r.value);atualizar()});atualizar();
  fundo.querySelectorAll('[data-fechar]').forEach(b=>b.onclick=()=>fundo.remove());
  fundo.querySelector('[data-imprimir]').onclick=()=>{try{iframe.contentWindow.focus();iframe.contentWindow.print()}catch(e){info('NÃO FOI POSSÍVEL IMPRIMIR: '+e.message)}};
  fundo.querySelector('[data-salvar]').onclick=async()=>{try{await window.LucasTrocaSalvarPDF(documento(largura),`ROMANEIO_${numero}_${largura}MM.pdf`)}catch(e){info('NÃO FOI POSSÍVEL SALVAR O PDF: '+e.message)}};
  return;
 }
 if(!rom){
  const numero=String(d.numero).padStart(6,'0');
  const agora=new Date().toLocaleDateString('pt-BR');
  const usuario=typeof usuarioAtual==='function'?usuarioAtual():'';
  const cpf=cl.cpf||cl.cnpj||cl.cpfCnpj||cl.documento||'';
  const linhaBob=(k,v)=>`<div class="linha"><b>${esc(k)}:</b> ${esc(String(v??'—'))}</div>`;
  // A impressão consulta as trocas efetivamente baixadas na fonte de dados,
  // pois vendas antigas podem ter uma cópia incompleta em trocasAplicadas.
  const trocasVinculadas=(Array.isArray(trocas)?trocas:read(TK,[]))
    .filter(t=>String(t.venda)===String(d.numero)&&String(t.situacao||'').toUpperCase()==='BAIXADA');
  const trocasHistorico=(Array.isArray(d.trocasAplicadas)?d.trocasAplicadas:[])
    .filter(t=>String(t.situacao||'').toUpperCase()==='BAIXADA');
  const mapaTrocas=new Map();
  for(const t of trocasHistorico)mapaTrocas.set(String(t.numero),t);
  for(const t of trocasVinculadas)mapaTrocas.set(String(t.numero),t);
  const trocasImpressao=[...mapaTrocas.values()];
  const devolvidas=new Map();
  for(const t of trocasImpressao)for(const x of (t.devolvidos||[])){
    const indice=Number(x.indice);
    if(!Number.isInteger(indice)||indice<0||indice>=(d.itens||[]).length)continue;
    devolvidas.set(indice,(devolvidas.get(indice)||0)+(Number(x.quantidade)||0));
  }
  const linhaItem=(x,qtd,tipo)=>`<div class="item ${tipo==='TROCA'?'item-troca':''}"><div class="item-descricao">${esc(x.codigo||'')} — ${esc(x.descricao||'')} <strong class="item-tipo">${tipo}</strong></div><div class="valores">${esc(qtd)} × ${money(x.preco)} <b>${money((Number(qtd)||0)*(Number(x.preco)||0))}</b></div></div>`;
  const itensBob=(d.itens||[]).map((x,i)=>{
    const qtd=Math.max(0,Number(x.quantidade)||0);
    const devolvida=Math.max(0,Math.min(qtd,devolvidas.get(i)||0));
    return (qtd>devolvida?linhaItem(x,qtd-devolvida,'NORMAL'):'')+(devolvida?linhaItem(x,devolvida,'TROCA'):'');
  }).join('')+trocasImpressao.flatMap(t=>(t.novos||[]).map(x=>linhaItem(x,Number(x.quantidade)||0,'NOVO'))).join('');
  const pagamentosOriginais=Array.isArray(d.pagamentos)?d.pagamentos:[];
  const pagamentosTrocas=trocasImpressao.flatMap(t=>(t.pagamentos||[]).map(p=>({...p,numeroTroca:t.numero})));
  const pagamentosBob=[...pagamentosOriginais.map(x=>({...x,numeroTroca:null})),...pagamentosTrocas]
    .map(x=>`<div class="item">${x.numeroTroca?'TROCA '+esc(x.numeroTroca)+' — ':''}${esc(x.descricao||x.forma||'PAGAMENTO')} — ${money(x.valor)}${Number(x.parcelas)>1?' — '+esc(x.parcelas)+' PARCELAS':''}</div>`)
    .join('')||'<div>NENHUM PAGAMENTO INFORMADO</div>';
  const detalhesTrocas=trocasImpressao.map(t=>`<div class="item"><b>TROCA Nº ${esc(t.numero||'—')}</b> — DEVOLVIDOS: ${money(t.valorDevolvido??(t.devolvidos||[]).reduce((a,x)=>a+(Number(x.quantidade)||0)*(Number(x.preco)||0),0))} — NOVOS: ${money(t.valorNovo??(t.novos||[]).reduce((a,x)=>a+(Number(x.quantidade)||0)*(Number(x.preco)||0),0))} — DIFERENÇA: ${money(t.diferenca||0)}</div>`).join('');
  const totalAdicional=trocasImpressao.reduce((a,t)=>a+(Number(t.totalAcerto)||0),0);
  const totalComTrocas=(Number(d.total)||0)+totalAdicional;
  const corpoBob=`<div class="loja">${esc(nomeLoja)}</div><div class="titulo">COMPROVANTE DE VENDA</div><section>${linhaBob('VENDA Nº',numero)}${linhaBob('DATA',dataBr(d.data))}${linhaBob('CLIENTE',clienteNome)}${cpf?linhaBob('CPF/CNPJ',cpf):''}${linhaBob('VENDEDOR',d.vendedor||'—')}</section><section><h2>PRODUTOS</h2>${itensBob}</section><section>${linhaBob('BRUTO',money(d.bruto))}${linhaBob('DESCONTO',money(d.desconto))}${linhaBob('ACRÉSCIMO',money(d.acrescimo))}<div class="destaque">TOTAL DA VENDA: ${money(d.total)}</div>${trocasImpressao.length?`<div class="destaque">TOTAL COM ACERTOS DE TROCAS: ${money(totalComTrocas)}</div>`:''}</section>${trocasImpressao.length?`<section><h2>TROCAS BAIXADAS</h2>${detalhesTrocas}</section>`:''}<section><h2>PAGAMENTOS</h2>${pagamentosBob}</section><section>${linhaBob('SITUAÇÃO',d.situacao)}</section><footer>EMITIDO EM ${esc(agora)}, POR ${esc(usuario)}.</footer>`;
  const cssBob=largura=>`@page{size:${largura}mm auto;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#111}body{width:${largura}mm;max-width:${largura}mm;padding:1.5mm 1.5mm 3mm;font:${largura===40?8:largura===56?9:10}px/1.3 Arial,sans-serif;overflow-wrap:anywhere}.loja,.titulo{text-align:center;font-weight:bold}.titulo{margin:5px 0}section{border-top:1px dashed #444;padding:5px 0;break-inside:avoid}h2{font-size:9px;margin:0 0 4px}.linha{margin:3px 0}.item{margin:5px 0;padding:3px 2px;break-inside:avoid}.item-troca{background:#d0d0d0!important;color:#000!important;-webkit-print-color-adjust:exact;print-color-adjust:exact;border-left:2px solid #555;padding:5px 4px}.item-troca .item-descricao,.item-troca .valores{font-weight:700}.item-tipo{font-weight:700;white-space:nowrap}.valores{display:flex;justify-content:space-between;gap:3px;margin-top:2px}.destaque{font-weight:bold;border-top:1px solid #333;padding-top:4px;margin-top:5px}footer{border-top:1px dashed #444;text-align:center;font-size:7px;padding-top:6px}`;
  const documento=largura=>`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>VENDA ${numero}</title><style>${cssBob(largura)}</style></head><body>${corpoBob}</body></html>`;
  document.getElementById('ll-venda-preview')?.remove();
  const fundo=document.createElement('div');fundo.id='ll-venda-preview';fundo.style.cssText='position:fixed;inset:0;z-index:2147483600;background:#001b3cbb;display:flex;align-items:center;justify-content:center;padding:18px;font-family:Arial,sans-serif';
  fundo.innerHTML=`<div role="dialog" aria-modal="true" aria-label="IMPRIMIR VENDA" style="width:min(1100px,96vw);height:min(720px,92vh);background:#fff;border-radius:10px;display:flex;flex-direction:column;overflow:hidden"><header style="background:#194b88;color:white;padding:18px 22px;display:flex;justify-content:space-between;align-items:center;font-weight:bold">IMPRIMIR VENDA <button data-fechar style="border:0;background:transparent;color:white;font-size:24px;cursor:pointer">×</button></header><div style="display:grid;grid-template-columns:minmax(200px,1fr) minmax(260px,1.25fr);gap:16px;padding:16px;flex:1;min-height:0;overflow:auto"><div style="border:1px solid #cbd9ec;border-radius:6px;padding:14px"><div style="background:#e5effb;padding:12px;color:#194b88;font-weight:bold;font-size:13px">DADOS DA VENDA</div><p><b>VENDA Nº:</b> ${numero}</p><p><b>CLIENTE:</b> ${esc(clienteNome)}</p>${cpf?`<p><b>CPF/CNPJ:</b> ${esc(cpf)}</p>`:''}<p><b>VENDEDOR:</b> ${esc(d.vendedor||'—')}</p><p><b>SITUAÇÃO:</b> ${esc(d.situacao||'PENDENTE')}</p><div style="background:#e5effb;padding:12px;color:#194b88;font-weight:bold;font-size:13px">FORMATO DA IMPRESSÃO</div><p style="font-size:13px;color:#52677f">SELECIONE A LARGURA DA BOBINA:</p><div style="display:flex;gap:8px;flex-wrap:wrap">${[40,56,80].map(mm=>`<label style="padding:9px 12px;border:1px solid #b5cbe6;border-radius:5px;cursor:pointer;font-weight:bold"><input type="radio" name="largura-venda" value="${mm}" ${mm===80?'checked':''}> ${mm} MM</label>`).join('')}</div><p style="font-size:13px;color:#52677f">Comprimento automático conforme o conteúdo.</p></div><div style="border:1px solid #cbd9ec;border-radius:6px;padding:14px;display:flex;flex-direction:column;min-height:350px"><div style="background:#e5effb;padding:12px;color:#194b88;font-weight:bold;font-size:13px">PRÉ-VISUALIZAÇÃO — BOBINA <span data-largura-label>80</span> MM</div><div style="flex:1;overflow:auto;background:#f1f4f8;display:flex;justify-content:center;align-items:flex-start;padding:16px"><iframe title="Pré-visualização da venda" style="width:80mm;min-width:80mm;height:100%;min-height:350px;background:#fff;border:1px solid #ccd5df;box-shadow:0 2px 8px #0002" sandbox="allow-same-origin allow-modals"></iframe></div></div></div><div style="border-top:1px solid #dce4ef;padding:12px 18px;display:flex;justify-content:flex-end;gap:10px"><button data-imprimir style="background:#1961cb;color:#fff;border:0;border-radius:5px;padding:12px 23px;cursor:pointer;font-weight:bold">IMPRIMIR</button><button data-salvar style="background:#009d79;color:#fff;border:0;border-radius:5px;padding:12px 23px;cursor:pointer;font-weight:bold">SALVAR</button><button data-fechar style="background:#e5effb;color:#174576;border:1px solid #b5cbe6;border-radius:5px;padding:12px 23px;cursor:pointer">FECHAR</button></div></div>`;
  document.body.appendChild(fundo);
  const iframe=fundo.querySelector('iframe');let largura=80;
  const atualizar=()=>{iframe.style.width=largura+'mm';iframe.style.minWidth=largura+'mm';iframe.srcdoc=documento(largura);fundo.querySelector('[data-largura-label]').textContent=largura};
  fundo.querySelectorAll('input[name="largura-venda"]').forEach(r=>r.onchange=()=>{largura=Number(r.value);atualizar()});atualizar();
  fundo.querySelectorAll('[data-fechar]').forEach(b=>b.onclick=()=>fundo.remove());
  fundo.querySelector('[data-imprimir]').onclick=()=>{try{iframe.contentWindow.focus();iframe.contentWindow.print()}catch(e){info('NÃO FOI POSSÍVEL IMPRIMIR: '+e.message)}};
  fundo.querySelector('[data-salvar]').onclick=async()=>{try{await window.LucasTrocaSalvarPDF(documento(largura),`VENDA_${numero}_${largura}MM.pdf`)}catch(e){info('NÃO FOI POSSÍVEL SALVAR O PDF: '+e.message)}};
  return;
 }
 selecionarImpressao(formato=>{
  const largura=formato==='2'?'80mm':formato==='3'?'58mm':'A4';
  const bobina=largura!=='A4';
  const css=`@page{size:${largura};margin:${bobina?'2mm':'12mm'}}*{box-sizing:border-box}body{margin:0;color:#111;font-family:${bobina?'"Courier New",monospace':'Arial,sans-serif'};font-size:${largura==='58mm'?'9px':bobina?'10px':'12px'};line-height:1.35}h1{font-size:${bobina?'14px':'19px'};margin:0 0 5px;text-align:center}h2{font-size:${bobina?'11px':'13px'};margin:0 0 7px;text-align:${bobina?'center':'left'}}.receipt-head{text-align:center;padding-bottom:9px}.receipt-section{border-top:1px dashed #555;padding:9px 0;break-inside:avoid}.detail{margin:3px 0;overflow-wrap:anywhere}table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:inherit}th,td{padding:${bobina?'3px 1px':'5px 3px'};text-align:left;vertical-align:top;overflow-wrap:anywhere;border:0;border-bottom:1px dotted #aaa}.num{text-align:right}.total{font-weight:bold;text-align:right;margin:9px 0}.payment{padding:3px 0}.receipt-term p{text-align:justify}.signature{margin-top:22px;overflow-wrap:anywhere}${bobina?'th:nth-child(1),td:nth-child(1){width:14%}th:nth-child(3),td:nth-child(3){width:12%}th:last-child,td:last-child{width:23%}':'.receipt-head{padding-bottom:18px}.receipt-section{padding:14px 0}.signature{margin-top:28px}'}`;
  const w=window.open('','_blank');if(!w)return info('LIBERE POP-UPS PARA IMPRIMIR.');
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${rom?'ROMANEIO DE ENTREGA':'VENDA'} Nº ${esc(d.numero)}</title><style>${css}</style></head><body>${body}</body></html>`);
  w.document.close();w.focus();setTimeout(()=>w.print(),350);
 });
}
let trPayments=[],trDiscount=0,trExtra=0,trEditando=false;
function trRound(n){return Math.round((Number(n)||0)*100)/100}
function trSetMoney(id,n){$(id).value=trRound(n).toFixed(2)}
function trFinancial(){const base=trocaAtual&&(!trocaId||trEditando)?Math.abs(calcT().diff):Math.abs(trocas.find(x=>x.numero===trocaId)?.diferenca||0);const original=trocaAtual&&(!trocaId||trEditando)?calcT().diff:(trocas.find(x=>x.numero===trocaId)?.diferenca||0);const net=trRound(Math.max(0,base-trDiscount+trExtra));const paid=trRound(trPayments.reduce((a,x)=>a+x.valor,0));const direction=original>0?'PAGAMENTO':original<0?'DEVOLUCAO':'SEM';$('tr-settle').value=net>0?direction:'SEM';$('tr-summary').innerHTML=`<strong>${net===0?'SEM DIFERENÇA':direction==='PAGAMENTO'?'RECEBER DO CLIENTE':'DEVOLVER AO CLIENTE'}: ${money(net)}</strong> | DIFERENÇA ORIGINAL: ${money(base)} | DESCONTO: ${money(trDiscount)} | ACRÉSCIMO: ${money(trExtra)} | LANÇADO: ${money(paid)} | <strong>SALDO: ${money(trRound(net-paid))}</strong>`;$('tr-payments').innerHTML=`<table class="vt-table"><tr><th>FORMA</th><th>VALOR</th><th>PARCELAS</th><th>PRIMEIRO VENCIMENTO</th><th>TAXA DA LOJA</th><th>IDENTIFICAÇÃO</th><th>AÇÃO</th></tr>${trPayments.map((x,i)=>`<tr><td>${esc(x.forma)} — ${esc(x.contaNome||'CONTA NÃO INFORMADA')}</td><td>${money(x.valor)}</td><td>${(x.boleto||x.cartaoCredito)?esc(String(x.parcelas||1))+'x':'—'}</td><td>${(x.boleto||x.cartaoCredito)?esc(x.primeiroVencimento||'—'):'—'}</td><td>${money(Number(x.taxaLoja??(Number(x.valor||0)*Number(x.taxa||0)/100)))}${Number(x.taxa||0)>0?` (${Number(x.taxa).toLocaleString('pt-BR')}%)`: ''}</td><td>${esc(x.identificacaoPagamento||'—')}</td><td><button type="button" data-tr-remove="${i}">EXCLUIR</button></td></tr>`).join('')}</table>`;$('tr-payments').querySelectorAll('[data-tr-remove]').forEach(b=>b.onclick=()=>{trPayments.splice(+b.dataset.trRemove,1);trFinancial()});return {net,paid,direction}}
function trChangeValue(type,isPercent){
 const saved=trocaId?trocas.find(x=>x.numero===trocaId):null;
 const base=Math.abs(trocaAtual&&(!trocaId||trEditando)?calcT().diff:(saved?.diferenca||0));
 const id=type==='discount'?'tr-discount':'tr-extra',pct=id+'-pct';
 const source=$(isPercent?pct:id),target=$(isPercent?id:pct);
 const raw=Math.max(0,Number(String(source.value).replace(',','.'))||0);
 const amount=trRound(isPercent?base*raw/100:raw);
 if(type==='discount')trDiscount=amount;else trExtra=amount;
 // Não sobrescrever o campo que o usuário está digitando.
 // O campo oposto e o resumo são atualizados imediatamente.
 target.value=isPercent?amount.toFixed(2):(base?((amount/base)*100).toFixed(2):'0.00');
 trFinancial();
}
const TR_FIN_KEY='erp_systems_financeiro_v1';
function trFinance(){let d={};try{d=JSON.parse(localStorage.getItem(TR_FIN_KEY)||'{}')||{}}catch{};d.contas=Array.isArray(d.contas)?d.contas:[];d.movimentos=Array.isArray(d.movimentos)?d.movimentos:[];return d}
function trAccountOptions(selected=''){const d=trFinance();return '<option value="">SELECIONE A CONTA</option>'+d.contas.filter(c=>c.ativo!==false).map(c=>`<option value="${esc(c.id)}" ${String(c.id)===String(selected)?'selected':''}>${esc(c.nome)}</option>`).join('')}
function trFinancePost(d){
 // A baixa da troca não movimenta a conta de destino.
 // O Caixa do operador recebe o valor bruto; a sangria transfere posteriormente.
 // reconcileTradeCashPayments registra o pagamento no livro-caixa sem duplicidade.
}

function trContaDaForma(forma){
 const fin=trFinance(),contas=fin.contas;
 let conta=contas.find(c=>String(c.id)===String(forma.contaId)&&c.ativo!==false);
 if(!conta){
  const nome=String(forma.conta||'').trim().toUpperCase();
  if(nome)conta=contas.find(c=>String(c.nome||'').trim().toUpperCase()===nome&&c.ativo!==false);
  if(!conta&&nome==='CAIXA DA LOJA')conta=contas.find(c=>(c.contaPadrao==='CAIXA'||String(c.nome||'').trim().toUpperCase()==='CAIXA')&&c.ativo!==false);
  if(!conta&&nome==='CONTA BANCÁRIA')conta=contas.find(c=>c.tipo==='BANCO'&&c.ativo!==false);
 }
 return conta||null;
}
function trEhCartaoCredito(f){return /CART[AÃ]O.*CR[EÉ]DITO|CR[EÉ]DITO.*CART[AÃ]O|CREDITO|CREDIT/i.test(String(f?.tipo||'')+' '+String(f?.descricao||''))}
function trAtualizarCamposBoleto(){
 const forma=formas().find(x=>String(x.id)===String($('tr-method')?.value));
 const parcelavel=ehBoleto(forma)||trEhCartaoCredito(forma);
 if($('tr-install-wrap'))$('tr-install-wrap').hidden=!parcelavel;
 if($('tr-due-wrap'))$('tr-due-wrap').hidden=!parcelavel;
 if(parcelavel&&$('tr-due')&&!$('tr-due').value)$('tr-due').value=today();
 if(!parcelavel&&$('tr-install'))$('tr-install').value='1';
}
function trGerarBoletos(d){
 const key='erp_matriz_operacoes_v2',base=read(key,{});
 if(!Array.isArray(base.receber))base.receber=[];
 let id=Math.max(0,...base.receber.map(x=>Number(x.id)||0))+1;
 (d.pagamentos||[]).forEach((p,i)=>{
  if(!p.boleto)return;
  const n=Number(p.parcelas)||1;
  const detalhes=dividirParcelas(Number(p.valor),n,p.primeiroVencimento);
  detalhes.forEach(par=>{
   const chave='TROCA-'+d.numero+'-PAG'+i+'-PAR'+par.parcela;
   if(base.receber.some(x=>x.chaveTroca===chave))return;
   base.receber.push({id:id++,codigoCarne:'T'+d.numero+'-'+String(par.parcela).padStart(2,'0'),origemCarne:'TROCA',numeroOrigem:d.numero,vendaOrigem:d.venda,conta:'TROCA '+d.numero+'-PAG'+i,parcela:par.parcela,totalParcelas:n,pessoa:d.clienteId||vendas.find(v=>Number(v.numero)===Number(d.venda))?.clienteId,descricao:'BOLETO TROCA Nº '+d.numero+' — VENDA Nº '+d.venda,valor:par.valor,pago:0,saldo:par.valor,vencimento:par.vencimento,situacao:'PENDENTE',pagamentos:[],ref:'TROCA '+d.numero,chaveTroca:chave});
  });
 });
 save(key,base);
}
function trCancelarBoletos(d){
 const key='erp_matriz_operacoes_v2',base=read(key,{});
 if(!Array.isArray(base.receber))return;
 const parcelas=base.receber.filter(x=>String(x.chaveTroca||'').startsWith('TROCA-'+d.numero+'-'));
 if(parcelas.some(x=>Number(x.pago||0)>0))throw Error('EXISTEM PARCELAS DE BOLETO JÁ RECEBIDAS. REGULARIZE OS RECEBIMENTOS ANTES DE CANCELAR A TROCA.');
 parcelas.forEach(x=>{x.situacao='CANCELADA';x.saldo=0});save(key,base);
}
function trAddPayment(){
 if(trocaId&&trocas.find(x=>Number(x.numero)===Number(trocaId))?.situacao!=='PENDENTE')return info('TROCA BAIXADA OU CANCELADA NÃO PODE SER ALTERADA.');
 const f=$('tr-method'),valor=trRound($('tr-payvalue').value),sum=trFinancial();
 if(!f.value||f.selectedIndex===0)return info('SELECIONE UMA FORMA DE PAGAMENTO.');
 if(!(valor>0))return info('INFORME UM VALOR VÁLIDO.');
 if(trRound(sum.paid+valor)>sum.net)return info('O PAGAMENTO EXCEDE O TOTAL DO ACERTO.');
 const forma=formas().find(x=>String(x.id)===String(f.value)&&x.ativo!==false&&x.vendas!==false&&String(x.situacao||'').toUpperCase()!=='INATIVO'&&String(x.situacao||'').toUpperCase()!=='INATIVA');
 if(!forma)return info('FORMA DE PAGAMENTO NÃO ENCONTRADA OU INATIVA.');
 const boleto=ehBoleto(forma),cartaoCredito=trEhCartaoCredito(forma),parcelavel=boleto||cartaoCredito;const parcelas=parcelavel?Number($('tr-install').value):1;const primeiro=parcelavel?($('tr-due').value||today()):'';if(parcelavel&&(!Number.isInteger(parcelas)||parcelas<1||parcelas>120))return info('INFORME UMA QUANTIDADE VÁLIDA DE PARCELAS.');if(parcelavel&&(!/^\d{4}-\d{2}-\d{2}$/.test(primeiro)||Number.isNaN(new Date(primeiro+'T12:00:00').getTime())))return info('INFORME O PRIMEIRO VENCIMENTO.');const conta=trContaDaForma(forma);
 if(!conta)return info('A FORMA DE PAGAMENTO NÃO POSSUI UMA CONTA ATIVA VINCULADA. CONFIGURE A CONTA NO CADASTRO DE FORMAS DE PAGAMENTO.');
 const taxa=forma.tipo==='PIX'?Number(forma.taxaPix||0):Number((forma.taxas||[]).find(t=>Number(t.parcelas)===parcelas)?.taxa??(forma.taxas||[]).find(t=>Number(t.parcelas)===1)?.taxa??0);
 const taxaValida=Number.isFinite(taxa)&&taxa>0?taxa:0;
 trPayments.push({forma:forma.descricao,formaId:forma.id,valor,boleto,cartaoCredito,parcelas,primeiroVencimento:primeiro,detalhes:parcelavel?dividirParcelas(valor,parcelas,primeiro):[],contaId:conta.id,contaNome:conta.nome,taxa:taxaValida,taxaLoja:trRound(valor*taxaValida/100),liquido:trRound(valor*(1-taxaValida/100)),identificacaoPagamento:$('tr-transaction-id').value.trim()});
 $('tr-payvalue').value='';$('tr-transaction-id').value='';if($('tr-install'))$('tr-install').value='1';trFinancial();
}
function trUsuarioAtual(){return document.querySelector('.top-user strong')?.textContent?.trim()||'DEMONSTRAÇÃO'}
function trRegistrarHistorico(d,acao){d.historicoUsuario=Array.isArray(d.historicoUsuario)?d.historicoUsuario:[];d.historicoUsuario.push({acao,usuario:trUsuarioAtual(),data:stamp()});d.usuario=trUsuarioAtual();if(trocaId===d.numero&&$('tr-user'))$('tr-user').value=d.usuario}
function trHistoricoExclusivo(e){
 if(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()}
 const d=trocas.find(t=>String(t.numero)===String(trocaId));
 const eventos=Array.isArray(d?.historicoUsuario)?d.historicoUsuario.slice().reverse():[];
 const ultimo=eventos[0]?.usuario||d?.usuario||usuarioAtual();
 const linhas=eventos.map(h=>{
  const acao=({GRAVAR:'CADASTRO',ALTERAR:'ALTERAÇÃO',BAIXAR:'BAIXA',CANCELAR:'CANCELAMENTO',REABRIR:'REABERTURA'})[String(h.acao||'').toUpperCase()]||String(h.acao||'AÇÃO');
  const data=h.data?new Date(h.data):null;
  const horario=data&&!Number.isNaN(data.getTime())?data.toLocaleString('pt-BR'):'DATA NÃO INFORMADA';
  return `<div class="vt-historico-item"><div><b>${esc(acao)}</b><span> — ${esc(h.usuario||'NÃO INFORMADO')}</span></div><small>${esc(horario)}</small></div>`;
 }).join('');
 const fundo=document.createElement('div');fundo.className='vt-modal-back vt-historico-back';
 fundo.innerHTML=`<div class="vt-historico-dialog" role="dialog" aria-modal="true" aria-label="HISTÓRICO DE ALTERAÇÕES"><div class="vt-historico-titulo">HISTÓRICO DE ALTERAÇÕES</div><div class="vt-historico-corpo"><p><b>ÚLTIMO USUÁRIO:</b> ${esc(ultimo)}</p><div class="vt-historico-lista">${linhas||'<p>NENHUMA AÇÃO REGISTRADA PARA ESTA TROCA.</p>'}</div></div><div class="vt-historico-rodape"><button type="button" data-fechar>FECHAR</button></div></div>`;
 const estilo=document.createElement('style');estilo.textContent=`.vt-historico-back{z-index:100005;display:flex;align-items:center;justify-content:center}.vt-historico-dialog{width:min(440px,92vw);background:white;color:#173f74;border-radius:13px;box-shadow:0 15px 50px #00162d70;overflow:hidden;font-family:Arial,sans-serif}.vt-historico-titulo{background:#1c427a;color:#fff;font-size:16px;font-weight:800;padding:17px 18px}.vt-historico-corpo{padding:16px 17px 10px}.vt-historico-corpo>p{font-size:16px;margin:12px 0 24px}.vt-historico-lista{max-height:42vh;overflow-y:auto}.vt-historico-item{border-bottom:1px solid #d1ddef;padding:9px 0 12px;font-size:15px}.vt-historico-item b{font-weight:800}.vt-historico-item small{display:block;font-size:12px;color:#6a819e;margin-top:3px}.vt-historico-rodape{display:flex;justify-content:flex-end;padding:18px}.vt-historico-rodape button{border:0;border-radius:5px;background:#1e5aab;color:#fff;font-weight:800;padding:11px 20px;cursor:pointer}`;
 document.head.append(estilo);document.body.append(fundo);
 const fechar=()=>{document.removeEventListener('keydown',tecla,true);fundo.remove();estilo.remove()};
 const tecla=ev=>{if(ev.key==='Escape'){ev.preventDefault();ev.stopImmediatePropagation();fechar()}};
 document.addEventListener('keydown',tecla,true);
 fundo.querySelector('[data-fechar]').onclick=fechar;
 fundo.addEventListener('click',ev=>{if(ev.target===fundo)fechar()});
}

// Recarrega as formas realmente cadastradas ao abrir/retornar à tela de Trocas.
function trAtualizarFormasPagamento(){
 const select=$('tr-method');if(!select)return;
 const anterior=select.value;
 const ativas=formas().filter(f=>f&&f.ativo!==false&&f.vendas!==false&&String(f.situacao||'').toUpperCase()!=='INATIVO'&&String(f.situacao||'').toUpperCase()!=='INATIVA'&&String(f.descricao||'').trim());
 select.replaceChildren(new Option('SELECIONE',''));
 ativas.forEach(f=>select.add(new Option(String(f.descricao),String(f.id))));
 if(ativas.some(f=>String(f.id)===anterior))select.value=anterior;
 else select.value='';
}
function layoutT(){screen='TROCAS';root().innerHTML=`<section class="vt-page vt-trocas-modelo"><h1>▣ TROCAS <button type="button" id="tr-shortcuts" class="vt-shortcuts">⌂ ATALHOS</button></h1><div class="vt-panel"><h2>VENDA ORIGINAL</h2><div class="vt-grid tr-original-grid"><label class="vt-field tr-number-field">Nº DA TROCA<input id="tr-num" type="text" readonly></label><div class="tr-sale-picker"><label class="vt-field">NÚMERO DA VENDA<input id="tr-sale" type="text" readonly placeholder="SELECIONE"></label><button type="button" id="tr-load" title="SELECIONAR VENDA" aria-label="Selecionar venda">+</button></div><label class="vt-field tr-status-field">SITUAÇÃO<input id="tr-status" type="text" readonly value="PENDENTE"></label><label class="vt-field tr-user-field">USUÁRIO<input id="tr-user" type="text" readonly value="DEMONSTRAÇÃO"></label><div id="tr-saleinfo"></div></div></div><div class="vt-panel"><h2>PRODUTOS DEVOLVIDOS</h2><div id="tr-returns"></div></div><div class="vt-panel tr-products-panel"><h2>NOVOS PRODUTOS</h2><div class="vt-grid">${fld('tr-code','CÓDIGO')}${fld('tr-desc','DESCRIÇÃO')}${fld('tr-qty','QUANTIDADE','number','min="0.001" step="any" value="1"')}<button id="tr-add">ADICIONAR NOVO PRODUTO</button></div>${painelEstoque("tr")}<div id="tr-newitems"></div></div><div class="vt-panel"><h2>ACERTO FINANCEIRO</h2><div id="tr-summary"></div><div class="vt-grid"><label class="vt-field">DESCONTO (R$)<input id="tr-discount" type="number" min="0" step="0.01" value="0"></label><label class="vt-field">DESCONTO (%)<input id="tr-discount-pct" type="number" min="0" step="0.01" value="0"></label><label class="vt-field">ACRÉSCIMO (R$)<input id="tr-extra" type="number" min="0" step="0.01" value="0"></label><label class="vt-field">ACRÉSCIMO (%)<input id="tr-extra-pct" type="number" min="0" step="0.01" value="0"></label></div><div class="vt-grid vt-trade-grid-438"><label class="vt-field">DESTINO DA DIFERENÇA<select id="tr-settle"><option value="PAGAMENTO">RECEBER DO CLIENTE</option><option value="DEVOLUCAO">DEVOLVER AO CLIENTE</option><option value="SEM">SEM DIFERENÇA</option></select></label><label class="vt-field">FORMA DE PAGAMENTO<select id="tr-method">${payOpts()}</select></label><label class="vt-field">VALOR (R$)<input id="tr-payvalue" type="number" min="0.01" step="0.01"></label><label class="vt-field" id="tr-install-wrap" hidden>QUANTIDADE DE PARCELAS<input id="tr-install" type="number" min="1" max="120" step="1" value="1"></label><input type="hidden" id="tr-due"><label class="vt-field">IDENTIFICAÇÃO DO PAGAMENTO (OPCIONAL)<input id="tr-transaction-id" type="text" placeholder="NSU / CÓDIGO DA TRANSAÇÃO" autocomplete="off"></label><button id="tr-addpay" type="button">ADICIONAR PAGAMENTO</button></div><div id="tr-payments"></div><div class="vt-grid">${fld('tr-reason','MOTIVO DA TROCA')}<label class="vt-field">PRODUTO DEVOLVIDO<select id="tr-condition"><option value="ESTOQUE">RETORNAR AO ESTOQUE</option><option value="AVARIA">AVARIADO / NÃO DISPONIBILIZAR</option></select></label></div><p>Os pagamentos entram no Caixa ao BAIXAR a troca; a conta de destino recebe somente na sangria.</p></div><div class="vt-actions"><button id="tr-new">NOVA</button><button id="tr-save">GRAVAR</button><button id="tr-edit">ALTERAR</button><button id="tr-close">BAIXAR</button><button id="tr-cancel">CANCELAR</button><button id="tr-print">IMPRIMIR</button><button id="tr-back">VOLTAR</button></div><div class="vt-panel tr-consulta"><h2>CONSULTAR TROCAS</h2><div class="tr-consulta-filtros"><label class="vt-field">DATA INICIAL<input type="date" id="tr-filter-start"></label><label class="vt-field">DATA FINAL<input type="date" id="tr-filter-end"></label><label class="vt-field">VENDA<div class="vt-picker"><input id="tr-filter-sale" value="TODOS" readonly><button type="button" id="tr-filter-sale-plus" aria-label="Selecionar venda">+</button></div></label><button type="button" id="tr-filter-search">PESQUISAR</button></div><div id="tr-list"></div></div></section>`;$('tr-user').addEventListener('click',trHistoricoExclusivo,true);$('tr-user').style.cursor='pointer';$('tr-shortcuts').onclick=atalhosTrocas;$('tr-new').onclick=newT;$('tr-load').onclick=selecionarVendaT;$('tr-code').onchange=()=>{const p=produtos().find(x=>String(x.codigo)===$('tr-code').value.trim());if(p){$('tr-desc').value=p.descricao}atualizarPainel('tr',$('tr-code').value)};$('tr-code').oninput=()=>atualizarPainel('tr',$('tr-code').value);$('tr-add').onclick=addNewT;$('tr-save').onclick=saveT;$('tr-edit').onclick=alterarT;$('tr-addpay').onclick=trAddPayment;$('tr-method').addEventListener('change',trAtualizarCamposBoleto);for(const k of ['discount','extra']){ $( 'tr-'+k).oninput=()=>trChangeValue(k,false);$('tr-'+k+'-pct').oninput=()=>trChangeValue(k,true) }$('tr-close').onclick=baixarT;$('tr-cancel').onclick=cancelarT;$('tr-print').onclick=()=>printT();$('tr-back').onclick=()=>category('VENDAS');$('tr-filter-search').onclick=()=>listT(true);$('tr-filter-sale-plus').onclick=selecionarVendaFiltroT;trAtualizarFormasPagamento();$('tr-method').addEventListener('focus',trAtualizarFormasPagamento);newT();trAtualizarCamposBoleto();$('tr-user').value=document.querySelector('.top-user strong')?.textContent?.trim()||'DEMONSTRAÇÃO';listT();active('VENDAS')}
function newT(){trEditando=false;trocaAtual=null;trocaId=null;trocaId=null;retorno=[];novos=[];$('tr-sale').value='';$('tr-saleinfo').textContent='';$('tr-returns').innerHTML='LOCALIZE UMA VENDA BAIXADA.';$('tr-newitems').innerHTML='';trPayments=[];trDiscount=0;trExtra=0;for(const id of ['tr-discount','tr-discount-pct','tr-extra','tr-extra-pct'])trSetMoney(id,0);$('tr-payments').innerHTML='';$('tr-summary').innerHTML='';$('tr-reason').value='';$('tr-settle').value='SEM';$('tr-status').value='PENDENTE';$('tr-num').value=String(seq(trocas)).padStart(6,'0');if($('tr-install'))$('tr-install').value='1';if($('tr-due'))$('tr-due').value='';trAtualizarCamposBoleto();atualizarPainel('tr','')}
function selecionarVendaT(){
 if(trocaId)return info('CLIQUE EM NOVA TROCA ANTES DE SELECIONAR OUTRA VENDA.');
 const elegiveis=vendas.filter(v=>String(v.situacao||'').toUpperCase()==='BAIXADA').sort((a,b)=>Number(b.numero)-Number(a.numero));
 const fundo=document.createElement('div');fundo.className='vt-modal-back vt-cliente-modal-back tr-sale-select-back';
 fundo.innerHTML=`<div class="vt-cliente-dialog" role="dialog" aria-modal="true" aria-label="SELECIONAR VENDA BAIXADA"><div class="vt-cliente-head"><strong>SELECIONAR VENDA BAIXADA</strong><button type="button" data-fechar aria-label="Fechar">×</button></div><div class="vt-cliente-body"><div class="vt-cliente-filtros"><label>PESQUISAR POR<select data-tipo><option value="numero">NÚMERO DA VENDA</option><option value="cliente">CLIENTE</option></select></label><label>TEXTO DA PESQUISA<input data-busca type="search" placeholder="DIGITE PARA PESQUISAR..."></label><button type="button" data-pesquisar>PESQUISAR</button></div><div class="vt-cliente-tabela"><table><thead><tr><th>Nº DA VENDA</th><th>DATA</th><th>CLIENTE</th><th>VALOR TOTAL</th><th>SITUAÇÃO</th></tr></thead><tbody data-resultados><tr><td colspan="5">CLIQUE EM PESQUISAR PARA EXIBIR AS VENDAS BAIXADAS.</td></tr></tbody></table></div><div class="vt-cliente-rodape"><small>DÊ DOIS CLIQUES PARA SELECIONAR.</small><button type="button" data-cancelar>CANCELAR</button></div></div></div>`;
 const estilo=document.createElement('style');estilo.textContent=`.tr-sale-select-back{z-index:100010;display:flex;align-items:center;justify-content:center}.tr-sale-select-back .vt-cliente-dialog{width:min(960px,94vw);max-height:88vh;overflow:hidden;background:#fff;border-radius:12px;box-shadow:0 18px 55px #001b3960;color:#163e70;font-family:Arial,sans-serif}.tr-sale-select-back .vt-cliente-head{background:#245b9a;color:#fff;padding:20px;display:flex;justify-content:space-between;align-items:center;font-size:15px}.tr-sale-select-back .vt-cliente-head button{color:#fff;background:transparent;border:1px solid #ffffff80;border-radius:5px;font-size:25px;width:35px;height:35px;cursor:pointer}.tr-sale-select-back .vt-cliente-body{padding:20px}.tr-sale-select-back .vt-cliente-filtros{display:grid;grid-template-columns:180px minmax(180px,1fr) 100px;gap:6px;align-items:end}.tr-sale-select-back .vt-cliente-filtros label{font-size:11px;font-weight:800;color:#0b315e}.tr-sale-select-back .vt-cliente-filtros input,.tr-sale-select-back .vt-cliente-filtros select{display:block;width:100%;box-sizing:border-box;height:44px;margin-top:6px;border:1px solid #b9d0f4;border-radius:6px;padding:9px;font-size:13px}.tr-sale-select-back .vt-cliente-filtros button{height:42px;border:0;border-radius:5px;background:#205b9e;color:#fff;font-weight:bold;font-size:11px;cursor:pointer}.tr-sale-select-back .vt-cliente-tabela{margin-top:14px;max-height:43vh;overflow:auto}.tr-sale-select-back .vt-cliente-tabela table{border-collapse:collapse;width:100%;font-size:13px}.tr-sale-select-back .vt-cliente-tabela th{background:#193e72;color:#fff;padding:14px;text-align:left}.tr-sale-select-back .vt-cliente-tabela td{border-bottom:1px solid #c8d8ed;padding:13px}.tr-sale-select-back .vt-cliente-tabela tbody tr[data-venda]{cursor:pointer}.tr-sale-select-back .vt-cliente-tabela tbody tr[data-venda]:hover{background:#e9f2ff}.tr-sale-select-back .vt-cliente-rodape{display:flex;justify-content:space-between;align-items:center;margin-top:16px}.tr-sale-select-back .vt-cliente-rodape small{font-size:11px}.tr-sale-select-back .vt-cliente-rodape button{background:#e7f0ff;color:#18549c;border:1px solid #b7d0ff;border-radius:5px;padding:12px 18px;cursor:pointer}@media(max-width:680px){.tr-sale-select-back .vt-cliente-filtros{grid-template-columns:1fr 1fr}.tr-sale-select-back .vt-cliente-filtros button{grid-column:1/-1}}`;
 document.head.append(estilo);document.body.append(fundo);
 const fechar=()=>{document.removeEventListener('keydown',tecla,true);fundo.remove();estilo.remove()};
 const tecla=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();fechar()}};
 document.addEventListener('keydown',tecla,true);
 fundo.querySelector('[data-fechar]').onclick=fechar;fundo.querySelector('[data-cancelar]').onclick=fechar;
 const tbody=fundo.querySelector('[data-resultados]'),input=fundo.querySelector('[data-busca]'),tipo=fundo.querySelector('[data-tipo]');
 const pesquisar=()=>{
  const q=input.value.trim().toLocaleUpperCase('pt-BR');
  const achados=elegiveis.filter(v=>(tipo.value==='numero'?String(v.numero||'').padStart(6,'0'):String(v.cliente||'')).toLocaleUpperCase('pt-BR').includes(q));
  tbody.innerHTML='';
  if(!achados.length){tbody.innerHTML='<tr><td colspan="5">NENHUMA VENDA BAIXADA ENCONTRADA.</td></tr>';return}
  achados.forEach(v=>{
   const tr=document.createElement('tr');tr.dataset.venda=String(v.numero);
   const total=Number(v.total??v.totalPagar??v.valorTotal??0);
   tr.innerHTML=`<td>${esc(String(v.numero).padStart(6,'0'))}</td><td>${esc(v.data||'')}</td><td>${esc(v.cliente||'CLIENTE NÃO INFORMADO')}</td><td>${esc(money(total))}</td><td>BAIXADA</td>`;
   tr.ondblclick=()=>{const numero=String(v.numero).padStart(6,'0');fechar();$('tr-sale').value=numero;loadSaleT()};tbody.append(tr)
  });
 };
 fundo.querySelector('[data-pesquisar]').onclick=pesquisar;
 input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();pesquisar()}});
 input.focus();
}
function trCodigoDevolvido(item){
 const direto=item?.codigo??item?.codProduto??item?.produtoCodigo??item?.idProduto;
 if(direto!==undefined&&direto!==null&&String(direto).trim())return String(direto).trim();
 const produto=produtos().find(p=>String(p.descricao||'').trim().toLocaleUpperCase('pt-BR')===String(item?.descricao||'').trim().toLocaleUpperCase('pt-BR'));
 return produto?String(produto.codigo):'';
}
function trTabelaDevolvidos(venda,usados={},registrados=[] ,editavel=true){
 const linhas=(venda?.itens||[]).map((x,i)=>{
  const codigo=trCodigoDevolvido(x);
  const quantidade=registrados.filter(z=>Number(z.indice)===i).reduce((a,z)=>a+Number(z.quantidade||0),0);
  const max=Math.max(0,Number(x.quantidade||0)-Number(usados[i]||0));
  const selecionavel=codigo?' class="tr-stock-select" data-tr-return-stock="'+esc(codigo)+'" tabindex="0" role="button" title="VISUALIZAR ESTOQUE NO PAINEL"':'';
  return `<tr><td><span${selecionavel}>${esc(codigo||'—')}</span></td><td><span${selecionavel}>${esc(x.descricao)}</span></td><td>${esc(x.quantidade)}</td><td>${esc(usados[i]||0)}</td><td>${editavel?`<input type="number" min="0" max="${max}" step="any" value="${quantidade}" data-ret="${i}">`:esc(quantidade)}</td></tr>`;
 }).join('');
 return `<table class="vt-table"><thead><tr><th>CÓDIGO</th><th>PRODUTO</th><th>VENDIDO</th><th>JÁ DEVOLVIDO</th><th>DEVOLVER AGORA</th></tr></thead><tbody>${linhas}</tbody></table>`;
}
function trVincularDevolvidos(){
 const area=$('tr-returns');if(!area)return;
 area.querySelectorAll('[data-tr-return-stock]').forEach(el=>{
  const mostrar=()=>atualizarPainel('tr',el.dataset.trReturnStock);
  el.addEventListener('click',mostrar);
  el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();mostrar()}});
 });
 area.querySelectorAll('[data-ret]').forEach(el=>el.oninput=drawT);
}
function loadSaleT(){if(trocaId)return info('CLIQUE EM NOVA TROCA ANTES DE SELECIONAR OUTRA VENDA.');const d=vendas.find(x=>x.numero===+$('tr-sale').value);if(!d||d.situacao!=='BAIXADA')return info('LOCALIZE UMA VENDA BAIXADA.');trocaAtual=d;retorno=[];novos=[];$('tr-saleinfo').textContent=`CLIENTE: ${d.cliente} | DATA: ${d.data}`;const used=trocas.filter(t=>t.venda===d.numero&&t.situacao!=='CANCELADA').flatMap(t=>t.devolvidos).reduce((a,x)=>{a[x.indice]=(a[x.indice]||0)+x.quantidade;return a},{});$('tr-returns').innerHTML=trTabelaDevolvidos(d,used,[],true);trVincularDevolvidos();drawT()}
function addNewT(){if(trocaId&&trocas.find(x=>Number(x.numero)===Number(trocaId))?.situacao!=='PENDENTE')return info('TROCA BAIXADA OU CANCELADA NÃO PODE SER ALTERADA.');const codigo=$('tr-code').value.trim(),descricao=$('tr-desc').value.trim(),quantidade=+$('tr-qty').value,produto=produtos().find(p=>String(p.codigo)===codigo),preco=Number(produto?.preco);if(!produto||!codigo||!descricao||!(quantidade>0)||!Number.isFinite(preco)||preco<0)return info('NOVO PRODUTO INVÁLIDO.');novos.push({codigo,descricao,quantidade,preco});$('tr-code').value='';$('tr-desc').value='';$('tr-qty').value=1;drawT();atualizarPainel('tr',codigo)}
function calcT(){const dev=trocaAtual?[...$('tr-returns').querySelectorAll('[data-ret]')].map(el=>({indice:+el.dataset.ret,quantidade:+el.value||0})).filter(x=>x.quantidade>0):[];const creditos=llCreditoHistoricoVenda(trocaAtual||{});const old=dev.reduce((s,x)=>s+x.quantidade*(creditos[x.indice]?.creditoUnitario??trocaAtual.itens[x.indice].preco),0),fresh=novos.reduce((s,x)=>s+x.quantidade*x.preco,0);return {dev,old,fresh,diff:Math.round((fresh-old)*100)/100}}
function trTabelaNovos(lista,editavel){
 const linhas=(lista||[]).map((x,i)=>`<tr><td><span class="tr-stock-select" data-tr-stock="${esc(x.codigo)}" tabindex="0" role="button" title="VISUALIZAR ESTOQUE">${esc(x.codigo)}</span></td><td><span class="tr-stock-select" data-tr-stock="${esc(x.codigo)}" tabindex="0" role="button" title="VISUALIZAR ESTOQUE">${esc(x.descricao)}</span></td><td>${esc(x.quantidade)}</td><td>${money(x.preco)}</td><td>${money(Number(x.quantidade)*Number(x.preco))}</td><td>${editavel?`<button type="button" class="tr-remove-new" data-tr-remove="${i}">REMOVER</button>`:''}</td></tr>`).join('');
 return `<div class="tr-newitems-scroll"><table class="tr-newitems-table"><thead><tr><th>CÓDIGO</th><th>PRODUTO</th><th>QTD.</th><th>UNIT.</th><th>TOTAL</th><th></th></tr></thead><tbody>${linhas||'<tr><td colspan="6">NENHUM PRODUTO ADICIONADO.</td></tr>'}</tbody></table></div>`;
}
function trVincularTabelaNovos(editavel){
 const area=$('tr-newitems');if(!area)return;
 area.querySelectorAll('[data-tr-stock]').forEach(el=>{
  const selecionar=()=>atualizarPainel('tr',el.dataset.trStock);
  el.addEventListener('click',selecionar);
  el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selecionar()}});
 });
 if(editavel)area.querySelectorAll('[data-tr-remove]').forEach(el=>el.onclick=()=>{novos.splice(Number(el.dataset.trRemove),1);drawT()});
}
function drawT(){if(!trocaAtual||(trocaId&&!trEditando))return;const t=calcT();$('tr-newitems').innerHTML=trTabelaNovos(novos,true);trVincularTabelaNovos(true);$('tr-summary').innerHTML=`DEVOLVIDOS: ${money(t.old)} | NOVOS: ${money(t.fresh)} | <strong>${t.diff>0?'CLIENTE PAGA':t.diff<0?'DEVOLVER / CRÉDITO':'SEM DIFERENÇA'}: ${money(Math.abs(t.diff))}</strong>`;trFinancial()}
function saveT(){
 try{
 if(trocaId){info('PARA MODIFICAR UMA TROCA GRAVADA, CLIQUE EM ALTERAR.');return}
 if(!trocaAtual)throw Error('LOCALIZE UMA VENDA BAIXADA.');
 const t=calcT();if(!t.dev.length||!novos.length)throw Error('SELECIONE PRODUTOS DEVOLVIDOS E NOVOS.');
 const used=trocas.filter(x=>x.venda===trocaAtual.numero&&x.situacao!=='CANCELADA'&&Number(x.numero)!==Number(trocaId)).flatMap(x=>x.devolvidos).reduce((a,x)=>{a[x.indice]=(a[x.indice]||0)+x.quantidade;return a},{});
 for(const x of t.dev){if(x.quantidade>trocaAtual.itens[x.indice].quantidade-(used[x.indice]||0)+1e-8)throw Error('QUANTIDADE DEVOLVIDA EXCEDE A DISPONÍVEL.')}
 const fin=trFinancial();if(trRound(fin.net-fin.paid)!==0)throw Error('INFORME TODOS OS PAGAMENTOS DO ACERTO ANTES DE GRAVAR.');const settle=$('tr-settle').value;
 if(fin.net>0&&(fin.direction==='PAGAMENTO'&&settle!=='PAGAMENTO'||fin.direction==='DEVOLUCAO'&&!['DEVOLUCAO','CREDITO'].includes(settle)))throw Error('SELECIONE UM ACERTO COMPATÍVEL COM O SALDO A PAGAR.');
 const d={numero:seq(trocas),venda:trocaAtual.numero,cliente:trocaAtual.cliente,data:stamp(),situacao:'PENDENTE',devolvidos:t.dev.map(x=>({...trocaAtual.itens[x.indice],...x,creditoUnitario:llCreditoHistoricoVenda(trocaAtual)[x.indice]?.creditoUnitario})),novos:structuredClone(novos),valorDevolvido:t.old,valorNovo:t.fresh,diferenca:t.diff,desconto:trDiscount,acrescimo:trExtra,totalAcerto:fin.net,pagamentos:structuredClone(trPayments),acerto:settle,forma:$('tr-method').selectedOptions[0]?.textContent||'',motivo:$('tr-reason').value,condicao:$('tr-condition').value};
 trRegistrarHistorico(d,'GRAVAR');trocas.push(d);save(TK,trocas);trocaId=d.numero;trEditando=true;$('tr-status').value='PENDENTE';$('tr-num').value=String(d.numero).padStart(6,'0');carregarT(d.numero);listT();info('TROCA GRAVADA COMO PENDENTE. VOCÊ PODE MODIFICAR OS CAMPOS E CLICAR EM ALTERAR PARA SALVAR.');
 }catch(e){info(e.message)}
}
function alterarT(){
 const d=trocas.find(x=>Number(x.numero)===Number(trocaId));
 if(!d)return info('GRAVE OU SELECIONE UMA TROCA ANTES DE ALTERAR.');
 if(d.situacao!=='PENDENTE')return info('SOMENTE TROCAS PENDENTES PODEM SER ALTERADAS.');
 try{
  const t=calcT();if(!t.dev.length||!novos.length)throw Error('SELECIONE PRODUTOS DEVOLVIDOS E NOVOS.');
  const used=trocas.filter(x=>Number(x.venda)===Number(d.venda)&&x.situacao!=='CANCELADA'&&Number(x.numero)!==Number(d.numero)).flatMap(x=>x.devolvidos||[]).reduce((a,x)=>{a[x.indice]=(a[x.indice]||0)+Number(x.quantidade||0);return a},{});
  for(const x of t.dev){if(x.quantidade>Number(trocaAtual.itens[x.indice].quantidade)-(used[x.indice]||0)+1e-8)throw Error('QUANTIDADE DEVOLVIDA EXCEDE A DISPONÍVEL.');}
  const fin=trFinancial();if(trRound(fin.net-fin.paid)!==0)throw Error('AJUSTE OS PAGAMENTOS PARA O NOVO TOTAL ANTES DE SALVAR.');
  const settle=$('tr-settle').value;
  if(fin.net>0&&(fin.direction==='PAGAMENTO'&&settle!=='PAGAMENTO'||fin.direction==='DEVOLUCAO'&&!['DEVOLUCAO','CREDITO'].includes(settle)))throw Error('ACERTO FINANCEIRO INCOMPATÍVEL COM O SALDO A PAGAR.');
  Object.assign(d,{devolvidos:t.dev.map(x=>({...trocaAtual.itens[x.indice],...x,creditoUnitario:llCreditoHistoricoVenda(trocaAtual)[x.indice]?.creditoUnitario})),novos:structuredClone(novos),valorDevolvido:t.old,valorNovo:t.fresh,diferenca:t.diff,desconto:trDiscount,acrescimo:trExtra,totalAcerto:fin.net,pagamentos:structuredClone(trPayments),acerto:settle,motivo:$('tr-reason').value,condicao:$('tr-condition').value});
  trRegistrarHistorico(d,'ALTERAR');save(TK,trocas);trEditando=false;carregarT(d.numero);listT();info('TROCA PENDENTE ALTERADA. ESTOQUE E FINANCEIRO CONTINUAM SEM MOVIMENTAÇÃO ATÉ BAIXAR.');
 }catch(e){info(e.message)}
}
async function baixarT(){
 const d=trocas.find(x=>x.numero===trocaId);
 if(!d||d.situacao!=='PENDENTE')return info('SOMENTE TROCAS PENDENTES PODEM SER BAIXADAS.');
 if(trRound((d.pagamentos||[]).reduce((a,x)=>a+(+x.valor||0),0))!==trRound(d.totalAcerto??Math.abs(d.diferenca)))return info('ACERTO FINANCEIRO INCOMPLETO.');if((d.pagamentos||[]).some(p=>!p.contaId))return info('PAGAMENTO SEM CONTA DE DESTINO. ESTA TROCA PRECISA TER CONTAS INFORMADAS ANTES DA BAIXA.');if(typeof window.LL_identificarOperadorCaixa!=='function')return info('IDENTIFICAÇÃO DO OPERADOR INDISPONÍVEL.');
 return window.LL_identificarOperadorCaixa('IDENTIFICAÇÃO PARA BAIXAR TROCA',async codigo=>{
 const caixa=read('erp_systems_caixas_v1',[]).find(c=>c.situacao==='ABERTO'&&String(c.operador)===String(codigo));
 if(!caixa)return info('ESTE USUÁRIO NÃO POSSUI CAIXA ABERTO.');
 if(!await erpConfirm('CONFIRMA BAIXAR A TROCA NO CAIXA DO OPERADOR '+codigo+'?'))return;
 if(d.situacao!=='PENDENTE')return info('ESTA TROCA JÁ FOI PROCESSADA.');
 // Validar e preparar toda a movimentação antes de gravar qualquer lançamento.
 const ps=produtos();
 if(!Array.isArray(ps))return info('CADASTRO CENTRAL DE PRODUTOS INDISPONÍVEL.');
 const movimentos=new Map();
 const localizar=codigo=>ps.find(p=>String(p.codigo).trim()===String(codigo??'').trim());
 for(const x of d.devolvidos||[]){
  if(d.condicao!=='ESTOQUE')continue;
  const p=localizar(x.codigo);if(!p)return info('PRODUTO DEVOLVIDO NÃO ENCONTRADO NO CADASTRO: '+x.codigo);
  const q=Number(x.quantidade);if(!Number.isFinite(q)||q<=0)return info('QUANTIDADE DEVOLVIDA INVÁLIDA.');
  movimentos.set(String(p.codigo),(movimentos.get(String(p.codigo))||0)+q);
 }
 for(const x of d.novos||[]){
  const p=localizar(x.codigo);if(!p)return info('PRODUTO NOVO NÃO ENCONTRADO NO CADASTRO: '+x.codigo);
  const q=Number(x.quantidade);if(!Number.isFinite(q)||q<=0)return info('QUANTIDADE DO PRODUTO NOVO INVÁLIDA.');
  movimentos.set(String(p.codigo),(movimentos.get(String(p.codigo))||0)-q);
 }
 if(!movimentos.size)return info('A TROCA NÃO POSSUI PRODUTOS PARA MOVIMENTAR.');
 for(const [codigo,diferenca] of movimentos){
  const p=localizar(codigo),fisico=Number(p.provisao)||0,reservado=Number(p.venda)||0;
  if(fisico+diferenca<reservado-1e-8)return info('ESTOQUE INSUFICIENTE PARA O PRODUTO '+codigo+'. BAIXA NÃO REALIZADA.');
 }
 // Primeiro registrar os saldos físicos; se a gravação falhar, não registrar o financeiro.
 const anterior=localStorage.getItem(PK);
 try{
  for(const [codigo,diferenca] of movimentos){const p=localizar(codigo);p.provisao=(Number(p.provisao)||0)+diferenca;}
  save(PK,ps);
  const gravado=read(PK,[]);
  for(const [codigo] of movimentos){const p=gravado.find(x=>String(x.codigo).trim()===codigo);if(!p||Math.abs(Number(p.provisao)-Number(localizar(codigo).provisao))>1e-8)throw Error('FALHA AO CONFIRMAR O ESTOQUE DO PRODUTO '+codigo);}
  trFinancePost(d);
 }catch(e){
  try{if(anterior===null)localStorage.removeItem(PK);else localStorage.setItem(PK,anterior)}catch(_){}
  return info('NÃO FOI POSSÍVEL BAIXAR A TROCA: '+e.message);
 }
 const venda=vendas.find(v=>Number(v.numero)===Number(d.venda));
 if(venda){venda.trocasAplicadas=Array.isArray(venda.trocasAplicadas)?venda.trocasAplicadas:[];
  if(!venda.trocasAplicadas.some(t=>Number(t.numero)===Number(d.numero)))venda.trocasAplicadas.push({numero:d.numero,situacao:'BAIXADA',devolvidos:structuredClone(d.devolvidos),novos:structuredClone(d.novos),pagamentos:structuredClone(d.pagamentos||[]),acerto:d.acerto});
  venda.atualizadoEm=stamp();save(VK,vendas);
 }
 try{trGerarBoletos(d)}catch(e){return info('ERRO AO GERAR BOLETOS DA TROCA: '+e.message)}
 window.LL_fixarComissaoNaBaixa?.(d,venda);d.situacao='BAIXADA';d.operadorBaixa=codigo;d.caixaBaixa=caixa.id;d.baixadaEm=stamp();trRegistrarHistorico(d,'BAIXAR');save(TK,trocas);
 try{window.LL_conciliarPagamentosTrocasCaixa?.()}catch(e){info('TROCA BAIXADA, MAS O LANÇAMENTO NO CAIXA NÃO FOI CONFIRMADO: '+e.message);}
 $('tr-status').value='BAIXADA';atualizarPainel('tr',$('tr-code').value||d.novos[0]?.codigo);listT();
 info('TROCA BAIXADA. ESTOQUE E MOVIMENTAÇÕES FINANCEIRAS REGISTRADOS NAS CONTAS VINCULADAS ÀS FORMAS DE PAGAMENTO.');
 });
}
function trFinanceReverse(d){
 const fin=trFinance(),ref='TROCA-'+d.numero;
 const orig=fin.movimentos.filter(m=>m.ref===ref&&m.categoria==='TROCA');
 if(orig.length!==(d.pagamentos||[]).filter(p=>!p.boleto).length)throw Error('MOVIMENTAÇÕES FINANCEIRAS INCONSISTENTES. CONFIRA O EXTRATO ANTES DE CANCELAR.');
 if(orig.some(m=>m.estornada))throw Error('ESTORNO JÁ PROCESSADO.');
 const key='erp_systems_estornos_trocas_pendentes_v1';
 const pendentes=read(key,[]);
 if(pendentes.some(x=>String(x.trocaNumero)===String(d.numero)))throw Error('ESTORNO DESTA TROCA JÁ FOI SOLICITADO.');
 const devolucoes=orig.filter(m=>m.tipo==='ENTRADA').map(m=>({movimentoId:m.id,forma:(d.pagamentos||[]).find(p=>String(p.contaId)===String(m.conta))?.forma||'',contaId:m.conta,valor:m.valor}));
 pendentes.push({id:'TROCA-'+d.numero,trocaNumero:d.numero,vendaNumero:d.venda,caixaId:d.caixaBaixa,operador:d.operadorBaixa,situacao:'PENDENTE',data:stamp(),pagamentos:devolucoes});
 save(key,pendentes);
 // Não lançar saída financeira aqui: o estorno será confirmado pelo operador no Caixa.
}
async function cancelarT(){
 const d=trocas.find(x=>x.numero===trocaId);
 if(!d)return info('SELECIONE UMA TROCA.');
 if(d.situacao==='CANCELADA')return info('TROCA JÁ CANCELADA. NÃO É POSSÍVEL REABRIR.');
 if(!['PENDENTE','BAIXADA'].includes(d.situacao))return info('SITUAÇÃO INVÁLIDA.');
 return autorizarCancelamento('TROCA',async (codigo,nome)=>{
 if(!await erpConfirm(d.situacao==='BAIXADA'?'CANCELAR A TROCA BAIXADA E ESTORNAR ESTOQUE, VENDA E MOVIMENTAÇÕES FINANCEIRAS?':'CANCELAR ESTA TROCA PENDENTE?'))return;
 if(d.situacao==='BAIXADA'){
  try{trCancelarBoletos(d);trFinanceReverse(d)}catch(e){return info(e.message)}
  const ps=produtos();
  for(const x of d.devolvidos){const p=ps.find(z=>String(z.codigo)===String(x.codigo));if(p&&d.condicao==='ESTOQUE')p.provisao=(+p.provisao||0)-Number(x.quantidade)}
  for(const x of d.novos){const p=ps.find(z=>String(z.codigo)===String(x.codigo));if(p)p.provisao=(+p.provisao||0)+Number(x.quantidade)}
  save(PK,ps);
  const venda=vendas.find(v=>Number(v.numero)===Number(d.venda));
  if(venda){venda.trocasAplicadas=(venda.trocasAplicadas||[]).filter(t=>Number(t.numero)!==Number(d.numero));venda.atualizadoEm=stamp();save(VK,vendas)}
 }
 d.situacao='CANCELADA';d.canceladaEm=stamp();trRegistrarHistorico(d,'CANCELAR');d.autorizacaoCancelamento={codigo,usuario:nome,data:d.canceladaEm};d.historicoUsuario[d.historicoUsuario.length-1].autorizadoPor=nome;save(TK,trocas);$('tr-status').value='CANCELADA';listT();atualizarPainel('tr',$('tr-code').value||d.novos[0]?.codigo);
 info('TROCA CANCELADA. ESTOQUE E VENDA RESTAURADOS. DEVOLUÇÃO FINANCEIRA PENDENTE PARA ESTORNO NO CAIXA.');
 });
}
async function reabrirT(){
 const d=trocas.find(x=>x.numero===trocaId);
 if(!d)return info('ABRA UMA TROCA NO HISTÓRICO PARA REABRIR.');
 if(d.situacao!=='CANCELADA')return info('SOMENTE TROCAS CANCELADAS PODEM SER REABERTAS.');
 if(!await erpConfirm('REABRIR A TROCA CANCELADA COMO PENDENTE? NÃO HAVERÁ MOVIMENTAÇÃO DE ESTOQUE OU FINANCEIRO ATÉ A BAIXA.'))return;
 d.situacao='PENDENTE';d.reabertaEm=stamp();trRegistrarHistorico(d,'REABRIR');save(TK,trocas);$('tr-status').value='PENDENTE';listT();info('TROCA REABERTA COMO PENDENTE.');
}
function carregarT(numero){
 const d=trocas.find(x=>x.numero===numero);if(!d)return info('TROCA NÃO ENCONTRADA.');
 newT();trocaId=d.numero;trocaAtual=vendas.find(x=>x.numero===d.venda)||null;novos=structuredClone(d.novos||[]);
 $('tr-sale').value=d.venda;$('tr-saleinfo').textContent='CLIENTE: '+d.cliente;
 $('tr-num').value=String(d.numero).padStart(6,'0');
 $('tr-status').value=(d.situacao||'BAIXADA');$('tr-user').value=d.usuario||'NÃO REGISTRADO';
 $('tr-reason').value=d.motivo||'';$('tr-condition').value=d.condicao||'ESTOQUE';$('tr-settle').value=d.acerto||'SEM';
 $('tr-returns').innerHTML=trocaAtual?trTabelaDevolvidos(trocaAtual,{},d.devolvidos||[],false):'<p>VENDA ORIGINAL NÃO ENCONTRADA.</p>';trVincularDevolvidos();
 $('tr-newitems').innerHTML=trTabelaNovos(d.novos||[],false);trVincularTabelaNovos(false);
 trDiscount=Number(d.desconto)||0;trExtra=Number(d.acrescimo)||0;trPayments=structuredClone(d.pagamentos||[]);trAtualizarCamposBoleto();trSetMoney('tr-discount',trDiscount);trSetMoney('tr-extra',trExtra);trSetMoney('tr-discount-pct',Math.abs(d.diferenca)?trDiscount/Math.abs(d.diferenca)*100:0);trSetMoney('tr-extra-pct',Math.abs(d.diferenca)?trExtra/Math.abs(d.diferenca)*100:0);trFinancial();
 if(d.situacao==='PENDENTE'&&trocaAtual){
  trEditando=true;
  const usados=trocas.filter(x=>Number(x.venda)===Number(d.venda)&&x.situacao!=='CANCELADA'&&Number(x.numero)!==Number(d.numero)).flatMap(x=>x.devolvidos||[]).reduce((a,x)=>{a[x.indice]=(a[x.indice]||0)+Number(x.quantidade||0);return a},{});
  $('tr-returns').innerHTML=trTabelaDevolvidos(trocaAtual,usados,d.devolvidos||[],true);trVincularDevolvidos();
  drawT();
 }else{trEditando=false;}
 atualizarPainel('tr',d.novos[0]?.codigo||'');
}
async function localizarT(){const valor=await erpPrompt('INFORME O NÚMERO DA TROCA:');if(valor===null)return;const n=Number(String(valor).trim());if(!Number.isInteger(n)||n<=0||!trocas.some(x=>Number(x.numero)===n))return info('TROCA NÃO ENCONTRADA.');carregarT(n)}
let trConsultaExecutada=false;
let trFiltroVenda='';
function selecionarVendaFiltroT(){
 const vendasUnicas=[...new Set(trocas.map(t=>String(t.venda||'').trim()))].filter(Boolean);
 const registros=vendasUnicas.map(n=>{
  const venda=vendas.find(v=>Number(v.numero)===Number(n));
  return {numero:n, data:venda?.data||'', cliente:venda?.cliente||'', total:Number(venda?.total??venda?.totalPagar??venda?.valorTotal??0), situacao:venda?.situacao||'BAIXADA'};
 }).sort((a,b)=>Number(b.numero)-Number(a.numero));
 const fundo=document.createElement('div');fundo.className='vt-modal-back vt-cliente-modal-back tr-sale-select-back tr-filter-select-back';
 fundo.innerHTML=`<div class="vt-cliente-dialog" role="dialog" aria-modal="true" aria-label="SELECIONAR VENDA BAIXADA"><div class="vt-cliente-head"><strong>SELECIONAR VENDA BAIXADA</strong><button type="button" data-fechar aria-label="Fechar">×</button></div><div class="vt-cliente-body"><div class="vt-cliente-filtros"><label>PESQUISAR POR<select data-tipo><option value="numero">NÚMERO DA VENDA</option><option value="cliente">CLIENTE</option></select></label><label>TEXTO DA PESQUISA<input data-busca type="search" placeholder="DIGITE PARA PESQUISAR..."></label><button type="button" data-pesquisar>PESQUISAR</button></div><div class="vt-cliente-tabela"><table><thead><tr><th>Nº DA VENDA</th><th>DATA</th><th>CLIENTE</th><th>VALOR TOTAL</th><th>SITUAÇÃO</th></tr></thead><tbody data-resultados><tr><td colspan="5">CLIQUE EM PESQUISAR PARA EXIBIR AS VENDAS BAIXADAS.</td></tr></tbody></table></div><div class="vt-cliente-rodape"><small>DÊ DOIS CLIQUES PARA SELECIONAR.</small><button type="button" data-cancelar>CANCELAR</button></div></div></div>`;
 const estilo=document.createElement('style');estilo.textContent=`.tr-filter-select-back{z-index:100011;display:flex;align-items:center;justify-content:center}.tr-filter-select-back .vt-cliente-dialog{width:min(960px,94vw);max-height:88vh;overflow:hidden;background:#fff;border-radius:12px;box-shadow:0 18px 55px #001b3960;color:#163e70;font-family:Arial,sans-serif}.tr-filter-select-back .vt-cliente-head{background:#245b9a;color:#fff;padding:20px;display:flex;justify-content:space-between;align-items:center;font-size:15px}.tr-filter-select-back .vt-cliente-head button{color:#fff;background:transparent;border:1px solid #ffffff80;border-radius:5px;font-size:25px;width:35px;height:35px;cursor:pointer}.tr-filter-select-back .vt-cliente-body{padding:20px}.tr-filter-select-back .vt-cliente-filtros{display:grid;grid-template-columns:180px minmax(180px,1fr) 100px;gap:6px;align-items:end}.tr-filter-select-back .vt-cliente-filtros label{font-size:11px;font-weight:800;color:#0b315e}.tr-filter-select-back .vt-cliente-filtros input,.tr-filter-select-back .vt-cliente-filtros select{display:block;width:100%;box-sizing:border-box;height:44px;margin-top:6px;border:1px solid #b9d0f4;border-radius:6px;padding:9px;font-size:13px}.tr-filter-select-back .vt-cliente-filtros button{height:42px;border:0;border-radius:5px;background:#205b9e;color:#fff;font-weight:bold;font-size:11px;cursor:pointer}.tr-filter-select-back .vt-cliente-tabela{margin-top:14px;max-height:43vh;overflow:auto}.tr-filter-select-back .vt-cliente-tabela table{border-collapse:collapse;width:100%;font-size:13px}.tr-filter-select-back .vt-cliente-tabela th{background:#193e72;color:#fff;padding:14px;text-align:left}.tr-filter-select-back .vt-cliente-tabela td{border-bottom:1px solid #c8d8ed;padding:13px}.tr-filter-select-back .vt-cliente-tabela tbody tr[data-venda]{cursor:pointer}.tr-filter-select-back .vt-cliente-tabela tbody tr[data-venda]:hover{background:#e9f2ff}.tr-filter-select-back .vt-cliente-rodape{display:flex;justify-content:space-between;align-items:center;margin-top:16px}.tr-filter-select-back .vt-cliente-rodape small{font-size:11px}.tr-filter-select-back .vt-cliente-rodape button{background:#e7f0ff;color:#18549c;border:1px solid #b7d0ff;border-radius:5px;padding:12px 18px;cursor:pointer}@media(max-width:680px){.tr-filter-select-back .vt-cliente-filtros{grid-template-columns:1fr 1fr}.tr-filter-select-back .vt-cliente-filtros button{grid-column:1/-1}}`;
 document.head.append(estilo);document.body.append(fundo);
 const fechar=()=>{document.removeEventListener('keydown',tecla,true);fundo.remove();estilo.remove()};
 const tecla=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();fechar()}};
 document.addEventListener('keydown',tecla,true);
 fundo.querySelector('[data-fechar]').onclick=fechar;fundo.querySelector('[data-cancelar]').onclick=fechar;
 const tbody=fundo.querySelector('[data-resultados]'),input=fundo.querySelector('[data-busca]'),tipo=fundo.querySelector('[data-tipo]');
 const escolher=numero=>{trFiltroVenda=numero;$('tr-filter-sale').value=numero?String(numero).padStart(6,'0'):'TODOS';fechar()};
 const pesquisar=()=>{
  const q=input.value.trim().toLocaleUpperCase('pt-BR');
  const achados=registros.filter(v=>(tipo.value==='numero'?String(v.numero).padStart(6,'0'):String(v.cliente)).toLocaleUpperCase('pt-BR').includes(q));
  tbody.innerHTML='';
  const todos=document.createElement('tr');todos.dataset.venda='';todos.innerHTML='<td colspan="5"><strong>TODOS</strong></td>';todos.ondblclick=()=>escolher('');tbody.append(todos);
  if(!achados.length){const tr=document.createElement('tr');tr.innerHTML='<td colspan="5">NENHUMA VENDA ENCONTRADA.</td>';tbody.append(tr);return}
  achados.forEach(v=>{const tr=document.createElement('tr');tr.dataset.venda=String(v.numero);tr.innerHTML=`<td>${esc(String(v.numero).padStart(6,'0'))}</td><td>${esc(v.data)}</td><td>${esc(v.cliente||'CLIENTE NÃO INFORMADO')}</td><td>${esc(money(v.total))}</td><td>${esc(v.situacao)}</td>`;tr.ondblclick=()=>escolher(v.numero);tbody.append(tr)});
 };
 fundo.querySelector('[data-pesquisar]').onclick=pesquisar;
 input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();pesquisar()}});
 input.focus();
}
function listT(executar=false){
 if(executar)trConsultaExecutada=true;
 const alvo=$('tr-list');if(!alvo)return;
 const dataInicio=$('tr-filter-start')?.value||'',dataFim=$('tr-filter-end')?.value||'';
 const filtradas=trConsultaExecutada?trocas.filter(x=>{
  if(trFiltroVenda&&String(Number(x.venda))!==String(Number(trFiltroVenda)))return false;
  const data=String(x.data||x.criadoEm||x.created||'').slice(0,10);
  let iso=data;
  if(/^\d{2}\/\d{2}\/\d{4}$/.test(data)){const [d,m,y]=data.split('/');iso=`${y}-${m}-${d}`}
  if(dataInicio&&(!iso||iso<dataInicio))return false;
  if(dataFim&&(!iso||iso>dataFim))return false;
  return true;
 }).slice().reverse():[];
 alvo.innerHTML=`<div class="vt-scroll"><table class="vt-table"><thead><tr><th>Nº</th><th>VENDA</th><th>CLIENTE</th><th>SITUAÇÃO</th><th>DIFERENÇA</th></tr></thead><tbody>${!trConsultaExecutada?'<tr><td colspan="5">CLIQUE EM PESQUISAR PARA CONSULTAR AS TROCAS.</td></tr>':filtradas.length?filtradas.map(x=>`<tr data-troca-num="${x.numero}" title="DÊ DOIS CLIQUES PARA ABRIR"><td>${String(x.numero).padStart(6,'0')}</td><td>${String(x.venda).padStart(6,'0')}</td><td>${esc(x.cliente||'')}</td><td>${esc(x.situacao||'BAIXADA')}</td><td>${money(x.diferenca)}</td></tr>`).join(''):'<tr><td colspan="5">NENHUMA TROCA ENCONTRADA.</td></tr>'}</tbody></table></div>`;
 alvo.querySelectorAll('[data-troca-num]').forEach(linha=>linha.ondblclick=()=>carregarT(+linha.dataset.trocaNum));
}
function printT(n){
 const d=trocas.find(x=>Number(x.numero)===Number(n||trocaId));
 if(!d)return info('GRAVE OU LOCALIZE A TROCA ANTES DE IMPRIMIR.');
 const venda=vendas.find(x=>Number(x.numero)===Number(d.venda));
 if(!venda)return info('VENDA ORIGINAL NÃO ENCONTRADA.');
 const cliente=clientes().find(x=>String(x.codigo??x.id)===String(venda.clienteId))||{};
 const registro=read('erp_matriz_lojas_v1',{});
 const lj=Array.isArray(registro)?registro[0]||{}:(registro.lojas||[])[0]||{};
 // Usa a mesma ordem de fontes de dados adotada pela impressão do Caixa.
 const dadosOficiais=read('erp_systems_dados_loja_v1',{});
 const lojaAtual=read('erp_matriz_loja',{});
 const lojaLegada=read('lucas_lima_loja',{});
 const nomeValido=valor=>typeof valor==='string'&&valor.trim()&&!/^(loja|loja não identificada)$/i.test(valor.trim())?valor.trim():'';
 const lojaNome=[dadosOficiais.nome,dadosOficiais.nomeFantasia,lj.nomeFantasia,lj.razaoSocial,lj.nome,lojaAtual.nomeFantasia,lojaAtual.nome,lojaLegada.nomeFantasia,lojaLegada.nome,document.querySelector('.topbar .store-company')?.textContent].map(nomeValido).find(Boolean)||'LOJA NÃO IDENTIFICADA';
 const numero=x=>String(x??'').padStart(6,'0');
 const data=x=>{const v=String(x||'');return /^\d{4}-\d{2}-\d{2}/.test(v)?v.slice(8,10)+'/'+v.slice(5,7)+'/'+v.slice(0,4):v};
 const fmt=x=>money(Number(x)||0);
 const escHtml=x=>esc(String(x??''));
 const linha=(nome,valor)=>`<div class="linha"><b>${escHtml(nome)}:</b> <span>${escHtml(valor||'—')}</span></div>`;
 const itens=(arr)=>arr.length?arr.map(x=>`<div class="item"><div>${escHtml(x.codigo||'')} — ${escHtml(x.descricao||'')}</div><div class="valores">${escHtml(x.quantidade||0)} × ${fmt(x.preco)} <b>${fmt((+x.quantidade||0)*(+x.preco||0))}</b></div></div>`).join(''):'<div>NENHUM PRODUTO</div>';
 const pagamentos=(d.pagamentos||[]).map(x=>`<div class="item">${escHtml(x.forma||x.descricao||'FORMA DE PAGAMENTO')}<div class="valores"><b>${fmt(x.valor)}</b></div>${x.identificacao||x.nsu||x.transactionId?linha('IDENTIFICAÇÃO / NSU',x.identificacao||x.nsu||x.transactionId):''}${Number(x.taxaValor||x.valorTaxa||0)?linha('TAXA DA LOJA',fmt(x.taxaValor||x.valorTaxa)):''}</div>`).join('')||'<div>NENHUM PAGAMENTO INFORMADO</div>';
 const cpf=cliente.cpf||cliente.cpfCnpj||cliente.documento||venda.cpf||'';
 const agora=new Date();const emitido=agora.toLocaleDateString('pt-BR');
 const usuario=usuarioAtual();
 const corpo=`<div class="loja">${escHtml(lojaNome)}</div><div class="titulo">COMPROVANTE DE TROCA</div><section>${linha('TROCA Nº',numero(d.numero))}${linha('VENDA Nº',numero(d.venda))}${linha('DATA',data(d.data))}${linha('CLIENTE',cliente.nome||venda.cliente||d.cliente)}${linha('CPF',cpf)}${linha('VENDEDOR',nomeVendedorHistorico(venda)||'—')}</section><section><h2>PRODUTOS DEVOLVIDOS</h2>${itens(d.devolvidos||[])}${linha('TOTAL DEVOLVIDO',fmt(d.valorDevolvido))}</section><section><h2>PRODUTOS NOVOS</h2>${itens(d.novos||[])}${linha('TOTAL NOVO',fmt(d.valorNovo))}</section><section><h2>ACERTO FINANCEIRO</h2>${linha('DESCONTO',fmt(d.desconto))}${linha('ACRÉSCIMO',fmt(d.acrescimo))}<div class="destaque">${escHtml(d.acerto==='DEVOLUCAO'?'DEVOLVER AO CLIENTE':d.acerto==='PAGAMENTO'?'RECEBER DO CLIENTE':'SEM DIFERENÇA')}: ${fmt(d.totalAcerto??Math.abs(d.diferenca||0))}</div>${pagamentos}</section><section>${linha('MOTIVO',d.motivo||'—')}${linha('SITUAÇÃO',d.situacao||'PENDENTE')}</section><footer>EMITIDO EM ${escHtml(emitido)}, POR ${escHtml(usuario)}.</footer>`;
 const criarCss=(largura)=>`@page{size:${largura}mm auto;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:white;color:#111}body{width:${largura}mm;max-width:${largura}mm;padding:1.5mm 1.5mm 3mm;font:${largura===40?8:largura===56?9:10}px/1.3 Arial,sans-serif;overflow-wrap:anywhere}.loja,.titulo{text-align:center;font-weight:700}.loja{font-size:10px}.titulo{font-size:9px;margin:5px 0}section{border-top:1px dashed #444;padding:5px 0;break-inside:avoid}h2{font-size:9px;margin:0 0 4px}.linha{margin:3px 0}.linha span{overflow-wrap:anywhere}.item{margin:5px 0}.valores{display:flex;justify-content:space-between;gap:3px;margin-top:2px}.destaque{font-weight:bold;border-top:1px solid #333;padding-top:4px;margin-top:5px}footer{border-top:1px dashed #444;text-align:center;font-size:7px;padding-top:6px}`;
 const criarDocumento=(largura)=>`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="receipt-width-mm" content="${largura}"><title>TROCA ${numero(d.numero)}</title><style>${criarCss(largura)}</style></head><body>${corpo}</body></html>`;
 let larguraSelecionada=80;
 document.getElementById('ll-troca-preview')?.remove();
 const fundo=document.createElement('div');fundo.id='ll-troca-preview';fundo.style.cssText='position:fixed;inset:0;z-index:2147483600;background:#001b3cbb;display:flex;align-items:center;justify-content:center;padding:18px;font-family:Arial,sans-serif';
 fundo.innerHTML=`<div role="dialog" aria-modal="true" aria-label="IMPRIMIR TROCA" style="width:min(1100px,96vw);height:min(720px,92vh);background:#fff;border-radius:10px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 12px 40px #0004"><header style="background:#194b88;color:white;padding:18px 22px;display:flex;justify-content:space-between;align-items:center;font-weight:bold">IMPRIMIR TROCA <button data-fechar style="border:0;background:transparent;color:white;font-size:24px;cursor:pointer">×</button></header><div style="display:grid;grid-template-columns:minmax(200px,1fr) minmax(260px,1.25fr);gap:16px;padding:16px;flex:1;min-height:0;overflow:auto"><div style="border:1px solid #cbd9ec;border-radius:6px;padding:14px"><div style="background:#e5effb;padding:12px;color:#194b88;font-weight:bold;font-size:13px">DADOS DA TROCA</div><p><b>TROCA Nº:</b> ${numero(d.numero)}</p><p><b>VENDA Nº:</b> ${numero(d.venda)}</p><p><b>SITUAÇÃO:</b> ${escHtml(d.situacao||'PENDENTE')}</p><div style="background:#e5effb;padding:12px;color:#194b88;font-weight:bold;font-size:13px">FORMATO DA IMPRESSÃO</div><p style="font-size:13px;color:#52677f">SELECIONE A LARGURA DA BOBINA:</p><div style="display:flex;gap:8px;flex-wrap:wrap">${[40,56,80].map(mm=>`<label style="padding:9px 12px;border:1px solid #b5cbe6;border-radius:5px;cursor:pointer;font-weight:bold"><input type="radio" name="largura-troca" value="${mm}" ${mm===80?'checked':''}> ${mm} MM</label>`).join('')}</div><p style="font-size:13px;color:#52677f">Comprimento automático conforme o conteúdo.</p></div><div style="border:1px solid #cbd9ec;border-radius:6px;padding:14px;display:flex;flex-direction:column;min-height:350px"><div style="background:#e5effb;padding:12px;color:#194b88;font-weight:bold;font-size:13px">PRÉ-VISUALIZAÇÃO — BOBINA <span data-largura-label>80</span> MM</div><div style="flex:1;overflow:auto;background:#f1f4f8;display:flex;justify-content:center;align-items:flex-start;padding:16px"><iframe title="Pré-visualização da troca" style="width:80mm;min-width:80mm;height:100%;min-height:350px;background:#fff;border:1px solid #ccd5df;box-shadow:0 2px 8px #0002" sandbox="allow-same-origin allow-modals"></iframe></div></div></div><div style="border-top:1px solid #dce4ef;padding:12px 18px;display:flex;justify-content:flex-end;gap:10px"><button data-imprimir style="background:#1961cb;color:#fff;border:0;border-radius:5px;padding:12px 23px;cursor:pointer;font-weight:bold">IMPRIMIR</button><button data-salvar style="background:#009d79;color:#fff;border:0;border-radius:5px;padding:12px 23px;cursor:pointer;font-weight:bold">SALVAR</button><button data-fechar style="background:#e5effb;color:#174576;border:1px solid #b5cbe6;border-radius:5px;padding:12px 23px;cursor:pointer">FECHAR</button></div></div>`;
 document.body.appendChild(fundo);
 const iframe=fundo.querySelector('iframe');
 const atualizarLargura=()=>{iframe.style.width=larguraSelecionada+'mm';iframe.style.minWidth=larguraSelecionada+'mm';iframe.srcdoc=criarDocumento(larguraSelecionada);fundo.querySelector('[data-largura-label]').textContent=larguraSelecionada;};
 fundo.querySelectorAll('input[name="largura-troca"]').forEach(r=>r.onchange=()=>{larguraSelecionada=Number(r.value);atualizarLargura()});
 atualizarLargura();
 const fechar=()=>fundo.remove();fundo.querySelectorAll('[data-fechar]').forEach(b=>b.onclick=fechar);
 const imprimir=()=>{
  // Imprime o documento exibido na pré-visualização, sem baixar arquivos.
  // A chamada deve ocorrer diretamente no clique para o Chrome abrir seu diálogo.
  const frameWindow=iframe.contentWindow;
  if(!frameWindow){info('NÃO FOI POSSÍVEL ABRIR A JANELA DE IMPRESSÃO.');return}
  try{
   frameWindow.focus();
   frameWindow.print();
  }catch(e){info('NÃO FOI POSSÍVEL ABRIR A IMPRESSÃO: '+(e.message||e))}
 };
 fundo.querySelector('[data-imprimir]').onclick=imprimir;
 fundo.querySelector('[data-salvar]').onclick=async()=>{
  try{
   await window.LucasTrocaSalvarPDF(criarDocumento(larguraSelecionada),`TROCA_${numero(d.numero)}_${larguraSelecionada}MM.pdf`);
  }catch(e){info('NÃO FOI POSSÍVEL SALVAR O PDF: '+(e.message||e))}
 };

}
function voltarVendaAposCadastro(codigo,tipo="cliente"){
 const estado=window.LL_vendaRetornoCadastro;
 layoutV();
 if(estado){
  itens=estado.itens;pagamentos=estado.pagamentos;atual=estado.atual;
  estado.campos.forEach(c=>{const el=document.getElementById(c.id);if(el){el.value=c.value;if(el.type==='checkbox')el.checked=c.checked}});
  // Reconstituir a visualização dos itens e pagamentos com os dados preservados.
  drawV();
  window.LL_vendaRetornoCadastro=null;
 }
 if(tipo==='motorista')selecionarMotorista();else selecionarCadastro(tipo);
 if(codigo){
  const busca=document.querySelector('.vt-cliente-modal-back [data-busca]');
  const tipo=document.querySelector('.vt-cliente-modal-back [data-tipo]');
  if(busca&&tipo){tipo.value=tipo.options.namedItem('id')?'id':'id';busca.value=String(codigo);document.querySelector('.vt-cliente-modal-back [data-pesquisar]')?.click()}
 }
}
window.addEventListener('ll-voltar-vendas-cadastro-vendedor',()=>{if(window.LL_cadastroMotoristaDaVenda){window.LL_cadastroMotoristaDaVenda=false;voltarVendaAposCadastro(null,'motorista')}else voltarVendaAposCadastro(null,'vendedor')});
window.addEventListener('ll-voltar-vendas-cadastro-cliente',()=>voltarVendaAposCadastro(null));
window.addEventListener('ll-cliente-cadastrado-venda',e=>{
  voltarVendaAposCadastro(e.detail?.codigo);
});
const prev=open;open=function(name){if(name==='VENDAS')return layoutV();if(name==='TROCAS')return layoutT();return prev(name)};
document.addEventListener('keydown',e=>{if(!['VENDAS','TROCAS'].includes(screen)||e.ctrlKey||e.altKey||e.metaKey||!/^F(1|2|3|4|6|7|8|12)$/.test(e.key))return;if(document.querySelector('.vt-modal-back, [role=dialog]'))return;e.preventDefault();e.stopImmediatePropagation();if(screen==='TROCAS'){({F1:atalhosTrocas,F2:baixarT,F3:cancelarT,F12:localizarT})[e.key]?.();return}({F1:atalhosVendas,F2:closeV,F3:cancelV,F12:findV})[e.key]?.()},true);
window.LLopenSaleFromDRE=n=>{const d=vendas.find(x=>String(x.numero)===String(n));if(!d)return false;layoutV();loadV(Number(d.numero));return true};window.LLopenTradeFromDRE=n=>{const d=trocas.find(x=>String(x.numero)===String(n));if(!d)return false;layoutT();carregarT(Number(d.numero));return true};
window.LLopenSaleFromStock=n=>{const d=vendas.find(x=>Number(x.numero)===Number(n));if(!d)return false;layoutV();loadV(Number(n));return true};window.LLopenTradeFromStock=n=>{const d=trocas.find(x=>Number(x.numero)===Number(n));if(!d)return false;layoutT();carregarT(Number(n));return true};
})();