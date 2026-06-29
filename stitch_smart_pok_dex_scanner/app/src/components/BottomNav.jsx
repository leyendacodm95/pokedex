import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';

function BottomNav({ language }) {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 landscape:bottom-0 landscape:top-0 landscape:right-0 landscape:left-auto landscape:w-20 landscape:h-full left-0 w-full z-40 flex landscape:flex-col justify-around landscape:justify-center items-center px-4 landscape:px-0 pb-8 landscape:pb-0 landscape:py-4 bg-white/5 dark:bg-white/5 backdrop-blur-2xl border-t landscape:border-t-0 landscape:border-l border-white/10 shadow-[0px_-10px_30px_rgba(0,0,0,0.5)] landscape:shadow-[-10px_0px_30px_rgba(0,0,0,0.5)] rounded-t-xl landscape:rounded-t-none landscape:rounded-l-xl">
      <Link 
        to="/scanner" 
        className={`flex flex-col items-center justify-center py-3 landscape:py-6 transition-all active:scale-90 duration-200 ${location.pathname === '/scanner' ? 'text-secondary-fixed after:content-[""] after:w-1 after:h-1 after:bg-secondary-fixed after:rounded-full after:mt-1' : 'text-on-surface-variant opacity-60 hover:bg-white/5'}`}
      >
        <span className="material-symbols-outlined mb-1" style={location.pathname === '/scanner' ? { fontVariationSettings: "'FILL' 1" } : {}}>document_scanner</span>
        <span className="font-label-caps text-label-caps uppercase landscape:hidden">{language === 'en' ? 'Scanner' : 'Escáner'}</span>
      </Link>
      
      <Link 
        to="/collection" 
        className={`flex flex-col items-center justify-center py-3 landscape:py-6 transition-all active:scale-90 duration-200 ${location.pathname === '/collection' ? 'text-secondary-fixed after:content-[""] after:w-1 after:h-1 after:bg-secondary-fixed after:rounded-full after:mt-1' : 'text-on-surface-variant opacity-60 hover:bg-white/5'}`}
      >
        <span className="material-symbols-outlined mb-1" style={location.pathname === '/collection' ? { fontVariationSettings: "'FILL' 1" } : {}}>inventory_2</span>
        <span className="font-label-caps text-label-caps uppercase landscape:hidden">{language === 'en' ? 'Collection' : 'Colección'}</span>
      </Link>
    </nav>
  );
}

export default BottomNav;
