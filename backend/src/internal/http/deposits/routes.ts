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
import { renderApprovalFormHandler } from "./render-approval-form-handler";
import { addApprovalMemberHandler } from "./add-approval-member-handler";
import { registerBurnRequestHandler } from "./register-burn-request-handler";
import { uploadBurnProofHandler } from "./upload-burn-proof-handler";
import { approveRejectBurnRequestHandler } from "./approve-reject-burn-request-handler";
import { getBurnRequestsByStatusHandler } from "./get-burn-requests-handler";
import { renderBurnProofFormHandler } from "./render-burn-proof-form-handler";

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
  
  depositRouter.get("/approval-form/:depositId/:token", renderApprovalFormHandler(depositService));
  
  depositRouter.post("/:depositId/approve-reject/:token", approveRejectDepositHandler(depositService));
  
  depositRouter.post("/mint", AuthMiddleware(userService), mintDepositsHandler(depositService));

  depositRouter.post("/add-approval-member", addApprovalMemberHandler(depositService));
  depositRouter.post("/burn", AuthMiddleware(userService), registerBurnRequestHandler(depositService));
  depositRouter.get("/burn/:burnRequestId/proof-form", renderBurnProofFormHandler(depositService));
  depositRouter.post("/burn/:burnRequestId/proof", upload.single('proofImage'), uploadBurnProofHandler(depositService));
  depositRouter.post("/burn/:burnRequestId/approve-reject", AuthMiddleware(userService), approveRejectBurnRequestHandler(depositService));
  depositRouter.get("/burn/status/:status", AuthMiddleware(userService), getBurnRequestsByStatusHandler(depositService));
  
  router.use("/deposits", depositRouter);
  console.log("Deposit routes set up");
}