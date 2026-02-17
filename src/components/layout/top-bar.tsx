import { getLocale } from "next-intl/server";
import { LanguageSwitcher } from "./language-switcher";
import { MobileSidebar } from "./mobile-sidebar";
import { LogoutButton } from "@/components/auth/logout-button";

export async function TopBar() {
  const locale = await getLocale();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-card px-4 md:px-6">
      <MobileSidebar />
      <div className="flex-1" />
      <LanguageSwitcher currentLocale={locale} />
      <LogoutButton />
    </header>
  );
}
