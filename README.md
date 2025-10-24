## 🧭 UniGestor — Sistema de Gestão de Funcionários e Uniformes

Sistema completo de **Gestão de Funcionários e Uniformes** desenvolvido com **Node.js** (Express) e **MySQL**, utilizando **HTML/CSS/JS** no frontend.

Este sistema oferece funcionalidades essenciais para o controle de estoque:

* **Login seguro** (com `bcrypt`).
* **Controle de Itens** (uniformes, EPIs, etc.).
* **Registro de Movimentações** (entrada e saída de estoque).
* **Edição e Remoção** de registros.

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

🔐 3. Criar usuário inicial

Você pode criar manualmente:

INSERT INTO users (username, password) VALUES ('admin', '1234');

⚠️ Isso será sobrescrito pelo script de hash de senha abaixo (para segurança).

🧠 4. Configurar o backend

Acesse a pasta do backend:

cd backend

Instale as dependências:

npm install express mysql2 dotenv cors bcrypt formidable xlsx

Crie o arquivo .env com as credenciais do seu MySQL:

PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_aqui
DB_NAME=unigestor

🔑 5. Hash da senha (bcrypt)

Execute o script para criptografar a senha do usuário admin:

node scripts/hash_password.js

➡️ Isso atualiza a senha de “1234” para um hash bcrypt no banco.

🚀 6. Rodar o servidor backend

Execute:

npm start

ou

node server.js

O backend ficará rodando em:

http://localhost:3000

Se tudo estiver certo, verá no terminal:

Servidor rodando na porta 3000...
Conexão com o banco de dados bem-sucedida!

🌐 7. Rodar o frontend

Basta abrir os arquivos HTML diretamente no navegador:

frontend/login.html

Ou use uma extensão como Live Server no VS Code
(clicando “Go Live” na barra inferior).

🧭 8. Fluxo do sistema

Login:
Vá até login.html, entre com usuário admin e senha 1234.
O sistema salva o login no localStorage.

Dashboard:
Após login, acesse index.html para ver o painel principal.

Itens:
Vá para itens.html para:

Adicionar / editar / excluir itens

Movimentações:
Em movimentos.html você pode registrar entradas e saídas de estoque.

Logout:
Clique no botão “Logout” na barra superior para sair.

🧹 9. Dicas e resolução de problemas

Se aparecer “ER_NOT_SUPPORTED_AUTH_MODE”, altere o método de autenticação do MySQL:

ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'sua_senha';
FLUSH PRIVILEGES;

Se o servidor não conectar:

Verifique se o MySQL está rodando.

Teste as credenciais no Workbench.

Verifique se a porta 3000 está livre.

Para limpar e recriar tabelas:

DROP DATABASE unigestor;
CREATE DATABASE unigestor;

🧑‍💻 10. Tecnologias utilizadas

Node.js / Express

MySQL

bcrypt (criptografia de senhas)

HTML5, CSS3, JavaScript puro

CORS + dotenv (configuração segura)

LocalStorage (autenticação no frontend)

🧩 11. Próximos passos (opcional)

Adicionar filtros e paginação

Criar relatórios PDF

Hospedar o backend (Render, Railway ou Fly.io)

Migrar o banco para PlanetScale ou Supabase (Postgres)

✅ Comando rápido de inicialização
# Instalar dependências e rodar
cd backend
npm install
node scripts/hash_password.js
npm start

Depois abra:
frontend/login.html
