import {
  reconcileData,
} from '../utils/reconcileData';

import type {
  ReconciliationRecord,
} from '../types/ReconciliationRecord';

import type {
  ReconciliationResult,
} from '../types/ReconciliationResult';

import type {
  ReconciliationRules,
} from '../types/ReconciliationRules';

interface ReconciliationWorkerRequest {
  requestId: string;
  erpRecords: ReconciliationRecord[];
  crmRecords: ReconciliationRecord[];
  rules: ReconciliationRules;
}

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

self.onmessage = (
  event: MessageEvent<ReconciliationWorkerRequest>
) => {
  const {
    requestId,
    erpRecords,
    crmRecords,
    rules,
  } = event.data;

  try {
    const result = reconcileData(
      erpRecords,
      crmRecords,
      rules
    );

    const response: ReconciliationWorkerResponse = {
      type: 'success',
      requestId,
      result,
    };

    self.postMessage(response);
  } catch (error: unknown) {
    const response: ReconciliationWorkerResponse = {
      type: 'error',
      requestId,
      message:
        error instanceof Error
          ? error.message
          : 'The reconciliation worker failed unexpectedly.',
    };

    self.postMessage(response);
  }
};

export {};
