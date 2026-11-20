/* V171 - Controle de permissões de interface para uso local. Não substitui segurança de servidor. */
(()=>{'use strict';
const SESSION='erp_systems_demo_session', USERS='erp_matriz_usuarios_v1';
const read=(storage,key)=>{try{return JSON.parse(storage.getItem(key)||'null')}catch{return null}};
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
function current(){const s=read(sessionStorage,SESSION);if(!s)return null;if(String(s.id)==='300'&&s.demo)return null;const u=(read(localStorage,USERS)?.usuarios||[]).find(x=>String(x.id)===String(s.id));return u||{permissoes:[],perfil:s.perfil};}
function allowed(permission){const u=current();if(!u)return true;if(norm(u.perfil)==='ADMINISTRADOR'&&norm(u.vinculo)==='PROPRIETARIO')return true;return (u.permissoes||[]).some(x=>norm(x)===norm(permission));}
const pages={
'PRODUTOS':'Consultar produtos','PROMOÇÕES':'Consultar produtos','CLIENTES':'Consultar clientes','FORNECEDORES':'Consultar fornecedores',
'FUNCIONÁRIOS':'Consultar dados de funcionários','USUÁRIOS':'Configurar permissões','FORMAS DE PAGAMENTO':'Consultar financeiro','CADASTRO DA LOJA':'Configurar permissões',
'VENDAS':'Consultar vendas','PEDIDOS':'Consultar vendas','ORÇAMENTOS':'Consultar vendas','CAIXA':'Abrir caixa','ABERTURA E MOVIMENTAÇÕES':'Abrir caixa',
'RECEBIMENTOS':'Receber pagamentos de vendas','FICHA DE ESTOQUE':'Consultar estoque','ACERTO DE ESTOQUE':'Ajustar estoque',
'AVARIADOS':'Movimentar estoque','ESTOQUE MÍNIMO':'Consultar estoque','SAÍDAS DE ESTOQUE':'Movimentar estoque',
'ENTRADAS DE ESTOQUE':'Cadastrar entradas','ENTRADAS':'Cadastrar entradas','PEDIDOS DE COMPRAS':'Consultar compras',
'CONTAS A RECEBER':'Receber contas','CONTAS A PAGAR':'Pagar contas','FINANCEIRO':'Consultar financeiro',
'CENTRO DE CUSTOS':'Consultar financeiro','FOLHA DE PAGAMENTO':'Gerar folha','RELATÓRIOS':'Consultar relatórios financeiros',
'DRE':'Consultar relatórios financeiros','LISTAGENS':'Consultar relatórios financeiros','CONFIGURAÇÕES':'Configurar permissões'};
function pagePermission(name){const n=norm(name);for(const [key,val] of Object.entries(pages))if(norm(key)===n)return val;return null;}

const moduleNames=["PRODUTOS", "CLIENTES", "FORNECEDORES", "MARCAS", "CATEGORIAS", "UNIDADES", "FUNCIONÁRIOS", "USUÁRIOS", "FORMAS DE PAGAMENTO", "CADASTRO DA LOJA", "VENDEDORES", "VENDAS", "ORÇAMENTOS", "TROCAS", "CAIXA", "RECEBIMENTOS", "FICHA DE ESTOQUE", "ACERTO DE ESTOQUE", "AVARIADOS", "ESTOQUE MÍNIMO", "SAÍDAS DE ESTOQUE", "ENTRADAS DE ESTOQUE", "PEDIDOS DE COMPRAS", "CONTAS A RECEBER", "CONTAS A PAGAR", "FINANCEIRO", "CENTRO DE CUSTOS", "FOLHA DE PAGAMENTO", "RELATÓRIOS", "DRE", "LISTAGENS", "CONFIGURAÇÕES"];
const moduleLegacy={'MARCAS':'Consultar produtos','CATEGORIAS':'Consultar produtos','UNIDADES':'Consultar produtos','VENDEDORES':'Consultar vendedores','TROCAS':'Consultar vendas','ORÇAMENTOS':'Consultar vendas','CADASTRO DA LOJA':'Configurar permissões','FORMAS DE PAGAMENTO':'Configurar pagamentos','CONFIGURAÇÕES':'Alterar configurações do sistema','RELATÓRIOS':'Consultar relatórios','LISTAGENS':'Consultar relatórios','DRE':'Consultar relatórios financeiros','RECEBIMENTOS':'Receber pagamentos de vendas','ENTRADAS DE ESTOQUE':'Cadastrar entradas'};
function modulePermission(name){const n=norm(name);const match=moduleNames.find(x=>norm(x)===n);return match?'Acessar módulo: '+match:null;}
function hasModuleAccess(name){const u=current();if(!u)return true;if(norm(u.perfil)==='ADMINISTRADOR'&&norm(u.vinculo)==='PROPRIETARIO')return true;const key=modulePermission(name);if(!key)return true;const permissions=u.permissoes||[];if(permissions.some(x=>norm(x).startsWith('ACESSAR MODULO:')))return permissions.some(x=>norm(x)===norm(key));const legacy=moduleLegacy[name]||pagePermission(name);return legacy?allowed(legacy):false;}


// V176: Permissões individuais de operação por módulo.
const detailedModules=['PRODUTOS', 'CLIENTES', 'FORNECEDORES', 'MARCAS', 'CATEGORIAS', 'UNIDADES', 'FUNCIONÁRIOS', 'USUÁRIOS', 'FORMAS DE PAGAMENTO', 'CADASTRO DA LOJA', 'VENDEDORES', 'VENDAS', 'ORÇAMENTOS', 'TROCAS', 'CAIXA', 'RECEBIMENTOS', 'FICHA DE ESTOQUE', 'ACERTO DE ESTOQUE', 'AVARIADOS', 'ESTOQUE MÍNIMO', 'SAÍDAS DE ESTOQUE', 'ENTRADAS DE ESTOQUE', 'PEDIDOS DE COMPRAS', 'CONTAS A RECEBER', 'CONTAS A PAGAR', 'FINANCEIRO', 'CENTRO DE CUSTOS', 'FOLHA DE PAGAMENTO', 'RELATÓRIOS', 'DRE', 'LISTAGENS', 'CONFIGURAÇÕES'];
const normalizeAction=(label)=>{
 const a=norm(label);
 if(/GERAR.*FOLHA/.test(a))return 'Gerar folha';
 if(/GRAVAR.*FOLHA/.test(a))return 'Gravar folha';
 if(/BAIXAR.*FOLHA/.test(a))return 'Baixar folha';
 if(/IMPRIMIR.*FOLHA/.test(a))return 'Imprimir folha';
 if(/CANCELAR.*FOLHA/.test(a))return 'Cancelar folha';
 if(/GERAR.*ROTA/.test(a))return 'Gerar rota';
 if(/FINALIZAR.*ROTA/.test(a))return 'Finalizar rota';
 if(/INICIAR.*ROTA|COMECAR.*ROTA/.test(a))return 'Iniciar rota';
 if(/GERAR.*CARTA/.test(a))return 'Gerar carta';
 if(/GERAR.*NEGOCIACAO/.test(a))return 'Gerar negociação';
 if(/ROMANEIO/.test(a))return /IMPRIMIR/.test(a)?'Imprimir romaneio':'Gerar romaneio';
 if(/DESCONTO/.test(a))return 'Conceder descontos';
 if(/PRECO/.test(a))return 'Alterar preço';
 const rules=[['GRAVAR','Gravar'],['SALVAR','Gravar'],['CADASTRAR','Gravar'],['ALTERAR','Alterar'],['EDITAR','Alterar'],['BAIXAR','Baixar'],['CANCELAR','Cancelar'],['REABRIR','Reabrir'],['EXCLUIR','Excluir'],['REMOVER','Excluir'],['IMPRIMIR','Imprimir'],['GERAR','Gerar'],['ESTORNAR','Estornar'],['RECEBER','Receber'],['PAGAR','Pagar'],['TRANSFERIR','Transferir'],['SANGRIA','Sangria'],['NOVO','Novo'],['CONSULTAR','Consultar'],['PESQUISAR','Consultar']];
 return rules.find(([word])=>a.startsWith(word))?.[1]||null;
};
function detailedPermission(module,label){
 const m=detailedModules.find(x=>norm(x)===norm(module));if(!m)return null;
 const action=normalizeAction(label);if(!action)return null;
 const permission=action+' — '+m;
 return window.LL_DetailedPermissions?.includes(permission)?permission:null;
}
window.LL_DetailedPermissions=['Consultar — PRODUTOS', 'Novo — PRODUTOS', 'Gravar — PRODUTOS', 'Alterar — PRODUTOS', 'Excluir — PRODUTOS', 'Imprimir — PRODUTOS', 'Inativar — PRODUTOS', 'Alterar preços — PRODUTOS', 'Consultar custos — PRODUTOS', 'Visualizar estoque — PRODUTOS', 'Consultar — CLIENTES', 'Novo — CLIENTES', 'Gravar — CLIENTES', 'Alterar — CLIENTES', 'Excluir — CLIENTES', 'Imprimir — CLIENTES', 'Consultar — FORNECEDORES', 'Novo — FORNECEDORES', 'Gravar — FORNECEDORES', 'Alterar — FORNECEDORES', 'Excluir — FORNECEDORES', 'Imprimir — FORNECEDORES', 'Consultar — MARCAS', 'Novo — MARCAS', 'Gravar — MARCAS', 'Alterar — MARCAS', 'Excluir — MARCAS', 'Imprimir — MARCAS', 'Consultar — CATEGORIAS', 'Novo — CATEGORIAS', 'Gravar — CATEGORIAS', 'Alterar — CATEGORIAS', 'Excluir — CATEGORIAS', 'Imprimir — CATEGORIAS', 'Consultar — UNIDADES', 'Novo — UNIDADES', 'Gravar — UNIDADES', 'Alterar — UNIDADES', 'Excluir — UNIDADES', 'Imprimir — UNIDADES', 'Consultar — FUNCIONÁRIOS', 'Novo — FUNCIONÁRIOS', 'Gravar — FUNCIONÁRIOS', 'Alterar — FUNCIONÁRIOS', 'Excluir — FUNCIONÁRIOS', 'Imprimir — FUNCIONÁRIOS', 'Inativar — FUNCIONÁRIOS', 'Consultar histórico — FUNCIONÁRIOS', 'Consultar — USUÁRIOS', 'Novo — USUÁRIOS', 'Gravar — USUÁRIOS', 'Alterar — USUÁRIOS', 'Excluir — USUÁRIOS', 'Imprimir — USUÁRIOS', 'Configurar permissões — USUÁRIOS', 'Alterar senha — USUÁRIOS', 'Consultar — FORMAS DE PAGAMENTO', 'Novo — FORMAS DE PAGAMENTO', 'Gravar — FORMAS DE PAGAMENTO', 'Alterar — FORMAS DE PAGAMENTO', 'Excluir — FORMAS DE PAGAMENTO', 'Imprimir — FORMAS DE PAGAMENTO', 'Alterar taxas — FORMAS DE PAGAMENTO', 'Consultar histórico — FORMAS DE PAGAMENTO', 'Consultar — CADASTRO DA LOJA', 'Novo — CADASTRO DA LOJA', 'Gravar — CADASTRO DA LOJA', 'Alterar — CADASTRO DA LOJA', 'Excluir — CADASTRO DA LOJA', 'Imprimir — CADASTRO DA LOJA', 'Consultar — VENDEDORES', 'Novo — VENDEDORES', 'Gravar — VENDEDORES', 'Alterar — VENDEDORES', 'Excluir — VENDEDORES', 'Imprimir — VENDEDORES', 'Consultar — VENDAS', 'Novo — VENDAS', 'Gravar — VENDAS', 'Alterar — VENDAS', 'Excluir — VENDAS', 'Imprimir — VENDAS', 'Baixar — VENDAS', 'Cancelar — VENDAS', 'Reabrir — VENDAS', 'Conceder descontos — VENDAS', 'Alterar preço — VENDAS', 'Gerar romaneio — VENDAS', 'Imprimir romaneio — VENDAS', 'Estornar — VENDAS', 'Consultar — ORÇAMENTOS', 'Novo — ORÇAMENTOS', 'Gravar — ORÇAMENTOS', 'Alterar — ORÇAMENTOS', 'Excluir — ORÇAMENTOS', 'Imprimir — ORÇAMENTOS', 'Gerar — ORÇAMENTOS', 'Cancelar — ORÇAMENTOS', 'Reabrir — ORÇAMENTOS', 'Consultar — TROCAS', 'Novo — TROCAS', 'Gravar — TROCAS', 'Alterar — TROCAS', 'Excluir — TROCAS', 'Imprimir — TROCAS', 'Consultar — CAIXA', 'Novo — CAIXA', 'Gravar — CAIXA', 'Alterar — CAIXA', 'Excluir — CAIXA', 'Imprimir — CAIXA', 'Abrir — CAIXA', 'Fechar — CAIXA', 'Sangria — CAIXA', 'Receber — CAIXA', 'Estornar — CAIXA', 'Transferir — CAIXA', 'Consultar — RECEBIMENTOS', 'Novo — RECEBIMENTOS', 'Gravar — RECEBIMENTOS', 'Alterar — RECEBIMENTOS', 'Excluir — RECEBIMENTOS', 'Imprimir — RECEBIMENTOS', 'Receber — RECEBIMENTOS', 'Estornar — RECEBIMENTOS', 'Baixar — RECEBIMENTOS', 'Consultar — FICHA DE ESTOQUE', 'Novo — FICHA DE ESTOQUE', 'Gravar — FICHA DE ESTOQUE', 'Alterar — FICHA DE ESTOQUE', 'Excluir — FICHA DE ESTOQUE', 'Imprimir — FICHA DE ESTOQUE', 'Consultar — ACERTO DE ESTOQUE', 'Novo — ACERTO DE ESTOQUE', 'Gravar — ACERTO DE ESTOQUE', 'Alterar — ACERTO DE ESTOQUE', 'Excluir — ACERTO DE ESTOQUE', 'Imprimir — ACERTO DE ESTOQUE', 'Baixar — ACERTO DE ESTOQUE', 'Cancelar — ACERTO DE ESTOQUE', 'Reabrir — ACERTO DE ESTOQUE', 'Consultar — AVARIADOS', 'Novo — AVARIADOS', 'Gravar — AVARIADOS', 'Alterar — AVARIADOS', 'Excluir — AVARIADOS', 'Imprimir — AVARIADOS', 'Baixar — AVARIADOS', 'Cancelar — AVARIADOS', 'Reabrir — AVARIADOS', 'Consultar — ESTOQUE MÍNIMO', 'Novo — ESTOQUE MÍNIMO', 'Gravar — ESTOQUE MÍNIMO', 'Alterar — ESTOQUE MÍNIMO', 'Excluir — ESTOQUE MÍNIMO', 'Imprimir — ESTOQUE MÍNIMO', 'Consultar — SAÍDAS DE ESTOQUE', 'Novo — SAÍDAS DE ESTOQUE', 'Gravar — SAÍDAS DE ESTOQUE', 'Alterar — SAÍDAS DE ESTOQUE', 'Excluir — SAÍDAS DE ESTOQUE', 'Imprimir — SAÍDAS DE ESTOQUE', 'Baixar — SAÍDAS DE ESTOQUE', 'Cancelar — SAÍDAS DE ESTOQUE', 'Reabrir — SAÍDAS DE ESTOQUE', 'Consultar — ENTRADAS DE ESTOQUE', 'Novo — ENTRADAS DE ESTOQUE', 'Gravar — ENTRADAS DE ESTOQUE', 'Alterar — ENTRADAS DE ESTOQUE', 'Excluir — ENTRADAS DE ESTOQUE', 'Imprimir — ENTRADAS DE ESTOQUE', 'Baixar — ENTRADAS DE ESTOQUE', 'Cancelar — ENTRADAS DE ESTOQUE', 'Reabrir — ENTRADAS DE ESTOQUE', 'Consultar — PEDIDOS DE COMPRAS', 'Novo — PEDIDOS DE COMPRAS', 'Gravar — PEDIDOS DE COMPRAS', 'Alterar — PEDIDOS DE COMPRAS', 'Excluir — PEDIDOS DE COMPRAS', 'Imprimir — PEDIDOS DE COMPRAS', 'Baixar — PEDIDOS DE COMPRAS', 'Cancelar — PEDIDOS DE COMPRAS', 'Reabrir — PEDIDOS DE COMPRAS', 'Consultar — CONTAS A RECEBER', 'Novo — CONTAS A RECEBER', 'Gravar — CONTAS A RECEBER', 'Alterar — CONTAS A RECEBER', 'Excluir — CONTAS A RECEBER', 'Imprimir — CONTAS A RECEBER', 'Receber — CONTAS A RECEBER', 'Baixar — CONTAS A RECEBER', 'Cancelar — CONTAS A RECEBER', 'Reabrir — CONTAS A RECEBER', 'Consultar — CONTAS A PAGAR', 'Novo — CONTAS A PAGAR', 'Gravar — CONTAS A PAGAR', 'Alterar — CONTAS A PAGAR', 'Excluir — CONTAS A PAGAR', 'Imprimir — CONTAS A PAGAR', 'Pagar — CONTAS A PAGAR', 'Baixar — CONTAS A PAGAR', 'Cancelar — CONTAS A PAGAR', 'Reabrir — CONTAS A PAGAR', 'Consultar — FINANCEIRO', 'Novo — FINANCEIRO', 'Gravar — FINANCEIRO', 'Alterar — FINANCEIRO', 'Excluir — FINANCEIRO', 'Imprimir — FINANCEIRO', 'Transferir — FINANCEIRO', 'Estornar — FINANCEIRO', 'Baixar — FINANCEIRO', 'Consultar — CENTRO DE CUSTOS', 'Novo — CENTRO DE CUSTOS', 'Gravar — CENTRO DE CUSTOS', 'Alterar — CENTRO DE CUSTOS', 'Excluir — CENTRO DE CUSTOS', 'Imprimir — CENTRO DE CUSTOS', 'Consultar — FOLHA DE PAGAMENTO', 'Novo — FOLHA DE PAGAMENTO', 'Gravar — FOLHA DE PAGAMENTO', 'Alterar — FOLHA DE PAGAMENTO', 'Excluir — FOLHA DE PAGAMENTO', 'Imprimir — FOLHA DE PAGAMENTO', 'Gerar folha — FOLHA DE PAGAMENTO', 'Gravar folha — FOLHA DE PAGAMENTO', 'Alterar folha — FOLHA DE PAGAMENTO', 'Baixar folha — FOLHA DE PAGAMENTO', 'Cancelar folha — FOLHA DE PAGAMENTO', 'Imprimir folha — FOLHA DE PAGAMENTO', 'Pagar funcionários — FOLHA DE PAGAMENTO', 'Consultar — RELATÓRIOS', 'Novo — RELATÓRIOS', 'Gravar — RELATÓRIOS', 'Alterar — RELATÓRIOS', 'Excluir — RELATÓRIOS', 'Imprimir — RELATÓRIOS', 'Consultar — DRE', 'Novo — DRE', 'Gravar — DRE', 'Alterar — DRE', 'Excluir — DRE', 'Imprimir — DRE', 'Consultar — LISTAGENS', 'Novo — LISTAGENS', 'Gravar — LISTAGENS', 'Alterar — LISTAGENS', 'Excluir — LISTAGENS', 'Imprimir — LISTAGENS', 'Consultar — CONFIGURAÇÕES', 'Novo — CONFIGURAÇÕES', 'Gravar — CONFIGURAÇÕES', 'Alterar — CONFIGURAÇÕES', 'Excluir — CONFIGURAÇÕES', 'Imprimir — CONFIGURAÇÕES'];
function canPerform(module,label){
 const u=current();if(!u)return true;
 const p=detailedPermission(module,label);if(!p)return true;
 const entries=u.permissoes||[];
 // For existing users with no granular switches saved, retain legacy permissions.
 if(!entries.some(x=>String(x).includes(' — ')))return true;
 return allowed(p);
}

function message(){if(document.getElementById('ll-no-access'))return;const backdrop=document.createElement('div');backdrop.id='ll-no-access';backdrop.style.cssText='position:fixed;inset:0;background:#0b244caa;z-index:2147483600;display:flex;align-items:center;justify-content:center;padding:18px';backdrop.innerHTML='<div role="alertdialog" aria-modal="true" aria-label="Usuário sem acesso" style="width:min(440px,95vw);background:white;border-radius:11px;overflow:hidden;box-shadow:0 15px 45px #001a3d55;font-family:Arial,sans-serif"><div style="background:#185899;color:white;padding:20px;font-size:19px;font-weight:bold">USUÁRIO SEM ACESSO</div><div style="padding:25px;color:#193d68;font-size:15px">Você não tem permissão para realizar esta operação.</div><div style="padding:0 22px 22px;text-align:right"><button id="ll-no-access-ok" style="background:#e7f1ff;color:#164f91;border:1px solid #b5d1f3;border-radius:6px;padding:11px 30px;font-weight:bold;cursor:pointer">OK</button></div></div>';document.body.append(backdrop);const close=()=>backdrop.remove();backdrop.querySelector('button').onclick=close;backdrop.querySelector('button').focus();backdrop.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();close()}});}
// V173: validação de operações, não apenas navegação. Inclui botões e envio de formulários.
const actionRules = [
 [/^(GRAVAR|SALVAR|CADASTRAR|ADICIONAR|CRIAR)(\b|$)/,'create'],
 [/^(ALTERAR|EDITAR|ATUALIZAR)(\b|$)/,'edit'],
 [/^(INATIVAR|DESATIVAR)(\b|$)/,'inactive'],
 [/^(EXCLUIR|APAGAR|REMOVER)(\b|$)/,'delete'],
 [/^(BAIXAR|FINALIZAR)(\b|$)/,'down'],
 [/^(CANCELAR)(\b|$)/,'cancel'],
 [/^(REABRIR)(\b|$)/,'reopen'],
 [/^(IMPRIMIR|ETIQUETA)(\b|$)/,'print'],
 [/^(ESTORNAR)(\b|$)/,'reverse'],
 [/^(RECEBER|REGISTRAR RECEBIMENTO)(\b|$)/,'receive'],
 [/^(PAGAR|REGISTRAR PAGAMENTO)(\b|$)/,'pay']
];
function operationPermission(name, action, target){
 const n=norm(name), a=norm(action);
 // Operações específicas sempre prevalecem sobre o botão genérico ALTERAR/GRAVAR.
 if(n.includes('VENDA') && (/DESCONTO/.test(a)))return 'Conceder descontos';
 if(n.includes('VENDA') && (/PRECO|PREÇO/.test(a)))return 'Alterar preço na venda';
 if(n.includes('PRODUTO') && (/PRECO|PREÇO/.test(a)))return 'Alterar preços';
 if(n.includes('PRODUTO') && (/CUSTO|LUCRO/.test(a)))return 'Visualizar custo e lucro';
 if(n.includes('CAIXA') && /FECHAR/.test(a))return 'Fechar caixa';
 if(n.includes('CAIXA') && /ABRIR/.test(a))return 'Abrir caixa';
 const type=actionRules.find(r=>r[0].test(a))?.[1];if(!type)return null;
 const groups=[
  [/USU.RIO|FORMA DE PAGAMENTO|CADASTRO DA LOJA/, {create:'Configurar permissões',edit:'Configurar permissões',delete:'Configurar permissões'}],
  [/PRODUTO/, {create:'Cadastrar produtos',edit:'Alterar produtos',inactive:'Inativar produtos',print:'Imprimir etiquetas'}],
  [/PROMO/, {create:'Cadastrar promoções',edit:'Alterar promoções',cancel:'Cancelar promoções'}],
  [/CLIENTE/, {create:'Cadastrar clientes',edit:'Alterar clientes',inactive:'Inativar clientes',print:'Imprimir extratos de clientes'}],
  [/FORNECEDOR/, {create:'Cadastrar fornecedores',edit:'Alterar fornecedores',inactive:'Inativar fornecedores',print:'Imprimir extratos de fornecedores'}],
  [/FUNCION.RIO/, {create:'Cadastrar funcionários',edit:'Alterar funcionários'}],
  [/VENDEDOR/, {create:'Cadastrar vendedores',edit:'Alterar vendedores'}],
  [/VENDA|PEDIDO|OR.AMENTO/, {create:'Criar vendas',edit:'Alterar vendas',down:'Baixar vendas',cancel:'Cancelar vendas',reopen:'Reabrir vendas',print:'Imprimir vendas'}],
  [/CAIXA/, {create:'Movimentar caixa',edit:'Movimentar caixa',down:'Movimentar caixa',reverse:'Estornar recebimentos',receive:'Receber pagamentos de vendas'}],
  [/ACERTO DE ESTOQUE/, {create:'Ajustar estoque',edit:'Ajustar estoque',down:'Ajustar estoque',cancel:'Ajustar estoque'}],
  [/ESTOQUE|AVARIADO/, {create:'Movimentar estoque',edit:'Movimentar estoque',down:'Movimentar estoque',cancel:'Movimentar estoque'}],
  [/ENTRADA/, {create:'Cadastrar entradas',edit:'Alterar entradas',delete:'Excluir entradas',down:'Cadastrar entradas'}],
  [/CONTAS A PAGAR/, {create:'Pagar contas',edit:'Pagar contas',pay:'Pagar contas',down:'Pagar contas'}],
  [/CONTAS A RECEBER|COBRAN.A/, {create:'Receber contas',edit:'Receber contas',receive:'Receber contas',down:'Receber contas'}],
  [/FINANCEIRO|CENTRO DE CUSTO/, {create:'Alterar lançamentos financeiros',edit:'Alterar lançamentos financeiros',delete:'Excluir lançamentos financeiros',pay:'Pagar contas',receive:'Receber contas'}],
  [/FOLHA/, {create:'Gerar folha',edit:'Gerar folha',pay:'Pagar funcionários'}],
  [/RELAT.RIO|DRE|LISTAGEM/, {print:'Imprimir relatórios'}]
 ];
 for(const [pattern,actions] of groups)if(pattern.test(n))return actions[type]||null;
 return null;
}
function screenName(){try{return typeof screen==='string'?screen:''}catch{return ''}}
function guard(e,target){
 if(document.getElementById('ll-no-access'))return;
 const label=norm(target.dataset?.target||target.textContent||target.value||target.getAttribute?.('aria-label'));
 const submenu=target.closest?.('.submenu-item');const card=target.closest?.('.module-card,.module-button');
 let p=null;
 if(submenu||card){const destination=target.dataset?.target||(card?.querySelector('.module-card-text strong')?.textContent)||(card?.querySelector('strong')?.textContent)||target.textContent;if(!hasModuleAccess(destination)){e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();message();return;}p=pagePermission(destination);}
 if(!p && !canPerform(screenName(),label)){e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();message();return;}
 if(!p)p=operationPermission(screenName(),label,target);
 if(p&&!allowed(p)){e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();message();}
}
document.addEventListener('click',e=>{const t=e.target.closest('button,[role="button"],a,input[type="button"],input[type="submit"]');if(t)guard(e,t)},true);
document.addEventListener('submit',e=>{const b=e.submitter;if(b)guard(e,b)},true);
window.LucasLimaPermissoes={allowed,checkPage(name){if(!hasModuleAccess(name)){message();return false;}const p=pagePermission(name);return !p||this.check(p);},check(permission){if(allowed(permission))return true;message();return false;},message};
})();
