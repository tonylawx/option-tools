import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import NextAuth from "next-auth";
import { createSharedAuthOptions } from "@tonylaw/auth/next-auth";

loadEnv({ path: resolve(process.cwd(), "../../.env") });

export const authOptions = createSharedAuthOptions();

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
