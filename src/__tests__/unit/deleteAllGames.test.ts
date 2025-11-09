import { Request, Response, NextFunction } from "express";
import { deleteAllGames } from "../../controllers/gameController";
import * as gameService from "../../services/gameService";
import { logger } from "../../utils/logger";

// Mock dependencies
jest.mock("../../services/gameService");
jest.mock("../../utils/logger");

describe("deleteAllGames Controller", () => {
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

  describe(" Valid Requests", () => {
    it("should delete all games successfully", async () => {
      const mockResult = { deletedCount: 5 };
      (gameService.deleteAllGames as jest.Mock).mockResolvedValue(mockResult);

      await deleteAllGames(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(gameService.deleteAllGames).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "All games deleted successfully",
        deletedCount: 5,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return deletedCount of 0 when no games exist", async () => {
      const mockResult = { deletedCount: 0 };
      (gameService.deleteAllGames as jest.Mock).mockResolvedValue(mockResult);

      await deleteAllGames(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(gameService.deleteAllGames).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "All games deleted successfully",
        deletedCount: 0,
      });
    });
  });

  describe(" Error Handling", () => {
    it("should handle errors and call next", async () => {
      const error = new Error("Database error");
      (gameService.deleteAllGames as jest.Mock).mockRejectedValue(error);

      await deleteAllGames(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(gameService.deleteAllGames).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(statusMock).not.toHaveBeenCalled();
    });
  });
});

