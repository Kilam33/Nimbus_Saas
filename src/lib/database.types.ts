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
      stores: {
        Row: {
          id: string
          created_at: string
          name: string
          logo_url: string | null
          currency: string
          tax_rate: number
          owner_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          logo_url?: string | null
          currency?: string
          tax_rate?: number
          owner_id: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          logo_url?: string | null
          currency?: string
          tax_rate?: number
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      store_members: {
        Row: {
          id: string
          created_at: string
          store_id: string
          user_id: string
          role: string
          pin_code: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          store_id: string
          user_id: string
          role: string
          pin_code?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          store_id?: string
          user_id?: string
          role?: string
          pin_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_members_store_id_fkey"
            columns: ["store_id"]
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_members_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          store_id: string
          name: string
          sku: string
          barcode: string | null
          description: string | null
          price: number
          cost_price: number | null
          current_stock: number
          image_url: string | null
          category_id: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          store_id: string
          name: string
          sku: string
          barcode?: string | null
          description?: string | null
          price: number
          cost_price?: number | null
          current_stock?: number
          image_url?: string | null
          category_id?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          store_id?: string
          name?: string
          sku?: string
          barcode?: string | null
          description?: string | null
          price?: number
          cost_price?: number | null
          current_stock?: number
          image_url?: string | null
          category_id?: string | null
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          }
        ]
      }
      product_categories: {
        Row: {
          id: string
          created_at: string
          store_id: string
          name: string
        }
        Insert: {
          id?: string
          created_at?: string
          store_id: string
          name: string
        }
        Update: {
          id?: string
          created_at?: string
          store_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_store_id_fkey"
            columns: ["store_id"]
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
      sales: {
        Row: {
          id: string
          created_at: string
          store_id: string
          cashier_id: string
          total_amount: number
          tax_amount: number
          payment_method: string
          status: string
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          store_id: string
          cashier_id: string
          total_amount: number
          tax_amount: number
          payment_method: string
          status?: string
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          store_id?: string
          cashier_id?: string
          total_amount?: number
          tax_amount?: number
          payment_method?: string
          status?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_store_id_fkey"
            columns: ["store_id"]
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_cashier_id_fkey"
            columns: ["cashier_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      sale_items: {
        Row: {
          id: string
          created_at: string
          sale_id: string
          product_id: string
          quantity: number
          unit_price: number
          subtotal: number
        }
        Insert: {
          id?: string
          created_at?: string
          sale_id: string
          product_id: string
          quantity: number
          unit_price: number
          subtotal: number
        }
        Update: {
          id?: string
          created_at?: string
          sale_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      inventory_transactions: {
        Row: {
          id: string
          created_at: string
          store_id: string
          product_id: string
          quantity: number
          transaction_type: string
          notes: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          store_id: string
          product_id: string
          quantity: number
          transaction_type: string
          notes?: string | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          store_id?: string
          product_id?: string
          quantity?: number
          transaction_type?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_store_id_fkey"
            columns: ["store_id"]
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
  }
}