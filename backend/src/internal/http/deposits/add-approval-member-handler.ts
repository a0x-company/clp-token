import { Request, Response } from "express";
import { DepositService } from "@internal/deposits";

export function addApprovalMemberHandler(depositService: DepositService) {
  return async (req: Request, res: Response) => {
    try {
      const { name, password } = req.body;

      if (!name || !password) {
        return res.status(400).json({ error: 'Name and password are required' });
      }

      await depositService.addApprovalMember(name, password);
      res.status(201).json({ message: 'Approval member added successfully' });
    } catch (error) {
      console.error('Error adding approval member:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}