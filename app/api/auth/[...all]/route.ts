import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth as unknown as { handler: (request: Request) => Promise<Response> });
