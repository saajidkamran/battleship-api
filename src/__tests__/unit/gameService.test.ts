import request from "supertest";
import app from "../../app";

describe("POST /api/v1/game/start", () => {
  it("should start a new game and return placed ships", async () => {
    const response = await request(app).post("/api/v1/game/start").send();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("ships");
    expect(Array.isArray(response.body.ships)).toBe(true);
    expect(response.body.ships.length).toBeGreaterThan(0);

    // validate ship structure
    const ship = response.body.ships[0];
    expect(ship).toHaveProperty("id");
    expect(ship).toHaveProperty("name");
    expect(ship).toHaveProperty("size");
    expect(ship).toHaveProperty("positions");
    expect(Array.isArray(ship.positions)).toBe(true);

    // ensure coordinates look valid like A1..J10
    const coordRegex = /^[A-J](10|[1-9])$/;
    for (const s of response.body.ships) {
      for (const pos of s.positions) {
        expect(coordRegex.test(pos)).toBe(true);
      }
    }
  });

});
