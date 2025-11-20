import express from "express";
import { db } from "../db.js";

const router = express.Router();

// Listar todos os funcionários ou buscar por matrícula
router.get("/employees", (req, res) => {
  const { registration } = req.query;
  let q, params;
  if (registration) {
    q = "SELECT * FROM employees WHERE registration = ?";
    params = [registration];
  } else {
    q = "SELECT * FROM employees ORDER BY name ASC";
    params = [];
  }
  db.query(q, params, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.json(data);
  });
});

// Cadastrar novo funcionário
router.post("/employees", (req, res) => {
  const { registration, name } = req.body;
  if (!registration || !name) {
    return res.status(400).json({ error: "Preencha matrícula e nome." });
  }

  const q = "INSERT INTO employees (registration, name) VALUES (?, ?)";
  db.query(q, [registration, name], (err) => {
    if (err) return res.status(500).json(err);
    return res.json({ message: "Funcionário cadastrado com sucesso!" });
  });
});

// Excluir funcionário e entregas vinculadas
router.delete("/employees/:id", (req, res) => {
  const funcionarioId = req.params.id;
  // Excluir entregas vinculadas primeiro
  const q1 = "DELETE FROM uniform_deliveries WHERE employee_id = ?";
  db.query(q1, [funcionarioId], (err1) => {
    if (err1) return res.status(500).json(err1);
    // Agora excluir o funcionário
    const q2 = "DELETE FROM employees WHERE id = ?";
    db.query(q2, [funcionarioId], (err2) => {
      if (err2) return res.status(500).json(err2);
      return res.json({ message: "Funcionário e entregas excluídos com sucesso." });
    });
  });
});

// Registrar entrega de uniforme
router.post("/deliveries", (req, res) => {
  const { employee_id, item, observation } = req.body;
  if (!employee_id || !item) {
    return res.status(400).json({ error: "Preencha funcionário e item." });
  }

  const q = `
    INSERT INTO uniform_deliveries (employee_id, item, observation)
    VALUES (?, ?, ?)
  `;
  db.query(q, [employee_id, item, observation], (err) => {
    if (err) return res.status(500).json(err);
    return res.json({ message: "Entrega registrada com sucesso!" });
  });
});

// Listar entregas
router.get("/deliveries", (req, res) => {
  const q = `
    SELECT u.id, e.name AS employee_name, e.registration, u.item, 
           u.delivery_date, u.observation, u.last_delivery
    FROM uniform_deliveries u
    JOIN employees e ON e.id = u.employee_id
    ORDER BY u.delivery_date DESC
  `;
  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.json(data);
  });
});

// Excluir uma entrega
router.delete("/deliveries/:id", (req, res) => {
  const q = "DELETE FROM uniform_deliveries WHERE id = ?";
  db.query(q, [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    return res.json({ message: "Entrega excluída com sucesso." });
  });
});

// Funcionários inativos há mais de 20 meses (apenas quem já teve entrega)
router.get("/inativos", (req, res) => {
  const q = `
    SELECT f.id, f.registration, f.name,
      MAX(u.delivery_date) AS last_delivery
    FROM employees f
    JOIN uniform_deliveries u ON u.employee_id = f.id
    GROUP BY f.id, f.registration, f.name
    HAVING TIMESTAMPDIFF(MONTH, last_delivery, CURDATE()) > 20
    ORDER BY last_delivery ASC
  `;
  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.json(data);
  });
});

export default router;