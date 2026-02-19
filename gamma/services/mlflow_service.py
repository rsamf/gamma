import httpx

from gamma.config import get_settings


class MLflowService:
    """Client for the MLflow Tracking Server REST API."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self.base_url = self.settings.mlflow_tracking_uri

    async def _get(self, path: str, params: dict | None = None) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/api/2.0/mlflow{path}", params=params
            )
            resp.raise_for_status()
            return resp.json()

    async def search_experiments(self, filter_string: str = "") -> list[dict]:
        """Search MLflow experiments."""
        params = {}
        if filter_string:
            params["filter"] = filter_string
        data = await self._get("/experiments/search", params)
        return data.get("experiments", [])

    async def get_experiment_by_name(self, name: str) -> dict | None:
        """Get an experiment by name."""
        data = await self._get("/experiments/get-by-name", {"experiment_name": name})
        return data.get("experiment")

    async def search_runs(
        self,
        experiment_ids: list[str],
        filter_string: str = "",
        max_results: int = 100,
        order_by: list[str] | None = None,
    ) -> list[dict]:
        """Search runs within experiments."""
        async with httpx.AsyncClient() as client:
            body: dict = {
                "experiment_ids": experiment_ids,
                "max_results": max_results,
            }
            if filter_string:
                body["filter"] = filter_string
            if order_by:
                body["order_by"] = order_by
            resp = await client.post(
                f"{self.base_url}/api/2.0/mlflow/runs/search", json=body
            )
            resp.raise_for_status()
            return resp.json().get("runs", [])

    async def get_run(self, run_id: str) -> dict:
        """Get a specific run by ID."""
        data = await self._get("/runs/get", {"run_id": run_id})
        return data["run"]

    async def get_metric_history(
        self, run_id: str, metric_key: str
    ) -> list[dict]:
        """Get the full history of a metric for a run."""
        data = await self._get(
            "/metrics/get-history",
            {"run_id": run_id, "metric_key": metric_key},
        )
        return data.get("metrics", [])

    async def list_artifacts(
        self, run_id: str, path: str = ""
    ) -> list[dict]:
        """List artifacts for a run."""
        params: dict = {"run_id": run_id}
        if path:
            params["path"] = path
        data = await self._get("/artifacts/list", params)
        return data.get("files", [])
