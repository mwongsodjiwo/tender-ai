-- Performance indexes — veelgebruikte query paden optimaliseren

-- Artifacts: dashboard metrics, project detail
CREATE INDEX IF NOT EXISTS idx_artifacts_project_status
  ON artifacts(project_id, status);

CREATE INDEX IF NOT EXISTS idx_artifacts_project_updated
  ON artifacts(project_id, updated_at);

-- Messages: chat history laden per conversatie
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON messages(conversation_id, created_at);

-- Project members: lookup op profiel (sidebar, permissions)
CREATE INDEX IF NOT EXISTS idx_project_members_profile
  ON project_members(profile_id);

-- Phase activities: dashboard metrics, project voortgang
CREATE INDEX IF NOT EXISTS idx_phase_activities_project
  ON phase_activities(project_id, status);

-- Phase activities: deadlines ophalen (partial index)
CREATE INDEX IF NOT EXISTS idx_phase_activities_due_date
  ON phase_activities(due_date)
  WHERE deleted_at IS NULL;

-- Milestones: deadlines ophalen (partial index)
CREATE INDEX IF NOT EXISTS idx_milestones_target_date
  ON milestones(target_date)
  WHERE deleted_at IS NULL;

-- Notifications: bell icon count + recent list
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON notifications(user_id, is_read, created_at);

-- Evaluations: project evaluatie overzicht (partial index)
CREATE INDEX IF NOT EXISTS idx_evaluations_project
  ON evaluations(project_id)
  WHERE deleted_at IS NULL;
