import { SideNavItemGroup } from "@/types/type";
import {
  BsBarChart,
  BsBookmarkStar,
  BsBox,
  BsCreditCard,
  BsGear,
  BsHouseDoor,
  BsPerson,
  BsRouter,
} from "react-icons/bs";
import { FaUserCog } from "react-icons/fa";

export const SIDENAV_ITEMS: SideNavItemGroup[] = [
  {
    title: "Dashboards",
    menuList: [
      {
        title: "Dashboard",
        path: "/",
        icon: <BsHouseDoor size={20} />,
      },
    ],
  },
  {
    title: "Manage",
    menuList: [
      {
        title: "Pengguna",
        path: "/users",
        icon: <FaUserCog size={20} />,
      },
      {
        title: "Routers",
        path: "/routers",
        icon: <BsRouter size={20} />,
        submenu: true,
        subMenuItems: [
          { title: "Daftar Router", path: "/routers/list" },
          { title: "ODP", path: "/routers/odp" },
        ],
      },
      {
        title: "Paket",
        path: "/packages",
        icon: <BsBox size={20} />,
      },
      {
        title: "Langganan",
        path: "/subscriptions",
        icon: <BsBookmarkStar size={20} />,
      },
      {
        title: "Pembayaran",
        path: "/payments",
        icon: <BsCreditCard size={20} />,
      },
      {
        title: "Kas",
        path: "/cash-flows",
        icon: <BsBarChart size={20} />,
      },
    ],
  },
  {
    title: "Others",
    menuList: [
      {
        title: "Profil",
        path: "/profiles",
        icon: <BsPerson size={20} />,
      },
      {
        title: "Pengaturan",
        path: "/settings",
        icon: <BsGear size={20} />,
      },
    ],
  },
];
