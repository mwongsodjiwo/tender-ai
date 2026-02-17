-- Migration 029: New enums for multi-org architecture (v2 Fase 1)

-- Organization type
CREATE TYPE organization_type AS ENUM ('client', 'consultancy', 'government');

-- Contracting authority type (aanbestedende dienst)
CREATE TYPE contracting_authority_type AS ENUM ('centraal', 'decentraal');

-- Organization relationship type
CREATE TYPE organization_relationship_type AS ENUM (
  'consultancy', 'audit', 'legal', 'other'
);

-- Relationship status
CREATE TYPE relationship_status AS ENUM ('active', 'inactive', 'pending');

-- Data classification
CREATE TYPE data_classification AS ENUM ('archive', 'personal', 'operational');

-- Archive status
CREATE TYPE archive_status AS ENUM (
  'active', 'archived', 'retention_expired', 'anonymized', 'destroyed'
);

-- Anonymization strategy
CREATE TYPE anonymization_strategy AS ENUM ('replace', 'remove');
