// Rota intermediaria entre o frontend e o servico que consulta o CA no site oficial.
import express from "express";
import { consultarCA } from "../services/caScraper.js";

const router = express.Router();

router.post("/consultar", async (req, res) => {
  const { ca } = req.body;
  if (!ca) return res.status(400).json({ error: "Informe o número do CA." });

  try {
    // await pausa a funcao ate a consulta externa terminar.
    const dados = await consultarCA(ca);
    return res.json(dados);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
