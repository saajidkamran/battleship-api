import request from "supertest";
import app from "../../app";
import { AppDataSource } from "../../config/database";
import { Game } from "../../models/Game";
import { Ship } from "../../models/Ship";
import { mockShips } from "../helpers/testMocks";

jest.mock("../../services/shipPlacement", () => ({
  placeShips: () => mockShips,
}));

describe("DELETE /api/v1/game/:id - Integration Tests", () => {
  let gameId: string;

  beforeAll(async () => {
    // Initialize database connection if not already initialized
    if (!AppDataSource.isInitialized) {
      try {
        await AppDataSource.initialize();
      } catch (error) {
        console.warn("Database not available, skipping integration tests");
        (global as any).__SKIP_DB_TESTS__ = true;
        return;
      }
    }

    // Skip if database is not available
    if ((global as any).__SKIP_DB_TESTS__) {
      return;
    }

    // Create a test game
    const gameRepo = AppDataSource.getRepository(Game);
    const shipRepo = AppDataSource.getRepository(Ship);

    const game = new Game();
    game.id = "test-delete-game-1";
    game.status = "IN_PROGRESS";
    game.shots = [];
    await gameRepo.save(game);

    const ship = new Ship();
    ship.name = "Battleship";
    ship.size = 2;
    ship.positions = ["A1", "A2"];
    ship.hits = [];
    ship.isSunk = false;
    ship.game = game;
    await shipRepo.save(ship);

    game.ships = [ship];
    await gameRepo.save(game);
    gameId = game.id;
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
          where: { id: "test-delete-game-1" },
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
    it("should delete a specific game successfully", async () => {
      if ((global as any).__SKIP_DB_TESTS__) {
        return;
      }

      // Create a new game to delete
      const createResponse = await request(app).post("/api/v1/game/start");
      const newGameId = createResponse.body.gameId;

      // Delete the game
      const response = await request(app).delete(`/api/v1/game/${newGameId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Game deleted successfully"
      );
      expect(response.body).toHaveProperty("gameId", newGameId);

      // Verify game is deleted
      const getResponse = await request(app).get(
        `/api/v1/game/${newGameId}/state`
      );
      expect(getResponse.status).toBe(404);
    });

    it("should delete game and its associated ships", async () => {
      if ((global as any).__SKIP_DB_TESTS__) {
        return;
      }

      // Create a new game
      const createResponse = await request(app).post("/api/v1/game/start");
      const newGameId = createResponse.body.gameId;

      // Verify game exists with ships
      const beforeDelete = await request(app).get(
        `/api/v1/game/${newGameId}/state`
      );
      expect(beforeDelete.status).toBe(200);
      expect(beforeDelete.body.remainingShips).toBeGreaterThan(0);

      // Delete the game
      const response = await request(app).delete(`/api/v1/game/${newGameId}`);
      expect(response.status).toBe(200);

      // Verify game and ships are deleted
      const gameRepo = AppDataSource.getRepository(Game);
      const shipRepo = AppDataSource.getRepository(Ship);

      const deletedGame = await gameRepo.findOne({ where: { id: newGameId } });
      expect(deletedGame).toBeNull();

      const ships = await shipRepo.find({ where: { game: { id: newGameId } } });
      expect(ships.length).toBe(0);
    });
  });

  describe("Invalid Requests", () => {
    it("should return 404 for non-existent game", async () => {
      if ((global as any).__SKIP_DB_TESTS__) {
        return;
      }

      const nonExistentId = "00000000-0000-0000-0000-000000000000";
      const response = await request(app).delete(
        `/api/v1/game/${nonExistentId}`
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 for invalid game ID format", async () => {
      if ((global as any).__SKIP_DB_TESTS__) {
        return;
      }

      const invalidId = "invalid-id-123";
      const response = await request(app).delete(`/api/v1/game/${invalidId}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");
    });
  });
});
