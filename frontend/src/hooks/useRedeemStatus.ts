// react
import { useState, useEffect, useCallback } from "react";
// firebase
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { redeemsCollection } from "@/firebaseConfig";
// types
import { RedeemStatus } from "@/types";

export const useRedeemStatus = (redeemId: string) => {
  const [status, setStatus] = useState<RedeemStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (redeemRef: any) => {
    setLoading(true);
    setError(null);

    try {
      const docSnap = await getDoc(redeemRef);
      if (docSnap.exists()) {
        const redeemData = docSnap.data() as { status: RedeemStatus };
        setStatus(redeemData.status);
      } else {
        setError("No se encontró el documento del retiro");
      }
    } catch (error) {
      console.error("Error al obtener datos:", error);
      setError("Error al obtener el estado del retiro");
    } finally {
      setLoading(false);
    }
  };

  const refetch = useCallback(() => {
    if (!redeemId || redeemId === "") return;
    const redeemRef = doc(redeemsCollection, redeemId);
    fetchData(redeemRef);
  }, [redeemId]);

  useEffect(() => {
    if (!redeemId || redeemId === "") return;
    const redeemRef = doc(redeemsCollection, redeemId);

    // Consulta inicial
    fetchData(redeemRef);

    // Suscripción en tiempo real
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

  return { status, loading, error, refetch };
};
