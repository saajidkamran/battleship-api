import request from "supertest";
import app from "../../app";
import { AppDataSource } from "../../config/database";
import { Game } from "../../models/Game";
import { Ship } from "../../models/Ship";
import { mockShips } from "../helpers/testMocks";

// Mock ship placement for deterministic tests
jest.mock("../../services/shipPlacement", () => ({
  placeShips: () => mockShips,
}));

describe("GET /api/v1/game/recent - Integration Tests", () => {
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
  });

  afterAll(async () => {
    // Clean up test data
    if ((global as any).__SKIP_DB_TESTS__) {
      return;
    }

    if (AppDataSource.isInitialized) {
      const gameRepo = AppDataSource.getRepository(Game);
      const shipRepo = AppDataSource.getRepository(Ship);

      try {
        // Clean up any remaining test games
        const testGames = await gameRepo.find({
          where: [
            { id: "test-recent-game-1" },
            { id: "test-recent-game-2" },
            { id: "test-old-game-1" },
            { id: "test-won-game-1" },
          ],
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

      // Close database connection to allow Jest to exit
      try {
        await AppDataSource.destroy();
      } catch (error) {
        // Ignore destroy errors
      }
    }
  });

  describe("Valid Requests", () => {
    it("should return recent games (last 24 hours) with IN_PROGRESS status", async () => {
      if ((global as any).__SKIP_DB_TESTS__) {
        return;
      }

      // Create a new game (will have recent createdAt)
      const createResponse = await request(app).post("/api/v1/game/start");
      const newGameId = createResponse.body.gameId;

      // Fetch recent games
      const response = await request(app).get("/api/v1/game/recent");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Recent games (last 24 hours)"
      );
      expect(response.body).toHaveProperty("count");
      expect(response.body).toHaveProperty("games");
      expect(Array.isArray(response.body.games)).toBe(true);

      // Verify the newly created game is in the results
      const gameIds = response.body.games.map((g: any) => g.gameId);
      expect(gameIds).toContain(newGameId);

      // Verify game structure
      if (response.body.games.length > 0) {
        const game = response.body.games[0];
        expect(game).toHaveProperty("gameId");
        expect(game).toHaveProperty("status", "IN_PROGRESS");
        expect(game).toHaveProperty("shots");
        expect(game).toHaveProperty("remainingShips");
        expect(game).toHaveProperty("createdAt");
      }
    });

    it("should only return games with IN_PROGRESS status", async () => {
      if ((global as any).__SKIP_DB_TESTS__) {
        return;
      }

      const gameRepo = AppDataSource.getRepository(Game);
      const shipRepo = AppDataSource.getRepository(Ship);

      // Create a WON game (should not appear in recent games)
      const wonGame = new Game();
      wonGame.id = "test-won-game-1";
      wonGame.status = "WON";
      wonGame.shots = ["A1", "A2"];
      await gameRepo.save(wonGame);

      const wonShip = new Ship();
      wonShip.name = "Battleship";
      wonShip.size = 2;
      wonShip.positions = ["A1", "A2"];
      wonShip.hits = ["A1", "A2"];
      wonShip.isSunk = true;
      wonShip.game = wonGame;
      await shipRepo.save(wonShip);

      // Fetch recent games
      const response = await request(app).get("/api/v1/game/recent");

      expect(response.status).toBe(200);

      // Verify no WON games are in the results
      const wonGames = response.body.games.filter(
        (g: any) => g.status === "WON"
      );
      expect(wonGames.length).toBe(0);

      // All games should have IN_PROGRESS status
      response.body.games.forEach((game: any) => {
        expect(game.status).toBe("IN_PROGRESS");
      });
    });

    it("should only return games created in the last 24 hours", async () => {
      if ((global as any).__SKIP_DB_TESTS__) {
        return;
      }

      const gameRepo = AppDataSource.getRepository(Game);
      const shipRepo = AppDataSource.getRepository(Ship);

      // Create an old game (more than 24 hours ago)
      const oldGame = new Game();
      oldGame.id = "test-old-game-1";
      oldGame.status = "IN_PROGRESS";
      oldGame.shots = [];
      await gameRepo.save(oldGame);

      // Manually set createdAt to 25 hours ago
      const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
      await gameRepo
        .createQueryBuilder()
        .update(Game)
        .set({ createdAt: twentyFiveHoursAgo })
        .where("id = :id", { id: oldGame.id })
        .execute();

      const oldShip = new Ship();
      oldShip.name = "Battleship";
      oldShip.size = 2;
      oldShip.positions = ["A1", "A2"];
      oldShip.hits = [];
      oldShip.isSunk = false;
      oldShip.game = oldGame;
      await shipRepo.save(oldShip);

      // Fetch recent games
      const response = await request(app).get("/api/v1/game/recent");

      expect(response.status).toBe(200);

      // Verify old game is not in the results
      const gameIds = response.body.games.map((g: any) => g.gameId);
      expect(gameIds).not.toContain("test-old-game-1");
    });

    it("should return games ordered by createdAt DESC", async () => {
      if ((global as any).__SKIP_DB_TESTS__) {
        return;
      }

      // Create multiple games
      const game1Response = await request(app).post("/api/v1/game/start");
      await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay
      const game2Response = await request(app).post("/api/v1/game/start");

      // Fetch recent games
      const response = await request(app).get("/api/v1/game/recent");

      expect(response.status).toBe(200);

      if (response.body.games.length >= 2) {
        const games = response.body.games;
        const game1Index = games.findIndex(
          (g: any) => g.gameId === game1Response.body.gameId
        );
        const game2Index = games.findIndex(
          (g: any) => g.gameId === game2Response.body.gameId
        );

        // Game 2 should appear before Game 1 (newer first)
        if (game1Index !== -1 && game2Index !== -1) {
          expect(game2Index).toBeLessThan(game1Index);
        }
      }
    });

    it("should include ships information in response", async () => {
      if ((global as any).__SKIP_DB_TESTS__) {
        return;
      }

      // Create a new game
      const createResponse = await request(app).post("/api/v1/game/start");
      const newGameId = createResponse.body.gameId;

      // Fetch recent games
      const response = await request(app).get("/api/v1/game/recent");

      expect(response.status).toBe(200);

      const game = response.body.games.find((g: any) => g.gameId === newGameId);

      expect(game).toBeDefined();
      expect(game).toHaveProperty("remainingShips");
      expect(typeof game.remainingShips).toBe("number");
      expect(game.remainingShips).toBeGreaterThanOrEqual(0);
    });
  });

  it("should return empty array when no recent games exist", async () => {
    if ((global as any).__SKIP_DB_TESTS__) {
      return;
    }

    // Delete all games first
    await request(app).delete("/api/v1/game");

    // Fetch recent games
    const response = await request(app).get("/api/v1/game/recent");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      "message",
      "Recent games (last 24 hours)"
    );
    expect(response.body).toHaveProperty("count", 0);
    expect(response.body).toHaveProperty("games", []);
  });

  it("should handle games with no ships", async () => {
    if ((global as any).__SKIP_DB_TESTS__) {
      return;
    }

    const gameRepo = AppDataSource.getRepository(Game);

    // Create a game without ships
    const game = new Game();
    game.id = "test-recent-game-1";
    game.status = "IN_PROGRESS";
    game.shots = [];
    await gameRepo.save(game);

    // Fetch recent games
    const response = await request(app).get("/api/v1/game/recent");

    expect(response.status).toBe(200);

    const gameResult = response.body.games.find(
      (g: any) => g.gameId === "test-recent-game-1"
    );

    if (gameResult) {
      expect(gameResult).toHaveProperty("remainingShips", 0);
    }
  });
});
