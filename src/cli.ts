#!/usr/bin/env node

import chalk from "chalk";
import yargs, { Arguments, CommandModule } from "yargs";
import { hideBin } from "yargs/helpers";
import { getAliasNames } from "./utils/config";
import { failHandler } from "./utils/error";
import updateNotifier from "./utils/update-notifier";
import { commands } from "./commands";
import { commands as generatedCommands } from "./generated-commands";

const shouldSkipUpdateNotifier =
  process.argv.includes("--get-yargs-completions") ||
  process.argv.includes("completion");

if (!shouldSkipUpdateNotifier) {
  updateNotifier();
}

const getCompletionCommandPath = (
  completionArguments: Arguments,
): string[] => {
  const commandPath = completionArguments._.map((argument) =>
    String(argument),
  );
  const commandPrefix = completionArguments.$0
    ? String(completionArguments.$0)
    : "";
  const commandNamesToStrip = new Set([commandPrefix, "hrvst"]);

  if (commandNamesToStrip.has(commandPath[0])) {
    return commandPath.slice(1);
  }

  return commandPath;
};

const getNormalizedCurrentWord = (currentWord: string): string => {
  const completionLine = process.env.COMP_LINE;
  const completionPoint = process.env.COMP_POINT
    ? Number(process.env.COMP_POINT)
    : Number.NaN;

  if (
    completionLine &&
    Number.isFinite(completionPoint) &&
    completionPoint === completionLine.length &&
    completionLine.endsWith(" ")
  ) {
    return "";
  }

  return currentWord || "";
};

const shouldCompleteAlias = (
  currentWord: string,
  completionArguments: Arguments,
): boolean => {
  const normalizedCurrentWord = getNormalizedCurrentWord(currentWord);

  if (normalizedCurrentWord.startsWith("-")) {
    return false;
  }

  const commandPath = getCompletionCommandPath(completionArguments);

  if (commandPath[0] === "start") {
    if (commandPath.length === 1 && normalizedCurrentWord === "start") {
      return false;
    }

    if (commandPath.length === 1) {
      return true;
    }

    return commandPath.length === 2 && normalizedCurrentWord.length > 0;
  }

  if (commandPath[0] === "log") {
    if (commandPath.length === 1 && normalizedCurrentWord === "log") {
      return false;
    }

    if (commandPath.length === 2) {
      return true;
    }

    return commandPath.length === 3 && normalizedCurrentWord.length > 0;
  }

  if (commandPath[0] === "alias" && commandPath[1] === "delete") {
    if (commandPath.length === 2 && normalizedCurrentWord === "delete") {
      return false;
    }

    if (commandPath.length === 2) {
      return true;
    }

    return commandPath.length === 3 && normalizedCurrentWord.length > 0;
  }

  return false;
};

yargs(hideBin(process.argv))
  .scriptName("hrvst")
  .command([...(commands as CommandModule[]), ...generatedCommands])
  .demandCommand()
  .recommendCommands()
  .strictCommands()
  .completion(
    "completion",
    "Generate shell completion script",
    (currentWord, completionArguments, defaultCompletion, done) => {
      const normalizedCurrentWord = getNormalizedCurrentWord(currentWord);
      if (!shouldCompleteAlias(currentWord, completionArguments)) {
        done([]);
        return;
      }

      void getAliasNames().then((aliasNames) => {
        const matchingAliases = aliasNames.filter((aliasName) =>
          aliasName.startsWith(normalizedCurrentWord),
        );
        done(matchingAliases);
      });
    },
  )
  .help()
  .epilogue(
    chalk.gray(
      "For more information, see: https://kgajera.github.io/hrvst-cli\n",
    ),
  )
  .fail(failHandler).argv;
