import request from "supertest";
import app from "../../app";
import { AppDataSource } from "../../config/database";
import { Game } from "../../models/Game";
import { Ship } from "../../models/Ship";
import { mockShips } from "../helpers/testMocks";

jest.mock("../../services/shipPlacement", () => ({
  placeShips: () => mockShips,
}));

describe("DELETE /api/v1/game - Integration Tests", () => {
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      try {
        await AppDataSource.initialize();
      } catch (error) {
        console.warn("Database not available, skipping integration tests");
        (global as any).__SKIP_DB_TESTS__ = true;
        return;
      }
    }
  });

  afterAll(async () => {
    if ((global as any).__SKIP_DB_TESTS__) {
      return;
    }

    if (AppDataSource.isInitialized) {
      const gameRepo = AppDataSource.getRepository(Game);
      const shipRepo = AppDataSource.getRepository(Ship);

      try {
        // Clean up any remaining test games
        const testGames = await gameRepo.find({
          where: [{ id: "test-delete-all-1" }, { id: "test-delete-all-2" }],
          relations: ["ships"],
        });
        for (const game of testGames) {
          if (game.ships && game.ships.length > 0) {
            await shipRepo.remove(game.ships);
          }
          await gameRepo.remove(game);
        }
      } catch (error) {
        // Ignore cleanup errors
      }

      try {
        await AppDataSource.destroy();
      } catch (error) {
        // Ignore destroy errors
      }
    }
  });

  describe("Valid Requests", () => {
    it("should delete all games successfully", async () => {
      if ((global as any).__SKIP_DB_TESTS__) {
        return;
      }

      // Create multiple games
      const game1 = await request(app).post("/api/v1/game/start");
      const game2 = await request(app).post("/api/v1/game/start");
      const game3 = await request(app).post("/api/v1/game/start");

      const gameId1 = game1.body.gameId;
      const gameId2 = game2.body.gameId;
      const gameId3 = game3.body.gameId;

      // Verify games exist
      const beforeDelete1 = await request(app).get(
        `/api/v1/game/${gameId1}/state`
      );
      const beforeDelete2 = await request(app).get(
        `/api/v1/game/${gameId2}/state`
      );
      const beforeDelete3 = await request(app).get(
        `/api/v1/game/${gameId3}/state`
      );

      expect(beforeDelete1.status).toBe(200);
      expect(beforeDelete2.status).toBe(200);
      expect(beforeDelete3.status).toBe(200);

      // Delete all games
      const response = await request(app).delete("/api/v1/game");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "All games deleted successfully"
      );
      expect(response.body).toHaveProperty("deletedCount");
      expect(response.body.deletedCount).toBeGreaterThanOrEqual(3);

      // Verify all games are deleted
      const afterDelete1 = await request(app).get(
        `/api/v1/game/${gameId1}/state`
      );
      const afterDelete2 = await request(app).get(
        `/api/v1/game/${gameId2}/state`
      );
      const afterDelete3 = await request(app).get(
        `/api/v1/game/${gameId3}/state`
      );

      expect(afterDelete1.status).toBe(404);
      expect(afterDelete2.status).toBe(404);
      expect(afterDelete3.status).toBe(404);
    });

    it("should return deletedCount of 0 when no games exist", async () => {
      if ((global as any).__SKIP_DB_TESTS__) {
        return;
      }

      // First delete all games
      await request(app).delete("/api/v1/game");

      // Try to delete again (should return 0)
      const response = await request(app).delete("/api/v1/game");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "All games deleted successfully"
      );
      expect(response.body).toHaveProperty("deletedCount", 0);
    });

    it("should delete games with their associated ships", async () => {
      if ((global as any).__SKIP_DB_TESTS__) {
        return;
      }

      // Create a game
      const createResponse = await request(app).post("/api/v1/game/start");
      const gameId = createResponse.body.gameId;

      // Verify game has ships
      const beforeDelete = await request(app).get(
        `/api/v1/game/${gameId}/state`
      );
      expect(beforeDelete.status).toBe(200);
      expect(beforeDelete.body.remainingShips).toBeGreaterThan(0);

      // Delete all games
      const response = await request(app).delete("/api/v1/game");
      expect(response.status).toBe(200);

      // Verify game and ships are deleted
      const gameRepo = AppDataSource.getRepository(Game);
      const shipRepo = AppDataSource.getRepository(Ship);

      const deletedGame = await gameRepo.findOne({ where: { id: gameId } });
      expect(deletedGame).toBeNull();

      const ships = await shipRepo.find({ where: { game: { id: gameId } } });
      expect(ships.length).toBe(0);
    });
  });
});
