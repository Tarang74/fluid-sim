# S3_SIMULATION_BUCKET
resource "aws_ssm_parameter" "s3_simulation_bucket" {
  name  = ""
  type  = "String"
  value = aws_s3_bucket.simulation_bucket.id
}

# S3_RENDER_BUCKET
resource "aws_ssm_parameter" "s3_render_bucket" {
  name  = ""
  type  = "String"
  value = aws_s3_bucket.render_bucket.id
}

# SQS_RENDER_JOBS_URL
resource "aws_ssm_parameter" "sqs_render_jobs_url" {
  name  = ""
  type  = "String"
  value = aws_sqs_queue.render_jobs.url
}

# SQS_RENDER_JOBS_DLQ_URL
resource "aws_ssm_parameter" "sqs_render_jobs_dlq_url" {
  name  = ""
  type  = "String"
  value = aws_sqs_queue.render_jobs_dlq.url
}

# BLENDER_PATH
resource "aws_ssm_parameter" "blender_path" {
  name  = ""
  type  = "String"
  value = "/usr/bin/blender"
}

# COGNITO_USER_POOL_DOMAIN
resource "aws_ssm_parameter" "cognito_user_pool_domain" {
  name  = ""
  type  = "String"
  value = aws_cognito_user_pool_domain.domain.domain
}
