// src/pages/api/matching/profiles.js
import { matchingController } from "@/controllers/matching/matching.controller";

export default async function handler(req, res) {
  return matchingController.getProfiles(req, res);
}