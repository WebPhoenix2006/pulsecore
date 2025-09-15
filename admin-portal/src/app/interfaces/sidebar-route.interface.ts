export interface SidebarRoute {
  path?: string; // only required for leaf routes
  label: string;
  icon?: string;
  children?: SidebarRoute[]; // nested routes
}
