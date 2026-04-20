// Rotas que salvam e leem as sugestoes de compra usando um arquivo JSON.
import express from 'express';
import fs from 'fs';
const router = express.Router();

// Visualizar sugestões salvas
router.get('/', (req, res) => {
  // readFile le o arquivo inteiro e devolve o conteudo como texto.
  fs.readFile('sugestoes-compras.json', 'utf8', (err, data) => {
    if (err) {
      // Se arquivo não existe, retorna array vazio
      if (err.code === 'ENOENT') return res.json([]);
      return res.status(500).json({ error: 'Erro ao ler arquivo' });
    }
    try {
      const sugestoes = JSON.parse(data);
      res.json(sugestoes);
    } catch {
      res.status(500).json({ error: 'Arquivo corrompido' });
    }
  });
});

// Salvar sugestões de compras em arquivo JSON
router.post('/', (req, res) => {
  const sugestoes = req.body; // array de sugestões
  // JSON.stringify transforma o array em texto antes de gravar no disco.
  fs.writeFile('sugestoes-compras.json', JSON.stringify(sugestoes, null, 2), err => {
    if (err) return res.status(500).json({ error: 'Erro ao salvar arquivo' });
    res.json({ message: 'Sugestões salvas com sucesso!' });
  });
});

export default router;