import React from 'react';
import {Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import parts from '../promo/logoParts.json';

/** "Asyl Ine" logo cut from the wall photo (white letters + mint dots/tagline).
 *  Animated build: needle drops in -> dots spin in -> "Asyl" / "ne" wipe in -> tagline rises.
 *  startFrame: local frame when the build starts; static: show finished logo. */
const BOX = {x: 342, y: 140, w: 1760, h: 874};

export const LogoAnim: React.FC<{width: number; startFrame?: number; static?: boolean; tagline?: boolean; spin?: boolean}> =
  ({width, startFrame = 0, static: still = false, tagline = true, spin = true}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const f = still ? 999 : frame - startFrame;
  const k = width / BOX.w;
  const sp = (from: number, damping = 12, stiffness = 200) => spring({frame: f - from, fps, config: {damping, stiffness}});
  const needle = sp(0, 9, 260);
  const dots = sp(5, 14);
  const asyl = interpolate(f, [9, 17], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const ne = interpolate(f, [11, 19], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const tag = sp(17, 16);
  const pos = (n: keyof typeof parts): React.CSSProperties => ({
    position: 'absolute', left: (parts[n].x - BOX.x) * k, top: (parts[n].y - BOX.y) * k,
    width: parts[n].w * k, height: parts[n].h * k,
  });
  const h = (tagline ? BOX.h : parts.ne.y + parts.ne.h - BOX.y + 120) * k;
  const rot = spin ? (frame / fps) * 20 : 0;
  return (
    <div style={{position: 'relative', width, height: h}}>
      <Img src={staticFile('brand/asyl.png')} style={{...pos('asyl'), clipPath: `inset(0 ${(1 - asyl) * 100}% 0 0)`,
        transform: `translateX(${(1 - asyl) * -40 * k * 4}px)`}} />
      <Img src={staticFile('brand/ne.png')} style={{...pos('ne'), clipPath: `inset(0 0 0 ${(1 - ne) * 100}%)`,
        transform: `translateX(${(1 - ne) * 40 * k * 4}px)`}} />
      <Img src={staticFile('brand/needle.png')} style={{...pos('needle'),
        transform: `translateY(${interpolate(needle, [0, 1], [-900 * k, 0])}px)`, opacity: needle > 0.02 ? 1 : 0}} />
      <Img src={staticFile('brand/dots.png')} style={{...pos('dots'),
        transform: `scale(${interpolate(dots, [0, 1], [0.3, 1])}) rotate(${interpolate(dots, [0, 1], [-200, 0]) + rot * 0}deg)`,
        opacity: dots,
        WebkitMaskImage: `conic-gradient(#000 ${dots * 360}deg, transparent ${dots * 360}deg)`,
        maskImage: `conic-gradient(#000 ${dots * 360}deg, transparent ${dots * 360}deg)`}} />
      {tagline ? <Img src={staticFile('brand/tagline.png')} style={{...pos('tagline'), opacity: tag,
        transform: `translateY(${(1 - tag) * 30}px)`}} /> : null}
    </div>
  );
};
