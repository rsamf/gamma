import boto3

from gamma.config import get_settings


class SageMakerService:
    """Service for querying SageMaker training job status."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self.client = boto3.client(
            "sagemaker", region_name=self.settings.aws_region
        )

    def get_training_job(self, job_name: str) -> dict:
        """Get details of a SageMaker training job."""
        response = self.client.describe_training_job(TrainingJobName=job_name)
        return {
            "job_name": response["TrainingJobName"],
            "status": response["TrainingJobStatus"],
            "secondary_status": response.get("SecondaryStatus", ""),
            "creation_time": response["CreationTime"].isoformat(),
            "training_start_time": (
                response["TrainingStartTime"].isoformat()
                if "TrainingStartTime" in response
                else None
            ),
            "training_end_time": (
                response["TrainingEndTime"].isoformat()
                if "TrainingEndTime" in response
                else None
            ),
            "failure_reason": response.get("FailureReason", ""),
            "billable_seconds": response.get("BillableTimeInSeconds"),
            "instance_type": response["ResourceConfig"]["InstanceType"],
            "instance_count": response["ResourceConfig"]["InstanceCount"],
            "output_path": response.get("OutputDataConfig", {}).get(
                "S3OutputPath", ""
            ),
        }

    def list_training_jobs(
        self, name_contains: str = "", max_results: int = 50
    ) -> list[dict]:
        """List SageMaker training jobs, optionally filtered by name."""
        params: dict = {
            "MaxResults": max_results,
            "SortBy": "CreationTime",
            "SortOrder": "Descending",
        }
        if name_contains:
            params["NameContains"] = name_contains

        response = self.client.list_training_jobs(**params)
        return [
            {
                "job_name": job["TrainingJobName"],
                "status": job["TrainingJobStatus"],
                "creation_time": job["CreationTime"].isoformat(),
            }
            for job in response.get("TrainingJobSummaries", [])
        ]
