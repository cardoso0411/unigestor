const apiBase = "http://localhost:3000/api";

async function carregarEstoqueCritico() {
  // Separa os itens entre niveis 'critico' e 'baixo' para leitura rapida.
  const res = await fetch(`${apiBase}/items`);
  const itens = await res.json();
  const tbody = document.querySelector("#tabelaEstoqueCritico tbody");
  tbody.innerHTML = "";

  const criticos = itens.filter(i => Number(i.quantity) <= 0);
  const baixos = itens.filter(i => Number(i.quantity) > 0 && Number(i.quantity) < Number(i.min_stock_level || 0));
  const lista = [...criticos.map(i => ({ ...i, nivel: "Critico" })), ...baixos.map(i => ({ ...i, nivel: "Baixo" }))];

  if (lista.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5">Nenhum item com estoque baixo ou critico.</td>`;
    tbody.appendChild(tr);
    return;
  }

  lista.forEach(item => {
    const cor = item.nivel === "Critico" ? "#d32f2f" : "#f59e0b";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="col-item-critico">${item.name}</td>
      <td class="col-codigo-critico">${item.code}</td>
      <td class="col-minimo-critico">${item.min_stock_level}</td>
      <td class="col-quantidade-critico">${item.quantity}</td>
      <td class="col-nivel-critico" style="color:${cor};font-weight:bold;">${item.nivel}</td>
    `;
    tbody.appendChild(tr);
  });

  const listaEl = document.getElementById("listaItensEstoqueCritico");
  const btnAbrir = document.getElementById("btnAbrirFiltroEstoqueCritico");
  const dropdown = document.getElementById("dropdownFiltroEstoqueCritico");
  const btnLimpar = document.getElementById("btnLimparFiltroEstoqueCritico");
  const inputBusca = document.getElementById("buscarFiltroEstoqueCritico");

  let nomesUnicos = Array.from(new Set(lista.map(i => i.name)));
  nomesUnicos.sort((a, b) => a.localeCompare(b, "pt-BR"));

  function aplicarFiltro() {
    // Exibe apenas as linhas dos itens marcados no filtro lateral.
    const selecionados = Array.from(listaEl?.querySelectorAll('input[type="checkbox"]:checked') || [])
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

  if (listaEl) {
    listaEl.innerHTML = "";
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
      const span = document.createElement("span");
      span.textContent = nome;
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
      label.appendChild(input);
      label.appendChild(span);
      listaEl.appendChild(label);
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
      const checks = listaEl?.querySelectorAll('input[type="checkbox"]') || [];
      checks.forEach(cb => { cb.checked = false; });
      if (inputBusca) inputBusca.value = "";
      aplicarFiltro();
    });
  }

  if (inputBusca && listaEl) {
    inputBusca.addEventListener("input", () => {
      const termo = inputBusca.value.trim().toLowerCase();
      const labels = listaEl.querySelectorAll("label");
      labels.forEach(label => {
        const texto = label.textContent?.toLowerCase() || "";
        label.style.display = texto.includes(termo) ? "flex" : "none";
      });
    });
  }

  aplicarFiltro();
}

carregarEstoqueCritico();

