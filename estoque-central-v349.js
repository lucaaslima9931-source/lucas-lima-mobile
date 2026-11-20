/* LUCAS LIMA V370 — conciliação de saldos documentados, incluindo trocas baixadas.
   Somente produtos com entrada de estoque documentada e sem saldo-base
   explícito são conciliados quando não há movimentos não contemplados. */
(()=>{'use strict';
const PK='erp_matriz_produtos_teste_v1';
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const num=x=>Number(x)||0, code=x=>String(x?.codigo??x?.produtoCodigo??'');
function reconcile(){
 const ps=read(PK,[]),db=read('erp_matriz_operacoes_v2',{});
 if(!Array.isArray(ps))return ps;
 const entries=new Map(),sold=new Map(),reserved=new Map(),tradeDelta=new Map(),adjustments=new Map(),stockExits=new Map();
 for(const e of db.entradas||[]){if(e.situacao!=='BAIXADA')continue;
  for(const x of e.itens||[])entries.set(code(x),(entries.get(code(x))||0)+num(x.quantidade));}
 const sales=[...(db.vendas||[]),...read('erp_matriz_vendas_v1',[])];
 for(const v of sales){if(!['BAIXADA','PENDENTE'].includes(v.situacao))continue;
  for(const x of v.itens||[]){const map=v.situacao==='BAIXADA'?sold:reserved;map.set(code(x),(map.get(code(x))||0)+num(x.quantidade));}}
 // Saídas de Estoque baixadas reduzem o estoque físico uma única vez.
 // Saídas canceladas (pendentes ou previamente baixadas) não deixam efeito líquido:
 // a Ficha de Estoque conserva a baixa e o estorno como eventos separados.
 for(const s of read('erp_systems_saidas_almox_v1',[])){
  if(String(s.situacao||'').toUpperCase()!=='BAIXADA')continue;
  for(const x of s.itens||[]){const k=code(x);stockExits.set(k,(stockExits.get(k)||0)+num(x.quantidade));}
 }
 // Produtos com outros ajustes físicos não são recalculados automaticamente.
 const other=new Set();
 for(const t of read('erp_matriz_trocas_v1',[])){if(t.situacao!=='BAIXADA')continue;
  if(t.condicao==='ESTOQUE')for(const x of t.devolvidos||[])tradeDelta.set(code(x),(tradeDelta.get(code(x))||0)+num(x.quantidade));
  for(const x of t.novos||[])tradeDelta.set(code(x),(tradeDelta.get(code(x))||0)-num(x.quantidade));
 }
 for(const a of read('erp_systems_acertos_v1',[])){if(a.situacao!=='BAIXADO')continue;for(const x of a.itens||[]){const k=code(x);adjustments.set(k,(adjustments.get(k)||0)+num(x.diferenca));other.add(k);}}
 // Avarias somente afetam o saldo quando efetivamente BAIXADAS.
 const avarias=new Map();
 for(const a of read('erp_systems_avariados_v1',[])){
  if(a.situacao!=='BAIXADO')continue;
  for(const it of a.itens||[]){const k=code(it);avarias.set(k,(avarias.get(k)||0)+num(it.quantidade));}
 }
 let changed=false;
 for(const p of ps){const k=code(p);if(!entries.has(k)&&p.erpSaldoBase===undefined)continue;
  const base=p.erpSaldoBase===undefined?0:num(p.erpSaldoBase);
  const physical=base+(entries.get(k)||0)-(sold.get(k)||0)+(tradeDelta.get(k)||0)+(adjustments.get(k)||0)-(avarias.get(k)||0)-(stockExits.get(k)||0);
  if(physical<0)continue;
  const booking=reserved.get(k)||0;
  if(num(p.provisao)!==physical||num(p.venda)!==booking){p.provisao=physical;p.venda=booking;changed=true;}
 }
 if(changed)localStorage.setItem(PK,JSON.stringify(ps));
 return ps;
}
window.LL_estoqueCentralConciliar=reconcile;
})();
