import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import {
  RECONCILIATION_HISTORY_LIMIT,
} from '../config/storageConfig';

import {
  reconcileData,
} from '../utils/reconcileData';

import {
  createReconciliationHistoryEntry,
} from '../utils/reconciliationHistory';

import type {
  ReconciliationResult,
} from '../types/ReconciliationResult';

import type {
  ImportedDataset,
} from '../types/ImportedDataset';

import type {
  ReconciliationHistoryEntry,
} from '../types/ReconciliationHistory';

export type {
  ImportedDataset,
} from '../types/ImportedDataset';

import {
  hasBlockingIssues,
} from '../utils/dataQuality';

import {
  loadWorkspace,
  saveWorkspace,
} from '../utils/workspacePersistence';

export type WorkspacePersistenceStatus =
  | 'saved'
  | 'error';

interface ReconciliationContextType {
  erpData:
    | ImportedDataset
    | null;

  crmData:
    | ImportedDataset
    | null;

  reconciliationResult:
    | ReconciliationResult
    | null;

  reviewedExceptionKeys:
    string[];

  reconciliationHistory:
    ReconciliationHistoryEntry[];

  persistenceStatus: WorkspacePersistenceStatus;

  persistenceError:
    | string
    | null;

  lastSavedAt:
    | string
    | null;

  restoredFromStorage: boolean;

  setErpData: (
    data:
      | ImportedDataset
      | null
  ) => void;

  setCrmData: (
    data:
      | ImportedDataset
      | null
  ) => void;

  runReconciliation: () =>
    | ReconciliationResult
    | null;

  setExceptionReviewed: (
    key: string,
    reviewed: boolean
  ) => void;

  setExceptionsReviewed: (
    keys: string[],
    reviewed: boolean
  ) => void;

  deleteHistoryEntry: (
    entryId: string
  ) => void;

  clearHistory: () => void;

  clearData: () => void;
}

const ReconciliationContext =
  createContext<
    | ReconciliationContextType
    | undefined
  >(undefined);

interface ReconciliationProviderProps {
  children: ReactNode;
}

export function ReconciliationProvider({
  children,
}: ReconciliationProviderProps) {
  const [restoredWorkspace] = useState(
    () => loadWorkspace()
  );

  const [
    erpDataState,
    setErpDataState,
  ] =
    useState<
      ImportedDataset | null
    >(
      restoredWorkspace?.erpData ?? null
    );

  const [
    crmDataState,
    setCrmDataState,
  ] =
    useState<
      ImportedDataset | null
    >(
      restoredWorkspace?.crmData ?? null
    );

  const [
    reconciliationResult,
    setReconciliationResult,
  ] =
    useState<
      ReconciliationResult | null
    >(
      restoredWorkspace?.reconciliationResult ?? null
    );

  const [
    reviewedExceptionKeys,
    setReviewedExceptionKeys,
  ] = useState<string[]>(
    restoredWorkspace?.reviewedExceptionKeys ?? []
  );

  const [
    reconciliationHistory,
    setReconciliationHistory,
  ] = useState<ReconciliationHistoryEntry[]>(
    restoredWorkspace?.reconciliationHistory ?? []
  );

  const [
    persistenceStatus,
    setPersistenceStatus,
  ] = useState<WorkspacePersistenceStatus>('saved');

  const [
    persistenceError,
    setPersistenceError,
  ] = useState<string | null>(null);

  const [
    lastSavedAt,
    setLastSavedAt,
  ] = useState<string | null>(
    restoredWorkspace?.savedAt ?? null
  );

  useEffect(() => {
    const persistenceResult = saveWorkspace({
      erpData: erpDataState,
      crmData: crmDataState,
      reconciliationResult,
      reviewedExceptionKeys,
      reconciliationHistory,
    });

    if (persistenceResult.success) {
      setPersistenceStatus('saved');
      setPersistenceError(null);
      setLastSavedAt(persistenceResult.savedAt);
      return;
    }

    setPersistenceStatus('error');
    setPersistenceError(persistenceResult.error);
  }, [
    erpDataState,
    crmDataState,
    reconciliationResult,
    reviewedExceptionKeys,
    reconciliationHistory,
  ]);

  const invalidateReconciliation =
    () => {
      setReconciliationResult(
        null
      );

      setReviewedExceptionKeys(
        []
      );
    };

  const setErpData = (
    data:
      | ImportedDataset
      | null
  ) => {
    setErpDataState(data);

    invalidateReconciliation();
  };

  const setCrmData = (
    data:
      | ImportedDataset
      | null
  ) => {
    setCrmDataState(data);

    invalidateReconciliation();
  };

  const runReconciliation =
    () => {
      if (
        !erpDataState ||
        !crmDataState
      ) {
        return null;
      }

      /*
       * Any BLOCKING data-quality issue,
       * including duplicate IDs,
       * blocks reconciliation.
       */
      if (
        hasBlockingIssues(
          erpDataState.issues
        ) ||
        hasBlockingIssues(
          crmDataState.issues
        )
      ) {
        return null;
      }

      if (
        erpDataState.records
          .length === 0 ||
        crmDataState.records
          .length === 0
      ) {
        return null;
      }

      const result =
        reconcileData(
          erpDataState.records,
          crmDataState.records
        );

      const historyEntry =
        createReconciliationHistoryEntry(
          result,
          erpDataState,
          crmDataState
        );

      setReconciliationResult(
        result
      );

      setReconciliationHistory(
        (currentHistory) =>
          [
            historyEntry,
            ...currentHistory,
          ].slice(
            0,
            RECONCILIATION_HISTORY_LIMIT
          )
      );

      /*
       * A new reconciliation
       * creates a new review cycle.
       */
      setReviewedExceptionKeys(
        []
      );

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
            currentKeys.includes(
              key
            )
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
          return Array.from(
            new Set([
              ...currentKeys,
              ...keys,
            ])
          );
        }

        const keysToRemove =
          new Set(keys);

        return currentKeys.filter(
          (key) =>
            !keysToRemove.has(
              key
            )
        );
      }
    );
  };

  const deleteHistoryEntry = (
    entryId: string
  ) => {
    setReconciliationHistory(
      (currentHistory) =>
        currentHistory.filter(
          (entry) =>
            entry.id !== entryId
        )
    );
  };

  const clearHistory = () => {
    setReconciliationHistory([]);
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
        erpData:
          erpDataState,

        crmData:
          crmDataState,

        reconciliationResult,

        reviewedExceptionKeys,

        reconciliationHistory,

        persistenceStatus,

        persistenceError,

        lastSavedAt,

        restoredFromStorage:
          restoredWorkspace !== null,

        setErpData,

        setCrmData,

        runReconciliation,

        setExceptionReviewed,

        setExceptionsReviewed,

        deleteHistoryEntry,

        clearHistory,

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
