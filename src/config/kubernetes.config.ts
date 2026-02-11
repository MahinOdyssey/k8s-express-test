import * as k8s from "@kubernetes/client-node";

class KubernetesClient {
  private kc: k8s.KubeConfig;
  private coreApi: k8s.CoreV1Api;
  private watch: k8s.Watch;
  private batchApi:k8s.BatchV1Api;

  constructor() {
    this.kc = new k8s.KubeConfig();

    if (process.env.KUBERNETES_SERVICE_HOST) {
      this.kc.loadFromCluster();
    } else {
      this.kc.loadFromDefault();
    }

    this.coreApi = this.kc.makeApiClient(k8s.CoreV1Api);
    this.watch = new k8s.Watch(this.kc);
    this.batchApi=this.kc.makeApiClient(k8s.BatchV1Api);
  }

  getApi(): k8s.CoreV1Api {
    return this.coreApi;
  }

  getBatchApi():k8s.BatchV1Api{
    return this.batchApi;
  }

  getWatch(): k8s.Watch {
    return this.watch;
  }

  getKubeConfig(): k8s.KubeConfig {
    return this.kc;
  }
}

export default new KubernetesClient();
