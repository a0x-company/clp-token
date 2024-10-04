// third-party
import bodyParser from "body-parser";
import cors from "cors";
import express, { Express } from "express";
import morgan from "morgan";

// service
import * as middleware from "./middlewares";


declare module "http" {
  interface IncomingMessage {
    body?: any;
    query?: any;
    params?: any;
    _startAt?: [number, number];
  }
}

const allowedOrigins = [
  "http://localhost:3000",
  "https://localhost:3000",
  "http://localhost:8080",
  "https://clp-token.vercel.app"
];

// ts-unused-exports:disable-next-line
export function createServer(): Express {
  const server = express();

  // base configuration
  server.use(cors({ origin: allowedOrigins }));
  server.use(bodyParser.json());
  server.use(express.json());

  // clpa authentication
  server.use(middleware.Permission);
  server.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, access-control-allow-origin"
    );
    if (req.method === "OPTIONS") {
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE");
      return res.status(200).json({});
    }
    next();
  });

  // morgan logger
  morgan.token("body", (req) => JSON.stringify(req.body));
  morgan.token("response-time", (req) => {
    const diff = process.hrtime(req._startAt);
    const time = diff[0] * 1e3 + diff[1] * 1e-6;
    return time.toFixed(3);
  });
  morgan.token("status", (req, res) => res.statusCode.toString());
  server.use((req, res, next) => {
    req._startAt = process.hrtime();
    res.on("finish", () => {
      const diff = process.hrtime(req._startAt);
      const time = diff[0] * 1e3 + diff[1] * 1e-6;
      console.log(`Response time: ${time.toFixed(3)} ms`);
    });
    next();
  });
  server.use(morgan(":method :url :status :res[content-length] - :response-time ms :body"));


  return server;
}
