import { Request, Response } from "express";
import { DepositService } from "@internal/deposits";

export function renderApprovalFormHandler(depositService: DepositService) {
  return async (req: Request, res: Response) => {
    try {
      const { depositId, token } = req.params;

      if (!(await depositService.validateApprovalToken(depositId, token))) {
        return res.status(403).send("Invalid or expired approval link");
      }

      const deposit = await depositService.getDeposit(depositId);

      if (!deposit) {
        return res.status(404).send("Deposit not found");
      }

      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Approve/Reject Deposit</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; }
            .deposit-info { background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .actions { display: flex; justify-content: space-between; }
            button { padding: 10px 20px; font-size: 16px; cursor: pointer; }
            .approve { background-color: #4CAF50; color: white; border: none; }
            .reject { background-color: #f44336; color: white; border: none; }
            img { max-width: 100%; height: auto; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>Approve/Reject Deposit</h1>
          <div class="deposit-info">
            <p><strong>ID:</strong> ${deposit.id}</p>
            <p><strong>Amount:</strong> ${deposit.amount}</p>
            <p><strong>Email:</strong> ${deposit.email}</p>
            <p><strong>Address:</strong> ${deposit.address}</p>
            <p><strong>Status:</strong> ${deposit.status}</p>
            <p><strong>Created:</strong> ${new Date(deposit.createdAt).toLocaleString()}</p>
          </div>
          <img src="${deposit.proofImageUrl}" alt="Proof of deposit">
          <div class="actions">
            <button class="approve" onclick="approveDeposit()">Approve</button>
            <button class="reject" onclick="rejectDeposit()">Reject</button>
          </div>
          <script>
            function approveDeposit() {
              if (confirm('Are you sure you want to approve this deposit?')) {
                sendAction('approve');
              }
            }
            function rejectDeposit() {
              const reason = prompt('Please enter the reason for rejection:');
              if (reason) {
                sendAction('reject', reason);
              }
            }
            function sendAction(action, reason = '') {
              fetch('/deposits/${depositId}/approve-reject/${token}', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action, reason })
              })
              .then(response => response.json())
              .then(data => {
                alert(data.message);
                window.close();
              })
              .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while processing the request');
              });
            }
          </script>
        </body>
        </html>
      `;

      res.send(html);
    } catch (error) {
      console.error("Error rendering approval form:", error);
      res.status(500).send("Internal server error");
    }
  };
}