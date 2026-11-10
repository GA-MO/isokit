import type { Art, Example } from './shared.ts';
import { inContext as abTestInContext } from './ab-test.ts';
import { inContext as checkoutInContext } from './checkout-payment.ts';
import { inContext as ciDeployInContext } from './ci-deploy.ts';
import { inContext as etlInContext } from './etl-pipeline.ts';
import { example as ciDeploy } from './ci-deploy.ts';
import { example as notifications } from './notifications.ts';
import { example as fileUpload } from './file-upload.ts';
import { example as dbBranching } from './db-branching.ts';
import { example as serviceMap } from './service-map.ts';
import { example as authFlow } from './auth-flow.ts';
import { example as etlPipeline } from './etl-pipeline.ts';
import { example as queueWorkers } from './queue-workers.ts';
import { example as searchIndex } from './search-index.ts';
import { example as featureFlags } from './feature-flags.ts';
import { example as agentTools } from './agent-tools.ts';
import { example as checkoutPayment } from './checkout-payment.ts';
import { example as edgeCache } from './edge-cache.ts';
import { example as observability } from './observability.ts';
import { example as keycardSlot } from './keycard-slot.ts';
import { example as syncLoop } from './sync-loop.ts';
import { example as inboxFill } from './inbox-fill.ts';
import { example as batteryCharge } from './battery-charge.ts';
import { example as tableScan } from './table-scan.ts';
import { example as tileLoader } from './tile-loader.ts';
import { example as emptyBox } from './empty-box.ts';
import { example as vaultRotate } from './vault-rotate.ts';
import { example as firewallFilter } from './firewall-filter.ts';
import { example as auditLedger } from './audit-ledger.ts';
import { example as workloadScheduler } from './workload-scheduler.ts';
import { example as healthCheck } from './health-check.ts';
import { example as dnsResolve } from './dns-resolve.ts';
import { example as blueGreen } from './blue-green.ts';
import { example as snapshotRestore } from './snapshot-restore.ts';
import { example as cronJobs } from './cron-jobs.ts';
import { example as embeddingClusters } from './embedding-clusters.ts';
import { example as ragAnswer } from './rag-answer.ts';
import { example as trainingLoss } from './training-loss.ts';
import { example as recsRerank } from './recs-rerank.ts';
import { example as abTest } from './ab-test.ts';
import { example as funnelLive } from './funnel-live.ts';
import { example as billingCycle } from './billing-cycle.ts';
import { example as parcelDelivery } from './parcel-delivery.ts';
import { example as testShards } from './test-shards.ts';
import { example as stockSync } from './stock-sync.ts';
import { example as liveCursors } from './live-cursors.ts';
import { example as twoApprovals } from './two-approvals.ts';
import { example as translateSix } from './translate-six.ts';
import { example as smartHome } from './smart-home.ts';
import { example as buildCache } from './build-cache.ts';
import { example as calendarBooking } from './calendar-booking.ts';
import { example as loadSlider } from './load-slider.ts';
import { example as videoTranscode } from './video-transcode.ts';
import { example as fraudGauge } from './fraud-gauge.ts';
import { example as dataLineage } from './data-lineage.ts';
import { example as drillDown } from './drill-down.ts';

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

export const contexts = {
  landing: checkoutInContext,
  docs: etlInContext,
  deck: abTestInContext,
  readme: ciDeployInContext,
} as const satisfies Record<string, Art>;
