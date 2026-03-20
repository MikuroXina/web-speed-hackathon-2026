import { MemoryStore, sessionMiddleware as session } from "hono-sessions";

export let sessionStore = new MemoryStore();

export const sessionMiddleware = session({
  store: sessionStore,
  encryptionKey: "secretsecretsecretsecretsecretsecret",
});

export function clearSessions() {
  sessionStore = new MemoryStore();
}
