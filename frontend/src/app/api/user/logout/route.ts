import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const expiresAt = new Date(0);

  cookies().set("session", "", {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
  return NextResponse.json({ message: "Logged out" }, { status: 200 });
}
