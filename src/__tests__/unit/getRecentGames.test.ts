import { Request, Response, NextFunction } from "express";
import { getRecentGames } from "../../controllers/gameController";
import * as gameService from "../../services/gameService";
import { logger } from "../../utils/logger";

jest.mock("../../services/gameService");
jest.mock("../../utils/logger");

describe("getRecentGames Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup response mocks
    jsonMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      requestId: "test-request-id",
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };

    mockNext = jest.fn();
  });

  describe("Test to check all request and response functions", () => {
    it("should return recent games successfully", async () => {
      const mockGames = [
        {
          id: "game-1",
          status: "IN_PROGRESS",
          shots: ["A1", "B2"],
          ships: [
            { id: "1", name: "Battleship", isSunk: false },
            { id: "2", name: "Destroyer", isSunk: true },
          ],
          createdAt: new Date(),
        },
        {
          id: "game-2",
          status: "IN_PROGRESS",
          shots: ["C3"],
          ships: [{ id: "3", name: "Battleship", isSunk: false }],
          createdAt: new Date(),
        },
      ];

      (gameService.getRecentGames as jest.Mock).mockResolvedValue(mockGames);

      await getRecentGames(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(gameService.getRecentGames).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Recent games (last 24 hours)",
        count: 2,
        games: [
          {
            gameId: "game-1",
            status: "IN_PROGRESS",
            shots: ["A1", "B2"],
            remainingShips: 1,
            createdAt: mockGames[0].createdAt,
          },
          {
            gameId: "game-2",
            status: "IN_PROGRESS",
            shots: ["C3"],
            remainingShips: 1,
            createdAt: mockGames[1].createdAt,
          },
        ],
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return empty array when no recent games exist", async () => {
      const mockGames: any[] = [];
      (gameService.getRecentGames as jest.Mock).mockResolvedValue(mockGames);

      await getRecentGames(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(gameService.getRecentGames).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Recent games (last 24 hours)",
        count: 0,
        games: [],
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should correctly calculate remaining ships", async () => {
      const mockGames = [
        {
          id: "game-1",
          status: "IN_PROGRESS",
          shots: [],
          ships: [
            { id: "1", name: "Battleship", isSunk: false },
            { id: "2", name: "Destroyer", isSunk: false },
            { id: "3", name: "Submarine", isSunk: true },
          ],
          createdAt: new Date(),
        },
      ];

      (gameService.getRecentGames as jest.Mock).mockResolvedValue(mockGames);

      await getRecentGames(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(jsonMock).toHaveBeenCalledWith({
        message: "Recent games (last 24 hours)",
        count: 1,
        games: [
          {
            gameId: "game-1",
            status: "IN_PROGRESS",
            shots: [],
            remainingShips: 2,
            createdAt: mockGames[0].createdAt,
          },
        ],
      });
    });
  });

  it("should handle service error and call next", async () => {
    const error = new Error("Database connection failed");
    (gameService.getRecentGames as jest.Mock).mockRejectedValue(error);

    await getRecentGames(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(error);
    expect(jsonMock).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      "Error fetching recent games",
      error,
      { requestId: "test-request-id" }
    );
  });

  it("should handle database query error", async () => {
    const error = new Error("Query execution failed");
    (gameService.getRecentGames as jest.Mock).mockRejectedValue(error);

    await getRecentGames(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(error);
    expect(logger.error).toHaveBeenCalled();
  });
});
