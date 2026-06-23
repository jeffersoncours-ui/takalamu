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
      audio_assets: {
        Row: {
          created_at: string
          id: string
          lesson_id: string | null
          storage_path: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id?: string | null
          storage_path: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string | null
          storage_path?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_assets_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      book_enrollments: {
        Row: {
          book_id: string
          created_at: string
          enrolled_at: string
          id: string
          payment_id: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          book_id: string
          created_at?: string
          enrolled_at?: string
          id?: string
          payment_id?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          book_id?: string
          created_at?: string
          enrolled_at?: string
          id?: string
          payment_id?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "be_payment_fk"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_enrollments_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      book_sessions: {
        Row: {
          book_id: string
          created_at: string
          id: string
          scheduled_at: string
          session_number: number
          updated_at: string
          zoom_link: string | null
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          scheduled_at: string
          session_number: number
          updated_at?: string
          zoom_link?: string | null
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          scheduled_at?: string
          session_number?: number
          updated_at?: string
          zoom_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_sessions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          created_at: string
          id: string
          linked_book_session_id: string | null
          prep_notes: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["booking_status"]
          student_id: string
          teacher_id: string
          type: Database["public"]["Enums"]["booking_type"]
          updated_at: string
          zoom_link: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          linked_book_session_id?: string | null
          prep_notes?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["booking_status"]
          student_id: string
          teacher_id: string
          type: Database["public"]["Enums"]["booking_type"]
          updated_at?: string
          zoom_link?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          linked_book_session_id?: string | null
          prep_notes?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["booking_status"]
          student_id?: string
          teacher_id?: string
          type?: Database["public"]["Enums"]["booking_type"]
          updated_at?: string
          zoom_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_linked_book_session_id_fkey"
            columns: ["linked_book_session_id"]
            isOneToOne: false
            referencedRelation: "book_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          created_at: string
          description: string | null
          id: string
          price: number | null
          quiz_id: string | null
          shared_notes: string | null
          teacher_id: string | null
          title: string
          total_sessions: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          price?: number | null
          quiz_id?: string | null
          shared_notes?: string | null
          teacher_id?: string | null
          title: string
          total_sessions?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          price?: number | null
          quiz_id?: string | null
          shared_notes?: string | null
          teacher_id?: string | null
          title?: string
          total_sessions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "books_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
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
          created_at: string
          id: string
          lesson_id: string | null
          public_recap: string | null
          session_date: string
          student_id: string
          support_files: Json
          teacher_id: string
          updated_at: string
        }
        Insert: {
          attendance: Database["public"]["Enums"]["attendance_status"]
          created_at?: string
          id?: string
          lesson_id?: string | null
          public_recap?: string | null
          session_date: string
          student_id: string
          support_files?: Json
          teacher_id: string
          updated_at?: string
        }
        Update: {
          attendance?: Database["public"]["Enums"]["attendance_status"]
          created_at?: string
          id?: string
          lesson_id?: string | null
          public_recap?: string | null
          session_date?: string
          student_id?: string
          support_files?: Json
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_records_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
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
      lessons: {
        Row: {
          audio_asset_id: string | null
          created_at: string
          grammar_point: string | null
          homework_template: string | null
          id: string
          objective: string | null
          order_index: number
          phase: Database["public"]["Enums"]["lesson_phase"]
          quiz_id: string | null
          reading_support: string | null
          title: string
          updated_at: string
        }
        Insert: {
          audio_asset_id?: string | null
          created_at?: string
          grammar_point?: string | null
          homework_template?: string | null
          id?: string
          objective?: string | null
          order_index?: number
          phase: Database["public"]["Enums"]["lesson_phase"]
          quiz_id?: string | null
          reading_support?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          audio_asset_id?: string | null
          created_at?: string
          grammar_point?: string | null
          homework_template?: string | null
          id?: string
          objective?: string | null
          order_index?: number
          phase?: Database["public"]["Enums"]["lesson_phase"]
          quiz_id?: string | null
          reading_support?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_audio_asset_fk"
            columns: ["audio_asset_id"]
            isOneToOne: false
            referencedRelation: "audio_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_quiz_fk"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
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
      milestone_video_assignments: {
        Row: {
          assigned_at: string
          created_at: string
          id: string
          student_id: string
          updated_at: string
          video_id: string
        }
        Insert: {
          assigned_at?: string
          created_at?: string
          id?: string
          student_id: string
          updated_at?: string
          video_id: string
        }
        Update: {
          assigned_at?: string
          created_at?: string
          id?: string
          student_id?: string
          updated_at?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_video_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_video_assignments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
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
      payments: {
        Row: {
          created_at: string
          id: string
          period: string | null
          plan: Database["public"]["Enums"]["payment_plan"] | null
          product: Database["public"]["Enums"]["payment_product"]
          revolut_reference: string | null
          status: Database["public"]["Enums"]["payment_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          period?: string | null
          plan?: Database["public"]["Enums"]["payment_plan"] | null
          product: Database["public"]["Enums"]["payment_product"]
          revolut_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          period?: string | null
          plan?: Database["public"]["Enums"]["payment_plan"] | null
          product?: Database["public"]["Enums"]["payment_product"]
          revolut_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
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
          book_id: string | null
          created_at: string
          id: string
          scope: Database["public"]["Enums"]["quiz_scope"]
          source_type: Database["public"]["Enums"]["quiz_source"]
          title: string | null
          updated_at: string
        }
        Insert: {
          book_id?: string | null
          created_at?: string
          id?: string
          scope: Database["public"]["Enums"]["quiz_scope"]
          source_type: Database["public"]["Enums"]["quiz_source"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          book_id?: string | null
          created_at?: string
          id?: string
          scope?: Database["public"]["Enums"]["quiz_scope"]
          source_type?: Database["public"]["Enums"]["quiz_source"]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_book_fk"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
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
      student_progress: {
        Row: {
          created_at: string
          current_lesson_id: string | null
          id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_lesson_id?: string | null
          id?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_lesson_id?: string | null
          id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_current_lesson_id_fkey"
            columns: ["current_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          onboarding_completed: boolean
          profile_id: string
          status: Database["public"]["Enums"]["student_status"]
          teacher_id: string | null
          unjustified_absences_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          onboarding_completed?: boolean
          profile_id: string
          status?: Database["public"]["Enums"]["student_status"]
          teacher_id?: string | null
          unjustified_absences_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          onboarding_completed?: boolean
          profile_id?: string
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
      teacher_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          start_time: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          start_time: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          start_time?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_availability_teacher_id_fkey"
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
      video_views: {
        Row: {
          created_at: string
          id: string
          student_id: string
          updated_at: string
          video_id: string
          viewed_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          student_id: string
          updated_at?: string
          video_id: string
          viewed_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          student_id?: string
          updated_at?: string
          video_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_views_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_views_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          bunny_video_id: string | null
          created_at: string
          id: string
          teacher_id: string | null
          title: string | null
          type: Database["public"]["Enums"]["video_type"]
          updated_at: string
        }
        Insert: {
          bunny_video_id?: string | null
          created_at?: string
          id?: string
          teacher_id?: string | null
          title?: string | null
          type: Database["public"]["Enums"]["video_type"]
          updated_at?: string
        }
        Update: {
          bunny_video_id?: string | null
          created_at?: string
          id?: string
          teacher_id?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["video_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
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
      cancel_payment: {
        Args: { p_payment_id: string }
        Returns: undefined
      }
      confirm_payment: {
        Args: { p_payment_id: string }
        Returns: undefined
      }
      get_teacher_booked_slots: {
        Args: { p_from?: string; p_teacher_id: string }
        Returns: {
          scheduled_at: string
          status: string
        }[]
      }
      insert_notification: {
        Args: {
          p_user_id: string
          p_type: Database["public"]["Enums"]["notification_type"]
          p_payload: Json
        }
        Returns: undefined
      }
      submit_session_record: {
        Args: {
          p_advance_progress?: boolean
          p_attendance: Database["public"]["Enums"]["attendance_status"]
          p_grammar?: Json
          p_homework_instructions?: string
          p_lesson_id?: string
          p_private_note?: string
          p_public_recap?: string
          p_session_date: string
          p_student_id: string
          p_vocab?: Json
          p_support_files?: Json
        }
        Returns: string
      }
    }
    Enums: {
      attendance_status:
        | "present"
        | "absent_justified"
        | "absent_unjustified"
        | "late"
      booking_status: "booked" | "completed" | "cancelled" | "moved"
      booking_type: "individual" | "group"
      gender_type: "m" | "f"
      homework_status: "a_rendre" | "rendu" | "corrige" | "vu"
      lesson_phase: "dechiffrage" | "lecture_oral" | "grammaire"
      notification_type:
        | "new_message"
        | "homework_due"
        | "eval_due"
        | "video_assigned"
        | "homework_corrected"
        | "payment_requested"
        | "payment_confirmed"
      payment_plan: "1x" | "2x" | "3x" | "12x" | "single"
      payment_product: "individual_sub" | "book"
      payment_status: "pending" | "paid" | "failed" | "cancelled"
      quiz_scope: "individual" | "group"
      quiz_source: "glossary" | "book"
      student_status: "active" | "suspended_payment" | "suspended_absences"
      user_role: "admin" | "teacher" | "student"
      video_type: "welcome" | "milestone"
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
      booking_status: ["booked", "completed", "cancelled", "moved"],
      booking_type: ["individual", "group"],
      gender_type: ["m", "f"],
      homework_status: ["a_rendre", "rendu", "corrige", "vu"],
      lesson_phase: ["dechiffrage", "lecture_oral", "grammaire"],
      notification_type: [
        "new_message",
        "homework_due",
        "eval_due",
        "video_assigned",
      ],
      payment_plan: ["1x", "2x", "3x", "12x", "single"],
      payment_product: ["individual_sub", "book"],
      payment_status: ["pending", "paid", "failed", "cancelled"],
      quiz_scope: ["individual", "group"],
      quiz_source: ["glossary", "book"],
      student_status: ["active", "suspended_payment", "suspended_absences"],
      user_role: ["admin", "teacher", "student"],
      video_type: ["welcome", "milestone"],
    },
  },
} as const
