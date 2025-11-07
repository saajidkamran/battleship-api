import request from "supertest";
import app from "../../app";

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
