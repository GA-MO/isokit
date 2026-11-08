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
import { example as tableScan } from './table-scan';
import { example as tileLoader } from './tile-loader';
import { example as emptyBox } from './empty-box';
import { example as vaultRotate } from './vault-rotate';
import { example as firewallFilter } from './firewall-filter';
import { example as auditLedger } from './audit-ledger';
import { example as workloadScheduler } from './workload-scheduler';
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
import { example as funnelLive } from './funnel-live';
import { example as billingCycle } from './billing-cycle';
import { example as parcelDelivery } from './parcel-delivery';
import { example as testShards } from './test-shards';
import { example as stockSync } from './stock-sync';
import { example as liveCursors } from './live-cursors';
import { example as twoApprovals } from './two-approvals';
import { example as translateSix } from './translate-six';
import { example as smartHome } from './smart-home';
import { example as buildCache } from './build-cache';
import { example as calendarBooking } from './calendar-booking';
import { example as loadSlider } from './load-slider';
import { example as videoTranscode } from './video-transcode';
import { example as fraudGauge } from './fraud-gauge';
import { example as dataLineage } from './data-lineage';
import { example as drillDown } from './drill-down';

export const examples: readonly Example[] = [
  keycardSlot,
  syncLoop,
  inboxFill,
  batteryCharge,
  tableScan,
  tileLoader,
  emptyBox,
  notifications,
  fileUpload,
  ciDeploy,
  dbBranching,
  serviceMap,
  auditLedger,
  dnsResolve,
  calendarBooking,
  cronJobs,
  fraudGauge,
  authFlow,
  featureFlags,
  liveCursors,
  funnelLive,
  searchIndex,
  embeddingClusters,
  trainingLoss,
  abTest,
  etlPipeline,
  vaultRotate,
  firewallFilter,
  twoApprovals,
  billingCycle,
  recsRerank,
  smartHome,
  translateSix,
  queueWorkers,
  workloadScheduler,
  healthCheck,
  blueGreen,
  testShards,
  snapshotRestore,
  buildCache,
  videoTranscode,
  agentTools,
  checkoutPayment,
  parcelDelivery,
  edgeCache,
  observability,
  stockSync,
  loadSlider,
  dataLineage,
  ragAnswer,
  drillDown,
];
