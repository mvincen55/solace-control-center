import {
  MessageSquare,
  Activity,
  BarChart3,
  FolderOpen,
  Brain,
  Files,
  Bot,
  Settings,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";

const navItems = [
  { title: "Chat", url: "/", icon: MessageSquare },
  { title: "Activity", url: "/activity", icon: Activity },
  { title: "API Usage", url: "/usage", icon: BarChart3 },
  { title: "Projects", url: "/projects", icon: FolderOpen },
  { title: "Memory", url: "/memory", icon: Brain },
  { title: "Files", url: "/files", icon: Files },
  { title: "Agents", url: "/agents", icon: Bot },
  { title: "Settings", url: "/settings", icon: Settings },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={`shrink-0 border-r border-border bg-sidebar flex flex-col transition-all duration-200 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      <nav className="flex-1 py-3 flex flex-col gap-0.5 px-2">
        {navItems.map((item) => {
          const isActive = item.url === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(item.url);

          return (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/"}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              }`}
              activeClassName=""
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
