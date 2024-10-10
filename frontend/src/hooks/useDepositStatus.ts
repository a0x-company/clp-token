// react
import { useState, useEffect } from "react";
// firebase
import { doc, onSnapshot } from "firebase/firestore";
import { depositsCollection } from "@/firebaseConfig";
// types
import { DepositStatus } from "@/types";

export const useDepositStatus = (depositId: string) => {
  const [status, setStatus] = useState<DepositStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    if (!depositId || depositId === "") return;
    const depositRef = doc(depositsCollection, depositId);

    const unsubscribe = onSnapshot(
      depositRef,
      (doc) => {
        if (doc.exists()) {
          const depositData = doc.data();
          setStatus(depositData.status);
        } else {
          setError("No se encontró el documento del depósito");
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error al escuchar cambios en el depósito:", error);
        setError("Error al obtener el estado del depósito");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [depositId]);

  return { status, loading, error };
};
