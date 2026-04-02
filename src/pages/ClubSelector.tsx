import { useState } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export default function ClubSelector() {
  const { user, clubs, setClubActual, signOut } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [nombre, setNombre] = useState("");
  const [deporte, setDeporte] = useState("Básquetbol");
  const [ciudad, setCiudad] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setCreating(true);

    const clubId = crypto.randomUUID();

    // Create club with predetermined ID (no .select() to avoid SELECT RLS conflict)
    const { error } = await supabase
      .from("clubs" as any)
      .insert({ id: clubId, nombre, deporte, ciudad: ciudad || null } as any);

    if (error) {
      toast.error("Error al crear el club");
      setCreating(false);
      return;
    }

    // Add current user as admin
    const { error: memberError } = await supabase.from("club_usuarios" as any).insert({
      club_id: clubId,
      user_id: user!.id,
      rol_sistema: "admin",
    } as any);

    if (memberError) {
      toast.error("Club creado pero error al asignar permisos");
      setCreating(false);
      return;
    }

    toast.success("Club creado exitosamente");
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">CEO Sports</h1>
          <p className="text-muted-foreground mt-1">Selecciona un club para continuar</p>
        </div>

        {clubs.length > 0 && (
          <div className="space-y-3">
            {clubs.map((club) => (
              <Card
                key={club.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setClubActual(club)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{club.nombre}</p>
                    <p className="text-sm text-muted-foreground">{club.deporte}{club.ciudad ? ` — ${club.ciudad}` : ""}</p>
                  </div>
                  <Button variant="outline" size="sm">Entrar</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full gap-2">
              <Plus className="w-4 h-4" /> Crear nuevo club
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Club</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre del club *</Label>
                <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Puerto Montt Basquet Femenino" required />
              </div>
              <div className="space-y-2">
                <Label>Deporte</Label>
                <Input value={deporte} onChange={(e) => setDeporte(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Ciudad</Label>
                <Input value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Creando..." : "Crear Club"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <div className="text-center">
          <button onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground">
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
