import axios from "axios";
import { NextResponse } from "next/server";

const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const depositId = formData.get("depositId") as string;
  const idToken = request.headers.get("Authorization")?.split(" ")[1];

  if (!idToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = new FormData();
    formData.append("proofImage", file);

    const proofResponse = await axios.post(`${API_URL}/deposits/${depositId}/proof`, formData, {
      headers: {
        "api-key": API_KEY,
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("proofResponse", proofResponse);

    if (proofResponse.status !== 200) {
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    return NextResponse.json({ message: "Order created" }, { status: 200 });
  } catch (error) {
    console.log("error", error);
    return NextResponse.json({ error: "Internal Server Error" + error }, { status: 500 });
  }
}
