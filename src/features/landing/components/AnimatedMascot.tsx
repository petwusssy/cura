import React from 'react';

interface Props {
  className?: string;
  style?: React.CSSProperties;
  focusedField?: 'username' | 'password' | null;
}

export default function AnimatedMascot({ className = "", style = {}, focusedField = null }: Props) {
  // We ignore focusedField since this is a continuous video loop
  return (
    <video 
      autoPlay 
      loop 
      muted 
      playsInline
      className={className}
      style={{ ...style, pointerEvents: 'none', objectFit: 'contain' }}
    >
      <source src="https://rblpaniosociqnxkxaym.supabase.co/storage/v1/object/public/mascot-images/animations/94a543a3-c19f-41cd-99b9-9a21802fdd1e/wave_512.webm" type="video/webm" />
      <img src="https://rblpaniosociqnxkxaym.supabase.co/storage/v1/object/public/mascot-images/animations/94a543a3-c19f-41cd-99b9-9a21802fdd1e/wave_512.apng" alt="Mascot animation" className="w-full h-full object-contain" />
    </video>
  );
}
