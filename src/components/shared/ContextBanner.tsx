import { Link } from "react-router-dom";
import { Info, ArrowRight } from "lucide-react";

interface Props {
  text: string;
  linkText: string;
  to: string;
  variant?: "info" | "tip";
}

export default function ContextBanner({ text, linkText, to, variant = "tip" }: Props) {
  const styles =
    variant === "info"
      ? "bg-primary/5 border-primary/20 text-foreground"
      : "bg-accent/40 border-accent text-foreground";

  return (
    <div className={`flex items-center gap-3 rounded-lg border px-3 py-2 mb-3 text-sm ${styles}`}>
      <Info className="w-4 h-4 shrink-0 text-primary" />
      <span className="flex-1">{text}</span>
      <Link
        to={to}
        className="inline-flex items-center gap-1 text-primary font-medium hover:underline shrink-0"
      >
        {linkText}
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
