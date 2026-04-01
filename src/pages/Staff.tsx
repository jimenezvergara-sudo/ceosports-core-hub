import { useState } from "react";
import { ShieldCheck, Plus, Pencil, Trash2 } from "lucide-react";
import PageShell from "@/components/shared/PageShell";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStaffRoles, usePersonas, useCategorias, personaLabel } from "@/hooks/use-relational-data";

const ROLES_DIRECTIVA = [
  "Presidente",
  "Vicepresidente",
  "Tesorero",
  "Secretario",
];

const ROLES_TECNICO = [
  "Director Técnico",
  "Preparador Físico",
  "Kinesiólogo",
  "Asistente Técnico",
];

const ROLES_OPERATIVO = [
  "Coordinador",
  "Encargado de Finanzas",
  "Estadístico",
];

const ROLES_BASE = [...ROLES_DIRECTIVA, ...ROLES_TECNICO, ...ROLES_OPERATIVO];

export default function Staff() {
  const { roles, loading, refetch } = useStaffRoles();
  const { personas } = usePersonas();
  const { categorias } = useCategorias();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    persona_id: "",
    rol: "",
    rolCustom: "",
    categoria_id: "",
    activo: true,
  });

  const isRolConCategoria = (rol: string) =>
    [...ROLES_TECNICO, "Coordinador"].includes(rol) || (!ROLES_BASE.includes(rol) && rol.toLowerCase().includes("delegado"));


  const openNew = () => {
    setForm({ persona_id: "", rol: "", rolCustom: "", categoria_id: "", activo: true });
    setOpen(true);
  };

  const save = async () => {
    const rolFinal = form.rol === "__custom" ? form.rolCustom.trim() : form.rol;
    if (!form.persona_id || !rolFinal) {
      toast.error("Persona y rol son obligatorios");
      return;
    }

    const { error } = await supabase.from("staff_roles" as any).insert({
      persona_id: form.persona_id,
      rol: rolFinal,
      categoria_id: form.categoria_id || null,
      activo: form.activo,
    } as any);

    if (error) {
      if (error.code === "23505") toast.error("Este rol ya está asignado a esta persona");
      else toast.error(error.message);
      return;
    }
    toast.success("Rol asignado");
    setOpen(false);
    refetch();
  };

  const remove = async (id: string) => {
    await supabase.from("staff_roles" as any).delete().eq("id", id);
    toast.success("Rol eliminado");
    refetch();
  };

  const toggleActivo = async (id: string, activo: boolean) => {
    await supabase.from("staff_roles" as any).update({ activo } as any).eq("id", id);
    refetch();
  };

  // Group by role type
  const directiva = roles.filter((r) => ROLES_DIRECTIVA.includes(r.rol) || r.rol.toLowerCase().startsWith("delegado"));
  const tecnicos = roles.filter((r) => ROLES_TECNICO.includes(r.rol));
  const operativos = roles.filter((r) => ROLES_OPERATIVO.includes(r.rol));
  const otros = roles.filter(
    (r) => !directiva.includes(r) && !tecnicos.includes(r) && !operativos.includes(r)
  );


  const renderSection = (title: string, items: typeof roles) => (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground bg-card border border-border rounded-lg p-4">Sin asignaciones</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {items.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 * i }}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <Badge variant="secondary" className="text-xs">{r.rol}</Badge>
                <div className="flex items-center gap-1">
                  <Switch
                    checked={r.activo}
                    onCheckedChange={(v) => toggleActivo(r.id, v)}
                    className="scale-75"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => remove(r.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-foreground font-semibold text-sm">
                {r.persona_nombre} {r.persona_apellido}
              </p>
              {r.categoria_nombre && (
                <p className="text-xs text-muted-foreground mt-1">
                  Categoría: {r.categoria_nombre}
                </p>
              )}
              {!r.activo && (
                <Badge variant="destructive" className="text-[10px] mt-2">Inactivo</Badge>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <PageShell
      title="Staff del Club"
      description="Roles administrativos, técnicos y operativos"
      icon={ShieldCheck}
      actions={
        <Button className="gap-2" onClick={openNew}>
          <Plus className="w-4 h-4" />
          Asignar Rol
        </Button>
      }
    >
      {loading ? (
        <div className="text-center text-muted-foreground py-12">Cargando...</div>
      ) : (
        <div className="space-y-8">
          {renderSection("Directiva", directiva)}
          {renderSection("Cuerpo Técnico", tecnicos)}
          {renderSection("Operativos", operativos)}
          {otros.length > 0 && renderSection("Otros", otros)}

        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar Rol</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Persona *</Label>
              <Select value={form.persona_id} onValueChange={(v) => setForm({ ...form, persona_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar persona" /></SelectTrigger>
                <SelectContent>
                  {personas.filter((p) => p.tipo_persona !== "jugador").map((p) => (
                    <SelectItem key={p.id} value={p.id}>{personaLabel(p)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Rol *</Label>
              <Select value={form.rol} onValueChange={(v) => setForm({ ...form, rol: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar rol" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__divider_dir" disabled className="text-xs font-bold text-muted-foreground">— Directiva —</SelectItem>
                  {ROLES_DIRECTIVA.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  <SelectItem value="__divider_del" disabled className="text-xs font-bold text-muted-foreground">— Delegados —</SelectItem>
                  <SelectItem value="Delegado de Deportes">Delegado de Deportes</SelectItem>
                  <SelectItem value="Delegado de Infraestructura">Delegado de Infraestructura</SelectItem>
                  <SelectItem value="__divider_tec" disabled className="text-xs font-bold text-muted-foreground">— Cuerpo Técnico —</SelectItem>
                  {ROLES_TECNICO.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  <SelectItem value="__divider_op" disabled className="text-xs font-bold text-muted-foreground">— Operativos —</SelectItem>
                  {ROLES_OPERATIVO.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  <SelectItem value="__divider_custom" disabled className="text-xs font-bold text-muted-foreground">—</SelectItem>
                  <SelectItem value="__custom">Otro (personalizado)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.rol === "__custom" && (
              <div>
                <Label className="text-xs">Nombre del rol</Label>
                <Input
                  value={form.rolCustom}
                  onChange={(e) => setForm({ ...form, rolCustom: e.target.value })}
                  placeholder="Ej: Delegado de Eventos"
                  className="mt-1"
                />
              </div>
            )}
            {(form.rol && isRolConCategoria(form.rol === "__custom" ? form.rolCustom : form.rol)) && (
              <div>
                <Label className="text-xs">Categoría Deportiva</Label>
                <Select value={form.categoria_id} onValueChange={(v) => setForm({ ...form, categoria_id: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch checked={form.activo} onCheckedChange={(v) => setForm({ ...form, activo: v })} />
              <Label className="text-xs">Activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Asignar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
