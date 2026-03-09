import {
  LayoutDashboard,
  BookOpen,
  Brain,
  Trophy,
  Crown,
  Users,
  FileText,
  Settings,
  LogOut,
  Flame,
  GraduationCap,
  CalendarDays,
  UserCircle,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProAccess } from "@/hooks/useProAccess";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

interface NavItem { title: string; url: string; icon: any; pro?: boolean }

const studentItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Tuteur IA", url: "/ai-tutor", icon: Brain, pro: true },
  { title: "Calendrier", url: "/calendrier", icon: CalendarDays },
  { title: "Brevet Blanc", url: "/brevet-blanc", icon: GraduationCap },
  { title: "Apprendre", url: "/learn", icon: BookOpen },
  { title: "Flashcards", url: "/flashcards", icon: Flame },
  { title: "Ma classe", url: "/my-class", icon: Users },
  { title: "Classement", url: "/classement", icon: Crown },
  { title: "Profil", url: "/profil", icon: UserCircle },
  { title: "Paramètres", url: "/settings", icon: Settings },
];

const teacherItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Tuteur IA", url: "/ai-tutor", icon: Brain, pro: true },
  { title: "Calendrier", url: "/calendrier", icon: CalendarDays },
  { title: "Brevet Blanc", url: "/brevet-blanc", icon: GraduationCap },
  { title: "Apprendre", url: "/learn", icon: BookOpen },
  { title: "Ma classe", url: "/teacher-class", icon: Users },
  { title: "Documents", url: "/teacher-docs", icon: FileText },
  { title: "Élèves", url: "/teacher-students", icon: Users, pro: true },
  { title: "Profil", url: "/profil", icon: UserCircle },
  { title: "Paramètres", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { role, signOut, user } = useAuth();
  const { isPro } = useProAccess();
  const location = useLocation();

  const items = role === "teacher" ? teacherItems : studentItems;
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Logo */}
        <div className={`p-4 flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
          <img src="/logo.png" alt="NoteFiche" className="w-8 h-8 rounded-lg shrink-0" />
          {!collapsed && (
            <span className="font-heading font-bold text-lg text-gradient-primary">NoteFiche</span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>{role === "teacher" ? "Enseignant" : "Navigation"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && (
                        <span className="flex-1">{item.title}</span>
                      )}
                      {!collapsed && item.pro && !isPro && (
                        <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">PRO</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {!collapsed && "Déconnexion"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
