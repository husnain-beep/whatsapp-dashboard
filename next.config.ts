import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "path";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", ".prisma", "better-sqlite3"],
  turbopack: {
    resolveAlias: {
      ".prisma/client/default": path.resolve(
        __dirname,
        "src/generated/prisma/client.ts"
      ),
      ".prisma/client": path.resolve(
        __dirname,
        "src/generated/prisma/client.ts"
      ),
    },
  },
};

export default withNextIntl(nextConfig);
