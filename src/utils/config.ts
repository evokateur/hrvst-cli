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

interface SessionConfig {
  accessToken: string;
  accountId: string;
}

export class ConfigNotFoundError extends Error {}

async function sessionPath(): Promise<string> {
  const dir = path.join(ospath.home(), ".hrvst");

  if (!fs.existsSync(dir)) {
    await fs.promises.mkdir(dir);
  }

  return path.join(dir, "session.json");
}

async function readSessionFile(): Promise<SessionConfig> {
  const data = await fs.promises.readFile(await sessionPath(), "utf-8");
  return JSON.parse(data);
}

async function writeSessionFile(session: Partial<SessionConfig>): Promise<void> {
  try {
    const existing = await readSessionFile();
    await fs.promises.writeFile(
      await sessionPath(),
      JSON.stringify({ ...existing, ...session }),
    );
  } catch {
    await fs.promises.writeFile(
      await sessionPath(),
      JSON.stringify(session),
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

async function readConfigFile(): Promise<any> {
  const data = await fs.promises.readFile(await configPath(), "utf-8").catch(() => "{}");
  return JSON.parse(data);
}

async function writeConfigFile(config: any): Promise<void> {
  await fs.promises.writeFile(
    await configPath(),
    JSON.stringify(config),
  );
}

export async function getConfig(): Promise<Config> {
  try {
    const [session, parsedConfig] = await Promise.all([
      readSessionFile(),
      readConfigFile(),
    ]);

    const { accessToken, accountId, ...restConfig } = parsedConfig;

    return {
      accessToken: session.accessToken,
      accountId: session.accountId,
      ...restConfig,
    };
  } catch (error) {
    throw new ConfigNotFoundError();
  }
}

export async function saveConfig(config: Partial<Config>): Promise<void> {
  const { accessToken, accountId, ...rest } = config;

  if (accessToken !== undefined || accountId !== undefined) {
    await writeSessionFile({ accessToken, accountId });
  }

  try {
    const existing = await getConfig();
    const { accessToken, accountId, ...existingRest } = existing;
    await writeConfigFile({ ...existingRest, ...rest });
  } catch {
    await writeConfigFile(rest);
  }
}
