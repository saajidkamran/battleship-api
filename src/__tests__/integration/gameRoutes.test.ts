import request from "supertest";
import app from "../../app";
import { mockShips } from "../helpers/testMocks";

let gameId: string;

jest.mock("../../services/shipPlacement", () => ({
  placeShips: () => mockShips,
}));

beforeAll(async () => {
  const res = await request(app).post("/api/v1/game/start");
  gameId = res.body.gameId;
});

describe("POST /api/v1/game/start", () => {
  it("should start a new game and return placed ships", async () => {
    const response = await request(app).post("/api/v1/game/start").send();

    expect(response.status).toBe(201);

    // validate ship structure
    expect(response.body).toHaveProperty("gameId");
    expect(response.body).toHaveProperty("gridSize", "10x10");
    expect(response.body).toHaveProperty("shipsCount");
    expect(typeof response.body.gameId).toBe("string");
    expect(response.body.shipsCount).toBeGreaterThan(0);
    expect(response.body).toHaveProperty("message", "New game started.");
  });
});

describe("POST /game/:id/fire", () => {
  it("should fire a shot and return hit/miss", async () => {
    const game = await request(app).post("/api/v1/game/start");
    const id = game.body.gameId;

    const res = await request(app)
      .post(`/api/v1/game/${id}/fire`)
      .set("Idempotency-Key", "xyz-1")
      .send({ coordinate: "A5" });

    expect(res.status).toBe(200);
    expect(["hit", "miss"]).toContain(res.body.result);
  });
  it("should return identical response for same Idempotency-Key", async () => {
    const first = await request(app)
      .post(`/api/v1/game/${gameId}/fire`)
      .set("Idempotency-Key", "dup-key")
      .send({ coordinate: "A2" });

    const second = await request(app)
      .post(`/api/v1/game/${gameId}/fire`)
      .set("Idempotency-Key", "dup-key")
      .send({ coordinate: "A2" });

    expect(second.status).toBe(200);
    expect(second.body.idempotent).toBe(true);
    expect(second.body.result).toBe(first.body.result);
  });
  it("should return 400 for invalid coordinate", async () => {
    const res = await request(app)
      .post(`/api/v1/game/${gameId}/fire`)
      .set("Idempotency-Key", "invalid-1")
      .send({ coordinate: "Z99" });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].msg).toMatch(/A1|J10/);
  });
});
describe("POST /api/v1/game/status", () => {
  it("should return current game state", async () => {
    const res = await request(app).get(`/api/v1/game/${gameId}/state`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status");
    expect(Array.isArray(res.body.shots)).toBe(true);
    expect(res.body).toHaveProperty("remainingShips");
  });
  it("should reject invalid gameId", async () => {
    const res = await request(app)
      .post("/api/v1/game/123/fire")
      .set("Idempotency-Key", "invalid-gameid")
      .send({ coordinate: "A5" });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].msg).toMatch(/Invalid game ID/);
  });
  it("should mark the game as WON after all ships are sunk", async () => {
    // 1. Start a deterministic game
    const newGame = await request(app).post("/api/v1/game/start");
    const gameId = newGame.body.gameId;

    // 2. Fire exactly at known ship positions (A1, A2, B1, C1)
    const hits = ["A1", "A2", "B1", "C1"];

    for (const coordinate of hits) {
      const res = await request(app)
        .post(`/api/v1/game/${gameId}/fire`)
        .set("Idempotency-Key", coordinate)
        .send({ coordinate });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("result");
      expect(["hit", "miss"]).toContain(res.body.result);
    }

    // 3. Check final game state
    const finalState = await request(app).get(`/api/v1/game/${gameId}/state`);

    expect(finalState.body.status).toBe("WON");
    expect(finalState.body.remainingShips).toBe(0);
  });
});

describe("Rate Limiter Middleware", () => {
  it("should allow requests within limit and block when exceeded", async () => {
    const route = "/api/v1/game/start";

    //  requests within limit
    for (let i = 0; i < 20; i++) {
      const res = await request(app).post(route);
    }

    // 6th should trigger limiter
    const limited = await request(app).post(route);
    expect(limited.status).toBe(429);
    expect(limited.body).toHaveProperty(
      "error",
      "Too many requests, please try again later."
    );
  });

  it("should reset after the window passes (real time delay)", async () => {
    const route = "/api/v1/game/start";

    // Fill the limit again
    for (let i = 0; i < 5; i++) {
      await request(app).post(route);
    }

    // Wait for rate limit window to expire (simulate 1s window if testing)
    await new Promise((resolve) => setTimeout(resolve, 1100)); // adjust for your windowMs

    // Next request should pass again
    const res = await request(app).post(route);
  });
});
