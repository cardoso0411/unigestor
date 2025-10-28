## Instruções rápidas para agentes AI — UniGestor

Resumo curto (usar como referência rápida):
- Backend: Node.js + Express (ES Modules). Entrypoint: `backend/server.js`.
- DB: MySQL via `mysql2` — conexão em `backend/db.js` usando variáveis em `.env`.
- Frontend: HTML/CSS/JS estático em `frontend/`. Os scripts JS usam `apiBase = "http://localhost:3000/api"` em `frontend/js/*.js`.

O que um agente deve saber primeiro
- Código fonte principal do backend: `backend/server.js` — registra rotas em `/api/items` e `/api/movements`.
- Rotas e contratos HTTP observados:
  - GET  /api/items -> lista todos os itens (retorna array de objetos `items`).
  - POST /api/items -> cria um item. Body esperado (JSON): { code, name, category, description?, min_stock_level?, quantity? } — ver `backend/routes/items.js`.
  - PUT  /api/items/:id -> atualiza item (mesmos campos do POST).
  - DELETE /api/items/:id -> remove item.
  - GET  /api/movements -> lista movimentações; query retorna campos de `movements` com `item_name` (JOIN em items).
  - POST /api/movements -> registra movimentação. Body observado (JSON): { item_id, type, quantity, reason?, performed_by? } — ver `backend/routes/movements.js`.

Importante — discrepâncias detectadas
- README.md contém um SQL de exemplo onde `movements.type` é ENUM('entrada','saida') e a coluna de data chama-se `date`. O código em `backend/routes/movements.js` trata `type === "IN"` para decidir adicionar/subtrair estoque e usa `performed_at` na query de listagem. Conclusão: prefira o comportamento do código (rotas) como fonte de verdade; o README pode estar desatualizado.

Configuração e execução (desenvolvimento)
- Backend:
  1. Entrar em `backend/`.
  2. Criar `.env` com: PORT, DB_HOST, DB_USER, DB_PASSWORD, DB_NAME (README contém exemplo).
  3. `npm install` para instalar dependências do backend.
  4. `node server.js` ou `npm start` para iniciar (server imprime porta e status da conexão MySQL).
- Frontend: os arquivos em `frontend/` são estáticos; abra `frontend/login.html` ou `frontend/index.html` no navegador ou use Live Server.

Padrões de projeto e convenções observadas
- Backend usa ES Modules (import/export). Não converter para CommonJS sem ajustar `package.json` (verificar `type`).
- Acesso a DB é feito por `mysql2` com queries SQL inline em `backend/routes/*.js`.
- Erros do DB geralmente retornam HTTP 500 com o objeto `err`/mensagem.
- Frontend comunica-se diretamente com o backend pela constante `apiBase` em `frontend/js/*.js`.

Onde olhar para mudanças relacionadas
- Rotas: `backend/routes/items.js` e `backend/routes/movements.js`.
- Conexão DB: `backend/db.js`.
- Lógica de UI e payloads: `frontend/js/itens.js`, `frontend/js/movimentos.js`, `frontend/js/dashboard.js`.
- Scripts auxiliares mencionados: `backend/scripts/hash_password.js` (referenciado no README) — se precisar operar com senhas, verifique se o script existe e está atualizado.

Recomendações práticas para um PR gerado por agente
- Sempre executar uma verificação rápida: iniciar backend com as variáveis `.env` locais e testar manualmente (fetch/curl) os endpoints modificados.
- Se modificar esquema de DB, atualize README e rotas para manter nomes e enums consistentes (ex.: `type` e `performed_at` vs `date`).
- Risco alto: mudar formatos de API sem migrar frontend static — coordene alterações em `frontend/js/*` junto com backend.

Se algo não estiver claro
- Peça acesso ao arquivo `.env.example` ou confirme convenções de enum/colunas antes de editar o schema.
- Se o README divergir do código (como no `movements.type`), favor implementar mudanças no código e atualizar README com um pequeno commit explicando a migração.

Fim — peça feedback ao maintainer se houver áreas com comportamento ambiente-dependente (MySQL auth, scripts externos).