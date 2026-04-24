import { motion } from "framer-motion";
import { LucideIcon, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  gradient: string;
  delay?: number;
  /** If provided, the card becomes a clickable link */
  to?: string;
}

export default function KPICard({ title, value, subtitle, icon: Icon, gradient, delay = 0, to }: KPICardProps) {
  const navigate = useNavigate();
  const clickable = !!to;

  const handleClick = () => {
    if (to) navigate(to);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      onClick={clickable ? handleClick : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClick(); } } : undefined}
      className={cn(
        "glass rounded-xl p-5 shadow-card transition-all duration-300 group",
        clickable
          ? "cursor-pointer hover:shadow-glow hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/40"
          : "hover:shadow-glow"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", gradient)}>
          <Icon className="w-5 h-5 text-primary-foreground" />
        </div>
        {clickable && (
          <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
      <p className="text-foreground text-2xl font-bold">{value}</p>
      {subtitle && <p className="text-muted-foreground text-xs mt-1">{subtitle}</p>}
    </motion.div>
  );
}
