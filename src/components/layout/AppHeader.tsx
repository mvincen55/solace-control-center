import { Wifi, WifiOff, Loader2 } from "lucide-react";

type SolStatus = "online" | "offline" | "thinking";

interface AppHeaderProps {
  status?: SolStatus;
}

const statusConfig: Record<SolStatus, { label: string; icon: React.ReactNode; className: string }> = {
  online: {
    label: "Online",
    icon: <Wifi className="h-3.5 w-3.5" />,
    className: "text-success bg-success/10 border-success/20",
  },
  offline: {
    label: "Offline",
    icon: <WifiOff className="h-3.5 w-3.5" />,
    className: "text-destructive bg-destructive/10 border-destructive/20",
  },
  thinking: {
    label: "Thinking...",
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    className: "text-sol bg-sol/10 border-sol/20",
  },
};

export function AppHeader({ status = "online" }: AppHeaderProps) {
  const s = statusConfig[status];

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold tracking-tight">
          Solace Control <span className="text-xl">☀️</span>
        </h1>
      </div>
      <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${s.className}`}>
        {s.icon}
        <span>{s.label}</span>
      </div>
    </header>
  );
}
