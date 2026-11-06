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
];
