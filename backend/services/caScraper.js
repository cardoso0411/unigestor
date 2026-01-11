import puppeteer from "puppeteer";

export async function consultarCA(numeroCA) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.goto("https://caepi.mte.gov.br/internet/ConsultaCAInternet.aspx", {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });

  await page.waitForSelector("#txtNumeroCA");

  await page.type("#txtNumeroCA", numeroCA);
  await page.click("#btnConsultar");

  await new Promise(r => setTimeout(r, 5000));

  // Seletor flexível: pega o primeiro botão Detalhar da tabela de resultados
  const detalharBtn = await page.$('input[id^="PlaceHolderConteudo_grdListaResultado_btnDetalhar_"]');
  if (!detalharBtn) {
    await browser.close();
    throw new Error("CA não encontrado ou site fora do ar.");
  }

  await detalharBtn.click();
  await new Promise(r => setTimeout(r, 5000));

  await page.waitForSelector("#PlaceHolderConteudo_lblNOEquipamento");

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

  await browser.close();

  return dados;
}