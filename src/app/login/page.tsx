import { getLocale } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const locale = await getLocale();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <LoginForm locale={locale} />
    </div>
  );
}
