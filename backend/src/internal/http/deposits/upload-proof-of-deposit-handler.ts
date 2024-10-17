import multer from "multer";
import { Request, Response } from "express";
import { DepositService } from "@internal/deposits/deposits";
import { StoredUserData } from "@internal/users/storage";

type RequestWithUser = Request & {
  user?: Omit<StoredUserData, 'token' | 'createdAt' | 'updatedAt'>;
  file?: multer.Multer.File;
};

function validateProofUploadRequest(req: RequestWithUser): { depositId: string; file: multer.Multer.File } | { error: string } {
  const { depositId } = req.params;
  const file = req.file;

  if (!depositId) {
    return { error: "Deposit ID is required" };
  }

  if (!file) {
    return { error: "Proof image is required" };
  }

  return { depositId, file };
}

export function uploadProofOfDepositHandler(depositService: DepositService) {
  return async (req: RequestWithUser, res: Response) => {
    try {
      const validationResult = validateProofUploadRequest(req);

      if ('error' in validationResult) {
        return res.status(400).json({ error: validationResult.error });
      }

      const { depositId, file } = validationResult;

      await depositService.uploadProofOfDeposit(
        depositId,
        file.buffer,
        file.originalname
      );

      return res.status(200).json({
        message: "Proof of deposit uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading proof of deposit:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}