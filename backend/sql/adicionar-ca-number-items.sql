-- Adiciona o campo de C.A na tabela de itens.
ALTER TABLE items
ADD COLUMN ca_number VARCHAR(30) NULL AFTER category;
