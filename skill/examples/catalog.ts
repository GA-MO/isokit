import type { Example } from './shared';
import { example as ciDeploy } from './ci-deploy';
import { example as notifications } from './notifications';
import { example as fileUpload } from './file-upload';
import { example as dbBranching } from './db-branching';
import { example as serviceMap } from './service-map';
import { example as authFlow } from './auth-flow';
import { example as etlPipeline } from './etl-pipeline';
import { example as queueWorkers } from './queue-workers';
import { example as searchIndex } from './search-index';
import { example as featureFlags } from './feature-flags';
import { example as agentTools } from './agent-tools';
import { example as checkoutPayment } from './checkout-payment';
import { example as edgeCache } from './edge-cache';
import { example as observability } from './observability';
import { example as keycardSlot } from './keycard-slot';
import { example as syncLoop } from './sync-loop';
import { example as inboxFill } from './inbox-fill';
import { example as batteryCharge } from './battery-charge';
import { example as alertStack } from './alert-stack';
import { example as tableScan } from './table-scan';
import { example as tileLoader } from './tile-loader';
import { example as emptyBox } from './empty-box';
import { example as vaultRotate } from './vault-rotate';
import { example as firewallFilter } from './firewall-filter';
import { example as zeroTrust } from './zero-trust';
import { example as auditLedger } from './audit-ledger';
import { example as dataErasure } from './data-erasure';
import { example as workloadScheduler } from './workload-scheduler';
import { example as autoscale } from './autoscale';
import { example as healthCheck } from './health-check';
import { example as dnsResolve } from './dns-resolve';
import { example as blueGreen } from './blue-green';
import { example as snapshotRestore } from './snapshot-restore';
import { example as cronJobs } from './cron-jobs';
import { example as embeddingClusters } from './embedding-clusters';
import { example as ragAnswer } from './rag-answer';
import { example as trainingLoss } from './training-loss';
import { example as recsRerank } from './recs-rerank';
import { example as abTest } from './ab-test';

export const examples: readonly Example[] = [
  ciDeploy,
  notifications,
  fileUpload,
  dbBranching,
  serviceMap,
  authFlow,
  etlPipeline,
  queueWorkers,
  searchIndex,
  featureFlags,
  agentTools,
  checkoutPayment,
  edgeCache,
  observability,
  keycardSlot,
  syncLoop,
  inboxFill,
  batteryCharge,
  alertStack,
  tableScan,
  tileLoader,
  emptyBox,
  vaultRotate,
  firewallFilter,
  zeroTrust,
  auditLedger,
  dataErasure,
  workloadScheduler,
  autoscale,
  healthCheck,
  dnsResolve,
  blueGreen,
  snapshotRestore,
  cronJobs,
  embeddingClusters,
  ragAnswer,
  trainingLoss,
  recsRerank,
  abTest,
];
