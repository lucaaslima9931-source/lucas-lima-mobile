/* LUCAS LIMA — Cadastro de usuários e permissões configuráveis.
   ATENÇÃO: armazenamento local não é autenticação nem controle de acesso seguro. */
(()=>{'use strict';
const KEY='erp_matriz_usuarios_v1', RH='erp_matriz_rh_v1';
const $=id=>document.getElementById(id);
const escapeHTML=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const groups={
 "PRODUTOS": ["Acessar módulo: PRODUTOS", "Consultar produtos", "Cadastrar produtos", "Alterar produtos", "Inativar produtos", "Visualizar custo e lucro", "Alterar preços", "Cadastrar promoções", "Alterar promoções", "Cancelar promoções", "Imprimir etiquetas", "Consultar histórico de preços", "Consultar — PRODUTOS", "Novo — PRODUTOS", "Gravar — PRODUTOS", "Alterar — PRODUTOS", "Excluir — PRODUTOS", "Imprimir — PRODUTOS", "Inativar — PRODUTOS", "Alterar preços — PRODUTOS", "Consultar custos — PRODUTOS", "Visualizar estoque — PRODUTOS"],
 "CLIENTES": ["Acessar módulo: CLIENTES", "Consultar clientes", "Cadastrar clientes", "Alterar clientes", "Inativar clientes", "Consultar extratos", "Imprimir extratos de clientes", "Consultar — CLIENTES", "Novo — CLIENTES", "Gravar — CLIENTES", "Alterar — CLIENTES", "Excluir — CLIENTES", "Imprimir — CLIENTES"],
 "FORNECEDORES": ["Acessar módulo: FORNECEDORES", "Consultar fornecedores", "Cadastrar fornecedores", "Alterar fornecedores", "Inativar fornecedores", "Consultar extratos de fornecedores", "Imprimir extratos de fornecedores", "Consultar — FORNECEDORES", "Novo — FORNECEDORES", "Gravar — FORNECEDORES", "Alterar — FORNECEDORES", "Excluir — FORNECEDORES", "Imprimir — FORNECEDORES"],
 "MARCAS": ["Acessar módulo: MARCAS", "Consultar — MARCAS", "Novo — MARCAS", "Gravar — MARCAS", "Alterar — MARCAS", "Excluir — MARCAS", "Imprimir — MARCAS"],
 "CATEGORIAS": ["Acessar módulo: CATEGORIAS", "Consultar — CATEGORIAS", "Novo — CATEGORIAS", "Gravar — CATEGORIAS", "Alterar — CATEGORIAS", "Excluir — CATEGORIAS", "Imprimir — CATEGORIAS"],
 "UNIDADES": ["Acessar módulo: UNIDADES", "Consultar — UNIDADES", "Novo — UNIDADES", "Gravar — UNIDADES", "Alterar — UNIDADES", "Excluir — UNIDADES", "Imprimir — UNIDADES"],
 "FUNCIONÁRIOS": ["Acessar módulo: FUNCIONÁRIOS", "Consultar dados de funcionários", "Cadastrar funcionários", "Alterar funcionários", "Consultar salários", "Lançar faltas e vales", "Consultar atestados", "Consultar comissões", "Alterar comissões", "Consultar — FUNCIONÁRIOS", "Novo — FUNCIONÁRIOS", "Gravar — FUNCIONÁRIOS", "Alterar — FUNCIONÁRIOS", "Excluir — FUNCIONÁRIOS", "Imprimir — FUNCIONÁRIOS", "Inativar — FUNCIONÁRIOS", "Consultar histórico — FUNCIONÁRIOS"],
 "USUÁRIOS": ["Acessar módulo: USUÁRIOS", "Gerenciar usuários", "Configurar permissões", "Consultar histórico de acessos", "Consultar — USUÁRIOS", "Novo — USUÁRIOS", "Gravar — USUÁRIOS", "Alterar — USUÁRIOS", "Excluir — USUÁRIOS", "Imprimir — USUÁRIOS", "Configurar permissões — USUÁRIOS", "Alterar senha — USUÁRIOS"],
 "FORMAS DE PAGAMENTO": ["Acessar módulo: FORMAS DE PAGAMENTO", "Configurar pagamentos", "Alterar taxas de cartão", "Consultar — FORMAS DE PAGAMENTO", "Novo — FORMAS DE PAGAMENTO", "Gravar — FORMAS DE PAGAMENTO", "Alterar — FORMAS DE PAGAMENTO", "Excluir — FORMAS DE PAGAMENTO", "Imprimir — FORMAS DE PAGAMENTO", "Alterar taxas — FORMAS DE PAGAMENTO", "Consultar histórico — FORMAS DE PAGAMENTO"],
 "CADASTRO DA LOJA": ["Acessar módulo: CADASTRO DA LOJA", "Consultar — CADASTRO DA LOJA", "Novo — CADASTRO DA LOJA", "Gravar — CADASTRO DA LOJA", "Alterar — CADASTRO DA LOJA", "Excluir — CADASTRO DA LOJA", "Imprimir — CADASTRO DA LOJA"],
 "VENDEDORES": ["Acessar módulo: VENDEDORES", "Consultar vendedores", "Cadastrar vendedores", "Alterar vendedores", "Consultar metas", "Consultar extratos de vendedores", "Consultar — VENDEDORES", "Novo — VENDEDORES", "Gravar — VENDEDORES", "Alterar — VENDEDORES", "Excluir — VENDEDORES", "Imprimir — VENDEDORES"],
 "VENDAS": ["Acessar módulo: VENDAS", "Consultar vendas", "Criar vendas", "Alterar vendas", "Selecionar vendedor", "Baixar vendas", "Cancelar vendas", "Reabrir vendas", "Conceder descontos", "Alterar preço na venda", "Imprimir vendas", "Consultar vendas de outros vendedores", "Consultar — VENDAS", "Novo — VENDAS", "Gravar — VENDAS", "Alterar — VENDAS", "Excluir — VENDAS", "Imprimir — VENDAS", "Baixar — VENDAS", "Cancelar — VENDAS", "Reabrir — VENDAS", "Conceder descontos — VENDAS", "Alterar preço — VENDAS", "Gerar romaneio — VENDAS", "Imprimir romaneio — VENDAS", "Estornar — VENDAS"],
 "ORÇAMENTOS": ["Acessar módulo: ORÇAMENTOS", "Consultar — ORÇAMENTOS", "Novo — ORÇAMENTOS", "Gravar — ORÇAMENTOS", "Alterar — ORÇAMENTOS", "Excluir — ORÇAMENTOS", "Imprimir — ORÇAMENTOS", "Gerar — ORÇAMENTOS", "Cancelar — ORÇAMENTOS", "Reabrir — ORÇAMENTOS"],
 "TROCAS": ["Acessar módulo: TROCAS", "Consultar — TROCAS", "Novo — TROCAS", "Gravar — TROCAS", "Alterar — TROCAS", "Excluir — TROCAS", "Imprimir — TROCAS"],
 "CAIXA": ["Acessar módulo: CAIXA", "Abrir caixa", "Fechar caixa", "Movimentar caixa", "Consultar fechamento de outros caixas", "Consultar — CAIXA", "Novo — CAIXA", "Gravar — CAIXA", "Alterar — CAIXA", "Excluir — CAIXA", "Imprimir — CAIXA", "Abrir — CAIXA", "Fechar — CAIXA", "Sangria — CAIXA", "Receber — CAIXA", "Estornar — CAIXA", "Transferir — CAIXA"],
 "RECEBIMENTOS": ["Acessar módulo: RECEBIMENTOS", "Receber pagamentos de vendas", "Estornar recebimentos", "Consultar — RECEBIMENTOS", "Novo — RECEBIMENTOS", "Gravar — RECEBIMENTOS", "Alterar — RECEBIMENTOS", "Excluir — RECEBIMENTOS", "Imprimir — RECEBIMENTOS", "Receber — RECEBIMENTOS", "Estornar — RECEBIMENTOS", "Baixar — RECEBIMENTOS"],
 "FICHA DE ESTOQUE": ["Acessar módulo: FICHA DE ESTOQUE", "Consultar estoque", "Consultar — FICHA DE ESTOQUE", "Novo — FICHA DE ESTOQUE", "Gravar — FICHA DE ESTOQUE", "Alterar — FICHA DE ESTOQUE", "Excluir — FICHA DE ESTOQUE", "Imprimir — FICHA DE ESTOQUE"],
 "ACERTO DE ESTOQUE": ["Acessar módulo: ACERTO DE ESTOQUE", "Ajustar estoque", "Consultar — ACERTO DE ESTOQUE", "Novo — ACERTO DE ESTOQUE", "Gravar — ACERTO DE ESTOQUE", "Alterar — ACERTO DE ESTOQUE", "Excluir — ACERTO DE ESTOQUE", "Imprimir — ACERTO DE ESTOQUE", "Baixar — ACERTO DE ESTOQUE", "Cancelar — ACERTO DE ESTOQUE", "Reabrir — ACERTO DE ESTOQUE"],
 "AVARIADOS": ["Acessar módulo: AVARIADOS", "Consultar — AVARIADOS", "Novo — AVARIADOS", "Gravar — AVARIADOS", "Alterar — AVARIADOS", "Excluir — AVARIADOS", "Imprimir — AVARIADOS", "Baixar — AVARIADOS", "Cancelar — AVARIADOS", "Reabrir — AVARIADOS"],
 "ESTOQUE MÍNIMO": ["Acessar módulo: ESTOQUE MÍNIMO", "Consultar — ESTOQUE MÍNIMO", "Novo — ESTOQUE MÍNIMO", "Gravar — ESTOQUE MÍNIMO", "Alterar — ESTOQUE MÍNIMO", "Excluir — ESTOQUE MÍNIMO", "Imprimir — ESTOQUE MÍNIMO"],
 "SAÍDAS DE ESTOQUE": ["Acessar módulo: SAÍDAS DE ESTOQUE", "Movimentar estoque", "Consultar — SAÍDAS DE ESTOQUE", "Novo — SAÍDAS DE ESTOQUE", "Gravar — SAÍDAS DE ESTOQUE", "Alterar — SAÍDAS DE ESTOQUE", "Excluir — SAÍDAS DE ESTOQUE", "Imprimir — SAÍDAS DE ESTOQUE", "Baixar — SAÍDAS DE ESTOQUE", "Cancelar — SAÍDAS DE ESTOQUE", "Reabrir — SAÍDAS DE ESTOQUE"],
 "ENTRADAS DE ESTOQUE": ["Acessar módulo: ENTRADAS DE ESTOQUE", "Cadastrar entradas", "Alterar entradas", "Excluir entradas", "Consultar histórico de entradas", "Consultar — ENTRADAS DE ESTOQUE", "Novo — ENTRADAS DE ESTOQUE", "Gravar — ENTRADAS DE ESTOQUE", "Alterar — ENTRADAS DE ESTOQUE", "Excluir — ENTRADAS DE ESTOQUE", "Imprimir — ENTRADAS DE ESTOQUE", "Baixar — ENTRADAS DE ESTOQUE", "Cancelar — ENTRADAS DE ESTOQUE", "Reabrir — ENTRADAS DE ESTOQUE"],
 "PEDIDOS DE COMPRAS": ["Acessar módulo: PEDIDOS DE COMPRAS", "Consultar compras", "Consultar custos de compra", "Consultar — PEDIDOS DE COMPRAS", "Novo — PEDIDOS DE COMPRAS", "Gravar — PEDIDOS DE COMPRAS", "Alterar — PEDIDOS DE COMPRAS", "Excluir — PEDIDOS DE COMPRAS", "Imprimir — PEDIDOS DE COMPRAS", "Baixar — PEDIDOS DE COMPRAS", "Cancelar — PEDIDOS DE COMPRAS", "Reabrir — PEDIDOS DE COMPRAS"],
 "CONTAS A RECEBER": ["Acessar módulo: CONTAS A RECEBER", "Receber contas", "Registrar recebimentos parciais", "Consultar — CONTAS A RECEBER", "Novo — CONTAS A RECEBER", "Gravar — CONTAS A RECEBER", "Alterar — CONTAS A RECEBER", "Excluir — CONTAS A RECEBER", "Imprimir — CONTAS A RECEBER", "Receber — CONTAS A RECEBER", "Baixar — CONTAS A RECEBER", "Cancelar — CONTAS A RECEBER", "Reabrir — CONTAS A RECEBER"],
 "CONTAS A PAGAR": ["Acessar módulo: CONTAS A PAGAR", "Pagar contas", "Registrar pagamentos parciais", "Consultar — CONTAS A PAGAR", "Novo — CONTAS A PAGAR", "Gravar — CONTAS A PAGAR", "Alterar — CONTAS A PAGAR", "Excluir — CONTAS A PAGAR", "Imprimir — CONTAS A PAGAR", "Pagar — CONTAS A PAGAR", "Baixar — CONTAS A PAGAR", "Cancelar — CONTAS A PAGAR", "Reabrir — CONTAS A PAGAR"],
 "FINANCEIRO": ["Acessar módulo: FINANCEIRO", "Consultar financeiro", "Consultar saldos", "Alterar lançamentos financeiros", "Excluir lançamentos financeiros", "Consultar — FINANCEIRO", "Novo — FINANCEIRO", "Gravar — FINANCEIRO", "Alterar — FINANCEIRO", "Excluir — FINANCEIRO", "Imprimir — FINANCEIRO", "Transferir — FINANCEIRO", "Estornar — FINANCEIRO", "Baixar — FINANCEIRO"],
 "CENTRO DE CUSTOS": ["Acessar módulo: CENTRO DE CUSTOS", "Consultar — CENTRO DE CUSTOS", "Novo — CENTRO DE CUSTOS", "Gravar — CENTRO DE CUSTOS", "Alterar — CENTRO DE CUSTOS", "Excluir — CENTRO DE CUSTOS", "Imprimir — CENTRO DE CUSTOS"],
 "FOLHA DE PAGAMENTO": ["Acessar módulo: FOLHA DE PAGAMENTO", "Gerar folha", "Aprovar folha", "Pagar funcionários", "Consultar — FOLHA DE PAGAMENTO", "Novo — FOLHA DE PAGAMENTO", "Gravar — FOLHA DE PAGAMENTO", "Alterar — FOLHA DE PAGAMENTO", "Excluir — FOLHA DE PAGAMENTO", "Imprimir — FOLHA DE PAGAMENTO", "Gerar folha — FOLHA DE PAGAMENTO", "Gravar folha — FOLHA DE PAGAMENTO", "Alterar folha — FOLHA DE PAGAMENTO", "Baixar folha — FOLHA DE PAGAMENTO", "Cancelar folha — FOLHA DE PAGAMENTO", "Imprimir folha — FOLHA DE PAGAMENTO", "Pagar funcionários — FOLHA DE PAGAMENTO"],
 "RELATÓRIOS": ["Acessar módulo: RELATÓRIOS", "Consultar relatórios", "Relatório de vendas", "Relatório de estoque", "Relatório de lucro", "Relatório de vendedores", "Imprimir relatórios", "Exportar relatórios", "Consultar — RELATÓRIOS", "Novo — RELATÓRIOS", "Gravar — RELATÓRIOS", "Alterar — RELATÓRIOS", "Excluir — RELATÓRIOS", "Imprimir — RELATÓRIOS"],
 "DRE": ["Acessar módulo: DRE", "Consultar relatórios financeiros", "Relatório financeiro", "Consultar — DRE", "Novo — DRE", "Gravar — DRE", "Alterar — DRE", "Excluir — DRE", "Imprimir — DRE"],
 "LISTAGENS": ["Acessar módulo: LISTAGENS", "Consultar — LISTAGENS", "Novo — LISTAGENS", "Gravar — LISTAGENS", "Alterar — LISTAGENS", "Excluir — LISTAGENS", "Imprimir — LISTAGENS"],
 "CONFIGURAÇÕES": ["Acessar módulo: CONFIGURAÇÕES", "Fazer backup", "Restaurar backup", "Alterar configurações do sistema", "Consultar — CONFIGURAÇÕES", "Novo — CONFIGURAÇÕES", "Gravar — CONFIGURAÇÕES", "Alterar — CONFIGURAÇÕES", "Excluir — CONFIGURAÇÕES", "Imprimir — CONFIGURAÇÕES"]
};
const ALL=Object.values(groups).flat();
const preset={
 "ADMINISTRADOR":ALL,
 "GERENTE":[
 "Consultar produtos",
 "Cadastrar produtos",
 "Alterar produtos",
 "Alterar preços",
 "Cadastrar promoções",
 "Consultar clientes",
 "Cadastrar clientes",
 "Alterar clientes",
 "Consultar extratos",
 "Consultar fornecedores",
 "Cadastrar fornecedores",
 "Alterar fornecedores",
 "Consultar extratos de fornecedores",
 "Consultar vendas",
 "Criar vendas",
 "Alterar vendas",
 "Selecionar vendedor",
 "Baixar vendas",
 "Cancelar vendas",
 "Conceder descontos",
 "Consultar estoque",
 "Movimentar estoque",
 "Cadastrar entradas",
 "Consultar compras",
 "Consultar relatórios",
 "Relatório de vendas",
 "Relatório de estoque"
],
 "VENDEDOR":[
 "Consultar produtos",
 "Consultar clientes",
 "Cadastrar clientes",
 "Consultar vendas",
 "Criar vendas",
 "Selecionar vendedor",
 "Consultar estoque"
],
 "CAIXA":[
 "Consultar produtos",
 "Consultar clientes",
 "Consultar vendas",
 "Baixar vendas",
 "Receber pagamentos de vendas",
 "Abrir caixa",
 "Fechar caixa"
],
 "ESTOQUISTA":[
 "Consultar produtos",
 "Cadastrar produtos",
 "Alterar produtos",
 "Consultar estoque",
 "Movimentar estoque",
 "Cadastrar entradas",
 "Consultar compras",
 "Imprimir etiquetas"
],
 "FINANCEIRO":[
 "Consultar clientes",
 "Consultar extratos",
 "Consultar fornecedores",
 "Consultar extratos de fornecedores",
 "Consultar vendas",
 "Consultar financeiro",
 "Consultar saldos",
 "Receber contas",
 "Pagar contas",
 "Registrar pagamentos parciais",
 "Registrar recebimentos parciais",
 "Consultar relatórios financeiros",
 "Relatório financeiro"
],
 "PERSONALIZADO":[]
};
let db;try{db=JSON.parse(localStorage.getItem(KEY)||'null')}catch{};
if(!db||!Array.isArray(db.usuarios))db={usuarios:[]};
let selected=null,permissions=new Set(preset.VENDEDOR);
const notify=msg=>{const el=$('us-message');if(el){el.textContent=msg;el.hidden=false;el.scrollIntoView({behavior:'instant',block:'start'});}};
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(db));return true}catch{notify('Não foi possível salvar os dados no navegador.');return false}};
const next=()=>Math.max(0,...db.usuarios.map(u=>Number(u.id)||0))+1;
const btn=(id,label,color)=>`<button type="button" id="${id}" class="action-button ${color}">${label}</button>`;
function employees(){try{const x=JSON.parse(localStorage.getItem(RH)||'{}');return (x.funcionarios||[]).filter(f=>f.situacao==='ATIVO')}catch{return []}}
const RH_OPTIONS='lucas_lima_rh_opcoes_v1';
function registeredRoles(){
 const names=new Set();
 try{const raw=JSON.parse(localStorage.getItem(RH_OPTIONS)||'{}');
   for(const item of (raw.cargo||[])){
     if(typeof item==='string'&&item.trim())names.add(item.trim().toUpperCase());
     else if(item&&item.situacao!=='INATIVO'){
       const label=String(item.nome||item.descricao||item.valor||'').trim().toUpperCase();if(label)names.add(label);
     }
   }
 }catch{}
 for(const f of employees()){const name=String(f.cargo||'').trim().toUpperCase();if(name)names.add(name)}
 return [...names].sort((a,b)=>a.localeCompare(b,'pt-BR'));
}
function defaultPermissionsForRole(role){
 const r=String(role||'').toUpperCase();
 if(r==='ADMINISTRADOR')return ALL;
 if(/GERENTE|SUPERVISOR/.test(r))return preset.GERENTE;
 if(/VENDEDOR|VENDEDORA|VENDAS/.test(r))return preset.VENDEDOR;
 if(/CAIXA/.test(r))return preset.CAIXA;
 if(/ESTOQUE|ALMOXARIF/.test(r))return preset.ESTOQUISTA;
 if(/FINANCEIR|COBRADOR|COBRAN/.test(r))return preset.FINANCEIRO;
 return [];
}
function refreshRegisteredRoles(selectedRole){
 const select=$('us-role');if(!select)return;
 const own=$('us-link')?.value==='PROPRIETARIO';
 const roles=own?['ADMINISTRADOR']:registeredRoles();
 if(selectedRole&&!roles.includes(selectedRole))roles.push(selectedRole);
 select.replaceChildren();
 if(!own){const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='SELECIONE';select.append(placeholder)}
 for(const role of roles){const option=document.createElement('option');option.value=role;option.textContent=role;select.append(option)}
 select.value=selectedRole&&roles.includes(selectedRole)?selectedRole:(own?'ADMINISTRADOR':'');
}
function selectEmployeeRole(f){
 const role=String(f?.cargo||'').trim().toUpperCase();
 refreshRegisteredRoles(role);
 permissions=new Set(defaultPermissionsForRole(role));renderPermissions();
}
function sessionUser(){try{const s=JSON.parse(sessionStorage.getItem('erp_systems_demo_session')||'{}');return s.nome||s.name||'DEMONSTRAÇÃO'}catch{return 'DEMONSTRAÇÃO'}}
function page(){screen='USUÁRIOS';root().replaceChildren();const section=document.createElement('section');section.className='us-page';section.innerHTML=`<div class="us-head"><h1>CADASTRO DE USUÁRIOS</h1><button type="button" id="us-shortcuts" class="action-button blue">ATALHOS</button></div><p id="us-message" class="us-message" hidden></p><div class="us-card"><h2>DADOS DO USUÁRIO</h2><div class="us-fields"><label>CÓDIGO<input id="us-code" readonly></label><label>LOGIN AUTOMÁTICO<input id="us-login" readonly></label><label>NOME DO USUÁRIO *<input id="us-name" maxlength="100" autocomplete="off"></label><label>VÍNCULO<select id="us-link"><option value="PROPRIETARIO">PROPRIETÁRIO / ADMINISTRADOR</option><option value="FUNCIONARIO">FUNCIONÁRIO</option></select></label><label>FUNCIONÁRIO <div class="us-employee-row"><input id="us-employee-name" readonly placeholder="Selecione pelo +"><button type="button" id="us-employee-plus" class="action-button blue">+</button></div></label><label>PERFIL DE ACESSO<select id="us-role"></select></label><label>SENHA <div class="us-password-row"><input id="us-password" type="password" autocomplete="new-password" placeholder="Nova senha"><button type="button" id="us-eye" class="us-eye">◉</button></div></label><label>CONFIRMAR SENHA<input id="us-confirm" type="password" autocomplete="new-password" placeholder="Repita a senha"></label><label>SITUAÇÃO<select id="us-status"><option>ATIVO</option><option>INATIVO</option></select></label><label class="us-wide">OBSERVAÇÕES<textarea id="us-notes" rows="2"></textarea></label><label>USUÁRIO<input id="us-audit" readonly></label></div><p class="us-note">A senha fica oculta. Ao alterar um usuário, deixe os campos de senha vazios para mantê-la. Este sistema local é uma demonstração: permissões e autenticação não são segurança de servidor.</p></div><div class="us-card"><div class="us-row"><h2>PERMISSÕES DO USUÁRIO</h2><span id="us-count"></span></div><div class="us-permission-toolbar"><label>LIMITE MÁXIMO DE DESCONTO (%)<input id="us-discount-limit" type="number" min="0" max="100" step="0.01" value="0"></label><div class="us-toolbar-buttons">${btn('us-reset','RESTAURAR PADRÃO','slate')}${btn('us-all','MARCAR TODAS','blue')}${btn('us-none','DESMARCAR TODAS','orange')}</div></div><div id="us-permissions" class="us-permissions"></div></div><div class="us-actions us-bottom">${btn('us-new','NOVO','blue')}${btn('us-save','GRAVAR','green')}${btn('us-edit','ALTERAR','orange')}${btn('us-back','VOLTAR','red')}</div><div class="us-card us-search-card"><h2>PESQUISA DE USUÁRIOS</h2><div class="us-filters"><input id="us-query" placeholder="PESQUISAR POR CÓDIGO, NOME, LOGIN OU PERFIL"><select id="us-filter"><option>TODOS</option><option>ATIVO</option><option>INATIVO</option></select><button type="button" id="us-search" class="action-button blue">PESQUISAR</button></div><div class="us-tablewrap"><table class="us-table"><thead><tr><th>CÓDIGO</th><th>NOME DO USUÁRIO</th><th>LOGIN</th><th>PERFIL</th><th>PERMISSÕES</th><th>SITUAÇÃO</th></tr></thead><tbody id="us-list"></tbody></table></div><p class="us-note">Dê dois cliques para abrir um cadastro.</p></div>`;root().append(section);active('CADASTROS');
$('us-new').onclick=newForm;$('us-save').onclick=()=>saveUser(false);$('us-edit').onclick=()=>saveUser(true);$('us-search').onclick=()=>list(true);$('us-back').onclick=()=>{category('CADASTROS');};$('us-shortcuts').onclick=shortcuts;$('us-audit').title='Clique para consultar o histórico de alterações';$('us-audit').style.cursor='pointer';$('us-audit').style.textDecoration='underline';$('us-audit').onclick=showUserHistory;
$('us-link').onchange=()=>{const own=$('us-link').value==='PROPRIETARIO';$('us-employee-plus').disabled=own;if(own){employeeId='';$('us-employee-name').value='NÃO SE APLICA';refreshRegisteredRoles('ADMINISTRADOR');permissions=new Set(ALL)}else{$('us-employee-name').value=employeeId?employeeLabel(employeeId):'';const f=employees().find(x=>String(x.id)===employeeId);refreshRegisteredRoles(f?.cargo?.toUpperCase()||'');permissions=new Set(defaultPermissionsForRole($('us-role').value))}renderPermissions()};
$('us-employee-plus').onclick=employeePicker;$('us-eye').onclick=()=>{const a=$('us-password');a.type=a.type==='password'?'text':'password'};
$('us-role').onchange=()=>{if($('us-link').value==='PROPRIETARIO'){$('us-role').value='ADMINISTRADOR'}permissions=new Set(defaultPermissionsForRole($('us-role').value));renderPermissions()};
$('us-reset').onclick=()=>{permissions=new Set(defaultPermissionsForRole($('us-role').value));renderPermissions()};
$('us-all').onclick=()=>{permissions=new Set(ALL);renderPermissions()};$('us-none').onclick=()=>{permissions.clear();renderPermissions()};
$('us-query').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();list(true)}};newForm();list(false)}
let employeeId='';
function employeeLabel(id){const f=employees().find(x=>String(x.id)===String(id));return f?f.nome:''}
function employeePicker(){
 if($('us-link').value!=='FUNCIONARIO')return;
 const overlay=document.createElement('div');overlay.className='fs-picker-overlay us-employee-picker';
 overlay.innerHTML=`<div class="fs-picker-dialog" role="dialog" aria-modal="true" aria-label="Selecionar funcionário"><div class="fs-picker-header"><strong>SELECIONAR FUNCIONÁRIO</strong><button type="button" id="us-employee-x" aria-label="Fechar">×</button></div><div class="fs-picker-content"><div class="fs-picker-search us-employee-search"><label>PESQUISAR POR<select id="us-employee-type"><option value="nome">NOME</option><option value="id">CÓDIGO</option><option value="cpf">CPF</option></select></label><label>TEXTO DA PESQUISA<input id="us-employee-query" placeholder="DIGITE PARA PESQUISAR..." autocomplete="off"></label><button type="button" id="us-employee-search">PESQUISAR</button></div><div class="fs-picker-tablewrap"><table class="fs-picker-table"><thead><tr><th>CÓDIGO</th><th>NOME DO FUNCIONÁRIO</th><th>CPF</th></tr></thead><tbody id="us-employee-list"><tr><td colspan="3" class="fs-picker-none">CLIQUE EM PESQUISAR PARA EXIBIR OS FUNCIONÁRIOS.</td></tr></tbody></table></div></div><div class="fs-picker-footer"><span>DÊ DOIS CLIQUES PARA SELECIONAR.</span><button type="button" id="us-employee-cancel">CANCELAR</button></div></div>`;
 document.body.append(overlay);
 const close=()=>{document.removeEventListener('keydown',onKey,true);overlay.remove()};
 const draw=()=>{const field=$('us-employee-type').value,q=$('us-employee-query').value.trim().toLocaleLowerCase('pt-BR'),body=$('us-employee-list');body.replaceChildren();const found=employees().filter(f=>!q||String(f[field]||'').toLocaleLowerCase('pt-BR').includes(q));if(!found.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=3;td.className='fs-picker-none';td.textContent='NENHUM FUNCIONÁRIO ENCONTRADO.';tr.append(td);body.append(tr);return}found.forEach(f=>{const tr=document.createElement('tr');tr.dataset.code=String(f.id);[f.id,f.nome,f.cpf||''].forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.append(td)});tr.ondblclick=()=>{employeeId=String(f.id);$('us-employee-name').value=f.nome;selectEmployeeRole(f);close()};body.append(tr)})};
 const onKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}else if(e.key==='Enter'&&e.target===$('us-employee-query')){e.preventDefault();draw()}};
 document.addEventListener('keydown',onKey,true);$('us-employee-x').onclick=close;$('us-employee-cancel').onclick=close;$('us-employee-search').onclick=draw;overlay.addEventListener('click',e=>{if(e.target===overlay)close()});$('us-employee-query').focus();
}
function shortcuts(){
 if(document.querySelector('.us-shortcuts-overlay'))return;
 const d=document.createElement('div');
 d.className='us-overlay us-shortcuts-overlay';
 d.innerHTML=`<div class="us-dialog" role="dialog" aria-modal="true" aria-labelledby="us-short-title" style="width:min(475px,94vw);padding:0;overflow:hidden;border-radius:14px">
 <div style="display:flex;align-items:center;justify-content:space-between;background:#215b9b;color:#fff;padding:17px 20px;gap:10px">
 <h2 id="us-short-title" style="color:#fff;margin:0;font-size:15px;font-weight:700">⌂ ATALHOS — ▣ CADASTRO DE USUÁRIOS</h2>
 <button type="button" id="us-short-x" aria-label="Fechar atalhos" style="border:0;background:transparent;color:#fff;font-size:24px;cursor:pointer">×</button></div>
 <div style="padding:20px 22px 14px">
 <div style="display:flex;align-items:center;gap:16px;border-bottom:1px solid #d8e4f2;padding:9px 0"><strong style="display:inline-flex;justify-content:center;align-items:center;width:53px;height:35px;background:#edf4ff;border:1px solid #bcd4ff;border-radius:5px;color:#143c79">F1</strong><span>Abrir esta janela de atalhos</span></div>
 <div style="display:flex;align-items:center;gap:16px;border-bottom:1px solid #d8e4f2;padding:9px 0"><strong style="display:inline-flex;justify-content:center;align-items:center;width:53px;height:35px;background:#edf4ff;border:1px solid #bcd4ff;border-radius:5px;color:#143c79">F12</strong><span>Localizar usuário pelo código</span></div>
 </div><div style="display:flex;justify-content:flex-end;border-top:1px solid #d8e4f2;padding:14px 20px 16px">${btn('us-short-close','FECHAR','blue')}</div></div>`;
 document.body.append(d);
 const close=()=>{document.removeEventListener('keydown',onKey,true);d.remove()};
 const onKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}};
 document.addEventListener('keydown',onKey,true);
 d.querySelector('#us-short-close').onclick=close;
 d.querySelector('#us-short-x').onclick=close;
 d.onclick=e=>{if(e.target===d)close()};
}

function newForm(){selected=null;employeeId='';$('us-code').value=String(next());$('us-login').value=String(next());$('us-name').value='';$('us-link').value='PROPRIETARIO';refreshRegisteredRoles('ADMINISTRADOR');$('us-status').value='ATIVO';$('us-notes').value='';$('us-discount-limit').value='0';$('us-password').value='';$('us-confirm').value='';$('us-audit').value=sessionUser();$('us-link').dispatchEvent(new Event('change'));permissions=new Set(ALL);renderPermissions();$('us-message').hidden=true;$('us-name').focus()}
function renderPermissions(){const role=$('us-role').value;const admin=role==='ADMINISTRADOR';$('us-count').textContent=`${permissions.size} de ${ALL.length} permissões`;$('us-permissions').innerHTML=Object.entries(groups).map(([name,items])=>`<details class="us-group"><summary><strong>${escapeHTML(name)}</strong> — ${items.filter(x=>permissions.has(x)).length}/${items.length}</summary><div class="us-checkgrid">${items.map(item=>`<label><input type="checkbox" data-us-permission="${escapeHTML(item)}" ${permissions.has(item)?'checked':''} >${escapeHTML(item)}</label>`).join('')}</div></details>`).join('');document.querySelectorAll('[data-us-permission]').forEach(input=>input.onchange=()=>{if(input.checked)permissions.add(input.dataset.usPermission);else permissions.delete(input.dataset.usPermission);$('us-count').textContent=`${permissions.size} de ${ALL.length} permissões`});$('us-all').disabled=false;$('us-none').disabled=false;$('us-reset').disabled=false}
function fill(u){selected=u.id;employeeId=u.funcionarioId?String(u.funcionarioId):'';$('us-code').value=String(u.id);$('us-login').value=String(u.id);$('us-name').value=u.nome||'';$('us-link').value=u.vinculo|| (u.funcionarioId?'FUNCIONARIO':'PROPRIETARIO');refreshRegisteredRoles(u.perfil|| (employeeId?employees().find(f=>String(f.id)===employeeId)?.cargo?.toUpperCase():'ADMINISTRADOR'));$('us-status').value=u.situacao;$('us-notes').value=u.observacoes||'';$('us-discount-limit').value=Number(u.limiteDesconto)||0;$('us-password').value='';$('us-confirm').value='';$('us-audit').value=u.usuario||u.alteradoPor||u.criadoPor||'NÃO INFORMADO';$('us-employee-plus').disabled=$('us-link').value==='PROPRIETARIO';$('us-employee-name').value=employeeId?employeeLabel(employeeId):'NÃO SE APLICA';permissions=new Set(u.permissoes|| (u.perfil==='ADMINISTRADOR'?ALL:[]));renderPermissions();$('us-message').hidden=true;window.scrollTo({top:0,behavior:'smooth'})}
function showUserHistory(){
 const record=db.usuarios.find(u=>u.id===selected);
 document.querySelectorAll('.us-audit-overlay').forEach(n=>n.remove());
 const modal=document.createElement('div');modal.className='us-overlay us-audit-overlay';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const history=Array.isArray(record?.historicoOperacoes)?record.historicoOperacoes:[];
 const events=history.length?history.slice().reverse().map(ev=>{
  const date=ev.data?new Date(ev.data):null;
  const time=date&&!Number.isNaN(date.getTime())?date.toLocaleString('pt-BR'):ev.data||'';
  const diffs=(ev.alteracoes||[]).map(d=>'<div style="margin:5px 0;font-size:12px"><b>'+esc(d.campo)+'</b>: '+esc(d.anterior)+' → '+esc(d.novo)+'</div>').join('');
  return '<div style="padding:12px 0;border-bottom:1px solid #dce5f1"><b>'+esc(ev.acao||'ALTERAÇÃO')+' — '+esc(ev.usuario||'NÃO INFORMADO')+'</b><div style="font-size:12px;color:#61738a">'+esc(time)+'</div>'+diffs+'</div>';
 }).join(''):'<p>Este cadastro ainda não possui histórico de alterações registrado.</p>';
 modal.innerHTML='<div class="us-dialog" role="dialog" aria-modal="true" style="width:min(650px,95vw);max-height:85vh;display:flex;flex-direction:column;overflow:hidden;padding:0"><div style="background:#153e77;color:#fff;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-shrink:0"><h2 style="color:white;margin:0">HISTÓRICO DE ALTERAÇÕES</h2><button type="button" id="us-history-close" class="action-button blue">✕ FECHAR</button></div><div style="padding:16px 20px;overflow-y:auto;min-height:0;display:block"><p><b>CADASTRO:</b> '+esc(record?.nome||'NOVO USUÁRIO')+'</p><p><b>ÚLTIMO USUÁRIO:</b> '+esc(record?.usuario||record?.alteradoPor||record?.criadoPor||'NÃO INFORMADO')+'</p>'+events+'</div></div>';
 document.body.append(modal);
 const close=()=>{document.removeEventListener('keydown',key,true);modal.remove()};
 const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}};
 document.addEventListener('keydown',key,true);
 modal.querySelector('#us-history-close').onclick=close;
 modal.addEventListener('click',e=>{if(e.target===modal)close()});
}
async function passwordHash(password,salt){return window.LL_SHA256(salt+':'+password)}
async function saveUser(edit){const name=$('us-name').value.trim(),own=$('us-link').value==='PROPRIETARIO',fid=own?'':employeeId,role=own?'ADMINISTRADOR':$('us-role').value,pass=$('us-password').value,confirm=$('us-confirm').value;
if(!name)return notify('Informe o nome do usuário.');if(!own&&!role)return notify('Selecione um perfil de acesso cadastrado em CARGO / FUNÇÃO dos funcionários.');if(!own&&(!fid||!employees().some(f=>String(f.id)===fid)))return notify('Selecione um funcionário ativo pelo botão +.');if(db.usuarios.some(u=>u.id!==selected&&fid&&String(u.funcionarioId)===fid))return notify('Este funcionário já possui cadastro de usuário.');if(edit&&!selected)return notify('Localize um usuário para alterar.');if(!edit&&selected)return notify('Usuário já cadastrado; utilize ALTERAR.');if(pass!==confirm)return notify('As senhas informadas não coincidem.');if(!edit&&!pass)return notify('Informe e confirme a senha.');if(pass&&pass.length<6)return notify('A senha deve ter pelo menos 6 caracteres.');
const old=db.usuarios.find(u=>u.id===selected),id=selected||next();const u={...(old||{}),id,funcionarioId:fid?Number(fid):null,vinculo:own?'PROPRIETARIO':'FUNCIONARIO',nome:name,login:String(id),perfil:role,situacao:$('us-status').value,observacoes:$('us-notes').value.trim(),limiteDesconto:Math.min(100,Math.max(0,Number($('us-discount-limit').value)||0)),permissoes:[...permissions],criadoPor:old?.criadoPor||sessionUser(),criadoEm:old?.criadoEm||new Date().toISOString(),alteradoPor:sessionUser(),alteradoEm:new Date().toISOString()};
if(old){const fields=['funcionarioId','vinculo','nome','login','perfil','situacao','observacoes','limiteDesconto','permissoes'];const unchanged=fields.every(k=>JSON.stringify(old[k])===JSON.stringify(u[k]));if(unchanged&&!pass){u.alteradoPor=old.alteradoPor||old.criadoPor;u.alteradoEm=old.alteradoEm||old.criadoEm;u.usuario=old.usuario||u.alteradoPor;u.historicoOperacoes=old.historicoOperacoes||[]}else{u.usuario=sessionUser();u.historicoOperacoes=[...(old.historicoOperacoes||[]),{acao:'ALTERAÇÃO',usuario:sessionUser(),data:u.alteradoEm,alteracoes:[...fields.filter(k=>JSON.stringify(old[k])!==JSON.stringify(u[k])).map(k=>({campo:k,anterior:Array.isArray(old[k])?old[k].join(', '):old[k]??'',novo:Array.isArray(u[k])?u[k].join(', '):u[k]??''})),...(pass?[{campo:'SENHA',anterior:'[PROTEGIDA]',novo:'[ALTERADA]'}]:[])]}]}}else{u.usuario=sessionUser();u.historicoOperacoes=[{acao:'CADASTRO',usuario:sessionUser(),data:u.criadoEm}]}
if(pass){u.senhaSalt=Array.from((globalThis.crypto?.getRandomValues?crypto.getRandomValues(new Uint8Array(16)):Uint8Array.from({length:16},()=>Math.floor(Math.random()*256))),b=>b.toString(16).padStart(2,'0')).join('');u.senhaHash=await passwordHash(pass,u.senhaSalt)}const idx=db.usuarios.findIndex(x=>x.id===u.id);if(idx<0)db.usuarios.push(u);else db.usuarios[idx]=u;if(persist()){const stored=db.usuarios.find(x=>x.id===u.id)||u;fill(stored);list(false);notify(edit?'Usuário alterado com sucesso.':'Usuário cadastrado com sucesso.')}}
function list(showResults=false){const q=$('us-query').value.trim().toUpperCase(),st=$('us-filter').value;const tbody=$('us-list');tbody.replaceChildren();if(!showResults){const tr=document.createElement('tr');tr.innerHTML='<td colspan="6">CLIQUE EM PESQUISAR PARA EXIBIR OS USUÁRIOS.</td>';tbody.append(tr);return}for(const u of db.usuarios.filter(x=>(st==='TODOS'||x.situacao===st)&&[x.id,x.nome,x.login,x.perfil].some(v=>String(v).toUpperCase().includes(q)))){const tr=document.createElement('tr');for(const value of [String(u.id),u.nome,u.login,u.perfil,(u.permissoes||[]).length,u.situacao]){const td=document.createElement('td');td.textContent=value;tr.append(td)}tr.ondblclick=()=>fill(u);tbody.append(tr)}if(!tbody.children.length){const tr=document.createElement('tr');tr.innerHTML='<td colspan="6">Nenhum usuário encontrado.</td>';tbody.append(tr)}}
function lookup(){if(document.querySelector('.us-overlay'))return;const overlay=document.createElement('div');overlay.className='us-overlay';overlay.innerHTML=`<div class="us-dialog us-lookup-dialog" role="dialog" aria-modal="true" aria-label="LOCALIZAR USUÁRIO"><header class="us-lookup-head"><strong>▣ LOCALIZAR USUÁRIO — F12</strong><button type="button" id="us-findx" aria-label="Fechar">×</button></header><div class="us-lookup-body"><p class="us-lookup-help">Informe o código do usuário.</p><label>CÓDIGO DO USUÁRIO<input id="us-findcode" inputmode="numeric" placeholder="DIGITE O CÓDIGO"></label><p id="us-finderror" role="status"></p><div class="us-lookup-actions">${btn('us-findgo','LOCALIZAR','blue')}${btn('us-findcancel','CANCELAR','slate')}</div></div></div>`;document.body.append(overlay);const close=()=>{overlay.remove();document.removeEventListener('keydown',key,true)};const go=()=>{const v=$('us-findcode').value.trim(),u=/^\d+$/.test(v)?db.usuarios.find(x=>x.id===Number(v)):null;if(u){close();fill(u)}else $('us-finderror').textContent='USUÁRIO NÃO ENCONTRADO.'};const key=e=>{if(['F12','Escape','Enter'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();if(e.key==='Escape')close();else if(e.key==='Enter')go()}};document.addEventListener('keydown',key,true);$('us-findgo').onclick=go;$('us-findcancel').onclick=close;$('us-findx').onclick=close;$('us-findcode').focus()}
const previous=open;open=function(name){if(name==='USUÁRIOS'||name==='USUÁRIOS E PERMISSÕES')return page();return previous(name)};
document.addEventListener('keydown',e=>{if(screen!=='USUÁRIOS'||document.querySelector('.us-overlay')||document.querySelector('.erp-modal-overlay'))return;if(e.key!=='F1'&&e.key!=='F12')return;e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;if(e.key==='F12')lookup();else $('us-shortcuts')?.click()},true);
})();
