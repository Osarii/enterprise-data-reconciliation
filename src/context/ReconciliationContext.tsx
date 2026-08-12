import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  DEFAULT_FIELD_MAPPING,
} from '../config/fieldMappingConfig';

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
  DatasetFieldMappings,
  FieldMapping,
} from '../types/FieldMapping';

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

export type DatasetTarget =
  | 'erp'
  | 'crm';

interface ReconciliationContextType {
  erpData: ImportedDataset | null;
  crmData: ImportedDataset | null;
  reconciliationResult: ReconciliationResult | null;
  reviewedExceptionKeys: string[];
  reconciliationHistory: ReconciliationHistoryEntry[];
  fieldMappings: DatasetFieldMappings;
  persistenceStatus: WorkspacePersistenceStatus;
  persistenceError: string | null;
  lastSavedAt: string | null;
  restoredFromStorage: boolean;

  setErpData: (
    data: ImportedDataset | null
  ) => void;

  setCrmData: (
    data: ImportedDataset | null
  ) => void;

  setFieldMapping: (
    target: DatasetTarget,
    mapping: FieldMapping
  ) => void;

  resetFieldMappings: () => void;

  runReconciliation: () => ReconciliationResult | null;

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

interface WorkspaceState {
  erpData: ImportedDataset | null;
  crmData: ImportedDataset | null;
  reconciliationResult: ReconciliationResult | null;
  reviewedExceptionKeys: string[];
  reconciliationHistory: ReconciliationHistoryEntry[];
  fieldMappings: DatasetFieldMappings;
}

const ReconciliationContext =
  createContext<ReconciliationContextType | undefined>(undefined);

interface ReconciliationProviderProps {
  children: ReactNode;
}

function createInitialWorkspaceState(): {
  workspace: WorkspaceState;
  restored: boolean;
  savedAt: string | null;
} {
  const restoredWorkspace = loadWorkspace();

  if (!restoredWorkspace) {
    return {
      workspace: {
        erpData: null,
        crmData: null,
        reconciliationResult: null,
        reviewedExceptionKeys: [],
        reconciliationHistory: [],
        fieldMappings: {
          erp: { ...DEFAULT_FIELD_MAPPING },
          crm: { ...DEFAULT_FIELD_MAPPING },
        },
      },
      restored: false,
      savedAt: null,
    };
  }

  return {
    workspace: {
      erpData: restoredWorkspace.erpData,
      crmData: restoredWorkspace.crmData,
      reconciliationResult:
        restoredWorkspace.reconciliationResult,
      reviewedExceptionKeys: [
        ...restoredWorkspace.reviewedExceptionKeys,
      ],
      reconciliationHistory: [
        ...restoredWorkspace.reconciliationHistory,
      ],
      fieldMappings: {
        erp: { ...restoredWorkspace.fieldMappings.erp },
        crm: { ...restoredWorkspace.fieldMappings.crm },
      },
    },
    restored: true,
    savedAt: restoredWorkspace.savedAt,
  };
}

export function ReconciliationProvider({
  children,
}: ReconciliationProviderProps) {
  const [initialWorkspace] = useState(
    createInitialWorkspaceState
  );

  const [workspace, setWorkspace] =
    useState<WorkspaceState>(initialWorkspace.workspace);

  const workspaceRef = useRef<WorkspaceState>(
    initialWorkspace.workspace
  );

  const [persistenceStatus, setPersistenceStatus] =
    useState<WorkspacePersistenceStatus>('saved');

  const [persistenceError, setPersistenceError] =
    useState<string | null>(null);

  const [lastSavedAt, setLastSavedAt] =
    useState<string | null>(initialWorkspace.savedAt);

  const persistWorkspace = (
    nextWorkspace: WorkspaceState
  ) => {
    const persistenceResult = saveWorkspace(nextWorkspace);

    if (persistenceResult.success) {
      setPersistenceStatus('saved');
      setPersistenceError(null);
      setLastSavedAt(persistenceResult.savedAt);
      return;
    }

    setPersistenceStatus('error');
    setPersistenceError(persistenceResult.error);
  };

  const commitWorkspace = (
    updater:
      | WorkspaceState
      | ((current: WorkspaceState) => WorkspaceState)
  ): WorkspaceState => {
    const current = workspaceRef.current;
    const nextWorkspace =
      typeof updater === 'function'
        ? updater(current)
        : updater;

    workspaceRef.current = nextWorkspace;
    setWorkspace(nextWorkspace);

    /*
     * Write-through persistence:
     * save immediately as part of the same user action instead of
     * waiting for a later React effect. This protects the workspace
     * even if navigation/remount happens immediately after an import,
     * reconciliation or review change.
     */
    persistWorkspace(nextWorkspace);

    return nextWorkspace;
  };

  const setErpData = (
    data: ImportedDataset | null
  ) => {
    commitWorkspace((current) => ({
      ...current,
      erpData: data,
      reconciliationResult: null,
      reviewedExceptionKeys: [],
      fieldMappings: data
        ? {
            ...current.fieldMappings,
            erp: { ...data.fieldMapping },
          }
        : current.fieldMappings,
    }));
  };

  const setCrmData = (
    data: ImportedDataset | null
  ) => {
    commitWorkspace((current) => ({
      ...current,
      crmData: data,
      reconciliationResult: null,
      reviewedExceptionKeys: [],
      fieldMappings: data
        ? {
            ...current.fieldMappings,
            crm: { ...data.fieldMapping },
          }
        : current.fieldMappings,
    }));
  };

  const setFieldMapping = (
    target: DatasetTarget,
    mapping: FieldMapping
  ) => {
    commitWorkspace((current) => ({
      ...current,
      fieldMappings: {
        ...current.fieldMappings,
        [target]: { ...mapping },
      },
    }));
  };

  const resetFieldMappings = () => {
    commitWorkspace((current) => ({
      ...current,
      fieldMappings: {
        erp: { ...DEFAULT_FIELD_MAPPING },
        crm: { ...DEFAULT_FIELD_MAPPING },
      },
    }));
  };

  const runReconciliation = () => {
    const current = workspaceRef.current;

    if (!current.erpData || !current.crmData) {
      return null;
    }

    if (
      hasBlockingIssues(current.erpData.issues) ||
      hasBlockingIssues(current.crmData.issues)
    ) {
      return null;
    }

    if (
      current.erpData.records.length === 0 ||
      current.crmData.records.length === 0
    ) {
      return null;
    }

    const result = reconcileData(
      current.erpData.records,
      current.crmData.records
    );

    const historyEntry =
      createReconciliationHistoryEntry(
        result,
        current.erpData,
        current.crmData
      );

    commitWorkspace({
      ...current,
      reconciliationResult: result,
      reconciliationHistory: [
        historyEntry,
        ...current.reconciliationHistory,
      ].slice(0, RECONCILIATION_HISTORY_LIMIT),
      reviewedExceptionKeys: [],
    });

    return result;
  };

  const setExceptionReviewed = (
    key: string,
    reviewed: boolean
  ) => {
    commitWorkspace((current) => {
      let nextKeys: string[];

      if (reviewed) {
        nextKeys = current.reviewedExceptionKeys.includes(key)
          ? current.reviewedExceptionKeys
          : [...current.reviewedExceptionKeys, key];
      } else {
        nextKeys = current.reviewedExceptionKeys.filter(
          (currentKey) => currentKey !== key
        );
      }

      return {
        ...current,
        reviewedExceptionKeys: nextKeys,
      };
    });
  };

  const setExceptionsReviewed = (
    keys: string[],
    reviewed: boolean
  ) => {
    commitWorkspace((current) => {
      if (reviewed) {
        return {
          ...current,
          reviewedExceptionKeys: Array.from(
            new Set([
              ...current.reviewedExceptionKeys,
              ...keys,
            ])
          ),
        };
      }

      const keysToRemove = new Set(keys);

      return {
        ...current,
        reviewedExceptionKeys:
          current.reviewedExceptionKeys.filter(
            (key) => !keysToRemove.has(key)
          ),
      };
    });
  };

  const deleteHistoryEntry = (
    entryId: string
  ) => {
    commitWorkspace((current) => ({
      ...current,
      reconciliationHistory:
        current.reconciliationHistory.filter(
          (entry) => entry.id !== entryId
        ),
    }));
  };

  const clearHistory = () => {
    commitWorkspace((current) => ({
      ...current,
      reconciliationHistory: [],
    }));
  };

  const clearData = () => {
    commitWorkspace((current) => ({
      ...current,
      erpData: null,
      crmData: null,
      reconciliationResult: null,
      reviewedExceptionKeys: [],
    }));
  };

  return (
    <ReconciliationContext.Provider
      value={{
        erpData: workspace.erpData,
        crmData: workspace.crmData,
        reconciliationResult:
          workspace.reconciliationResult,
        reviewedExceptionKeys:
          workspace.reviewedExceptionKeys,
        reconciliationHistory:
          workspace.reconciliationHistory,
        fieldMappings: workspace.fieldMappings,
        persistenceStatus,
        persistenceError,
        lastSavedAt,
        restoredFromStorage: initialWorkspace.restored,
        setErpData,
        setCrmData,
        setFieldMapping,
        resetFieldMappings,
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
  const context = useContext(ReconciliationContext);

  if (!context) {
    throw new Error(
      'useReconciliation must be used inside ReconciliationProvider'
    );
  }

  return context;
}
