import { useEffect, useRef, useState, useCallback } from "react";
import * as Tone from "tone";
import { type Sequence } from "../types/types";
/**
 * Updates the main volume for all audio output. Cleans up volume reference and routing on unmount.
 * @param sequence
 * @returns Volume value in decibels and a function to update volume state
 */
export function useMainVolume(sequence: Sequence) {
  const volumeRef = useRef<Tone.Volume | null>(null);
  const [volume, setVolume] = useState(0); // React state for re-renders

  useEffect(() => {
    const volumeNode = new Tone.Volume({
      volume: 0,
      mute: false,
    }).toDestination();
    volumeRef.current = volumeNode;

    sequence.forEach((track) => {
      try {
        track.node.disconnect();
      } catch {
        console.error(`[Error] disconnecting track audio`);
      }
      track.node.connect(volumeNode);
    });

    return () => {
      volumeNode.dispose();
      volumeRef.current = null;
    };
  }, [sequence]);

  const updateVolume = useCallback((value: number) => {
    const clamped = Math.min(Math.max(value, -12), 8);
    setVolume(clamped); // update React state
    if (volumeRef.current) {
      volumeRef.current.volume.value = clamped; // update Tone volume
    }
  }, []);

  return { volume, updateVolume };
}
