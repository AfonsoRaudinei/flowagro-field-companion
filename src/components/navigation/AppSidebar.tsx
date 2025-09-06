import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calculator,
  MapPin,
  Leaf,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

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
} from '@/components/ui/sidebar';

const mainItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
    group: 'main'
  },
  {
    title: 'Calculadora',
    url: '/calculator',
    icon: Calculator,
    group: 'main'
  },
  {
    title: 'Mapa Técnico',
    url: '/technical-map',
    icon: MapPin,
    group: 'main'
  }
];

const phenologyItems = [
  {
    title: 'Estágios Fenológicos',
    url: '/phenological-stages',
    icon: Leaf,
    group: 'phenology'
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';
  const [phenologyOpen, setPhenologyOpen] = useState(false);

  const isActive = (path: string) => currentPath === path;
  
  const getNavClasses = (path: string) => {
    const baseClasses = "flex items-center transition-all duration-200";
    return isActive(path)
      ? `${baseClasses} bg-primary/10 text-primary font-medium border-r-2 border-primary`
      : `${baseClasses} text-muted-foreground hover:text-foreground hover:bg-accent/50`;
  };

  const renderMenuGroup = (items: typeof mainItems, label: string) => (
    <SidebarGroup>
      <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.url}
                    className={getNavClasses(item.url)}
                    title={collapsed ? item.title : undefined}
                  >
                    <Icon className={`${collapsed ? 'h-5 w-5' : 'h-4 w-4 mr-3'} shrink-0`} />
                    {!collapsed && (
                      <span className="truncate">{item.title}</span>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  const renderExpandableGroup = () => (
    <SidebarGroup>
      <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
        <button
          onClick={() => !collapsed && setPhenologyOpen(!phenologyOpen)}
          className={`flex items-center gap-2 w-full ${collapsed ? 'pointer-events-none' : ''}`}
        >
          Ferramentas Avançadas
          {!collapsed && (phenologyOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />)}
        </button>
      </SidebarGroupLabel>
      {(!collapsed && phenologyOpen) && (
        <SidebarGroupContent>
          <SidebarMenu>
            {phenologyItems.map((item) => {
              const Icon = item.icon;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={getNavClasses(item.url)}
                    >
                      <Icon className="h-4 w-4 mr-3 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      )}
    </SidebarGroup>
  );

  return (
    <Sidebar
      className={`${collapsed ? 'w-12' : 'w-48'} transition-all duration-300`}
      collapsible="icon"
    >
      <SidebarContent className="bg-card border-r border-border">
        {/* App Brand/Logo */}
        <div className={`p-4 border-b border-border ${collapsed ? 'px-2' : ''}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-lg text-foreground">FlowAgro</h1>
                <p className="text-xs text-muted-foreground">Smart Agriculture</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 space-y-1 p-2">
          {renderMenuGroup(mainItems, "Principal")}
          {renderExpandableGroup()}
        </div>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-border">
            <div className="text-xs text-muted-foreground text-center">
              FlowAgro v2.0
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}