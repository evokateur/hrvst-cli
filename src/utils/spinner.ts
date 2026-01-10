import ora, { Options } from "ora";
import { inCompletionMode } from "./runtime.js";

/**
 * Display spinner while the `worker` function is executing
 *
 * @param worker Function to execute
 * @param options Spinner options
 * @returns Value returned by `worker`
 */
export default async function <T>(
  worker: () => Promise<T>,
  options: Options = {},
): Promise<T> {
  if (inCompletionMode()) {
    return await worker();
  }
  const spinner = ora({
    color: "yellow",
    ...options,
  });
  spinner.start();

  try {
    return await worker();
  } finally {
    spinner.stop();
  }
}
