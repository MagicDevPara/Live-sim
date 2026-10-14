import { memo, useEffect, useRef } from 'react';

interface Props {
  stream: MediaStream | null;
  mirrored: boolean;
}

/**
 * Видео камеры. Мемоизировано и зависит только от stream/mirrored,
 * поэтому новые комментарии и счётчик никогда не перерисовывают и не перезапускают видео.
 */
export const CameraView = memo(function CameraView({ stream, mirrored }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    if (v.srcObject !== stream) v.srcObject = stream;
    if (stream) v.play().catch(() => undefined);
  }, [stream]);

  useEffect(() => {
    // После возврата из фона Safari ставит видео на паузу — продолжаем воспроизведение.
    const resume = () => {
      const v = ref.current;
      if (document.visibilityState === 'visible' && v?.srcObject && v.paused) v.play().catch(() => undefined);
    };
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('pageshow', resume);
    return () => {
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('pageshow', resume);
    };
  }, []);

  return (
    <video
      ref={ref}
      className="absolute inset-0 h-full w-full bg-black object-cover"
      style={mirrored ? { transform: 'scaleX(-1)' } : undefined}
      autoPlay
      muted
      playsInline
      disablePictureInPicture
      disableRemotePlayback
    />
  );
});
