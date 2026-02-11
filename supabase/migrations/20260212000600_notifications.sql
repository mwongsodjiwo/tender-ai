-- Sprint 8: Notificaties & Integraties
-- Tabellen: notifications, notification_preferences

-- Enum: notification_type
CREATE TYPE notification_type AS ENUM (
    'deadline_approaching',
    'deadline_overdue',
    'activity_assigned',
    'planning_changed',
    'milestone_completed',
    'overload_warning',
    'weekly_summary'
);

-- Notificaties tabel
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread
    ON notifications(user_id) WHERE is_read = false;
CREATE INDEX idx_notifications_org ON notifications(organization_id);
CREATE INDEX idx_notifications_project ON notifications(project_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Notificatievoorkeuren per gebruiker
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    in_app BOOLEAN DEFAULT true,
    email BOOLEAN DEFAULT true,
    days_before_deadline INT DEFAULT 7,
    UNIQUE(user_id, notification_type)
);

CREATE INDEX idx_notif_prefs_user ON notification_preferences(user_id);

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Gebruikers zien alleen eigen notificaties
CREATE POLICY notifications_select ON notifications FOR SELECT
    USING (user_id = auth.uid());

-- Systeem (service role) mag notificaties aanmaken
CREATE POLICY notifications_insert ON notifications FOR INSERT
    WITH CHECK (true);

-- Gebruikers mogen eigen notificaties als gelezen markeren
CREATE POLICY notifications_update ON notifications FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Voorkeuren: alleen eigen voorkeuren lezen/schrijven
CREATE POLICY notif_prefs_select ON notification_preferences FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY notif_prefs_insert ON notification_preferences FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY notif_prefs_update ON notification_preferences FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Notifications heeft geen updated_at kolom — geen trigger nodig

-- Standaard voorkeuren inserten bij nieuwe gebruiker (via functie)
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
DECLARE
    nt notification_type;
BEGIN
    FOR nt IN SELECT unnest(enum_range(NULL::notification_type))
    LOOP
        INSERT INTO notification_preferences (user_id, notification_type)
        VALUES (NEW.id, nt)
        ON CONFLICT DO NOTHING;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_notif_prefs_on_profile
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION create_default_notification_preferences();
