-- Migration: Course Application Notifications
-- Date: 2026-03-13
-- Author: Gemini CLI

CREATE OR REPLACE FUNCTION public.notify_on_course_application_status_change()
RETURNS TRIGGER AS $$
DECLARE
    course_title TEXT;
BEGIN
    -- Récupérer le titre du cours
    SELECT title INTO course_title FROM public.courses WHERE id = NEW.course_id;

    IF (OLD.status != NEW.status) THEN
        IF (NEW.status = 'accepted') THEN
            INSERT INTO public.notifications (user_id, title, message, type, link)
            VALUES (
                NEW.user_id,
                'Candidature Acceptée ! 🎉',
                'Bonne nouvelle ! Votre candidature pour la formation "' || course_title || '" a été acceptée. Vous pouvez maintenant procéder au paiement.',
                'success',
                '/formations/' || NEW.course_id
            );
        ELSIF (NEW.status = 'rejected') THEN
            INSERT INTO public.notifications (user_id, title, message, type, link)
            VALUES (
                NEW.user_id,
                'Mise à jour de votre candidature',
                'Votre candidature pour la formation "' || course_title || '" a été refusée. Consultez les détails pour plus d''informations.',
                'error',
                '/formations/' || NEW.course_id
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_course_application_status_change_notify
    AFTER UPDATE ON public.course_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_on_course_application_status_change();
