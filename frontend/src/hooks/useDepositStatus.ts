// react
import { useState, useEffect, useCallback } from "react";
// firebase
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { depositsCollection } from "@/firebaseConfig";
// types
import { DepositStatus } from "@/types";

export const useDepositStatus = (depositId: string) => {
  const [status, setStatus] = useState<DepositStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (depositRef: any) => {
    setLoading(true);
    setError(null);
    try {
      const docSnap = await getDoc(depositRef);
      if (docSnap.exists()) {
        const depositData = docSnap.data() as { status: DepositStatus };
        setStatus(depositData.status);
      } else {
        setError("No se encontró el documento del depósito");
      }
    } catch (error) {
      console.error("Error al obtener datos:", error);
      setError("Error al obtener el estado del depósito");
    } finally {
      setLoading(false);
    }
  };

  const refetch = useCallback(() => {
    if (!depositId || depositId === "") return;
    const depositRef = doc(depositsCollection, depositId);
    fetchData(depositRef);
  }, [depositId]);

  useEffect(() => {
    if (!depositId || depositId === "") return;
    const depositRef = doc(depositsCollection, depositId);

    // Consulta inicial
    fetchData(depositRef);

    // Suscripción en tiempo real
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

  return { status, loading, error, refetch };
};
