// third-party
import { Express, Router } from "express";
import multer from "multer";

// services
import { DepositService } from "@internal/deposits";
import { UserService } from "@internal/users";

// handlers
import { approveRejectDepositHandler } from "./approve-reject-deposit-handler";
import { getDepositsByStatusHandler } from "./get-deposits-handler";
import { mintDepositsHandler } from "./mint-deposits-handler";
import { registerDepositHandler } from "./register-deposit-handler";
import { uploadProofOfDepositHandler } from "./upload-proof-of-deposit-handler";

// middleware
import { AuthMiddleware } from "@internal/http/middlewares/authentication";

const upload = multer({ storage: multer.memoryStorage() });

export function setupDepositRoutes(
  router: Express,
  depositService: DepositService,
  userService: UserService
) {
  const depositRouter = Router();
  
  depositRouter.post("/", AuthMiddleware(userService), registerDepositHandler(depositService));
  depositRouter.post("/:depositId/proof", AuthMiddleware(userService), upload.single('proofImage'), uploadProofOfDepositHandler(depositService));
  depositRouter.get("/status/:status", AuthMiddleware(userService), getDepositsByStatusHandler(depositService));
  depositRouter.post("/:depositId/approve-reject", AuthMiddleware(userService), approveRejectDepositHandler(depositService));
  depositRouter.post("/mint", AuthMiddleware(userService), mintDepositsHandler(depositService));

  router.use("/deposits", depositRouter);
  console.log("Deposit routes set up");
}