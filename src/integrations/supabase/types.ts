export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          e_code: string
          role: "BH" | "ZH" | "CH" | "admin"
          location: string
          gender: "male" | "female" | "other"
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          e_code: string
          role: "BH" | "ZH" | "CH" | "admin"
          location: string
          gender: "male" | "female" | "other"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          e_code?: string
          role?: "BH" | "ZH" | "CH" | "admin"
          location?: string
          gender?: "male" | "female" | "other"
          created_at?: string
          updated_at?: string
        }
      }
      branches: {
        Row: {
          id: string
          name: string
          location: string
          category: "platinum" | "diamond" | "gold" | "silver" | "bronze"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          location: string
          category: "platinum" | "diamond" | "gold" | "silver" | "bronze"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string
          category?: "platinum" | "diamond" | "gold" | "silver" | "bronze"
          created_at?: string
          updated_at?: string
        }
      }
      branch_assignments: {
        Row: {
          id: string
          user_id: string
          branch_id: string
          assigned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          branch_id: string
          assigned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          branch_id?: string
          assigned_at?: string
        }
      }
      branch_visits: {
        Row: {
          id: string
          user_id: string
          branch_id: string
          visit_date: string
          branch_category: "platinum" | "diamond" | "gold" | "silver" | "bronze"
          hr_connect_session: boolean | null
          total_employees_invited: number | null
          total_participants: number | null
          manning_percentage: number | null
          attrition_percentage: number | null
          non_vendor_percentage: number | null
          er_percentage: number | null
          cwt_cases: number | null
          performance_level: string | null
          new_employees_total: number | null
          new_employees_covered: number | null
          star_employees_total: number | null
          star_employees_covered: number | null
          leaders_aligned_with_code: string | null
          employees_feel_safe: string | null
          employees_feel_motivated: string | null
          leaders_abusive_language: string | null
          employees_comfort_escalation: string | null
          inclusive_culture: string | null
          feedback: string | null
          status: "draft" | "submitted" | "approved" | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          branch_id: string
          visit_date: string
          branch_category: "platinum" | "diamond" | "gold" | "silver" | "bronze"
          hr_connect_session?: boolean | null
          total_employees_invited?: number | null
          total_participants?: number | null
          manning_percentage?: number | null
          attrition_percentage?: number | null
          non_vendor_percentage?: number | null
          er_percentage?: number | null
          cwt_cases?: number | null
          performance_level?: string | null
          new_employees_total?: number | null
          new_employees_covered?: number | null
          star_employees_total?: number | null
          star_employees_covered?: number | null
          leaders_aligned_with_code?: string | null
          employees_feel_safe?: string | null
          employees_feel_motivated?: string | null
          leaders_abusive_language?: string | null
          employees_comfort_escalation?: string | null
          inclusive_culture?: string | null
          feedback?: string | null
          status?: "draft" | "submitted" | "approved" | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          branch_id?: string
          visit_date?: string
          branch_category?: "platinum" | "diamond" | "gold" | "silver" | "bronze"
          hr_connect_session?: boolean | null
          total_employees_invited?: number | null
          total_participants?: number | null
          manning_percentage?: number | null
          attrition_percentage?: number | null
          non_vendor_percentage?: number | null
          er_percentage?: number | null
          cwt_cases?: number | null
          performance_level?: string | null
          new_employees_total?: number | null
          new_employees_covered?: number | null
          star_employees_total?: number | null
          star_employees_covered?: number | null
          leaders_aligned_with_code?: string | null
          employees_feel_safe?: string | null
          employees_feel_motivated?: string | null
          leaders_abusive_language?: string | null
          employees_comfort_escalation?: string | null
          inclusive_culture?: string | null
          feedback?: string | null
          status?: "draft" | "submitted" | "approved" | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
