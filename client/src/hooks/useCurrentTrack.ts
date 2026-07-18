import { useState, useCallback } from "react";

interface UseCurrentTrackReturn {
  currentTrackIndex: number;
  updateCurrentTrackIndex: (index: number) => void;
}

export function useCurrentTrack(): UseCurrentTrackReturn {
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);

  const updateCurrentTrackIndex = useCallback((index: number) => {
    setCurrentTrackIndex(index);
  }, []);

  return { currentTrackIndex, updateCurrentTrackIndex };
}
