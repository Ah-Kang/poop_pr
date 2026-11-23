import React, { useEffect, useRef, useState } from 'react';

// No image URL enters the DOM until its card intersects the scroll viewport.
export default function VisibleSkin({ src, alt, className }) {
  const host = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!('IntersectionObserver' in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '0px', threshold: 0.01 });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  return <span ref={host} className={className}>
    {visible && <img src={src} alt={alt} decoding="async" draggable="false" />}
  </span>;
}
