import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { User, Users, HeartPulse, Save } from "lucide-react";
import { calcularEdad, calcularCategoria, requiereTutor } from "@/types/persona";
import type { Persona } from "@/types/persona";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (persona: Persona) => void;
}

const familiarVacio = { nombre: "", apellido: "", rut: "", telefono: "", email: "", direccion: "", profesion: "" };

export default function NuevaPersonaDialog({ open, onOpenChange, onSave }: Props) {
  const [form, setForm] = useState({
    nombre: "", apellido: "", rut: "", fechaNacimiento: "", direccion: "",
    rama: "Masc" as "Masc" | "Fem" | "Mixto",
    tipo: "Jugador" as "Jugador" | "Jugadora" | "Socio" | "Socia",
    talla: "", tallaUniforme: "", peso: "", colegio: "", previsionSalud: "", alergias: "",
    padreNombre: "", padreApellido: "", padreRut: "", padreTelefono: "", padreEmail: "", padreDireccion: "", padreProfesion: "",
    madreNombre: "", madreApellido: "", madreRut: "", madreTelefono: "", madreEmail: "", madreDireccion: "", madreProfesion: "",
    apoderadoNombre: "", apoderadoApellido: "", apoderadoRut: "", apoderadoTelefono: "", apoderadoEmail: "", apoderadoDireccion: "", apoderadoProfesion: "",
  });

  const edad = form.fechaNacimiento ? calcularEdad(form.fechaNacimiento) : null;
  const categoria = form.fechaNacimiento ? calcularCategoria(form.fechaNacimiento) : null;
  const necesitaTutor = categoria ? requiereTutor(categoria) : false;

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    if (!form.nombre.trim() || !form.apellido.trim() || !form.rut.trim() || !form.fechaNacimiento) {
      toast.error("Completa los campos obligatorios: Nombre, Apellido, RUT y Fecha de Nacimiento");
      return;
    }
    if (necesitaTutor && !form.apoderadoNombre.trim()) {
      toast.error("Las categorías Escuelita, U9 y U11 requieren un Apoderado/Tutor");
      return;
    }

    const persona: Persona = {
      id: crypto.randomUUID(),
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      rut: form.rut.trim(),
      fechaNacimiento: form.fechaNacimiento,
      edad: edad!,
      categoria: categoria!,
      rama: form.rama,
      tipo: form.tipo,
      estado: "Activo",
      talla: form.talla, tallaUniforme: form.tallaUniforme, peso: form.peso,
      colegio: form.colegio, previsionSalud: form.previsionSalud, alergias: form.alergias,
      padre: { nombre: form.padreNombre, apellido: form.padreApellido, rut: form.padreRut, telefono: form.padreTelefono, email: form.padreEmail, direccion: form.padreDireccion, profesion: form.padreProfesion },
      madre: { nombre: form.madreNombre, apellido: form.madreApellido, rut: form.madreRut, telefono: form.madreTelefono, email: form.madreEmail, direccion: form.madreDireccion, profesion: form.madreProfesion },
      apoderado: { nombre: form.apoderadoNombre, apellido: form.apoderadoApellido, rut: form.apoderadoRut, telefono: form.apoderadoTelefono, email: form.apoderadoEmail, direccion: form.apoderadoDireccion, profesion: form.apoderadoProfesion },
      documentos: [],
    };
    onSave(persona);
    onOpenChange(false);
    toast.success(`${persona.nombre} ${persona.apellido} registrado/a exitosamente`);
    setForm({
      nombre: "", apellido: "", rut: "", fechaNacimiento: "", direccion: "",
      rama: "Masc", tipo: "Jugador",
      talla: "", tallaUniforme: "", peso: "", colegio: "", previsionSalud: "", alergias: "",
      padreNombre: "", padreApellido: "", padreRut: "", padreTelefono: "", padreEmail: "", padreDireccion: "", padreProfesion: "",
      madreNombre: "", madreApellido: "", madreRut: "", madreTelefono: "", madreEmail: "", madreDireccion: "", madreProfesion: "",
      apoderadoNombre: "", apoderadoApellido: "", apoderadoRut: "", apoderadoTelefono: "", apoderadoEmail: "", apoderadoDireccion: "", apoderadoProfesion: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Persona</DialogTitle>
          <DialogDescription>Ingresa los datos del jugador, socio o staff. Los campos con * son obligatorios.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="jugador" className="mt-2">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="jugador" className="gap-1.5 text-xs"><User className="w-3.5 h-3.5" /> Jugador</TabsTrigger>
            <TabsTrigger value="familia" className="gap-1.5 text-xs"><Users className="w-3.5 h-3.5" /> Familia</TabsTrigger>
            <TabsTrigger value="salud" className="gap-1.5 text-xs"><HeartPulse className="w-3.5 h-3.5" /> Salud</TabsTrigger>
          </TabsList>

          {/* ── JUGADOR ── */}
          <TabsContent value="jugador" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nombre *</Label>
                <Input value={form.nombre} onChange={(e) => update("nombre", e.target.value)} placeholder="Nombre" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Apellido *</Label>
                <Input value={form.apellido} onChange={(e) => update("apellido", e.target.value)} placeholder="Apellido" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">RUT *</Label>
                <Input value={form.rut} onChange={(e) => update("rut", e.target.value)} placeholder="12.345.678-9" className="h-9 text-sm font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Fecha de Nacimiento *</Label>
                <Input type="date" value={form.fechaNacimiento} onChange={(e) => update("fechaNacimiento", e.target.value)} className="h-9 text-sm" />
              </div>
            </div>

            {/* Auto-calculated category */}
            {edad !== null && categoria && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center gap-4">
                <div className="text-xs"><span className="text-muted-foreground">Edad:</span> <span className="font-semibold text-foreground">{edad} años</span></div>
                <div className="text-xs"><span className="text-muted-foreground">Categoría:</span> <span className="font-semibold text-primary">{categoria}</span></div>
                {necesitaTutor && <span className="text-[10px] text-warning font-medium">⚠ Requiere tutor</span>}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Rama</Label>
                <Select value={form.rama} onValueChange={(v) => update("rama", v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masc">Masculino</SelectItem>
                    <SelectItem value="Fem">Femenino</SelectItem>
                    <SelectItem value="Mixto">Mixto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => update("tipo", v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Jugador">Jugador</SelectItem>
                    <SelectItem value="Jugadora">Jugadora</SelectItem>
                    <SelectItem value="Socio">Socio</SelectItem>
                    <SelectItem value="Socia">Socia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs">Dirección</Label>
                <Input value={form.direccion} onChange={(e) => update("direccion", e.target.value)} placeholder="Dirección" className="h-9 text-sm" />
              </div>
            </div>
          </TabsContent>

          {/* ── FAMILIA ── */}
          <TabsContent value="familia" className="space-y-5 mt-4">
            {[
              { label: "Padre", prefix: "padre" },
              { label: "Madre", prefix: "madre" },
              { label: `Apoderado / Tutor${necesitaTutor ? " *" : ""}`, prefix: "apoderado" },
            ].map(({ label, prefix }) => (
              <div key={prefix} className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">{label}</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Input value={(form as any)[`${prefix}Nombre`]} onChange={(e) => update(`${prefix}Nombre`, e.target.value)} placeholder="Nombre" className="h-8 text-xs" />
                  <Input value={(form as any)[`${prefix}Apellido`]} onChange={(e) => update(`${prefix}Apellido`, e.target.value)} placeholder="Apellido" className="h-8 text-xs" />
                  <Input value={(form as any)[`${prefix}Rut`]} onChange={(e) => update(`${prefix}Rut`, e.target.value)} placeholder="RUT" className="h-8 text-xs font-mono" />
                  <Input value={(form as any)[`${prefix}Telefono`]} onChange={(e) => update(`${prefix}Telefono`, e.target.value)} placeholder="Teléfono" className="h-8 text-xs" />
                  <Input value={(form as any)[`${prefix}Email`]} onChange={(e) => update(`${prefix}Email`, e.target.value)} placeholder="Email" className="h-8 text-xs" />
                  <Input value={(form as any)[`${prefix}Profesion`]} onChange={(e) => update(`${prefix}Profesion`, e.target.value)} placeholder="Profesión" className="h-8 text-xs" />
                  <Input value={(form as any)[`${prefix}Direccion`]} onChange={(e) => update(`${prefix}Direccion`, e.target.value)} placeholder="Dirección" className="h-8 text-xs col-span-2" />
                </div>
              </div>
            ))}
          </TabsContent>

          {/* ── SALUD ── */}
          <TabsContent value="salud" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Talla</Label>
                <Input value={form.talla} onChange={(e) => update("talla", e.target.value)} placeholder="Ej: 165 cm" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Peso</Label>
                <Input value={form.peso} onChange={(e) => update("peso", e.target.value)} placeholder="Ej: 60 kg" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Talla Uniforme</Label>
                <Select value={form.tallaUniforme} onValueChange={(v) => update("tallaUniforme", v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {["XS", "S", "M", "L", "XL", "XXL"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Colegio</Label>
                <Input value={form.colegio} onChange={(e) => update("colegio", e.target.value)} placeholder="Nombre del colegio" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Previsión de Salud</Label>
                <Select value={form.previsionSalud} onValueChange={(v) => update("previsionSalud", v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {["Fonasa", "Isapre Cruz Blanca", "Isapre Consalud", "Isapre Banmédica", "Isapre Colmena", "Isapre Vida Tres", "Otra"].map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs">Alergias</Label>
                <Textarea value={form.alergias} onChange={(e) => update("alergias", e.target.value)} placeholder="Listar alergias conocidas o escribir 'Ninguna'" className="text-sm min-h-[60px]" />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} className="gap-2">
            <Save className="w-4 h-4" />
            Guardar Persona
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
