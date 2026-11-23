import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
export const Test = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const scale = spring({frame, fps, from: 0.6, to: 1});
  const opacity = interpolate(frame, [0, 15], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#111', justifyContent: 'center', alignItems: 'center'}}>
      <div style={{color: 'white', fontSize: 90, fontWeight: 800, fontFamily: 'sans-serif', textAlign: 'center', transform: `scale(${scale})`, opacity}}>
        Сәлем, әлем!<br />Қазақша субтитр: ә ғ қ ң ө ұ ү һ і
      </div>
    </AbsoluteFill>
  );
};
