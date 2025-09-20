"use client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserStore } from "@/stores/useUserStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { showConfirm } from "../SweetAlert";

function generateInitials(name: string | undefined | null): string {
  if (!name || name.trim().length === 0) return "";

  const words = name.trim().split(" ");

  if (words.length === 1) {
    return words[0][0]?.toUpperCase() || "";
  }

  const first = words[0][0]?.toUpperCase() || "";
  const second = words[1][0]?.toUpperCase() || "";

  return first + second;
}

export function UserNav() {
  const router = useRouter();
  const { clearUser, email, name } = useUserStore();

  const handleLogout = async () => {
    const confirm = await showConfirm("Yakin ingin logout?", "warning", true);
    if (!confirm) return;
    try {
      await fetch("/api/logout");
      clearUser(); // hapus data user dari state
      router.push("/login");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {}
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-10 w-10">
            {/* <AvatarImage src="/avatars/02.png" alt="" /> */}
            <AvatarFallback>{generateInitials(name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 z-[99998]" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/profiles")}>
            Profil
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            Pengaturan
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link className="w-full" href={"#"} onClick={handleLogout}>
            Log out
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
