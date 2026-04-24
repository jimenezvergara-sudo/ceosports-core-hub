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
          club_id: string | null
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
          club_id?: string | null
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
          club_id?: string | null
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
            foreignKeyName: "aprobaciones_compra_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
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
      asamblea_acuerdos: {
        Row: {
          asamblea_id: string
          club_id: string | null
          created_at: string
          descripcion: string
          estado: string
          fecha_limite: string | null
          id: string
          notas_avance: string | null
          numero: number
          observaciones: string | null
          prioridad: string
          responsable_id: string | null
          updated_at: string
        }
        Insert: {
          asamblea_id: string
          club_id?: string | null
          created_at?: string
          descripcion: string
          estado?: string
          fecha_limite?: string | null
          id?: string
          notas_avance?: string | null
          numero?: number
          observaciones?: string | null
          prioridad?: string
          responsable_id?: string | null
          updated_at?: string
        }
        Update: {
          asamblea_id?: string
          club_id?: string | null
          created_at?: string
          descripcion?: string
          estado?: string
          fecha_limite?: string | null
          id?: string
          notas_avance?: string | null
          numero?: number
          observaciones?: string | null
          prioridad?: string
          responsable_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asamblea_acuerdos_asamblea_id_fkey"
            columns: ["asamblea_id"]
            isOneToOne: false
            referencedRelation: "asambleas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asamblea_acuerdos_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asamblea_acuerdos_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      asamblea_asistencia: {
        Row: {
          asamblea_id: string
          club_id: string | null
          created_at: string
          hora_llegada: string | null
          id: string
          observaciones: string | null
          persona_id: string
          presente: boolean
          representacion: string | null
        }
        Insert: {
          asamblea_id: string
          club_id?: string | null
          created_at?: string
          hora_llegada?: string | null
          id?: string
          observaciones?: string | null
          persona_id: string
          presente?: boolean
          representacion?: string | null
        }
        Update: {
          asamblea_id?: string
          club_id?: string | null
          created_at?: string
          hora_llegada?: string | null
          id?: string
          observaciones?: string | null
          persona_id?: string
          presente?: boolean
          representacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asamblea_asistencia_asamblea_id_fkey"
            columns: ["asamblea_id"]
            isOneToOne: false
            referencedRelation: "asambleas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asamblea_asistencia_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asamblea_asistencia_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      asambleas: {
        Row: {
          acta_nombre_archivo: string | null
          acta_storage_path: string | null
          club_id: string | null
          created_at: string
          descripcion: string | null
          estado: string
          fecha: string
          hora_fin: string | null
          hora_inicio: string | null
          id: string
          lugar: string | null
          observaciones: string | null
          quorum_presente: number | null
          quorum_requerido: number | null
          tabla_contenido: string | null
          tabla_nombre_archivo: string | null
          tabla_storage_path: string | null
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          acta_nombre_archivo?: string | null
          acta_storage_path?: string | null
          club_id?: string | null
          created_at?: string
          descripcion?: string | null
          estado?: string
          fecha: string
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          lugar?: string | null
          observaciones?: string | null
          quorum_presente?: number | null
          quorum_requerido?: number | null
          tabla_contenido?: string | null
          tabla_nombre_archivo?: string | null
          tabla_storage_path?: string | null
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          acta_nombre_archivo?: string | null
          acta_storage_path?: string | null
          club_id?: string | null
          created_at?: string
          descripcion?: string | null
          estado?: string
          fecha?: string
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          lugar?: string | null
          observaciones?: string | null
          quorum_presente?: number | null
          quorum_requerido?: number | null
          tabla_contenido?: string | null
          tabla_nombre_archivo?: string | null
          tabla_storage_path?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asambleas_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      asistencia_entrenamiento: {
        Row: {
          club_id: string | null
          created_at: string
          estado: string
          id: string
          observaciones: string | null
          persona_id: string
          sesion_id: string
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          estado?: string
          id?: string
          observaciones?: string | null
          persona_id: string
          sesion_id: string
        }
        Update: {
          club_id?: string | null
          created_at?: string
          estado?: string
          id?: string
          observaciones?: string | null
          persona_id?: string
          sesion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asistencia_entrenamiento_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistencia_entrenamiento_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistencia_entrenamiento_sesion_id_fkey"
            columns: ["sesion_id"]
            isOneToOne: false
            referencedRelation: "sesiones_entrenamiento"
            referencedColumns: ["id"]
          },
        ]
      }
      beneficios_cuota: {
        Row: {
          activo: boolean
          categoria_id: string | null
          club_id: string | null
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
          club_id?: string | null
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
          club_id?: string | null
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
            foreignKeyName: "beneficios_cuota_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
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
          club_id: string | null
          created_at: string
          id: string
          nombre: string
          rama: string
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          id?: string
          nombre: string
          rama?: string
        }
        Update: {
          club_id?: string | null
          created_at?: string
          id?: string
          nombre?: string
          rama?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_documento: {
        Row: {
          club_id: string | null
          created_at: string
          descripcion: string | null
          icono: string | null
          id: string
          nombre: string
          orden: number | null
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          descripcion?: string | null
          icono?: string | null
          id?: string
          nombre: string
          orden?: number | null
        }
        Update: {
          club_id?: string | null
          created_at?: string
          descripcion?: string | null
          icono?: string | null
          id?: string
          nombre?: string
          orden?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categorias_documento_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      centros_costo: {
        Row: {
          activo: boolean
          club_id: string | null
          codigo: string | null
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          club_id?: string | null
          codigo?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          club_id?: string | null
          codigo?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "centros_costo_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_documentos: {
        Row: {
          categoria_documento_id: string | null
          club_id: string
          created_at: string
          descripcion: string | null
          etiqueta: string
          fecha_emision: string | null
          fecha_vencimiento: string | null
          id: string
          nombre: string
          nombre_archivo: string
          notas: string | null
          storage_path: string
          tipo_mime: string
          updated_at: string
        }
        Insert: {
          categoria_documento_id?: string | null
          club_id: string
          created_at?: string
          descripcion?: string | null
          etiqueta?: string
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string
          nombre: string
          nombre_archivo: string
          notas?: string | null
          storage_path: string
          tipo_mime: string
          updated_at?: string
        }
        Update: {
          categoria_documento_id?: string | null
          club_id?: string
          created_at?: string
          descripcion?: string | null
          etiqueta?: string
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string
          nombre?: string
          nombre_archivo?: string
          notas?: string | null
          storage_path?: string
          tipo_mime?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_documentos_categoria_documento_id_fkey"
            columns: ["categoria_documento_id"]
            isOneToOne: false
            referencedRelation: "categorias_documento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_documentos_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_usuarios: {
        Row: {
          activo: boolean
          club_id: string
          created_at: string
          id: string
          rol_sistema: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activo?: boolean
          club_id: string
          created_at?: string
          id?: string
          rol_sistema?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activo?: boolean
          club_id?: string
          created_at?: string
          id?: string
          rol_sistema?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_usuarios_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          activo: boolean
          ciudad: string | null
          contacto_cobranza_email: string | null
          contacto_cobranza_nombre: string | null
          contacto_cobranza_telefono: string | null
          created_at: string
          deporte: string
          descripcion: string | null
          direccion: string | null
          email: string | null
          fecha_fundacion: string | null
          id: string
          logo_url: string | null
          municipalidad: string | null
          nombre: string
          numero_registro: string | null
          plantilla_cobranza_whatsapp: string | null
          redes_sociales: Json | null
          region: string | null
          representante_legal: string | null
          rut: string | null
          sitio_web: string | null
          telefono: string | null
          tipo_organizacion: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          ciudad?: string | null
          contacto_cobranza_email?: string | null
          contacto_cobranza_nombre?: string | null
          contacto_cobranza_telefono?: string | null
          created_at?: string
          deporte?: string
          descripcion?: string | null
          direccion?: string | null
          email?: string | null
          fecha_fundacion?: string | null
          id?: string
          logo_url?: string | null
          municipalidad?: string | null
          nombre: string
          numero_registro?: string | null
          plantilla_cobranza_whatsapp?: string | null
          redes_sociales?: Json | null
          region?: string | null
          representante_legal?: string | null
          rut?: string | null
          sitio_web?: string | null
          telefono?: string | null
          tipo_organizacion?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          ciudad?: string | null
          contacto_cobranza_email?: string | null
          contacto_cobranza_nombre?: string | null
          contacto_cobranza_telefono?: string | null
          created_at?: string
          deporte?: string
          descripcion?: string | null
          direccion?: string | null
          email?: string | null
          fecha_fundacion?: string | null
          id?: string
          logo_url?: string | null
          municipalidad?: string | null
          nombre?: string
          numero_registro?: string | null
          plantilla_cobranza_whatsapp?: string | null
          redes_sociales?: Json | null
          region?: string | null
          representante_legal?: string | null
          rut?: string | null
          sitio_web?: string | null
          telefono?: string | null
          tipo_organizacion?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cron_logs: {
        Row: {
          clubes_procesados: number
          cuotas_generadas: number
          cuotas_vencidas_actualizadas: number
          detalle: Json | null
          ejecutado_en: string
          error: string | null
          id: string
          job_name: string
          resultado: string
        }
        Insert: {
          clubes_procesados?: number
          cuotas_generadas?: number
          cuotas_vencidas_actualizadas?: number
          detalle?: Json | null
          ejecutado_en?: string
          error?: string | null
          id?: string
          job_name: string
          resultado?: string
        }
        Update: {
          clubes_procesados?: number
          cuotas_generadas?: number
          cuotas_vencidas_actualizadas?: number
          detalle?: Json | null
          ejecutado_en?: string
          error?: string | null
          id?: string
          job_name?: string
          resultado?: string
        }
        Relationships: []
      }
      cuota_configuraciones: {
        Row: {
          activa: boolean
          categoria_id: string | null
          club_id: string | null
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
          club_id?: string | null
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
          club_id?: string | null
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
          {
            foreignKeyName: "cuota_configuraciones_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      cuotas: {
        Row: {
          apoderado_id: string | null
          categoria_id: string | null
          club_id: string | null
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
          club_id?: string | null
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
          club_id?: string | null
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
            foreignKeyName: "cuotas_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
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
          club_id: string | null
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
          club_id?: string | null
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
          club_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "documentos_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      ejecuciones_compra: {
        Row: {
          club_id: string | null
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
          club_id?: string | null
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
          club_id?: string | null
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
            foreignKeyName: "ejecuciones_compra_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
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
      evaluaciones_proveedor: {
        Row: {
          club_id: string | null
          comentario: string | null
          created_at: string
          id: string
          proveedor_id: string
          puntaje_calidad: number
          puntaje_plazo: number
          puntaje_precio: number
          solicitud_id: string | null
        }
        Insert: {
          club_id?: string | null
          comentario?: string | null
          created_at?: string
          id?: string
          proveedor_id: string
          puntaje_calidad?: number
          puntaje_plazo?: number
          puntaje_precio?: number
          solicitud_id?: string | null
        }
        Update: {
          club_id?: string | null
          comentario?: string | null
          created_at?: string
          id?: string
          proveedor_id?: string
          puntaje_calidad?: number
          puntaje_plazo?: number
          puntaje_precio?: number
          solicitud_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluaciones_proveedor_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_proveedor_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_proveedor_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes_compra"
            referencedColumns: ["id"]
          },
        ]
      }
      gestiones_cobranza: {
        Row: {
          club_id: string
          created_at: string
          fecha_gestion: string
          id: string
          nota: string | null
          realizado_por: string | null
          resultado: string | null
          suscripcion_id: string | null
          tipo_gestion: string
        }
        Insert: {
          club_id: string
          created_at?: string
          fecha_gestion?: string
          id?: string
          nota?: string | null
          realizado_por?: string | null
          resultado?: string | null
          suscripcion_id?: string | null
          tipo_gestion?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          fecha_gestion?: string
          id?: string
          nota?: string | null
          realizado_por?: string | null
          resultado?: string | null
          suscripcion_id?: string | null
          tipo_gestion?: string
        }
        Relationships: [
          {
            foreignKeyName: "gestiones_cobranza_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gestiones_cobranza_suscripcion_id_fkey"
            columns: ["suscripcion_id"]
            isOneToOne: false
            referencedRelation: "suscripciones_club"
            referencedColumns: ["id"]
          },
        ]
      }
      historial_compra: {
        Row: {
          accion: string
          club_id: string | null
          created_at: string
          detalle: string | null
          id: string
          responsable: string
          responsable_id: string | null
          solicitud_id: string
        }
        Insert: {
          accion: string
          club_id?: string | null
          created_at?: string
          detalle?: string | null
          id?: string
          responsable: string
          responsable_id?: string | null
          solicitud_id: string
        }
        Update: {
          accion?: string
          club_id?: string | null
          created_at?: string
          detalle?: string | null
          id?: string
          responsable?: string
          responsable_id?: string | null
          solicitud_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historial_compra_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
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
      leads_comerciales: {
        Row: {
          ciudad: string | null
          club_convertido_id: string | null
          contacto_email: string | null
          contacto_nombre: string | null
          contacto_telefono: string | null
          created_at: string
          deporte: string | null
          estado: string
          fecha_ultimo_contacto: string | null
          id: string
          nombre_entidad: string
          notas: string | null
          orden: number
          plan_interes_id: string | null
          updated_at: string
        }
        Insert: {
          ciudad?: string | null
          club_convertido_id?: string | null
          contacto_email?: string | null
          contacto_nombre?: string | null
          contacto_telefono?: string | null
          created_at?: string
          deporte?: string | null
          estado?: string
          fecha_ultimo_contacto?: string | null
          id?: string
          nombre_entidad: string
          notas?: string | null
          orden?: number
          plan_interes_id?: string | null
          updated_at?: string
        }
        Update: {
          ciudad?: string | null
          club_convertido_id?: string | null
          contacto_email?: string | null
          contacto_nombre?: string | null
          contacto_telefono?: string | null
          created_at?: string
          deporte?: string | null
          estado?: string
          fecha_ultimo_contacto?: string | null
          id?: string
          nombre_entidad?: string
          notas?: string | null
          orden?: number
          plan_interes_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_comerciales_club_convertido_id_fkey"
            columns: ["club_convertido_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_comerciales_plan_interes_id_fkey"
            columns: ["plan_interes_id"]
            isOneToOne: false
            referencedRelation: "planes_plataforma"
            referencedColumns: ["id"]
          },
        ]
      }
      libro_socios: {
        Row: {
          club_id: string
          created_at: string
          estado: string
          fecha_ingreso: string
          fecha_retiro: string | null
          id: string
          numero_socio: number | null
          observaciones: string | null
          persona_id: string
          tipo_socio: string
          updated_at: string
        }
        Insert: {
          club_id: string
          created_at?: string
          estado?: string
          fecha_ingreso?: string
          fecha_retiro?: string | null
          id?: string
          numero_socio?: number | null
          observaciones?: string | null
          persona_id: string
          tipo_socio?: string
          updated_at?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          estado?: string
          fecha_ingreso?: string
          fecha_retiro?: string | null
          id?: string
          numero_socio?: number | null
          observaciones?: string | null
          persona_id?: string
          tipo_socio?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "libro_socios_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "libro_socios_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      mediciones_biometricas: {
        Row: {
          alcance: number | null
          club_id: string | null
          created_at: string
          envergadura: number | null
          fecha_medicion: string
          id: string
          observaciones: string | null
          persona_id: string
          peso: number | null
          talla: number | null
          talla_madre: number | null
          talla_padre: number | null
        }
        Insert: {
          alcance?: number | null
          club_id?: string | null
          created_at?: string
          envergadura?: number | null
          fecha_medicion?: string
          id?: string
          observaciones?: string | null
          persona_id: string
          peso?: number | null
          talla?: number | null
          talla_madre?: number | null
          talla_padre?: number | null
        }
        Update: {
          alcance?: number | null
          club_id?: string | null
          created_at?: string
          envergadura?: number | null
          fecha_medicion?: string
          id?: string
          observaciones?: string | null
          persona_id?: string
          peso?: number | null
          talla?: number | null
          talla_madre?: number | null
          talla_padre?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mediciones_biometricas_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mediciones_biometricas_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      niveles_aprobacion: {
        Row: {
          activo: boolean
          club_id: string | null
          created_at: string
          descripcion: string | null
          id: string
          monto_maximo: number | null
          monto_minimo: number
          roles_autorizados: string[]
          updated_at: string
        }
        Insert: {
          activo?: boolean
          club_id?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          monto_maximo?: number | null
          monto_minimo?: number
          roles_autorizados: string[]
          updated_at?: string
        }
        Update: {
          activo?: boolean
          club_id?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          monto_maximo?: number | null
          monto_minimo?: number
          roles_autorizados?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "niveles_aprobacion_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones_admin: {
        Row: {
          club_id: string
          created_at: string
          id: string
          leida: boolean
          mensaje: string
          metadata: Json | null
          read_at: string | null
          severidad: string
          tipo: string
          titulo: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          leida?: boolean
          mensaje: string
          metadata?: Json | null
          read_at?: string | null
          severidad?: string
          tipo: string
          titulo: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          leida?: boolean
          mensaje?: string
          metadata?: Json | null
          read_at?: string | null
          severidad?: string
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      pagos_cuotas: {
        Row: {
          club_id: string | null
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
          club_id?: string | null
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
          club_id?: string | null
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
            foreignKeyName: "pagos_cuotas_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
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
      pagos_plataforma: {
        Row: {
          club_id: string
          comprobante_path: string | null
          created_at: string
          estado: string
          fecha_pago: string
          id: string
          metodo: string
          moneda: string
          monto: number
          notas: string | null
          periodo_desde: string | null
          periodo_hasta: string | null
          plan_id: string | null
          referencia: string | null
          registrado_por: string | null
          suscripcion_id: string | null
        }
        Insert: {
          club_id: string
          comprobante_path?: string | null
          created_at?: string
          estado?: string
          fecha_pago?: string
          id?: string
          metodo?: string
          moneda?: string
          monto: number
          notas?: string | null
          periodo_desde?: string | null
          periodo_hasta?: string | null
          plan_id?: string | null
          referencia?: string | null
          registrado_por?: string | null
          suscripcion_id?: string | null
        }
        Update: {
          club_id?: string
          comprobante_path?: string | null
          created_at?: string
          estado?: string
          fecha_pago?: string
          id?: string
          metodo?: string
          moneda?: string
          monto?: number
          notas?: string | null
          periodo_desde?: string | null
          periodo_hasta?: string | null
          plan_id?: string | null
          referencia?: string | null
          registrado_por?: string | null
          suscripcion_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagos_plataforma_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_plataforma_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "planes_plataforma"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_plataforma_suscripcion_id_fkey"
            columns: ["suscripcion_id"]
            isOneToOne: false
            referencedRelation: "suscripciones_club"
            referencedColumns: ["id"]
          },
        ]
      }
      permisos_modulo: {
        Row: {
          club_id: string
          created_at: string
          id: string
          modulo: string
          puede_editar: boolean
          puede_eliminar: boolean
          puede_ver: boolean
          rol_staff: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          modulo: string
          puede_editar?: boolean
          puede_eliminar?: boolean
          puede_ver?: boolean
          rol_staff: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          modulo?: string
          puede_editar?: boolean
          puede_eliminar?: boolean
          puede_ver?: boolean
          rol_staff?: string
        }
        Relationships: [
          {
            foreignKeyName: "permisos_modulo_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      persona_categoria: {
        Row: {
          categoria_id: string
          club_id: string | null
          created_at: string
          id: string
          persona_id: string
        }
        Insert: {
          categoria_id: string
          club_id?: string | null
          created_at?: string
          id?: string
          persona_id: string
        }
        Update: {
          categoria_id?: string
          club_id?: string | null
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
            foreignKeyName: "persona_categoria_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
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
      persona_detalle: {
        Row: {
          alergias: string | null
          apoderado_apellido: string | null
          apoderado_direccion: string | null
          apoderado_email: string | null
          apoderado_nombre: string | null
          apoderado_profesion: string | null
          apoderado_rut: string | null
          apoderado_telefono: string | null
          club_id: string | null
          colegio: string | null
          created_at: string
          direccion: string | null
          id: string
          madre_apellido: string | null
          madre_direccion: string | null
          madre_email: string | null
          madre_nombre: string | null
          madre_profesion: string | null
          madre_rut: string | null
          madre_telefono: string | null
          padre_apellido: string | null
          padre_direccion: string | null
          padre_email: string | null
          padre_nombre: string | null
          padre_profesion: string | null
          padre_rut: string | null
          padre_telefono: string | null
          persona_id: string
          peso: string | null
          prevision_salud: string | null
          talla: string | null
          talla_uniforme: string | null
          updated_at: string
        }
        Insert: {
          alergias?: string | null
          apoderado_apellido?: string | null
          apoderado_direccion?: string | null
          apoderado_email?: string | null
          apoderado_nombre?: string | null
          apoderado_profesion?: string | null
          apoderado_rut?: string | null
          apoderado_telefono?: string | null
          club_id?: string | null
          colegio?: string | null
          created_at?: string
          direccion?: string | null
          id?: string
          madre_apellido?: string | null
          madre_direccion?: string | null
          madre_email?: string | null
          madre_nombre?: string | null
          madre_profesion?: string | null
          madre_rut?: string | null
          madre_telefono?: string | null
          padre_apellido?: string | null
          padre_direccion?: string | null
          padre_email?: string | null
          padre_nombre?: string | null
          padre_profesion?: string | null
          padre_rut?: string | null
          padre_telefono?: string | null
          persona_id: string
          peso?: string | null
          prevision_salud?: string | null
          talla?: string | null
          talla_uniforme?: string | null
          updated_at?: string
        }
        Update: {
          alergias?: string | null
          apoderado_apellido?: string | null
          apoderado_direccion?: string | null
          apoderado_email?: string | null
          apoderado_nombre?: string | null
          apoderado_profesion?: string | null
          apoderado_rut?: string | null
          apoderado_telefono?: string | null
          club_id?: string | null
          colegio?: string | null
          created_at?: string
          direccion?: string | null
          id?: string
          madre_apellido?: string | null
          madre_direccion?: string | null
          madre_email?: string | null
          madre_nombre?: string | null
          madre_profesion?: string | null
          madre_rut?: string | null
          madre_telefono?: string | null
          padre_apellido?: string | null
          padre_direccion?: string | null
          padre_email?: string | null
          padre_nombre?: string | null
          padre_profesion?: string | null
          padre_rut?: string | null
          padre_telefono?: string | null
          persona_id?: string
          peso?: string | null
          prevision_salud?: string | null
          talla?: string | null
          talla_uniforme?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "persona_detalle_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "persona_detalle_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: true
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      persona_relaciones: {
        Row: {
          club_id: string | null
          created_at: string
          id: string
          persona_id: string
          relacionado_id: string
          tipo_relacion: string
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          id?: string
          persona_id: string
          relacionado_id: string
          tipo_relacion?: string
        }
        Update: {
          club_id?: string | null
          created_at?: string
          id?: string
          persona_id?: string
          relacionado_id?: string
          tipo_relacion?: string
        }
        Relationships: [
          {
            foreignKeyName: "persona_relaciones_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
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
          club_id: string | null
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
          club_id?: string | null
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
          club_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "personas_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      planes_plataforma: {
        Row: {
          activo: boolean
          caracteristicas: Json | null
          created_at: string
          descripcion: string | null
          id: string
          limite_clubes: number | null
          limite_usuarios: number | null
          moneda: string
          nombre: string
          orden: number
          precio_anual: number
          precio_mensual: number
          updated_at: string
        }
        Insert: {
          activo?: boolean
          caracteristicas?: Json | null
          created_at?: string
          descripcion?: string | null
          id?: string
          limite_clubes?: number | null
          limite_usuarios?: number | null
          moneda?: string
          nombre: string
          orden?: number
          precio_anual?: number
          precio_mensual?: number
          updated_at?: string
        }
        Update: {
          activo?: boolean
          caracteristicas?: Json | null
          created_at?: string
          descripcion?: string | null
          id?: string
          limite_clubes?: number | null
          limite_usuarios?: number | null
          moneda?: string
          nombre?: string
          orden?: number
          precio_anual?: number
          precio_mensual?: number
          updated_at?: string
        }
        Relationships: []
      }
      platform_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["platform_role"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      proveedores: {
        Row: {
          activo: boolean
          club_id: string | null
          created_at: string
          direccion: string | null
          email: string | null
          id: string
          nombre: string
          observaciones: string | null
          rut: string | null
          sitio_web: string | null
          telefono: string | null
          tipo_servicio: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          club_id?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre: string
          observaciones?: string | null
          rut?: string | null
          sitio_web?: string | null
          telefono?: string | null
          tipo_servicio?: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          club_id?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre?: string
          observaciones?: string | null
          rut?: string | null
          sitio_web?: string | null
          telefono?: string | null
          tipo_servicio?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proveedores_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      proyectos: {
        Row: {
          club_id: string | null
          created_at: string
          descripcion: string | null
          estado: string
          fecha_fin: string | null
          fecha_inicio: string | null
          fuente_financiamiento: string | null
          id: string
          nombre: string
          presupuesto: number
          responsable_id: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          descripcion?: string | null
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          fuente_financiamiento?: string | null
          id?: string
          nombre: string
          presupuesto?: number
          responsable_id?: string | null
          tipo?: string
          updated_at?: string
        }
        Update: {
          club_id?: string | null
          created_at?: string
          descripcion?: string | null
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          fuente_financiamiento?: string | null
          id?: string
          nombre?: string
          presupuesto?: number
          responsable_id?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proyectos_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyectos_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliaciones_banco: {
        Row: {
          banco_detectado: string | null
          club_id: string
          created_at: string
          cuotas_conciliadas: number
          detalle: Json | null
          ejecutado_por: string | null
          id: string
          identificados_auto: number
          monto_conciliado: number
          no_identificados: number
          nombre_archivo: string
          posibles_coincidencias: number
          total_movimientos: number
        }
        Insert: {
          banco_detectado?: string | null
          club_id: string
          created_at?: string
          cuotas_conciliadas?: number
          detalle?: Json | null
          ejecutado_por?: string | null
          id?: string
          identificados_auto?: number
          monto_conciliado?: number
          no_identificados?: number
          nombre_archivo: string
          posibles_coincidencias?: number
          total_movimientos?: number
        }
        Update: {
          banco_detectado?: string | null
          club_id?: string
          created_at?: string
          cuotas_conciliadas?: number
          detalle?: Json | null
          ejecutado_por?: string | null
          id?: string
          identificados_auto?: number
          monto_conciliado?: number
          no_identificados?: number
          nombre_archivo?: string
          posibles_coincidencias?: number
          total_movimientos?: number
        }
        Relationships: [
          {
            foreignKeyName: "reconciliaciones_banco_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_test_deportivo: {
        Row: {
          club_id: string | null
          created_at: string
          fecha_ejecucion: string
          id: string
          observaciones: string | null
          persona_id: string
          tipo_test_id: string
          valor: number
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          fecha_ejecucion?: string
          id?: string
          observaciones?: string | null
          persona_id: string
          tipo_test_id: string
          valor: number
        }
        Update: {
          club_id?: string | null
          created_at?: string
          fecha_ejecucion?: string
          id?: string
          observaciones?: string | null
          persona_id?: string
          tipo_test_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "registros_test_deportivo_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_test_deportivo_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_test_deportivo_tipo_test_id_fkey"
            columns: ["tipo_test_id"]
            isOneToOne: false
            referencedRelation: "tipos_test_deportivo"
            referencedColumns: ["id"]
          },
        ]
      }
      rendiciones_compra: {
        Row: {
          club_id: string | null
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
          club_id?: string | null
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
          club_id?: string | null
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
            foreignKeyName: "rendiciones_compra_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
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
      sesiones_entrenamiento: {
        Row: {
          categoria_id: string | null
          club_id: string | null
          created_at: string
          fecha: string
          hora_fin: string
          hora_inicio: string
          id: string
          notas: string | null
          updated_at: string
        }
        Insert: {
          categoria_id?: string | null
          club_id?: string | null
          created_at?: string
          fecha: string
          hora_fin: string
          hora_inicio: string
          id?: string
          notas?: string | null
          updated_at?: string
        }
        Update: {
          categoria_id?: string | null
          club_id?: string | null
          created_at?: string
          fecha?: string
          hora_fin?: string
          hora_inicio?: string
          id?: string
          notas?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sesiones_entrenamiento_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesiones_entrenamiento_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
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
          club_id: string | null
          created_at: string
          descripcion: string
          estado: string
          fecha_requerida: string | null
          id: string
          justificacion: string | null
          monto_estimado: number
          prioridad: string
          proveedor_id: string | null
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
          club_id?: string | null
          created_at?: string
          descripcion: string
          estado?: string
          fecha_requerida?: string | null
          id?: string
          justificacion?: string | null
          monto_estimado: number
          prioridad?: string
          proveedor_id?: string | null
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
          club_id?: string | null
          created_at?: string
          descripcion?: string
          estado?: string
          fecha_requerida?: string | null
          id?: string
          justificacion?: string | null
          monto_estimado?: number
          prioridad?: string
          proveedor_id?: string | null
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
            foreignKeyName: "solicitudes_compra_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_compra_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
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
          club_id: string | null
          created_at: string
          id: string
          persona_id: string
          rol: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          categoria_id?: string | null
          club_id?: string | null
          created_at?: string
          id?: string
          persona_id: string
          rol: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          categoria_id?: string | null
          club_id?: string | null
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
            foreignKeyName: "staff_roles_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
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
      suscripciones_club: {
        Row: {
          ciclo_facturacion: string
          club_id: string
          created_at: string
          email_contacto: string | null
          estado: string
          fecha_inicio: string
          fecha_vencimiento: string | null
          id: string
          notas: string | null
          plan_id: string | null
          responsable_pago: string | null
          rut_facturacion: string | null
          trial_hasta: string | null
          updated_at: string
        }
        Insert: {
          ciclo_facturacion?: string
          club_id: string
          created_at?: string
          email_contacto?: string | null
          estado?: string
          fecha_inicio?: string
          fecha_vencimiento?: string | null
          id?: string
          notas?: string | null
          plan_id?: string | null
          responsable_pago?: string | null
          rut_facturacion?: string | null
          trial_hasta?: string | null
          updated_at?: string
        }
        Update: {
          ciclo_facturacion?: string
          club_id?: string
          created_at?: string
          email_contacto?: string | null
          estado?: string
          fecha_inicio?: string
          fecha_vencimiento?: string | null
          id?: string
          notas?: string | null
          plan_id?: string | null
          responsable_pago?: string | null
          rut_facturacion?: string | null
          trial_hasta?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suscripciones_club_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: true
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suscripciones_club_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "planes_plataforma"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_test_deportivo: {
        Row: {
          activo: boolean
          categoria: string
          club_id: string | null
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          unidad_medida: string
        }
        Insert: {
          activo?: boolean
          categoria?: string
          club_id?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          unidad_medida?: string
        }
        Update: {
          activo?: boolean
          categoria?: string
          club_id?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          unidad_medida?: string
        }
        Relationships: [
          {
            foreignKeyName: "tipos_test_deportivo_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      transacciones: {
        Row: {
          categoria: string
          categoria_deportiva: string | null
          categoria_ref_id: string | null
          club_id: string | null
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
          club_id?: string | null
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
          club_id?: string | null
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
            foreignKeyName: "transacciones_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
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
      get_user_club_role: {
        Args: { _club_id: string; _user_id: string }
        Returns: string
      }
      has_platform_role: {
        Args: {
          _role: Database["public"]["Enums"]["platform_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      user_belongs_to_club: {
        Args: { _club_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      platform_role: "super_admin" | "support"
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
      platform_role: ["super_admin", "support"],
    },
  },
} as const
