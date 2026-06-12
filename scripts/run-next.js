import { spawn } from "child_process";

const command = process.argv[2] || "dev";
const rawArgs = process.argv.slice(3);

const args = [];
for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i];
  if (arg === "--host") {
    args.push("-H");
    if (rawArgs[i + 1] && !rawArgs[i + 1].startsWith("-")) {
      args.push(rawArgs[i + 1]);
      i++;
    } else {
      args.push("0.0.0.0");
    }
  } else if (arg.startsWith("--host=")) {
    const val = arg.split("=")[1];
    args.push("-H", val || "0.0.0.0");
  } else if (arg === "--port" || arg === "-p") {
    args.push("-p");
    if (rawArgs[i + 1]) {
      args.push(rawArgs[i + 1]);
      i++;
    }
  } else {
    args.push(arg);
  }
}

// Default port to 3000 if not specified
if (!args.includes("-p") && !args.includes("--port")) {
  args.push("-p", "3000");
}

// Default hostname to 0.0.0.0 if not specified
if (!args.includes("-H") && !args.includes("--hostname")) {
  args.push("-H", "0.0.0.0");
}

console.log(`[run-next] Forwarding args to: npx next ${command} ${args.join(" ")}`);

const child = spawn("npx", ["next", command, ...args], {
  stdio: "inherit",
  shell: true,
});

child.on("close", (code) => {
  process.exit(code || 0);
});
