import { useEffect, useRef } from "react";
import { useAudioEngine } from "../../hooks/useAudioEngine";
import { useIsPlaying } from "../../hooks/useSynthState";

export default function FFTVisualizer() {
  const engine = useAudioEngine();
  const isPlaying = useIsPlaying();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isPlaying) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId: number;

    const draw = () => {
      const data = engine.getFFTData();

      if (!data) {
        frameId = requestAnimationFrame(draw);
        return;
      }

      const rect = canvas.getBoundingClientRect();

      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const binCount = data.length;
      const barWidth = canvas.width / binCount;

      for (let i = 0; i < binCount; i++) {
        const normalizedData = Math.max(0, (data[i] + 100) / 100);
        const barHeight = normalizedData * canvas.height;

        ctx.fillStyle = "#000000";
        ctx.fillRect(
          i * barWidth,
          canvas.height - barHeight,
          barWidth - 1,
          barHeight,
        );
      }

      frameId = requestAnimationFrame(draw);
    };

    frameId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, engine]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
}
