from fastapi import APIRouter, HTTPException

from gamma.services.mlflow_service import MLflowService

router = APIRouter(prefix="/experiments", tags=["experiments"])


@router.get("")
async def list_experiments():
    """List all MLflow experiments."""
    mlflow = MLflowService()
    return await mlflow.search_experiments()


@router.get("/{experiment_name}/runs")
async def list_runs(
    experiment_name: str,
    filter_string: str = "",
    max_results: int = 100,
):
    """List runs for an experiment by name."""
    mlflow = MLflowService()
    experiment = await mlflow.get_experiment_by_name(experiment_name)
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")

    runs = await mlflow.search_runs(
        experiment_ids=[experiment["experiment_id"]],
        filter_string=filter_string,
        max_results=max_results,
        order_by=["start_time DESC"],
    )
    return runs


@router.get("/runs/{run_id}")
async def get_run(run_id: str):
    """Get details of a specific MLflow run."""
    mlflow = MLflowService()
    return await mlflow.get_run(run_id)


@router.get("/runs/{run_id}/metrics/{metric_key}")
async def get_metric_history(run_id: str, metric_key: str):
    """Get the full history of a metric for a run."""
    mlflow = MLflowService()
    return await mlflow.get_metric_history(run_id, metric_key)


@router.get("/runs/{run_id}/artifacts")
async def list_run_artifacts(run_id: str, path: str = ""):
    """List artifacts for a run."""
    mlflow = MLflowService()
    return await mlflow.list_artifacts(run_id, path)
