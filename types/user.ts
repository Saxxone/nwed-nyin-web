import type { DateString } from "./types";

export interface User {
  id: string;
  name: string;
  email: string;
  banner?: string | null;
  verified: boolean;
  img?: string | null;
  bio?: string | null;
  password?: string;
  username: string;
  refresh_token?: string;
  access_token?: string;
  publicKey: string;
  createdAt: DateString | null;
  updatedAt: DateString | null;
  deletedAt: DateString | null;
  roomId: string;
}
