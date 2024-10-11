import axios from "axios";
import { NextResponse } from "next/server";

const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

export async function POST(request: Request) {
  console.info("[POST][/api/withdraw/create-order]");
  const { amount } = await request.json();
  const idToken = request.headers.get("Authorization")?.split(" ")[1];

  if (!idToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await axios.post(
      `${API_URL}/redeems`,
      { amount },
      {
        headers: {
          "api-key": API_KEY,
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      }
    );

    console.log("response", response);

    if (response.status !== 201 && response.status !== 200) {
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Order created", redeemId: response.data.redeem.id },
      { status: 200 }
    );
  } catch (error) {
    console.log("error", error);
    return NextResponse.json({ error: "Internal Server Error" + error }, { status: 500 });
  }
}
