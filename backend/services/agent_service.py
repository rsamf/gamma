import anthropic

from backend.config import get_settings
from backend.services.github_service import GitHubService
from backend.services.mlflow_service import MLflowService


class AgentService:
    """LLM-powered agent for code analysis and experiment assistance."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self.client = anthropic.AsyncAnthropic(
            api_key=self.settings.anthropic_api_key
        )
        self.github = GitHubService()
        self.mlflow = MLflowService()

    async def generate_commit_summary(
        self,
        installation_id: int,
        repo_full_name: str,
        commit_sha: str,
    ) -> str:
        """Generate a summary of a commit diff using the LLM."""
        diff = await self.github.get_commit_diff(
            installation_id, repo_full_name, commit_sha
        )

        message = await self.client.messages.create(
            model=self.settings.anthropic_model,
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": (
                        "You are an ML engineering assistant. Summarize the following "
                        "git commit diff concisely, focusing on what changed in the ML "
                        "training code, model architecture, hyperparameters, or data "
                        "processing. Keep it to 2-4 sentences.\n\n"
                        f"Commit: {commit_sha}\n\n"
                        f"```diff\n{diff}\n```"
                    ),
                }
            ],
        )
        return message.content[0].text

    async def chat(
        self,
        messages: list[dict],
        context: str = "",
    ):
        """Stream a chat response from the agent.

        Yields text chunks as they arrive from the LLM.
        """
        system_prompt = (
            "You are Gamma Agent, an AI assistant embedded in an ML development "
            "platform. You help ML engineers understand their code changes, experiment "
            "results, and training metrics. Be concise and technical."
        )
        if context:
            system_prompt += f"\n\nContext:\n{context}"

        async with self.client.messages.stream(
            model=self.settings.anthropic_model,
            max_tokens=2048,
            system=system_prompt,
            messages=messages,
        ) as stream:
            async for text in stream.text_stream:
                yield text

    async def build_context(
        self,
        installation_id: int,
        repo_full_name: str,
        commit_sha: str | None = None,
        mlflow_run_id: str | None = None,
    ) -> str:
        """Assemble context from diff and experiment data for the agent."""
        parts: list[str] = []

        if commit_sha:
            try:
                diff = await self.github.get_commit_diff(
                    installation_id, repo_full_name, commit_sha
                )
                parts.append(f"## Commit Diff ({commit_sha[:8]})\n```diff\n{diff}\n```")
            except Exception:
                parts.append(f"(Could not fetch diff for {commit_sha})")

        if mlflow_run_id:
            try:
                run = await self.mlflow.get_run(mlflow_run_id)
                metrics = run.get("data", {}).get("metrics", [])
                params = run.get("data", {}).get("params", [])
                parts.append("## Experiment Metrics")
                for m in metrics:
                    parts.append(f"- {m['key']}: {m['value']}")
                parts.append("## Hyperparameters")
                for p in params:
                    parts.append(f"- {p['key']}: {p['value']}")
            except Exception:
                parts.append(f"(Could not fetch MLflow run {mlflow_run_id})")

        return "\n\n".join(parts)
