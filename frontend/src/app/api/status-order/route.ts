// next
import { NextResponse } from "next/server";

// firebase
import { depositsCollection } from "@/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { DepositStatus } from "@/types";

interface Deposit {
  status: DepositStatus;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const depositId = searchParams.get("depositId");
  const idToken = request.headers.get("Authorization");

  console.log("idToken", idToken);

  if (!idToken || !depositId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const depositDoc = doc(depositsCollection, depositId as string);
    const depositSnapshot = await getDoc(depositDoc);

    if (!depositSnapshot.exists()) {
      return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
    }

    const depositData = depositSnapshot.data();
    const { status } = depositData as Deposit;

    return NextResponse.json({ message: "Order found successfully", status }, { status: 200 });
  } catch (error) {
    console.log("error", error);
    return NextResponse.json({ error: "Internal Server Error" + error }, { status: 500 });
  }
}
