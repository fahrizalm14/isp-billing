"use client";
import { SIDENAV_ITEMS } from "@/app/menu_constants";
import { SideBarLogo } from "@/components/app/sidebar-logo";
import SideBarMenuGroup from "@/components/app/sidebar-menu-group";
import { useSideBarToggle } from "@/hooks/use-sidebar-toggle";
import { useWebsiteInfoStore } from "@/stores/useWebsiteInfoStore";
import classNames from "classnames";
import { useEffect, useState } from "react";

export const SideBar = () => {
  const [mounted, setMounted] = useState(false);
  const { toggleCollapse } = useSideBarToggle();

  const websiteInfo = useWebsiteInfoStore((state) => state.websiteInfo);

  useEffect(() => {
    if (websiteInfo?.name) {
      document.title = websiteInfo.name;
    }
  }, [websiteInfo]);

  const asideStyle = classNames(
    "sidebar overflow-y-auto overflow-x-auto fixed bg-sidebar h-full shadow-sm shadow-slate-500/40 transition duration-300 ease-in-out z-[99998]",
    {
      ["w-[20rem]"]: !toggleCollapse,
      ["sm:w-[5.4rem] sm:left-0 left-[-100%]"]: toggleCollapse,
    }
  );

  useEffect(() => setMounted(true), []);

  return (
    <>
      <aside className={asideStyle}>
        <div className="sidebar-top relative flex items-center px-3.5 py-5">
          {mounted && <SideBarLogo src={websiteInfo.logoUrl} />}
          <h3
            className={classNames(
              "pl-2 font-bold text-2xl min-w-max text-sidebar-foreground",
              { hidden: toggleCollapse }
            )}
          >
            {websiteInfo.alias}
          </h3>
        </div>
        <nav className="flex flex-col gap-2 transition duration-300 ease-in-out">
          <div className="flex flex-col gap-2 px-4">
            {SIDENAV_ITEMS.map((item, idx) => {
              return <SideBarMenuGroup key={idx} menuGroup={item} />;
            })}
          </div>
        </nav>
      </aside>
    </>
  );
};
