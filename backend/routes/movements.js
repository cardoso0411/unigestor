// backend/routes/movements.js
import express from "express";
import { db } from "../db.js";

const router = express.Router();

// Registrar movimentação
router.post("/", (req, res) => {
  const { item_id, type, quantity, reason, performed_by } = req.body;

  const movementQuery = `
    INSERT INTO movements (item_id, type, quantity, reason, performed_by)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(movementQuery, [item_id, type, quantity, reason, performed_by], (err) => {
    if (err) return res.status(500).json(err);

    // Atualiza o estoque
    const updateQuery =
      type === "IN"
        ? `UPDATE items SET quantity = quantity + ? WHERE id = ?`
        : `UPDATE items SET quantity = quantity - ? WHERE id = ?`;

    db.query(updateQuery, [quantity, item_id], (err2) => {
      if (err2) return res.status(500).json(err2);
      return res.json({ message: "Movimentação registrada e estoque atualizado!" });
    });
  });
});

// Listar movimentações
router.get("/", (req, res) => {
  const q = `
    SELECT m.*, i.name AS item_name
    FROM movements m
    JOIN items i ON i.id = m.item_id
    ORDER BY m.performed_at DESC
  `;
  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.json(data);
  });
});

export default router;