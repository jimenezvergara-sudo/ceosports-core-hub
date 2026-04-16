import { useState, useEffect, useCallback } from "react";
import { FileText, Upload, Download, Trash2, FolderOpen, Search, File, FileSpreadsheet, FileImage, Eye } from "lucide-react";
import PageShell from "@/components/shared/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CategoriaDoc {
  id: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
}

interface DocRow {
  id: string;
  nombre: string;
  descripcion: string | null;
  etiqueta: string;
  nombre_archivo: string;
  storage_path: string;
  tipo_mime: string;
  fecha_emision: string | null;
  fecha_vencimiento: string | null;
  notas: string | null;
  created_at: string;
  categoria_documento_id: string | null;
}

const CATEGORIAS_DEFAULT: { nombre: string; descripcion: string; orden: number }[] = [
  { nombre: "Marco Legal", descripcion: "Ley del Deporte (19.712), Ley de Juntas de Vecinos (19.418), SAD (20.019)", orden: 1 },
  { nombre: "Gobierno Corporativo", descripcion: "Acta de Constitución, Estatutos, Certificados de Vigencia y Directorio", orden: 2 },
  { nombre: "Normativa Interna", descripcion: "Reglamento Interno, Manual de Convivencia, Protocolo contra Abuso (Decreto 22)", orden: 3 },
  { nombre: "Registros Oficiales", descripcion: "Libro de Socios, Libro de Actas, Libro de Tesorería", orden: 4 },
  { nombre: "Instructivos y Guías", descripcion: "Protocolos de viajes, guías operativas, manuales de procedimiento", orden: 5 },
  { nombre: "Contratos y Convenios", descripcion: "Contratos con staff, convenios institucionales, acuerdos de patrocinio", orden: 6 },
  { nombre: "Otros", descripcion: "Documentos generales no clasificados", orden: 99 },
];

const fileIcon = (mime: string) => {
  if (mime.includes("pdf")) return <File className="w-5 h-5 text-red-500" />;
  if (mime.includes("word") || mime.includes("document")) return <FileText className="w-5 h-5 text-blue-500" />;
  if (mime.includes("sheet") || mime.includes("excel")) return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
  if (mime.includes("image")) return <FileImage className="w-5 h-5 text-purple-500" />;
  return <File className="w-5 h-5 text-muted-foreground" />;
};

export default function Documentos() {
  const { clubId } = useAuth();
  const [categorias, setCategorias] = useState<CategoriaDoc[]>([]);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState<string>("todas");
  const [busqueda, setBusqueda] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);

  // Upload form state
  const [upNombre, setUpNombre] = useState("");
  const [upDescripcion, setUpDescripcion] = useState("");
  const [upCategoria, setUpCategoria] = useState("");
  const [upEtiqueta, setUpEtiqueta] = useState("documento");
  const [upFile, setUpFile] = useState<File | null>(null);
  const [upLoading, setUpLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!clubId) return;
    setLoading(true);

    const [{ data: cats }, { data: docsData }] = await Promise.all([
      supabase.from("categorias_documento").select("*").eq("club_id", clubId).order("orden"),
      supabase.from("club_documentos").select("*").eq("club_id", clubId).order("created_at", { ascending: false }),
    ]);

    if (cats && cats.length === 0) {
      // Seed default categories
      const inserts = CATEGORIAS_DEFAULT.map(c => ({ ...c, club_id: clubId }));
      const { data: newCats } = await supabase.from("categorias_documento").insert(inserts as any).select();
      setCategorias((newCats as any) || []);
    } else {
      setCategorias((cats as any) || []);
    }

    setDocs((docsData as any) || []);
    setLoading(false);
  }, [clubId]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredDocs = docs.filter(d => {
    if (catFilter !== "todas" && d.categoria_documento_id !== catFilter) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      return d.nombre.toLowerCase().includes(q) || d.nombre_archivo.toLowerCase().includes(q) || (d.descripcion || "").toLowerCase().includes(q);
    }
    return true;
  });

  const handleUpload = async () => {
    if (!upFile || !upNombre || !clubId) {
      toast.error("Selecciona un archivo y nombre.");
      return;
    }
    setUpLoading(true);
    const ext = upFile.name.split(".").pop();
    const path = `club/${clubId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage.from("club-documentos").upload(path, upFile);
    if (upErr) { toast.error("Error al subir: " + upErr.message); setUpLoading(false); return; }

    const { error } = await supabase.from("club_documentos").insert({
      club_id: clubId,
      nombre: upNombre,
      descripcion: upDescripcion || null,
      etiqueta: upEtiqueta,
      nombre_archivo: upFile.name,
      storage_path: path,
      tipo_mime: upFile.type || "application/octet-stream",
      categoria_documento_id: upCategoria || null,
    } as any);

    setUpLoading(false);
    if (error) { toast.error("Error: " + error.message); return; }
    toast.success("Documento subido correctamente");
    resetUploadForm();
    setUploadOpen(false);
    loadData();
  };

  const resetUploadForm = () => {
    setUpNombre(""); setUpDescripcion(""); setUpCategoria(""); setUpEtiqueta("documento"); setUpFile(null);
  };

  const handleDownload = async (doc: DocRow) => {
    const { data } = await supabase.storage.from("club-documentos").createSignedUrl(doc.storage_path, 300);
    if (data?.signedUrl) {
      const a = document.createElement("a");
      a.href = data.signedUrl;
      a.download = doc.nombre_archivo;
      a.click();
    } else {
      toast.error("No se pudo generar enlace de descarga");
    }
  };

  const handlePreview = async (doc: DocRow) => {
    const { data } = await supabase.storage.from("club-documentos").createSignedUrl(doc.storage_path, 300);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  const handleDelete = async (doc: DocRow) => {
    await supabase.storage.from("club-documentos").remove([doc.storage_path]);
    const { error } = await supabase.from("club_documentos").delete().eq("id", doc.id);
    if (error) { toast.error("Error al eliminar"); return; }
    toast.success("Documento eliminado");
    loadData();
  };

  const getCatName = (catId: string | null) => {
    if (!catId) return "Sin categoría";
    return categorias.find(c => c.id === catId)?.nombre || "Sin categoría";
  };

  // Group docs by category for display
  const groupedDocs = categorias.map(cat => ({
    ...cat,
    docs: filteredDocs.filter(d => d.categoria_documento_id === cat.id),
  }));
  const uncategorized = filteredDocs.filter(d => !d.categoria_documento_id);

  return (
    <PageShell
      title="Repositorio Documental"
      description="Marco legal, normativa interna, registros oficiales y documentos del club"
      icon={FileText}
      actions={
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="w-4 h-4" />
              Subir Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Subir Documento</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label>Nombre del documento *</Label>
                <Input placeholder="Ej: Reglamento Interno 2026" value={upNombre} onChange={e => setUpNombre(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Categoría</Label>
                <Select value={upCategoria} onValueChange={setUpCategoria}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                  <SelectContent>
                    {categorias.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Descripción</Label>
                <Textarea placeholder="Detalle opcional..." rows={2} value={upDescripcion} onChange={e => setUpDescripcion(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Archivo *</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.png,.jpeg"
                  onChange={e => setUpFile(e.target.files?.[0] ?? null)}
                />
                {upFile && <p className="text-xs text-muted-foreground">{upFile.name} ({(upFile.size / 1024).toFixed(0)} KB)</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancelar</Button>
              <Button onClick={handleUpload} disabled={upLoading}>
                {upLoading ? "Subiendo..." : "Subir"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar documento..."
            className="pl-9"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las categorías</SelectItem>
            {categorias.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando documentos...</div>
      ) : filteredDocs.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No hay documentos{catFilter !== "todas" ? " en esta categoría" : ""}.</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Sube el primer documento para comenzar.</p>
        </motion.div>
      ) : catFilter !== "todas" ? (
        /* Flat list when filtering by specific category */
        <DocTable docs={filteredDocs} onDownload={handleDownload} onPreview={handlePreview} onDelete={handleDelete} getCatName={getCatName} />
      ) : (
        /* Grouped by category */
        <div className="space-y-6">
          {groupedDocs.filter(g => g.docs.length > 0).map(group => (
            <motion.div key={group.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">{group.nombre}</h3>
                <Badge variant="secondary" className="text-xs">{group.docs.length}</Badge>
                {group.descripcion && <span className="text-xs text-muted-foreground ml-2 hidden md:inline">— {group.descripcion}</span>}
              </div>
              <DocTable docs={group.docs} onDownload={handleDownload} onPreview={handlePreview} onDelete={handleDelete} getCatName={getCatName} showCategory={false} />
            </motion.div>
          ))}
          {uncategorized.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">Sin categoría</h3>
                <Badge variant="secondary" className="text-xs">{uncategorized.length}</Badge>
              </div>
              <DocTable docs={uncategorized} onDownload={handleDownload} onPreview={handlePreview} onDelete={handleDelete} getCatName={getCatName} showCategory={false} />
            </motion.div>
          )}
        </div>
      )}
    </PageShell>
  );
}

function DocTable({ docs, onDownload, onPreview, onDelete, getCatName, showCategory = true }: {
  docs: DocRow[];
  onDownload: (d: DocRow) => void;
  onPreview: (d: DocRow) => void;
  onDelete: (d: DocRow) => void;
  getCatName: (id: string | null) => string;
  showCategory?: boolean;
}) {
  return (
    <div className="glass rounded-xl shadow-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Documento</th>
            {showCategory && <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider hidden md:table-cell">Categoría</th>}
            <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider hidden lg:table-cell">Archivo</th>
            <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider hidden md:table-cell">Fecha</th>
            <th className="text-right p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {docs.map(doc => (
            <tr key={doc.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
              <td className="p-3">
                <div className="flex items-center gap-2">
                  {fileIcon(doc.tipo_mime)}
                  <div>
                    <p className="font-medium text-foreground">{doc.nombre}</p>
                    {doc.descripcion && <p className="text-xs text-muted-foreground line-clamp-1">{doc.descripcion}</p>}
                  </div>
                </div>
              </td>
              {showCategory && <td className="p-3 hidden md:table-cell"><Badge variant="outline" className="text-xs">{getCatName(doc.categoria_documento_id)}</Badge></td>}
              <td className="p-3 hidden lg:table-cell">
                <span className="text-xs text-muted-foreground font-mono">{doc.nombre_archivo}</span>
              </td>
              <td className="p-3 hidden md:table-cell text-xs text-muted-foreground font-mono">
                {new Date(doc.created_at).toLocaleDateString("es-CL")}
              </td>
              <td className="p-3">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onPreview(doc)} title="Ver">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDownload(doc)} title="Descargar">
                    <Download className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
                        <AlertDialogDescription>Se eliminará "{doc.nombre}" permanentemente.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(doc)}>Eliminar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
