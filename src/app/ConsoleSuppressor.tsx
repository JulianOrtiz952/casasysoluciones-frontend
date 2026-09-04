'use client';

import { useEffect } from 'react';

export function ConsoleSuppressor() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dummy = () => {};
      window.console.log = dummy;
      window.console.error = dummy;
      window.console.warn = dummy;
      window.console.info = dummy;
      window.console.debug = dummy;
    }
  }, []);

  return null;
}
