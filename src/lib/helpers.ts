export interface MainRoute {
  label: string;
  href: string;
}

export const MainRoutes: MainRoute[] = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Dashboard",
    href: "/generate",
  },
  {
    label: "Performance",
    href: "/generate/performance",
  },
];

