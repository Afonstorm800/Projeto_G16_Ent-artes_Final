import { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  Calendar, 
  CheckSquare, 
  Package, 
  Receipt, 
  LayoutDashboard, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  LogOut,
  CalendarDays,
  Clock,
  CalendarRange,
  Users,
  ShoppingBag
} from "lucide-react";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
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

const navItems: { id: string; label: string; icon: any; roles: UserRole[]; badge?: boolean }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["direcao", "professor"] },
  { id: "week", label: "Minha Semana", icon: CalendarDays, roles: ["encarregado"] },
  { id: "schedule", label: "Horário", icon: CalendarRange, roles: ["professor"] },
  { id: "generalSchedule", label: "Horário Geral", icon: CalendarRange, roles: ["direcao"] },
  { id: "management", label: "Gestão Académica", icon: Users, roles: ["direcao"] },
  { id: "availability", label: "Disponibilidade", icon: Clock, roles: ["professor"] },
  { id: "booking", label: "Marcações", icon: Calendar, roles: ["direcao", "encarregado"] },
  { id: "validation", label: "Validações", icon: CheckSquare, roles: ["direcao", "professor", "encarregado"], badge: true },
  { id: "inventory", label: "Marketplace", icon: ShoppingBag, roles: ["direcao", "encarregado"] },
  { id: "personalInventory", label: "O Meu Inventário", icon: Package, roles: ["direcao", "encarregado"] },
  { id: "billing", label: "Relatório Mensal", icon: Receipt, roles: ["direcao", "encarregado"] },
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
        "sticky top-0 h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-200 relative shadow-card z-20",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border h-16">
        {!collapsed && (
          <h1 className="font-display text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Ent'Artes
          </h1>
        )}
        {collapsed && <span className="font-display text-xl font-bold mx-auto text-primary">E</span>}
      </div>

      <nav className="flex-1 py-6 space-y-1 px-3 overflow-y-auto">
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
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group",
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 shrink-0 transition-transform duration-200",
                  active ? "scale-110" : "group-hover:scale-110"
                )} />
                {!collapsed && <span>{item.label}</span>}
                {item.badge && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
                )}
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

      <div className="p-4 border-t border-sidebar-border">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-sidebar-accent transition-colors text-left",
                collapsed && "justify-center"
              )}>
                <Avatar className="h-9 w-9 shrink-0 border border-sidebar-border">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-sidebar-foreground truncate">{user.nome}</p>
                    <p className="text-[10px] text-sidebar-muted truncate uppercase tracking-wider">{user.tipo}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56 p-2">
              <div className="px-2 py-1.5 mb-1">
                <p className="text-xs text-muted-foreground">Sessão iniciada como</p>
                <p className="text-sm font-medium truncate">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onNavigate("profile")} className="gap-2 cursor-pointer py-2">
                <User className="h-4 w-4" />
                <span>O meu Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="gap-2 cursor-pointer text-destructive focus:text-destructive py-2">
                <LogOut className="h-4 w-4" />
                <span>Terminar Sessão</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;
