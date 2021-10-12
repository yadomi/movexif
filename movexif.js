const { basename, sep, join, resolve, dirname, relative, extname } = require("path");
const chalk = require("chalk");
const { existsSync } = require("fs");
const fg = require("fast-glob");
const exif = require("fast-exif");
const format = require("date-fns/format");
const { copy, move, mkdirp } = require("fs-extra");
const { compose, tail, chain, identity, countBy, reject, isEmpty, sum, values } = require("ramda");

const [, bin, ...args] = process.argv;

const defaultOptions = {
  pattern: "d(yyyy)/d(yyyy-MM)/d(yyyy-MM-dd)/d(yyyy-MM-dd_H-mm-ss)",
  overwrite: false,
};

function usage() {
  const help = chalk`Usage: ${basename(bin)} {bold <source> <dest>} [OPTIONS]

  OPTIONS:
    -p <pattern>\tPattern used to determine how to move files in <dest> {bold (default: ${defaultOptions.pattern})}
    --copy, -c\t\tCopy files instead of moving them
    --overwrite\t\tOverwrite files if destination is not empty, ignored otherwise.    
    --dry-run\t\tDry run, just show what's gonna happen
    --help\t\tShow this help`;
  console.log(help);
}

if (args.includes("--help")) {
  usage();
  return process.exit();
}

function validatePattern(pattern) {
  return; // TODO: Actually do something :upside_down:
}

function getOptions(args) {
  const options = {};

  const [source, dest] = args;
  if (source && dest) {
    options.source = source;
    options.dest = dest;
  } else {
    usage();
    console.log(`\nError: Missing either <source> or <dest>`);
    return process.exit(2);
  }

  if (args.includes("-p")) {
    const index = args.indexOf("-p");
    const pattern = args[index + 1];

    if (!pattern) {
      usage();
      console.log(`\nError: Got option -p but is empty`);
      return process.exit(2);
    }

    if (validatePattern(pattern)) {
      usage();
      console.log(`\nError: Unrecognized pattern or invalid format`);
      return process.exit(2);
    }

    options.pattern = pattern;
  }

  if (args.includes("--copy") || args.includes("-c")) {
    options.copy = true;
  }

  if (args.includes("--dry-run")) {
    options.dry = true;
  }

  if (args.includes("--overwrite")) {
    options.overwrite = true;
  }

  return {
    ...defaultOptions,
    ...options,
  };
}

function checkDirExist(dir) {
  if (!existsSync(dir)) {
    usage();
    console.log(`\nError: ${dir}: No such file of directory`);
    return process.exit(2);
  }
}

function replaceDates(pattern, metadata) {
  const re = /d\(.*?\)/g;

  return (pattern.match(re) || []).reduce((sum, match) => {
    const datetime = metadata.DateTimeOriginal || metadata.DateTimeDigitized; // TODO: chosing which date could be an option
    if (!datetime) return "unknown";

    const date = new Date(datetime);

    const fmt = match.substring(2, match.length - 1); // removes d()
    sum = sum.replace(match, format(date, fmt));

    return sum;
  }, pattern);
}

function replaceMetadata(pattern, metadata) {
  const re = /(?<key><.*?>)/g;
  return (pattern.match(re) || []).reduce((sum, match) => {
    const key = match.substring(1, match.length - 1);
    sum = sum.replace(match, metadata[key] || "unknown");

    return sum;
  }, pattern);
}

function createPathFromPattern(pattern) {
  return (exif) => {
    const metadata = {
      ...exif.image,
      ...exif.exif,
    };

    return replaceMetadata(replaceDates(pattern, metadata), metadata);
  };
}

const countColision = compose(
  reject((v) => v <= 1),
  countBy(identity),
  chain(tail)
);

async function main() {
  const options = getOptions(args);

  checkDirExist(options.source);
  checkDirExist(options.dest);

  //TODO: Handle more than this (heic, png ect...,). Also camel case ect
  const stream = fg.stream(["**/*.jpg", "**/*.jpeg"], {
    caseSensitiveMatch: false,
    cwd: options.source,
    absolute: true,
    suppressErrors: true,
  });

  const createPath = createPathFromPattern(options.pattern);

  const files = [];
  for await (const source of stream) {
    let metadata;
    try {
      metadata = await exif.read(source);
    } catch (e) {} // TOOD: probably should do something here

    if (!metadata) continue;

    const partial = join(resolve(options.dest), createPath(metadata));
    const dest = options.pattern.endsWith("/")
      ? partial.concat(basename(source))
      : partial.concat(extname(source).toLowerCase());

    files.push([source, dest]);
  }

  const colision = countColision(files);

  const action = options.copy ? copy : move;
  for (const [source, dest] of files) {
    const color = colision[dest] ? "red" : "green";
    console.log(`${relative(process.cwd(), source)} ->  ${chalk[color](relative(process.cwd(), dest))}`);

    if (options.dry) continue;
    if (colision[dest]) continue;

    try {
      await mkdirp(dirname(dest));
      await action(source, dest, {
        overwrite: options.overwrite,
      });
    } catch (e) {
      console.error(e);
    }

    console.log(`${options.copy ? "Copied" : "Moved"} ${source} to ${dest}`);
  }

  if (!isEmpty(colision)) {
    console.log(
      chalk.yellow("\nWarning: Some files use the same file path. Colision will happen and data will be lost !")
    );
    console.log(chalk.yellow(`${compose(sum, values)(colision)} files will be lost (out of ${files.length}).`));
  }

  if (options.dry) {
    console.log("\nRunning with --dry-run, no data has been moved.");
  }
}

main();
