-- Activation de pg_cron si pas déjà fait
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Planification de l'appel à l'Edge Function daily-report chaque jour à 08:00
-- Note: '0 8 * * *' signifie 08:00 AM tous les jours
SELECT cron.schedule(
    'daily-admin-report',
    '0 8 * * *',
    $$
    SELECT net.http_post(
        url := 'https://koeqenilctqgytjludlt.supabase.co/functions/v1/daily-report',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlubm9leHN6em9mZHV0ZHVkZWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDY2MDEsImV4cCI6MjA4NTY4MjYwMX0.cQzJzNn1QzY3uHp3rsBGnlZNgUl5pjSZyGwBJXzAgA4"}'::jsonb
    );
    $$
);
