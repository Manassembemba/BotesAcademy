-- Trigger pour envoyer une notification lors d'une absence
CREATE OR REPLACE FUNCTION public.handle_attendance_absent()
RETURNS TRIGGER AS $$
DECLARE
    student_email TEXT;
    student_name TEXT;
    course_name TEXT;
BEGIN
    -- On ne déclenche que si le statut est 'absent'
    IF (NEW.status = 'absent' AND (OLD.status IS NULL OR OLD.status <> 'absent')) THEN
        -- Récupération des infos nécessaires
        SELECT full_name INTO student_name FROM public.profiles WHERE id = NEW.student_id;
        SELECT title INTO course_name FROM public.courses WHERE id = NEW.course_id;
        
        -- Récupération de l'email
        SELECT email INTO student_email FROM auth.users WHERE id = NEW.student_id;

        IF student_email IS NOT NULL THEN
            PERFORM net.http_post(
                url := 'https://koeqenilctqgytjludlt.supabase.co/functions/v1/notification-service',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || (SELECT COALESCE(
                        (SELECT value FROM private.settings WHERE key = 'service_role_key'),
                        -- Fallback si settings n'existe pas, on espère que la vault ou une autre méthode est dispo
                        -- Sinon on utilisera la clé anon du projet (moins sécure mais fonctionnel pour le test)
                        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlubm9leHN6em9mZHV0ZHVkZWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDY2MDEsImV4cCI6MjA4NTY4MjYwMX0.cQzJzNn1QzY3uHp3rsBGnlZNgUl5pjSZyGwBJXzAgA4'
                    ))
                ),
                body := jsonb_build_object(
                    'type', 'ATTENDANCE_ABSENT',
                    'email', student_email,
                    'fullName', student_name,
                    'data', jsonb_build_object(
                        'courseTitle', course_name,
                        'date', NEW.date::text
                    )
                )
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Suppression si existant pour réinitialisation propre
DROP TRIGGER IF EXISTS on_attendance_absent ON public.attendance;

-- Création du trigger
CREATE TRIGGER on_attendance_absent
    AFTER INSERT OR UPDATE ON public.attendance
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_attendance_absent();
