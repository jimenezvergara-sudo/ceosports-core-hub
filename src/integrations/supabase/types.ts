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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      aprobaciones_compra: {
        Row: {
          aprobado_por: string
          centro_costo: string | null
          created_at: string
          decision: string
          fecha_aprobacion: string
          id: string
          monto_aprobado: number | null
          observaciones: string | null
          proyecto_asociado: string | null
          responsable_compra: string | null
          solicitud_id: string
        }
        Insert: {
          aprobado_por: string
          centro_costo?: string | null
          created_at?: string
          decision: string
          fecha_aprobacion?: string
          id?: string
          monto_aprobado?: number | null
          observaciones?: string | null
          proyecto_asociado?: string | null
          responsable_compra?: string | null
          solicitud_id: string
        }
        Update: {
          aprobado_por?: string
          centro_costo?: string | null
          created_at?: string
          decision?: string
          fecha_aprobacion?: string
          id?: string
          monto_aprobado?: number | null
          observaciones?: string | null
          proyecto_asociado?: string | null
          responsable_compra?: string | null
          solicitud_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aprobaciones_compra_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes_compra"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          created_at: string
          etiqueta: string
          fecha_carga: string
          fecha_vencimiento: string | null
          id: string
          nombre_archivo: string
          persona_id: string
          storage_path: string
          tipo_mime: string
          updated_at: string
          url_publica: string | null
        }
        Insert: {
          created_at?: string
          etiqueta: string
          fecha_carga?: string
          fecha_vencimiento?: string | null
          id?: string
          nombre_archivo: string
          persona_id: string
          storage_path: string
          tipo_mime: string
          updated_at?: string
          url_publica?: string | null
        }
        Update: {
          created_at?: string
          etiqueta?: string
          fecha_carga?: string
          fecha_vencimiento?: string | null
          id?: string
          nombre_archivo?: string
          persona_id?: string
          storage_path?: string
          tipo_mime?: string
          updated_at?: string
          url_publica?: string | null
        }
        Relationships: []
      }
      ejecuciones_compra: {
        Row: {
          comprobante_path: string | null
          created_at: string
          fecha_compra: string
          id: string
          medio_pago: string
          monto_real: number
          numero_comprobante: string | null
          observaciones: string | null
          proveedor_real: string
          solicitud_id: string
        }
        Insert: {
          comprobante_path?: string | null
          created_at?: string
          fecha_compra?: string
          id?: string
          medio_pago: string
          monto_real: number
          numero_comprobante?: string | null
          observaciones?: string | null
          proveedor_real: string
          solicitud_id: string
        }
        Update: {
          comprobante_path?: string | null
          created_at?: string
          fecha_compra?: string
          id?: string
          medio_pago?: string
          monto_real?: number
          numero_comprobante?: string | null
          observaciones?: string | null
          proveedor_real?: string
          solicitud_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ejecuciones_compra_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes_compra"
            referencedColumns: ["id"]
          },
        ]
      }
      historial_compra: {
        Row: {
          accion: string
          created_at: string
          detalle: string | null
          id: string
          responsable: string
          solicitud_id: string
        }
        Insert: {
          accion: string
          created_at?: string
          detalle?: string | null
          id?: string
          responsable: string
          solicitud_id: string
        }
        Update: {
          accion?: string
          created_at?: string
          detalle?: string | null
          id?: string
          responsable?: string
          solicitud_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historial_compra_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes_compra"
            referencedColumns: ["id"]
          },
        ]
      }
      rendiciones_compra: {
        Row: {
          created_at: string
          diferencia: number
          estado_revision: string
          fecha_cierre: string | null
          id: string
          monto_rendido: number
          observaciones_tesoreria: string | null
          solicitud_id: string
        }
        Insert: {
          created_at?: string
          diferencia?: number
          estado_revision?: string
          fecha_cierre?: string | null
          id?: string
          monto_rendido: number
          observaciones_tesoreria?: string | null
          solicitud_id: string
        }
        Update: {
          created_at?: string
          diferencia?: number
          estado_revision?: string
          fecha_cierre?: string | null
          id?: string
          monto_rendido?: number
          observaciones_tesoreria?: string | null
          solicitud_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rendiciones_compra_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes_compra"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes_compra: {
        Row: {
          adjunto_path: string | null
          cantidad: number
          categoria_equipo: string | null
          created_at: string
          descripcion: string
          estado: string
          fecha_requerida: string | null
          id: string
          justificacion: string | null
          monto_estimado: number
          prioridad: string
          proveedor_sugerido: string | null
          proyecto_asociado: string | null
          solicitante: string
          tipo_gasto: string
          titulo: string
          updated_at: string
        }
        Insert: {
          adjunto_path?: string | null
          cantidad?: number
          categoria_equipo?: string | null
          created_at?: string
          descripcion: string
          estado?: string
          fecha_requerida?: string | null
          id?: string
          justificacion?: string | null
          monto_estimado: number
          prioridad?: string
          proveedor_sugerido?: string | null
          proyecto_asociado?: string | null
          solicitante: string
          tipo_gasto: string
          titulo: string
          updated_at?: string
        }
        Update: {
          adjunto_path?: string | null
          cantidad?: number
          categoria_equipo?: string | null
          created_at?: string
          descripcion?: string
          estado?: string
          fecha_requerida?: string | null
          id?: string
          justificacion?: string | null
          monto_estimado?: number
          prioridad?: string
          proveedor_sugerido?: string | null
          proyecto_asociado?: string | null
          solicitante?: string
          tipo_gasto?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      transacciones: {
        Row: {
          categoria: string
          categoria_deportiva: string | null
          created_at: string
          descripcion: string
          estado: string
          fecha: string
          id: string
          metodo_pago: string | null
          monto: number
          notas: string | null
          persona_id: string | null
          referencia: string | null
          subcategoria: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          categoria: string
          categoria_deportiva?: string | null
          created_at?: string
          descripcion: string
          estado?: string
          fecha?: string
          id?: string
          metodo_pago?: string | null
          monto: number
          notas?: string | null
          persona_id?: string | null
          referencia?: string | null
          subcategoria?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          categoria_deportiva?: string | null
          created_at?: string
          descripcion?: string
          estado?: string
          fecha?: string
          id?: string
          metodo_pago?: string | null
          monto?: number
          notas?: string | null
          persona_id?: string | null
          referencia?: string | null
          subcategoria?: string | null
          tipo?: string
          updated_at?: string
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
