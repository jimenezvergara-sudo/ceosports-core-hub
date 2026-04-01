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
          aprobado_por_id: string | null
          centro_costo: string | null
          created_at: string
          decision: string
          fecha_aprobacion: string
          id: string
          monto_aprobado: number | null
          observaciones: string | null
          proyecto_asociado: string | null
          proyecto_id: string | null
          responsable_compra: string | null
          responsable_compra_id: string | null
          solicitud_id: string
        }
        Insert: {
          aprobado_por: string
          aprobado_por_id?: string | null
          centro_costo?: string | null
          created_at?: string
          decision: string
          fecha_aprobacion?: string
          id?: string
          monto_aprobado?: number | null
          observaciones?: string | null
          proyecto_asociado?: string | null
          proyecto_id?: string | null
          responsable_compra?: string | null
          responsable_compra_id?: string | null
          solicitud_id: string
        }
        Update: {
          aprobado_por?: string
          aprobado_por_id?: string | null
          centro_costo?: string | null
          created_at?: string
          decision?: string
          fecha_aprobacion?: string
          id?: string
          monto_aprobado?: number | null
          observaciones?: string | null
          proyecto_asociado?: string | null
          proyecto_id?: string | null
          responsable_compra?: string | null
          responsable_compra_id?: string | null
          solicitud_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aprobaciones_compra_aprobado_por_id_fkey"
            columns: ["aprobado_por_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aprobaciones_compra_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aprobaciones_compra_responsable_compra_id_fkey"
            columns: ["responsable_compra_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aprobaciones_compra_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes_compra"
            referencedColumns: ["id"]
          },
        ]
      }
      beneficios_cuota: {
        Row: {
          activo: boolean
          categoria_id: string | null
          created_at: string
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          motivo: string | null
          persona_id: string
          tipo_beneficio: string
          valor: number
          valor_tipo: string
        }
        Insert: {
          activo?: boolean
          categoria_id?: string | null
          created_at?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          motivo?: string | null
          persona_id: string
          tipo_beneficio: string
          valor: number
          valor_tipo?: string
        }
        Update: {
          activo?: boolean
          categoria_id?: string | null
          created_at?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          motivo?: string | null
          persona_id?: string
          tipo_beneficio?: string
          valor?: number
          valor_tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "beneficios_cuota_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beneficios_cuota_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          created_at: string
          id: string
          nombre: string
          rama: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
          rama?: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
          rama?: string
        }
        Relationships: []
      }
      cuota_configuraciones: {
        Row: {
          activa: boolean
          categoria_id: string | null
          created_at: string
          dia_vencimiento: number
          fecha_fin: string | null
          fecha_inicio: string | null
          frecuencia: string
          id: string
          monto_base: number
          nombre: string
          updated_at: string
        }
        Insert: {
          activa?: boolean
          categoria_id?: string | null
          created_at?: string
          dia_vencimiento?: number
          fecha_fin?: string | null
          fecha_inicio?: string | null
          frecuencia?: string
          id?: string
          monto_base: number
          nombre: string
          updated_at?: string
        }
        Update: {
          activa?: boolean
          categoria_id?: string | null
          created_at?: string
          dia_vencimiento?: number
          fecha_fin?: string | null
          fecha_inicio?: string | null
          frecuencia?: string
          id?: string
          monto_base?: number
          nombre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cuota_configuraciones_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      cuotas: {
        Row: {
          apoderado_id: string | null
          categoria_id: string | null
          configuracion_id: string | null
          created_at: string
          descuento: number
          estado: string
          fecha_emision: string
          fecha_vencimiento: string
          id: string
          monto_final: number
          monto_original: number
          observaciones: string | null
          periodo: string
          persona_id: string
          recargo: number
          updated_at: string
        }
        Insert: {
          apoderado_id?: string | null
          categoria_id?: string | null
          configuracion_id?: string | null
          created_at?: string
          descuento?: number
          estado?: string
          fecha_emision?: string
          fecha_vencimiento: string
          id?: string
          monto_final: number
          monto_original: number
          observaciones?: string | null
          periodo: string
          persona_id: string
          recargo?: number
          updated_at?: string
        }
        Update: {
          apoderado_id?: string | null
          categoria_id?: string | null
          configuracion_id?: string | null
          created_at?: string
          descuento?: number
          estado?: string
          fecha_emision?: string
          fecha_vencimiento?: string
          id?: string
          monto_final?: number
          monto_original?: number
          observaciones?: string | null
          periodo?: string
          persona_id?: string
          recargo?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cuotas_apoderado_id_fkey"
            columns: ["apoderado_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cuotas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cuotas_configuracion_id_fkey"
            columns: ["configuracion_id"]
            isOneToOne: false
            referencedRelation: "cuota_configuraciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cuotas_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
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
          ejecutado_por_id: string | null
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
          ejecutado_por_id?: string | null
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
          ejecutado_por_id?: string | null
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
            foreignKeyName: "ejecuciones_compra_ejecutado_por_id_fkey"
            columns: ["ejecutado_por_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
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
          responsable_id: string | null
          solicitud_id: string
        }
        Insert: {
          accion: string
          created_at?: string
          detalle?: string | null
          id?: string
          responsable: string
          responsable_id?: string | null
          solicitud_id: string
        }
        Update: {
          accion?: string
          created_at?: string
          detalle?: string | null
          id?: string
          responsable?: string
          responsable_id?: string | null
          solicitud_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historial_compra_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_compra_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes_compra"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos_cuotas: {
        Row: {
          comprobante_path: string | null
          created_at: string
          cuota_id: string
          fecha_pago: string
          id: string
          metodo_pago: string | null
          monto_pagado: number
          observaciones: string | null
          recibido_por_id: string | null
          referencia: string | null
        }
        Insert: {
          comprobante_path?: string | null
          created_at?: string
          cuota_id: string
          fecha_pago?: string
          id?: string
          metodo_pago?: string | null
          monto_pagado: number
          observaciones?: string | null
          recibido_por_id?: string | null
          referencia?: string | null
        }
        Update: {
          comprobante_path?: string | null
          created_at?: string
          cuota_id?: string
          fecha_pago?: string
          id?: string
          metodo_pago?: string | null
          monto_pagado?: number
          observaciones?: string | null
          recibido_por_id?: string | null
          referencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagos_cuotas_cuota_id_fkey"
            columns: ["cuota_id"]
            isOneToOne: false
            referencedRelation: "cuotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_cuotas_recibido_por_id_fkey"
            columns: ["recibido_por_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      persona_categoria: {
        Row: {
          categoria_id: string
          created_at: string
          id: string
          persona_id: string
        }
        Insert: {
          categoria_id: string
          created_at?: string
          id?: string
          persona_id: string
        }
        Update: {
          categoria_id?: string
          created_at?: string
          id?: string
          persona_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "persona_categoria_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "persona_categoria_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      persona_relaciones: {
        Row: {
          created_at: string
          id: string
          persona_id: string
          relacionado_id: string
          tipo_relacion: string
        }
        Insert: {
          created_at?: string
          id?: string
          persona_id: string
          relacionado_id: string
          tipo_relacion?: string
        }
        Update: {
          created_at?: string
          id?: string
          persona_id?: string
          relacionado_id?: string
          tipo_relacion?: string
        }
        Relationships: [
          {
            foreignKeyName: "persona_relaciones_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "persona_relaciones_relacionado_id_fkey"
            columns: ["relacionado_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      personas: {
        Row: {
          apellido: string
          created_at: string
          email: string | null
          estado: string
          fecha_nacimiento: string | null
          id: string
          nombre: string
          rut: string | null
          telefono: string | null
          tipo_persona: string
          updated_at: string
        }
        Insert: {
          apellido: string
          created_at?: string
          email?: string | null
          estado?: string
          fecha_nacimiento?: string | null
          id?: string
          nombre: string
          rut?: string | null
          telefono?: string | null
          tipo_persona?: string
          updated_at?: string
        }
        Update: {
          apellido?: string
          created_at?: string
          email?: string | null
          estado?: string
          fecha_nacimiento?: string | null
          id?: string
          nombre?: string
          rut?: string | null
          telefono?: string | null
          tipo_persona?: string
          updated_at?: string
        }
        Relationships: []
      }
      proyectos: {
        Row: {
          created_at: string
          estado: string
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          nombre: string
          presupuesto: number
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          nombre: string
          presupuesto?: number
          tipo?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          nombre?: string
          presupuesto?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: []
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
          revisado_por_id: string | null
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
          revisado_por_id?: string | null
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
          revisado_por_id?: string | null
          solicitud_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rendiciones_compra_revisado_por_id_fkey"
            columns: ["revisado_por_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
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
          categoria_id: string | null
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
          proyecto_id: string | null
          solicitante: string
          solicitante_id: string | null
          tipo_gasto: string
          titulo: string
          updated_at: string
        }
        Insert: {
          adjunto_path?: string | null
          cantidad?: number
          categoria_equipo?: string | null
          categoria_id?: string | null
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
          proyecto_id?: string | null
          solicitante: string
          solicitante_id?: string | null
          tipo_gasto: string
          titulo: string
          updated_at?: string
        }
        Update: {
          adjunto_path?: string | null
          cantidad?: number
          categoria_equipo?: string | null
          categoria_id?: string | null
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
          proyecto_id?: string | null
          solicitante?: string
          solicitante_id?: string | null
          tipo_gasto?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_compra_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_compra_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_compra_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_roles: {
        Row: {
          activo: boolean
          categoria_id: string | null
          created_at: string
          id: string
          persona_id: string
          rol: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          categoria_id?: string | null
          created_at?: string
          id?: string
          persona_id: string
          rol: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          categoria_id?: string | null
          created_at?: string
          id?: string
          persona_id?: string
          rol?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_roles_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_roles_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      transacciones: {
        Row: {
          categoria: string
          categoria_deportiva: string | null
          categoria_ref_id: string | null
          created_at: string
          descripcion: string
          estado: string
          fecha: string
          id: string
          metodo_pago: string | null
          monto: number
          notas: string | null
          origen_id: string | null
          origen_tipo: string | null
          persona_id: string | null
          persona_ref_id: string | null
          proyecto_id: string | null
          referencia: string | null
          subcategoria: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          categoria: string
          categoria_deportiva?: string | null
          categoria_ref_id?: string | null
          created_at?: string
          descripcion: string
          estado?: string
          fecha?: string
          id?: string
          metodo_pago?: string | null
          monto: number
          notas?: string | null
          origen_id?: string | null
          origen_tipo?: string | null
          persona_id?: string | null
          persona_ref_id?: string | null
          proyecto_id?: string | null
          referencia?: string | null
          subcategoria?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          categoria_deportiva?: string | null
          categoria_ref_id?: string | null
          created_at?: string
          descripcion?: string
          estado?: string
          fecha?: string
          id?: string
          metodo_pago?: string | null
          monto?: number
          notas?: string | null
          origen_id?: string | null
          origen_tipo?: string | null
          persona_id?: string | null
          persona_ref_id?: string | null
          proyecto_id?: string | null
          referencia?: string | null
          subcategoria?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transacciones_categoria_ref_id_fkey"
            columns: ["categoria_ref_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_persona_ref_id_fkey"
            columns: ["persona_ref_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
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
