## UniGestor — Sistema de Gestão de Estoque, funcionários e Uniformes

UniGestor é um sistema completo para controle de funcionários, uniformes, EPIs e movimentações de estoque, desenvolvido com Node.js (Express) e MySQL, com frontend em HTML, CSS e JavaScript puro.

## Funcionalidades:

* **Cadastro e exclusão de funcionários**
* **Registro de entregas e movimentações de estoque** (uniformes, EPIs, etc.).
* **Registro de Movimentações** (entrada e saída de estoque).
* **Consulta de funcionários inativos** (sem entrega há mais de 20 meses).
* **Exclusão em cascata** (funcionário + entregas).
* **Interface simples e responsiva**

---

## Tecnologias Utilizadas

* **Node.js + Express**
* **MySQL**
* **HTML5, CSS3, JavaScript**
* **dotenv, cors**

---

## Instalação e Configuração
1. Requisitos

* **Node.js 18+**
* **MySQL Server**

2. Banco de Dados
Crie o banco e as tabelas no MySQL:

CREATE DATABASE unigestor;
USE unigestor;

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

CREATE TABLE employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registration VARCHAR(50) UNIQUE,
  name VARCHAR(100)
);

CREATE TABLE uniform_deliveries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT,
  item VARCHAR(50),
  delivery_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  observation TEXT,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT,
  type ENUM('entrada','saida') NOT NULL,
  quantity INT NOT NULL,
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reason TEXT,
  performed_by VARCHAR(100),
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);


3. Backend
Acesse a pasta backend e instale as dependências:

cd backend
npm install

Crie o arquivo .env com suas credenciais MySQL:

PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=unigestor


Inicie o servidor:

npm start

O backend ficará disponível em http://localhost:3000.

4. Frontend
Abra os arquivos HTML da pasta frontend diretamente no navegador (ex: index.html, itens.html, funcionarios.html, etc).

Para melhor experiência, use a extensão Live Server do VS Code.

## Fluxo de Uso

1. Cadastre funcionários e itens.
2. Registre entregas e movimentações.
3. Consulte funcionários inativos e exclua registros conforme necessário.
