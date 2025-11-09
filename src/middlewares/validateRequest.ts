import { body, param, query, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const validateGameId = [
  param("id").isUUID().withMessage("Invalid game ID"),
];

export const validateFire = [
  ...validateGameId,
  body("coordinate")
    .trim()
    .toUpperCase()
    .matches(/^[A-J](10|[1-9])$/)
    .withMessage("Coordinate must be between A1 and J10"),
];

export const validatePagination = [
  // Query params validation (primary for GET requests)
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("status")
    .optional()
    .isIn(["IN_PROGRESS", "WON", "LOST"])
    .withMessage("Status must be one of: IN_PROGRESS, WON, LOST"),
  // Body params validation (for backward compatibility with POST)
  body("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  body("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  body("status")
    .optional()
    .isIn(["IN_PROGRESS", "WON", "LOST"])
    .withMessage("Status must be one of: IN_PROGRESS, WON, LOST"),
];
