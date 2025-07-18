import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  BarChart3,
  Users,
  Zap,
  MapPin,
  Settings,
  Home,
  TrendingUp,
  Calendar,
  Target,
} from "lucide-react";

const mainItems = [
  { title: "Overview", url: "/", icon: Home },
  { title: "Sales Performance", url: "/sales", icon: TrendingUp },
  { title: "Lead Pipeline", url: "/leads", icon: Target },
  { title: "Installations", url: "/installations", icon: Zap },
  { title: "Geographic", url: "/geographic", icon: MapPin },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

const managementItems = [
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Team", url: "/team", icon: Users },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-gradient-solar text-primary-foreground font-medium shadow-solar" 
      : "hover:bg-muted/60 transition-smooth";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-gradient-background">
        <div className={`p-4 ${isCollapsed ? "p-2" : ""}`}>
          <div className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/1d033ddb-7190-490e-80aa-5af0e180310c.png" 
              alt="Energy Edge Logo" 
              className="w-8 h-8 object-contain"
            />
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-bold text-foreground">Energy Edge</h2>
                <p className="text-xs text-muted-foreground">Solar Energy Solutions</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}