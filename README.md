## UniGestor

O UniGestor é um sistema web para gerenciar o estoque de itens, uniformes, EPIs (Equipamentos de Proteção Individual) e funcionários de uma empresa. Ele facilita o cadastro, controle de movimentações (entradas e saídas), entrega de uniformes, consulta de funcionários inativos e exclusão segura de registros.

### Principais recursos

- **Cadastro e gerenciamento de funcionários:** Adicione, edite e exclua funcionários, mantendo o histórico de entregas e movimentações.
- **Controle de estoque:** Registre entradas e saídas de itens, monitore níveis mínimos de estoque e acompanhe movimentações detalhadas.
- **Gestão de uniformes e EPIs:** Controle entregas de uniformes e equipamentos de proteção individual para cada funcionário.
- **Consulta de funcionários inativos:** Identifique funcionários sem movimentações recentes para facilitar auditorias e decisões administrativas.
- **Exclusão em cascata:** Ao remover um funcionário, todas as entregas associadas são excluídas automaticamente.
- **Interface web simples e responsiva:** Acesse todas as funcionalidades de forma intuitiva pelo navegador.

### Tecnologias utilizadas

- **Backend:** Node.js + Express (ES Modules), conexão MySQL via `mysql2`.
- **Frontend:** HTML, CSS e JavaScript puro, arquivos estáticos.
- **Autenticação:** LocalStorage no frontend.
- **Configuração:** Variáveis de ambiente via `.env`.

### Como funciona

Para iniciar o projeto UniGestor, você precisa criar o banco de dados MySQL chamado unigestor e definir as tabelas necessárias:

# No MySQL, execute:

CREATE DATABASE unigestor;

## Criar as tabelas principais
Tabelas: items, employees, movements, uniform_deliveries.

1. **Cadastro de funcionários e itens:** Registre novos funcionários e itens de estoque pelo painel web.
2. **Movimentações e entregas:** Lance entradas/saídas de estoque e registre entregas de uniformes/EPIs.
3. **Consulta e relatórios:** Visualize movimentações, estoque atual e funcionários inativos.
4. **Exclusão segura:** Remova funcionários e seus registros de entrega conforme necessário.
