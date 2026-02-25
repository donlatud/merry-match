/**
 * ห่อ handler ของ API route ให้ catch error แล้วส่ง 500
 * @param {(req: import('next').NextApiRequest, res: import('next').NextApiResponse) => Promise<void>} handler
 * @returns {(req: import('next').NextApiRequest, res: import('next').NextApiResponse) => Promise<void>}
 */
export function withAsyncHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error("[withAsyncHandler]", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  };
}
