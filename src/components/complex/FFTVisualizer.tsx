import { useEffect, useRef } from "react";
import { AudioEngine } from "../../audio/AudioEngine";

interface FFTVisualizerProps {
  engineRef: React.RefObject<AudioEngine>;
  isPlaying: boolean;
}

export default function FFTVisualizer({
  engineRef,
  isPlaying,
}: FFTVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isPlaying) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId: number;

    const draw = () => {
      const data = engineRef.current?.getFFTData();

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
  }, [isPlaying, engineRef]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
}
