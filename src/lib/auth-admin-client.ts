import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

export const adminClient = createAuthClient({
  basePath: "/api/admin-auth",
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = "/admin/verificar";
      },
    }),
  ],
});
