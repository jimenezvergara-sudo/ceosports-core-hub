import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface PageShellProps {
  title: string;
  description: string;
  icon: LucideIcon;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export default function PageShell({ title, description, icon: Icon, children, actions }: PageShellProps) {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
        </div>
        {actions}
      </motion.div>
      {children}
    </div>
  );
}
