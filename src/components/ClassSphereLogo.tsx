import React from 'react';

interface ClassSphereLogoProps {
  className?: string;
  size?: number | string;
  withText?: boolean;
}

export function ClassSphereLogo({ className = '', size = 48, withText = false }: ClassSphereLogoProps) {
  // We use the logo.png from the public folder
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <img
        src="/logo.png"
        alt="ClassSphere Logo"
        width={size}
        height={size}
        className="shrink-0 drop-shadow-xl object-contain"
        style={{ width: size, height: size }}
      />
      {withText && (
        <span className="font-display font-extrabold tracking-tighter whitespace-nowrap" style={{ fontSize: `calc(${typeof size === 'number' ? size : parseInt(size.toString())}px * 0.8)` }}>
          <span className="text-white">Class</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">Sphere</span>
        </span>
      )}
    </div>
  );
}
