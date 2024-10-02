'use client';

// react
import React from 'react';

// next
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// components
import { Button } from './ui/button';

// translations
import { useTranslations } from 'next-intl';

interface NavbarProps {}

const Navbar: React.FC<NavbarProps> = () => {
  const t = useTranslations('navbar');
  const pathname = usePathname();

  const currentLang = pathname.startsWith('/es') ? 'es' : 'en';

  return (
    <nav className="bg-brand-blue px-12 py-4 flex justify-between items-center sticky top-0 z-50">
      {/* Desktop */}
      <div className="hidden md:flex flex-1 space-x-4 items-center justify-evenly font-bold font-helvetica">
        <div className="text-white font-bold text-xl">LOGO HERE</div>
        <div className="flex flex-1 space-x-4 items-center justify-evenly font-bold font-helvetica">
          <Button className="bg-white text-black h-auto px-6 py-2 text-xl rounded-[12px] border-2 border-black font-bold shadow-brutalist">
            {t('stableCoin')}
          </Button>
          <Link href="#" className="text-white text-xl hover:text-blue-200">
            {t('earnWithPesos')}
          </Link>
          <Link href="#" className="text-white text-xl hover:text-blue-200 ">
            {t('aboutUs')}
          </Link>
          <Link href={`/${currentLang}/reserve`} className="text-white text-xl hover:text-blue-200">
            {t('reserve')}
          </Link>
        </div>
        <Button className="bg-black text-white h-auto px-6 py-2 text-xl rounded-[12px] border-2 border-black font-bold shadow-brutalist">
          {t('login')}
        </Button>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex flex-1 justify-end items-center space-x-4">
        <Link href="/">
          <div className="text-white font-bold text-xl">LOGO HERE</div>
        </Link>

        <Button className="bg-black text-white h-auto px-6 py-2 text-xl rounded-[12px] border-2 border-black font-bold shadow-brutalist">
          {t('login')}
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
