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
  }
});