export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          client_address: string | null
          client_email: string | null
          client_name: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          client_address?: string | null
          client_email?: string | null
          client_name: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          client_address?: string | null
          client_email?: string | null
          client_name?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      estimate_products: {
        Row: {
          discount: number | null
          estimate_id: string
          id: string
          name: string
          price: number
          quantity: number
          tax: number | null
        }
        Insert: {
          discount?: number | null
          estimate_id: string
          id?: string
          name: string
          price: number
          quantity: number
          tax?: number | null
        }
        Update: {
          discount?: number | null
          estimate_id?: string
          id?: string
          name?: string
          price?: number
          quantity?: number
          tax?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_products_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          client_address: string | null
          client_email: string | null
          client_name: string
          created_at: string | null
          date: string | null
          due_date: string | null
          estimate_number: string
          id: string
          notes: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          your_address: string | null
          your_company: string | null
          your_email: string | null
        }
        Insert: {
          client_address?: string | null
          client_email?: string | null
          client_name: string
          created_at?: string | null
          date?: string | null
          due_date?: string | null
          estimate_number: string
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          your_address?: string | null
          your_company?: string | null
          your_email?: string | null
        }
        Update: {
          client_address?: string | null
          client_email?: string | null
          client_name?: string
          created_at?: string | null
          date?: string | null
          due_date?: string | null
          estimate_number?: string
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          your_address?: string | null
          your_company?: string | null
          your_email?: string | null
        }
        Relationships: []
      }
      invoice_products: {
        Row: {
          discount: number | null
          id: string
          invoice_id: string
          name: string
          price: number
          quantity: number
          tax: number | null
        }
        Insert: {
          discount?: number | null
          id?: string
          invoice_id: string
          name: string
          price: number
          quantity: number
          tax?: number | null
        }
        Update: {
          discount?: number | null
          id?: string
          invoice_id?: string
          name?: string
          price?: number
          quantity?: number
          tax?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_products_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_address: string | null
          client_email: string | null
          client_name: string
          created_at: string | null
          date: string | null
          due_date: string | null
          id: string
          invoice_number: string
          is_draft: boolean | null
          notes: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          your_address: string | null
          your_company: string | null
          your_email: string | null
        }
        Insert: {
          client_address?: string | null
          client_email?: string | null
          client_name: string
          created_at?: string | null
          date?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          is_draft?: boolean | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          your_address?: string | null
          your_company?: string | null
          your_email?: string | null
        }
        Update: {
          client_address?: string | null
          client_email?: string | null
          client_name?: string
          created_at?: string | null
          date?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          is_draft?: boolean | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          your_address?: string | null
          your_company?: string | null
          your_email?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_address: string | null
          company_email: string | null
          company_logo: string | null
          company_name: string | null
          company_phone: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          company_address?: string | null
          company_email?: string | null
          company_logo?: string | null
          company_name?: string | null
          company_phone?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          company_address?: string | null
          company_email?: string | null
          company_logo?: string | null
          company_name?: string | null
          company_phone?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
