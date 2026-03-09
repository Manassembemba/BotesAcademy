export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      comments: {
        Row: {
          content: string
          course_id: string
          created_at: string | null
          id: string
          rating: number | null
          user_id: string
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string | null
          id?: string
          rating?: number | null
          user_id: string
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string | null
          id?: string
          rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_sessions: {
        Row: {
          course_id: string
          created_at: string | null
          current_students: number | null
          end_date: string
          id: string
          is_active: boolean | null
          location: string
          max_students: number
          session_name: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          current_students?: number | null
          end_date: string
          id?: string
          is_active?: boolean | null
          location: string
          max_students: number
          session_name: string
          start_date: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          current_students?: number | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          location?: string
          max_students?: number
          session_name?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          admin_id: string | null
          category: string | null
          created_at: string | null
          description: string | null
          estimated_duration: string | null
          id: string
          is_paid: boolean | null
          is_special_session: boolean | null
          language: string | null
          level: Database["public"]["Enums"]["course_level"]
          location: string | null
          max_students: number | null
          mode: string | null
          price: number | null
          session_end_date: string | null
          session_start_date: string | null
          status: Database["public"]["Enums"]["course_status"]
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          admin_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          estimated_duration?: string | null
          id?: string
          is_paid?: boolean | null
          is_special_session?: boolean | null
          language?: string | null
          level?: Database["public"]["Enums"]["course_level"]
          location?: string | null
          max_students?: number | null
          mode?: string | null
          price?: number | null
          session_end_date?: string | null
          session_start_date?: string | null
          status?: Database["public"]["Enums"]["course_status"]
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          admin_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          estimated_duration?: string | null
          id?: string
          is_paid?: boolean | null
          is_special_session?: boolean | null
          language?: string | null
          level?: Database["public"]["Enums"]["course_level"]
          location?: string | null
          max_students?: number | null
          mode?: string | null
          price?: number | null
          session_end_date?: string | null
          session_start_date?: string | null
          status?: Database["public"]["Enums"]["course_status"]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      indicator_purchases: {
        Row: {
          created_at: string | null
          id: string
          indicator_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          indicator_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          indicator_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "indicator_purchases_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
        ]
      }
      indicators: {
        Row: {
          admin_id: string | null
          compatibility: string[] | null
          created_at: string | null
          description: string | null
          file_url: string | null
          id: string
          is_paid: boolean | null
          name: string
          price: number | null
          updated_at: string | null
        }
        Insert: {
          admin_id?: string | null
          compatibility?: string[] | null
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          is_paid?: boolean | null
          name: string
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          admin_id?: string | null
          compatibility?: string[] | null
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          is_paid?: boolean | null
          name?: string
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lesson_completions: {
        Row: {
          created_at: string | null
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_completions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          course_id: string | null
          created_at: string | null
          id: string
          lesson_type: Database["public"]["Enums"]["lesson_type"]
          order_index: number
          pdf_url: string | null
          title: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          lesson_type?: Database["public"]["Enums"]["lesson_type"]
          order_index?: number
          pdf_url?: string | null
          title: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          lesson_type?: Database["public"]["Enums"]["lesson_type"]
          order_index?: number
          pdf_url?: string | null
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_proofs: {
        Row: {
          admin_notes: string | null
          amount: number
          course_id: string
          created_at: string | null
          id: string
          payment_method: string
          proof_url: string
          status: string | null
          transaction_reference: string | null
          user_id: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          course_id: string
          created_at?: string | null
          id?: string
          payment_method: string
          proof_url: string
          status?: string | null
          transaction_reference?: string | null
          user_id: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          course_id?: string
          created_at?: string | null
          id?: string
          payment_method?: string
          proof_url?: string
          status?: string | null
          transaction_reference?: string | null
          user_id?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          created_at: string | null
          id: string
          payment_method: string | null
          purchase_id: string
          status: string | null
          transaction_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          payment_method?: string | null
          purchase_id: string
          status?: string | null
          transaction_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          payment_method?: string | null
          purchase_id?: string
          status?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name: string
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number
          course_id: string
          created_at: string | null
          id: string
          payment_proof_id: string | null
          payment_status: string | null
          session_id: string | null
          user_id: string
          validated_at: string | null
          validated_by: string | null
          validation_status: string | null
        }
        Insert: {
          amount: number
          course_id: string
          created_at?: string | null
          id?: string
          payment_proof_id?: string | null
          payment_status?: string | null
          session_id?: string | null
          user_id: string
          validated_at?: string | null
          validated_by?: string | null
          validation_status?: string | null
        }
        Update: {
          amount?: number
          course_id?: string
          created_at?: string | null
          id?: string
          payment_proof_id?: string | null
          payment_status?: string | null
          session_id?: string | null
          user_id?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_payment_proof_id_fkey"
            columns: ["payment_proof_id"]
            isOneToOne: false
            referencedRelation: "payment_proofs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      strategies: {
        Row: {
          admin_id: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string
          is_paid: boolean | null
          price: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          admin_id?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_paid?: boolean | null
          price?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          admin_id?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_paid?: boolean | null
          price?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      strategy_purchases: {
        Row: {
          created_at: string | null
          id: string
          strategy_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          strategy_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          strategy_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_purchases_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_enrolled_courses_with_progress: {
        Args: never
        Returns: {
          course_category: string
          course_id: string
          course_title: string
          estimated_duration: string
          progress: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_session_students: {
        Args: { session_id: string }
        Returns: undefined
      }
      reject_payment: {
        Args: { admin_notes_text: string; proof_id: string }
        Returns: Json
      }
      validate_payment: {
        Args: { admin_notes_text?: string; proof_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "student"
      course_level: "beginner" | "intermediate" | "expert"
      course_status: "draft" | "published"
      lesson_type: "video" | "pdf" | "quiz"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "student"],
      course_level: ["beginner", "intermediate", "expert"],
      course_status: ["draft", "published"],
      lesson_type: ["video", "pdf", "quiz"],
    },
  },
} as const
