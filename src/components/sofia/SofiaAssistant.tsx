import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Msg = { role: "user" | "assistant"; content: string };

const SUGERENCIAS = [
  "¿Cuántos socios están morosos?",
  "¿Cuánto tenemos en caja este mes?",
  "¿Cómo registro una compra?",
  "¿Qué documentos vencen pronto?",
];

export default function SofiaAssistant() {
  const { clubActual, rolSistema, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "¡Hola! 👋 Soy **Isa**, tu asistente de CEO Sports. Puedo guiarte sobre cómo usar la plataforma o responder con datos reales de tu club. ¿En qué te ayudo?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  if (!clubActual) return null;

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("sofia-chat", {
        body: {
          messages: next.filter((_, i) => i > 0), // skip greeting
          clubId: clubActual.id,
          clubNombre: clubActual.nombre,
          rolUsuario: rolSistema,
          userName: user?.email,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setMessages((prev) => [...prev, { role: "assistant", content: (data as any).reply || "..." }]);
    } catch (e: any) {
      toast({
        title: "Isa no pudo responder",
        description: e?.message ?? "Intenta de nuevo en un momento.",
        variant: "destructive",
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "_Lo siento, tuve un problema. Intenta de nuevo._" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-1 group"
        aria-label="Abrir Isa"
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
          style={{
            background: "linear-gradient(135deg, hsl(270 70% 55%), hsl(285 75% 45%))",
            boxShadow: "0 8px 24px hsla(270, 70%, 45%, 0.4)",
          }}
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </div>
        <span className="text-xs font-semibold text-foreground bg-card px-2 py-0.5 rounded-full shadow-sm border border-border">
          Isa
        </span>
      </button>

      {/* Side Panel */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 flex flex-col bg-sidebar text-sidebar-foreground border-sidebar-border"
        >
          <SheetHeader className="px-5 py-4 border-b border-sidebar-border bg-sidebar">
            <SheetTitle className="flex items-center gap-3 text-sidebar-primary">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg, hsl(270 70% 55%), hsl(285 75% 45%))",
                }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-base font-bold text-white">Isa</span>
                <span className="text-xs font-normal text-sidebar-foreground/70">
                  Asistente CEO Sports
                </span>
              </div>
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    m.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      m.role === "user"
                        ? "bg-secondary text-secondary-foreground rounded-br-sm"
                        : "bg-sidebar-accent text-white rounded-bl-sm",
                    )}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:text-white prose-strong:text-white prose-a:text-blue-300">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <span>{m.content}</span>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-sidebar-accent text-white rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-2 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Isa está pensando…
                  </div>
                </div>
              )}

              {messages.length === 1 && !loading && (
                <div className="pt-4 space-y-2">
                  <p className="text-xs text-sidebar-foreground/60 px-1">Sugerencias:</p>
                  {SUGERENCIAS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="w-full text-left text-sm px-3 py-2 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors text-white border border-sidebar-border"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="p-3 border-t border-sidebar-border bg-sidebar flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregúntale a Isa…"
              disabled={loading}
              className="bg-sidebar-accent/40 border-sidebar-border text-white placeholder:text-sidebar-foreground/50 focus-visible:ring-secondary"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              size="icon"
              className="shrink-0"
              style={{
                background: "linear-gradient(135deg, hsl(270 70% 55%), hsl(285 75% 45%))",
              }}
            >
              <Send className="w-4 h-4 text-white" />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
