import * as fs from "fs";
import * as yaml from "js-yaml";
import * as path from "path";

class YamlLoader {
  private manifestsDir: string;

  constructor() {
    this.manifestsDir = path.join(__dirname, "../manifests");
  }

  loadManifest<T = any>(filename: string): T {
    try {
      const filePath = path.join(this.manifestsDir, filename);
      const fileContent = fs.readFileSync(filePath, "utf8");
      return yaml.load(fileContent) as T;
    } catch (error) {
      throw new Error(`Failed to load manifest ${filename}: ${error}`);
    }
  }

  loadManifestWithVariables<T = any>(
    filename: string,
    variables: Record<string, string>,
  ): T {
    try {
      const filePath = path.join(this.manifestsDir, filename);
      let fileContent = fs.readFileSync(filePath, "utf8");

      // Replace variables like {{VAR_NAME}}
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        fileContent = fileContent.replace(regex, value);
      });

      return yaml.load(fileContent) as T;
    } catch (error) {
      throw new Error(`Failed to load manifest ${filename}: ${error}`);
    }
  }

  listManifests(): string[] {
    try {
      return fs
        .readdirSync(this.manifestsDir)
        .filter((file) => file.endsWith(".yaml") || file.endsWith(".yml"));
    } catch (error) {
      return [];
    }
  }
}

export default new YamlLoader();
