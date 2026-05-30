import { useState } from "react";
import { cn } from "@/lib/utils";
import { Calendar, CheckSquare, Package, Receipt, LayoutDashboard, ChevronLeft, ChevronRight, User, LogOut, CalendarDays, Clock, CalendarRange } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

import type { UserRole } from "@/contexts/AuthContext";

const navItems: { id: string; label: string; icon: typeof LayoutDashboard; roles: UserRole[] }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["direcao", "professor"] },
  { id: "week", label: "A Semana", icon: CalendarDays, roles: ["encarregado"] },
  { id: "schedule", label: "Horário", icon: CalendarRange, roles: ["professor", "encarregado"] },
  { id: "generalSchedule", label: "Horário Geral", icon: CalendarRange, roles: ["direcao"] },
  { id: "availability", label: "Disponibilidade", icon: Clock, roles: ["professor"] },
  { id: "booking", label: "Marcações", icon: Calendar, roles: ["direcao", "encarregado"] },
  { id: "validation", label: "Validações", icon: CheckSquare, roles: ["direcao", "professor", "encarregado"] },
  { id: "inventory", label: "Marketplace", icon: Package, roles: ["direcao", "encarregado"] },
  { id: "billing", label: "Relatório Mensal", icon: Receipt, roles: ["direcao"] },
];

const AppSidebar = ({ currentPage, onNavigate }: AppSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const initials = user
    ? user.nome.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "";

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-200 relative",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
        {!collapsed && (
          <h1 className="font-display text-xl font-bold tracking-tight">
            Ent'Artes
          </h1>
        )}
        {collapsed && <span className="font-display text-xl font-bold mx-auto">E</span>}
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems
          .filter((item) => !user || item.roles.includes(user.tipo))
          .map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 bg-card border border-border rounded-full p-1 shadow-card text-foreground hover:bg-muted transition-colors"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      <div className="p-3 border-t border-sidebar-border">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-sidebar-accent transition-colors text-left",
                collapsed && "justify-center"
              )}>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">{user.nome}</p>
                    <p className="text-xs text-sidebar-muted truncate">{user.email}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-48">
              <DropdownMenuItem onClick={() => onNavigate("profile")} className="gap-2 cursor-pointer">
                <User className="h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4" />
                Terminar Sessão
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;
