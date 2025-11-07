// # Route definitions & validators
import { Router } from "express";
import { startGame } from "../controllers/gameController";
const router = Router();

router.post("/start", startGame);

export default router;
