import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import * as db from "../vibeon-db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  vibeUser: any | null; // VibeOn user (email/username based)
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;
  let vibeUser: any | null = null;

  try {
    // Try VibeOn token-based authentication first
    const authHeader = opts.req.headers.authorization || opts.req.headers.Authorization;
    let token: string | undefined;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice("Bearer ".length).trim();
    }

    console.log("[Auth] Authorization header:", authHeader ? "present" : "missing");
    console.log("[Auth] Token:", token ? token.substring(0, 20) + "..." : "missing");

    if (token) {
      try {
        vibeUser = await db.getUserBySessionToken(token);
        console.log("[Auth] VibeOn user found:", vibeUser ? vibeUser.username : "null");
      } catch (error) {
        console.warn("[Auth] VibeOn token verification failed:", error);
      }
    }

    // If no VibeOn user, try OAuth authentication
    if (!vibeUser) {
      user = await sdk.authenticateRequest(opts.req);
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
    vibeUser = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    vibeUser,
  };
}
