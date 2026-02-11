import k8sClient from "../config/kubernetes.config";

class PodWatcher {
  private watch = k8sClient.getWatch();

  async watchPod(
    namespace: string,
    podName: string,
    callback: (phase: string, event: string) => void,
  ): Promise<AbortController> {
    const path = `/api/v1/namespaces/${namespace}/pods`;

    const abortController = await this.watch.watch(
      path,
      {},
      (type, apiObj: any) => {
        if (apiObj.metadata?.name === podName) {
          const phase = apiObj.status?.phase || "Unknown";
          callback(phase, type);
        }
      },
      (err) => {
        if (err) {
          console.error("Watch error:", err);
        }
      },
    );

    return abortController;
  }

  async watchPodUntilReady(
    namespace: string,
    podName: string,
    timeout: number = 120000, // 2 minutes
  ): Promise<{ success: boolean; finalPhase: string; message: string }> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let abortController: AbortController | null = null;

      const checkTimeout = setInterval(() => {
        if (Date.now() - startTime > timeout) {
          clearInterval(checkTimeout);
          if (abortController) abortController.abort();
          resolve({
            success: false,
            finalPhase: "Timeout",
            message: `Pod did not become ready within ${timeout / 1000}s`,
          });
        }
      }, 1000);

      this.watchPod(namespace, podName, (phase, event) => {
        console.log(`[${event}] Pod ${podName}: ${phase}`);

        if (phase === "Running" || phase === "Succeeded") {
          clearInterval(checkTimeout);
          if (abortController) abortController.abort();
          resolve({
            success: true,
            finalPhase: phase,
            message: `Pod reached ${phase} state`,
          });
        } else if (phase === "Failed") {
          clearInterval(checkTimeout);
          if (abortController) abortController.abort();
          resolve({
            success: false,
            finalPhase: phase,
            message: "Pod failed to start",
          });
        }
      }).then((controller) => {
        abortController = controller;
      });
    });
  }
}

export default new PodWatcher();
