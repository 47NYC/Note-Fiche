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
      achievements: {
        Row: {
          id: string
          key: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          id?: string
          key: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          id?: string
          key?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      class_members: {
        Row: {
          class_id: string
          id: string
          joined_at: string
          student_id: string
        }
        Insert: {
          class_id: string
          id?: string
          joined_at?: string
          student_id: string
        }
        Update: {
          class_id?: string
          id?: string
          joined_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_members_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          id: string
          invite_code: string
          name: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code?: string
          name: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string
          name?: string
          teacher_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          class_id: string
          created_at: string
          file_path: string | null
          folder: string
          google_doc_url: string | null
          id: string
          is_brevet_blanc: boolean
          teacher_id: string
          title: string
        }
        Insert: {
          class_id: string
          created_at?: string
          file_path?: string | null
          folder?: string
          google_doc_url?: string | null
          id?: string
          is_brevet_blanc?: boolean
          teacher_id: string
          title: string
        }
        Update: {
          class_id?: string
          created_at?: string
          file_path?: string | null
          folder?: string
          google_doc_url?: string | null
          id?: string
          is_brevet_blanc?: boolean
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          class_id: string | null
          color: string | null
          created_at: string
          description: string | null
          eval_date: string
          id: string
          subject: string
          title: string
          user_id: string
        }
        Insert: {
          class_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          eval_date: string
          id?: string
          subject?: string
          title: string
          user_id: string
        }
        Update: {
          class_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          eval_date?: string
          id?: string
          subject?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          back: string
          card_type: string
          created_at: string | null
          ease_factor: number | null
          front: string
          id: string
          interval_days: number | null
          next_review: string | null
          repetitions: number | null
          structured_document_id: string | null
          subject: string
          user_id: string
        }
        Insert: {
          back: string
          card_type?: string
          created_at?: string | null
          ease_factor?: number | null
          front: string
          id?: string
          interval_days?: number | null
          next_review?: string | null
          repetitions?: number | null
          structured_document_id?: string | null
          subject?: string
          user_id: string
        }
        Update: {
          back?: string
          card_type?: string
          created_at?: string | null
          ease_factor?: number | null
          front?: string
          id?: string
          interval_days?: number | null
          next_review?: string | null
          repetitions?: number | null
          structured_document_id?: string | null
          subject?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_structured_document_id_fkey"
            columns: ["structured_document_id"]
            isOneToOne: false
            referencedRelation: "structured_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          current_progress: number
          daily_target_cards: number
          id: string
          skill: string
          subject: string
          user_id: string
          weekly_target_minutes: number
        }
        Insert: {
          created_at?: string
          current_progress?: number
          daily_target_cards?: number
          id?: string
          skill?: string
          subject: string
          user_id: string
          weekly_target_minutes?: number
        }
        Update: {
          created_at?: string
          current_progress?: number
          daily_target_cards?: number
          id?: string
          skill?: string
          subject?: string
          user_id?: string
          weekly_target_minutes?: number
        }
        Relationships: []
      }
      practice_sessions: {
        Row: {
          cards_reviewed: number
          correct_count: number
          ended_at: string | null
          id: string
          points_earned: number
          score: number
          started_at: string
          subject: string
          user_id: string
        }
        Insert: {
          cards_reviewed?: number
          correct_count?: number
          ended_at?: string | null
          id?: string
          points_earned?: number
          score?: number
          started_at?: string
          subject?: string
          user_id: string
        }
        Update: {
          cards_reviewed?: number
          correct_count?: number
          ended_at?: string | null
          id?: string
          points_earned?: number
          score?: number
          started_at?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      streaks: {
        Row: {
          current_streak: number
          id: string
          last_active_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          id?: string
          last_active_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          id?: string
          last_active_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      structured_documents: {
        Row: {
          content: Json
          created_at: string
          document_id: string
          id: string
          subject: string
          title: string
        }
        Insert: {
          content?: Json
          created_at?: string
          document_id: string
          id?: string
          subject?: string
          title: string
        }
        Update: {
          content?: Json
          created_at?: string
          document_id?: string
          id?: string
          subject?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "structured_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      student_doc_progress: {
        Row: {
          completed_chapters: number[] | null
          id: string
          qcm_scores: Json | null
          structured_document_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_chapters?: number[] | null
          id?: string
          qcm_scores?: Json | null
          structured_document_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_chapters?: number[] | null
          id?: string
          qcm_scores?: Json | null
          structured_document_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_doc_progress_structured_document_id_fkey"
            columns: ["structured_document_id"]
            isOneToOne: false
            referencedRelation: "structured_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          difficulty: string
          id: string
          notifications_enabled: boolean
          preferred_exercise_types: string[] | null
          study_end_hour: number
          study_start_hour: number
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          difficulty?: string
          id?: string
          notifications_enabled?: boolean
          preferred_exercise_types?: string[] | null
          study_end_hour?: number
          study_start_hour?: number
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          difficulty?: string
          id?: string
          notifications_enabled?: boolean
          preferred_exercise_types?: string[] | null
          study_end_hour?: number
          study_start_hour?: number
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      find_class_by_invite_code: { Args: { _code: string }; Returns: string }
      get_student_class_ids: { Args: { _user_id: string }; Returns: string[] }
      get_teacher_class_ids: { Args: { _user_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_class_member: {
        Args: { _class_id: string; _user_id: string }
        Returns: boolean
      }
      is_class_teacher: {
        Args: { _class_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "teacher"
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
      app_role: ["student", "teacher"],
    },
  },
} as const
