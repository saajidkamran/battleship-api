import { Router } from "express";
import {
  startGame,
  fire,
  getGameState,
  getGames,
} from "../../controllers/gameController";
import {
  validateFire,
  validateGameId,
  validateRequest,
  validatePagination,
} from "../../middlewares/validateRequest";
import { idempotencyHandler } from "../../middlewares/idempotency";

const router = Router();

// Start a new game
router.post("/start", startGame);

// Fire at a coordinate
router.post(
  "/:id/fire",
  validateFire,
  idempotencyHandler,
  validateRequest,
  fire
);

// Get current game state
router.get("/:id/state", validateGameId, validateRequest, getGameState);

// Get games by status (optional filter) with pagination
// Using GET for fetching data (RESTful best practice)
// Query params: ?status=IN_PROGRESS&page=1&limit=10
router.get("/status", validatePagination, validateRequest, getGames);

export default router;
