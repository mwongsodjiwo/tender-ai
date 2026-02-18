-- Migration: Supplier enums for leveranciers CRM (v2 Fase 8)

-- Supplier status within a project lifecycle
CREATE TYPE supplier_project_status AS ENUM (
  'prospect', 'geinteresseerd', 'ingeschreven',
  'gewonnen', 'afgewezen', 'gecontracteerd'
);

-- Supplier role within a project
CREATE TYPE supplier_project_role AS ENUM (
  'genodigde', 'vragensteller', 'inschrijver',
  'winnaar', 'contractpartij'
);
