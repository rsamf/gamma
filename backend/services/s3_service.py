import boto3
from botocore.config import Config

from backend.config import get_settings


class S3Service:
    """Service for S3 artifact and checkpoint operations."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self.client = boto3.client(
            "s3",
            region_name=self.settings.aws_region,
            config=Config(signature_version="s3v4"),
        )

    def list_objects(
        self, bucket: str, prefix: str = "", max_keys: int = 1000
    ) -> list[dict]:
        """List objects in an S3 bucket under a prefix."""
        params: dict = {"Bucket": bucket, "MaxKeys": max_keys}
        if prefix:
            params["Prefix"] = prefix

        response = self.client.list_objects_v2(**params)
        objects = []
        for obj in response.get("Contents", []):
            objects.append(
                {
                    "key": obj["Key"],
                    "size": obj["Size"],
                    "last_modified": obj["LastModified"].isoformat(),
                    "etag": obj["ETag"],
                }
            )
        return objects

    def generate_presigned_url(
        self, bucket: str, key: str, expiration: int = 3600
    ) -> str:
        """Generate a presigned download URL for an S3 object."""
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=expiration,
        )

    def get_object_metadata(self, bucket: str, key: str) -> dict:
        """Get metadata for a specific S3 object."""
        response = self.client.head_object(Bucket=bucket, Key=key)
        return {
            "key": key,
            "size": response["ContentLength"],
            "last_modified": response["LastModified"].isoformat(),
            "content_type": response.get("ContentType", ""),
            "metadata": response.get("Metadata", {}),
        }
