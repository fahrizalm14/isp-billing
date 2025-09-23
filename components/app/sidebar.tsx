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
  const { toggleCollapse, invokeToggleCollapse } = useSideBarToggle();
  const websiteInfo = useWebsiteInfoStore((state) => state.websiteInfo);

  useEffect(() => {
    if (websiteInfo?.name) document.title = websiteInfo.name;
  }, [websiteInfo]);

  useEffect(() => setMounted(true), []);

  const asideStyle = classNames(
    "sidebar fixed inset-y-0 left-0 z-[99998] h-full bg-sidebar shadow-sm shadow-slate-500/40 transition-transform duration-300 ease-in-out",
    "overflow-y-auto overflow-x-auto",
    {
      // OPEN (mobile & desktop expanded)
      ["translate-x-0 w-[20rem]"]: !toggleCollapse,
      // COLLAPSE (desktop) + HIDE (mobile)
      ["-translate-x-full sm:translate-x-0 sm:w-[5.4rem]"]: toggleCollapse,
    }
  );

  return (
    <>
      {/* Overlay gelap: hanya mobile, muncul saat sidebar terbuka */}
      {!toggleCollapse && (
        <div
          className="fixed inset-0 z-[99990] bg-black/50 sm:hidden"
          onClick={invokeToggleCollapse}
          aria-hidden="true"
        />
      )}

      <aside className={asideStyle} aria-label="Main sidebar" id="app-sidebar">
        {/* Tombol Close (X) - hanya mobile */}
        {/* <button
          type="button"
          onClick={invokeToggleCollapse}
          className="sm:hidden absolute top-3 right-3 inline-flex items-center justify-center w-9 h-9 rounded-md
                     bg-sidebar-muted text-sidebar-muted-foreground hover:bg-foreground hover:text-background
                     shadow-md shadow-black/10 transition"
          aria-label="Tutup sidebar"
        >
          <X className="w-5 h-5" />
        </button> */}

        <div className="sidebar-top relative flex items-center px-3.5 py-5">
          {mounted && <SideBarLogo src={websiteInfo.logoUrl} />}
          <h3
            className={classNames(
              "pl-2 font-bold text-2xl min-w-max text-sidebar-foreground",
              { hidden: toggleCollapse, "sm:block": true }
            )}
          >
            {websiteInfo.alias}
          </h3>
        </div>

        <nav className="flex flex-col gap-2 transition duration-300 ease-in-out">
          <div className="flex flex-col gap-2 px-4">
            {SIDENAV_ITEMS.map((item, idx) => (
              <SideBarMenuGroup key={idx} menuGroup={item} />
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
};
