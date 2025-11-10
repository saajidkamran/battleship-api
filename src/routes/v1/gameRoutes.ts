import { Router } from "express";
import {
  startGame,
  fire,
  getGameState,
  getGames,
  deleteGame,
  deleteAllGames,
  getRecentGames,
} from "../../controllers/gameController";
import {
  validateFire,
  validateGameId,
  validateRequest,
  validatePagination,
} from "../../middlewares/validateRequest";
import { idempotencyHandler } from "../../middlewares/idempotency";

const router = Router();

router.get("/:id/state", validateGameId, validateRequest, getGameState);
router.get("/status", validatePagination, validateRequest, getGames);
router.get("/recent", validateRequest, getRecentGames);
router.post("/start", startGame);
router.post(
  "/:id/fire",
  validateFire,
  idempotencyHandler,
  validateRequest,
  fire
);
router.delete("/:id", validateGameId, validateRequest, deleteGame);
router.delete("/", deleteAllGames);

export default router;
