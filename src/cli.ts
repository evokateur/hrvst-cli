#!/usr/bin/env node

import chalk from "chalk";
import yargs, { Arguments, CommandModule } from "yargs";
import { hideBin } from "yargs/helpers";
import { getAliasNames } from "./utils/config";
import { failHandler } from "./utils/error";
import { isCompletionMode } from "./utils/runtime";
import updateNotifier from "./utils/update-notifier";
import { commands } from "./commands";
import { commands as generatedCommands } from "./generated-commands";

if (!isCompletionMode()) {
  updateNotifier();
}

const shouldCompleteAlias = (
  current: string,
  argv: Arguments,
): boolean => {

  if (argv._[1] === "start" && argv._.length === 3) {
    return true;
  }

  if ( argv._[1] === "log" && !isNaN(Number(argv._[2])) && argv._.length === 4) {
    return true;
  }

  if (argv._[1] === "alias" && argv._[2] === "delete" && argv._.length === 4) {
    return true;
  }

  return false;
};

yargs(hideBin(process.argv))
  .command([...(commands as CommandModule[]), ...generatedCommands])
  .demandCommand()
  .recommendCommands()
  .strictCommands()
  .completion(
    "completion",
    "Generate shell completion script",
    (current, argv, completionFilter, done) => {
      require('fs').appendFileSync('/tmp/completion.log', 'argv: ' + JSON.stringify(argv) + '\n');
      require('fs').appendFileSync('/tmp/completion.log', 'current: ' + JSON.stringify(current) + '\n');
      if (shouldCompleteAlias(current, argv)) {
        void getAliasNames().then((aliasNames) => {
          const matchingAliases = aliasNames.filter((aliasName) =>
            aliasName.startsWith(current),
          );
          done(matchingAliases);
        });
      } else {
        return completionFilter();
      }
    },
  )
  .help()
  .epilogue(
    chalk.gray(
      "For more information, see: https://kgajera.github.io/hrvst-cli\n",
    ),
  )
  .fail(failHandler).argv;
