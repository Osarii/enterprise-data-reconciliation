import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';

import { reconcileData } from '../utils/reconcileData';

import type { ReconciliationRecord } from '../types/ReconciliationRecord';

import type { ReconciliationResult } from '../types/ReconciliationResult';

export interface ImportedDataset {
  fileName: string;
  fileSize: number;
  records: ReconciliationRecord[];
  errors: string[];
  totalRows: number;
}

interface ReconciliationContextType {
  erpData: ImportedDataset | null;
  crmData: ImportedDataset | null;

  reconciliationResult: ReconciliationResult | null;

  setErpData: (
    data: ImportedDataset | null
  ) => void;

  setCrmData: (
    data: ImportedDataset | null
  ) => void;

  runReconciliation: () =>
    ReconciliationResult | null;

  clearData: () => void;
}

const ReconciliationContext =
  createContext<
    ReconciliationContextType | undefined
  >(undefined);

interface ReconciliationProviderProps {
  children: ReactNode;
}

export function ReconciliationProvider({
  children,
}: ReconciliationProviderProps) {
  const [erpDataState, setErpDataState] =
    useState<ImportedDataset | null>(null);

  const [crmDataState, setCrmDataState] =
    useState<ImportedDataset | null>(null);

  const [
    reconciliationResult,
    setReconciliationResult,
  ] = useState<ReconciliationResult | null>(
    null
  );

  const setErpData = (
    data: ImportedDataset | null
  ) => {
    setErpDataState(data);

    // Imported data changed, previous result
    // is no longer valid.
    setReconciliationResult(null);
  };

  const setCrmData = (
    data: ImportedDataset | null
  ) => {
    setCrmDataState(data);

    // Imported data changed, previous result
    // is no longer valid.
    setReconciliationResult(null);
  };

  const runReconciliation = () => {
    if (!erpDataState || !crmDataState) {
      return null;
    }

    if (
      erpDataState.errors.length > 0 ||
      crmDataState.errors.length > 0
    ) {
      return null;
    }

    if (
      erpDataState.records.length === 0 ||
      crmDataState.records.length === 0
    ) {
      return null;
    }

    const result = reconcileData(
      erpDataState.records,
      crmDataState.records
    );

    setReconciliationResult(result);

    return result;
  };

  const clearData = () => {
    setErpDataState(null);
    setCrmDataState(null);
    setReconciliationResult(null);
  };

  return (
    <ReconciliationContext.Provider
      value={{
        erpData: erpDataState,
        crmData: crmDataState,

        reconciliationResult,

        setErpData,
        setCrmData,

        runReconciliation,

        clearData,
      }}
    >
      {children}
    </ReconciliationContext.Provider>
  );
}

export function useReconciliation() {
  const context =
    useContext(ReconciliationContext);

  if (!context) {
    throw new Error(
      'useReconciliation must be used inside ReconciliationProvider'
    );
  }

  return context;
}