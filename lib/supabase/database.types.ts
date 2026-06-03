export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      community_sightings: {
        Row: {
          created_at: string
          id: string
          kingdom: string
          latitude: number
          longitude: number
          privacy: string
          report_count: number
          species_id: string | null
          species_name: string
          spotted_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kingdom: string
          latitude: number
          longitude: number
          privacy?: string
          report_count?: number
          species_id?: string | null
          species_name: string
          spotted_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kingdom?: string
          latitude?: number
          longitude?: number
          privacy?: string
          report_count?: number
          species_id?: string | null
          species_name?: string
          spotted_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_sightings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deleted_accounts: {
        Row: {
          deleted_at: string
          deletion_scheduled_for: string
          id: string
          original_user_id: string
          recovery_email: string
          storage_prefix: string
        }
        Insert: {
          deleted_at?: string
          deletion_scheduled_for?: string
          id?: string
          original_user_id: string
          recovery_email: string
          storage_prefix: string
        }
        Update: {
          deleted_at?: string
          deletion_scheduled_for?: string
          id?: string
          original_user_id?: string
          recovery_email?: string
          storage_prefix?: string
        }
        Relationships: []
      }
      domestic_species: {
        Row: {
          common_name: string
          dex_number: string
          diet: string | null
          id: string
          kingdom: string | null
          latin_name: string | null
          lifespan: string | null
          rarity: number | null
          reference_image_url: string | null
          region: string | null
          size: number | null
          speed: number | null
          stamina: number | null
          top_speed: string | null
        }
        Insert: {
          common_name: string
          dex_number: string
          diet?: string | null
          id?: string
          kingdom?: string | null
          latin_name?: string | null
          lifespan?: string | null
          rarity?: number | null
          reference_image_url?: string | null
          region?: string | null
          size?: number | null
          speed?: number | null
          stamina?: number | null
          top_speed?: string | null
        }
        Update: {
          common_name?: string
          dex_number?: string
          diet?: string | null
          id?: string
          kingdom?: string | null
          latin_name?: string | null
          lifespan?: string | null
          rarity?: number | null
          reference_image_url?: string | null
          region?: string | null
          size?: number | null
          speed?: number | null
          stamina?: number | null
          top_speed?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string | null
          age_group: string | null
          age_verified: boolean | null
          avatar_url: string | null
          badges_count: number
          can_publish_to_nearby: boolean
          created_at: string | null
          date_of_birth: string | null
          deleted_at: string | null
          deletion_scheduled_for: string | null
          family_account_enabled: boolean
          full_name: string | null
          id: string
          interests: string[] | null
          last_spotted_at: string | null
          latitude: number | null
          level: number
          location_text: string | null
          longitude: number | null
          onboarding_complete: boolean | null
          parent_approval_status: string | null
          parent_approval_token: string | null
          parent_approval_token_expires_at: string | null
          parent_email: string | null
          parent_name: string | null
          parent_permission_confirmed: boolean
          rare_spotted: number
          requires_parent_setup: boolean
          show_username_on_map: boolean
          spots_captured: number
          streak_days: number
          timezone: string | null
          updated_at: string
          username: string | null
          weekly_quest_current: number
          weekly_quest_started_at: string
          weekly_quest_title: string
          weekly_quest_total: number
          weekly_quest_xp_reward: number
          xp: number
        }
        Insert: {
          account_type?: string | null
          age_group?: string | null
          age_verified?: boolean | null
          avatar_url?: string | null
          badges_count?: number
          can_publish_to_nearby?: boolean
          created_at?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          deletion_scheduled_for?: string | null
          family_account_enabled?: boolean
          full_name?: string | null
          id: string
          interests?: string[] | null
          last_spotted_at?: string | null
          latitude?: number | null
          level?: number
          location_text?: string | null
          longitude?: number | null
          onboarding_complete?: boolean | null
          parent_approval_status?: string | null
          parent_approval_token?: string | null
          parent_approval_token_expires_at?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_permission_confirmed?: boolean
          rare_spotted?: number
          requires_parent_setup?: boolean
          show_username_on_map?: boolean
          spots_captured?: number
          streak_days?: number
          timezone?: string | null
          updated_at?: string
          username?: string | null
          weekly_quest_current?: number
          weekly_quest_started_at?: string
          weekly_quest_title?: string
          weekly_quest_total?: number
          weekly_quest_xp_reward?: number
          xp?: number
        }
        Update: {
          account_type?: string | null
          age_group?: string | null
          age_verified?: boolean | null
          avatar_url?: string | null
          badges_count?: number
          can_publish_to_nearby?: boolean
          created_at?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          deletion_scheduled_for?: string | null
          family_account_enabled?: boolean
          full_name?: string | null
          id?: string
          interests?: string[] | null
          last_spotted_at?: string | null
          latitude?: number | null
          level?: number
          location_text?: string | null
          longitude?: number | null
          onboarding_complete?: boolean | null
          parent_approval_status?: string | null
          parent_approval_token?: string | null
          parent_approval_token_expires_at?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_permission_confirmed?: boolean
          rare_spotted?: number
          requires_parent_setup?: boolean
          show_username_on_map?: boolean
          spots_captured?: number
          streak_days?: number
          timezone?: string | null
          updated_at?: string
          username?: string | null
          weekly_quest_current?: number
          weekly_quest_started_at?: string
          weekly_quest_title?: string
          weekly_quest_total?: number
          weekly_quest_xp_reward?: number
          xp?: number
        }
        Relationships: []
      }
      species: {
        Row: {
          common_name: string
          conservation: string | null
          created_at: string | null
          description: string | null
          dex_number: string | null
          gradient_end: string | null
          gradient_start: string | null
          id: string
          image_url: string | null
          kingdom: string | null
          latin_name: string | null
          rarity: string | null
          region: string | null
          slug: string | null
          sounds: boolean | null
          stats: Json | null
          taxonomy: Json | null
          updated_at: string | null
          vitals: Json | null
        }
        Insert: {
          common_name: string
          conservation?: string | null
          created_at?: string | null
          description?: string | null
          dex_number?: string | null
          gradient_end?: string | null
          gradient_start?: string | null
          id: string
          image_url?: string | null
          kingdom?: string | null
          latin_name?: string | null
          rarity?: string | null
          region?: string | null
          slug?: string | null
          sounds?: boolean | null
          stats?: Json | null
          taxonomy?: Json | null
          updated_at?: string | null
          vitals?: Json | null
        }
        Update: {
          common_name?: string
          conservation?: string | null
          created_at?: string | null
          description?: string | null
          dex_number?: string | null
          gradient_end?: string | null
          gradient_start?: string | null
          id?: string
          image_url?: string | null
          kingdom?: string | null
          latin_name?: string | null
          rarity?: string | null
          region?: string | null
          slug?: string | null
          sounds?: boolean | null
          stats?: Json | null
          taxonomy?: Json | null
          updated_at?: string | null
          vitals?: Json | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          badge_name: string
          badge_symbol: string
          badge_tier: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          badge_name: string
          badge_symbol: string
          badge_tier: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          badge_name?: string
          badge_symbol?: string
          badge_tier?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_journal_entries: {
        Row: {
          body: string
          created_at: string
          entry_date: string
          id: string
          location_text: string | null
          photo_urls: string[] | null
          sighting_ids: string[] | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          entry_date?: string
          id?: string
          location_text?: string | null
          photo_urls?: string[] | null
          sighting_ids?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          entry_date?: string
          id?: string
          location_text?: string | null
          photo_urls?: string[] | null
          sighting_ids?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_journal_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notes: {
        Row: {
          body: string
          created_at: string
          id: string
          sighting_id: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          sighting_id?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sighting_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notes_sighting_id_fkey"
            columns: ["sighting_id"]
            isOneToOne: false
            referencedRelation: "user_sightings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sightings: {
        Row: {
          confidence: number | null
          created_at: string
          dex_number: string | null
          id: string
          is_domestic: boolean
          is_pinned: boolean
          kingdom: string
          latin_name: string | null
          latitude: number | null
          longitude: number | null
          photo_uri: string | null
          species_id: string
          species_name: string
          spotted_at: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          dex_number?: string | null
          id?: string
          is_domestic?: boolean
          is_pinned?: boolean
          kingdom: string
          latin_name?: string | null
          latitude?: number | null
          longitude?: number | null
          photo_uri?: string | null
          species_id: string
          species_name: string
          spotted_at?: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          dex_number?: string | null
          id?: string
          is_domestic?: boolean
          is_pinned?: boolean
          kingdom?: string
          latin_name?: string | null
          latitude?: number | null
          longitude?: number | null
          photo_uri?: string | null
          species_id?: string
          species_name?: string
          spotted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sightings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_current_user: { Args: never; Returns: undefined }
      request_account_deletion: { Args: never; Returns: undefined }
      restore_account: { Args: never; Returns: undefined }
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
