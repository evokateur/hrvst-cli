import fs from "fs";
import ospath from "ospath";
import path from "path";

export interface Config {
  accessToken: string;
  accountId: string;
  accountConfig: Record<string, AccountConfig>;
}

export interface AccountConfig {
  aliases: Record<string, Alias>;
}

export interface Alias {
  projectId: number;
  taskId: number;
}

interface CredentialsConfig {
  accessToken: string;
  accountId: string;
}

export class ConfigNotFoundError extends Error {}

async function credentialsPath(): Promise<string> {
  const dir = path.join(ospath.home(), ".hrvst");

  if (!fs.existsSync(dir)) {
    await fs.promises.mkdir(dir);
  }

  return path.join(dir, "credentials.json");
}

async function getCredentials(): Promise<CredentialsConfig> {
  const data = await fs.promises.readFile(await credentialsPath(), "utf-8");
  return JSON.parse(data);
}

async function saveCredentials(credentials: Partial<CredentialsConfig>): Promise<void> {
  try {
    const existing = await getCredentials();
    await fs.promises.writeFile(
      await credentialsPath(),
      JSON.stringify({ ...existing, ...credentials }),
    );
  } catch {
    await fs.promises.writeFile(
      await credentialsPath(),
      JSON.stringify(credentials),
    );
  }
}

export async function getConfig(): Promise<Config> {
  try {
    const [credentials, configData] = await Promise.all([
      getCredentials(),
      fs.promises.readFile(await configPath(), "utf-8").catch(() => "{}"),
    ]);

    const parsedConfig = JSON.parse(configData);

    const { accessToken, accountId, ...restConfig } = parsedConfig;

    return {
      accessToken: credentials.accessToken,
      accountId: credentials.accountId,
      ...restConfig,
    };
  } catch (error) {
    throw new ConfigNotFoundError();
  }
}

export async function saveConfig(config: Partial<Config>): Promise<void> {
  const { accessToken, accountId, ...rest } = config;

  if (accessToken !== undefined || accountId !== undefined) {
    await saveCredentials({ accessToken, accountId });
  }

  try {
    const existing = await getConfig();
    const { accessToken, accountId, ...existingRest } = existing;
    await fs.promises.writeFile(
      await configPath(),
      JSON.stringify({ ...existingRest, ...rest }),
    );
  } catch {
    await fs.promises.writeFile(
      await configPath(),
      JSON.stringify(rest),
    );
  }
}

async function configPath(): Promise<string> {
  const dir = path.join(ospath.home(), ".hrvst");

  if (!fs.existsSync(dir)) {
    await fs.promises.mkdir(dir);
  }

  return path.join(dir, "config.json");
}
