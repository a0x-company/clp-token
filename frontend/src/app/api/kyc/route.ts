// next
import { NextResponse } from "next/server";

// firebase
import { db } from "@/firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

const SYNAPS_API_KEY = process.env.SYNAPS_API_KEY;

export async function GET(request: Request) {
  console.info("[GET][/api/kyc]");
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const sessionId = searchParams.get("sessionId");

  if (!email && !sessionId) {
    return NextResponse.json(
      { error: "Email or sessionId is required" },
      { status: 400 }
    );
  }

  if (!sessionId && email) {
    try {
      const userDoc = doc(db, "users", email);
      const userSnapshot = await getDoc(userDoc);

      if (userSnapshot.exists()) {
        if (userSnapshot.data().kycSessionId) {
          return NextResponse.json({
            message: "Session already created",
            sessionId: userSnapshot.data().kycSessionId,
            status: userSnapshot.data().kycStatus,
          });
        } else {
          const response = await fetch(
            "https://api.synaps.io/v4/session/init",
            {
              method: "POST",
              headers: {
                "Api-Key": SYNAPS_API_KEY!,
              },
            }
          );
          const data = await response.json();
          console.log("data", data);
          const kycSessionId = data.session_id;
          await updateDoc(userDoc, {
            kycSessionId,
            kycStatus: "STARTED",
          });
          return NextResponse.json({
            message: "Session created",
            sessionId: kycSessionId,
            status: "STARTED",
          });
        }
      } else {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    } catch (error) {
      console.error("Error initializing session:", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  } else if (sessionId) {
    try {
      const response = await fetch(
        `https://api.synaps.io/v4/individual/session/${sessionId}`,
        {
          method: "GET",
          headers: {
            "Api-Key": SYNAPS_API_KEY!,
          },
        }
      );
      const data = await response.json();
      if (data.session.status !== "STARTED") {
        const collectionRef = collection(db, "user-data");
        const q = query(collectionRef, where("kycSessionId", "==", sessionId));
        const querySnapshot = await getDocs(q);
        const updatePromises = querySnapshot.docs.map((doc) => {
          const userDoc = doc.ref;
          return updateDoc(userDoc, {
            kycStatus: data.session.status,
          });
        });
        await Promise.all(updatePromises);
      }
      return NextResponse.json({
        message: "Session details",
        sessionDetails: data,
      });
    } catch (error) {
      console.error("Error getting session:", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  }
}

export async function POST(request: Request) {
  console.info("[POST][/api/kyc]");

  try {
    const formData = await request.json();
    const { email } = formData;

    if (!email) {
      return NextResponse.json(
        { error: "El email es requerido" },
        { status: 400 }
      );
    }

    const userDoc = doc(db, "users", email);
    const userSnapshot = await getDoc(userDoc);

    if (!userSnapshot.exists()) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar documento del usuario con la información del formulario
    await updateDoc(userDoc, {
      ...formData,
    });

    return NextResponse.json({
      message: "Datos del formulario guardados correctamente",
      status: 200,
    });
  } catch (error) {
    console.error("Error al procesar la solicitud POST:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
