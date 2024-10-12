import { Request, Response } from "express";
import { DepositService } from "@internal/deposits";

export function renderBurnProofFormHandler(depositService: DepositService) {
  return async (req: Request, res: Response) => {
    try {
      const { burnRequestId } = req.params;

      const burnRequest = await depositService.getBurnRequest(burnRequestId);

      if (!burnRequest) {
        return res.status(404).send("Burn request not found");
      }

      const jsonUrl = `https://storage.googleapis.com/${depositService.bucketName}/burn-requests/${burnRequestId}/redeem-transaction.json`;

      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Upload Burn Proof</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; }
            .burn-info { background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            form { margin-top: 20px; }
            input[type="file"] { margin-bottom: 10px; }
            button { padding: 10px 20px; font-size: 16px; cursor: pointer; background-color: #4CAF50; color: white; border: none; }
            .json-link { margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Upload Burn Proof</h1>
          <div class="burn-info">
            <p><strong>Burn Request ID:</strong> ${burnRequest.id}</p>
            <p><strong>Amount:</strong> ${burnRequest.amount} CLPD</p>
            <p><strong>Status:</strong> ${burnRequest.status}</p>
            <p><strong>Created:</strong> ${new Date(burnRequest.createdAt).toLocaleString()}</p>
            <p><strong>Account Holder:</strong> ${burnRequest.accountHolder}</p>
            <p><strong>RUT:</strong> ${burnRequest.rut}</p>
            <p><strong>Account Number:</strong> ${burnRequest.accountNumber}</p>
            <p><strong>Bank ID:</strong> ${burnRequest.bankId}</p>
          </div>
          <form action="/deposits/burn/${burnRequestId}/proof" method="POST" enctype="multipart/form-data">
            <input type="file" name="proofImage" accept="image/*,application/pdf" required>
            <button type="submit">Upload Proof</button>
          </form>
          <div class="json-link">
            <a href="${jsonUrl}" target="_blank">View Redeem Transaction JSON</a>
          </div>
          <script>
            document.querySelector('form').addEventListener('submit', function(e) {
              e.preventDefault();
              const formData = new FormData(this);
              fetch(this.action, {
                method: 'POST',
                body: formData
              })
              .then(response => response.json())
              .then(data => {
                if (data.error) {
                  throw new Error(data.error);
                }
                alert('Proof uploaded successfully');
                window.location.href = '/'; // Redirect to main page or appropriate location
              })
              .catch(error => {
                console.error('Error:', error);
                alert('Error uploading proof: ' + error.message);
              });
            });
          </script>
        </body>
        </html>
      `;

      res.send(html);
    } catch (error) {
      console.error("Error rendering burn proof form:", error);
      res.status(500).send("Internal server error");
    }
  };
}