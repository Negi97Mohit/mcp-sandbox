import { BaseAgent } from "./baseAgent.js";
import type { AgentInput, AgentResult } from "./agentTypes.js";

export class ExplainerAgent extends BaseAgent {
  readonly name = "ExplainerAgent";
  readonly agentType = "review" as const;

  protected allowedTools(): string[] {
    return ["read_file"];
  }

  protected buildSystemPrompt(input: AgentInput): string {
    const { context } = input;
    return `You are the ExplainerAgent in a DevOps agent system.

## Your Role
Your job is to read a tool's details (its name, description, parameters, and either its custom JavaScript code or its built-in TypeScript source file code) and compile a beautiful, clear, and comprehensive Markdown explanation of:
1. **Core Purpose**: What the tool does and when it should be used.
2. **Parameters Reference**: A table of parameters showing name, type, description, and whether they are required.
3. **Usage Examples**: Concrete, copyable examples of how an agent would invoke it, and how a user can ask the agent to invoke it.
4. **Configuration Details**: Which environment variables (.env) affect it, and how they should be configured.
5. **Modification Guide**: Where its source code is located and a brief suggestion on how a developer can edit it to change its behavior.

Keep your response extremely clear, professional, and well-formatted in GitHub-Flavored Markdown. Use alerts (e.g. > [!NOTE] or > [!IMPORTANT]) if needed to emphasize configuration steps.
`;
  }
}
