import { DrumSynthCRDT } from "../types/crdt";
import { CRDTContext } from "../hooks/useCRDT";
import { useMemo } from "react";

export const CRDTProvider = ({ children }: { children: React.ReactNode }) => {
  const drumSynthCRDT = useMemo(() => new DrumSynthCRDT("user1"), []);
  return (
    <CRDTContext.Provider value={drumSynthCRDT}>
      {children}
    </CRDTContext.Provider>
  );
};
