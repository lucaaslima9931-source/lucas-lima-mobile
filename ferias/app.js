
"use strict";

const app = document.getElementById("app");

const KEY = "erp_matriz_produtos_teste_v1";
const AUX = "erp_matriz_aux_v1";
const CLIENT_KEY = "erp_matriz_clientes_v1";

const MENU = {
  CADASTROS: [
    "PRODUTOS", "CLIENTES", "FORNECEDORES",
    "MARCAS", "CATEGORIAS", "UNIDADES",
    "FUNCIONÁRIOS", "USUÁRIOS",
    "FORMAS DE PAGAMENTO", "CADASTRO DA LOJA"
  ],
  VENDAS: [
    "VENDAS", "ORÇAMENTOS", "TROCAS"
  ],
  CAIXA: ["CAIXA"],
  ESTOQUE: [
    "FICHA DE ESTOQUE",
    "ACERTO DE ESTOQUE", "AVARIADOS",
    "ESTOQUE MÍNIMO", "SAÍDAS DE ESTOQUE"
  ],
  COMPRAS: [
    "PEDIDOS DE COMPRA", "ENTRADAS DE ESTOQUE"
  ],
  FINANCEIRO: [
    "CONTAS A PAGAR",
    "FINANCEIRO",
    "CENTRO DE CUSTOS"
  ],
  ADMINISTRATIVO: [
    "LANÇAMENTOS DE FUNCIONÁRIOS", "FOLHA DE PAGAMENTO", "FÉRIAS", "RESCISÕES"
  ],
  RELATÓRIOS: [
    "DRE"
  ]
};

const SYMBOL = {
  "INÍCIO": "⌂",
  CADASTROS: "♙",
  VENDAS: "🛒",
  CAIXA: "▣",
  ESTOQUE: "⬡",
  COMPRAS: "🚚",
  FINANCEIRO: "▣",
  ADMINISTRATIVO: "▤",
  RELATÓRIOS: "▥",
  CONFIGURAÇÕES: "⚙"
};

function read(k, def) {
  try {
    const value = localStorage.getItem(k);
    return value === null ? def : JSON.parse(value);
  } catch (err) {
    console.error(err);
    return def;
  }
}

function save(k, value) {
  try {
    localStorage.setItem(k, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(err);
    aviso("ERRO", "NÃO FOI POSSÍVEL SALVAR OS DADOS.");
    return false;
  }
}

let products = read(KEY, []);
let clients = read(CLIENT_KEY, []);
if (!Array.isArray(clients)) clients = [];
let currentClient = null;
let aux = read(AUX, {
  MARCAS: [],
  CATEGORIAS: [],
  UNIDADES: []
});

if (!Array.isArray(products)) products = [];

for (const kind of ["MARCAS", "CATEGORIAS", "UNIDADES"]) {
  if (!Array.isArray(aux[kind])) aux[kind] = [];
}

let current = null;
let screen = "INÍCIO";
let modalAberto = false;

function e(tag, cls = "", texto = "") {
  const el = document.createElement(tag);
  el.className = cls;
  el.textContent = texto;
  return el;
}

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function num(value) {
  let text = String(value ?? "").trim();
  if (text.includes(",")) {
    text = text.replace(/\./g, "").replace(",", ".");
  }
  return Number(text);
}

function next() {
  return Math.max(
    0,
    ...products.map(p => Number(p.codigo) || 0)
  ) + 1;
}

function root() {
  return document.getElementById("workspace");
}

function val(id) {
  const el = document.getElementById(id);
  return el ? String(el.value).trim() : "";
}

function set(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? "";
}

/* =========================================
   JANELAS PERSONALIZADAS DO ERP
========================================= */

function janela(config = {}) {
  return new Promise(resolve => {
    if (modalAberto) {
      resolve(null);
      return;
    }

    modalAberto = true;

    const anterior = document.activeElement;
    const overlay = e("div", "erp-modal-overlay");
    if (config.campo && /F12|LOCALIZAR/i.test(String(config.titulo || ""))) { overlay.classList.add("ll-f12-unified-v684"); }
    if (config.mostrarCancelar === false && !config.campo) overlay.classList.add("ll-compact-notice-v627");
    const box = e("div", "erp-modal-box");

    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute(
      "aria-label",
      config.titulo || "JANELA DO ERP"
    );

    const header = e("div", "erp-modal-header");

    header.append(
      e("span", "", "▣  " + (config.titulo || "LUCAS LIMA"))
    );

    const close = e("button", "erp-modal-close", "×");
    close.type = "button";
    close.setAttribute("aria-label", "Fechar janela");

    header.append(close);

    const body = e("div", "erp-modal-body");

    if (config.mensagem) {
      body.append(
        e("div", "erp-modal-message", config.mensagem)
      );
    }

    let input = null;

    if (config.campo) {
      const label = e(
        "label",
        "erp-modal-label",
        config.campo
      );

      label.htmlFor = "erp-modal-input";

      input = e("input", "erp-modal-input");
      input.id = "erp-modal-input";
      input.type = "text";
      input.autocomplete = "off";
      input.placeholder = config.placeholder || "";
      input.value = config.valor || "";

      body.append(label, input);
    }

    const error = e("div", "erp-modal-error");
    error.setAttribute("role", "alert");
    body.append(error);

    const footer = e("div", "erp-modal-footer");

    const confirm = e(
      "button",
      "erp-modal-confirm",
      config.confirmar || "CONFIRMAR"
    );

    const cancel = e(
      "button",
      "erp-modal-cancel",
      config.cancelar || "CANCELAR"
    );

    confirm.type = "button";
    cancel.type = "button";

    footer.append(confirm);

    if (config.mostrarCancelar !== false) {
      footer.append(cancel);
    }

    box.append(header, body, footer);
    overlay.append(box);
    document.body.append(overlay);

    const style = document.createElement("style");
    style.textContent = `
      .erp-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 99999;
        background: rgba(8, 25, 52, .57);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
        box-sizing: border-box;
      }
      .erp-modal-box {
        width: 100%;
        max-width: 475px;
        background: #fff;
        border-radius: 9px;
        overflow: hidden;
        box-shadow: 0 18px 55px rgba(0,0,0,.3);
        font-family: Arial, sans-serif;
      }
      .erp-modal-header {
        background: #14549b;
        color: #fff;
        padding: 15px 18px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: bold;
        font-size: 15px;
      }
      .erp-modal-close {
        border: none;
        background: transparent;
        color: white;
        font-size: 25px;
        cursor: pointer;
      }
      .erp-modal-body {
        padding: 23px 22px 14px;
        color: #15345c;
      }
      .erp-modal-message {
        font-size: 14px;
        line-height: 1.5;
        margin-bottom: 14px;
        white-space: pre-line;
      }
      .erp-modal-label {
        display: block;
        font-size: 12px;
        font-weight: bold;
        margin-bottom: 7px;
      }
      .erp-modal-input {
        display: block;
        width: 100%;
        box-sizing: border-box;
        height: 41px;
        padding: 9px 11px;
        border: 1px solid #b6cce6;
        border-radius: 5px;
        outline: none;
        font-size: 15px;
      }
      .erp-modal-input:focus {
        border-color: #2379e8;
        box-shadow: 0 0 0 2px #dbeaff;
      }
      .erp-modal-error {
        color: #c51e35;
        font-size: 12px;
        font-weight: bold;
        margin-top: 9px;
        min-height: 15px;
      }
      .erp-modal-footer {
        display: flex;
        justify-content: center;
        gap: 10px;
        padding: 5px 20px 22px;
      }
      .erp-modal-confirm,
      .erp-modal-cancel {
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        font-size: 12px;
      }
      .erp-modal-confirm {
        color: white;
        background: #14549b;
        border: 1px solid #14549b;
      }
      .erp-modal-cancel {
        color: #14549b;
        background: #f0f5fc;
        border: 1px solid #b9cde6;
      }
    `;

    document.head.append(style);

    function finish(result) {
      document.removeEventListener("keydown", keyHandler, true);
      overlay.remove();
      style.remove();
      modalAberto = false;

      if (anterior && anterior.isConnected) {
        anterior.focus();
      }

      resolve(result);
    }

    function doConfirm() {
      const value = input ? input.value.trim() : true;

      if (config.validar) {
        const msg = config.validar(value);

        if (msg) {
          error.textContent = msg;
          if (input) input.focus();
          return;
        }
      }

      finish(value);
    }

    function keyHandler(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        finish(null);
      } else if (event.key === "Enter") {
        event.preventDefault();
        event.stopImmediatePropagation();
        doConfirm();
      } else if (event.key === "Tab") {
        const focusables = [
          close,
          ...(input ? [input] : []),
          confirm,
          ...(config.mostrarCancelar !== false ? [cancel] : [])
        ];

        const index = focusables.indexOf(document.activeElement);

        if (event.shiftKey && index <= 0) {
          event.preventDefault();
          focusables[focusables.length - 1].focus();
        } else if (!event.shiftKey && index === focusables.length - 1) {
          event.preventDefault();
          focusables[0].focus();
        }
      } else if (/^F\d+$/.test(event.key)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }

    close.onclick = () => finish(null);
    cancel.onclick = () => finish(null);
    confirm.onclick = doConfirm;

    document.addEventListener("keydown", keyHandler, true);

    setTimeout(() => {
      if (input) input.focus();
      else confirm.focus();
    }, 0);
  });
}

function aviso(titulo, mensagem) {
  return janela({
    titulo,
    mensagem,
    confirmar: "OK",
    mostrarCancelar: false
  });
}

function confirmar(titulo, mensagem) {
  return janela({
    titulo,
    mensagem,
    confirmar: "SIM",
    cancelar: "NÃO"
  });
}

async function localizarProdutoF12() {
  const codigo = await janela({
    titulo: "LOCALIZAR PRODUTO — F12",
    mensagem: "Informe o código interno do produto.",
    campo: "CÓDIGO DO PRODUTO",
    placeholder: "Digite o código...",
    confirmar: "LOCALIZAR",
    validar: value => {
      if (!/^[1-9]\d*$/.test(value)) {
        return "INFORME UM CÓDIGO NUMÉRICO VÁLIDO.";
      }

      const existe = products.some(
        p => Number(p.codigo) === Number(value)
      );

      if (!existe) {
        return "PRODUTO NÃO ENCONTRADO.";
      }

      return "";
    }
  });

  if (codigo !== null) {
    loadProduct(Number(codigo));
  }
}

/* =========================================
   CABEÇALHO E MENU
========================================= */

function criarCabecalho() {
  const h = e("header", "topbar");
  const brand = e("div", "brand");

  const marca = e("img", "ll-system-mark");
  marca.src = "logo-sistema-ll.svg";
  marca.alt = "LOGO LUCAS LIMA";
  brand.append(marca);
  const brandText = e("div", "ll-brand-text");
  brandText.append(
    e("div", "brand-name", "LUCAS LIMA"),
    e("div", "brand-subtitle", "SISTEMA DE GESTÃO EMPRESARIAL")
  );
  brand.append(brandText);

  const store = e("div", "store-info");
  const lojaIcon = e("span", "store-icon");
  lojaIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10h18l-1.5-6h-15L3 10Z"/><path d="M4 10v10h16V10M9 20v-7h6v7M3 10c0 3 4.5 3 4.5 0 0 3 4.5 3s4.5-3 4.5-3c0 3 4.5 3 4.5 0"/></svg>';
  store.append(lojaIcon);

  const txt = e("div");

  txt.append(
    e("div", "store-name", "LOJA: 01 – MATRIZ"),
    e("div", "store-company", "NOME DA EMPRESA")
  );

  store.append(txt);

  const actions = e("div", "top-actions");
  const hoje = new Date();

  const date = e(
    "div",
    "top-date",
    hoje.toLocaleDateString("pt-BR", {
      weekday: "long"
    }).toUpperCase() + "\n" +
    hoje.toLocaleDateString("pt-BR")
  );

  const user = e("div", "top-user", "USUÁRIO");
  const userIcon = e("span", "ll-header-user-icon");
  userIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="7" r="4"/><path d="M3 22v-3c0-5 4-8 9-8s9 3 9 8v3z"/></svg>';
  const userBox = e("div", "ll-header-user-box");
  user.append(e("strong", "", "DEMONSTRAÇÃO"));
  userBox.append(userIcon, user);

  const settings = e("button", "top-icon", "⚙");
  settings.title = "ABRIR BACKUP DO SISTEMA";
  settings.onclick = () => open("BACKUP");

  const logout = e("button", "top-icon", "⇥");
  logout.title = "SAIR DO USUÁRIO";
  logout.onclick = () => {
    if (typeof window.lucasLimaSair === "function") window.lucasLimaSair();
    else aviso("ACESSO AO SISTEMA", "A tela de login ainda não está pronta. Atualize a página.");
  };

  const listas = e('div','ll-list-wrap');
  const listButton = e('button','ll-list-button','▤  LISTAGENS  ▾');
  listButton.type = 'button';
  listButton.setAttribute('aria-expanded','false');
  const listMenu = e('div','ll-list-menu');
  listMenu.hidden = true;
  const listItem = e('button','ll-list-entry','ABRIR LISTAGENS');
  listItem.type='button';
  listItem.onclick=()=>{listMenu.hidden=true;listButton.setAttribute('aria-expanded','false');open('LISTAGENS');};
  listMenu.append(listItem);
  listButton.onclick=()=>{listMenu.hidden=!listMenu.hidden;listButton.setAttribute('aria-expanded',String(!listMenu.hidden));};
  listas.append(listButton,listMenu);
  actions.append(userBox, date, settings, listas, logout);
  h.append(brand, store, actions);

  return h;
}

// V142: Ícones vetoriais padronizados do menu lateral (azul e branco).
const LL_MENU_ICONS = {
  'INÍCIO': ['path','M3 10.5 12 3l9 7.5','path','M5 9.5V21h14V9.5','path','M9 21v-7h6v7'],
  'CADASTROS': ['circle','12','7','4','path','M4 21v-2a8 8 0 0 1 16 0v2'],
  'VENDAS': ['path','M2 3h2l2.4 12h12.8l2-9H5','circle','9','20','1','circle','18','20','1'],
  'CAIXA': ['rect','3','7','18','13','2','path','M3 11h18','path','M7 7V4h10v3','circle','12','15','2'],
  'ESTOQUE': ['path','M12 2 21 7v10l-9 5-9-5V7z','path','m3 7 9 5 9-5','path','M12 12v10'],
  'COMPRAS': ['path','M2 6h12v11H2z','path','M14 10h4l4 4v3h-8z','circle','6','19','2','circle','18','19','2'],
  'FINANCEIRO': ['ellipse','12','5','9','3','path','M3 5v7c0 1.7 4 3 9 3s9-1.3 9-3V5','path','M3 12v7c0 1.7 4 3 9 3s9-1.3 9-3v-7'],
  'ADMINISTRATIVO': ['rect','4','3','16','18','1','path','M8 8h8','path','M8 12h8','path','M8 16h6'],
  'RELATÓRIOS': ['path','M4 21V12h4v9','path','M10 21V7h4v14','path','M16 21V3h4v18','path','M2 21h20'],
  'CONFIGURAÇÕES': ['path','M10 2h4l.7 2.4 2.2.9 2.2-1.2 2.8 2.8-1.2 2.2.9 2.2L22 10v4l-2.4.7-.9 2.2 1.2 2.2-2.8 2.8-2.2-1.2-2.2.9L14 22h-4l-.7-2.4-2.2-.9-2.2 1.2-2.8-2.8 1.2-2.2L2.4 14 0 13v-2l2.4-.7.9-2.2-1.2-2.2 2.8-2.8 2.2 1.2 2.2-.9z','circle','12','12','3']
};
function llMenuIcon(name) {
  const wrap = e('span','menu-icon ll-vector-menu-icon');
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24'); svg.setAttribute('fill','none');
  svg.setAttribute('stroke','currentColor'); svg.setAttribute('stroke-width','1.9');
  svg.setAttribute('stroke-linecap','round'); svg.setAttribute('stroke-linejoin','round');
  const a = LL_MENU_ICONS[name] || LL_MENU_ICONS['INÍCIO'];
  for(let i=0;i<a.length;){
    const tag=a[i++];const el=document.createElementNS('http://www.w3.org/2000/svg',tag);
    if(tag==='path')el.setAttribute('d',a[i++]);
    else if(tag==='circle'){el.setAttribute('cx',a[i++]);el.setAttribute('cy',a[i++]);el.setAttribute('r',a[i++]);}
    else if(tag==='ellipse'){el.setAttribute('cx',a[i++]);el.setAttribute('cy',a[i++]);el.setAttribute('rx',a[i++]);el.setAttribute('ry',a[i++]);}
    else if(tag==='rect'){el.setAttribute('x',a[i++]);el.setAttribute('y',a[i++]);el.setAttribute('width',a[i++]);el.setAttribute('height',a[i++]);el.setAttribute('rx',a[i++]);}
    svg.append(el);
  }
  wrap.append(svg);return wrap;
}

function nav() {
  const n = e("nav", "sidebar");
  ["INÍCIO", ...Object.keys(MENU)].forEach(name => {
    const b = e("button", "menu-button");
    b.dataset.name = name;
    b.append(llMenuIcon(name), e("span", "menu-label", name));
    if (name !== "INÍCIO") b.append(e("span", "menu-arrow", "›"));
    b.onclick = () => {
      if (name === "INÍCIO") { home(); return; }
      const sub = document.getElementById("sub-" + name);
      const wasOpen = sub && sub.classList.contains("expanded");
      document.querySelectorAll(".submenu").forEach(x => x.classList.remove("expanded"));
      if (!wasOpen && sub) sub.classList.add("expanded");
      category(name);
      if (wasOpen && sub) sub.classList.remove("expanded");
    };
    n.append(b);
    if (name !== "INÍCIO") {
      const sub = e("div", "submenu");
      sub.id = "sub-" + name;
      MENU[name].forEach(x => {
        const a = e("button", "submenu-item", x);
        a.dataset.target = x;
        a.onclick = () => {
          if (name === "CAIXA") {
            if (x === "ABERTURA E MOVIMENTAÇÕES") return open("CAIXA");
            return open(x);
          }
          open(x);
        };
        sub.append(a);
      });
      n.append(sub);
    }
  });
  return n;
}

function active(name) {
  document.querySelectorAll(".menu-button").forEach(b => {
    const selected = b.dataset.name === name;
    b.classList.toggle("active", selected);
    const arrow = b.querySelector(".menu-arrow");
    if (arrow) arrow.textContent = selected ? "⌄" : "›";
  });
  document.querySelectorAll(".submenu").forEach(sub => {
    sub.classList.toggle("expanded", sub.id === "sub-" + name);
  });
  document.querySelectorAll(".submenu-item").forEach(b => {
    b.classList.toggle("selected", b.dataset.target === screen && b.closest(".submenu")?.id === "sub-" + name);
  });
}

/* =========================================
   TELA INÍCIO
========================================= */

function home() {
  screen = 'INÍCIO';
  root().replaceChildren();
  const loja = read('erp_systems_dados_loja_v1', {});
  const now = new Date();
  const month = now.getMonth()+1;
  const year = now.getFullYear();
  const meses = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
  const periodo = String(year)+'-'+String(month).padStart(2,'0');
  const area = e('section','ll-home ll-home-v752');
  const hero = e('div','ll-home-hero');
  if (typeof loja.logo === 'string' && loja.logo.startsWith('data:image/')) {
    const img=e('img','ll-company-logo');img.src=loja.logo;img.alt='LOGO DA EMPRESA';hero.append(img);
  } else hero.append(e('div','ll-home-placeholder',loja.nome||'LOGO DA EMPRESA'));
  // V758: a tela INÍCIO começa diretamente pelos quadros.
  const grid=e('div','ll-home-grid ll-home-grid-v754');
  const datePeriod=d=>{const v=String(d||'');return /^\d{4}-\d{2}/.test(v)?v.slice(0,7):/^\d{2}\/\d{2}\/\d{4}/.test(v)?v.slice(6,10)+'-'+v.slice(3,5):''};
  const operations=read('erp_matriz_operacoes_v2',{});
  const sales=Array.isArray(operations.vendas)&&operations.vendas.length?operations.vendas:read('erp_matriz_vendas_v1',[]);
  const selectedSales=(Array.isArray(sales)?sales:[]).filter(v=>String(v.situacao||'').toUpperCase()==='BAIXADA'&&datePeriod(v.dataBaixa||v.data)===periodo);
  const seller=new Map(),product=new Map();
  selectedSales.forEach(v=>{
    const name=String(v.vendedorNome||v.vendedor||'').trim();if(name)seller.set(name,(seller.get(name)||0)+1);
    (Array.isArray(v.itens)?v.itens:[]).forEach(it=>{const n=String(it.descricao||it.produto||it.nome||it.codigo||'').trim();if(n)product.set(n,(product.get(n)||0)+(Number(it.quantidade)||0))});
  });
  const ordered=(m,limit=3)=>[...m.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'pt-BR')).slice(0,limit);
  const homeIcon=(kind)=>{
    const paths={
      megaphone:['M3 11v2','M5 10v4','M5 10 19 5v14L5 14','M7 15l2 5h3l-2-5','M21 10v4'],
      birthday:['M4 21h16','M5 21v-8h14v8','M7 13V9','M12 13V9','M17 13V9','M7 5v1','M12 5v1','M17 5v1','M5 17c2 2 4-2 7 0s5 2 7 0'],
      chart:['M4 20V12h4v8','M10 20V8h4v12','M16 20V4h4v16','M2 21h20'],
      box:['M12 2 3 7v10l9 5 9-5V7L12 2Z','M3 7l9 5 9-5','M12 12v10']
    };
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('width','27');svg.setAttribute('height','27');
    svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','2');
    svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');
    (paths[kind]||paths.box).forEach(d=>{const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',d);svg.append(p)});
    return svg;
  };
  const card=(title,icon,periodText)=>{const c=e('section','ll-home-card');const h=e('div','ll-home-card-head');const iconWrap=e('span','ll-home-heading-icon');iconWrap.append(homeIcon(icon));h.append(iconWrap,e('span','ll-home-heading-label',title));c.append(h);return c};
  const rank=(title,icon,data,unit)=>{
    const c=card(title,icon,meses[month-1]+'/'+year);
    const header=e('div','ll-home-rank-columns');header.append(e('span','','POS.'),e('span','',unit==='VENDAS'?'VENDEDOR':'PRODUTO'),e('span','',unit==='VENDAS'?'QUANT. DE VENDAS':'QUANTIDADE'));c.append(header);
    if(!data.length)c.append(e('p','ll-home-empty','NENHUMA VENDA BAIXADA NO PERÍODO.'));
    data.forEach(([name,count],i)=>{const r=e('div','ll-home-rank-row');r.append(e('span','ll-home-medal',''+(i+1)+'º'),e('strong','ll-home-rank-name',name),e('strong','ll-home-rank-value',count+' '+unit));c.append(r)});
    return c;
  };
  const topVendedores=rank('TOP 3 VENDEDORES','chart',ordered(seller),'VENDAS');
  const topProdutos=rank('TOP 10 PRODUTOS MAIS VENDIDOS','box',ordered(product,10),'UN');
  const notices=card('MURAL DE AVISOS','megaphone',meses[month-1]+'/'+year);
  const noticeBody=e('div','ll-home-notice-body');notices.append(noticeBody);
  const noticeKey='ll_mural_avisos_v752';
  const allNotices=()=>{const x=read(noticeKey,[]);return Array.isArray(x)?x:[]};
  const currentNotices=()=>allNotices().filter(x=>x.periodo===periodo).sort((a,b)=>String(b.data||'').localeCompare(String(a.data||'')));
  let selectedNotice=null;
  function renderNotices(){noticeBody.replaceChildren();const list=currentNotices();noticeBody.style.setProperty('--ll-notice-count',String(Math.max(1,list.length)));if(!list.length)noticeBody.append(e('p','ll-home-empty','NENHUM AVISO PUBLICADO PARA ESTE MÊS.'));
    list.forEach(n=>{const item=e('div','ll-home-notice');item.tabIndex=0;const content=e('div','ll-home-notice-text');content.append(e('strong','',n.titulo),e('p','',n.mensagem));item.append(content);item.onclick=()=>{selectedNotice=n.id;noticeBody.querySelectorAll('.ll-home-notice').forEach(x=>x.classList.remove('selected'));item.classList.add('selected')};noticeBody.append(item)});
  }
  renderNotices();
  const auth=read('erp_matriz_usuarios_v1',{});const users=Array.isArray(auth.usuarios)?auth.usuarios:[];
  const actor=String(window.LucasLimaAuditoria?.usuarioAtual?.()||document.querySelector('.top-user strong')?.textContent||'').trim();
  const user=users.find(u=>[u.nome,u.login,u.id].some(v=>String(v||'').toUpperCase()===actor.toUpperCase()));
  const isAdmin=!!user&&String(user.perfil||'').toUpperCase()==='ADMINISTRADOR'&&String(user.situacao||'ATIVO').toUpperCase()==='ATIVO';
  if(isAdmin){const actions=e('div','ll-home-notice-actions');
    const novo=e('button','ll-home-action green','＋ NOVO'),alter=e('button','ll-home-action blue','✎ ALTERAR'),del=e('button','ll-home-action red','▤ EXCLUIR');
    // Janelas internas do sistema, sem prompt/alert/confirm do navegador.
    const muralDialog=(config)=>{
      const overlay=document.createElement('div');overlay.className='ll-mural-overlay';
      overlay.style.cssText='position:fixed;inset:0;background:rgba(2,17,42,.58);z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box';
      const modal=document.createElement('div');modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.style.cssText='background:#fff;border-radius:12px;box-shadow:0 18px 60px #0006;width:min(520px,100%);overflow:hidden;color:#092b58;font-family:Arial,sans-serif';
      const head=document.createElement('div');head.textContent=config.title;head.style.cssText='background:#092d5e;color:#fff;padding:16px 20px;font-size:17px;font-weight:700';
      const body=document.createElement('div');body.style.cssText='padding:22px 22px 12px';
      const foot=document.createElement('div');foot.style.cssText='padding:12px 22px 20px;display:flex;gap:10px;justify-content:flex-end';
      const makeButton=(label,bg,action)=>{const btn=document.createElement('button');btn.type='button';btn.textContent=label;btn.style.cssText='border:0;border-radius:7px;padding:10px 20px;background:'+bg+';color:#fff;font-weight:700;cursor:pointer';btn.onclick=action;return btn};
      const close=()=>{document.removeEventListener('keydown',esc);overlay.remove()};
      const esc=(ev)=>{if(ev.key==='Escape'){ev.preventDefault();close()}};
      document.addEventListener('keydown',esc);
      modal.append(head,body,foot);overlay.append(modal);document.body.append(overlay);
      return {body,foot,close,makeButton};
    };
    const muralMessage=(message)=>{const dlg=muralDialog({title:'MURAL DE AVISOS'});const p=document.createElement('p');p.textContent=message;p.style.cssText='margin:0 0 12px;font-size:15px';dlg.body.append(p);dlg.foot.append(dlg.makeButton('CONFIRMAR','#073c83',dlg.close))};
    const edit=(existing)=>{
      const dlg=muralDialog({title:existing?'ALTERAR AVISO':'NOVO AVISO'});
      const field=(label,value,multiline)=>{const wrap=document.createElement('div');wrap.style.cssText='margin-bottom:16px';const lab=document.createElement('label');lab.textContent=label;lab.style.cssText='display:block;font-size:13px;font-weight:700;margin-bottom:7px';const input=document.createElement(multiline?'textarea':'input');input.value=value||'';input.style.cssText='width:100%;box-sizing:border-box;border:1px solid #9ab0ce;border-radius:7px;padding:10px;font:14px Arial,sans-serif;outline-color:#1264c7';if(multiline)input.style.minHeight='105px';wrap.append(lab,input);dlg.body.append(wrap);return input};
      const title=field('TÍTULO DO AVISO',existing?.titulo,false);
      const msg=field('MENSAGEM DO AVISO',existing?.mensagem,true);
      const error=document.createElement('p');error.style.cssText='color:#c51c24;font-size:13px;min-height:16px;margin:0';dlg.body.append(error);
      dlg.foot.append((()=>{const b=dlg.makeButton('CANCELAR','#eaf3ff',dlg.close);b.style.color='#14549a';b.style.border='1px solid #c4d8fa';return b})(),dlg.makeButton(existing?'ALTERAR':'GRAVAR','#073c83',()=>{
        const titulo=title.value.trim(),mensagem=msg.value.trim();if(!titulo){error.textContent='INFORME O TÍTULO DO AVISO.';title.focus();return}if(!mensagem){error.textContent='INFORME A MENSAGEM DO AVISO.';msg.focus();return}
        const records=allNotices();if(existing){const i=records.findIndex(x=>x.id===existing.id);if(i<0){dlg.close();muralMessage('AVISO NÃO ENCONTRADO.');return}records[i]={...existing,titulo,mensagem,usuario:actor||'ADMINISTRADOR'}}else records.push({id:Date.now()+'-'+Math.random().toString(36).slice(2),periodo,titulo,mensagem,data:new Date().toLocaleDateString('pt-BR'),usuario:actor||'ADMINISTRADOR'});
        localStorage.setItem(noticeKey,JSON.stringify(records));selectedNotice=null;renderNotices();dlg.close();
      }));title.focus();
    };
    novo.onclick=()=>edit(null);
    alter.onclick=()=>{const item=currentNotices().find(x=>x.id===selectedNotice);if(!item){muralMessage('SELECIONE UM AVISO.');return}edit(item)};
    del.onclick=()=>{const item=currentNotices().find(x=>x.id===selectedNotice);if(!item){muralMessage('SELECIONE UM AVISO.');return}
      const dlg=muralDialog({title:'EXCLUIR AVISO'});const p=document.createElement('p');p.textContent='CONFIRMAR EXCLUSÃO DO AVISO?';p.style.cssText='margin:0 0 12px;font-size:15px';dlg.body.append(p);
      dlg.foot.append((()=>{const b=dlg.makeButton('CANCELAR','#eaf3ff',dlg.close);b.style.color='#14549a';b.style.border='1px solid #c4d8fa';return b})(),dlg.makeButton('CONFIRMAR','#073c83',()=>{localStorage.setItem(noticeKey,JSON.stringify(allNotices().filter(x=>x.id!==item.id)));selectedNotice=null;renderNotices();dlg.close()}));
    };
    actions.append(novo,alter,del);notices.append(actions);
  }
  const birthdays=card('ANIVERSARIANTES','birthday',meses[month-1]);
  const rh=read('erp_matriz_rh_v1',{funcionarios:[]});const people=Array.isArray(rh.funcionarios)?rh.funcionarios:[];
  const born=people.filter(f=>String(f.situacao||'ATIVO').toUpperCase()==='ATIVO'&&f.nascimento&&f.exibirAniversarioInicio!==false&&String(f.exibirAniversarioInicio||'').toUpperCase()!=='NÃO').map(f=>{const v=String(f.nascimento);let m=0,d=0;if(/^\d{4}-\d{2}-\d{2}/.test(v)){m=Number(v.slice(5,7));d=Number(v.slice(8,10))}else if(/^\d{2}\/\d{2}\/\d{4}/.test(v)){m=Number(v.slice(3,5));d=Number(v.slice(0,2))}return {...f,birthMonth:m,birthDay:d}}).filter(f=>f.birthMonth===month).sort((a,b)=>a.birthDay-b.birthDay||String(a.nome).localeCompare(String(b.nome),'pt-BR'));
  if(!born.length)birthdays.append(e('p','ll-home-empty','NENHUM ANIVERSARIANTE NESTE MÊS.'));
  born.forEach(f=>{const r=e('div','ll-home-birthday');r.append(e('strong','ll-home-birthday-name',f.nome||'FUNCIONÁRIO'),e('strong','ll-home-birthday-date','DIA '+String(f.birthDay).padStart(2,'0')+'/'+String(month).padStart(2,'0')));birthdays.append(r)});
  hero.classList.add('ll-home-logo-panel');
  grid.append(hero,notices,birthdays,topVendedores,topProdutos);
  area.append(grid);root().append(area);active('INÍCIO');
  window.llInicioMesAtual=periodo;
  if(!window.llInicioVerificadorMensal){
    window.llInicioVerificadorMensal=setInterval(()=>{
      const hoje=new Date();const atual=hoje.getFullYear()+'-'+String(hoje.getMonth()+1).padStart(2,'0');
      if(screen==='INÍCIO'&&window.llInicioMesAtual!==atual)home();
    },60000);
    document.addEventListener('visibilitychange',()=>{
      if(document.visibilityState==='visible'&&screen==='INÍCIO'){
        const hoje=new Date();const atual=hoje.getFullYear()+'-'+String(hoje.getMonth()+1).padStart(2,'0');
        if(window.llInicioMesAtual!==atual)home();
      }
    });
  }
}

/* =========================================
   NAVEGAÇÃO DOS MÓDULOS
========================================= */

const MODULE_VISUAL = {
  "PRODUTOS": ["⬡", "#e0edff", "#1262e8", "Cadastre e gerencie seus produtos."],
  "CLIENTES": ["♟", "#dcf8e8", "#00864d", "Cadastre e gerencie seus clientes."],
  "FORNECEDORES": ["🚚", "#ffe4e6", "#d51c47", "Gerencie seus fornecedores."],
  "MARCAS": ["◆", "#fff0dc", "#f47b12", "Cadastre e gerencie suas marcas."],
  "CATEGORIAS": ["▦", "#f0e2ff", "#7b29d7", "Organize as categorias."],
  "UNIDADES": ["▤", "#fff4cc", "#d38b00", "Gerencie unidades de medida."],
  "VENDEDORES": ["♟", "#ffe0ec", "#d71354", "Cadastre seus vendedores."],
  "FUNCIONÁRIOS": ["▣", "#def1ff", "#1385df", "Gerencie seus funcionários."],
  "USUÁRIOS": ["●", "#eee5ff", "#7730e4", "Gerencie acessos ao sistema."],
  "FORMAS DE PAGAMENTO": ["▰", "#d8f8ee", "#008d67", "Gerencie as formas de pagamento."],
  "VENDAS": ["🛒", "#e1f8e9", "#14965e", "Registre e acompanhe vendas."],
  "ORÇAMENTOS": ["▤", "#e0edff", "#1262e8", "Elabore orçamentos para clientes."],
  "TROCAS": ["⇄", "#fff0dc", "#e18413", "Gerencie trocas de produtos."],
  "CAIXA": ["▣", "#fff0dc", "#d88813", "Abertura, sangrias e fechamento."]
};
const MODULE_ICONS = ["▣","⬡","▤","◆","◈","▥","◉","▦","⇄","▰"];
function category(name) {
  screen = name;
  root().replaceChildren();
  const panel = e("section", "module-screen modern-module");
  const heading = e("div", "module-heading");
  const badge = e("div", "module-heading-icon", SYMBOL[name] || "▦");
  const titles = e("div", "module-heading-text");
  titles.append(e("h1", "", name), e("p", "", ""));
  const right = e("div", "module-heading-tools");
  const breadcrumb = e("div", "module-breadcrumb");
  const inicioLink = e("button", "ll-breadcrumb-home", "⌂  Início");
  inicioLink.type = "button";
  inicioLink.title = "VOLTAR AO INÍCIO";
  inicioLink.setAttribute("aria-label", "Voltar ao início");
  inicioLink.onclick = (event) => { event.preventDefault(); event.stopPropagation(); home(); };
  breadcrumb.append(inicioLink, document.createTextNode("  ›  " + name));
  right.append(breadcrumb);
  const search = e("input", "module-search");
  search.placeholder = "Pesquisar no módulo...";
  search.setAttribute("aria-label", "Pesquisar opções do módulo");
  right.append(search);
  heading.append(badge, titles, right);
  const g = e("div", "module-grid");
  (MENU[name] || []).forEach((x,i) => {
    const info = MODULE_VISUAL[x] || [MODULE_ICONS[i % MODULE_ICONS.length], ["#e0edff","#e0f8ee","#ffe5e5","#f1e7ff"][i%4], ["#1767e9","#09825b","#d34352","#7e34d5"][i%4], "Acesse e gerencie " + x.toLowerCase() + "."];
    const b = e("button", "module-button");
    const icon = e("span", "module-card-icon", info[0]);
    icon.style.background = info[1]; icon.style.color = info[2];
    const body = e("span", "module-card-text");
    body.append(e("strong", "", x), e("small", "", info[3]));
    b.append(icon,body,e("span","module-card-arrow","›"));
    b.onclick = () => open(name === "CAIXA" && x === "ABERTURA E MOVIMENTAÇÕES" ? "CAIXA" : x);
    g.append(b);
  });
  search.oninput = () => { const term = search.value.toLocaleUpperCase("pt-BR"); [...g.children].forEach(b => b.hidden = !b.textContent.toLocaleUpperCase("pt-BR").includes(term)); };
  panel.append(heading,g);
  root().append(panel);
  active(name);
}

window.LL_abrirCadastroClienteDaVenda = function(){
  window.LL_cadastroClienteDaVenda = true;
  open("CLIENTES");
  if(screen!=="CLIENTES")window.LL_cadastroClienteDaVenda=false;
  else clearClient();
  return screen==="CLIENTES";
};

function open(name) {
  // V172: verificar a permissão na navegação central, independentemente do botão usado.
  if (window.LucasLimaPermissoes && !window.LucasLimaPermissoes.checkPage(name)) return;
  if (name === "PRODUTOS") {
    productScreen();
    return;
  }
  if (name === "CLIENTES") {
    clientScreen();
    return;
  }

  if (["MARCAS", "CATEGORIAS", "UNIDADES"].includes(name)) {
    auxScreen(name);
    return;
  }

  screen = name;
  root().replaceChildren();

  const panel = e("section", "module-screen");

  panel.append(
    e("h1", "", name),
    e("p", "", "Módulo previsto para desenvolvimento.")
  );

  const back = e("button", "primary-button", "VOLTAR AO INÍCIO");
  back.onclick = home;

  panel.append(back);
  root().append(panel);
  active(Object.keys(MENU).find(key => MENU[key].includes(name)) || "CADASTROS");
}

/* =========================================
   CADASTROS AUXILIARES
========================================= */

async function cadastrarAux(kind) {
  const value = await janela({
    titulo: "CADASTRO DE " + kind,
    mensagem: "Informe a descrição do novo registro.",
    campo: "DESCRIÇÃO",
    placeholder: "Digite a descrição...",
    confirmar: "GRAVAR",
    validar: text => {
      const v = text.trim().toUpperCase();

      if (!v) return "INFORME A DESCRIÇÃO.";

      if (aux[kind].includes(v)) {
        return "DESCRIÇÃO JÁ CADASTRADA.";
      }

      return "";
    }
  });

  if (value === null) return;

  const v = value.toUpperCase();

  const novoAux = {
    ...aux,
    [kind]: [...aux[kind], v]
  };

  if (save(AUX, novoAux)) {
    aux = novoAux;
    refreshAux(kind, v);

    if (screen === kind) {
      auxScreen(kind);
    }

    await aviso("SUCESSO", "REGISTRO GRAVADO COM SUCESSO.");
  }
}

function auxScreen(kind) {
  screen = kind;
  root().replaceChildren();

  const p = e("section", "module-screen");
  p.append(e("h1", "", "CADASTRO DE " + kind));

  const add = e("button", "primary-button", "NOVO CADASTRO");
  add.onclick = () => cadastrarAux(kind);

  const list = e("div", "aux-list");

  aux[kind].forEach(x => {
    list.append(e("div", "", x));
  });

  const back = e("button", "primary-button", "VOLTAR A PRODUTOS");
  back.onclick = productScreen;

  p.append(add, list, back);
  root().append(p);
  active("CADASTROS");
}

function inputField(id, type = "text", placeholder = "") {
  const n = e("input");
  n.id = id;
  n.type = type;
  n.placeholder = placeholder;
  return n;
}

function selectField(id, values) {
  const n = e("select");
  n.id = id;

  values.forEach(v => {
    const o = e("option", "", v);
    o.value = v;
    n.append(o);
  });

  return n;
}

function field(label, control, extra = null) {
  const box = e("label", "field");

  box.append(e("span", "field-label", label));

  const row = e("div", "field-control");
  row.append(control);

  if (extra) row.append(extra);

  box.append(row);
  return box;
}

function plus(kind) {
  const b = e("button", "field-plus", "+");
  b.type = "button";
  b.title = "Cadastrar " + kind.toLowerCase();
  b.onclick = () => cadastrarAux(kind);
  return b;
}

function refreshAux(kind, value = "") {
  const ids = {
    MARCAS: "p-marca",
    CATEGORIAS: "p-categoria",
    UNIDADES: "p-unidade"
  };

  const s = document.getElementById(ids[kind]);
  if (!s) return;

  const old = value || s.value;

  s.replaceChildren();

  const vazio = e("option", "", "Selecione...");
  vazio.value = "";
  s.append(vazio);

  aux[kind].forEach(v => {
    const o = e("option", "", v);
    o.value = v;
    s.append(o);
  });

  s.value = old;

  if (s.selectedIndex < 0) s.value = "";
}

/* =========================================
   CADASTRO DE PRODUTOS
========================================= */

function stock(p) {
  const a = Number(p?.provisao || 0);
  const b = Number(p?.venda || 0);

  const sa = document.getElementById("stock-a");
  const sb = document.getElementById("stock-b");
  const sc = document.getElementById("stock-c");

  if (sa) sa.textContent = a;
  if (sb) sb.textContent = b;
  if (sc) sc.textContent = a - b;
}

// Foto armazenada junto ao cadastro, sem alterar o estoque.
let productImageDraft = "";
function refreshProductImage() {
  const img = document.getElementById("p-image-preview");
  const empty = document.getElementById("p-image-empty");
  if (img) { img.src = productImageDraft || ""; img.hidden = !productImageDraft; }
  if (empty) empty.hidden = !!productImageDraft;
}
function setProductImage(value) { productImageDraft = value || ""; refreshProductImage(); }
function chooseProductImage() {
  const picker = document.getElementById("p-image-file");
  if (picker) picker.click();
}
function processProductImage(file) {
  if (!file) return;
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
    aviso("IMAGEM DO PRODUTO", "SELECIONE UMA IMAGEM JPG, PNG OU WEBP."); return;
  }
  if (file.size > 5 * 1024 * 1024) {
    aviso("IMAGEM DO PRODUTO", "A IMAGEM NÃO PODE ULTRAPASSAR 5 MB."); return;
  }
  const reader = new FileReader();
  reader.onerror = () => aviso("IMAGEM DO PRODUTO", "NÃO FOI POSSÍVEL LER A IMAGEM.");
  reader.onload = () => {
    const image = new Image();
    image.onerror = () => aviso("IMAGEM DO PRODUTO", "ARQUIVO DE IMAGEM INVÁLIDO.");
    image.onload = () => {
      const max = 720;
      const scale = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      setProductImage(canvas.toDataURL("image/jpeg", 0.76));
    };
    image.src = String(reader.result);
  };
  reader.readAsDataURL(file);
}

function clearProduct() {
  current = null;
  setProductImage("");

  [
    "p-desc", "p-bar", "p-custo",
    "p-preco", "p-min", "p-peso", "p-local", "p-notes"
  ].forEach(id => set(id, ""));

  set("p-code", next());
  set("p-type", "PRODUTO PARA VENDA");
  set("p-status", "ATIVO");

  const ids = {
    MARCAS: "p-marca",
    CATEGORIAS: "p-categoria",
    UNIDADES: "p-unidade"
  };

  Object.keys(ids).forEach(k => {
    refreshAux(k);
    set(ids[k], "");
  });

  stock(null);
  set("p-usuario", "");

  const desc = document.getElementById("p-desc");
  if (desc) desc.focus();
}

function loadProduct(code) {
  products = typeof window.LL_estoqueCentralConciliar === "function" ? window.LL_estoqueCentralConciliar() : read(KEY, []); // Estoque central atualizado após baixas/cancelamentos.
  const p = products.find(
    x => Number(x.codigo) === Number(code)
  );

  if (!p) {
    aviso("LOCALIZAR PRODUTO", "PRODUTO NÃO ENCONTRADO.");
    return;
  }

  current = Number(p.codigo);
  setProductImage(p.imagem || "");

  ["MARCAS", "CATEGORIAS", "UNIDADES"].forEach(k => {
    refreshAux(k);
  });

  const values = {
    "p-code": p.codigo,
    "p-type": p.tipo,
    "p-desc": p.descricao,
    "p-bar": p.barras,
    "p-marca": p.marca,
    "p-categoria": p.categoria,
    "p-unidade": p.unidade,
    "p-custo": money(p.custo),
    "p-preco": money(p.preco),
    "p-min": p.minimo,
    "p-peso": p.peso || "",
    "p-local": p.localizacao || "",
    "p-notes": p.observacoes || "",
    "p-status": p.situacao
  };

  Object.entries(values).forEach(([k, v]) => set(k, v));

  stock(p);
  set("p-usuario", p.usuario || p.alteradoPor || p.criadoPor || "NÃO REGISTRADO");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

async function saveProduct() {
  products = typeof window.LL_estoqueCentralConciliar === "function" ? window.LL_estoqueCentralConciliar() : read(KEY, []); // Não sobrescrever movimentos com cadastro em memória antigo.
  const desc = val("p-desc").toUpperCase();
  let bar = val("p-bar");
  const custoTexto = val("p-custo");
  const precoTexto = val("p-preco");

  if (!desc) {
    await aviso("VALIDAÇÃO", "INFORME A DESCRIÇÃO.");
    return;
  }

  // Cadastro inicial sem custo ou preço: ambos são opcionais.
  // O custo será atualizado ao baixar a entrada; o preço é definido manualmente.
  const custo = custoTexto.trim() === "" ? 0 : num(custoTexto);
  const preco = precoTexto.trim() === "" ? 0 : num(precoTexto);

  if (!Number.isFinite(custo) || !Number.isFinite(preco) || custo < 0 || preco < 0) {
    await aviso("VALIDAÇÃO", "CUSTO E PREÇO DE VENDA NÃO PODEM SER NEGATIVOS OU INVÁLIDOS.");
    return;
  }

  if (
    !val("p-marca") ||
    !val("p-categoria") ||
    !val("p-unidade")
  ) {
    await aviso(
      "VALIDAÇÃO",
      "SELECIONE MARCA, CATEGORIA E UNIDADE."
    );
    return;
  }

  if (
    products.some(p =>
      Number(p.codigo) !== current &&
      String(p.descricao).toUpperCase() === desc
    )
  ) {
    await aviso("VALIDAÇÃO", "DESCRIÇÃO JÁ CADASTRADA.");
    return;
  }

  if (
    bar &&
    products.some(p =>
      Number(p.codigo) !== current &&
      p.barras === bar
    )
  ) {
    await aviso(
      "VALIDAÇÃO",
      "CÓDIGO DE BARRAS JÁ CADASTRADO."
    );
    return;
  }

  const prev = products.find(
    p => Number(p.codigo) === current
  );

  const tipo = val("p-type");

  if (
    prev &&
    prev.tipo !== tipo &&
    (
      Number(prev.provisao || 0) !== 0 ||
      Number(prev.venda || 0) !== 0
    )
  ) {
    await aviso(
      "VALIDAÇÃO",
      "TIPO NÃO PODE SER ALTERADO APÓS MOVIMENTAÇÃO."
    );
    return;
  }

  const history = prev
    ? [...(prev.historico || [])]
    : [];

  if (prev && Number(prev.custo) !== custo) history.push({
    data: new Date().toISOString(), tipo: "CUSTO DE COMPRA",
    anterior: prev.custo, atual: custo, origem: "ALTERAÇÃO MANUAL"
  });
  if (prev && Number(prev.preco) !== preco) history.push({
    data: new Date().toISOString(), tipo: "PREÇO DE VENDA",
    anterior: prev.preco, atual: preco, origem: "ALTERAÇÃO MANUAL"
  });
  if (prev) for (const [key,label,novo] of [
    ["descricao","DESCRIÇÃO",desc], ["marca","MARCA",val("p-marca")],
    ["categoria","CATEGORIA",val("p-categoria")], ["unidade","UNIDADE",val("p-unidade")],
    ["situacao","SITUAÇÃO",val("p-status")], ["barras","CÓDIGO DE BARRAS",bar],
    ["tipo","TIPO",val("p-type")], ["peso","PESO",val("p-peso")],
    ["localizacao","LOCALIZAÇÃO",val("p-local").toUpperCase()],
    ["observacoes","OBSERVAÇÕES",val("p-notes")]
  ]) if (String(prev[key] ?? "") !== String(novo ?? "")) history.push({
    data:new Date().toISOString(), tipo:"CADASTRO — "+label,
    anterior:prev[key]??"", atual:novo, origem:"ALTERAÇÃO CADASTRAL"
  });

  const minimoTexto = val("p-min");
  const minimo = minimoTexto === "" ? 0 : num(minimoTexto);

  if (!Number.isFinite(minimo) || minimo < 0) {
    await aviso("VALIDAÇÃO", "ESTOQUE MÍNIMO INVÁLIDO.");
    return;
  }

  if (!bar) bar = prev?.barras || PM.barcode(next());
  if (products.some(p => Number(p.codigo) !== current && p.barras === bar)) {
    await aviso("VALIDAÇÃO", "CÓDIGO DE BARRAS JÁ CADASTRADO."); return;
  }
  const item = {
    ...prev,
    codigo: prev ? Number(prev.codigo) : next(),
    tipo,
    descricao: desc,
    barras: bar,
    marca: val("p-marca"),
    categoria: val("p-categoria"),
    unidade: val("p-unidade"),
    custo,
    preco,
    minimo,
    peso: val("p-peso"),
    localizacao: val("p-local").toUpperCase(),
    observacoes: val("p-notes"),
    situacao: val("p-status"),
    imagem: productImageDraft,
    provisao: Number(prev?.provisao || 0),
    venda: Number(prev?.venda || 0),
    historico: history
  };

  // Não modificar o responsável quando nenhum dado cadastral mudou.
  const tracked = ["tipo","descricao","barras","marca","categoria","unidade", "custo","preco","minimo","peso","localizacao","observacoes","situacao","imagem"];
  const modified = !prev || tracked.some(k => String(prev[k] ?? "") !== String(item[k] ?? ""));
  if (prev && !modified) {
    set("p-usuario", prev.usuario || prev.alteradoPor || prev.criadoPor || "NÃO REGISTRADO");
    await aviso("PRODUTO", "NENHUMA ALTERAÇÃO IDENTIFICADA.");
    return;
  }
  const operator = window.LucasLimaAuditoria?.usuarioAtual?.() ||
    document.querySelector('.top-user strong')?.textContent?.trim() || 'USUÁRIO NÃO IDENTIFICADO';
  const timestamp = new Date().toISOString();
  item.usuario = operator;
  item.criadoPor = prev?.criadoPor || prev?.usuario || operator;
  item.criadoEm = prev?.criadoEm || timestamp;
  item.alteradoPor = operator;
  item.alteradoEm = timestamp;
  const previousHistory = Array.isArray(prev?.historicoOperacoes) ? prev.historicoOperacoes : [];
  item.historicoOperacoes = [...previousHistory, {
    acao: prev ? "ALTERAÇÃO" : "CADASTRO",
    usuario: operator,
    data: timestamp,
    alteracoes: prev ? tracked.filter(k => String(prev[k] ?? "") !== String(item[k] ?? ""))
      .map(k => ({campo:k, anterior:prev[k] ?? "", novo:item[k] ?? ""})) : []
  }];
  const newList = prev
    ? products.map(p =>
        Number(p.codigo) === item.codigo ? item : p
      )
    : [...products, item];

  if (!save(KEY, newList)) return;

  // A auditoria do armazenamento pode complementar o registro: recarregar o valor persistido.
  products = read(KEY, newList);
  current = item.codigo;
  const persisted = products.find(x => Number(x.codigo) === Number(current)) || item;
  set("p-usuario", persisted.usuario || operator);

  set("p-code", item.codigo);
  set("p-bar", item.barras);
  stock(item);
  renderList();

  await aviso("SUCESSO", "PRODUTO GRAVADO COM SUCESSO!");
}

async function history() { return PM.history(); }

let productSearchExecuted = false;

function renderList() {
  products = read(KEY, []);
  const body = document.getElementById("product-rows");
  if (!body) return;

  body.replaceChildren();
  if (!productSearchExecuted) {
    const tr = e("tr");
    const td = e("td", "", "CLIQUE EM PESQUISAR PARA EXIBIR OS PRODUTOS.");
    td.colSpan = 11;
    tr.append(td);
    body.append(tr);
    const count = document.getElementById("found-count");
    if (count) count.textContent = "";
    return;
  }

  const q = val("p-search").toUpperCase();

  const activeOnly =
    document.getElementById("only-active").checked;

  const kind = val("p-filter");

  const found = products.filter(p => {
    const situacaoOk =
      !activeOnly || p.situacao === "ATIVO";

    const tipoOk =
      kind === "Todos os produtos" ||
      p.tipo === kind;

    const textoOk = [
      p.codigo, p.descricao, p.barras,
      p.marca, p.categoria
    ].some(v =>
      String(v || "").toUpperCase().includes(q)
    );

    return situacaoOk && tipoOk && textoOk;
  }).sort((a, b) =>
    a.descricao.localeCompare(b.descricao, "pt-BR")
  );

  found.forEach(p => {
    const tr = e("tr");

    const valores = [
      p.codigo,
      p.descricao,
      p.barras,
      p.marca,
      p.categoria,
      p.unidade,
      money(p.custo),
      money(p.preco),
      p.provisao,
      p.situacao
    ];

    valores.forEach((v, i) => {
      const td = e("td", "", String(v ?? ""));

      if (i === 9) {
        td.className =
          p.situacao === "ATIVO"
            ? "status-active"
            : "status-inactive";
      }

      tr.append(td);
    });

    const cell = e("td");
    const edit = e("button", "edit-button", "✎");

    edit.title = "Abrir produto";
    edit.onclick = () => loadProduct(p.codigo);

    cell.append(edit);
    tr.append(cell);

    tr.ondblclick = () => loadProduct(p.codigo);
    body.append(tr);
  });

  document.getElementById("found-count").textContent =
    found.length + " PRODUTO(S) ENCONTRADO(S)";
}

/* =========================================
   TELA DO CADASTRO DE PRODUTOS
========================================= */

function productScreen() {
  products = read(KEY, []);
  productSearchExecuted = false;
  screen = "PRODUTOS";
  root().replaceChildren();

  const layout = e("div", "product-layout");
  const main = e("section", "product-main product-employee-layout");
  const stockPanel = e("aside", "product-stock");

  // Cabeçalho no mesmo padrão visual do Cadastro de Clientes.
  const productHeader = e("div", "product-heading-row");
  productHeader.append(e("h1", "product-heading", "▣ CADASTRO DE PRODUTOS"));
  main.append(productHeader);
  main.append(e("div", "product-section-label", "DADOS DO PRODUTO"));

  const form = e("div", "product-form");

  const code = inputField("p-code");
  code.readOnly = true;

  const type = selectField("p-type", [
    "PRODUTO PARA VENDA",
    "PRODUTO DE ALMOXARIFADO",
    "MATÉRIA-PRIMA"
  ]);

  const desc = inputField("p-desc");
  const bar = inputField("p-bar");

  const barcode = e("button", "barcode-button", "▥");
  barcode.type = "button";
  barcode.title = "Focar código de barras";
  barcode.onclick = () => bar.focus();

  const brand = selectField("p-marca", ["Selecione..."]);
  const cat = selectField("p-categoria", ["Selecione..."]);
  const unit = selectField("p-unidade", ["Selecione..."]);

  const cost = inputField("p-custo", "text", "0,00");
  const price = inputField("p-preco", "text", "0,00");
  const min = inputField("p-min", "number", "0");
  min.min = "0";

  const peso = inputField("p-peso", "text", "Opcional");
  const local = inputField("p-local", "text", "Opcional");
  const notes = inputField("p-notes", "text", "Opcional");

  const status = selectField(
    "p-status",
    ["ATIVO", "INATIVO"]
  );

  const fields = e("div", "product-fields");

  const campos = [
    [field("CÓDIGO", code), "code"],
    [field("DESCRIÇÃO DO PRODUTO *", desc), "description"],
    [field("TIPO DO PRODUTO", type), "type"],
    [field("CÓDIGO DE BARRAS", bar, barcode), "barcode"],
    [field("MARCA", brand, plus("MARCAS")), "brand"],
    [field("CATEGORIA", cat, plus("CATEGORIAS")), "category"],
    [field("UNIDADE", unit, plus("UNIDADES")), "unit"],
    [field("CUSTO UNITÁRIO (R$)", cost), "cost"],
    [field("PREÇO DE VENDA (R$)", price), "price"],
    [field("ESTOQUE MÍNIMO", min), "minimum"],
    [field("SITUAÇÃO", status), "status"],
    [field("PESO (KG)", peso), "minimum"],
    [field("LOCALIZAÇÃO", local), "category"],
    [field("OBSERVAÇÕES", notes), "description"]
  ];

  campos.forEach(([node, cls]) => {
    node.classList.add("field-" + cls);
    fields.append(node);
  });

  // Campo vinculado ao produto selecionado, nunca à sessão de quem apenas consulta.
  const productUser = inputField("p-usuario");
  productUser.readOnly = true;
  productUser.title = "CLIQUE PARA CONSULTAR O HISTÓRICO DE USUÁRIOS";
  productUser.style.cursor = "pointer";
  const userLabel = field("USUÁRIO", productUser);
  userLabel.dataset.userAudit = "1"; // impede que rotinas genéricas insiram um campo duplicado
  userLabel.classList.add("field-minimum");
  fields.append(userLabel);
  productUser.addEventListener("click", () => {
    const selected = products.find(x => Number(x.codigo) === Number(current));
    if (!selected) { aviso("HISTÓRICO", "SELECIONE UM PRODUTO CADASTRADO."); return; }
    if (window.LucasLimaAuditoria?.abrirHistorico) window.LucasLimaAuditoria.abrirHistorico(selected);
    else aviso("HISTÓRICO", "HISTÓRICO INDISPONÍVEL.");
  });
  const photoPanel = e("section", "ll-product-photo-panel");
  photoPanel.append(e("h3", "ll-product-photo-title", "▣ IMAGEM DO PRODUTO"));
  const photoFrame = e("div", "ll-product-photo-frame");
  const photo = document.createElement("img");
  photo.id = "p-image-preview";
  photo.alt = "Foto do produto cadastrado";
  photo.hidden = true;
  const photoEmpty = e("div", "ll-product-photo-empty", "SEM IMAGEM\nANEXADA");
  photoEmpty.id = "p-image-empty";
  photoFrame.append(photo, photoEmpty);
  photoPanel.append(photoFrame);
  const picker = document.createElement("input");
  picker.type = "file"; picker.id = "p-image-file";
  picker.accept = "image/jpeg,image/png,image/webp";
  picker.hidden = true;
  picker.onchange = () => { processProductImage(picker.files?.[0]); picker.value = ""; };
  photoPanel.append(picker);
  for (const [label, cls, action] of [
    ["▣ ANEXAR IMAGEM", "blue", chooseProductImage],
    ["✎ ALTERAR IMAGEM", "orange", chooseProductImage],
    ["▤ REMOVER IMAGEM", "red", () => setProductImage("")]
  ]) {
    const b = e("button", "ll-product-photo-button " + cls, label);
    b.type = "button"; b.onclick = action; photoPanel.append(b);
  }
  photoPanel.append(e("small", "ll-product-photo-hint", "JPG, PNG ou WEBP • Até 5 MB\nA imagem será salva ao GRAVAR ou ALTERAR."));
  const photoLayout = e("div", "ll-product-photo-layout");
  photoLayout.append(fields, photoPanel);
  form.append(photoLayout);
  refreshProductImage();

  const actions = e("div", "product-actions");

  const botoes = [
    ["▤ NOVO (F2)", "green", clearProduct],
    ["▣ GRAVAR (F3)", "blue", saveProduct],
    [
      "✎ ALTERAR (F4)",
      "orange",
      () => {
        if (current === null) {
          aviso(
            "ALTERAR PRODUTO",
            "SELECIONE UM PRODUTO PARA ALTERAR."
          );
        } else {
          saveProduct();
        }
      }
    ],
    ["◷ HISTÓRICO", "purple", history],
    ["▣ SIMULAR PREÇOS", "orange", () => PM.simulator()],
    ["◆ PROMOÇÕES", "blue", () => Promo.open()],
    ["▥ ETIQUETAS", "slate", () => PM.labels()],
    ["▣ IMPRIMIR", "cyan", () => PM.printProduct()],
    ["➜ VOLTAR", "red", () => category("CADASTROS")]
  ];

  botoes.forEach(([label, color, fn]) => {
    const b = e(
      "button",
      "action-button " + color,
      label
    );

    b.onclick = fn;
    actions.append(b);
  });

  form.append(actions);
  main.append(form);

  stockPanel.append(
    e("h2", "", "⬡  ESTOQUE ATUAL")
  );

  [
    ["PROVISÃO", "stock-a", "yellow"],
    ["VENDA", "stock-b", "pink"],
    ["DISPONÍVEL", "stock-c", "mint"]
  ].forEach(([name, id, color]) => {
    const card = e("div", "stock-card " + color);

    card.append(e("strong", "", name));

    const value = e("b", "", "0");
    value.id = id;

    card.append(value);
    stockPanel.append(card);
  });

  stockPanel.append(
    e(
      "p",
      "stock-note",
      "ⓘ O estoque será atualizado pelos módulos de entradas, vendas e ajustes."
    )
  );

  layout.append(main, stockPanel);

  const search = e("section", "product-search");

  search.append(
    e("h2", "", "⌕ PESQUISA DE PRODUTOS")
  );

  const tools = e("div", "search-tools");

  const query = inputField(
    "p-search",
    "search",
    "Pesquisar por código, descrição, marca, categoria ou código de barras..."
  );

  query.oninput = () => { productSearchExecuted = false; renderList(); };

  const searchBtn = e(
    "button",
    "action-button blue",
    "PESQUISAR"
  );

  searchBtn.onclick = () => { productSearchExecuted = true; renderList(); };

  const activeLabel = e("label", "active-label");

  const only = inputField("only-active", "checkbox");
  only.checked = true;
  only.onchange = () => { productSearchExecuted = false; renderList(); };

  activeLabel.append(
    only,
    e("span", "", "Mostrar apenas ativos")
  );

  const filter = selectField("p-filter", [
    "Todos os produtos",
    "PRODUTO PARA VENDA",
    "PRODUTO DE ALMOXARIFADO",
    "MATÉRIA-PRIMA"
  ]);

  filter.onchange = () => { productSearchExecuted = false; renderList(); };

  tools.append(
    query, activeLabel, filter, searchBtn
  );

  search.append(tools);

  const scroll = e("div", "product-table-scroll");
  const table = e("table", "product-table");
  const thead = e("thead");
  const head = e("tr");

  [
    "CÓDIGO", "DESCRIÇÃO", "CÓDIGO DE BARRAS",
    "MARCA", "CATEGORIA", "UNIDADE",
    "CUSTO (R$)", "PREÇO (R$)", "ESTOQUE",
    "SITUAÇÃO", ""
  ].forEach(x => {
    head.append(e("th", "", x));
  });

  thead.append(head);

  const tbody = e("tbody");
  tbody.id = "product-rows";

  table.append(thead, tbody);
  scroll.append(table);
  search.append(scroll);

  const count = e("div", "found-count");
  count.id = "found-count";

  search.append(count);

  root().append(layout, search);

  ["MARCAS", "CATEGORIAS", "UNIDADES"].forEach(k => {
    refreshAux(k);
  });

  clearProduct();
  renderList();
  active("CADASTROS");
}


/* =========================================
   CADASTRO DE CLIENTES — LUCAS LIMA
   NOME E CPF/CNPJ OBRIGATÓRIOS
========================================= */
function nextClient() {
  return Math.max(0, ...clients.map(c => Number(c.codigo) || 0)) + 1;
}
function clientDigits(v) { return String(v || "").replace(/\D/g, ""); }
function validCPF(v) {
  if (!/^\d{11}$/.test(v) || /^(\d)\1{10}$/.test(v)) return false;
  for (let t = 9; t < 11; t++) {
    let sum = 0;
    for (let i = 0; i < t; i++) sum += Number(v[i]) * (t + 1 - i);
    let digit = (sum * 10) % 11;
    if (digit === 10) digit = 0;
    if (digit !== Number(v[t])) return false;
  }
  return true;
}
function validCNPJ(v) {
  if (!/^\d{14}$/.test(v) || /^(\d)\1{13}$/.test(v)) return false;
  const calc = (size) => {
    let weight = size - 7, sum = 0;
    for (let i = 0; i < size; i++) {
      sum += Number(v[i]) * weight--;
      if (weight < 2) weight = 9;
    }
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };
  return calc(12) === Number(v[12]) && calc(13) === Number(v[13]);
}
function formatDoc(v) {
  const d = clientDigits(v);
  if (d.length === 11) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  if (d.length === 14) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  return v;
}
function clientActor(){return window.LucasLimaAuditoria?.usuarioAtual?.()||document.querySelector('.top-user strong')?.textContent?.trim()||'USUÁRIO NÃO IDENTIFICADO';}
function clientHistory(){
 const record=clients.find(c=>Number(c.codigo)===currentClient);
 if(!record){aviso('HISTÓRICO','SELECIONE UM CLIENTE CADASTRADO.');return}
 window.LucasLimaAuditoria?.abrirHistorico?.(record);
}
function formatClientCep(value){
 const d=String(value||'').replace(/\D/g,'').slice(0,8);
 return d.length>5?d.slice(0,5)+'-'+d.slice(5):d;
}
function formatClientPhone(value){
 const d=String(value||'').replace(/\D/g,'').slice(0,11);
 if(d.length<=2)return d.length===2?'('+d+')':d.length?'('+d:'';
 const ddd='('+d.slice(0,2)+') ';
 const n=d.slice(2);
 if(n.length<=4)return ddd+n;
 const split=d.length===11?5:4;
 return ddd+n.slice(0,split)+(n.length>split?'-'+n.slice(split):'');
}
let clientCepRequest=0;
async function lookupClientCep(cepInput){
 const digits=String(cepInput.value||'').replace(/\D/g,'').slice(0,8);
 if(digits.length!==8)return;
 const request=++clientCepRequest;
 const fields=['c-street','c-district','c-city','c-state'];
 const before=fields.map(id=>document.getElementById(id)?.value??'');
 const clientAtStart=currentClient;
 try{
  const response=await fetch('https://viacep.com.br/ws/'+digits+'/json/',{cache:'no-store'});
  if(!response.ok)throw Error('Falha na consulta');
  const result=await response.json();
  if(request!==clientCepRequest||currentClient!==clientAtStart||document.getElementById('c-cep')!==cepInput||cepInput.value.replace(/\D/g,'')!==digits)return;
  if(result.erro){await aviso('CEP NÃO ENCONTRADO','CEP não encontrado. Você pode preencher o endereço manualmente.');return}
  const values=[result.logradouro,result.bairro,result.localidade,result.uf];
  fields.forEach((id,i)=>{
   const el=document.getElementById(id);
   if(el&&el.value===before[i]&&values[i])el.value=String(values[i]).toUpperCase();
  });
 }catch(err){
  if(request===clientCepRequest&&currentClient===clientAtStart&&cepInput.value.replace(/\D/g,'')===digits){
   await aviso('CONSULTA DE CEP','Não foi possível consultar o CEP. Você pode preencher o endereço manualmente.');
  }
 }
}
function clearClient() {
  currentClient = null;
  ["c-name", "c-doc", "c-phone", "c-email", "c-cep", "c-street", "c-number", "c-extra", "c-district", "c-city", "c-state", "c-reference", "c-note", "c-fantasy", "c-rg", "c-birth"].forEach(id => set(id, ""));
  set("c-code", nextClient());
  set("c-user", "");
  set("c-status", "ATIVO"); set("c-employee", "NÃO"); set("c-type", "FÍSICA");
  document.getElementById("c-name")?.focus();
}
function loadClient(code) {
  const c = clients.find(x => Number(x.codigo) === Number(code));
  if (!c) return aviso("LOCALIZAR CLIENTE", "CLIENTE NÃO ENCONTRADO.");
  currentClient = Number(c.codigo);
  const fields = {"c-code":"codigo", "c-name":"nome", "c-doc":"documento", "c-phone":"telefone", "c-email":"email", "c-cep":"cep", "c-street":"rua", "c-number":"numero", "c-extra":"complemento", "c-district":"bairro", "c-city":"cidade", "c-state":"uf", "c-reference":"pontoReferencia", "c-note":"observacoes", "c-status":"situacao", "c-employee":"funcionario", "c-type":"tipo", "c-fantasy":"fantasia", "c-rg":"rg", "c-birth":"nascimento"};
  Object.entries(fields).forEach(([id, key]) => set(id, c[key] || (key === "situacao" ? "ATIVO" : "")));
  set("c-user",c.usuario||c.alteradoPor||c.criadoPor||"NÃO INFORMADO");
  set("c-cep",formatClientCep(c.cep));
  set("c-phone",formatClientPhone(c.telefone));
  document.getElementById("c-name")?.focus();
}
async function saveClient() {
  const nome = val("c-name").toUpperCase();
  const documento = clientDigits(val("c-doc"));
  if (!nome) return aviso("VALIDAÇÃO", "INFORME O NOME DO CLIENTE.");
  if (documento && !(validCPF(documento) || validCNPJ(documento))) return aviso("VALIDAÇÃO", "CPF OU CNPJ INVÁLIDO.");
  if (documento && clients.some(c => Number(c.codigo) !== currentClient && clientDigits(c.documento) === documento)) return aviso("VALIDAÇÃO", "CPF/CNPJ JÁ CADASTRADO.");
  const old = clients.find(c => Number(c.codigo) === currentClient);
  const c = {
    codigo: old ? Number(old.codigo) : nextClient(),
    nome, documento: formatDoc(documento),
    telefone: formatClientPhone(val("c-phone")), email: val("c-email").toLocaleUpperCase("pt-BR"), cep: formatClientCep(val("c-cep")),
    rua: val("c-street"), numero: val("c-number"), complemento: val("c-extra"),
    bairro: val("c-district"), cidade: val("c-city"), uf: val("c-state").toUpperCase(), pontoReferencia: val("c-reference"),
    observacoes: val("c-note"), situacao: val("c-status") || "ATIVO",
    funcionario: val("c-employee") || "NÃO", tipo: val("c-type") || "FÍSICA", fantasia: val("c-fantasy"), rg: val("c-rg"), nascimento: val("c-birth"), ...(old && Object.prototype.hasOwnProperty.call(old,"limiteCredito") ? {limiteCredito:old.limiteCredito} : {})
  };
  const meaningfulKeys=Object.keys(c).filter(k=>k!=='codigo');
  const changes=meaningfulKeys.filter(k=>!old||String(old[k]??'')!==String(c[k]??''));
  if(old&&!changes.length){await aviso("CLIENTE","NENHUMA ALTERAÇÃO FOI REALIZADA.");return}
  const who=clientActor(),when=new Date().toISOString();
  c.usuario=who;
  c.criadoPor=old?.criadoPor||who;
  c.criadoEm=old?.criadoEm||when;
  c.alteradoPor=who;
  c.alteradoEm=when;
  c.historicoOperacoes=[...(old?.historicoOperacoes||[]),{acao:old?'ALTERAÇÃO':'CADASTRO',usuario:who,data:when,alteracoes:changes.map(k=>({campo:k.toUpperCase(),anterior:old?.[k]??'',novo:c[k]??''}))}];
  const updated = old ? clients.map(x => Number(x.codigo) === c.codigo ? c : x) : [...clients, c];
  if (!save(CLIENT_KEY, updated)) return;
  clients = updated;
  currentClient = c.codigo;
  set("c-code", c.codigo);
  set("c-doc", c.documento);
  set("c-user", who);
  renderClients();
  await aviso("SUCESSO", "CLIENTE GRAVADO COM SUCESSO!");
  if (window.LL_cadastroClienteDaVenda) {
    window.LL_cadastroClienteDaVenda = false;
    window.dispatchEvent(new CustomEvent("ll-cliente-cadastrado-venda", {detail:{codigo:c.codigo,nome:c.nome}}));
  }
}
async function localizarClienteF12() {
  const busca = await janela({
    titulo: "LOCALIZAR CLIENTE — F12",
    mensagem: "Informe o código do cliente ou CPF/CNPJ.",
    campo: "CÓDIGO OU CPF/CNPJ",
    placeholder: "Digite o código ou CPF/CNPJ...",
    confirmar: "LOCALIZAR",
    validar: value => {
      const v = String(value || "").trim();
      const digits = clientDigits(v);
      if (!v) return "INFORME O CÓDIGO OU CPF/CNPJ.";
      const found = clients.some(c => String(c.codigo) === v || (digits.length >= 11 && clientDigits(c.documento || "") === digits));
      return found ? "" : "CLIENTE NÃO ENCONTRADO.";
    }
  });
  if (busca === null) return;
  const v = String(busca).trim(), digits = clientDigits(v);
  const found = clients.find(c => String(c.codigo) === v || (digits.length >= 11 && clientDigits(c.documento || "") === digits));
  if (found) loadClient(found.codigo);
}
function clientShortcuts() {
  if (document.querySelector('.client-shortcuts-overlay')) return;
  const overlay = document.createElement('div');
  overlay.className = 'client-shortcuts-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(4,24,52,.65);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px';
  overlay.innerHTML = `<section role="dialog" aria-modal="true" aria-label="Atalhos do Cadastro de Clientes" style="width:min(475px,95vw);background:white;border-radius:14px;overflow:hidden;box-shadow:0 14px 45px #071a3955;color:#173e77">
    <header style="background:#205a9a;color:white;padding:19px 21px;display:flex;justify-content:space-between;align-items:center"><strong>⌂ ATALHOS — CADASTRO DE CLIENTES</strong><button type="button" data-close style="border:0;background:none;color:white;font-size:23px;cursor:pointer">×</button></header>
    <div style="padding:18px 22px 12px">
      <div style="display:flex;align-items:center;gap:16px;padding:10px 0;border-bottom:1px solid #d6e3f6"><b style="background:#edf4ff;border:1px solid #bcd4ff;border-radius:5px;padding:8px 13px;min-width:54px;text-align:center">F1</b><span>Abrir esta janela de atalhos</span></div>
      <div style="display:flex;align-items:center;gap:16px;padding:10px 0;border-bottom:1px solid #d6e3f6"><b style="background:#edf4ff;border:1px solid #bcd4ff;border-radius:5px;padding:8px 13px;min-width:54px;text-align:center">F12</b><span>Localizar cliente por código ou CPF/CNPJ</span></div>
    </div>
    <footer style="padding:13px 20px 18px;text-align:right"><button type="button" data-close style="background:#205a9a;border:0;border-radius:5px;padding:12px 22px;color:white;font-weight:bold;cursor:pointer">FECHAR</button></footer>
  </section>`;
  document.body.append(overlay);
  const close = () => {document.removeEventListener('keydown', key, true);overlay.remove()};
  const key = e => {if(e.key === 'Escape' || e.key === 'F1'){e.preventDefault();e.stopImmediatePropagation();close()}};
  document.addEventListener('keydown', key, true);
  overlay.querySelectorAll('[data-close]').forEach(button => button.onclick = close);
  overlay.onclick = e => {if(e.target === overlay) close()};
}

let clientSearchExecuted = false;
function renderClients() {
  if (!clientSearchExecuted) {
    const tbody = document.getElementById("client-rows");
    if (tbody) tbody.replaceChildren();
    const count = document.getElementById("client-count");
    if (count) count.textContent = "CLIQUE EM PESQUISAR PARA EXIBIR OS CLIENTES.";
    return;
  }
  const tbody = document.getElementById("client-rows");
  if (!tbody) return;
  tbody.replaceChildren();
  const q = val("c-search").toUpperCase();
  const only = document.getElementById("c-only-active")?.checked;
  const empFilter = val("c-employee-filter");
  const filtered = clients.filter(c => (!only || c.situacao === "ATIVO") && (!empFilter || empFilter === "TODOS" || (c.funcionario || "NÃO") === empFilter) &&
    [c.codigo, c.nome, c.documento, c.telefone, c.cidade].some(v => String(v || "").toUpperCase().includes(q)))
    .sort((a,b) => a.nome.localeCompare(b.nome, "pt-BR"));
  filtered.forEach(c => {
    const tr = e("tr");
    [c.codigo, c.nome, c.documento, c.telefone, c.cidade, c.funcionario || "NÃO", c.situacao].forEach((v,i) => {
      const td = e("td", i === 6 ? (c.situacao === "ATIVO" ? "status-active" : "status-inactive") : "", String(v || ""));
      tr.append(td);
    });
    const td = e("td"), b = e("button", "edit-button", "✎");
    b.title = "Abrir cliente";
    b.onclick = () => loadClient(c.codigo);
    td.append(b); tr.append(td);
    tr.ondblclick = () => loadClient(c.codigo);
    tbody.append(tr);
  });
  document.getElementById("client-count").textContent = filtered.length + " CLIENTE(S) ENCONTRADO(S)";
}
function clientScreen() {
  screen = "CLIENTES";
  clientSearchExecuted = false;
  root().replaceChildren();
  const main = e("section", "product-main client-employee-layout");
  const header = e("div", "client-heading-row");
  header.append(e("h1", "product-heading", "▣ CADASTRO DE CLIENTES"));
  const shortcutsButton = e("button", "client-header-shortcuts", "⌂ ATALHOS");
  shortcutsButton.type = "button";
  shortcutsButton.onclick = clientShortcuts;
  header.append(shortcutsButton);
  main.append(header);
  main.append(e("div","client-section-label","DADOS PESSOAIS E CADASTRAIS"));
  const fields = e("div", "product-fields");
  const code = inputField("c-code"); code.readOnly = true;
  const name = inputField("c-name");
  const doc = inputField("c-doc", "text", "CPF ou CNPJ");
  doc.addEventListener("blur", () => { const d = clientDigits(doc.value); if (d.length === 11 || d.length === 14) doc.value = formatDoc(d); });
  const phone=inputField("c-phone");
  phone.inputMode="numeric";
  phone.maxLength=15;
  phone.addEventListener("input",()=>{phone.value=formatClientPhone(phone.value)});
  const cep=inputField("c-cep");
  cep.inputMode="numeric";
  cep.maxLength=9;
  cep.addEventListener("input",()=>{
   clientCepRequest++;
   cep.value=formatClientCep(cep.value);
   if(cep.value.replace(/\D/g,'').length===8)lookupClientCep(cep);
  });
  cep.addEventListener("blur",()=>{
   if(cep.value.replace(/\D/g,'').length===8)lookupClientCep(cep);
  });
  const status = selectField("c-status", ["ATIVO", "INATIVO"]);
  const emp = selectField("c-employee", ["NÃO", "SIM"]);
  const type = selectField("c-type", ["FÍSICA", "JURÍDICA"]);
  const defs = [
    ["CÓDIGO",code,3],["NOME / RAZÃO SOCIAL *",name,3],["CPF / CNPJ",doc,3],["RG / INSCRIÇÃO ESTADUAL",inputField("c-rg"),3],
    ["TIPO DE PESSOA",type,3],["FUNCIONÁRIO DA LOJA?",emp,3],["NOME FANTASIA",inputField("c-fantasy"),3],["DATA DE NASCIMENTO",inputField("c-birth","date"),3],
    ["TELEFONE / WHATSAPP",phone,3],["E-MAIL",inputField("c-email","email"),3],["CEP",cep,3],["RUA / ENDEREÇO",inputField("c-street"),3],
    ["NÚMERO",inputField("c-number"),3],["COMPLEMENTO",inputField("c-extra"),3],["BAIRRO",inputField("c-district"),3],["CIDADE",inputField("c-city"),3],
    ["UF",inputField("c-state"),3],["PONTO DE REFERÊNCIA",inputField("c-reference"),3],["SITUAÇÃO",status,3]
  ];
  defs.forEach(([label,control,span]) => {
    const node = field(label,control);
    node.style.gridColumn = "span " + span;
    fields.append(node);
  });
  const userInput=inputField("c-user");userInput.readOnly=true;
  userInput.title="Clique para consultar o histórico de alterações";
  userInput.style.cursor="pointer";
  userInput.addEventListener("click",clientHistory);
  const userWrapper=field("USUÁRIO",userInput);
  userWrapper.style.gridColumn="span 3";
  userWrapper.dataset.userAudit="1";
  fields.append(userWrapper);
  const noteWrapper=field("OBSERVAÇÕES",inputField("c-note"));
  noteWrapper.style.gridColumn="span 12";
  fields.append(noteWrapper);
  main.append(fields);
  const actions = e("div", "product-actions client-employee-actions");
  [
    ["▤ NOVO (F2)","green",clearClient],
    ["▣ GRAVAR (F3)","blue",saveClient],
    ["✎ ALTERAR (F4)","orange",() => currentClient === null ? aviso("ALTERAR CLIENTE","SELECIONE UM CLIENTE.") : saveClient()],
    ["▤ EXTRATO DO CLIENTE","cyan",extratoCliente],
    ["➜ VOLTAR","red",() => category("CADASTROS")]
  ].forEach(([label,color,fn]) => { const b = e("button","action-button " + color,label); b.onclick = fn; actions.append(b); });
  if(window.LL_cadastroClienteDaVenda){
    const voltarVendas=e("button","action-button blue","VOLTAR PARA VENDAS");
    voltarVendas.type="button";
    voltarVendas.onclick=()=>{
      window.LL_cadastroClienteDaVenda=false;
      window.dispatchEvent(new CustomEvent("ll-voltar-vendas-cadastro-cliente"));
    };
    actions.append(voltarVendas);
  }
  main.append(actions);
  const search = e("section","product-search");
  search.append(e("h2","","⌕ PESQUISA DE CLIENTES"));
  const tools = e("div","search-tools");
  const query = inputField("c-search","search","Pesquisar por código, nome, CPF/CNPJ, telefone ou cidade...");
  query.style.flex = "1"; query.style.minWidth = "230px"; query.style.height = "37px";
  query.style.border = "1px solid #cad8e9"; query.style.borderRadius = "5px"; query.style.padding = "8px 10px";
  const searchButton = e("button","action-button blue","PESQUISAR"); searchButton.onclick = () => { clientSearchExecuted = true; renderClients(); };
  const activeLabel = e("label","active-label");
  const only = inputField("c-only-active","checkbox"); only.checked = true;
  activeLabel.append(only,e("span","","Mostrar apenas ativos"));
  const employeeFilter = selectField("c-employee-filter", ["TODOS"]);
  employeeFilter.value = "TODOS";
  employeeFilter.disabled = true;
  tools.append(query,activeLabel,field("FUNCIONÁRIO",employeeFilter),searchButton);
  search.append(tools);
  const scroll = e("div","product-table-scroll");
  const table = e("table","product-table"); table.style.minWidth = "780px";
  const head = e("thead"), row = e("tr");
  ["CÓDIGO","NOME / RAZÃO SOCIAL","CPF / CNPJ","TELEFONE","CIDADE","FUNCIONÁRIO","SITUAÇÃO",""].forEach(x => row.append(e("th","",x)));
  head.append(row);
  const body = e("tbody"); body.id = "client-rows";
  table.append(head,body); scroll.append(table); search.append(scroll);
  const count = e("div","found-count"); count.id = "client-count"; search.append(count);
  root().append(main,search);
  clearClient(); renderClients(); active("CADASTROS");
}


/* EXTRATO DO CLIENTE: dados reais do módulo de vendas e contas a receber. */
function extratoCliente() {
  const c = clients.find(x => Number(x.codigo) === Number(currentClient));
  if (!c) return aviso('EXTRATO DO CLIENTE', 'SELECIONE UM CLIENTE NA PESQUISA ANTES DE ABRIR O EXTRATO.');
  const raw = read('erp_matriz_operacoes_v2', null);
  const db = raw && typeof raw === 'object' ? raw : {};
  // V523: Vendas atuais usam uma base própria; preservar leitura de vendas legadas.
  const modernSales = read('erp_matriz_vendas_v1', []);
  const sales = [
    ...(Array.isArray(modernSales) ? modernSales.map(v=>({...v,id:v.numero ?? v.id,pessoa:v.clienteId ?? v.cliente,origemExtrato:'ATUAL'})) : []),
    ...(Array.isArray(db.vendas) ? db.vendas.filter(v=>!Array.isArray(modernSales)||!modernSales.some(m=>String(m.numero??m.id)===String(v.id))).map(v=>({...v,origemExtrato:'LEGADA'})) : [])
  ];
  const titles = Array.isArray(db.receber) ? db.receber : [];
  const esc = x => String(x ?? '').replace(/[&<>"']/g, v => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[v]));
  const money = v => Number(v || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const iso = v => { if (!v) return ''; const z = String(v); return /^\d{4}-\d\d-\d\d/.test(z) ? z.slice(0,10) : ''; };
  const displayDate = v => {const d=iso(v);return d?d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4):'-';};
  const isClient = v => String(v || '').trim().toLocaleUpperCase('pt-BR') === String(c.nome || '').trim().toLocaleUpperCase('pt-BR') || String(v || '') === String(c.codigo);
  const overlay=document.createElement('div');overlay.className='cx-overlay';
  overlay.innerHTML=`<section class="cx-dialog cx-statement" role="dialog" aria-modal="true"><header><strong>▤ EXTRATO DO CLIENTE</strong><button type="button" id="cx-close">FECHAR</button></header><div class="cx-statement-scroll"><div id="cx-report"></div></div></section>`;
  document.body.append(overlay);
  const close=()=>{overlay.remove();document.removeEventListener('keydown',onKey,true);};
  const onKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}};
  document.addEventListener('keydown',onKey,true);
  overlay.querySelector('#cx-close').onclick=close;
  overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
  const report=overlay.querySelector('#cx-report');
  let filterFrom='', filterTo='';
  const render=()=>{
    const from=filterFrom, to=filterTo;
    const all=sales.filter(x=>isClient(x.pessoa) || isClient(x.clienteId) || isClient(x.cliente));
    const selected=all.filter(x=>(!from||iso(x.data)>=from)&&(!to||iso(x.data)<=to));
    const sums=selected.map(x=>Number(x.total||0));
    const related=selected.map(s=>{
      const saleTitles=titles.filter(t=>{
        const ref=String(t.ref||'').replace(/\s+/g,' ').trim().toUpperCase();
        return (String(t.numeroOrigem||'')===String(s.id) && /VENDA/i.test(String(t.origemCarne||t.descricao||t.ref||''))) ||
          ref==='VENDA-'+s.id || ref==='VENDA '+String(s.id).padStart(6,'0') ||
          (String(t.pessoa||'')===String(c.codigo) && ref==='VENDA '+String(s.id));
      });
      const valor=Number(s.total||0);
      const titulosValor=saleTitles.reduce((a,t)=>a+Number(t.valor||0),0);
      const pagoTitulos=saleTitles.reduce((a,t)=>a+Number(t.pago||0),0);
      const pagoDireto=(s.pagamentos||[]).filter(p=>!/BOLETO|CARN[EÊ]/i.test(String(p.forma||p.descricao||p.tipo||''))).reduce((a,p)=>a+Number(p.valor||0),0);
      const pago=Math.min(valor,Math.max(0,pagoTitulos+pagoDireto));
      const saldo=s.situacao==='CANCELADA'?0:Math.max(0,valor-pago);
      const title={vencimento:saleTitles[0]?.vencimento||s.data,pago,saldo,valor,pagamentos:saleTitles.flatMap(t=>t.pagamentos||[])};
      return {sale:s,title};
    });
    const payments=related.flatMap(({sale,title})=>[
      ...(title.pagamentos||[]).map(p=>({...p,sale,due:title.vencimento})),
      ...(sale.pagamentos||[]).filter(p=>!/BOLETO|CARN[EÊ]/i.test(String(p.forma||p.descricao||p.tipo||''))).map(p=>({...p,sale,data:p.data||sale.data}))
    ]).filter(p=>(!from||iso(p.data)>=from)&&(!to||iso(p.data)<=to));
    const received=related.reduce((a,x)=>a+Number(x.title.pago||0),0);
    const pending=related.reduce((a,x)=>a+Number(x.title.saldo||0),0);
    const paid=related.filter(x=>x.sale.situacao!=='CANCELADA'&&Number(x.title.saldo)<=0);
    const late=paid.filter(x=>{const last=(x.title.pagamentos||[]).map(p=>iso(p.data)).sort().pop();return last&&iso(x.title.vencimento)&&last>iso(x.title.vencimento);});
    const ontime=paid.length-late.length;
    const card=(label,value,kind='')=>`<div class="cx-stat ${kind}"><small>${label}</small><b>${value}</b></div>`;
    const row=related.map(({sale,title})=>{const due=title?.vencimento||sale.data;const saldo=Number(title?.saldo ?? sale.total ?? 0);const p=title?.pagamentos||[];const last=p.map(x=>iso(x.data)).sort().pop();const state=sale.situacao==='CANCELADA'?'CANCELADA':saldo>0?'PENDENTE':last&&iso(due)&&last>iso(due)?'PAGA ATRASADA':'PAGA EM DIA';return `<tr><td>${esc(sale.id)}</td><td>${displayDate(sale.data)}</td><td>${displayDate(due)}</td><td>${money(sale.total)}</td><td>${money(title?.pago)}</td><td>${money(saldo)}</td><td>${state}</td></tr>`;}).join('');
    const moves=payments.map(p=>`<tr><td>${displayDate(p.data)}</td><td>RECEBIMENTO</td><td>${esc(p.sale.id)}</td><td>${esc(p.forma||'-')}</td><td>${money(p.valor)}</td></tr>`).join('');
    const open=related.filter(x=>x.sale.situacao!=='CANCELADA'&&Number(x.title?.saldo ?? x.sale.total)>0).map(({sale,title})=>`<tr><td>${esc(sale.id)}</td><td>${displayDate(title?.vencimento||sale.data)}</td><td>${money(title?.valor??sale.total)}</td><td>${money(title?.pago)}</td><td>${money(title?.saldo??sale.total)}</td></tr>`).join('');
    report.innerHTML=`<article class="cx-paper"><h3>DADOS DO CLIENTE</h3><div class="cx-client-fields"><div><small>CÓDIGO</small><b>${esc(c.codigo)}</b></div><div><small>NOME / RAZÃO SOCIAL</small><b>${esc(c.nome)}</b></div><div><small>CPF / CNPJ</small><b>${esc(c.documento||'-')}</b></div><div><small>TELEFONE</small><b>${esc(c.telefone||'-')}</b></div></div><h3>RESUMO FINANCEIRO</h3><div class="cx-stats">${card('MAIOR VENDA',sums.length?money(Math.max(...sums)):'—')}${card('MENOR VENDA',sums.length?money(Math.min(...sums)):'—')}${card('VENDAS PAGAS EM DIA',ontime,'good')}${card('VENDAS PAGAS ATRASADAS',late.length,'bad')}${card('VENDAS PENDENTES',related.filter(x=>x.sale.situacao!=='CANCELADA'&&Number(x.title?.saldo ?? x.sale.total)>0).length,'warn')}${card('TOTAL DE VENDAS',selected.length)}${card('TOTAL DE COMPRAS',money(sums.reduce((a,b)=>a+b,0)))}${card('TOTAL RECEBIDO',money(received),'good')}${card('SALDO PENDENTE',money(pending),'bad')}</div><h3>FILTROS DE PESQUISA</h3><div class="cx-statement-filters"><label>DATA INICIAL<input type="date" id="cx-from" value="${from}"></label><label>DATA FINAL<input type="date" id="cx-to" value="${to}"></label><label>TIPO DE MOVIMENTAÇÃO<select id="cx-type"><option value="">TODOS</option><option value="VENDA">VENDA</option><option value="RECEBIMENTO">RECEBIMENTO</option><option value="PENDENTE">PENDENTE</option></select></label><label>SITUAÇÃO<select id="cx-status"><option value="">TODAS</option><option value="PAGA">PAGA</option><option value="PENDENTE">PENDENTE</option><option value="ATRASADA">ATRASADA</option></select></label><button type="button" id="cx-filter">PESQUISAR</button></div><h3>MOVIMENTAÇÕES DO CLIENTE</h3><div class="cx-tablewrap"><table><thead><tr><th>VENDA</th><th>DATA</th><th>VENCIMENTO</th><th>VALOR</th><th>RECEBIDO</th><th>SALDO</th><th>SITUAÇÃO</th></tr></thead><tbody id="cx-sales-rows">${row||'<tr><td colspan="7">NENHUMA VENDA NO PERÍODO.</td></tr>'}</tbody></table></div><h3>RECEBIMENTOS</h3><div class="cx-tablewrap"><table><thead><tr><th>DATA</th><th>TIPO</th><th>VENDA</th><th>FORMA</th><th>VALOR</th></tr></thead><tbody id="cx-payment-rows">${moves||'<tr><td colspan="5">NENHUM RECEBIMENTO NO PERÍODO.</td></tr>'}</tbody></table></div><h3>VALORES EM ABERTO</h3><div class="cx-tablewrap"><table><thead><tr><th>VENDA</th><th>VENCIMENTO</th><th>VALOR</th><th>RECEBIDO</th><th>SALDO</th></tr></thead><tbody id="cx-open-rows">${open||'<tr><td colspan="5">SEM VALORES EM ABERTO.</td></tr>'}</tbody></table></div><div class="cx-statement-footer"><span>CLIQUE EM PESQUISAR PARA ATUALIZAR OS MOVIMENTOS.</span><button type="button" id="cx-print">IMPRIMIR</button></div><div class="cx-print-only"><h3>OBSERVAÇÕES</h3><p>${esc(c.observacoes||'-')}</p><div class="cx-sign">ASSINATURA DO RESPONSÁVEL</div></div></article>`;
    const type=report.querySelector('#cx-type'), status=report.querySelector('#cx-status');
    type.value=filterType;status.value=filterStatus;
    const updateRows=()=>{
      const tr=Array.from(report.querySelectorAll('#cx-sales-rows tr'));
      tr.forEach((r,i)=>{const x=related[i];if(!x)return;const saldo=Number(x.title?.saldo??x.sale.total??0);const last=(x.title?.pagamentos||[]).map(p=>iso(p.data)).sort().pop();const atraso=saldo<=0&&last&&iso(x.title?.vencimento)&&last>iso(x.title.vencimento);const typeOK=!type.value||type.value==='VENDA'||(type.value==='PENDENTE'&&saldo>0)||(type.value==='RECEBIMENTO'&&Number(x.title?.pago||0)>0);const statusOK=!status.value||(status.value==='PENDENTE'&&saldo>0)||(status.value==='PAGA'&&saldo<=0)||(status.value==='ATRASADA'&&atraso);r.hidden=!(typeOK&&statusOK)});
      report.querySelector('#cx-payment-rows').closest('div').hidden=!!type.value&&type.value!=='RECEBIMENTO';
    };
    updateRows();
    report.querySelector('#cx-filter').onclick=()=>{filterFrom=report.querySelector('#cx-from').value;filterTo=report.querySelector('#cx-to').value;filterType=type.value;filterStatus=status.value;render()};
    report.querySelector('#cx-print').onclick=()=>{
      const usuario=window.LucasLimaAuditoria?.usuarioAtual?.()||document.querySelector('.top-user strong')?.textContent?.trim()||'USUÁRIO NÃO IDENTIFICADO';
      const emissao='Emitido em '+new Date().toLocaleDateString('pt-BR')+', por '+usuario+'.';
      const printBody=report.querySelector('.cx-paper').cloneNode(true);
      printBody.querySelector('.cx-statement-filters')?.remove();
      printBody.querySelector('.cx-statement-footer')?.remove();
      const printOnly=printBody.querySelector('.cx-print-only');
      if(printOnly)printOnly.style.display='block';
      printBody.querySelectorAll('tr[hidden]').forEach(tr=>tr.remove());
      printBody.querySelectorAll('div[hidden]').forEach(div=>div.remove());
      const emit=document.createElement('div');emit.className='extrato-emissao';emit.textContent=emissao;
      printBody.append(emit);
      const documento=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Extrato do Cliente</title><style>
      @page{size:A4 portrait;margin:12mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#17365d;margin:0;padding:15px;font-size:11px;background:#fff}h1{font-size:18px;margin:0 0 15px}h3{background:#e4eefb;color:#153d70;padding:9px 11px;font-size:12px;margin:16px 0 9px;break-after:avoid}.cx-client-fields{display:grid;grid-template-columns:1fr 2.5fr 1.5fr 1.5fr;gap:7px}.cx-client-fields>div{padding:9px;border:1px solid #d2dfed}.cx-client-fields small,.cx-stat small{display:block;font-size:9px;margin-bottom:5px}.cx-client-fields b{font-size:11px}.cx-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.cx-stat{border:1px solid #d2dfed;background:#f2f7fd;padding:9px;break-inside:avoid}.cx-stat b{display:block;font-size:12px}.cx-tablewrap{width:100%;overflow:visible}table{width:100%;border-collapse:collapse;font-size:9px}th{background:#e3edf9;text-align:left}th,td{padding:6px 4px;border-bottom:1px solid #d7e1ed}thead{display:table-header-group}tr{break-inside:avoid}.cx-print-only{display:block!important}.cx-sign{margin-top:32px;text-align:center}.extrato-emissao{font-size:10px;text-align:right;font-weight:bold;margin-top:20px}button,input,select{display:none!important}@media print{body{padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
      </style></head><body><h1>EXTRATO DO CLIENTE</h1>${printBody.outerHTML}</body></html>`;
      const popup=document.createElement('div');popup.style.cssText='position:fixed;inset:0;z-index:2147483640;background:rgba(5,20,42,.65);display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;font-family:Arial,sans-serif;color:#123b70';
      popup.innerHTML=`<section role="dialog" aria-modal="true" aria-label="Pré-visualização do extrato do cliente" style="width:min(1160px,98vw);height:min(88vh,790px);background:#fff;border-radius:10px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 15px 50px #0004"><header style="background:#174b88;color:white;padding:18px 22px;font-size:19px;font-weight:bold;display:flex;justify-content:space-between;align-items:center">IMPRIMIR EXTRATO DO CLIENTE <button type="button" data-close style="background:transparent;color:white;border:0;font-size:23px;cursor:pointer">×</button></header><div style="padding:17px;display:grid;grid-template-columns:minmax(270px,40%) minmax(0,60%);gap:15px;overflow:auto;flex:1"><div style="border:1px solid #c7d9ef;border-radius:7px;padding:14px;align-self:start"><div style="background:#e4eefb;padding:12px;font-weight:bold">DADOS DO CLIENTE SELECIONADO</div><p><b>CÓDIGO:</b> ${esc(c.codigo)}</p><p><b>CLIENTE:</b> ${esc(c.nome)}</p><p><b>CPF/CNPJ:</b> ${esc(c.documento||'-')}</p><p><b>TELEFONE:</b> ${esc(c.telefone||'-')}</p><div style="background:#e4eefb;padding:12px;font-weight:bold">EMISSÃO</div><p>${esc(emissao)}</p><div style="background:#e4eefb;padding:12px;font-weight:bold">ORIENTAÇÃO DA FOLHA</div><label style="display:block;margin:12px 0 6px;font-size:12px;font-weight:bold">SELECIONE A ORIENTAÇÃO A4</label><select data-orient style="width:100%;padding:12px;border:1px solid #b7cde8;border-radius:5px;color:#153e75;background:white;font-weight:bold"><option value="portrait">RETRATO</option><option value="landscape">PAISAGEM</option></select></div><div style="border:1px solid #c7d9ef;border-radius:7px;padding:13px;min-width:0"><div style="background:#e4eefb;padding:12px;font-weight:bold;margin-bottom:10px">PRÉ-VISUALIZAÇÃO A4</div><iframe title="Pré-visualização A4 do extrato do cliente" data-frame style="display:block;width:100%;height:100%;min-height:420px;border:1px solid #c7d9ef;background:white"></iframe></div></div><footer style="display:flex;gap:10px;justify-content:flex-end;padding:14px 18px;border-top:1px solid #d8e4f3"><button type="button" data-print style="background:#1763ce;color:white;border:0;border-radius:5px;padding:12px 26px;font-weight:bold;cursor:pointer">IMPRIMIR</button><button type="button" data-save style="background:#07986b;color:white;border:0;border-radius:5px;padding:12px 26px;font-weight:bold;cursor:pointer">SALVAR</button><button type="button" data-close style="background:#e7f1ff;color:#16467e;border:1px solid #b7d2f2;border-radius:5px;padding:12px 26px;font-weight:bold;cursor:pointer">FECHAR</button></footer></section>`;
      // Oculta a janela do extrato enquanto a pré-visualização estiver aberta.
      const previousVisibility=overlay.style.visibility;
      overlay.style.visibility='hidden';
      document.body.append(popup);
      const frame=popup.querySelector('[data-frame]');
      const orient=popup.querySelector('[data-orient]');
      const update=()=>{frame.srcdoc=documento.replace('@page{size:A4 portrait;', '@page{size:A4 '+orient.value+';');frame.style.minHeight=orient.value==='landscape'?'360px':'420px'};
      orient.onchange=update;update();
      const onEscape=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closePreview()}};
      const closePreview=()=>{popup.remove();overlay.style.visibility=previousVisibility;document.removeEventListener('keydown',onEscape,true)};
      document.addEventListener('keydown',onEscape,true);
      popup.querySelectorAll('[data-close]').forEach(b=>b.onclick=closePreview);
      popup.querySelector('[data-print]').onclick=()=>{const win=frame.contentWindow;if(!win)return;win.focus();win.print()};
      popup.querySelector('[data-save]').onclick=async()=>{
        const btn=popup.querySelector('[data-save]');
        if(btn.disabled)return;
        btn.disabled=true;btn.textContent='SALVANDO...';
        try{
          if(typeof window.LucasExtratoClientePDF!=='function')throw new Error('Gerador de PDF não carregado.');
          const root=printBody;
          const stats=Array.from(root.querySelectorAll('.cx-stat')).map(el=>[el.querySelector('small')?.textContent||'',el.querySelector('b')?.textContent||'']);
          const tables=Array.from(root.querySelectorAll('.cx-tablewrap table')).map(table=>({
            headers:Array.from(table.querySelectorAll('thead th')).map(th=>th.textContent.trim()),
            rows:Array.from(table.querySelectorAll('tbody tr')).filter(tr=>!tr.hidden).map(tr=>Array.from(tr.querySelectorAll('td')).map(td=>td.textContent.trim()))
          }));
          await window.LucasExtratoClientePDF({code:c.codigo,client:c.nome,document:c.documento||'-',phone:c.telefone||'-',orientation:orient.value,issuedAt:new Date().toLocaleDateString('pt-BR'),issuedBy:usuario,stats,tables,observations:c.observacoes||'-'});
        }catch(err){console.error(err);alert('NÃO FOI POSSÍVEL SALVAR O PDF: '+(err.message||err));}
        finally{btn.disabled=false;btn.textContent='SALVAR';}
      };
    };
  };
  let filterType="",filterStatus="";
  render();
}

/* =========================================
   INICIALIZAÇÃO E ATALHOS
========================================= */

function init() {
  if (!app) {
    console.error(
      "Elemento #app não encontrado no index.html."
    );
    return;
  }

  const shell = e("div", "app-layout");
  const content = e("main", "workspace");
  content.id = "workspace";

  shell.append(nav(), content);

  app.replaceChildren(
    criarCabecalho(),
    shell
  );

  document.addEventListener("keydown", event => {
    if (modalAberto) return;

    if (event.key === "F1" && screen !== "CLIENTES") {
      event.preventDefault();
      home();
      return;
    }

    if (screen === "CLIENTES") {
      const actions = {
        F1: clientShortcuts,
        F2: clearClient,
        F3: saveClient,
        F4: () => currentClient === null ? aviso("ALTERAR CLIENTE", "SELECIONE UM CLIENTE.") : saveClient(),
        F5: () => document.getElementById("c-search")?.focus(),
        F12: localizarClienteF12
      };
      if (actions[event.key]) {
        event.preventDefault();
        actions[event.key]();
      }
      return;
    }
    if (screen !== "PRODUTOS") return;

    const actions = {
      F2: clearProduct,

      F3: saveProduct,

      F4: () => {
        if (current !== null) {
          saveProduct();
        } else {
          aviso(
            "ALTERAR PRODUTO",
            "SELECIONE UM PRODUTO."
          );
        }
      },

      F5: () => {
        document.getElementById("p-search").focus();
      },

      F6: () => PM.simulator(),

      F7: () => Promo.open(),

      F12: localizarProdutoF12
    };

    if (actions[event.key]) {
      event.preventDefault();
      actions[event.key]();
    }
  });

  home();
}

init();
