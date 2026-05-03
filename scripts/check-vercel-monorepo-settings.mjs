import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import process from "node:process";

const EXPECTED_ROOT_DIRECTORY = "apps/web";
const execFileAsync = promisify(execFile);

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

async function readLocalProjectConfig() {
  try {
    const configPath = join(process.cwd(), ".vercel", "project.json");
    const rawConfig = await readFile(configPath, "utf8");
    return JSON.parse(rawConfig);
  } catch {
    return {};
  }
}

async function readJsonFile(filePath) {
  const rawConfig = await readFile(filePath, "utf8");
  return JSON.parse(rawConfig);
}

async function git(args, options = {}) {
  const { stdout } = await execFileAsync("git", args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...options.env,
    },
    maxBuffer: 1024 * 1024 * 10,
  });

  return stdout.trim();
}

async function checkSubmoduleAccess() {
  const vercelConfig = await readJsonFile(
    join(process.cwd(), "apps", "web", "vercel.json"),
  );
  const gitDeploymentsDisabled = vercelConfig.git?.deploymentEnabled === false;

  const submoduleTreeEntry = await git(["ls-tree", "HEAD", "vendor/filmtone"]);
  const submoduleSha = submoduleTreeEntry.split(/\s+/)[2];
  const submoduleUrl = await git([
    "config",
    "--file",
    ".gitmodules",
    "--get",
    "submodule.vendor/filmtone.url",
  ]);

  if (submoduleUrl.startsWith("git@")) {
    if (!gitDeploymentsDisabled) {
      fail(
        [
          "Filmtone submodule uses SSH, and Vercel Git auto-deploy is still enabled.",
          `Submodule: vendor/filmtone @ ${submoduleSha}`,
          "Vercel Git builds cannot fetch SSH submodules. Disable Git auto-deploy for this Vercel project and deploy prebuilt output from GitHub Actions instead.",
        ].join("\n"),
      );
    }

    console.log(
      `Filmtone submodule uses SSH at ${submoduleUrl}; Vercel Git auto-deploy is disabled, so GitHub Actions must deploy prebuilt output.`,
    );
    return;
  }

  try {
    await git(["-c", "credential.helper=", "ls-remote", submoduleUrl, "HEAD"], {
      env: {
        GIT_ASKPASS: "/usr/bin/false",
        GIT_TERMINAL_PROMPT: "0",
      },
    });

    console.log(`Filmtone submodule is anonymously fetchable at ${submoduleUrl}`);
    return;
  } catch {
    if (!gitDeploymentsDisabled) {
      fail(
        [
          "Filmtone submodule is not anonymously fetchable, and Vercel Git auto-deploy is still enabled.",
          `Submodule: vendor/filmtone @ ${submoduleSha}`,
          "Vercel Git builds cannot fetch private submodules. Disable Git auto-deploy for this Vercel project and deploy prebuilt output from GitHub Actions instead.",
        ].join("\n"),
      );
    }

    console.log(
      `Filmtone submodule is private at ${submoduleUrl}; Vercel Git auto-deploy is disabled, so GitHub Actions must deploy prebuilt output.`,
    );
  }
}

await checkSubmoduleAccess();

const localProjectConfig = await readLocalProjectConfig();
const projectId = process.env.VERCEL_PROJECT_ID ?? localProjectConfig.projectId;
const teamId = process.env.VERCEL_ORG_ID ?? localProjectConfig.orgId;
const token = process.env.VERCEL_TOKEN;

if (!projectId || !teamId) {
  fail(
    [
      "Missing Vercel project identifiers.",
      "Run `vercel link` from the repository root, or set `VERCEL_PROJECT_ID` and `VERCEL_ORG_ID`.",
    ].join("\n"),
    2,
  );
}

if (!token) {
  fail(
    [
      "Missing `VERCEL_TOKEN`; cannot verify remote project settings.",
      "Run with `VERCEL_TOKEN=... bun run verify:vercel-settings`.",
    ].join("\n"),
    2,
  );
}

const projectUrl = new URL(
  `https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}`,
);
projectUrl.searchParams.set("teamId", teamId);

const response = await fetch(projectUrl, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

if (!response.ok) {
  const errorText = await response.text();
  fail(
    [
      `Vercel project settings request failed: ${response.status} ${response.statusText}`,
      errorText.slice(0, 500),
    ].join("\n"),
  );
}

const project = await response.json();
const checks = [
  {
    label: "rootDirectory",
    actual: project.rootDirectory,
    expected: EXPECTED_ROOT_DIRECTORY,
    pass: project.rootDirectory === EXPECTED_ROOT_DIRECTORY,
  },
  {
    label: "sourceFilesOutsideRootDirectory",
    actual: project.sourceFilesOutsideRootDirectory,
    expected: true,
    pass: project.sourceFilesOutsideRootDirectory === true,
  },
];

const failures = checks.filter((check) => !check.pass);

if (failures.length > 0) {
  const details = failures
    .map(
      (check) =>
        `- ${check.label}: expected ${JSON.stringify(check.expected)}, got ${JSON.stringify(check.actual)}`,
    )
    .join("\n");

  fail(
    [
      "Vercel monorepo settings are not ready for workspace dependencies.",
      details,
      "",
      "Fix in Vercel Dashboard:",
      "- Project Settings -> Build and Deployment -> Root Directory",
      `- Root Directory: ${EXPECTED_ROOT_DIRECTORY}`,
      "- Enable: Include source files outside of the Root Directory in the Build Step",
      "",
      "API equivalent:",
      `curl -X PATCH "https://api.vercel.com/v9/projects/$VERCEL_PROJECT_ID?teamId=$VERCEL_ORG_ID" \\`,
      '  -H "Authorization: Bearer $VERCEL_TOKEN" \\',
      '  -H "Content-Type: application/json" \\',
      `  -d '{"rootDirectory":"${EXPECTED_ROOT_DIRECTORY}","sourceFilesOutsideRootDirectory":true}'`,
    ].join("\n"),
  );
}

console.log(
  `Vercel monorepo settings OK: rootDirectory=${project.rootDirectory}, sourceFilesOutsideRootDirectory=${project.sourceFilesOutsideRootDirectory}`,
);
