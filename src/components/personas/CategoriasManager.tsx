import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Categoria {
  id: string;
  nombre: string;
  rama: string;
}

export default function CategoriasManager({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editRama, setEditRama] = useState("mixto");
  const [newNombre, setNewNombre] = useState("");
  const [newRama, setNewRama] = useState("mixto");
  const [showNew, setShowNew] = useState(false);

  const fetchCats = async () => {
    setLoading(true);
    const { data } = await supabase.from("categorias").select("id, nombre, rama").order("nombre");
    setCategorias((data as unknown as Categoria[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchCats();
  }, [open]);

  const handleAdd = async () => {
    if (!newNombre.trim()) { toast.error("Nombre requerido"); return; }
    const { error } = await supabase.from("categorias").insert({ nombre: newNombre.trim(), rama: newRama } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Categoría creada");
    setNewNombre("");
    setNewRama("mixto");
    setShowNew(false);
    fetchCats();
  };

  const startEdit = (c: Categoria) => {
    setEditingId(c.id);
    setEditNombre(c.nombre);
    setEditRama(c.rama);
  };

  const saveEdit = async () => {
    if (!editNombre.trim() || !editingId) return;
    await supabase.from("categorias").update({ nombre: editNombre.trim(), rama: editRama } as any).eq("id", editingId);
    toast.success("Categoría actualizada");
    setEditingId(null);
    fetchCats();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("categorias").delete().eq("id", id);
    if (error) { toast.error("No se pudo eliminar: " + error.message); return; }
    toast.success("Categoría eliminada");
    fetchCats();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Categorías Deportivas</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
          ) : categorias.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay categorías.</p>
          ) : (
            categorias.map((c) =>
              editingId === c.id ? (
                <div key={c.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                  <Input value={editNombre} onChange={(e) => setEditNombre(e.target.value)} className="flex-1 h-9" />
                  <Select value={editRama} onValueChange={setEditRama}>
                    <SelectTrigger className="w-24 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mixto">Mixto</SelectItem>
                      <SelectItem value="femenino">Femenino</SelectItem>
                      <SelectItem value="masculino">Masculino</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={saveEdit}><Check className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                </div>
              ) : (
                <div key={c.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors group">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{c.nombre}</span>
                    <Badge variant="secondary" className="text-[10px]">{c.rama}</Badge>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              )
            )
          )}
        </div>

        {showNew ? (
          <div className="flex items-center gap-2 p-2 bg-muted/20 rounded-lg border border-border">
            <Input value={newNombre} onChange={(e) => setNewNombre(e.target.value)} placeholder="Nombre" className="flex-1 h-9" />
            <Select value={newRama} onValueChange={setNewRama}>
              <SelectTrigger className="w-24 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mixto">Mixto</SelectItem>
                <SelectItem value="femenino">Femenino</SelectItem>
                <SelectItem value="masculino">Masculino</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="h-9" onClick={handleAdd}>Agregar</Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowNew(false)}><X className="w-4 h-4" /></Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="w-full gap-1" onClick={() => setShowNew(true)}>
            <Plus className="w-4 h-4" />Agregar Categoría
          </Button>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
