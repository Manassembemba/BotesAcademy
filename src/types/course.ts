export type CourseMode = 'online' | 'presentiel' | 'hybrid';

export interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  price: number | null;
  is_paid: boolean | null;
  image_url: string | null;
  mode: CourseMode;
  level: string | null;
  learning_objectives: string[] | null;
  prerequisites: string[] | null;
  target_audience: string[] | null;
  duration: string | null;
  instructor_id: string | null;
  full_price?: number | null;
  promo_end_date?: string | null;
  brochure_url?: string | null;
  created_at: string;
}

export interface CourseVacation {
  id: string;
  course_id: string;
  name: string;
  time_range: string;
  created_at: string;
}

export interface CourseSession {
  id: string;
  course_id: string;
  session_name: string;
  start_date: string;
  end_date: string;
  location: string;
  max_students: number;
  current_students: number;
  is_active: boolean;
  created_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  pdf_url: string | null;
  order_index: number;
  lesson_type: 'video' | 'pdf' | 'quiz';
  module_name?: string | null;
  created_at: string;
}
