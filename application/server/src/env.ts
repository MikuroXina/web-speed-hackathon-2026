import { Session } from "hono-sessions";

export interface SessionData {
  userId: string;
}

export interface Env {
  Variables: {
    session: Session<SessionData>;
  };
}
