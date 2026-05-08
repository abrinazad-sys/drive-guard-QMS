import { z } from "zod";

const envSchema = z.object({
  VITE_BASE_URI: z.string().url(),
  VITE_WEBSOCKET_URI: z.string().url(),
  VITE_UPSTREAM: z.enum(['TRUE', 'FALSE']).default('FALSE'),
});

const parsedEnv = envSchema.safeParse({
  VITE_BASE_URI: import.meta.env.VITE_BASE_URI,
  VITE_WEBSOCKET_URI: import.meta.env.VITE_WEBSOCKET_URI,
  VITE_UPSTREAM: import.meta.env.VITE_UPSTREAM,
});

if (!parsedEnv.success) {
  console.error("Invalid environment variables:", parsedEnv.error.flatten());
  throw new Error("Invalid environment variables. Check your .env file.");
}

export const appConfig = {
  baseUri: parsedEnv.data.VITE_BASE_URI,
  websocketUri: parsedEnv.data.VITE_WEBSOCKET_URI,
  upstream: parsedEnv.data.VITE_UPSTREAM,
};
