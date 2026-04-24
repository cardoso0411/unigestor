import fs from "node:fs";
import puppeteer from "puppeteer";

const COMMON_LAUNCH_OPTIONS = {
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
};

const WINDOWS_BROWSER_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
];

function isSpawnError(error) {
  const texto = `${error?.message || ""} ${error?.code || ""}`.toLowerCase();
  return texto.includes("spawn unknown") || texto.includes("enoent") || texto.includes("eacces");
}

async function iniciarBrowserComFallback() {
  const tentativas = [
    { nome: "chromium_embutido", options: { ...COMMON_LAUNCH_OPTIONS } }
  ];

  WINDOWS_BROWSER_PATHS
    .filter((caminho) => fs.existsSync(caminho))
    .forEach((caminho) => {
      tentativas.push({
        nome: caminho,
        options: { ...COMMON_LAUNCH_OPTIONS, executablePath: caminho }
      });
    });

  const erros = [];
  for (const tentativa of tentativas) {
    try {
      const browser = await puppeteer.launch(tentativa.options);
      return browser;
    } catch (erro) {
      erros.push({ nome: tentativa.nome, erro });
    }
  }

  const erroPrincipal = erros[0]?.erro;
  if (isSpawnError(erroPrincipal)) {
    throw new Error(
      "Nao foi possivel iniciar o navegador automatico (erro de inicializacao do Chromium/Chrome). " +
      "Reinicie o backend e tente novamente. Se persistir, reinstale dependencias do backend (npm install) " +
      "ou verifique se o Chrome/Edge esta instalado."
    );
  }

  throw erroPrincipal || new Error("Falha ao iniciar navegador para consulta de CA.");
}

export async function consultarCA(numeroCA) {
  let browser;
  try {
    browser = await iniciarBrowserComFallback();
    const page = await browser.newPage();

    await page.goto("https://caepi.mte.gov.br/internet/ConsultaCAInternet.aspx", {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForSelector("#txtNumeroCA");
    await page.type("#txtNumeroCA", numeroCA);
    await page.click("#btnConsultar");

    let detalharBtn = null;
    let tentativas = 0;
    const maxTentativas = 4;
    const delayTentativa = 4000;
    while (!detalharBtn && tentativas < maxTentativas) {
      detalharBtn = await page.$('input[id^="PlaceHolderConteudo_grdListaResultado_btnDetalhar_"]');
      if (!detalharBtn) {
        await new Promise((resolve) => setTimeout(resolve, delayTentativa));
        tentativas++;
      }
    }

    if (!detalharBtn) {
      throw new Error("CA nao encontrado ou resultado nao carregou (site pode estar lento ou fora do ar).");
    }

    await detalharBtn.click();
    await new Promise((resolve) => setTimeout(resolve, 7000));
    await page.waitForSelector("#PlaceHolderConteudo_lblNOEquipamento", { timeout: 20000 });

    const dados = await page.evaluate(() => {
      function get(id) {
        const el = document.getElementById(id);
        return el ? el.innerText.trim() : "";
      }

      return {
        equipamento: get("PlaceHolderConteudo_lblNOEquipamento"),
        descricao: get("PlaceHolderConteudo_lblEquipamentoDSEquipamentoTexto"),
        aprovado_para: get("PlaceHolderConteudo_lblDSAprovadoParaLaudo"),
        empresa: get("PlaceHolderConteudo_lblNORazaoSocial"),
        cnpj: get("PlaceHolderConteudo_lblNRCNPJ"),
        validade: get("PlaceHolderConteudo_lblDTValidade")
      };
    });

    return dados;
  } catch (erro) {
    if (isSpawnError(erro)) {
      throw new Error(
        "Falha ao iniciar navegador para consulta automatica de CA (spawn). " +
        "Reinicie o backend e tente novamente."
      );
    }
    throw erro;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
