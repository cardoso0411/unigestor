const apiBase = "http://localhost:3000/api";

function parseMovDate(m) {
  const d = new Date(m.performed_at || m.date || m.created_at);
  return isNaN(d) ? null : d;
}

async function carregarRankingConsumo() {
  // Soma o consumo do mes atual e ordena do maior para o menor.
  const [resItens, resMovs] = await Promise.all([
    fetch(`${apiBase}/items`),
    fetch(`${apiBase}/movements`)
  ]);

  const itens = await resItens.json();
  const movs = await resMovs.json();
  const tbody = document.querySelector("#tabelaRankingConsumo tbody");
  tbody.innerHTML = "";

  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = agora.getMonth();

  const saidasMes = movs.filter(m => m.type === "OUT").filter(m => {
    const d = parseMovDate(m);
    return d && d.getFullYear() === ano && d.getMonth() === mes;
  });

  const totalPorItem = {};
  saidasMes.forEach(m => {
    const id = String(m.item_id);
    totalPorItem[id] = (totalPorItem[id] || 0) + Number(m.quantity || 0);
  });

  const itensMap = {};
  itens.forEach(i => {
    itensMap[String(i.id)] = i.name;
  });

  const ranking = Object.entries(totalPorItem)
    .map(([id, total]) => ({ id, total }))
    .sort((a, b) => b.total - a.total);

  if (ranking.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="2">Sem consumo registrado neste mes.</td>`;
    tbody.appendChild(tr);
    return;
  }

  ranking.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${itensMap[r.id] || "Item " + r.id}</td>
      <td class="col-quantidade-consumo">${r.total}</td>
    `;
    tbody.appendChild(tr);
  });

  const lista = document.getElementById("listaItensRanking");
  const btnAbrir = document.getElementById("btnAbrirFiltroRanking");
  const dropdown = document.getElementById("dropdownFiltroRanking");
  const btnLimpar = document.getElementById("btnLimparFiltroRanking");
  const inputBusca = document.getElementById("buscarFiltroRanking");

  let nomesUnicos = Array.from(new Set(ranking.map(r => itensMap[r.id] || "Item " + r.id)));
  nomesUnicos.sort((a, b) => a.localeCompare(b, "pt-BR"));

  function aplicarFiltro() {
    // Filtra a tabela do ranking usando os itens marcados no dropdown.
    const selecionados = Array.from(lista?.querySelectorAll('input[type="checkbox"]:checked') || [])
      .map(cb => cb.value.toLowerCase());
    const linhas = tbody.querySelectorAll("tr");
    linhas.forEach(tr => {
      const nome = tr.querySelector("td")?.textContent?.toLowerCase() || "";
      if (selecionados.length === 0) {
        tr.style.display = "";
        return;
      }
      tr.style.display = selecionados.includes(nome) ? "" : "none";
    });
    if (btnAbrir) {
      btnAbrir.textContent = selecionados.length
        ? `Filtrar itens (${selecionados.length})`
        : "Filtrar itens";
    }
  }

  if (lista) {
    lista.innerHTML = "";
    nomesUnicos.forEach(nome => {
      const label = document.createElement("label");
      label.style.display = "flex";
      label.style.alignItems = "center";
      label.style.gap = "4px";
      label.style.padding = "6px 8px";
      label.style.border = "1px solid #e6edf6";
      label.style.borderRadius = "6px";
      label.style.background = "#f8fafc";
      label.style.cursor = "pointer";
      label.style.marginBottom = "6px";
      label.style.transition = "background 0.15s, border-color 0.15s";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = nome;
      input.style.margin = "0";
      input.addEventListener("change", aplicarFiltro);
      input.addEventListener("change", () => {
        if (input.checked) {
          label.style.background = "#e8f1ff";
          label.style.borderColor = "#9dbcf9";
          span.style.fontWeight = "600";
        } else {
          label.style.background = "#f8fafc";
          label.style.borderColor = "#e6edf6";
          span.style.fontWeight = "400";
        }
      });
      label.addEventListener("mouseenter", () => {
        if (!input.checked) {
          label.style.background = "#f1f6ff";
          label.style.borderColor = "#c7d8f3";
        }
      });
      label.addEventListener("mouseleave", () => {
        if (!input.checked) {
          label.style.background = "#f8fafc";
          label.style.borderColor = "#e6edf6";
          span.style.fontWeight = "400";
        }
      });
      const span = document.createElement("span");
      span.textContent = nome;
      label.appendChild(input);
      label.appendChild(span);
      lista.appendChild(label);
    });
  }

  if (btnAbrir && dropdown) {
    btnAbrir.addEventListener("click", () => {
      dropdown.style.display = dropdown.style.display === "none" || !dropdown.style.display ? "block" : "none";
      if (dropdown.style.display === "block") {
        inputBusca?.focus();
      }
    });
    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target) && e.target !== btnAbrir) {
        dropdown.style.display = "none";
      }
    });
  }

  if (btnLimpar) {
    btnLimpar.addEventListener("click", () => {
      const checks = lista?.querySelectorAll('input[type="checkbox"]') || [];
      checks.forEach(cb => { cb.checked = false; });
      if (inputBusca) inputBusca.value = "";
      aplicarFiltro();
    });
  }

  if (inputBusca && lista) {
    inputBusca.addEventListener("input", () => {
      const termo = inputBusca.value.trim().toLowerCase();
      const labels = lista.querySelectorAll("label");
      labels.forEach(label => {
        const texto = label.textContent?.toLowerCase() || "";
        label.style.display = texto.includes(termo) ? "flex" : "none";
      });
    });
  }

  aplicarFiltro();
}

carregarRankingConsumo();

