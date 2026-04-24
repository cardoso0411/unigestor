const apiBase = "http://localhost:3000/api"; // URL do backend
const AJUSTE_JANELA_DIAS = 90;

// Estes arrays guardam os dados carregados para evitar novas buscas a cada clique.
let cacheItensEstoque = [];
let cacheMovsEstoque = [];
const COLUNAS_FILTRAVEIS_ESTOQUE = [
  "col-ca-number",
  "col-minimo-sugerido",
  "col-estoque-minimo",
  "col-estoque-max",
  "col-estoque"
];
async function carregarItens() {
  // Busca itens e movimentacoes em paralelo para montar a tela de estoque.
  const [resItens, resMovs] = await Promise.all([
    fetch(`${apiBase}/items`),
    fetch(`${apiBase}/movements`)
  ]);
  cacheItensEstoque = await resItens.json();
  cacheMovsEstoque = await resMovs.json();
  renderItensEstoque();
}

function parseMovDate(m) {
  const d = new Date(m.performed_at || m.date || m.created_at);
  return isNaN(d) ? null : d;
}

function calcularConsumoMedioMensal() {
  // Calcula uma media aproximada de saida mensal com base nos ultimos 90 dias.
  const inicio = new Date(Date.now() - AJUSTE_JANELA_DIAS * 24 * 60 * 60 * 1000);
  const consumoPorItem = {};
  cacheMovsEstoque
    .filter(m => m.type === "OUT")
    .forEach(m => {
      const d = parseMovDate(m);
      if (!d || d < inicio) return;
      const id = String(m.item_id);
      consumoPorItem[id] = (consumoPorItem[id] || 0) + Number(m.quantity || 0);
    });
  const fatorMeses = AJUSTE_JANELA_DIAS / 30;
  const mediaPorItem = {};
  Object.keys(consumoPorItem).forEach(id => {
    mediaPorItem[id] = consumoPorItem[id] / fatorMeses;
  });
  return mediaPorItem;
}

function renderItensEstoque() {
  // Reconstroi a tabela inteira usando os dados em memoria e o filtro digitado.
  const filtro = document.getElementById('filtroNomeItemEstoque')?.value?.toLowerCase() || '';
  const tbody = document.querySelector("#tabelaItens tbody");
  tbody.innerHTML = "";
  const mediaMensalPorItem = calcularConsumoMedioMensal();
  cacheItensEstoque
    .filter(item => item.name.toLowerCase().includes(filtro))
    .forEach((item) => {
      const maxEstoque = Number(item.max_stock_level || 0);
      const quantidade = Number(item.quantity || 0);
      const acimaMaximo = maxEstoque > 0 && quantidade > maxEstoque;
      const critico = quantidade <= 0;
      const abaixoMinimo = quantidade < Number(item.min_stock_level || 0);
      const situacao = acimaMaximo
        ? 'Acima do Máximo'
        : (critico ? 'Crítico' : (abaixoMinimo ? 'Baixo' : 'Adequado'));
      const situacaoClass = acimaMaximo
        ? 'situacao-cheio'
        : (critico ? 'situacao-critico' : (abaixoMinimo ? 'situacao-baixo' : 'situacao-adequado'));
      const mediaMensal = mediaMensalPorItem[String(item.id)] || 0;
      const minimoBase = Math.max(item.min_stock_level, Math.round(mediaMensal));
      const minimoSugerido = maxEstoque > 0 ? Math.min(minimoBase, maxEstoque) : minimoBase;
      const podeAplicar = minimoSugerido > Number(item.min_stock_level || 0);
      const maxDisplay = maxEstoque > 0 ? maxEstoque : "-";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="col-acoes">
          <div class="acoes-botoes">
            <button class="btn-editar-item" data-id="${item.id}">Editar</button>
            <button class="btn-salvar-item" data-id="${item.id}" data-acao="salvar" style="display:none;">Salvar</button>
            <button class="btn-cancelar-item" data-id="${item.id}" data-acao="cancelar" style="display:none;">Cancelar</button>
            <button class="btn-aplicar-minimo" data-id="${item.id}" data-minimo="${minimoSugerido}" ${podeAplicar ? "" : "disabled"}>Aplicar min.</button>
            <button class="btn-excluir-item" data-id="${item.id}" data-nome="${item.name}">Excluir</button>
          </div>
        </td>
        <td class="col-codigo-item">${item.code}</td>
        <td class="col-nome-item" title="${item.category || ''}">${item.name}</td>
        <td class="col-ca-number">${item.ca_number || "-"}</td>
        <td class="col-minimo-sugerido">${minimoSugerido}</td>
        <td class="col-estoque-minimo">${item.min_stock_level}</td>
        <td class="col-estoque-max">${maxDisplay}</td>
        <td class="col-estoque">${item.quantity}</td>
        <td class="${situacaoClass} col-situacao">${situacao}</td>
      `;
      tbody.appendChild(tr);
    });
  aplicarFiltroColunasItens();
}

function obterColunasSelecionadas() {
  const select = document.getElementById("filtroColunasItens");
  if (!select) return new Set(COLUNAS_FILTRAVEIS_ESTOQUE);
  return new Set(Array.from(select.selectedOptions).map(opt => opt.value));
}

function aplicarFiltroColunasItens() {
  const colunasSelecionadas = obterColunasSelecionadas();
  COLUNAS_FILTRAVEIS_ESTOQUE.forEach((classeColuna) => {
    const exibir = colunasSelecionadas.has(classeColuna);
    document.querySelectorAll(`#tabelaItens .${classeColuna}`).forEach((el) => {
      el.style.display = exibir ? "" : "none";
    });
  });
}

function exportarEstoquePdf() {
  const filtro = document.getElementById('filtroNomeItemEstoque')?.value?.toLowerCase() || '';
  const itens = cacheItensEstoque.filter(item => item.name.toLowerCase().includes(filtro));
  const linhas = itens.map(item => {
    const maxEstoque = Number(item.max_stock_level || 0);
    const quantidade = Number(item.quantity || 0);
    const acimaMaximo = maxEstoque > 0 && quantidade > maxEstoque;
    const critico = quantidade <= 0;
    const abaixoMinimo = quantidade < Number(item.min_stock_level || 0);
    const situacao = acimaMaximo
      ? 'Acima do Máximo'
      : (critico ? 'Crítico' : (abaixoMinimo ? 'Baixo' : 'Adequado'));
    const situacaoClass = acimaMaximo
      ? 'situacao-cheio'
      : (critico ? 'situacao-critico' : (abaixoMinimo ? 'situacao-baixo' : 'situacao-adequado'));
    return `<tr>
      <td>${item.code}</td>
      <td>${item.name}</td>
      <td>${item.ca_number || "-"}</td>
      <td>${item.min_stock_level}</td>
      <td class="col-estoque">${item.quantity}</td>
      <td class="${situacaoClass} col-situacao">${situacao}</td>
    </tr>`;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Estoque</title>
      <style>
        body { font-family: 'Poppins', Arial, sans-serif; padding: 24px; }
        h2 { text-align: center; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #333; padding: 8px; text-align: center; }
        th { background: #f2f2f2; }
        tbody tr:nth-child(even) { background: #e3ecf7; }
        .col-estoque { background: #e0f0ff; color: #005fa3; font-weight: bold; }
        .situacao-baixo { background: #ffeb3b; color: #5a4a00; font-weight: bold; }
        .situacao-adequado { background: #c5f1c7; color: #2e7d32; font-weight: bold; }
        .situacao-cheio { background: #bbdefb; color: #0d47a1; font-weight: bold; }
        .situacao-critico { background: #ffdddd; color: #b30000; font-weight: bold; }
        @media print {
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          tbody tr:nth-child(even) { background: #e3ecf7 !important; }
          tbody tr:nth-child(even) td { background: #e3ecf7 !important; }
          .col-estoque { background: #e0f0ff !important; color: #005fa3 !important; }
          .situacao-baixo { background: #ffeb3b !important; color: #5a4a00 !important; }
          .situacao-adequado { background: #c5f1c7 !important; color: #2e7d32 !important; }
          .situacao-cheio { background: #bbdefb !important; color: #0d47a1 !important; }
          .situacao-critico { background: #ffdddd !important; color: #b30000 !important; }
        }
      </style>
    </head>
    <body>
      <h2>Relatório de Estoque</h2>
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Nome</th>
            <th>C.A</th>
            <th>Estoque Mínimo</th>
            <th>Estoque Atual</th>
            <th>Situação</th>
          </tr>
        </thead>
        <tbody>
          ${linhas || '<tr><td colspan="6">Sem dados para exportar.</td></tr>'}
        </tbody>
      </table>
      <script>window.onload = () => { window.print(); };</script>
    </body>
    </html>
  `;

  const win = window.open('', '_blank');
  if (!win) {
    showToast("Não foi possível abrir a janela de impressão.", false);
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

async function excluirItem(id, nome) {
  const ok = confirm(`Deseja excluir o item "${nome}"?`);
  if (!ok) return;
  try {
    const res = await fetch(`${apiBase}/items/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Item excluido com sucesso!", true);
      carregarItens();
      return;
    }
    let msg = "Nao foi possivel excluir. Verifique se existem movimentacoes ou relacionamentos com este item.";
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {}
    showToast(msg, false);
  } catch {
    showToast("Erro ao excluir item.", false);
  }
}

// Função para cadastrar novo item
document.getElementById("formItem").addEventListener("submit", async (e) => {
  e.preventDefault();

  const item = {
    code: document.getElementById("code").value,
    name: document.getElementById("name").value,
    category: document.getElementById("category").value,
    ca_number: document.getElementById("ca_number").value.trim() || null,
    min_stock_level: parseInt(document.getElementById("min_stock_level").value),
    max_stock_level: parseInt(document.getElementById("max_stock_level").value) || 0,
  };

  const res = await fetch(`${apiBase}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });

  if (res.ok) {
    showToast("✅ Item cadastrado!", true);
    e.target.reset();
    carregarItens();
  } else {
    showToast("❌ Erro ao cadastrar item.", false);
  }
});

function inicializarFiltroColunasEstoque() {
  const select = document.getElementById("filtroColunasItens");
  if (!select) return;

  if (typeof Choices === "function") {
    new Choices(select, {
      removeItemButton: true,
      shouldSort: false,
      searchEnabled: true,
      searchPlaceholderValue: "Buscar coluna...",
      itemSelectText: "",
      placeholder: true,
      placeholderValue: "Selecione as colunas"
    });
  }

  select.addEventListener("change", aplicarFiltroColunasItens);
}

inicializarFiltroColunasEstoque();
carregarItens();

// Filtro por nome do item
document.getElementById('filtroNomeItemEstoque')?.addEventListener('input', renderItensEstoque);

document.querySelector("#tabelaItens tbody")?.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-excluir-item");
  if (!btn) return;
  excluirItem(btn.dataset.id, btn.dataset.nome || "");
});

document.getElementById("btnExportarEstoquePdf")?.addEventListener("click", exportarEstoquePdf);

document.addEventListener("keydown", (e) => {
  if (!(e.ctrlKey && e.key.toLowerCase() === "x")) return;
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
  const input = document.getElementById("filtroNomeItemEstoque");
  if (input) {
    input.focus();
    input.select();
  }
});

async function aplicarMinimoSugerido(id, novoMinimo) {
  const item = cacheItensEstoque.find(i => String(i.id) === String(id));
  if (!item) return;
  const ok = confirm(`Deseja atualizar o estoque minimo de "${item.name}" para ${novoMinimo}?`);
  if (!ok) return;
  const payload = {
    code: item.code,
    name: item.name,
    category: item.category,
    ca_number: item.ca_number || null,
    description: item.description || "",
    min_stock_level: Number(novoMinimo),
    max_stock_level: Number(item.max_stock_level || 0),
    quantity: Number(item.quantity || 0)
  };
  const res = await fetch(`${apiBase}/items/${item.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    showToast("Estoque minimo atualizado!", true);
    carregarItens();
  } else {
    showToast("Erro ao atualizar estoque minimo.", false);
  }
}

document.querySelector("#tabelaItens tbody")?.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-aplicar-minimo");
  if (!btn) return;
  if (btn.hasAttribute("disabled")) return;
  aplicarMinimoSugerido(btn.dataset.id, btn.dataset.minimo);
});

async function atualizarItemBasico(id, novoMinimo, novoEstoque, novoMaximo, novoCa = null) {
  const item = cacheItensEstoque.find(i => String(i.id) === String(id));
  if (!item) return;
  const payload = {
    code: item.code,
    name: item.name,
    category: item.category,
    ca_number: novoCa,
    description: item.description || "",
    min_stock_level: Number(novoMinimo),
    max_stock_level: Number(novoMaximo || 0),
    quantity: Number(novoEstoque || 0)
  };
  const res = await fetch(`${apiBase}/items/${item.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    showToast("Item atualizado!", true);
    carregarItens();
  } else {
    showToast("Erro ao atualizar item.", false);
  }
}

document.querySelector("#tabelaItens tbody")?.addEventListener("click", (e) => {
  const btnEditar = e.target.closest(".btn-editar-item");
  const btnAcao = e.target.closest(".btn-salvar-item, .btn-cancelar-item");
  const btn = btnEditar || btnAcao;
  if (!btn) return;
  const id = btn.dataset.id;
  const tr = btn.closest("tr");
  if (!tr) return;

  const modo = btn.dataset.acao || "editar";
  const tdCa = tr.querySelector(".col-ca-number");
  const tdMin = tr.querySelector(".col-estoque-minimo");
  const tdMax = tr.querySelector(".col-estoque-max");
  const tdEstoque = tr.querySelector(".col-estoque");
  if (!tdCa || !tdMin || !tdMax || !tdEstoque) return;

  const btnSalvar = tr.querySelector(".btn-salvar-item");
  const btnCancelar = tr.querySelector(".btn-cancelar-item");
  const btnEditarAtual = tr.querySelector(".btn-editar-item");
  const btnAplicar = tr.querySelector(".btn-aplicar-minimo");
  const btnExcluir = tr.querySelector(".btn-excluir-item");

  const emEdicao = tr.dataset.editando === "true";
  if (!emEdicao) {
    const valorCaAtual = tdCa.textContent.trim();
    const valorMinAtual = tdMin.textContent.trim();
    const valorMaxAtual = tdMax.textContent.trim();
    const valorEstoqueAtual = tdEstoque.textContent.trim();
    tr.dataset.caOriginal = valorCaAtual;
    tr.dataset.minOriginal = valorMinAtual;
    tr.dataset.maxOriginal = valorMaxAtual;
    tr.dataset.estoqueOriginal = valorEstoqueAtual;
    tdCa.innerHTML = `<input type="text" class="input-editar-ca" value="${valorCaAtual === "-" ? "" : valorCaAtual}" style="width:110px; text-align:center;">`;
    tdMin.innerHTML = `<input type="number" class="input-editar-minimo" value="${valorMinAtual}" style="width:90px; text-align:center;">`;
    tdMax.innerHTML = `<input type="number" class="input-editar-maximo" value="${valorMaxAtual === "-" ? "" : valorMaxAtual}" style="width:90px; text-align:center;">`;
    tdEstoque.innerHTML = `<input type="number" class="input-editar-estoque" value="${valorEstoqueAtual}" style="width:90px; text-align:center;">`;
    tr.dataset.editando = "true";
    if (btnSalvar) btnSalvar.style.display = "";
    if (btnCancelar) btnCancelar.style.display = "";
    if (btnEditarAtual) btnEditarAtual.style.display = "none";
    if (btnAplicar) btnAplicar.disabled = true;
    if (btnExcluir) btnExcluir.disabled = true;
    return;
  }

  if (modo === "cancelar") {
    const caOriginal = tr.dataset.caOriginal || "-";
    const minOriginal = tr.dataset.minOriginal || "";
    const maxOriginal = tr.dataset.maxOriginal || "-";
    const estoqueOriginal = tr.dataset.estoqueOriginal || "";
    tdCa.textContent = caOriginal === "" ? "-" : caOriginal;
    tdMin.textContent = minOriginal;
    tdMax.textContent = maxOriginal === "" ? "-" : maxOriginal;
    tdEstoque.textContent = estoqueOriginal;
    tr.dataset.editando = "false";
    if (btnSalvar) btnSalvar.style.display = "none";
    if (btnCancelar) btnCancelar.style.display = "none";
    if (btnEditarAtual) btnEditarAtual.style.display = "";
    if (btnAplicar) btnAplicar.disabled = false;
    if (btnExcluir) btnExcluir.disabled = false;
    return;
  }

  const novoCa = tr.querySelector(".input-editar-ca")?.value?.trim() ?? "";
  const novoMinimo = tr.querySelector(".input-editar-minimo")?.value ?? "";
  const novoMaximo = tr.querySelector(".input-editar-maximo")?.value ?? "";
  const novoEstoque = tr.querySelector(".input-editar-estoque")?.value ?? "";
  if (novoMinimo === "" || novoEstoque === "") {
    showToast("Informe estoque mínimo e estoque atual.", false);
    return;
  }
  atualizarItemBasico(id, novoMinimo, novoEstoque, novoMaximo, novoCa || null);
});
