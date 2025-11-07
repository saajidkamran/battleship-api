import { body, param, validationResult } from "express-validator";
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
