import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { calcularEdad, calcularCategoria } from "@/types/persona";
import type { Persona } from "@/types/persona";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (personas: Persona[], updated: number) => void;
  existingRuts: string[];
}

interface ImportResult {
  exitosos: number;
  actualizados: number;
  errores: { fila: number; mensaje: string }[];
  personas: Persona[];
}

const TEMPLATE_COLUMNS = [
  "Nombre Jugador", "Apellido Jugador", "RUT Jugador", "Fecha Nacimiento", "Dirección",
  "Nombre Padre", "RUT Padre", "Teléfono Padre", "Correo Padre",
  "Nombre Madre", "RUT Madre", "Teléfono Madre", "Correo Madre",
];

function descargarPlantilla() {
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_COLUMNS, [
    "María", "López", "12.345.678-9", "2013-05-14", "Av. Principal 123",
    "Juan López", "8.765.432-1", "+56912345678", "juan@mail.com",
    "Ana García", "9.876.543-2", "+56987654321", "ana@mail.com",
  ]]);

  const colWidths = TEMPLATE_COLUMNS.map((c) => ({ wch: Math.max(c.length + 2, 18) }));
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
  XLSX.writeFile(wb, "CEO_Sports_Plantilla_Importacion.xlsx");
  toast.success("Plantilla descargada exitosamente");
}

function parsearExcel(data: ArrayBuffer, existingRuts: string[]): ImportResult {
  const wb = XLSX.read(data, { type: "array", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });

  const result: ImportResult = { exitosos: 0, actualizados: 0, errores: [], personas: [] };

  rows.forEach((row, idx) => {
    const fila = idx + 2; // header = 1
    const nombre = String(row["Nombre Jugador"] || "").trim();
    const apellido = String(row["Apellido Jugador"] || "").trim();
    const rut = String(row["RUT Jugador"] || "").trim();
    let fechaRaw = row["Fecha Nacimiento"];

    if (!nombre || !apellido || !rut) {
      result.errores.push({ fila, mensaje: "Faltan campos obligatorios (Nombre, Apellido o RUT)" });
      return;
    }

    let fechaNacimiento = "";
    if (fechaRaw instanceof Date) {
      fechaNacimiento = fechaRaw.toISOString().split("T")[0];
    } else if (typeof fechaRaw === "string" && fechaRaw.trim()) {
      const parsed = new Date(fechaRaw.trim());
      if (isNaN(parsed.getTime())) {
        result.errores.push({ fila, mensaje: `Fecha de nacimiento inválida: "${fechaRaw}"` });
        return;
      }
      fechaNacimiento = parsed.toISOString().split("T")[0];
    } else {
      result.errores.push({ fila, mensaje: "Fecha de Nacimiento vacía o inválida" });
      return;
    }

    const edad = calcularEdad(fechaNacimiento);
    const categoria = calcularCategoria(fechaNacimiento);
    const isUpdate = existingRuts.includes(rut);

    const persona: Persona = {
      id: crypto.randomUUID(),
      nombre, apellido, rut, fechaNacimiento, edad, categoria,
      rama: "Mixto",
      tipo: edad < 18 ? (["Fem"].includes("") ? "Jugadora" : "Jugador") : "Socio",
      estado: "Activo",
      talla: "", tallaUniforme: "", peso: "",
      colegio: "", previsionSalud: "", alergias: "",
      padre: {
        nombre: String(row["Nombre Padre"] || "").trim(), apellido: "",
        rut: String(row["RUT Padre"] || "").trim(),
        telefono: String(row["Teléfono Padre"] || "").trim(),
        email: String(row["Correo Padre"] || "").trim(),
        direccion: String(row["Dirección"] || "").trim(), profesion: "",
      },
      madre: {
        nombre: String(row["Nombre Madre"] || "").trim(), apellido: "",
        rut: String(row["RUT Madre"] || "").trim(),
        telefono: String(row["Teléfono Madre"] || "").trim(),
        email: String(row["Correo Madre"] || "").trim(),
        direccion: String(row["Dirección"] || "").trim(), profesion: "",
      },
      apoderado: { nombre: "", apellido: "", rut: "", telefono: "", email: "", direccion: "", profesion: "" },
      documentos: [],
    };

    result.personas.push(persona);
    if (isUpdate) result.actualizados++;
    else result.exitosos++;
  });

  return result;
}

export default function ImportMasivaDialog({ open, onOpenChange, onImport, existingRuts }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [processing, setProcessing] = useState(false);

  const processFile = useCallback((file: File) => {
    if (!file.name.match(/\.xlsx?$/i)) {
      toast.error("Solo se aceptan archivos Excel (.xlsx, .xls)");
      return;
    }
    setProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as ArrayBuffer;
        const importResult = parsearExcel(data, existingRuts);
        setResult(importResult);
      } catch (err) {
        toast.error("Error al procesar el archivo Excel");
      } finally {
        setProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [existingRuts]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleConfirm = () => {
    if (result && result.personas.length > 0) {
      onImport(result.personas, result.actualizados);
      toast.success(`${result.exitosos} nuevos registros + ${result.actualizados} actualizados`);
    }
    setResult(null);
    onOpenChange(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) setResult(null);
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importación Masiva</DialogTitle>
          <DialogDescription>Carga un archivo Excel con los datos de jugadores para registrarlos automáticamente.</DialogDescription>
        </DialogHeader>

        {/* Download template */}
        <Button variant="secondary" onClick={descargarPlantilla} className="w-full gap-2">
          <Download className="w-4 h-4" />
          Descargar Plantilla Excel
        </Button>

        {/* Drop zone */}
        {!result && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
            }`}
          >
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <FileSpreadsheet className={`w-10 h-10 mx-auto mb-3 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
            <p className="text-sm font-medium text-foreground">
              {processing ? "Procesando..." : "Arrastra tu archivo Excel aquí"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">o haz clic para seleccionar (.xlsx, .xls)</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Resumen de Importación</h4>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span className="text-sm text-foreground">{result.exitosos} registros nuevos</span>
              </div>
              {result.actualizados > 0 && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-sm text-foreground">{result.actualizados} registros a actualizar (RUT existente)</span>
                </div>
              )}
              {result.errores.length > 0 && (
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-foreground">{result.errores.length} errores encontrados</span>
                </div>
              )}
            </div>

            {/* Category breakdown */}
            {result.personas.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(
                  result.personas.reduce((acc, p) => { acc[p.categoria] = (acc[p.categoria] || 0) + 1; return acc; }, {} as Record<string, number>)
                ).map(([cat, count]) => (
                  <Badge key={cat} variant="secondary" className="text-xs">{cat}: {count}</Badge>
                ))}
              </div>
            )}

            {/* Error details */}
            {result.errores.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 max-h-32 overflow-y-auto space-y-1">
                {result.errores.map((err, i) => (
                  <p key={i} className="text-xs text-destructive">Fila {err.fila}: {err.mensaje}</p>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setResult(null)} className="flex-1">Cargar otro archivo</Button>
              <Button onClick={handleConfirm} disabled={result.personas.length === 0} className="flex-1 gap-2">
                <Upload className="w-4 h-4" />
                Confirmar Importación
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
