// src/pages/api/matching/swipe.js
import { swipeController } from "@/controllers/matching/swipe.controller";

export default async function handler(req, res) {
  return swipeController.createSwipe(req, res);
}