export function isCompletionMode(): boolean {
  return (
    process.env.YARGS_COMPLETION === "1" ||
    process.argv.includes("--get-yargs-completions") ||
    process.env.HRVST_COMPLETION === "1"
  );
}
