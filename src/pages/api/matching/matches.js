// src/pages/api/matching/matches.js
import { matchesController } from "@/controllers/matching/matches.controller";

export default async function handler(req, res) {
  return matchesController.getMatches(req, res);
}