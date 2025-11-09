import { Request, Response, NextFunction } from "express";
import { deleteGame } from "../../controllers/gameController";
import * as gameService from "../../services/gameService";
import { logger } from "../../utils/logger";
import { createNotFoundError } from "../../utils/errors";

// Mock dependencies
jest.mock("../../services/gameService");
jest.mock("../../utils/logger");

describe("deleteGame Controller", () => {
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
      params: { id: "test-game-id" },
      requestId: "test-request-id",
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };

    mockNext = jest.fn();
  });

    


    it("should delete a game successfully", async () => {
      const gameId = "test-game-id";
      (gameService.deleteGame as jest.Mock).mockResolvedValue(undefined);
      mockRequest.params = { id: gameId };

      await deleteGame(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(gameService.deleteGame).toHaveBeenCalledWith(gameId);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Game deleted successfully",
        gameId: gameId,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
    it("should handle NotFoundError and call next", async () => {
      const gameId = "non-existent-game";
      const error = createNotFoundError("Game not found", { id: gameId });
      
      (gameService.deleteGame as jest.Mock).mockRejectedValue(error);
      mockRequest.params = { id: gameId };

      await deleteGame(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(gameService.deleteGame).toHaveBeenCalledWith(gameId);
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it("should handle other errors and call next", async () => {
      const gameId = "test-game-id";
      const error = new Error("Database error");
      
      (gameService.deleteGame as jest.Mock).mockRejectedValue(error);
      mockRequest.params = { id: gameId };

      await deleteGame(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(gameService.deleteGame).toHaveBeenCalledWith(gameId);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
});

