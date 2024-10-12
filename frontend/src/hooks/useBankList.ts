import { bankListCollection } from "@/firebaseConfig";
import { getDocs } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";

export interface Bank {
  id: string;
  name: string;
}

export const useBankList = () => {
  const [bankList, setBankList] = useState<Bank[]>([]);

  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    const fetchBankList = async () => {
      const snapshot = await getDocs(bankListCollection);
      const banks: Bank[] = [];
      snapshot.forEach((doc) => {
        banks.push({ id: doc.id, ...doc.data() } as Bank);
      });
      setBankList(banks);
      fetched.current = true;
    };
    fetchBankList();
  }, []);

  return { bankList };
};
