import React, { useEffect, useRef, useState } from 'react';

interface CursorPetProps {
  mood?: 'normal' | 'alarmed' | 'thinking' | 'celebrating';
}

interface TrailParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

interface ClickRipple {
  id: number;
  x: number;
  y: number;
  scale: number;
  alpha: number;
}

export const CursorPet: React.FC<CursorPetProps> = ({ mood = 'normal' }) => {
  const [visible, setVisible] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);

  const petContainerRef = useRef<HTMLDivElement>(null);
  const reticleRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const eyeGroupRef = useRef<SVGGElement>(null);
  const flameRef = useRef<SVGPathElement>(null);

  // Physics state stored in refs for 60fps+ animation without React re-render overhead
  const targetPos = useRef({ x: -100, y: -100 });
  const petPos = useRef({ x: -100, y: -100 });
  const petVel = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<TrailParticle[]>([]);
  const ripplesRef = useRef<ClickRipple[]>([]);
  const particleIdCounter = useRef(0);
  const moodRef = useRef(mood);

  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  // Periodic natural eye blink
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 3600);
    return () => clearInterval(blinkInterval);
  }, []);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      targetPos.current.x = e.clientX;
      targetPos.current.y = e.clientY;

      if (!visible) {
        petPos.current.x = e.clientX + 26;
        petPos.current.y = e.clientY + 22;
        setVisible(true);
      }

      // Check if hovering an interactive element
      const targetEl = e.target as HTMLElement | null;
      if (targetEl) {
        const interactive =
          targetEl.closest('button, a, [role="button"], input, select, textarea') !== null ||
          window.getComputedStyle(targetEl).cursor === 'pointer';
        setIsHoveringInteractive(interactive);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      setIsClicking(true);
      // Give the pet an upward joyful hop impulse on click
      petVel.current.y -= 5.5;

      // Spawn a click ripple at the cursor
      ripplesRef.current.push({
        id: particleIdCounter.current++,
        x: e.clientX,
        y: e.clientY,
        scale: 0.3,
        alpha: 0.9,
      });

      // Spawn burst of happy stardust around the pet
      const burstColors =
        moodRef.current === 'alarmed'
          ? ['#ef4444', '#f97316']
          : moodRef.current === 'celebrating'
          ? ['#10b981', '#34d399', '#fde047']
          : ['#22d3ee', '#38bdf8', '#a855f7'];

      for (let i = 0; i < 7; i++) {
        const angle = (Math.PI * 2 * i) / 7;
        const speed = 1.4 + Math.random() * 1.8;
        particlesRef.current.push({
          id: particleIdCounter.current++,
          x: petPos.current.x,
          y: petPos.current.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2.5 + Math.random() * 2,
          alpha: 1,
          color: burstColors[i % burstColors.length],
        });
      }
    };

    const handlePointerUp = () => {
      setIsClicking(false);
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [visible]);

  // Main 60fps spring-physics & particle trail loop
  useEffect(() => {
    let animationFrameId: number;
    let startTime = performance.now();

    const resizeCanvas = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = (now: number) => {
      const elapsed = (now - startTime) / 1000;

      // Update precision reticle immediately to exact cursor position
      if (reticleRef.current) {
        reticleRef.current.style.transform = `translate3d(${targetPos.current.x}px, ${targetPos.current.y}px, 0)`;
      }

      // Desired offset so the pet hovers beside the cursor without blocking clicks
      const hoverBobY = Math.sin(elapsed * 4.2) * 4.5;
      const hoverBobX = Math.cos(elapsed * 2.1) * 2.0;
      const desiredX = targetPos.current.x + 28 + hoverBobX;
      const desiredY = targetPos.current.y + 24 + hoverBobY;

      // Spring-damper physics toward desired offset
      const stiffness = 0.14;
      const damping = 0.76;

      const ax = (desiredX - petPos.current.x) * stiffness;
      const ay = (desiredY - petPos.current.y) * stiffness;

      petVel.current.x = (petVel.current.x + ax) * damping;
      petVel.current.y = (petVel.current.y + ay) * damping;

      petPos.current.x += petVel.current.x;
      petPos.current.y += petVel.current.y;

      const speed = Math.hypot(petVel.current.x, petVel.current.y);

      // Bank/tilt pet based on horizontal velocity
      const tiltDeg = Math.max(-28, Math.min(28, petVel.current.x * 2.3));
      const scaleStretch = 1 + Math.min(0.12, speed * 0.008);

      if (petContainerRef.current) {
        petContainerRef.current.style.transform = `translate3d(${petPos.current.x}px, ${petPos.current.y}px, 0) rotate(${tiltDeg}deg) scale(${scaleStretch}, ${2 - scaleStretch})`;
      }

      // Shift eyes slightly toward cursor movement direction
      if (eyeGroupRef.current) {
        const dx = targetPos.current.x - petPos.current.x;
        const dy = targetPos.current.y - petPos.current.y;
        const dist = Math.hypot(dx, dy) || 1;
        const lookX = (dx / dist) * Math.min(2.6, dist * 0.06);
        const lookY = (dy / dist) * Math.min(2.0, dist * 0.05);
        eyeGroupRef.current.setAttribute('transform', `translate(${lookX.toFixed(2)}, ${lookY.toFixed(2)})`);
      }

      // Flicker thruster flame based on speed
      if (flameRef.current) {
        const flameScale = 0.8 + Math.sin(elapsed * 32) * 0.2 + Math.min(0.9, speed * 0.08);
        flameRef.current.setAttribute('transform', ` translate(24, 39) scale(1, ${flameScale.toFixed(2)}) translate(-24, -39)`);
      }

      // Spawn trail particles when moving
      if (speed > 1.1 && Math.random() < 0.65) {
        const trailColor =
          moodRef.current === 'alarmed'
            ? '#ef4444'
            : moodRef.current === 'thinking'
            ? '#f59e0b'
            : moodRef.current === 'celebrating'
            ? '#10b981'
            : '#22d3ee';

        particlesRef.current.push({
          id: particleIdCounter.current++,
          x: petPos.current.x + (Math.random() - 0.5) * 8,
          y: petPos.current.y + 12 + (Math.random() - 0.5) * 4,
          vx: -petVel.current.x * 0.15 + (Math.random() - 0.5) * 0.5,
          vy: 0.6 + Math.random() * 0.6,
          size: 1.8 + Math.random() * 2.2,
          alpha: 0.85,
          color: trailColor,
        });
      }

      // Render particles & click ripples on full-screen overlay canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw & update trail particles
          for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            const p = particlesRef.current[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.032;
            p.size *= 0.97;

            if (p.alpha <= 0.02) {
              particlesRef.current.splice(i, 1);
              continue;
            }

            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Draw & update click ripples
          for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
            const r = ripplesRef.current[i];
            r.scale += 0.08;
            r.alpha -= 0.045;

            if (r.alpha <= 0.02) {
              ripplesRef.current.splice(i, 1);
              continue;
            }

            ctx.save();
            ctx.globalAlpha = r.alpha;
            ctx.strokeStyle =
              moodRef.current === 'alarmed'
                ? '#ef4444'
                : moodRef.current === 'celebrating'
                ? '#10b981'
                : '#22d3ee';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.arc(r.x, r.y, 18 * r.scale, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Theme colors based on ORBIT mood
  const getThemeColors = () => {
    switch (mood) {
      case 'alarmed':
        return {
          primary: '#ef4444',
          glow: 'rgba(239, 68, 68, 0.55)',
          secondary: '#fca5a5',
        };
      case 'thinking':
        return {
          primary: '#f59e0b',
          glow: 'rgba(245, 158, 11, 0.5)',
          secondary: '#fde68a',
        };
      case 'celebrating':
        return {
          primary: '#10b981',
          glow: 'rgba(16, 185, 129, 0.55)',
          secondary: '#6ee7b7',
        };
      default:
        return {
          primary: '#22d3ee',
          glow: 'rgba(34, 211, 238, 0.5)',
          secondary: '#bae6fd',
        };
    }
  };

  const theme = getThemeColors();

  return (
    <div
      className={`fixed inset-0 z-[9999] pointer-events-none overflow-hidden transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      {/* Fullscreen lightweight canvas for thruster trail particles & click ripples */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Precision Holographic Cursor Reticle at exact mouse point */}
      <div
        ref={reticleRef}
        className="absolute top-0 left-0 -ml-3 -mt-3 w-6 h-6 flex items-center justify-center will-change-transform"
      >
        <div
          className={`rounded-full transition-all duration-150 ${
            isClicking
              ? 'w-5 h-5 border-2 scale-90'
              : isHoveringInteractive
              ? 'w-6 h-6 border-2 scale-110'
              : 'w-3.5 h-3.5 border'
          }`}
          style={{
            borderColor: theme.primary,
            boxShadow: `0 0 10px ${theme.glow}`,
          }}
        />
        <div
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: theme.secondary,
            boxShadow: `0 0 6px ${theme.primary}`,
          }}
        />
      </div>

      {/* Floating Mini-ORBIT Space Pet Companion */}
      <div
        ref={petContainerRef}
        className="absolute top-0 left-0 -ml-6 -mt-6 w-12 h-12 will-change-transform select-none"
        style={{
          filter: `drop-shadow(0 0 10px ${theme.glow})`,
        }}
      >
        <svg viewBox="0 0 48 48" className="w-full h-full overflow-visible">
          <defs>
            <radialGradient id="petBodyGrad" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="55%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#64748b" />
            </radialGradient>
            <linearGradient id="petVisorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
          </defs>

          {/* Bottom Thruster Flame */}
          <path
            ref={flameRef}
            d="M 20 38 Q 24 47 28 38 Z"
            fill={theme.primary}
            opacity="0.85"
          />

          {/* Back Orbital Gyro Ring */}
          <ellipse
            cx="24"
            cy="26"
            rx="19"
            ry="6.5"
            fill="none"
            stroke={theme.primary}
            strokeWidth="1.5"
            strokeDasharray="4 2"
            opacity="0.55"
            transform="rotate(-16 24 26)"
          />

          {/* Cute Stabilizer Ears / Winglets */}
          <path
            d="M 7 22 L 12 18 L 12 27 Z"
            fill="#cbd5e1"
            stroke={theme.primary}
            strokeWidth="1"
          />
          <path
            d="M 41 22 L 36 18 L 36 27 Z"
            fill="#cbd5e1"
            stroke={theme.primary}
            strokeWidth="1"
          />

          {/* Top Telemetry Antenna */}
          <line
            x1="24"
            y1="10"
            x2="24"
            y2="4"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle
            cx="24"
            cy="3.5"
            r={isClicking || mood === 'alarmed' ? '3.2' : '2.4'}
            fill={theme.primary}
          />

          {/* Main Spherical Drone Pet Body */}
          <circle
            cx="24"
            cy="24"
            r="13.5"
            fill="url(#petBodyGrad)"
            stroke="#475569"
            strokeWidth="1"
          />

          {/* Curved Dark Glass Face Visor */}
          <rect
            x="13.5"
            y="17.5"
            width="21"
            height="12"
            rx="6"
            fill="url(#petVisorGrad)"
            stroke={theme.primary}
            strokeWidth="1.1"
          />

          {/* Expressive LED Eyes inside Visor (tracks cursor direction) */}
          <g ref={eyeGroupRef}>
            {isClicking || mood === 'celebrating' ? (
              /* Happy / Excited ^ ^ Eyes */
              <>
                <path
                  d="M 17 24.5 Q 19.5 21 22 24.5"
                  fill="none"
                  stroke={theme.primary}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <path
                  d="M 26 24.5 Q 28.5 21 31 24.5"
                  fill="none"
                  stroke={theme.primary}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </>
            ) : isBlinking ? (
              /* Blinking - - Eyes */
              <>
                <line
                  x1="17"
                  y1="23.5"
                  x2="22"
                  y2="23.5"
                  stroke={theme.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="26"
                  y1="23.5"
                  x2="31"
                  y2="23.5"
                  stroke={theme.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </>
            ) : mood === 'alarmed' ? (
              /* Alert > < / Intense Eyes */
              <>
                <ellipse cx="19.5" cy="23.5" rx="2.3" ry="2.8" fill={theme.primary} />
                <ellipse cx="28.5" cy="23.5" rx="2.3" ry="2.8" fill={theme.primary} />
                <line
                  x1="17"
                  y1="20"
                  x2="22"
                  y2="21.5"
                  stroke={theme.secondary}
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <line
                  x1="31"
                  y1="20"
                  x2="26"
                  y2="21.5"
                  stroke={theme.secondary}
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </>
            ) : (
              /* Normal Cute Glowing Drone Eyes with Specular Glint */
              <>
                <ellipse
                  cx="19.5"
                  cy="23.5"
                  rx={isHoveringInteractive ? '2.5' : '2.1'}
                  ry={isHoveringInteractive ? '3.0' : '2.6'}
                  fill={theme.primary}
                />
                <circle cx="18.8" cy="22.4" r="0.8" fill="#ffffff" />

                <ellipse
                  cx="28.5"
                  cy="23.5"
                  rx={isHoveringInteractive ? '2.5' : '2.1'}
                  ry={isHoveringInteractive ? '3.0' : '2.6'}
                  fill={theme.primary}
                />
                <circle cx="27.8" cy="22.4" r="0.8" fill="#ffffff" />
              </>
            )}
          </g>

          {/* Front Orbital Ring Segment */}
          <path
            d="M 6 31 A 19 6.5 0 0 0 42 21"
            fill="none"
            stroke={theme.secondary}
            strokeWidth="1.3"
            opacity="0.75"
            transform="rotate(-16 24 26)"
          />
        </svg>
      </div>
    </div>
  );
};
