import {
  LayoutDashboard,
  BookOpen,
  Brain,
  Trophy,
  Users,
  FileText,
  Settings,
  LogOut,
  Flame,
  GraduationCap,
  CalendarDays,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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

const studentItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Tuteur IA", url: "/ai-tutor", icon: Brain },
  { title: "Brevet Blanc", url: "/brevet-blanc", icon: GraduationCap },
  { title: "Apprendre", url: "/learn", icon: BookOpen },
  { title: "Flashcards", url: "/flashcards", icon: Flame },
  { title: "Ma classe", url: "/my-class", icon: Users },
  { title: "Badges", url: "/badges", icon: Trophy },
];

const teacherItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Brevet Blanc", url: "/brevet-blanc", icon: GraduationCap },
  { title: "Ma classe", url: "/teacher-class", icon: GraduationCap },
  { title: "Documents", url: "/teacher-docs", icon: FileText },
  { title: "Élèves", url: "/teacher-students", icon: Users },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { role, signOut, user } = useAuth();
  const location = useLocation();

  const items = role === "teacher" ? teacherItems : studentItems;
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Logo */}
        <div className={`p-4 flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-heading font-bold text-lg text-gradient-primary">BrevetIA</span>
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
                      {!collapsed && <span>{item.title}</span>}
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
