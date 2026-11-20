/* V546 — apuração de comissões por funcionário e competência. */
(function(){'use strict';
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??d}catch{return d}};
const num=v=>{if(typeof v==='number')return v;let s=String(v??'0').replace(/[^\d,.-]/g,'');if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');return Number(s)||0};
const date=v=>{const s=String(v||'');if(/^\d{4}-\d{2}-\d{2}/.test(s))return s.slice(0,10);if(/^\d{2}\/\d{2}\/\d{4}/.test(s))return s.slice(6,10)+'-'+s.slice(3,5)+'-'+s.slice(0,2);return ''};
function commissions(emp,comp){
 if(!emp||!comp)return [];
 const sellers=read('erp_matriz_vendedores_v1',{}).vendedores||[];
 const seller=sellers.find(s=>String(s.funcionarioId)===String(emp.id));
 const pct=num(emp.comissao??seller?.percentual??0);
 const matches=v=>{
  const ids=[v.vendedorId,v.codigoVendedor,v.vendedorCodigo,v.funcionarioId].filter(x=>x!==null&&x!==undefined&&x!=='');
  return ids.some(x=>(seller&&String(x)===String(seller.id))||String(x)==='F-'+emp.id||String(x)===String(emp.id)) ||
   (!!v.vendedor&&String(v.vendedor).trim().toUpperCase()===String(emp.nome||'').trim().toUpperCase());
 };
 const original=read('erp_matriz_vendas_v1',[]), trades=read('erp_matriz_trocas_v1',[]), legacy=read('erp_matriz_operacoes_v2',{}).vendas||[];
 const sales=[...original,...legacy].filter((v,i,a)=>a.findIndex(x=>String(x.numero??x.id??x.codigo)===String(v.numero??v.id??v.codigo))===i);
 const saleByNumber=new Map(sales.map(v=>[String(v.numero??v.id??v.codigo),v]));
 const list=[];
 const percentAt=(v,dt)=>{
  if(v.comissaoPercentualBaixa!==undefined&&v.comissaoPercentualBaixa!==null)return num(v.comissaoPercentualBaixa);
  // Reconstrução a partir das alterações auditadas do cadastro, sem alterar registros antigos.
  let rate=pct;
  const rawTime=String(dt||'');const when=Date.parse(/^\d{4}-\d{2}-\d{2}T/.test(rawTime)?rawTime:String(dt||'').slice(0,10)+'T23:59:59');
  const history=(emp.historico||[]).filter(h=>String(h.campo||'').toUpperCase()==='COMISSAO'||String(h.campo||'').toUpperCase()==='COMISSÃO').map(h=>{
   const raw=String(h.data||'');const m=raw.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:[, ]+(\d{2}):(\d{2}))?/);
   return {...h,ms:m?Date.parse(`${m[3]}-${m[2]}-${m[1]}T${m[4]||'00'}:${m[5]||'00'}:00`):Date.parse(raw)};
  }).filter(h=>Number.isFinite(h.ms)).sort((a,b)=>b.ms-a.ms);
  for(const h of history)if(h.ms>when)rate=num(h.antes);
  return history.length?rate:null;
 };
 const entry=(v,dt,origem,numero,base)=>{
  const rate=percentAt(v,v.baixadaEm||v.dataBaixa||dt);
  if(rate===null)return {data:dt,origem,numero,desc:origem+' '+numero,valor:0,detalhe:'PERCENTUAL HISTÓRICO NÃO DISPONÍVEL — CONFERIR',pendenteConferencia:true};
  return {data:dt,origem,numero,desc:origem+' '+numero,valor:Math.round(base*rate)/100,detalhe:rate+'%'+(origem==='TROCA'?' — BASE: '+base.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):'')};
 };

 const frozen=read('lucas_lima_folhas_individuais_v2',[]).find(f=>String(f.funcionario)===String(emp.id)&&`${f.ano}-${String(f.mes).padStart(2,'0')}`===comp&&f.gerada);
 // Uma folha gerada mantém seus lançamentos originais, inclusive após cancelamento da operação.
 if(frozen&&Array.isArray(frozen.calc?.comissoes))return frozen.calc.comissoes.map(x=>({...x,consolidada:true}));
 for(const v of sales){if(!matches(v)||String(v.situacao||'').toUpperCase()!=='BAIXADA')continue;
  const dt=date(v.dataBaixa||v.baixadaEm||v.data);if(dt.slice(0,7)!==comp)continue;
  const numero=v.numero??v.id??v.codigo;list.push(entry(v,dt,'VENDA',numero,num(v.total??v.valorTotal??v.valor)));
 }
 for(const t of trades){if(String(t.situacao||'').toUpperCase()!=='BAIXADA')continue;
  const sale=saleByNumber.get(String(t.venda));if(!sale||!matches(sale)||String(sale.situacao||'').toUpperCase()!=='BAIXADA')continue;
  const dt=date(t.baixadaEm||t.dataBaixa||t.data);if(dt.slice(0,7)!==comp)continue;
  // Comissionar somente a diferença positiva cobrada do cliente, evitando remunerar novamente a venda original.
  const base=Math.max(0,num(t.totalAcerto??t.diferenca));const numero=t.numero??t.id;
  list.push(entry(t,dt,'TROCA',numero,base));
 }
 return list.sort((a,b)=>b.data.localeCompare(a.data)||String(b.numero).localeCompare(String(a.numero)));
}
window.LL_comissoesFuncionarioV546=commissions;
// Grava a taxa vigente diretamente no documento no instante da baixa.
window.LL_fixarComissaoNaBaixa=function(documento,vendaOriginal){
 if(!documento||documento.comissaoPercentualBaixa!==undefined)return;
 const rh=read('erp_matriz_rh_v1',null);
 const funcs=(rh?.funcionarios||[]);
 const vend=read('erp_matriz_vendedores_v1',{}).vendedores||[];
 const source=vendaOriginal||documento;
 const ids=[source.vendedorId,source.codigoVendedor,source.vendedorCodigo,source.funcionarioId].filter(x=>x!==null&&x!==undefined&&x!=='');
 const seller=vend.find(s=>ids.some(x=>String(x)===String(s.id)||String(x)===String(s.funcionarioId))||String(s.nome||'').trim().toUpperCase()===String(source.vendedor||'').trim().toUpperCase()&&!!source.vendedor);
 const emp=funcs.find(f=>String(f.id)===String(seller?.funcionarioId)||ids.some(x=>String(x)===String(f.id)||String(x)==='F-'+f.id)||String(f.nome||'').trim().toUpperCase()===String(source.vendedor||'').trim().toUpperCase()&&!!source.vendedor);
 if(emp||seller){documento.comissaoPercentualBaixa=num(emp?.comissao??seller?.percentual??0);documento.comissaoFuncionarioId=emp?.id??seller?.funcionarioId??null;}
};
})();
