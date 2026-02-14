import { Request, Response } from "express";
import * as k8s from "@kubernetes/client-node";
import k8sClient from "../config/kubernetes.config";
import { PodParams } from "../types/param.type";

const k8sApi = k8sClient.getApi();

export const createPVC = async (req: Request, res: Response) => {
  try {
    const {
      name,
      namespace = "default",
      size = "1Gi",
      storageClass = "standard",
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "name is required",
      });
    }

    const pvcManifest: k8s.V1PersistentVolumeClaim = {
      apiVersion: "v1",
      kind: "PersistentVolumeClaim",
      metadata: { name },
      spec: {
        accessModes: ["ReadWriteOnce"],
        storageClassName: storageClass,
        resources: {
          requests: {
            storage: size,
          },
        },
      },
    };

    const response = await k8sApi.createNamespacedPersistentVolumeClaim({
      namespace,
      body: pvcManifest,
    });

    res.json({
      success: true,
      message: "PVC created successfulyy",
      pvc: {
        name: response.metadata?.name,
        namespace: response.metadata?.namespace,
        size: size,
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

export const listPVCs = async (req: Request, res: Response) => {
  try {
    const pvcsResponse =
      await k8sApi.listPersistentVolumeClaimForAllNamespaces();

    const pvcs = pvcsResponse.items.map((pvc) => ({
      name: pvc.metadata?.name,
      namespace: pvc.metadata?.namespace,
      status: pvc.status?.phase,
      capacity: pvc.status?.capacity?.storage,
      storageClass: pvc.spec?.storageClassName,
      createdAt: pvc.metadata?.creationTimestamp,
    }));

    res.json({
      success: true,
      count: pvcs.length,
      pvcs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const deletePVC = async (req: Request<PodParams>, res: Response) => {
  try {
    const { namespace, name } = req.params;

    await k8sApi.deleteNamespacedPersistentVolumeClaim({ name, namespace });

    res.json({
      success: true,
      message: `PVC ${name} deleted successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete PVC",
    });
  }
};
