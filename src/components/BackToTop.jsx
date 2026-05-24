import React, { useEffect, useState } from 'react';
import { UpOutlined } from '@ant-design/icons';

// Floating action button that appears after the viewer scrolls past
// ~600px and smooth-scrolls back to the top when clicked.
export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!show) return null;
  return (
    <button
      type="button"
      className="back-to-top"
      aria-label="Дээш буцах"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <UpOutlined />
    </button>
  );
}
