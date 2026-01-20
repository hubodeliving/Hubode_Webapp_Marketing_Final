'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const ScrollToHash: React.FC = () => {
  const pathname = usePathname();

  useEffect(() => {
    const scrollToCurrentHash = () => {
      const { hash } = window.location;
      if (!hash) return;
      const targetId = hash.substring(1);
      const element = document.getElementById(targetId);
      if (element) {
        window.requestAnimationFrame(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    };

    scrollToCurrentHash();

    window.addEventListener('hashchange', scrollToCurrentHash);
    return () => window.removeEventListener('hashchange', scrollToCurrentHash);
  }, [pathname]);

  return null;
};

export default ScrollToHash;
