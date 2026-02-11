import { Request, Response } from "express";
import * as k8s from "@kubernetes/client-node";
import k8sClient from "../config/kubernetes.config";
import { PodParams } from "../types/param.type";
import jobWatcher from "../services/jobWatcher";

const batchApi = k8sClient.getBatchApi();

export const createJob = async (req: Request, res: Response) => {
  try {
    const { name, image, namespace = "default", command } = req.body;

    if (!name || !image) {
      return res.status(400).json({
        success: "False",
        error: "Name and Image required",
      });
    }

    const jobManifest: k8s.V1Job = {
      apiVersion: "batch/v1",
      kind: "Job",
      metadata: { name },
      spec: {
        template: {
          spec: {
            containers: [
              {
                name,
                image,
                command: command || undefined,
              },
            ],
            restartPolicy: "Never",
          },
        },
        backoffLimit: 3,
      },
    };

    const response = await batchApi.createNamespacedJob({
      namespace,
      body: jobManifest,
    });

    res.json({
      success: true,
      message: "Job created successfully",
      job: {
        name: response.metadata?.name,
        namespace: response.metadata?.namespace,
        status: response.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const listJobs = async (req: Request, res: Response) => {
  try {
    const jobResponses = await batchApi.listJobForAllNamespaces();

    const jobs = jobResponses.items.map((job) => ({
      name: job.metadata?.name,
      namespace: job.metadata?.namespace,
      succeeded: job.status?.succeeded,
      failed: job.status?.failed || 0,
      active: job.status?.active || 0,
      completionTime: job.status?.completionTime,
      createdAt: job.metadata?.creationTimestamp,
    }));

    res.json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const deleteJob = async (req: Request<PodParams>, res: Response) => {
  try {
    const { namespace, name } = req.params;

    await batchApi.deleteNamespacedJob({
      name,
      namespace,
      body: {
        propagationPolicy: "Background",
      },
    });

    res.json({
      success: true,
      message: `Job ${name} deleted successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const createJobAndWatch = async (req: Request, res: Response) => {
  try {
    const { name, image, namespace = "default", command } = req.body;

    if (!name || !image) {
      return res.status(400).json({
        success: false,
        error: "Name and image are required",
      });
    }

    const jobManifest: k8s.V1Job = {
      apiVersion: "batch/v1",
      kind: "Job",
      metadata: { name },
      spec: {
        template: {
          spec: {
            containers: [
              {
                name,
                image,
                command: command || undefined,
              },
            ],
            restartPolicy: "Never",
          },
        },
        backoffLimit: 3,
      },
    };

    // Create the job
    const response = await batchApi.createNamespacedJob({
      namespace,
      body: jobManifest,
    });

    console.log(`🚀 Job ${name} created, watching for completion...`);

    // Watch until complete
    const watchResult = await jobWatcher.watchJobUntilComplete(namespace, name);

    res.json({
      success: watchResult.success,
      message: watchResult.message,
      job: {
        name: response.metadata?.name,
        namespace: response.metadata?.namespace,
        status: watchResult.status,
        succeeded: watchResult.succeeded,
        failed: watchResult.failed,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
