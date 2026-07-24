import { execSync } from "child_process"

const SCRIPT = "bash scripts/notify.sh 'Guess the Words'"

export default async () => {
  return {
    "tool.execute.after": async (input: any, output: any) => {
      const toolName = input?.name || input?.tool || ""
      if (toolName === "task") {
        execSync(`${SCRIPT} 'Subtask completed'`, { stdio: "ignore" })
      }
    },

    "tool.execute.before": async (input: any, _output: any) => {
      const toolName = input?.name || input?.tool || ""
      if (toolName === "question") {
        execSync(`${SCRIPT} 'Question for you'`, { stdio: "ignore" })
      }
    },
  }
}
