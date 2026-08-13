import {
  reconcileData,
} from './reconcileData';

import type {
  ReconciliationRecord,
} from '../types/ReconciliationRecord';

import type {
  ReconciliationResult,
} from '../types/ReconciliationResult';

import type {
  ReconciliationRules,
} from '../types/ReconciliationRules';

interface ReconciliationWorkerSuccess {
  type: 'success';
  requestId: string;
  result: ReconciliationResult;
}

interface ReconciliationWorkerFailure {
  type: 'error';
  requestId: string;
  message: string;
}

type ReconciliationWorkerResponse =
  | ReconciliationWorkerSuccess
  | ReconciliationWorkerFailure;

interface ReconciliationWorkerRequest {
  requestId: string;
  erpRecords: ReconciliationRecord[];
  crmRecords: ReconciliationRecord[];
  rules: ReconciliationRules;
}

export async function runReconciliationInWorker(
  erpRecords: ReconciliationRecord[],
  crmRecords: ReconciliationRecord[],
  rules: ReconciliationRules
): Promise<ReconciliationResult> {
  if (typeof Worker === 'undefined') {
    /*
     * Browser fallback for environments without Web Worker support.
     * Yield once so React can paint the loading state before the
     * synchronous engine runs on the main thread.
     */
    await yieldToBrowser();

    return reconcileData(
      erpRecords,
      crmRecords,
      rules
    );
  }

  return new Promise<ReconciliationResult>((resolve, reject) => {
    const worker = new Worker(
      new URL(
        '../workers/reconciliation.worker.ts',
        import.meta.url
      ),
      {
        type: 'module',
        name: 'enterprise-reconciliation-worker',
      }
    );

    const requestId = createRequestId();

    const cleanup = () => {
      worker.terminate();
    };

    worker.onerror = (event) => {
      cleanup();

      reject(
        new Error(
          event.message ||
            'The background reconciliation worker could not be executed.'
        )
      );
    };

    worker.onmessage = (
      event: MessageEvent<ReconciliationWorkerResponse>
    ) => {
      if (event.data.requestId !== requestId) {
        return;
      }

      cleanup();

      if (event.data.type === 'success') {
        resolve(event.data.result);
        return;
      }

      reject(new Error(event.data.message));
    };

    const request: ReconciliationWorkerRequest = {
      requestId,
      erpRecords,
      crmRecords,
      rules,
    };

    worker.postMessage(request);
  });
}

function createRequestId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `reconciliation-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 0);
  });
}
