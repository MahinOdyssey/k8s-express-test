import k8sClient from "../config/kubernetes.config";
import jobWatcher from "./jobWatcher";
import yamlLoader from "./yamlLoader";
import * as k8s from "@kubernetes/client-node";

const k8sApi = k8sClient.getApi();
const batchApi = k8sClient.getBatchApi();

export interface WorkflowStep {
  name: string;
  yamlFile: string;
  variables: Record<string, string>;
}

export interface WorkflowResult {
  success: boolean;
  steps: {
    name: string;
    status: "pending" | "running" | "completed" | "failed";
    message?: string;
  }[];
  error?: string;
}

class WorkflowOrchestrator {
  async runWorkflow(
    projectId: string,
    namespace: string,
    steps: WorkflowStep[],
  ): Promise<WorkflowResult> {
    const result: WorkflowResult = {
      success: true,
      steps: steps.map((step) => ({ name: step.name, status: "pending" })),
    };

    console.log(`🚀 Starting workflow for project: ${projectId}`);

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      result.steps[i].status = "running";

      console.log(`\n📍 Step ${i + 1}/${steps.length}: ${step.name}`);

      try {
        // Load and create job
        const jobManifest = yamlLoader.loadManifestWithVariables<k8s.V1Job>(
          step.yamlFile,
          {
            TIMESTAMP: Date.now().toString(),
            ...step.variables,
          },
        );

        const jobResponse = await batchApi.createNamespacedJob({
          namespace,
          body: jobManifest,
        });

        const jobName = jobResponse.metadata?.name || "";
        console.log(`   ✓ Job ${jobName} created`);

        // Watch until complete
        const watchResult = await jobWatcher.watchJobUntilComplete(
          namespace,
          jobName,
        );

        if (watchResult.success) {
          result.steps[i].status = "completed";
          result.steps[i].message = watchResult.message;
          console.log(`   ✅ ${step.name} completed`);
        } else {
          result.steps[i].status = "failed";
          result.steps[i].message = watchResult.message;
          result.success = false;
          console.log(`   ❌ ${step.name} failed: ${watchResult.message}`);
          break;
        }
      } catch (error) {
        result.steps[i].status = "failed";
        result.steps[i].message =
          error instanceof Error ? error.message : "Unknown error";
        result.success = false;
        result.error = `Failed at step: ${step.name}`;
        console.log(`   ❌ ${step.name} error: ${result.steps[i].message}`);
        break;
      }
    }

    console.log(
      `\n${result.success ? "✅ Workflow completed" : "❌ Workflow failed"}`,
    );
    return result;
  }

  async createProjectResources(
    projectId: string,
    namespace: string,
    projectConfig: Record<string, string>,
  ): Promise<{ pvc: string; configMap: string }> {
    console.log(`📦 Creating resources for project: ${projectId}`);

    // Create PVC
    const pvcName = `${projectId}-data`;
    const pvcManifest: k8s.V1PersistentVolumeClaim = {
      apiVersion: "v1",
      kind: "PersistentVolumeClaim",
      metadata: { name: pvcName },
      spec: {
        accessModes: ["ReadWriteOnce"],
        storageClassName: "standard",
        resources: { requests: { storage: "5Gi" } },
      },
    };

    await k8sApi.createNamespacedPersistentVolumeClaim({
      namespace,
      body: pvcManifest,
    });
    console.log(`   ✓ PVC created: ${pvcName}`);

    // Create ConfigMap
    const configMapName = `${projectId}-config`;
    const configMapManifest: k8s.V1ConfigMap = {
      apiVersion: "v1",
      kind: "ConfigMap",
      metadata: { name: configMapName },
      data: projectConfig,
    };

    await k8sApi.createNamespacedConfigMap({
      namespace,
      body: configMapManifest,
    });
    console.log(`   ✓ ConfigMap created: ${configMapName}`);

    return { pvc: pvcName, configMap: configMapName };
  }
}

export default new WorkflowOrchestrator();
