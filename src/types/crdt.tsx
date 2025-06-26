import type { Sequence } from "./types";

export interface CRDTOperation {
  type: "STEP_TOGGLE";
  id: string;
  clientId: string;
  timestamp: number;
  trackIndex?: number;
  stepIndex?: number;
  value?: number | boolean | string;
  parameter?: string;
  effectType?: string;
}

export interface StepToggleOperation extends CRDTOperation {
  type: "STEP_TOGGLE";
  trackIndex: number;
  stepIndex: number;
}

export interface CRDTState {
  operations: Set<string>;
  sequence: Sequence;
  globalParams: {
    volume: number;
    swing: number;
    bpm: number;
  };
  lastUpdated: number;
}

export interface OperationLog {
  operations: CRDTOperation[];
  maxTimeStamp: number;
}
