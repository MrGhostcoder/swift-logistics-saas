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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value?: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      email_log: {
        Row: {
          body: string
          created_at: string
          id: string
          status: string
          subject: string
          to_email: string
          tracking_code_id: string | null
          user_id: string | null
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          status?: string
          subject: string
          to_email: string
          tracking_code_id?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          status?: string
          subject?: string
          to_email?: string
          tracking_code_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_log_tracking_code_id_fkey"
            columns: ["tracking_code_id"]
            isOneToOne: false
            referencedRelation: "tracking_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read: boolean
          sender_name: string
          sender_type: string
          tracking_code_id: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read?: boolean
          sender_name?: string
          sender_type?: string
          tracking_code_id: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read?: boolean
          sender_name?: string
          sender_type?: string
          tracking_code_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_tracking_code_id_fkey"
            columns: ["tracking_code_id"]
            isOneToOne: false
            referencedRelation: "tracking_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          id: string
          payment_date: string | null
          plan_id: string | null
          receipt_url: string | null
          reference: string
          status: Database["public"]["Enums"]["pay_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          id?: string
          payment_date?: string | null
          plan_id?: string | null
          receipt_url?: string | null
          reference: string
          status?: Database["public"]["Enums"]["pay_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          id?: string
          payment_date?: string | null
          plan_id?: string | null
          receipt_url?: string | null
          reference?: string
          status?: Database["public"]["Enums"]["pay_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          code_limit: number
          created_at: string
          currency: string
          features: string[]
          id: string
          is_popular: boolean
          name: string
          price: number
          sort_order: number
        }
        Insert: {
          active?: boolean
          code_limit?: number
          created_at?: string
          currency?: string
          features?: string[]
          id?: string
          is_popular?: boolean
          name: string
          price?: number
          sort_order?: number
        }
        Update: {
          active?: boolean
          code_limit?: number
          created_at?: string
          currency?: string
          features?: string[]
          id?: string
          is_popular?: boolean
          name?: string
          price?: number
          sort_order?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string
          codes_total: number
          codes_used: number
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          plan_id: string | null
          subscription_status: Database["public"]["Enums"]["sub_status"]
          updated_at: string
        }
        Insert: {
          account_status?: string
          codes_total?: number
          codes_used?: number
          created_at?: string
          email?: string
          full_name?: string
          id: string
          phone?: string | null
          plan_id?: string | null
          subscription_status?: Database["public"]["Enums"]["sub_status"]
          updated_at?: string
        }
        Update: {
          account_status?: string
          codes_total?: number
          codes_used?: number
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          plan_id?: string | null
          subscription_status?: Database["public"]["Enums"]["sub_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_plan_fk"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_codes: {
        Row: {
          code: string
          created_at: string
          current_location: string | null
          delivery_address: string | null
          destination: string | null
          estimated_delivery: string | null
          id: string
          origin: string | null
          package_category: string | null
          package_description: string | null
          package_name: string
          package_value: string | null
          pickup_address: string | null
          quantity: number
          recipient_email: string | null
          recipient_name: string | null
          recipient_phone: string | null
          sender_email: string | null
          sender_name: string | null
          sender_phone: string | null
          shipping_method: string | null
          special_instructions: string | null
          status: Database["public"]["Enums"]["ship_status"]
          updated_at: string
          user_id: string | null
          weight: string | null
        }
        Insert: {
          code: string
          created_at?: string
          current_location?: string | null
          delivery_address?: string | null
          destination?: string | null
          estimated_delivery?: string | null
          id?: string
          origin?: string | null
          package_category?: string | null
          package_description?: string | null
          package_name?: string
          package_value?: string | null
          pickup_address?: string | null
          quantity?: number
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          shipping_method?: string | null
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["ship_status"]
          updated_at?: string
          user_id?: string | null
          weight?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          current_location?: string | null
          delivery_address?: string | null
          destination?: string | null
          estimated_delivery?: string | null
          id?: string
          origin?: string | null
          package_category?: string | null
          package_description?: string | null
          package_name?: string
          package_value?: string | null
          pickup_address?: string | null
          quantity?: number
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          shipping_method?: string | null
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["ship_status"]
          updated_at?: string
          user_id?: string | null
          weight?: string | null
        }
        Relationships: []
      }
      tracking_events: {
        Row: {
          id: string
          location: string | null
          note: string | null
          occurred_at: string
          status: Database["public"]["Enums"]["ship_status"]
          title: string
          tracking_code_id: string
        }
        Insert: {
          id?: string
          location?: string | null
          note?: string | null
          occurred_at?: string
          status: Database["public"]["Enums"]["ship_status"]
          title: string
          tracking_code_id: string
        }
        Update: {
          id?: string
          location?: string | null
          note?: string | null
          occurred_at?: string
          status?: Database["public"]["Enums"]["ship_status"]
          title?: string
          tracking_code_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_events_tracking_code_id_fkey"
            columns: ["tracking_code_id"]
            isOneToOne: false
            referencedRelation: "tracking_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      approve_payment: { Args: { _payment_id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reject_payment: {
        Args: { _note: string; _payment_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "customer"
      pay_status: "pending" | "approved" | "rejected"
      ship_status:
        | "pending"
        | "picked_up"
        | "in_transit"
        | "out_for_delivery"
        | "delivered"
        | "exception"
      sub_status:
        | "NO_PLAN"
        | "PENDING_PAYMENT"
        | "ACTIVE"
        | "EXPIRED"
        | "SUSPENDED"
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
      app_role: ["admin", "customer"],
      pay_status: ["pending", "approved", "rejected"],
      ship_status: [
        "pending",
        "picked_up",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "exception",
      ],
      sub_status: [
        "NO_PLAN",
        "PENDING_PAYMENT",
        "ACTIVE",
        "EXPIRED",
        "SUSPENDED",
      ],
    },
  },
} as const
