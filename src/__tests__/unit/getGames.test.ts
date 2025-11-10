import { Request, Response, NextFunction } from "express";
import { getGames } from "../../controllers/gameController";
import * as gameService from "../../services/gameService";
import { logger } from "../../utils/logger";

jest.mock("../../services/gameService");
jest.mock("../../utils/logger");

describe("getGames Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    jsonMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      query: {},
      body: {},
      requestId: "test-request-id",
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };

    mockNext = jest.fn();
  });

  describe("Valid Inputs", () => {
    it("should return paginated games with default pagination (query params)", async () => {
      const mockGames = {
        data: [
          { id: "1", status: "IN_PROGRESS", ships: [] },
          { id: "2", status: "IN_PROGRESS", ships: [] },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      (gameService.getGames as jest.Mock).mockResolvedValue(mockGames);
      mockRequest.query = {};

      await getGames(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(gameService.getGames).toHaveBeenCalledWith(undefined, 1, 10);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "All games",
        ...mockGames,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return games filtered by status (query params)", async () => {
      const mockGames = {
        data: [{ id: "1", status: "IN_PROGRESS", ships: [] }],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      (gameService.getGames as jest.Mock).mockResolvedValue(mockGames);
      mockRequest.query = { status: "IN_PROGRESS" };

      await getGames(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(gameService.getGames).toHaveBeenCalledWith("IN_PROGRESS", 1, 10);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Games with status IN_PROGRESS",
        ...mockGames,
      });
    });

    it("should handle pagination with query params", async () => {
      const mockGames = {
        data: [{ id: "1", status: "WON", ships: [] }],
        pagination: {
          page: 2,
          limit: 5,
          total: 10,
          totalPages: 2,
          hasNext: false,
          hasPrev: true,
        },
      };

      (gameService.getGames as jest.Mock).mockResolvedValue(mockGames);
      mockRequest.query = {
        status: "WON",
        page: "2",
        limit: "5",
      };

      await getGames(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(gameService.getGames).toHaveBeenCalledWith("WON", 2, 5);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Games with status WON",
        ...mockGames,
      });
    });

    it("should handle case-insensitive status (lowercase)", async () => {
      const mockGames = {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };

      (gameService.getGames as jest.Mock).mockResolvedValue(mockGames);
      mockRequest.query = { status: "in_progress" };

      await getGames(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(gameService.getGames).toHaveBeenCalledWith("IN_PROGRESS", 1, 10);
    });

    it("should handle status with whitespace", async () => {
      const mockGames = {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };

      (gameService.getGames as jest.Mock).mockResolvedValue(mockGames);
      mockRequest.query = { status: "  won  " };

      await getGames(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(gameService.getGames).toHaveBeenCalledWith("WON", 1, 10);
    });
  });

  describe("Invalid Inputs", () => {
    it("should handle invalid page number (negative)", async () => {
      mockRequest.query = { page: "-1" };

      await getGames(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Should default to page 1
      expect(gameService.getGames).toHaveBeenCalledWith(undefined, 1, 10);
    });

    it("should handle invalid page number (zero)", async () => {
      mockRequest.query = { page: "0" };

      await getGames(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Should default to page 1
      expect(gameService.getGames).toHaveBeenCalledWith(undefined, 1, 10);
    });

    it("should handle invalid page number (non-numeric)", async () => {
      mockRequest.query = { page: "abc" };

      await getGames(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Should default to page 1
      expect(gameService.getGames).toHaveBeenCalledWith(undefined, 1, 10);
    });

    it("should handle invalid limit (too high)", async () => {
      mockRequest.query = { limit: "200" };

      await getGames(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(gameService.getGames).toHaveBeenCalledWith(undefined, 1, 100);
    });

    it("should handle invalid limit (negative)", async () => {
      mockRequest.query = { limit: "-5" };

      await getGames(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // parseInt("-5") = -5, Math.max(1, -5) = 1, so it becomes 1
      expect(gameService.getGames).toHaveBeenCalledWith(undefined, 1, 1);
    });

    it("should handle invalid limit (zero)", async () => {
      mockRequest.query = { limit: "0" };

      await getGames(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Should default to 10
      expect(gameService.getGames).toHaveBeenCalledWith(undefined, 1, 10);
    });

    it("should handle invalid limit (non-numeric)", async () => {
      mockRequest.query = { limit: "xyz" };

      await getGames(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Should default to 10
      expect(gameService.getGames).toHaveBeenCalledWith(undefined, 1, 10);
    });

    it("should handle service error and call next", async () => {
      const error = new Error("Database connection failed");
      (gameService.getGames as jest.Mock).mockRejectedValue(error);
      mockRequest.query = { status: "IN_PROGRESS" };

      await getGames(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it("should handle invalid status from service", async () => {
      const error = new Error("Invalid status value: INVALID_STATUS");
      (gameService.getGames as jest.Mock).mockRejectedValue(error);
      mockRequest.query = { status: "INVALID_STATUS" };

      await getGames(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  it("should handle empty result set", async () => {
    const mockGames = {
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };

    (gameService.getGames as jest.Mock).mockResolvedValue(mockGames);
    mockRequest.query = { status: "WON" };

    await getGames(mockRequest as Request, mockResponse as Response, mockNext);

    expect(jsonMock).toHaveBeenCalledWith({
      message: "Games with status WON",
      ...mockGames,
    });
  });

  it("should handle maximum limit (100)", async () => {
    const mockGames = {
      data: Array(100).fill({ id: "1", status: "IN_PROGRESS" }),
      pagination: {
        page: 1,
        limit: 100,
        total: 100,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };

    (gameService.getGames as jest.Mock).mockResolvedValue(mockGames);
    mockRequest.query = { limit: "100" };

    await getGames(mockRequest as Request, mockResponse as Response, mockNext);

    expect(gameService.getGames).toHaveBeenCalledWith(undefined, 1, 100);
  });
  it("should handle missing requestId gracefully", async () => {
    const mockGames = {
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };

    (gameService.getGames as jest.Mock).mockResolvedValue(mockGames);
    delete mockRequest.requestId;
    mockRequest.query = {};

    await getGames(mockRequest as Request, mockResponse as Response, mockNext);

    expect(gameService.getGames).toHaveBeenCalled();
    expect(jsonMock).toHaveBeenCalled();
  });

  it("should handle all status values", async () => {
    const statuses = ["IN_PROGRESS", "WON", "LOST"];

    for (const status of statuses) {
      const mockGames = {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };

      (gameService.getGames as jest.Mock).mockResolvedValue(mockGames);
      mockRequest.query = { status };

      await getGames(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(gameService.getGames).toHaveBeenCalledWith(status, 1, 10);
    }
  });

  describe("Pagination Edge Cases", () => {
    it("should handle very large page numbers", async () => {
      mockRequest.query = { page: "999999" };

      await getGames(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Should accept large page numbers (service will handle empty results)
      expect(gameService.getGames).toHaveBeenCalledWith(undefined, 999999, 10);
    });

    it("should handle decimal page numbers", async () => {
      mockRequest.query = { page: "1.5" };

      await getGames(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // parseInt will convert to 1
      expect(gameService.getGames).toHaveBeenCalledWith(undefined, 1, 10);
    });

    it("should handle decimal limit numbers", async () => {
      mockRequest.query = { limit: "15.7" };

      await getGames(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // parseInt will convert to 15
      expect(gameService.getGames).toHaveBeenCalledWith(undefined, 1, 15);
    });
  });
});
