const apiBase = "http://localhost:3000/api"; // URL do backend
const AJUSTE_JANELA_DIAS = 90;

let cacheItensEstoque = [];
let cacheMovsEstoque = [];
async function carregarItens() {
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
  const filtro = document.getElementById('filtroNomeItemEstoque')?.value?.toLowerCase() || '';
  const tbody = document.querySelector("#tabelaItens tbody");
  tbody.innerHTML = "";
  const mediaMensalPorItem = calcularConsumoMedioMensal();
  cacheItensEstoque
    .filter(item => item.name.toLowerCase().includes(filtro))
    .forEach((item) => {
      const situacao = item.quantity < item.min_stock_level ? 'Baixo' : 'Adequado';
      const situacaoClass = item.quantity < item.min_stock_level ? 'situacao-baixo' : 'situacao-adequado';
      const mediaMensal = mediaMensalPorItem[String(item.id)] || 0;
      const minimoSugerido = Math.max(item.min_stock_level, Math.round(mediaMensal));
      const podeAplicar = minimoSugerido > Number(item.min_stock_level || 0);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="col-acoes">
          <button class="btn-excluir-item" data-id="${item.id}" data-nome="${item.name}">Excluir</button>
          <button class="btn-aplicar-minimo" data-id="${item.id}" data-minimo="${minimoSugerido}" ${podeAplicar ? "" : "disabled"}>Aplicar min.</button>
        </td>
        <td class="col-codigo-item">${item.code}</td>
        <td class="col-nome-item" title="${item.category || ''}">${item.name}</td>
        <td class="col-minimo-sugerido">${minimoSugerido}</td>
        <td class="col-estoque-minimo">${item.min_stock_level}</td>
        <td class="col-estoque">${item.quantity}</td>
        <td class="${situacaoClass}">${situacao}</td>
      `;
      tbody.appendChild(tr);
    });
}

function exportarEstoquePdf() {
  const filtro = document.getElementById('filtroNomeItemEstoque')?.value?.toLowerCase() || '';
  const itens = cacheItensEstoque.filter(item => item.name.toLowerCase().includes(filtro));
  const linhas = itens.map(item => {
    const situacao = item.quantity < item.min_stock_level ? 'Baixo' : 'Adequado';
    const situacaoClass = item.quantity < item.min_stock_level ? 'situacao-baixo' : 'situacao-adequado';
    return `<tr>
      <td>${item.code}</td>
      <td>${item.name}</td>
      <td>${item.min_stock_level}</td>
      <td>${item.quantity}</td>
      <td class="${situacaoClass}">${situacao}</td>
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
        .situacao-baixo { background: #ffdddd; color: #b30000; font-weight: bold; }
        .situacao-adequado { background: #e6ffdd; color: #228B22; font-weight: bold; }
        @media print {
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          tbody tr:nth-child(even) { background: #e3ecf7 !important; }
          tbody tr:nth-child(even) td { background: #e3ecf7 !important; }
          .situacao-baixo { background: #ffdddd !important; color: #b30000 !important; }
          .situacao-adequado { background: #e6ffdd !important; color: #228B22 !important; }
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
            <th>Estoque Mínimo</th>
            <th>Estoque Atual</th>
            <th>Situação</th>
          </tr>
        </thead>
        <tbody>
          ${linhas || '<tr><td colspan="5">Sem dados para exportar.</td></tr>'}
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
    min_stock_level: parseInt(document.getElementById("min_stock_level").value),
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
    description: item.description || "",
    min_stock_level: Number(novoMinimo),
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
