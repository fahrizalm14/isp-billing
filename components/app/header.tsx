"use client";
import { useSideBarToggle } from "@/hooks/use-sidebar-toggle";
import classNames from "classnames";
import { BsList } from "react-icons/bs";
import { ThemeSwitcher } from "./theme-switcher";
import { UserNav } from "./usernav";

export default function Header() {
  const { toggleCollapse, invokeToggleCollapse } = useSideBarToggle();

  const headerStyle = classNames(
    // sticky
    "sticky top-0 z-[999] w-full bg-sidebar/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar/75",
    "border-b",
    // ⬇️ margin-bottom hanya di mobile
    "mb-20 sm:mb-0",
    // padding kiri kompensasi sidebar di ≥sm
    !toggleCollapse ? "sm:pl-[20rem]" : "sm:pl-[5.6rem]"
  );

  return (
    <header className={headerStyle}>
      <div className="h-16 px-4 flex items-center justify-between">
        <button
          title="Toggle sidebar"
          onClick={invokeToggleCollapse}
          className="inline-flex items-center justify-center rounded-md w-9 h-9
                     bg-sidebar-muted text-sidebar-muted-foreground
                     hover:bg-foreground hover:text-background
                     shadow-md shadow-black/10 transition"
          aria-label="Toggle sidebar"
        >
          <BsList className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="p-1">
            <ThemeSwitcher />
          </div>
          <div className="h-9 w-9 rounded-full bg-sidebar-muted flex items-center justify-center">
            <UserNav />
          </div>
        </div>
      </div>
    </header>
  );
}
