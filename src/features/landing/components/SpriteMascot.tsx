import React, { useEffect, useState, useRef } from 'react';
import spriteData from '@/assets/sprites/sprite.json';
import spriteImage from '@/assets/sprites/sprite.png';

interface Props {
  className?: string;
  style?: React.CSSProperties;
  focusedField?: 'username' | 'password' | null;
}

export default function SpriteMascot({ className = "", style = {}, focusedField = null }: Props) {
  const [currentAnim, setCurrentAnim] = useState<keyof typeof spriteData.animations>('idle');
  const [frameIdx, setFrameIdx] = useState(0);
  const animRef = useRef({ currentAnim: 'idle' as keyof typeof spriteData.animations, frameIdx: 0, lastFrameTime: 0 });

  // Handle focus changes to trigger waving
  useEffect(() => {
    if (focusedField) {
      setCurrentAnim('waving');
      setFrameIdx(0);
      animRef.current = { currentAnim: 'waving', frameIdx: 0, lastFrameTime: performance.now() };
    }
  }, [focusedField]);

  useEffect(() => {
    let animationFrameId: number;
    
    const loop = (time: number) => {
      const animState = animRef.current;
      // @ts-ignore - safe because we know the keys
      const animation = spriteData.animations[animState.currentAnim];
      const fps = animation.fps || 12;
      const frameDuration = 1000 / fps;

      if (time - animState.lastFrameTime >= frameDuration) {
        animState.lastFrameTime = time;
        let nextFrameIdx = animState.frameIdx + 1;
        
        if (nextFrameIdx >= animation.frames.length) {
          if (animation.loop) {
            nextFrameIdx = 0;
          } else {
            if (animation.next_state) {
              animState.currentAnim = animation.next_state as any;
              setCurrentAnim(animation.next_state as any);
              nextFrameIdx = 0;
            } else {
              nextFrameIdx = animation.frames.length - 1; // stay on last frame
            }
          }
        }
        
        animState.frameIdx = nextFrameIdx;
        setFrameIdx(nextFrameIdx);
      }
      
      animationFrameId = requestAnimationFrame(loop);
    };

    animRef.current.lastFrameTime = performance.now();
    animationFrameId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Get current frame data
  // @ts-ignore
  const animation = spriteData.animations[currentAnim];
  const globalFrameIndex = animation.frames[frameIdx];
  const frameData = spriteData.frames[globalFrameIndex];

  // Calculate background position
  const cols = spriteData.meta.columns;
  const rows = spriteData.meta.rows;
  
  const colIndex = frameData.col - 1;
  const rowIndex = frameData.row - 1;

  const bgX = (colIndex / (cols - 1)) * 100;
  const bgY = (rowIndex / (rows - 1)) * 100;

  return (
    <div 
      className={className}
      style={{
        ...style,
        aspectRatio: `${spriteData.meta.cell_size.w} / ${spriteData.meta.cell_size.h}`,
        backgroundImage: `url(${spriteImage})`,
        backgroundSize: `${cols * 100}% ${rows * 100}%`,
        backgroundPosition: `${bgX}% ${bgY}%`,
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}
