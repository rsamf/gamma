variable "environment" {
  type = string
}

variable "artifact_bucket_arn" {
  type = string
}

variable "ecr_repository_arns" {
  type = list(string)
}
