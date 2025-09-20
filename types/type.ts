import { JSX } from "react";

export type SideNavItem = {
  title: string;
  path: string;
  icon?: JSX.Element;
  submenu?: boolean;
  subMenuItems?: SideNavItem[];
};

export type SideNavItemGroup = {
  title: string;
  menuList: SideNavItem[];
};

export interface SubscriptionResponse {
  id: string;
  number: string;
  active: boolean;
  dueDate: string;
  expiredAt: Date;
  odp: string;
  routerName: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  packageName: string;
  packageSpeed: string;
  // History pembayaran
  payments: {
    id: string;
    number: string;
    amount: number;
    tax: number;
    status: string;
    paymentMethod: string | null;
    createdAt: Date;
  }[];
  username?: string; // ✅ tambah
  password?: string; // ✅ tambah
}
