import { makeDrumSynthCRDT } from "../config/makeCRDT";
import { CRDTContext } from "../hooks/useCRDT";
import { useMemo } from "react";

export const CRDTProvider = ({ children }: { children: React.ReactNode }) => {
  const drumSynthCRDT = useMemo(
    () => makeDrumSynthCRDT(crypto.randomUUID()),
    []
  );
  return (
    <CRDTContext.Provider value={drumSynthCRDT}>
      {children}
    </CRDTContext.Provider>
  );
};
