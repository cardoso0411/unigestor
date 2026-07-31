# UniGestor

Sistema web para gerenciamento de estoque, EPIs e uniformes, com foco em controle operacional, rastreabilidade de movimentações e apoio à decisão de reposição.

acesse o portfólio do sistema:

<p align="center">
  <a href="https://cardoso0411.github.io/unigestor/" target="_blank">
    <img src="https://img.shields.io/badge/🌐%20Acessar%20Portfólio%20do%20Sistema-Online-blue?style=for-the-badge&logo=google-chrome">
  </a>
</p>

## Visão geral

O **UniGestor** foi criado para centralizar rotinas que normalmente ficam espalhadas em planilhas e controles manuais, como:

- Cadastro e consulta de itens
- Movimentações de entrada e saída
- Controle de entregas de uniformes por funcionário
- Acompanhamento de estoque crítico e itens parados
- Sugestão de compras com base em consumo
- Consulta e monitoramento de C.A. (Certificado de Aprovação)

A aplicação usa frontend em HTML/CSS/JavaScript e backend em Node.js com Express, utilizando MySQL como base de dados.

## Principais funcionalidades

- **Dashboard** com visão consolidada dos dados
- **Gestão de estoque**:
  - Itens cadastrados
  - Movimentações
  - Inventário
  - Divergência de estoque
  - Itens em baixa / estoque crítico
  - Itens parados
- **Uniformes**:
  - Registro de entregas
  - Gestão de funcionários
  - Lista de uniformes liberados
- **C.A. (EPI)**:
  - Consulta automática
  - Lista de C.A.
  - Relatório de C.A. vencendo
- **Compras**:
  - Sugestão de compras
  - Visualização de sugestões salvas
- **Backup**:
  - Script para backup das tabelas principais do MySQL

## Arquitetura do projeto

- `frontend/`: páginas HTML, scripts JS e estilos CSS
- `backend/`: API REST, regras de negócio e integração com banco
- `backend/routes/`: rotas por domínio (itens, movimentos, uniformes, C.A., backup, sugestões)
- `backend/services/`: serviços auxiliares (ex.: scraping/consulta de C.A.)
- `backend/sql/`: scripts SQL utilitários
- `Backup-do-sistema/`: automação de backup do banco

## Tecnologias utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express
- **Banco de dados**: MySQL
- **Bibliotecas principais**:
  - `mysql2`
  - `dotenv`
  - `cors`
  - `axios`
  - `puppeteer`

## Requisitos

Antes de executar, tenha instalado:

- Node.js 18+
- npm 9+
- MySQL 8+

## Configuração do ambiente

### 1. Clonar o repositório

```bash
git clone https://github.com/cardoso0411/controle_de_estoque_Uni.git
cd controle_de_estoque_Uni
```

### 2. Instalar dependências do backend

```bash
cd backend
npm install
```

### 3. Configurar variáveis de ambiente

Copie o arquivo de exemplo:

```bash
copy .env.example .env
```

Edite `backend/.env` com seus dados:

```env
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=unigestor
PORT=3000
```

### 4. Preparar o banco MySQL

- Crie o banco `unigestor` (ou ajuste `DB_NAME` no `.env`)
- Crie as tabelas necessárias para itens, movimentações, funcionários e entregas
- Execute scripts SQL complementares da pasta `backend/sql/` quando aplicável

## Executando o projeto

### Backend

Na pasta `backend/`:

```bash
npm start
```

A API será iniciada na porta configurada em `PORT` (ex.: `http://localhost:3000`).

### Frontend

Abra os arquivos HTML da pasta `frontend/` no navegador.

Sugestão: iniciar por `frontend/index.html`.

## Endpoints (visão geral)

Rotas principais registradas no backend:

- `/api/items`
- `/api/movements`
- `/api/uniformes`
- `/api/sugestoes-compras`
- `/api/ca`
- `/api/backup`

## Backup do banco

O script `Backup-do-sistema/backup-mysql.ps1` gera backup das tabelas principais e compacta em `.zip`.

Para executar (PowerShell):

```powershell
./Backup-do-sistema/backup-mysql.ps1
```

## Segurança e boas práticas

- Não versione `backend/.env` com credenciais reais
- Mantenha `node_modules` fora do Git
- Revise periodicamente senhas e acessos do banco
- Em publicações, prefira dados de exemplo e não dados reais

## Licença

Este projeto está licenciado sob a **MIT License**.
Veja o arquivo [LICENSE](LICENSE).
