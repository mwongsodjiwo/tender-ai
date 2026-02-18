-- Fase 10: Binnenkomende vragen module
-- Creates question_status enum and incoming_questions table

-- Question status enum
CREATE TYPE question_status AS ENUM (
  'received', 'in_review', 'answered', 'approved', 'published'
);

-- Incoming questions table
CREATE TABLE incoming_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  question_number SERIAL,
  supplier_id UUID REFERENCES suppliers(id),
  question_text TEXT NOT NULL,
  reference_document TEXT,
  reference_artifact_id UUID REFERENCES artifacts(id),
  answer_text TEXT,
  is_rectification BOOLEAN DEFAULT false,
  rectification_text TEXT,
  status question_status DEFAULT 'received',
  approved_by UUID REFERENCES profiles(id),
  received_at TIMESTAMPTZ DEFAULT now(),
  answered_at TIMESTAMPTZ,
  -- Governance
  data_classification data_classification DEFAULT 'archive',
  retention_until TIMESTAMPTZ,
  anonymized_at TIMESTAMPTZ,
  archive_status archive_status DEFAULT 'active',
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_incoming_questions_project ON incoming_questions(project_id);
CREATE INDEX idx_incoming_questions_status ON incoming_questions(status);
CREATE UNIQUE INDEX idx_incoming_questions_number
  ON incoming_questions(project_id, question_number);

-- RLS
ALTER TABLE incoming_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vragen zichtbaar voor project org leden"
  ON incoming_questions FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.profile_id = auth.uid()
    )
  );

CREATE POLICY "Vragen bewerkbaar door project org leden"
  ON incoming_questions FOR ALL
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.profile_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER set_incoming_questions_updated_at
  BEFORE UPDATE ON incoming_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
