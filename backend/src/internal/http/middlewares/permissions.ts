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
  if (req.path.endsWith('/balance/storage')) {
    return next();
  }

  const { "api-key": apiKey } = req.headers;

  if (!apiKey) {
    return res.status(401).send({
      error: "the api-key header is required in this endpoint",
    });
  }

  if (apiKey != API_KEY) {
    return res.status(401).send({
      error: "the api key entered does not exist in clpa services",
    });
  }

  next();
};