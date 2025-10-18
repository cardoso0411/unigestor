## 🧭 UniGestor — Sistema de Gestão de Funcionários e Uniformes

Sistema completo de **Gestão de Funcionários e Uniformes** desenvolvido com **Node.js** (Express) e **MySQL**, utilizando **HTML/CSS/JS** no frontend.

Este sistema oferece funcionalidades essenciais para o controle de estoque:

* **Login seguro** (com `bcrypt`).
* **Controle de Itens** (uniformes, EPIs, etc.).
* **Registro de Movimentações** (entrada e saída de estoque).
* **Upload de Planilha Excel (.xlsx)** para importação/atualização de itens.
* **Edição e Remoção** de registros.

---

## 📁 Estrutura do Projeto

UniGestor/
│
├── backend/
│   ├── server.js               # Servidor principal
│   ├── db.js                   # Conexão com o banco de dados
│   ├── routes/                 # Rotas da API (autenticação, itens, movimentos, importação)
│   ├── scripts/                # Scripts utilitários (ex: hash_password.js)
│   ├── package.json
│   └── .env                    # Variáveis de ambiente
│
└── frontend/
    ├── index.html              # Dashboard
    ├── login.html              # Tela de Login
    ├── itens.html              # Gestão de Itens
    ├── movimentos.html         # Registro de Movimentações
    ├── css/style.css
    └── js/                     # Scripts frontend (lógica de autenticação e comunicação com a API)

---

## ⚙️ 1. Requisitos

Antes de iniciar, certifique-se de ter instalado:

* **Node.js** (versão 18 ou superior)
* **MySQL Server**
* **MySQL Workbench** (Opcional, mas útil)

---

## 🧩 2. Configurar o Banco de Dados MySQL

Abra o MySQL Workbench e execute os seguintes comandos SQL:

```sql
CREATE DATABASE unigestor;
USE unigestor;

-- Tabela de Usuários
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Itens/Uniformes
CREATE TABLE items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE,
  name VARCHAR(100),
  category VARCHAR(50),
  description TEXT,
  min_stock_level INT DEFAULT 0,
  quantity INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Movimentações de Estoque
CREATE TABLE movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT,
  type ENUM('entrada','saida') NOT NULL,
  quantity INT NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

