// backend/routes/items.js
import express from "express";
import { db } from "../db.js";

const router = express.Router();

// Listar todos os itens
router.get("/", (req, res) => {
  db.query("SELECT * FROM items ORDER BY name", (err, data) => {
    if (err) return res.status(500).json({ error: err.message });
    return res.json(data);
  });
});

// Adicionar novo item
router.post("/", (req, res) => {
  const { code, name, category, description, min_stock_level, quantity } = req.body;
  const q = `INSERT INTO items (code, name, category, description, min_stock_level, quantity)
             VALUES (?, ?, ?, ?, ?, ?)`;
  db.query(q, [code, name, category, description, min_stock_level || 0, quantity || 0], (err, data) => {
    if (err) return res.status(500).json({ error: err.message });
    return res.status(201).json({ message: "Item criado com sucesso!", id: data.insertId });
  });
});

// Atualizar item (edição)
router.put("/:id", (req, res) => {
  const id = req.params.id;
  const { code, name, category, description, min_stock_level, quantity } = req.body;
  const q = `UPDATE items SET code=?, name=?, category=?, description=?, min_stock_level=?, quantity=? WHERE id=?`;
  db.query(q, [code, name, category, description, min_stock_level || 0, quantity || 0, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    return res.json({ message: "Item atualizado com sucesso!" });
  });
});

// Deletar item
router.delete("/:id", (req, res) => {
  const id = req.params.id;
  const q = `DELETE FROM items WHERE id=?`;
  db.query(q, [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    return res.json({ message: "Item removido com sucesso!" });
  });
});

export default router;