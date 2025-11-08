// # Route definitions & validators
import { Router } from "express";
import {
  startGame,
  fire,
  getGameState,
} from "../../controllers/gameController";
import {
  validateFire,
  validateGameId,
  validateRequest,
} from "../../middlewares/validateRequest";
import { idempotencyHandler } from "../../middlewares/idempotency";
const router = Router();

// Start a new game
router.post("/start", startGame);
// Fire at a coordinate
router.post("/:id/fire", validateFire,idempotencyHandler, validateRequest, fire);
// Get current game state
router.get("/:id/state", validateGameId, validateRequest, getGameState);
export default router;
