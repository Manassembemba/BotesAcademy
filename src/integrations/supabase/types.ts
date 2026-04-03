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
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      attendance: {
        Row: {
          course_id: string
          created_at: string | null
          date: string
          group_id: string | null
          id: string
          notes: string | null
          session_id: string | null
          status: string | null
          student_id: string
          vacation_id: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          date?: string
          group_id?: string | null
          id?: string
          notes?: string | null
          session_id?: string | null
          status?: string | null
          student_id: string
          vacation_id?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          date?: string
          group_id?: string | null
          id?: string
          notes?: string | null
          session_id?: string | null
          status?: string | null
          student_id?: string
          vacation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "course_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_management_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "attendance_vacation_id_fkey"
            columns: ["vacation_id"]
            isOneToOne: false
            referencedRelation: "course_vacations"
            referencedColumns: ["id"]
          },
        ]
      }
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
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_management_view"
            referencedColumns: ["student_id"]
          },
        ]
      }
      course_applications: {
        Row: {
          admin_notes: string | null
          course_id: string
          created_at: string
          full_name: string
          id: string
          motivation: string | null
          phone: string
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          course_id: string
          created_at?: string
          full_name: string
          id?: string
          motivation?: string | null
          phone: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          course_id?: string
          created_at?: string
          full_name?: string
          id?: string
          motivation?: string | null
          phone?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_applications_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      course_groups: {
        Row: {
          capacity: number | null
          course_id: string
          created_at: string | null
          id: string
          name: string
          session_id: string
          vacation_id: string
        }
        Insert: {
          capacity?: number | null
          course_id: string
          created_at?: string | null
          id?: string
          name: string
          session_id: string
          vacation_id: string
        }
        Update: {
          capacity?: number | null
          course_id?: string
          created_at?: string | null
          id?: string
          name?: string
          session_id?: string
          vacation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_groups_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_groups_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_groups_vacation_id_fkey"
            columns: ["vacation_id"]
            isOneToOne: false
            referencedRelation: "course_vacations"
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
      course_vacations: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          name: string
          time_range: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          name: string
          time_range?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          name?: string
          time_range?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_vacations_course_id_fkey"
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
          delivered_file_url: string | null
          expires_at: string | null
          id: string
          indicator_id: string
          mt5_id: string | null
          payment_proof_id: string | null
          subscription_duration: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          delivered_file_url?: string | null
          expires_at?: string | null
          id?: string
          indicator_id: string
          mt5_id?: string | null
          payment_proof_id?: string | null
          subscription_duration?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          delivered_file_url?: string | null
          expires_at?: string | null
          id?: string
          indicator_id?: string
          mt5_id?: string | null
          payment_proof_id?: string | null
          subscription_duration?: string | null
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
          {
            foreignKeyName: "indicator_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicator_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_management_view"
            referencedColumns: ["student_id"]
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
          image_url: string | null
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
          image_url?: string | null
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
          image_url?: string | null
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
          {
            foreignKeyName: "lesson_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_management_view"
            referencedColumns: ["student_id"]
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
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read_at?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      payment_proofs: {
        Row: {
          admin_notes: string | null
          amount: number
          course_id: string | null
          created_at: string | null
          id: string
          indicator_id: string | null
          mt5_id: string | null
          payment_method: string
          proof_url: string | null
          session_id: string | null
          status: string | null
          strategy_id: string | null
          subscription_duration: string | null
          transaction_reference: string | null
          user_id: string
          vacation_id: string | null
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          course_id?: string | null
          created_at?: string | null
          id?: string
          indicator_id?: string | null
          mt5_id?: string | null
          payment_method: string
          proof_url?: string | null
          session_id?: string | null
          status?: string | null
          strategy_id?: string | null
          subscription_duration?: string | null
          transaction_reference?: string | null
          user_id: string
          vacation_id?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          course_id?: string | null
          created_at?: string | null
          id?: string
          indicator_id?: string | null
          mt5_id?: string | null
          payment_method?: string
          proof_url?: string | null
          session_id?: string | null
          status?: string | null
          strategy_id?: string | null
          subscription_duration?: string | null
          transaction_reference?: string | null
          user_id?: string
          vacation_id?: string | null
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
          {
            foreignKeyName: "payment_proofs_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_proofs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_proofs_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_proofs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_proofs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_management_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "payment_proofs_vacation_id_fkey"
            columns: ["vacation_id"]
            isOneToOne: false
            referencedRelation: "course_vacations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_proofs_validated_by_profiles_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_proofs_validated_by_profiles_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "student_management_view"
            referencedColumns: ["student_id"]
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
          banned_until: string | null
          created_at: string | null
          full_name: string
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          banned_until?: string | null
          created_at?: string | null
          full_name: string
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          banned_until?: string | null
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
          due_date: string | null
          group_id: string | null
          id: string
          paid_amount: number | null
          payment_proof_id: string | null
          payment_status: string | null
          session_id: string | null
          total_amount: number | null
          user_id: string
          vacation_id: string | null
          validated_at: string | null
          validated_by: string | null
          validation_status: string | null
        }
        Insert: {
          amount: number
          course_id: string
          created_at?: string | null
          due_date?: string | null
          group_id?: string | null
          id?: string
          paid_amount?: number | null
          payment_proof_id?: string | null
          payment_status?: string | null
          session_id?: string | null
          total_amount?: number | null
          user_id: string
          vacation_id?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_status?: string | null
        }
        Update: {
          amount?: number
          course_id?: string
          created_at?: string | null
          due_date?: string | null
          group_id?: string | null
          id?: string
          paid_amount?: number | null
          payment_proof_id?: string | null
          payment_status?: string | null
          session_id?: string | null
          total_amount?: number | null
          user_id?: string
          vacation_id?: string | null
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
            foreignKeyName: "purchases_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "course_groups"
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
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_management_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "purchases_vacation_id_fkey"
            columns: ["vacation_id"]
            isOneToOne: false
            referencedRelation: "course_vacations"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      strategies: {
        Row: {
          admin_id: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
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
          image_url?: string | null
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
          image_url?: string | null
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
          payment_proof_id: string | null
          strategy_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          payment_proof_id?: string | null
          strategy_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          payment_proof_id?: string | null
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
          {
            foreignKeyName: "strategy_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_management_view"
            referencedColumns: ["student_id"]
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
      student_management_view: {
        Row: {
          avatar_url: string | null
          banned_until: string | null
          course_purchase_ids: string[] | null
          course_titles: string[] | null
          email: string | null
          enrolled_courses_count: number | null
          full_name: string | null
          last_enrollment_date: string | null
          purchased_indicators_count: number | null
          purchased_strategies_count: number | null
          student_id: string | null
          total_spent: number | null
          vacation_names: string[] | null
        }
        Relationships: []
      }
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
          vacation_name: string
          vacation_time: string
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
      mark_all_notifications_read: {
        Args: { p_user_id: string }
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
      app_role: "admin" | "student" | "receptionist"
      application_status: "pending" | "accepted" | "rejected" | "cancelled"
      course_level: "beginner" | "intermediate" | "expert"
      course_status: "draft" | "published"
      lesson_type: "video" | "pdf" | "quiz"
      notification_type:
        | "info"
        | "success"
        | "warning"
        | "error"
        | "course"
        | "payment"
        | "comment"
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
      application_status: ["pending", "accepted", "rejected", "cancelled"],
      course_level: ["beginner", "intermediate", "expert"],
      course_status: ["draft", "published"],
      lesson_type: ["video", "pdf", "quiz"],
      notification_type: [
        "info",
        "success",
        "warning",
        "error",
        "course",
        "payment",
        "comment",
      ],
    },
  },
} as const

