import type { IncomingMessage, ServerResponse } from "http";
import { handleServerlessApiRequest } from "@dinepilot/api";

(globalThis as any).__loadTwinMongo = () => import("@volter/twin-mongodb");

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  await handleServerlessApiRequest(req, res);
}
