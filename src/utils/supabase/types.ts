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
      workspaces: {
        Row: {
          id: string
          name: string
          description: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      workspace_members: {
        Row: {
          workspace_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          workspace_id: string
          user_id: string
          role: string
          joined_at?: string
        }
        Update: {
          workspace_id?: string
          user_id?: string
          role?: string
          joined_at?: string
        }
      }
      workspace_versions: {
        Row: {
          id: string
          workspace_id: string
          created_by: string
          data: Json
          version: number
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          created_by: string
          data: Json
          version: number
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          created_by?: string
          data?: Json
          version?: number
          description?: string
          created_at?: string
        }
      }
      workspace_comments: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          content: string
          parent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          content: string
          parent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          content?: string
          parent_id?: string | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          user_id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          email?: string
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
  }
}