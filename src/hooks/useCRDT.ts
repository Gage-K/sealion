import { createContext, useContext } from "react";
import type { DrumSynthCRDT } from "../types/crdt";

export const CRDTContext = createContext<DrumSynthCRDT | null>(null);

export const useCRDT = () => {
  const drumSynthCRDT = useContext(CRDTContext);
  if (!drumSynthCRDT) {
    throw new Error("useCRDT must be used within a CRDTProvider");
  }
  return drumSynthCRDT;
};
