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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      conversations: {
        Row: {
          created_at: string
          id: string
          student_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          student_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          student_id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      course_books: {
        Row: {
          cover_url: string | null
          created_at: string
          id: string
          kind: string
          order_index: number
          subtitle: string | null
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          id?: string
          kind?: string
          order_index?: number
          subtitle?: string | null
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          id?: string
          kind?: string
          order_index?: number
          subtitle?: string | null
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_books_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      formulations: {
        Row: {
          arabic_text: string
          audio_path: string | null
          created_at: string
          french_text: string
          id: string
          lesson_record_id: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          arabic_text: string
          audio_path?: string | null
          created_at?: string
          french_text: string
          id?: string
          lesson_record_id?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          arabic_text?: string
          audio_path?: string | null
          created_at?: string
          french_text?: string
          id?: string
          lesson_record_id?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "formulations_lesson_record_id_fkey"
            columns: ["lesson_record_id"]
            isOneToOne: false
            referencedRelation: "lesson_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formulations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      grammar_rules: {
        Row: {
          content: string
          created_at: string
          id: string
          lesson_record_id: string | null
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lesson_record_id?: string | null
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lesson_record_id?: string | null
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grammar_rules_lesson_record_id_fkey"
            columns: ["lesson_record_id"]
            isOneToOne: false
            referencedRelation: "lesson_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grammar_rules_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          assigned_at: string
          corrected_at: string | null
          correction_file: string | null
          created_at: string
          feedback: string | null
          grade: string | null
          id: string
          instructions: string | null
          lesson_record_id: string | null
          seen_at: string | null
          status: Database["public"]["Enums"]["homework_status"]
          student_id: string
          submission_file: string | null
          submission_files: Json
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          corrected_at?: string | null
          correction_file?: string | null
          created_at?: string
          feedback?: string | null
          grade?: string | null
          id?: string
          instructions?: string | null
          lesson_record_id?: string | null
          seen_at?: string | null
          status?: Database["public"]["Enums"]["homework_status"]
          student_id: string
          submission_file?: string | null
          submission_files?: Json
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          corrected_at?: string | null
          correction_file?: string | null
          created_at?: string
          feedback?: string | null
          grade?: string | null
          id?: string
          instructions?: string | null
          lesson_record_id?: string | null
          seen_at?: string | null
          status?: Database["public"]["Enums"]["homework_status"]
          student_id?: string
          submission_file?: string | null
          submission_files?: Json
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_lesson_record_id_fkey"
            columns: ["lesson_record_id"]
            isOneToOne: false
            referencedRelation: "lesson_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_records: {
        Row: {
          attendance: Database["public"]["Enums"]["attendance_status"]
          book_id: string | null
          course_group_id: string
          created_at: string
          custom_title: string | null
          id: string
          public_recap: string | null
          session_date: string
          student_id: string
          support_files: Json
          teacher_id: string
          updated_at: string
        }
        Insert: {
          attendance: Database["public"]["Enums"]["attendance_status"]
          book_id?: string | null
          course_group_id?: string
          created_at?: string
          custom_title?: string | null
          id?: string
          public_recap?: string | null
          session_date: string
          student_id: string
          support_files?: Json
          teacher_id: string
          updated_at?: string
        }
        Update: {
          attendance?: Database["public"]["Enums"]["attendance_status"]
          book_id?: string | null
          course_group_id?: string
          created_at?: string
          custom_title?: string | null
          id?: string
          public_recap?: string | null
          session_date?: string
          student_id?: string
          support_files?: Json
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_records_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "course_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_records_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
          sent_at: string
          updated_at: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
          sent_at?: string
          updated_at?: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
          sent_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          payload: Json
          read: boolean
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          read?: boolean
          type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          read?: boolean
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json
          created_at: string
          id: string
          quiz_id: string
          score: number | null
          student_id: string
          taken_at: string
          updated_at: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          id?: string
          quiz_id: string
          score?: number | null
          student_id: string
          taken_at?: string
          updated_at?: string
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          quiz_id?: string
          score?: number | null
          student_id?: string
          taken_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string
          distractors: string[]
          id: string
          prompt: string
          quiz_id: string
          updated_at: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          distractors?: string[]
          id?: string
          prompt: string
          quiz_id: string
          updated_at?: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          distractors?: string[]
          id?: string
          prompt?: string
          quiz_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          id: string
          scope: Database["public"]["Enums"]["quiz_scope"]
          source_type: Database["public"]["Enums"]["quiz_source"]
          teacher_id: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          scope: Database["public"]["Enums"]["quiz_scope"]
          source_type: Database["public"]["Enums"]["quiz_source"]
          teacher_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          scope?: Database["public"]["Enums"]["quiz_scope"]
          source_type?: Database["public"]["Enums"]["quiz_source"]
          teacher_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      session_private_notes: {
        Row: {
          content: string | null
          created_at: string
          id: string
          lesson_record_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          lesson_record_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          lesson_record_id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_private_notes_lesson_record_id_fkey"
            columns: ["lesson_record_id"]
            isOneToOne: false
            referencedRelation: "lesson_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_private_notes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profile_notes: {
        Row: {
          content: string | null
          created_at: string
          id: string
          student_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          student_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          student_id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_profile_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profile_notes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          birth_date: string | null
          created_at: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          profile_id: string
          school_background: string | null
          status: Database["public"]["Enums"]["student_status"]
          teacher_id: string | null
          unjustified_absences_count: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          profile_id: string
          school_background?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          teacher_id?: string | null
          unjustified_absences_count?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          profile_id?: string
          school_background?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          teacher_id?: string | null
          unjustified_absences_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary: {
        Row: {
          arabic_word: string
          created_at: string
          french_definition: string
          id: string
          lesson_record_id: string | null
          root: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          arabic_word: string
          created_at?: string
          french_definition: string
          id?: string
          lesson_record_id?: string | null
          root?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          arabic_word?: string
          created_at?: string
          french_definition?: string
          id?: string
          lesson_record_id?: string | null
          root?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_lesson_record_id_fkey"
            columns: ["lesson_record_id"]
            isOneToOne: false
            referencedRelation: "lesson_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocabulary_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_session_record: {
        Args: { p_record_id: string }
        Returns: undefined
      }
      generate_formulation_quiz: {
        Args: {
          p_allow_audio_choices?: boolean
          p_lesson_record_id?: string
          p_size?: number
          p_student_id: string
        }
        Returns: Json
      }
      generate_individual_quiz: {
        Args: {
          p_lesson_record_id?: string
          p_size?: number
          p_student_id: string
        }
        Returns: Json
      }
      get_grammar_quiz_questions: { Args: { p_quiz_id: string }; Returns: Json }
      insert_notification: {
        Args: { p_payload: Json; p_type: string; p_user_id: string }
        Returns: undefined
      }
      submit_formulation_quiz: {
        Args: { p_answers: Json; p_student_id: string }
        Returns: Json
      }
      submit_grammar_quiz: {
        Args: { p_answers: Json; p_quiz_id: string; p_student_id: string }
        Returns: Json
      }
      submit_homework:
        | { Args: { p_files: Json; p_homework_id: string }; Returns: undefined }
        | {
            Args: { p_homework_id: string; p_submission_file: string }
            Returns: undefined
          }
      submit_individual_quiz: {
        Args: { p_answers: Json; p_student_id: string }
        Returns: Json
      }
      submit_session_record: {
        Args: {
          p_attendance?: Database["public"]["Enums"]["attendance_status"]
          p_course_group_id?: string
          p_custom_title?: string
          p_formulations?: Json
          p_grammar?: Json
          p_homework_instructions?: string
          p_private_note?: string
          p_public_recap?: string
          p_session_date: string
          p_student_id: string
          p_support_files?: Json
          p_vocab?: Json
        }
        Returns: string
      }
      update_own_student_info: {
        Args: {
          p_address?: string
          p_birth_date?: string
          p_full_name: string
          p_gender: Database["public"]["Enums"]["gender_type"]
          p_school_background?: string
        }
        Returns: undefined
      }
      update_session_record: {
        Args: {
          p_attendance?: Database["public"]["Enums"]["attendance_status"]
          p_custom_title?: string
          p_formulations?: Json
          p_grammar?: Json
          p_homework_instructions?: string
          p_private_note?: string
          p_public_recap?: string
          p_record_id: string
          p_session_date: string
          p_support_files?: Json
          p_vocab?: Json
        }
        Returns: undefined
      }
    }
    Enums: {
      attendance_status:
        | "present"
        | "absent_justified"
        | "absent_unjustified"
        | "late"
      gender_type: "m" | "f"
      homework_status: "a_rendre" | "rendu" | "corrige" | "vu"
      notification_type:
        | "new_message"
        | "homework_due"
        | "eval_due"
        | "homework_corrected"
        | "homework_submitted"
        | "trial_request"
        | "session_reminder"
      quiz_scope: "individual"
      quiz_source: "glossary" | "grammar" | "formulation"
      student_status: "active" | "suspended_absences"
      trial_status:
        | "pending"
        | "contacted"
        | "completed"
        | "converted"
        | "declined"
      user_role: "admin" | "teacher" | "student"
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
      attendance_status: [
        "present",
        "absent_justified",
        "absent_unjustified",
        "late",
      ],
      gender_type: ["m", "f"],
      homework_status: ["a_rendre", "rendu", "corrige", "vu"],
      notification_type: [
        "new_message",
        "homework_due",
        "eval_due",
        "homework_corrected",
        "homework_submitted",
        "trial_request",
        "session_reminder",
      ],
      quiz_scope: ["individual"],
      quiz_source: ["glossary", "grammar", "formulation"],
      student_status: ["active", "suspended_absences"],
      trial_status: [
        "pending",
        "contacted",
        "completed",
        "converted",
        "declined",
      ],
      user_role: ["admin", "teacher", "student"],
    },
  },
} as const
