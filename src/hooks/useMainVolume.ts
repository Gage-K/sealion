import { useEffect, useRef, useState, useCallback } from "react";
import * as Tone from "tone";
import type { AudioTrack } from "../types/types";
/**
 * Updates the main volume for all audio output. Cleans up volume reference and routing on unmount.
 * This volume is independent of the CRDT so that each client can set their own volume
 * @param sequence
 * @returns Volume value in decibels and a function to update volume state
 */
export function useMainVolume(audioConfig: AudioTrack[]) {
  const volumeRef = useRef<Tone.Volume | null>(null);
  const [volume, setVolume] = useState(0); // React state for re-renders

  // Initializes volume node only if it does not exist and cleans up on unmount
  useEffect(() => {
    if (!volumeRef.current) {
      const volumeNode = new Tone.Volume({
        volume: 0,
        mute: false,
      }).toDestination();
      volumeRef.current = volumeNode;
    }

    return () => {
      if (volumeRef.current) {
        volumeRef.current.dispose();
        volumeRef.current = null;
      }
    };
  }, []);

  // Connects volume node to all tracks and disconnects on unmount
  useEffect(() => {
    if (!volumeRef.current) return;

    audioConfig.forEach((track) => {
      track.node.connect(volumeRef.current!);
    });

    return () => {
      audioConfig.forEach((track) => {
        try {
          track.node.disconnect(volumeRef.current!);
        } catch (error) {
          console.warn(`[Warning] Track already disconnected: `, error);
        }
      });
    };
  }, [audioConfig]);

  const updateVolume = useCallback((value: number) => {
    const clamped = Math.min(Math.max(value, -12), 8);
    setVolume(clamped); // update React state
    if (volumeRef.current) {
      volumeRef.current.volume.value = clamped; // update Tone volume
    }
  }, []);

  return { volume, updateVolume };
}
