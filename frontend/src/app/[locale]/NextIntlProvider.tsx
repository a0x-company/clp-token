"use client";

import { ReactNode } from "react";

import { NextIntlClientProvider, AbstractIntlMessages } from "next-intl";

type NextIntlProviderProps = {
  messages: AbstractIntlMessages;
  locale: string;
  children: ReactNode;
  now: Date;
  timeZone: string;
};

export default function NextIntlProvider({
  messages,
  locale,
  children,
  now,
  timeZone,
}: NextIntlProviderProps) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      defaultTranslationValues={{
        i: (text) => <i>{text}</i>,
      }}
      now={now}
      timeZone={timeZone}
    >
      {children}
    </NextIntlClientProvider>
  );
}
