'use client';

import React, { useEffect, useState } from 'react';

// next
import Image from 'next/image';

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

  const boxStyle = 'border-2 border-black rounded-xl bg-white shadow-[4px_4px_0px_0px_#000] p-8';

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-gray-100">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center font-helvetica">Reserva CLPa</h1>

        <div className={`${boxStyle} mb-12 flex flex-col md:flex-row items-start`}>
          <div className="md:w-1/2 pr-8">
            <h2 className="text-3xl font-bold mb-6 text-left font-romaben">
              Respaldo de Nuestra Stablecoin
            </h2>
            <p className="text-lg leading-relaxed text-gray-700 mb-6">
              Nuestra stablecoin está respaldada al 100% en pesos chilenos, garantizando que cada
              token emitido tenga un equivalente exacto en pesos chilenos depositada en un banco en
              Chile 🇨🇱 (cuenta bancaria de reserva)
            </p>
          </div>

          <div className="md:w-1/2 bg-gray-100 p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_#000]">
            <h3 className="text-xl font-semibold mb-4">Proceso de Respaldo:</h3>
            <ul className="space-y-3 text-gray-700 text-left">
              <li className="flex items-start">
                <span className="mr-2 font-bold">1.</span>
                <span>Depósito de pesos chilenos por usuarios con cuenta bancaria chilena.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-bold">2.</span>
                <span>La empresa actúa como custodio de los fondos.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-bold">3.</span>
                <span>Almacenamiento seguro y consulta disponible en todo momento.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-bold">4.</span>
                <span>
                  Transparencia total sobre el respaldo de los tokens ACLP en circulación.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className={`${boxStyle} text-center`}>
            <h2 className="text-2xl font-semibold mb-4 font-romaben">
              Valor en la cuenta del banco
            </h2>
            {bankBalance !== null ? (
              <p className="text-5xl font-bold text-black font-helvetica">
                $
                {bankBalance.toLocaleString('es-ES', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            ) : (
              <p className="text-2xl text-gray-500 font-helvetica">Cargando...</p>
            )}
            <div className="mt-4 flex items-center justify-center">
              <Image
                src="/reserve/santander.png"
                alt="Banco Santander Logo"
                width={50}
                height={50}
                className="w-10 h-10 rounded-full"
              />
              <p className="ml-2 text-sm text-gray-600 font-romaben">
                Cuenta en Banco Santander Chile
              </p>
            </div>
          </div>
          <div className={`${boxStyle} text-center`}>
            <h2 className="text-2xl font-semibold mb-4 font-romaben">Cantidad de tokens CLPa</h2>
            {tokenSupply !== null ? (
              <p className="text-5xl font-bold text-blue-600 font-helvetica">
                {parseFloat(tokenSupply).toLocaleString('es-ES', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            ) : (
              <p className="text-2xl text-gray-500 font-helvetica">Cargando...</p>
            )}
            <div className="mt-4 flex items-center justify-center">
              <Image
                src="/reserve/base.png"
                alt="Base Network Logo"
                width={50}
                height={50}
                className="w-10 h-10 rounded-full"
              />
              <p className="ml-2 text-sm text-gray-600 font-helvetica">
                Token deployado en la red de Base
              </p>
            </div>
          </div>
        </div>
        {isMatching !== null && (
          <div
            className={`mt-8 ${boxStyle} ${isMatching ? 'bg-green-300' : 'bg-red-300'} text-center`}
          >
            <p className="text-xl font-semibold font-helvetica">
              {isMatching ? 'Los valores coinciden ✅' : 'Los valores no coinciden ❌'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
