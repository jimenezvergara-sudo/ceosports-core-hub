import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function Login() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Revisa tu email para restablecer tu contraseña");
      }
      setLoading(false);
      return;
    }

    if (mode === "register") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Revisa tu email para confirmar tu cuenta");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error("Credenciales incorrectas");
      }
    }
    setLoading(false);
  };

  const title = mode === "forgot"
    ? "Recuperar contraseña"
    : mode === "register"
    ? "Crea tu cuenta para administrar tu club"
    : "Inicia sesión en tu plataforma";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">CEO Sports</CardTitle>
          <CardDescription>{title}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Cargando..."
                : mode === "forgot"
                ? "Enviar enlace de recuperación"
                : mode === "register"
                ? "Registrarse"
                : "Iniciar Sesión"}
            </Button>
          </form>
          <div className="mt-4 text-center space-y-2">
            {mode === "login" && (
              <>
                <button type="button" onClick={() => setMode("forgot")} className="text-sm text-muted-foreground hover:underline block w-full">
                  ¿Olvidaste tu contraseña?
                </button>
                <button type="button" onClick={() => setMode("register")} className="text-sm text-primary hover:underline block w-full">
                  ¿No tienes cuenta? Regístrate
                </button>
              </>
            )}
            {mode === "register" && (
              <button type="button" onClick={() => setMode("login")} className="text-sm text-primary hover:underline">
                ¿Ya tienes cuenta? Inicia sesión
              </button>
            )}
            {mode === "forgot" && (
              <button type="button" onClick={() => setMode("login")} className="text-sm text-primary hover:underline">
                Volver a iniciar sesión
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
