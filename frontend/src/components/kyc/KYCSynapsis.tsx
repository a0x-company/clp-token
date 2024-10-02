"use client";
import React, { useEffect, useState } from "react";
import { Synaps } from "@synaps-io/verify-sdk";

// Form
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// types
import { KYCStatus } from "@/components/onboarding/OnboardingUI";

// web3auth
import { useWeb3Auth } from "@web3auth/no-modal-react-hooks";

// components
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PopoverClose } from "@radix-ui/react-popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { CalendarIcon } from "lucide-react";

// tailwindcss
import { cn } from "@/lib/utils";

interface KYCSynapsisProps {
  sessionId: string | null;
  setStatusKyc: (status: KYCStatus | null) => void;
  statusKyc: KYCStatus | null;
}

const FormSchema = z.object({
  email: z.string().email({ message: "Correo electrónico inválido" }),
  document: z.object({
    isCompany: z.boolean(),
    documentNumber: z.string(),
    documentType: z.string(),
    country: z.string(),
  }),
  address: z.object({
    addressCity: z.string(),
    addressStreet: z.string(),
    addressZipCode: z.string(),
    addressCountry: z.string(),
    addressState: z.string(),
  }),
  personalInfo: z.object({
    names: z.string(),
    firstLastname: z.string(),
    activity: z.string(),
    dob: z.date(),
    phoneNumber: z.string(),
    nationality: z.string(),
    gender: z.string(),
  }),
});

const KYCSynapsis = ({
  sessionId,
  setStatusKyc,
  statusKyc,
}: KYCSynapsisProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    watch,
  } = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  const birthDate = watch("personalInfo.dob");

  const { userInfo } = useWeb3Auth();

  useEffect(() => {
    if (userInfo && userInfo.email) {
      setValue("personalInfo.names", userInfo.name || "");
      setValue("email", userInfo.email || "");
    }
  }, [userInfo, setValue]);

  // Synapse Modal
  useEffect(() => {
    if (sessionId) {
      let init = true;

      Synaps.init({
        sessionId: sessionId,
        onFinish: () => {
          fetch(`/api/kyc?sessionId=${sessionId}`, {
            method: "GET",
          })
            .then((response) => {
              return response.json();
            })
            .then((data) => {
              console.log("response", data.sessionDetails);
              // setSessionDetails(data); // Set session details in state

              const redirectStatus =
                data?.sessionDetails.session.status || "UNKNOWN";
              console.log(redirectStatus);

              if (
                redirectStatus === "VERIFIED" ||
                redirectStatus === "APPROVED"
              ) {
                toast({
                  title: "Verification finished",
                  variant: "default",
                });
                setStatusKyc(redirectStatus);
              } else if (redirectStatus === "PENDING_VERIFICATION") {
                toast({
                  title: "Verification in progress",
                  variant: "default",
                  description: "Please wait for the verification to finish",
                });
                setStatusKyc(redirectStatus);
              } else {
                toast({
                  title: "Kyc failed, Do you want to retry again?",
                  variant: "destructive",
                });
                setStatusKyc(redirectStatus);
              }
            })
            .catch((error) => {
              console.error("Error fetching session details:", error);
            });
        },
        mode: "modal",
      });

      return () => {
        init = false;
      };
    }
  }, [sessionId, statusKyc, setStatusKyc]);

  const handleOpen = () => {
    console.log("sessionId", sessionId);
    if (sessionId) {
      Synaps.show();
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target as HTMLInputElement;
    setValue(name as keyof z.infer<typeof FormSchema>, value);
  };

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      const response = await fetch("/api/kyc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Error al enviar los datos del formulario");
      }
      console.log("Datos enviados exitosamente:", data);
      handleOpen();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error al enviar los datos",
        description: "Por favor, intente nuevamente",
        variant: "destructive",
      });
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      console.log("date", date);
      setValue("personalInfo.dob", date);
      const closeButton = document.querySelector(
        "[data-popover-close]"
      ) as HTMLButtonElement | null;
      closeButton?.click();
    }
  };

  return (
    <section className="bg-zinc-100 flex flex-col items-center justify-center">
      <Card className="w-full max-w-4xl text-black bg-white rounded-t-none">
        <CardHeader>
          <CardTitle>Formulario de verificación (KYC)</CardTitle>
          <CardDescription>
            Por favor, proporcione la siguiente información para completar la
            configuración de su cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Correo electrónico:
                </label>
                <input
                  type="email"
                  id="email"
                  {...register("email")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="isCompany"
                  className="block text-sm font-medium text-gray-700"
                >
                  ¿Es una empresa?
                </label>
                <input
                  type="checkbox"
                  id="isCompany"
                  {...register("document.isCompany")}
                  className="mt-1"
                />
              </div>

              <div>
                <label
                  htmlFor="documentNumber"
                  className="block text-sm font-medium text-gray-700"
                >
                  Número de documento:
                </label>
                <input
                  type="text"
                  id="documentNumber"
                  {...register("document.documentNumber")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                />
                {errors.document?.documentNumber && (
                  <p className="text-red-500 text-sm">
                    {errors.document.documentNumber.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="documentType"
                  className="block text-sm font-medium text-gray-700"
                >
                  Tipo de documento:
                </label>
                <input
                  type="text"
                  id="documentType"
                  {...register("document.documentType")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                />
                {errors.document?.documentType && (
                  <p className="text-red-500 text-sm">
                    {errors.document.documentType.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="country"
                  className="block text-sm font-medium text-gray-700"
                >
                  País del documento:
                </label>
                <input
                  type="text"
                  id="country"
                  {...register("document.country")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                />
                {errors.document?.country && (
                  <p className="text-red-500 text-sm">
                    {errors.document.country.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="addressCity"
                  className="block text-sm font-medium text-gray-700"
                >
                  Ciudad:
                </label>
                <input
                  type="text"
                  id="addressCity"
                  {...register("address.addressCity")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                />
                {errors.address?.addressCity && (
                  <p className="text-red-500 text-sm">
                    {errors.address.addressCity.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="addressStreet"
                  className="block text-sm font-medium text-gray-700"
                >
                  Calle:
                </label>
                <input
                  type="text"
                  id="addressStreet"
                  {...register("address.addressStreet")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                />
                {errors.address?.addressStreet && (
                  <p className="text-red-500 text-sm">
                    {errors.address.addressStreet.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="addressZipCode"
                  className="block text-sm font-medium text-gray-700"
                >
                  Código postal:
                </label>
                <input
                  type="text"
                  id="addressZipCode"
                  {...register("address.addressZipCode")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                />
                {errors.address?.addressZipCode && (
                  <p className="text-red-500 text-sm">
                    {errors.address.addressZipCode.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="addressCountry"
                  className="block text-sm font-medium text-gray-700"
                >
                  País:
                </label>
                <input
                  type="text"
                  id="addressCountry"
                  {...register("address.addressCountry")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                />
                {errors.address?.addressCountry && (
                  <p className="text-red-500 text-sm">
                    {errors.address.addressCountry.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="addressState"
                  className="block text-sm font-medium text-gray-700"
                >
                  Estado/Provincia:
                </label>
                <input
                  type="text"
                  id="addressState"
                  {...register("address.addressState")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                />
                {errors.address?.addressState && (
                  <p className="text-red-500 text-sm">
                    {errors.address.addressState.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="names"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nombre(s):
                </label>
                <input
                  type="text"
                  id="names"
                  {...register("personalInfo.names")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                />
                {errors.personalInfo?.names && (
                  <p className="text-red-500 text-sm">
                    {errors.personalInfo.names.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="firstLastname"
                  className="block text-sm font-medium text-gray-700"
                >
                  Primer apellido:
                </label>
                <input
                  type="text"
                  id="firstLastname"
                  {...register("personalInfo.firstLastname")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                />
                {errors.personalInfo?.firstLastname && (
                  <p className="text-red-500 text-sm">
                    {errors.personalInfo.firstLastname.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="personalInfo.dob"
                  className="block text-sm font-medium text-gray-700"
                >
                  Fecha de nacimiento:
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm pl-3 text-left bg-white",
                        !getValues("personalInfo.dob") &&
                          "text-muted-foreground"
                      )}
                    >
                      {getValues("personalInfo.dob") ? (
                        // format(getValues("birthDate"), "PPP")
                        getValues("personalInfo.dob").toDateString()
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-white" align="start">
                    <Calendar
                      mode="single"
                      selected={new Date(getValues("personalInfo.dob"))}
                      onSelect={handleDateChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      className="bg-white text-black flex-col w-full"
                      autoFocus
                    />
                    <PopoverClose className="hidden" data-popover-close />
                  </PopoverContent>
                </Popover>
                <p
                  className={cn(
                    "text-red-500 text-sm transition-all duration-300 ease-in-out h-4 block",
                    errors.personalInfo?.dob ? "opacity-100" : "opacity-0"
                  )}
                >
                  {errors.personalInfo?.dob?.message}
                </p>
              </div>

              <div>
                <label
                  htmlFor="activity"
                  className="block text-sm font-medium text-gray-700"
                >
                  Actividad:
                </label>
                <input
                  type="text"
                  id="activity"
                  {...register("personalInfo.activity")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                />
                {errors.personalInfo?.activity && (
                  <p className="text-red-500 text-sm">
                    {errors.personalInfo.activity.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="dob"
                  className="block text-sm font-medium text-gray-700"
                >
                  Fecha de nacimiento:
                </label>
                <input
                  type="date"
                  id="dob"
                  {...register("personalInfo.dob")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                />
                {errors.personalInfo?.dob && (
                  <p className="text-red-500 text-sm">
                    {errors.personalInfo.dob.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-gray-700"
                >
                  Número de teléfono:
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  {...register("personalInfo.phoneNumber")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                />
                {errors.personalInfo?.phoneNumber && (
                  <p className="text-red-500 text-sm">
                    {errors.personalInfo.phoneNumber.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="nationality"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nacionalidad:
                </label>
                <input
                  type="text"
                  id="nationality"
                  {...register("personalInfo.nationality")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                />
                {errors.personalInfo?.nationality && (
                  <p className="text-red-500 text-sm">
                    {errors.personalInfo.nationality.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="gender"
                  className="block text-sm font-medium text-gray-700"
                >
                  Género:
                </label>
                <select
                  id="gender"
                  {...register("personalInfo.gender")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                >
                  <option value="">Seleccionar género</option>
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                  <option value="other">Otro</option>
                </select>
                {errors.personalInfo?.gender && (
                  <p className="text-red-500 text-sm">
                    {errors.personalInfo.gender.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="bg-black text-white">
                {statusKyc === "STARTED" ? "Continuar verificación" : "Enviar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
};

export default KYCSynapsis;
