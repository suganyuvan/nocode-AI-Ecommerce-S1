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
      customers: {
        Row: {
          address: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string | null
          email: string
          id: string
          source: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          country_code: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          phone?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string | null
          product_id: string
          product_name: string
          quantity: number
          selected_timber: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id: string
          product_name: string
          quantity?: number
          selected_timber?: string | null
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string
          product_name?: string
          quantity?: number
          selected_timber?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          currency: string
          customer_id: string | null
          discount_amount: number
          gst_amount: number | null
          gst_rate: number | null
          id: string
          order_number: string
          payment_info: string | null
          payment_status: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          shipping_address: Json | null
          shipping_charge: number | null
          status: string | null
          subtotal: number
          total_amount: number
          updated_at: string | null
          webhook_verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          currency: string
          customer_id?: string | null
          discount_amount?: number
          gst_amount?: number | null
          gst_rate?: number | null
          id?: string
          order_number: string
          payment_info?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          shipping_address?: Json | null
          shipping_charge?: number | null
          status?: string | null
          subtotal: number
          total_amount: number
          updated_at?: string | null
          webhook_verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          customer_id?: string | null
          discount_amount?: number
          gst_amount?: number | null
          gst_rate?: number | null
          id?: string
          order_number?: string
          payment_info?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          shipping_address?: Json | null
          shipping_charge?: number | null
          status?: string | null
          subtotal?: number
          total_amount?: number
          updated_at?: string | null
          webhook_verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      page_content: {
        Row: {
          content: Json
          id: string
          section: string
        }
        Insert: {
          content: Json
          id?: string
          section: string
        }
        Update: {
          content?: Json
          id?: string
          section?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          authenticity: string
          category: string
          created_at: string | null
          description: string
          dimensions: string
          featured_in_spotlight: boolean | null
          gallery_images: string[]
          id: string
          image: string
          is_best_seller: boolean | null
          is_limited_edition: boolean | null
          is_new_arrival: boolean | null
          material: string
          name: string
          price_inr: number
          price_usd: number
          rating: number
          review_count: number
          short_description: string | null
          style: string
          timber_options: string[]
          weight: string | null
        }
        Insert: {
          authenticity: string
          category: string
          created_at?: string | null
          description: string
          dimensions: string
          featured_in_spotlight?: boolean | null
          gallery_images: string[]
          id: string
          image: string
          is_best_seller?: boolean | null
          is_limited_edition?: boolean | null
          is_new_arrival?: boolean | null
          material: string
          name: string
          price_inr: number
          price_usd: number
          rating: number
          review_count: number
          short_description?: string | null
          style: string
          timber_options: string[]
          weight?: string | null
        }
        Update: {
          authenticity?: string
          category?: string
          created_at?: string | null
          description?: string
          dimensions?: string
          featured_in_spotlight?: boolean | null
          gallery_images?: string[]
          id?: string
          image?: string
          is_best_seller?: boolean | null
          is_limited_edition?: boolean | null
          is_new_arrival?: boolean | null
          material?: string
          name?: string
          price_inr?: number
          price_usd?: number
          rating?: number
          review_count?: number
          short_description?: string | null
          style?: string
          timber_options?: string[]
          weight?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string
          date: string
          id: string
          product_id: string
          rating: number
          user_location: string
          user_name: string
          user_photo: string | null
          verified_purchase: boolean | null
        }
        Insert: {
          comment: string
          date: string
          id: string
          product_id: string
          rating: number
          user_location: string
          user_name: string
          user_photo?: string | null
          verified_purchase?: boolean | null
        }
        Update: {
          comment?: string
          date?: string
          id?: string
          product_id?: string
          rating?: number
          user_location?: string
          user_name?: string
          user_photo?: string | null
          verified_purchase?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          allow_customer_gift_selection: boolean | null
          free_shipping_threshold: number | null
          gift_product_ids: string[] | null
          id: number
          is_free_gift_active: boolean | null
          is_minimum_order_rule_active: boolean | null
          minimum_order_amount: number
          minimum_order_for_checkout: number | null
          promotion_teaser: string | null
          promotion_title: string | null
          updated_at: string | null
        }
        Insert: {
          allow_customer_gift_selection?: boolean | null
          free_shipping_threshold?: number | null
          gift_product_ids?: string[] | null
          id?: number
          is_free_gift_active?: boolean | null
          is_minimum_order_rule_active?: boolean | null
          minimum_order_amount?: number
          minimum_order_for_checkout?: number | null
          promotion_teaser?: string | null
          promotion_title?: string | null
          updated_at?: string | null
        }
        Update: {
          allow_customer_gift_selection?: boolean | null
          free_shipping_threshold?: number | null
          gift_product_ids?: string[] | null
          id?: number
          is_free_gift_active?: boolean | null
          is_minimum_order_rule_active?: boolean | null
          minimum_order_amount?: number
          minimum_order_for_checkout?: number | null
          promotion_teaser?: string | null
          promotion_title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          payload: Json | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string | null
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
    Enums: {},
  },
} as const
