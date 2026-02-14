import { Request, Response } from "express";
import * as k8s from "@kubernetes/client-node";
import k8sClient from "../config/kubernetes.config";
import { PodParams } from "../types/param.type";

const k8sApi = k8sClient.getApi();

export const createConfigMap = async (req: Request, res: Response) => {
  try {
    const { name, namespace = "default", data } = req.body;
    if (!name || !data) {
      return res.status(400).json({
        success: false,
        error: "name and data are required",
      });
    }

    const configMapManifest: k8s.V1ConfigMap = {
      apiVersion: "v1",
      kind: "ConfigMap",
      metadata: { name },
      data: data,
    };

    const response = await k8sApi.createNamespacedConfigMap({
      namespace,
      body: configMapManifest,
    });

    res.json({
      success: true,
      message: "ConfigMap created successfully",
      configMap: {
        name: response?.metadata?.name,
        namespace: response?.metadata?.namespace,
        data: response?.data,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown Error",
    });
  }
};

export const getConfigMap = async (req: Request<PodParams>, res: Response) => {
  try {
    const { name, namespace } = req.params;

    const response = await k8sApi.readNamespacedConfigMap({ name, namespace });
    res.json({
      success: true,
      configMap: {
        name: response?.metadata?.name,
        namespace: response?.metadata?.namespace,
        data: response?.data,
      },
    });
  } catch (error) {
    res.json({
      success: false,
      error: error instanceof Error ? error?.message : "Confit Map not Found",
    });
  }
};

export const listConfigMaps = async (req: Request, res: Response) => {
  try {
    const configMapsResponse = await k8sApi.listConfigMapForAllNamespaces();

    const configMaps = configMapsResponse.items.map((cm) => ({
      name: cm.metadata?.name,
      namespace: cm.metadata?.namespace,
      dataKeys: Object.keys(cm.data || {}),
      createdAt: cm.metadata?.creationTimestamp,
    }));

    res.json({
      success: true,
      count: configMaps.length,
      configMaps,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const deleteConfigMap = async (req: Request<PodParams>, res: Response) => {
  try {
    const { namespace, name } = req.params;

    await k8sApi.deleteNamespacedConfigMap({ name, namespace });

    res.json({
      success: true,
      message: `ConfigMap ${name} deleted successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete ConfigMap",
    });
  }
};
