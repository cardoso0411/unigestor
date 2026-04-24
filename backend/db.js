// Centraliza a conexao com o MySQL para reutilizacao no backend.
// backend/db.js
import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

export const db = mysql.createConnection({
  // As credenciais sao lidas do arquivo .env para nao ficarem fixas no codigo.
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    // Se falhar aqui, o backend nao conseguiu acessar o banco de dados.
    console.error("Erro ao conectar no banco:", err);
  } else {
    console.log("Conectado ao MySQL com sucesso!");
    garantirEstruturaInicial();
  }
});

function garantirEstruturaInicial() {
  const qCheck = "SHOW COLUMNS FROM items LIKE 'ca_number'";
  db.query(qCheck, (err, rows) => {
    if (err) {
      console.error("Erro ao verificar coluna ca_number:", err.message);
      return;
    }
    if (rows && rows.length > 0) return;

    const qAdd = "ALTER TABLE items ADD COLUMN ca_number VARCHAR(30) NULL AFTER category";
    db.query(qAdd, (errAdd) => {
      if (errAdd) {
        console.error("Erro ao criar coluna ca_number em items:", errAdd.message);
        return;
      }
      console.log("Coluna ca_number criada em items.");
    });
  });
}
