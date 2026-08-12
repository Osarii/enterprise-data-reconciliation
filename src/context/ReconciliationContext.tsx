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

  reviewedExceptionKeys: string[];

  setErpData: (
    data: ImportedDataset | null
  ) => void;

  setCrmData: (
    data: ImportedDataset | null
  ) => void;

  runReconciliation: () =>
    ReconciliationResult | null;

  setExceptionReviewed: (
    key: string,
    reviewed: boolean
  ) => void;

  setExceptionsReviewed: (
    keys: string[],
    reviewed: boolean
  ) => void;

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

  const [
    reviewedExceptionKeys,
    setReviewedExceptionKeys,
  ] = useState<string[]>([]);

  const invalidateReconciliation = () => {
    setReconciliationResult(null);
    setReviewedExceptionKeys([]);
  };

  const setErpData = (
    data: ImportedDataset | null
  ) => {
    setErpDataState(data);
    invalidateReconciliation();
  };

  const setCrmData = (
    data: ImportedDataset | null
  ) => {
    setCrmDataState(data);
    invalidateReconciliation();
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

    // A new reconciliation creates
    // a new review cycle.
    setReviewedExceptionKeys([]);

    return result;
  };

  const setExceptionReviewed = (
    key: string,
    reviewed: boolean
  ) => {
    setReviewedExceptionKeys(
      (currentKeys) => {
        if (reviewed) {
          if (
            currentKeys.includes(key)
          ) {
            return currentKeys;
          }

          return [
            ...currentKeys,
            key,
          ];
        }

        return currentKeys.filter(
          (currentKey) =>
            currentKey !== key
        );
      }
    );
  };

  const setExceptionsReviewed = (
    keys: string[],
    reviewed: boolean
  ) => {
    setReviewedExceptionKeys(
      (currentKeys) => {
        if (reviewed) {
          const combined =
            new Set([
              ...currentKeys,
              ...keys,
            ]);

          return Array.from(combined);
        }

        const keysToRemove =
          new Set(keys);

        return currentKeys.filter(
          (key) =>
            !keysToRemove.has(key)
        );
      }
    );
  };

  const clearData = () => {
    setErpDataState(null);
    setCrmDataState(null);
    setReconciliationResult(null);
    setReviewedExceptionKeys([]);
  };

  return (
    <ReconciliationContext.Provider
      value={{
        erpData: erpDataState,
        crmData: crmDataState,

        reconciliationResult,

        reviewedExceptionKeys,

        setErpData,
        setCrmData,

        runReconciliation,

        setExceptionReviewed,
        setExceptionsReviewed,

        clearData,
      }}
    >
      {children}
    </ReconciliationContext.Provider>
  );
}

export function useReconciliation() {
  const context =
    useContext(
      ReconciliationContext
    );

  if (!context) {
    throw new Error(
      'useReconciliation must be used inside ReconciliationProvider'
    );
  }

  return context;
}