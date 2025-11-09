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

describe("GET /api/v1/game/status - Integration Tests", () => {
  let gameIds: { inProgress: string; won: string; lost: string; inProgress2: string } = {
    inProgress: "",
    won: "",
    lost: "",
    inProgress2: "",
  };

  const TEST_GAME_IDS = [
    "test-in-progress-1",
    "test-won-1",
    "test-in-progress-2",
  ];

  beforeAll(async () => {
    // Initialize database connection if not already initialized
    if (!AppDataSource.isInitialized) {
      try {
        await AppDataSource.initialize();
      } catch (error) {
        // Database might not be available - skip integration tests
        console.warn("Database not available, skipping integration tests");
        // Mark tests to skip
        (global as any).__SKIP_DB_TESTS__ = true;
        return; // Exit early if DB is not available
      }
    }

    // Skip if database is not available
    if ((global as any).__SKIP_DB_TESTS__) {
      return;
    }

    // Clean up any existing test data first to avoid conflicts
    const gameRepo = AppDataSource.getRepository(Game);
    const shipRepo = AppDataSource.getRepository(Ship);

    try {
      // Delete any existing test games and their ships
      for (const testId of TEST_GAME_IDS) {
        const existingGame = await gameRepo.findOne({
          where: { id: testId },
          relations: ["ships"],
        });
        if (existingGame) {
          // Delete associated ships first
          if (existingGame.ships && existingGame.ships.length > 0) {
            await shipRepo.remove(existingGame.ships);
          }
          await gameRepo.remove(existingGame);
        }
      }
    } catch (error) {
      // Ignore cleanup errors, continue with test setup
      console.warn("Error cleaning up existing test data:", error);
    }

    // Create test games with different statuses
    // Create IN_PROGRESS game
    const inProgressGame = new Game();
    inProgressGame.id = "test-in-progress-1";
    inProgressGame.status = "IN_PROGRESS";
    inProgressGame.shots = [];
    await gameRepo.save(inProgressGame);

    const inProgressShip = new Ship();
    inProgressShip.name = "Battleship";
    inProgressShip.size = 2;
    inProgressShip.positions = ["A1", "A2"];
    inProgressShip.hits = [];
    inProgressShip.isSunk = false;
    inProgressShip.game = inProgressGame;
    await shipRepo.save(inProgressShip);

    inProgressGame.ships = [inProgressShip];
    await gameRepo.save(inProgressGame);
    gameIds.inProgress = inProgressGame.id;

    // Create WON game
    const wonGame = new Game();
    wonGame.id = "test-won-1";
    wonGame.status = "WON";
    wonGame.shots = ["A1", "A2", "B1"];
    await gameRepo.save(wonGame);

    const wonShip = new Ship();
    wonShip.name = "Battleship";
    wonShip.size = 2;
    wonShip.positions = ["A1", "A2"];
    wonShip.hits = ["A1", "A2"];
    wonShip.isSunk = true;
    wonShip.game = wonGame;
    await shipRepo.save(wonShip);

    wonGame.ships = [wonShip];
    await gameRepo.save(wonGame);
    gameIds.won = wonGame.id;

    // Create another IN_PROGRESS game for pagination testing
    const inProgressGame2 = new Game();
    inProgressGame2.id = "test-in-progress-2";
    inProgressGame2.status = "IN_PROGRESS";
    inProgressGame2.shots = ["A1"];
    await gameRepo.save(inProgressGame2);

    const inProgressShip2 = new Ship();
    inProgressShip2.name = "Destroyer";
    inProgressShip2.size = 1;
    inProgressShip2.positions = ["B1"];
    inProgressShip2.hits = [];
    inProgressShip2.isSunk = false;
    inProgressShip2.game = inProgressGame2;
    await shipRepo.save(inProgressShip2);

    inProgressGame2.ships = [inProgressShip2];
    await gameRepo.save(inProgressGame2);
    gameIds.inProgress2 = inProgressGame2.id;
  });

  afterAll(async () => {
    // Clean up test data
    if ((global as any).__SKIP_DB_TESTS__) {
      return;
    }

    if (AppDataSource.isInitialized) {
      const gameRepo = AppDataSource.getRepository(Game);
      const shipRepo = AppDataSource.getRepository(Ship);

      // Delete test games and their ships
      try {
        for (const testId of TEST_GAME_IDS) {
          const game = await gameRepo.findOne({
            where: { id: testId },
            relations: ["ships"],
          });
          if (game) {
            // Delete associated ships first
            if (game.ships && game.ships.length > 0) {
              await shipRepo.remove(game.ships);
            }
            await gameRepo.remove(game);
          }
        }
      } catch (error) {
        // Ignore cleanup errors
        console.warn("Error during test cleanup:", error);
      }

      // Close connection
      try {
        await AppDataSource.destroy();
      } catch (error) {
        // Ignore destroy errors
        console.warn("Error destroying database connection:", error);
      }
    }
  });

  describe(" Valid Requests", () => {

    it("should return all games with default pagination", async () => {
      if ((global as any).__SKIP_DB_TESTS__) {
        return; // Skip test if DB is not available
      }

      const response = await request(app).get("/api/v1/game/status");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "All games");
      expect(response.body).toHaveProperty("data");
      expect(response.body).toHaveProperty("pagination");
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: expect.any(Number),
        totalPages: expect.any(Number),
        hasNext: expect.any(Boolean),
        hasPrev: expect.any(Boolean),
      });
    });

    it("should filter games by status IN_PROGRESS", async () => {
      const response = await request(app).get(
        "/api/v1/game/status?status=IN_PROGRESS"
      );

      expect(response.status).toBe(200);
      expect(response.body.message).toContain("IN_PROGRESS");
      expect(response.body.data).toBeInstanceOf(Array);
      
      // Verify all returned games have IN_PROGRESS status
      response.body.data.forEach((game: Game) => {
        expect(game.status).toBe("IN_PROGRESS");
      });
    });

    it("should filter games by status WON", async () => {
      const response = await request(app).get(
        "/api/v1/game/status?status=WON"
      );

      expect(response.status).toBe(200);
      expect(response.body.message).toContain("WON");
      expect(response.body.data).toBeInstanceOf(Array);
      
      // Verify all returned games have WON status
      response.body.data.forEach((game: Game) => {
        expect(game.status).toBe("WON");
      });
    });


    it("should handle pagination with page and limit", async () => {
      const response = await request(app).get(
        "/api/v1/game/status?page=1&limit=2"
      );

      expect(response.status).toBe(200);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 2,
      });
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });

    it("should return correct pagination metadata", async () => {
      const response = await request(app).get(
        "/api/v1/game/status?page=1&limit=1"
      );

      expect(response.status).toBe(200);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 1,
        total: expect.any(Number),
        totalPages: expect.any(Number),
        hasNext: expect.any(Boolean),
        hasPrev: false, // First page should not have previous
      });
    });

    it("should include ships relation in response", async () => {
      const response = await request(app).get(
        "/api/v1/game/status?status=IN_PROGRESS"
      );

      expect(response.status).toBe(200);
      if (response.body.data.length > 0) {
        const game = response.body.data[0];
        expect(game).toHaveProperty("ships");
        expect(Array.isArray(game.ships)).toBe(true);
        
        if (game.ships.length > 0) {
          expect(game.ships[0]).toHaveProperty("name");
          expect(game.ships[0]).toHaveProperty("positions");
          expect(game.ships[0]).toHaveProperty("hits");
        }
      }
    });

    it("should handle combined status filter and pagination", async () => {
      const response = await request(app).get(
        "/api/v1/game/status?status=IN_PROGRESS&page=1&limit=1"
      );

      expect(response.status).toBe(200);
      expect(response.body.message).toContain("IN_PROGRESS");
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });
  });

  describe("Invalid Requests", () => {
    it("should return 400 for invalid status", async () => {
      const response = await request(app).get(
        "/api/v1/game/status?status=INVALID_STATUS"
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it("should return 400 for negative page number", async () => {
      const response = await request(app).get(
        "/api/v1/game/status?page=-1"
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");
    });

    it("should return 400 for zero page number", async () => {
      const response = await request(app).get(
        "/api/v1/game/status?page=0"
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");
    });

    it("should return 400 for limit exceeding maximum (100)", async () => {
      const response = await request(app).get(
        "/api/v1/game/status?limit=101"
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");
    });

    it("should return 400 for negative limit", async () => {
      const response = await request(app).get(
        "/api/v1/game/status?limit=-5"
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");
    });

    it("should return 400 for zero limit", async () => {
      const response = await request(app).get(
        "/api/v1/game/status?limit=0"
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");
    });

    it("should return 400 for non-numeric page", async () => {
      const response = await request(app).get(
        "/api/v1/game/status?page=abc"
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");
    });

    it("should return 400 for non-numeric limit", async () => {
      const response = await request(app).get(
        "/api/v1/game/status?limit=xyz"
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");
    });
  });


  describe("Pagination flow", () => {
    it("should handle typical pagination flow", async () => {
      // Get first page
      const page1 = await request(app).get(
        "/api/v1/game/status?page=1&limit=2"
      );
      expect(page1.status).toBe(200);
      expect(page1.body.pagination.page).toBe(1);

      // Get second page if exists
      if (page1.body.pagination.hasNext) {
        const page2 = await request(app).get(
          "/api/v1/game/status?page=2&limit=2"
        );
        expect(page2.status).toBe(200);
        expect(page2.body.pagination.page).toBe(2);
        expect(page2.body.pagination.hasPrev).toBe(true);
      }
    });

    it("should filter and paginate together correctly", async () => {
      const response = await request(app).get(
        "/api/v1/game/status?status=IN_PROGRESS&page=1&limit=1"
      );

      expect(response.status).toBe(200);
      expect(response.body.data.every((g: Game) => g.status === "IN_PROGRESS")).toBe(true);
      expect(response.body.pagination.limit).toBe(1);
    });

     it("should maintain consistent pagination across pages", async () => {
      const page1 = await request(app).get(
        "/api/v1/game/status?page=1&limit=1"
      );
      const page2 = await request(app).get(
        "/api/v1/game/status?page=2&limit=1"
      );

      expect(page1.status).toBe(200);
      expect(page2.status).toBe(200);
      
      // Total should be the same
      expect(page1.body.pagination.total).toBe(
        page2.body.pagination.total
      );
      
      // Limit should be the same
      expect(page1.body.pagination.limit).toBe(
        page2.body.pagination.limit
      );
    });
    it("should handle empty result set for non-existent status", async () => {
        const response = await request(app).get(
          "/api/v1/game/status?status=LOST"
        );
  
        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
        expect(response.body.pagination.total).toBe(0);
        expect(response.body.pagination.totalPages).toBe(0);
        expect(response.body.pagination.hasNext).toBe(false);
        expect(response.body.pagination.hasPrev).toBe(false);
      });
  
      it("should handle page beyond total pages", async () => {
        const response = await request(app).get(
          "/api/v1/game/status?page=99999&limit=10"
        );
  
        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
        expect(response.body.pagination.page).toBe(99999);
        expect(response.body.pagination.hasNext).toBe(false);
      });
  
      it("should handle maximum limit (100)", async () => {
        const response = await request(app).get(
          "/api/v1/game/status?limit=100"
        );
  
        expect(response.status).toBe(200);
        expect(response.body.pagination.limit).toBe(100);
        expect(response.body.data.length).toBeLessThanOrEqual(100);
      });
  
      it("should handle multiple query parameters correctly", async () => {
        const response = await request(app).get(
          "/api/v1/game/status?status=IN_PROGRESS&page=1&limit=5"
        );
  
        expect(response.status).toBe(200);
        expect(response.body.pagination).toMatchObject({
          page: 1,
          limit: 5,
        });
        expect(response.body.message).toContain("IN_PROGRESS");
      });
  
      it("should return hasNext true when more pages exist", async () => {
        // First, create enough games to have multiple pages
        const response = await request(app).get(
          "/api/v1/game/status?page=1&limit=1"
        );
  
        if (response.body.pagination.total > 1) {
          expect(response.body.pagination.hasNext).toBe(true);
        }
      });
  

  });
});

