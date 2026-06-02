export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      species: {
        Row: {
          id: string
          slug: string | null
          dex_number: string | null
          common_name: string
          latin_name: string | null
          kingdom: string | null
          rarity: string | null
          conservation: string | null
          region: string | null
          sounds: boolean | null
          description: string | null
          gradient_start: string | null
          gradient_end: string | null
          image_url: string | null
          stats: Json | null
          vitals: Json | null
          taxonomy: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          slug?: string | null
          dex_number?: string | null
          common_name: string
          latin_name?: string | null
          kingdom?: string | null
          rarity?: string | null
          conservation?: string | null
          region?: string | null
          sounds?: boolean | null
          description?: string | null
          gradient_start?: string | null
          gradient_end?: string | null
          image_url?: string | null
          stats?: Json | null
          vitals?: Json | null
          taxonomy?: Json | null
        }
        Update: Partial<Database['public']['Tables']['species']['Insert']>
        Relationships: []
      }
      domestic_species: {
        Row: {
          id: string
          common_name: string
          latin_name: string | null
          dex_number: string
          kingdom: string | null
          speed: number | null
          stamina: number | null
          size: number | null
          rarity: number | null
          lifespan: string | null
          diet: string | null
          top_speed: string | null
          region: string | null
          reference_image_url: string | null
        }
        Insert: {
          id?: string
          common_name: string
          latin_name?: string | null
          dex_number: string
          kingdom?: string | null
          speed?: number | null
          stamina?: number | null
          size?: number | null
          rarity?: number | null
          lifespan?: string | null
          diet?: string | null
          top_speed?: string | null
          region?: string | null
          reference_image_url?: string | null
        }
        Update: Partial<Database['public']['Tables']['domestic_species']['Insert']>
        Relationships: []
      }
      user_sightings: {
        Row: {
          id: string
          user_id: string
          species_id: string
          species_name: string
          kingdom: string
          latin_name: string | null
          dex_number: string | null
          confidence: number | null
          is_domestic: boolean
          photo_uri: string | null
          latitude: number | null
          longitude: number | null
          spotted_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          species_id: string
          species_name: string
          kingdom: string
          latin_name?: string | null
          dex_number?: string | null
          confidence?: number | null
          is_domestic?: boolean
          photo_uri?: string | null
          latitude?: number | null
          longitude?: number | null
          spotted_at?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['user_sightings']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'user_sightings_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      community_sightings: {
        Row: {
          id: string
          species_name: string
          species_id: string | null
          kingdom: string
          latitude: number
          longitude: number
          spotted_at: string
          report_count: number
          created_at: string
          user_id: string | null
          privacy: string
        }
        Insert: {
          id?: string
          species_name: string
          species_id?: string | null
          kingdom: string
          latitude: number
          longitude: number
          spotted_at?: string
          report_count?: number
          created_at?: string
          user_id?: string | null
          privacy?: string
        }
        Update: Partial<Database['public']['Tables']['community_sightings']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'community_sightings_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          username: string | null
          timezone: string | null
          location_text: string | null
          latitude: number | null
          longitude: number | null
          interests: string[]
          age_group: string | null
          onboarding_complete: boolean
          level: number
          xp: number
          streak_days: number
          last_spotted_at: string | null
          spots_captured: number
          rare_spotted: number
          badges_count: number
          weekly_quest_title: string
          weekly_quest_current: number
          weekly_quest_total: number
          weekly_quest_xp_reward: number
          weekly_quest_started_at: string
          date_of_birth: string | null
          account_type: string | null
          parent_name: string | null
          parent_email: string | null
          parent_permission_confirmed: boolean
          family_account_enabled: boolean
          can_publish_to_nearby: boolean
          show_username_on_map: boolean
          requires_parent_setup: boolean
          parent_approval_status: 'pending' | 'approved' | 'declined' | null
          parent_approval_token: string | null
          parent_approval_token_expires_at: string | null
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          timezone?: string | null
          location_text?: string | null
          latitude?: number | null
          longitude?: number | null
          interests?: string[]
          age_group?: string | null
          onboarding_complete?: boolean
          level?: number
          xp?: number
          streak_days?: number
          last_spotted_at?: string | null
          spots_captured?: number
          rare_spotted?: number
          badges_count?: number
          weekly_quest_title?: string
          weekly_quest_current?: number
          weekly_quest_total?: number
          weekly_quest_xp_reward?: number
          weekly_quest_started_at?: string
          date_of_birth?: string | null
          account_type?: string | null
          parent_name?: string | null
          parent_email?: string | null
          parent_permission_confirmed?: boolean
          family_account_enabled?: boolean
          can_publish_to_nearby?: boolean
          show_username_on_map?: boolean
          requires_parent_setup?: boolean
          parent_approval_status?: 'pending' | 'approved' | 'declined' | null
          parent_approval_token?: string | null
          parent_approval_token_expires_at?: string | null
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
