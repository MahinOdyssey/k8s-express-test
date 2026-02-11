import k8sClient from "../config/kubernetes.config";

class JobWatcher {
  private watch = k8sClient.getWatch();
  private batchApi = k8sClient.getBatchApi();

  async watchJobUntilComplete(
    namespace: string,
    jobName: string,
    timeout: number = 300000, // 5 minutes for jobs
  ): Promise<{
    success: boolean;
    status: string;
    message: string;
    succeeded?: number;
    failed?: number;
  }> {
    return new Promise(async (resolve) => {
      const startTime = Date.now();
      let abortController: AbortController | null = null;

      // Check initial status
      const checkJobStatus = async () => {
        try {
          const job = await this.batchApi.readNamespacedJob({
            name: jobName,
            namespace,
          });
          const status = job.status;

          console.log(
            `🔍 Job ${jobName} - Active: ${status?.active || 0}, Succeeded: ${status?.succeeded || 0}, Failed: ${status?.failed || 0}`,
          );

          // Job succeeded
          if (status?.succeeded && status.succeeded > 0) {
            console.log(`✅ Job ${jobName} completed successfully`);
            if (abortController) abortController.abort();
            clearInterval(pollInterval);
            resolve({
              success: true,
              status: "Succeeded",
              message: "Job completed successfully",
              succeeded: status.succeeded,
              failed: status.failed || 0,
            });
            return true;
          }

          // Job failed
          if (
            status?.failed &&
            status.failed > 0 &&
            (!status.active || status.active === 0)
          ) {
            console.log(`❌ Job ${jobName} failed`);
            if (abortController) abortController.abort();
            clearInterval(pollInterval);
            resolve({
              success: false,
              status: "Failed",
              message: "Job failed after retries",
              succeeded: status.succeeded || 0,
              failed: status.failed,
            });
            return true;
          }

          return false;
        } catch (error) {
          console.error("Error checking job status:", error);
          return false;
        }
      };

      // Poll every 2 seconds
      const pollInterval = setInterval(async () => {
        const isComplete = await checkJobStatus();

        if (!isComplete && Date.now() - startTime > timeout) {
          if (abortController) abortController.abort();
          clearInterval(pollInterval);
          resolve({
            success: false,
            status: "Timeout",
            message: `Job did not complete within ${timeout / 1000}s`,
          });
        }
      }, 2000);

      // Start watching for real-time updates
      const path = `/apis/batch/v1/namespaces/${namespace}/jobs`;

      this.watch
        .watch(
          path,
          {},
          async (type, apiObj: any) => {
            if (apiObj.metadata?.name === jobName) {
              console.log(`---[${type}] Job ${jobName} updated---`);
              await checkJobStatus();
            }
          },
          (err) => {
            if (err && err.name !== "AbortError") {
              console.error("Watch error:", err);
            }
          },
        )
        .then((controller) => {
          abortController = controller;
        });

      // Check immediately
      await checkJobStatus();
    });
  }
}

export default new JobWatcher();
