import {
  ClipboardList,
  FileCheck,
  FolderOpen,
  LayoutDashboard,
  type LucideIcon,
  Plus,
  Users,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "概览",
    items: [
      {
        title: "仪表盘",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 2,
    label: "信息管理",
    items: [
      {
        title: "信息审核",
        url: "/dashboard/posts",
        icon: FileCheck,
      },
      {
        title: "发布信息",
        url: "/dashboard/posts/create",
        icon: Plus,
      },
    ],
  },
  {
    id: 3,
    label: "系统管理",
    items: [
      {
        title: "用户管理",
        url: "/dashboard/users",
        icon: Users,
      },
      {
        title: "分类管理",
        url: "/dashboard/categories",
        icon: FolderOpen,
      },
    ],
  },
];
