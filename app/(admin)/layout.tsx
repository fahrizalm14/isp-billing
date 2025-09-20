import Header from "@/components/app/header";
import PageWrapper from "@/components/app/pagewrapper";
import { SideBar } from "@/components/app/sidebar";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type JwtPayload = {
  id: string;
  role: string;
  exp?: number;
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) redirect("/login");

  try {
    const decoded = jwtDecode<JwtPayload>(token);

    // Optional: cek expired token
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      redirect("/login");
    }

    if (decoded.role !== "ADMIN") {
      redirect("/login");
    }
  } catch {
    redirect("/login");
  }

  return (
    <>
      <SideBar />
      <div className="flex flex-col h-full w-full">
        <Header />
        <PageWrapper>{children}</PageWrapper>
      </div>
    </>
  );
}
