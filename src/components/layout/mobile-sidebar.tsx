"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  List,
  Megaphone,
  MessageSquare,
  Settings,
  Menu,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/overview", icon: LayoutDashboard, labelKey: "overview" as const },
  { href: "/contacts", icon: Users, labelKey: "contacts" as const },
  { href: "/contact-lists", icon: List, labelKey: "contactLists" as const },
  { href: "/campaigns", icon: Megaphone, labelKey: "campaigns" as const },
  { href: "/messages", icon: MessageSquare, labelKey: "messages" as const },
  { href: "/settings", icon: Settings, labelKey: "settings" as const },
];

export function MobileSidebar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-primary flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-green-600" />
            <span>WA Dashboard</span>
          </h1>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
