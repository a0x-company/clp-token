"use client"

import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Reserve() {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await axios.get(
          'https://development-vault-api-claucondor-61523929174.us-central1.run.app/vault/balance/storage',
          {
            headers: {
              'User-Agent': 'vault-oracle'
            }
          }
        );
        setBalance(response.data.balance);
      } catch (error) {
        console.error('Error al obtener el balance:', error);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 60000); // Actualiza cada minuto

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold">Reserva</h1>
        <div className="bg-white shadow-lg rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Valor en la cuenta del banco en la reserva</h2>
          {balance !== null ? (
            <p className="text-5xl font-bold text-blue-600">${balance.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          ) : (
            <p className="text-2xl text-gray-500">Cargando...</p>
          )}
        </div>
      </main>
    </div>
  );
}
