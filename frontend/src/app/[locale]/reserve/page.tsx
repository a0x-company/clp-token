'use client';

import React, { useEffect, useState } from 'react';

// http client
import axios from 'axios';

// ethers
import { ethers } from 'ethers';

// ABI simplificado para la función totalSupply
const ABI = [
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
];

export default function Reserve() {
  const [bankBalance, setBankBalance] = useState<number | null>(null);
  const [tokenSupply, setTokenSupply] = useState<string | null>(null);
  const [isMatching, setIsMatching] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchBankBalance = async () => {
      try {
        const response = await axios.get(
          'https://development-vault-api-claucondor-61523929174.us-central1.run.app/vault/balance/storage'
        );
        setBankBalance(response.data.balance);
      } catch (error) {
        console.error('Error al obtener el balance del banco:', error);
      }
    };

    const fetchTokenSupply = async () => {
      try {
        const provider = new ethers.providers.JsonRpcProvider(
          'https://eth-sepolia.public.blastapi.io'
        );
        const contractAddress = '0x28DAab58fFD02cc19A7E4655e1d6766023F5FeAC';
        const contract = new ethers.Contract(contractAddress, ABI, provider);

        const supply = await contract.totalSupply();
        const formattedSupply = ethers.utils.formatUnits(supply, 18);

        console.log('formattedSupply', formattedSupply);
        setTokenSupply(formattedSupply);
      } catch (error) {
        console.error('Error al obtener el total supply del token:', error);
      }
    };

    const fetchData = async () => {
      await Promise.all([fetchBankBalance(), fetchTokenSupply()]);
      setIsMatching(bankBalance === parseFloat(tokenSupply || '0'));
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);

    return () => clearInterval(interval);
  }, [bankBalance, tokenSupply]);

  const boxStyle =
    'border-2 border-black rounded-xl bg-white shadow-[4px_4px_0px_0px_#000] p-8 text-center';

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-gray-100">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-12 text-center">Reserva</h1>
        <div className="grid gap-8 md:grid-cols-2">
          <div className={boxStyle}>
            <h2 className="text-2xl font-semibold mb-4">Valor en la cuenta del banco</h2>
            {bankBalance !== null ? (
              <p className="text-5xl font-bold text-blue-600">
                $
                {bankBalance.toLocaleString('es-ES', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            ) : (
              <p className="text-2xl text-gray-500">Cargando...</p>
            )}
          </div>
          <div className={boxStyle}>
            <h2 className="text-2xl font-semibold mb-4">Total Supply del Token</h2>
            {tokenSupply !== null ? (
              <p className="text-5xl font-bold text-green-600">
                {parseFloat(tokenSupply).toLocaleString('es-ES', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            ) : (
              <p className="text-2xl text-gray-500">Cargando...</p>
            )}
          </div>
        </div>
        {isMatching !== null && (
          <div className={`mt-8 ${boxStyle} ${isMatching ? 'bg-green-100' : 'bg-red-100'}`}>
            <p className="text-xl font-semibold">
              {isMatching ? 'Los valores coinciden' : 'Los valores no coinciden'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
