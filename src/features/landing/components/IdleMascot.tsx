import React from 'react';

interface Props {
  className?: string;
  style?: React.CSSProperties;
}

export default function IdleMascot({ className = "", style = {} }: Props) {
  return (
    <video 
      autoPlay 
      loop 
      muted 
      playsInline
      className={className}
      style={{ ...style, pointerEvents: 'none', objectFit: 'contain' }}
    >
      <source src="https://rblpaniosociqnxkxaym.supabase.co/storage/v1/object/public/mascot-images/animations/f20d1b09-b040-4480-a19c-2e015716be3f/idle_512.webm" type="video/webm" />
      <img src="https://rblpaniosociqnxkxaym.supabase.co/storage/v1/object/public/mascot-images/animations/f20d1b09-b040-4480-a19c-2e015716be3f/idle_512.apng" alt="Idle Mascot animation" className="w-full h-full object-contain" />
    </video>
  );
}
