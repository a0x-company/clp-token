// react
import { useState, useEffect } from "react";
// firebase
import { doc, onSnapshot } from "firebase/firestore";
import { redeemsCollection } from "@/firebaseConfig";
// types
import { RedeemStatus } from "@/types";

export const useRedeemStatus = (redeemId: string) => {
  const [status, setStatus] = useState<RedeemStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    if (!redeemId || redeemId === "") return;
    const redeemRef = doc(redeemsCollection, redeemId);

    const unsubscribe = onSnapshot(
      redeemRef,
      (doc) => {
        if (doc.exists()) {
          const redeemData = doc.data();
          setStatus(redeemData.status);
        } else {
          setError("No se encontró el documento del retiro");
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error al escuchar cambios en el retiro:", error);
        setError("Error al obtener el estado del retiro");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [redeemId]);

  return { status, loading, error };
};
