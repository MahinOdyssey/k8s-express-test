import { Request, Response } from "express";
import workflowOrchestrator from "../services/workflowOrchestrator";

export const runValidationWorkflow = async (req: Request, res: Response) => {
  try {
    const {
      projectId,
      projectName,
      gcpPath,
      builderImage = "bash:latest",
      namespace = "default",
    } = req.body;

    if (!projectId || !projectName || !gcpPath) {
      res.status(500).json({
        success: false,
        error: "Project id, Project name, GCp path Required",
      });
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log(`🎬 Starting Validation Workflow for: ${projectName}`);
    console.log(`${"=".repeat(60)}\n`);

    const resources = await workflowOrchestrator.createProjectResources(
      projectId,
      namespace,
      {
        PROJECT_ID: projectId,
        PROJECT_NAME: projectName,
        GCP_PATH: gcpPath,
        BUILDER_IMAGE: builderImage,
      },
    );

    const workflowResult = await workflowOrchestrator.runWorkflow(
      projectId,
      namespace,
      [
        {
          name: "Plugin Version Check",
          yamlFile: "plugin-check-job.yaml",
          variables: {
            JOB_NAME: `${projectId}-plugin-check`,
            CONFIG_MAP: resources.configMap,
          },
        },
        {
          name: "Builder",
          yamlFile: "builder-job-main.yaml",
          variables: {
            JOB_NAME: `${projectId}-builder`,
            CONFIG_MAP: resources.configMap,
            PVC_NAME: resources.pvc,
          },
        },
        {
          name: "Volume Copy",
          yamlFile: "volume-copy-job.yaml",
          variables: {
            JOB_NAME: `${projectId}-volume-copy`,
            CONFIG_MAP: resources.configMap,
            PVC_NAME: resources.pvc,
          },
        },
      ],
    );

    res.json({
      success: workflowResult.success,
      message: workflowResult.success
        ? "Validation Workflow completed Successfully"
        : "Validation Workflow ailed",
      projectId,
      resources,
      workflow: workflowResult,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
