// src/pages/api/matching/swipe.js
import { swipeController } from "@/controllers/matching/swipe.controller";

export default async function handler(req, res) {
  if (req.method === "POST") {
    return swipeController.createSwipe(req, res);
  }

  if (req.method === "DELETE") {
    return swipeController.unlikeSwipe(req, res);
  }

  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}