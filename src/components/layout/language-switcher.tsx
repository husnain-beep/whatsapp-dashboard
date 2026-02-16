"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const router = useRouter();

  const toggleLocale = async () => {
    const newLocale = currentLocale === "en" ? "ar" : "en";
    await fetch("/api/locale", {
      method: "POST",
      body: JSON.stringify({ locale: newLocale }),
    });
    router.refresh();
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggleLocale}>
      {currentLocale === "en" ? "العربية" : "English"}
    </Button>
  );
}
