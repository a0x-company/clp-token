// firebase
import { db, userDataCollection } from "@/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

// jose
import * as jose from "jose";

// eccrypto
import { getPublicCompressed } from "@toruslabs/eccrypto";

// auth
import { encrypt } from "@/lib/auth";

// next
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// axios
import axios from "axios";

// crypto
import crypto from "crypto";

const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

export async function POST(request: Request) {
  const { address, encryptedPKey, iv } = await request.json();
  const idToken = request.headers.get("Authorization")?.split(" ")[1];
  const encryptionKey = request.headers.get("X-Encryption-Key") as string;

  if (!address || !idToken || !encryptedPKey) {
    return NextResponse.json(
      { error: "Address, idToken, and encryptedPKey are required" },
      { status: 400 }
    );
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(encryptionKey, "hex"),
    Buffer.from(iv, "hex")
  );

  let pKey = decipher.update(encryptedPKey, "hex", "utf8");
  pKey += decipher.final("utf8");

  try {
    const appPubKey = getPublicCompressed(Buffer.from(pKey.padStart(64, "0"), "hex")).toString(
      "hex"
    );

    const jwks = jose.createRemoteJWKSet(new URL("https://api-auth.web3auth.io/jwks"));

    const jwtDecoded = await jose.jwtVerify(idToken, jwks, {
      algorithms: ["ES256"],
    });

    const verifiedWallet = (jwtDecoded.payload as any).wallets.find(
      (x: { type: string }) => x.type === "web3auth_app_key"
    );

    if (!verifiedWallet || verifiedWallet.public_key.toLowerCase() !== appPubKey.toLowerCase()) {
      return NextResponse.json({ error: "Verification Failed" }, { status: 400 });
    }

    const payload = jwtDecoded.payload as any;
    const userId = payload.email;

    const userRef = doc(userDataCollection, address);
    const userDoc = await getDoc(userRef);

    console.log("userSnapshot", userDoc);

    let userDataToReturn;

    if (userDoc.exists()) {
      userDataToReturn = userDoc.data();
      try {
        const response = await axios.post(
          `${API_URL}/users`,
          {
            pK: pKey,
          },
          {
            headers: {
              "api-key": API_KEY,
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
          }
        );
        console.log("response", response);
      } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Database connection error" }, { status: 500 });
      }
    } else {
      try {
        const response = await axios.post(
          `${API_URL}/users`,
          {
            address: address,
            token: idToken,
            pK: pKey,
          },
          {
            headers: {
              "api-key": API_KEY,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("response", response);
        userDataToReturn = response.data;
      } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json({ error: "Database connection error" }, { status: 500 });
      }
    }

    const sessionUser = {
      userId: userId,
      email: payload.email,
      name: payload.name,
      profileImage: payload.profileImage,
      token: idToken,
    };

    const expiresAt = new Date(jwtDecoded.payload.exp! * 1000);
    const session = await encrypt(sessionUser);

    cookies().set("session", session, {
      httpOnly: true,
      secure: true,
      expires: expiresAt,
      sameSite: "lax",
      path: "/",
    });

    return NextResponse.json(userDataToReturn);
  } catch (error) {
    console.error("Error processing user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
