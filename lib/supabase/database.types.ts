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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
