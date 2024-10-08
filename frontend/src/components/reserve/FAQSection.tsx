"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import Image from "next/image";

const items = [
  {
    title:
      "¿Cómo se garantiza que CLPD está completamente respaldado y es intercambiable por pesos chilenos tradicionales?",
    content:
      "CLPD es un peso chileno digital respaldado 100% por dinero líquido (no está convertido en ningún tipo de activo más que CLP tradicional) y es intercambiable 1:1 por pesos chilenos fiat. Todos los pesos chilenos fiat se resguardan en una cuenta bancaria nacional que es monitoreada 24/7 por oráculos independientes proporcionados por la tecnología de Chainlink Functions.",
  },
  {
    title: "¿Cómo puedo obtener CLPD y convertirlo a pesos chilenos fiat?",
    content:
      "Individuos y usuarios comunes, startups y pequeños negocios pueden obtener CLPD a través del sitio web pesodigital.mistokens.com y pronto en más aplicaciones y exchanges nacionales e internacionales. Para exchanges, instituciones, bancos, wallets, traders institucionales, grandes empresas e instituciones financieras, pueden ponerse en contacto con el equipo de desarrollador A0x.",
  },
  {
    title: "¿En qué blockchain está disponible CLPD?",
    content:
      "CLPD está disponible en la red blockchain BASE, una solución de capa 2 en Ethereum, compatible con EVM (Ethereum Virtual Machine), construida sobre el superstack de Optimism, con la seguridad, estabilidad y escalabilidad necesaria para obtener transacciones de bajísimo costo para todas las aplicaciones de pago y financieras de CLPD. Pronto se habilitará el CLPD en otras blockchains para facilitar aún más su uso y adopción.",
  },
  {
    title: "¿Cómo se mantiene la paridad entre el CLPD circulante y las reservas de CLP fiat?",
    content:
      "Cuando un usuario deposita pesos chilenos desde su cuenta bancaria a la de la moneda estable, se crean los CLPD equivalentes en su billetera digital de manera automatizada. No existe otro mecanismo de creación de CLPD. Al mismo tiempo, cuando se quieren intercambiar CLPD por pesos chilenos fiat en la cuenta bancaria del usuario, dichos CLPD son “quemados” y sacados de circulación. Mediante este mecanismo se mantiene una paridad 1:1 en todo momento y de manera automática.",
  },
  {
    title: "¿El CLPD es una criptomoneda?",
    content:
      "El CLPD es una moneda estable 100% respaldada, que es un tipo de criptomoneda, o peso chileno digital. A diferencia de otras criptomonedas que fluctúan en su precio, el CLPD está diseñado para mantener la relación de mercado con el dólar norteamericano USD, y tener un equivalente en pesos chilenos tradicionales respaldado 1:1 en una cuenta bancaria nacional 100% líquida. El CLPD es un equivalente al peso chileno tradicional que se beneficia de la velocidad y seguridad de la tecnología blockchain.",
  },
  {
    title: "¿Cómo es diferente el CLPD a una CBDC (moneda digital emitida por el banco central)?",
    content:
      "El CLPD is emitido por A0x, una empresa privada chilena en la intersección de blockchain y fintech. En cambio, una CBDC sería emitida por el gobierno o el banco central. Mientras la CBDC chilena se encuentra en etapa de estudio y exploración, sin una determinación al respecto de si se creará en algún momento o no, el CLPD ya se encuentra disponible y será útil para pagos entre personas, comercios, transferencias internacionales, acceder a rendimientos en DeFi, vehículos de ahorro e inversión, y otras aplicaciones de manera segura, rápida y de bajísimo costo. A0x ha desarrollado esta tecnología basandose en las prácticas de código abierto y tomando el conocimiento del uso de las stablecoins en el mundo.",
  },
];

const FAQSection = () => {
  const t = useTranslations("reserve.faq");
  const [openValue, setOpenValue] = useState<string | undefined>("0");
  const borderDashed =
    "url('data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' stroke='%23333' stroke-width='4' stroke-dasharray='6%2c 14' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e')";
  return (
    <section className="flex flex-col items-center justify-center relative px-8 lg:px-16 xl:px-32 pt-[64px] pb-[120px] gap-16">
      <h2 className="font-extrabold font-beauford text-black text-9xl tracking-tighter text-start self-start">
        FAQ
      </h2>

      <Accordion
        type="single"
        collapsible
        className="flex flex-col w-full"
        value={openValue}
        onValueChange={(value: string) =>
          setOpenValue((prev) => (prev === value ? undefined : value))
        }
      >
        {items.map((item, index) => (
          <AccordionItem
            key={index}
            value={index.toString()}
            className={cn("flex flex-col p-6 md:p-10 dashed-border my-8")}
          >
            <AccordionTrigger className="flex items-center justify-between gap-x-4">
              <h3 className="text-black text-3xl md:text-5xl font-helvetica font-[700] -tracking-[0.24px] text-left max-md:w-full w-5/6">
                {item.title}
              </h3>
              <div className="flex items-center justify-center">
                <Image
                  src="/images/reserve/arrow-black.svg"
                  alt="arrow"
                  width={40}
                  height={40}
                  className={cn(
                    "transition-all duration-300",
                    openValue === index.toString() ? "-rotate-180" : "rotate-0"
                  )}
                />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-black text-2xl font-helvetica font-normal w-full">
                {item.content}
              </p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};

export default FAQSection;
