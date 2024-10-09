// third-party
import { Request, Response, NextFunction } from "express";

// internal
import { API_KEY } from "@internal/config/index";

type RequestWithApiKey = Request & {
  headers: {
    "api-key"?: string;
  };
};

export const Permission = async (req: RequestWithApiKey, res: Response, next: NextFunction) => {
  // Lista de rutas que no requieren API key
  const whitelistedRoutes = [
    '/balance/storage',
    '/deposits/approval-form',
    '/deposits/.+/approve-reject/.+'
  ];

  const isWhitelisted = whitelistedRoutes.some(route => {
    const regex = new RegExp(`^${route}$`);
    return regex.test(req.path);
  });
  if (isWhitelisted) {
    return next();
  }

  const { "api-key": apiKey } = req.headers;

  if (!apiKey) {
    return res.status(401).send({
      error: "The api-key header is required for this endpoint",
    });
  }

  if (apiKey !== API_KEY) {
    return res.status(401).send({
      error: "The api key entered does not exist in CLPA services",
    });
  }

  next();
};