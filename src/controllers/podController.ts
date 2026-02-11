import { Request, Response } from "express";
import * as k8s from "@kubernetes/client-node";
import k8sClient from "../config/kubernetes.config";
import podWatcher from '../services/podWatcher';
import { PodParams } from "../types/param.type";

const k8sApi = k8sClient.getApi();

export const listAllPods = async (req: Request, res: Response) => {
  try {
    const podsResponse = await k8sApi.listPodForAllNamespaces();

    const pods = podsResponse.items.map((pod) => ({
      name: pod.metadata?.name,
      namespace: pod.metadata?.namespace,
      status: pod.status?.phase,
      createdAt: pod.metadata?.creationTimestamp,
    }));

    res.json({
      success: true,
      count: pods.length,
      pods: pods,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const createPod = async (req: Request, res: Response) => {
  try {
    const { name, image, namespace = "default" } = req.body;

    if (!name || !image) {
      return res.status(400).json({
        success: false,
        error: "Name and image are required",
      });
    }

    const podManifest: k8s.V1Pod = {
      apiVersion: "v1",
      kind: "Pod",
      metadata: { name },
      spec: {
        containers: [
          {
            name,
            image,
            ports: [{ containerPort: 80 }],
          },
        ],
        restartPolicy: "Never",
      },
    };

    const response = await k8sApi.createNamespacedPod({
      namespace,
      body: podManifest,
    });

    res.json({
      success: true,
      message: "Pod created successfully",
      pod: {
        name: response.metadata?.name,
        namespace: response.metadata?.namespace,
        status: response.status?.phase,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getPodStatus = async (req: Request<PodParams>, res: Response) => {
  try {
    const { namespace, name } = req.params;

    const response = await k8sApi.readNamespacedPod({ name, namespace });

    res.json({
      success: true,
      pod: {
        name: response.metadata?.name,
        namespace: response.metadata?.namespace,
        status: response.status?.phase,
        conditions: response.status?.conditions,
        containerStatuses: response.status?.containerStatuses,
        createdAt: response.metadata?.creationTimestamp,
        labels: response.metadata?.labels,
      },
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : "Pod not found",
    });
  }
};

export const deletePod = async (req: Request<PodParams>, res: Response) => {
  try {
    const { namespace, name } = req.params;

    await k8sApi.deleteNamespacedPod({ name, namespace });

    res.json({
      success: true,
      message: `Pod ${name} in namespace ${namespace} deleted successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete pod",
    });
  }
};

export const createPodAndWatch = async (req: Request, res: Response) => {
  try {
    const { name, image, namespace = 'default' } = req.body;

    if (!name || !image) {
      return res.status(400).json({
        success: false,
        error: 'Name and image are required',
      });
    }

    const podManifest: k8s.V1Pod = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name },
      spec: {
        containers: [
          {
            name,
            image,
            ports: [{ containerPort: 80 }],
          },
        ],
        restartPolicy: 'Never',
      },
    };

    // Create the pod
    const response = await k8sApi.createNamespacedPod({
      namespace,
      body: podManifest,
    });

    console.log(`🚀 Pod ${name} created, watching status...`);

    // Watch until ready
    const watchResult = await podWatcher.watchPodUntilReady(namespace, name);

    res.json({
      success: watchResult.success,
      message: watchResult.message,
      pod: {
        name: response.metadata?.name,
        namespace: response.metadata?.namespace,
        finalPhase: watchResult.finalPhase,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
