resource "aws_sqs_queue" "render_jobs" {
  name                       = ""
  delay_seconds              = 0
  max_message_size           = 4096 //274 bytes
  receive_wait_time_seconds  = 10
  visibility_timeout_seconds = 300

  # DLQ
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.render_jobs_dlq.arn
    maxReceiveCount     = 3
  })
}

# Dead letter queue for failed jobs
resource "aws_sqs_queue" "render_jobs_dlq" {
  name                      = ""
  delay_seconds             = 0
  max_message_size          = 4096
  message_retention_seconds = 86400 # 1 day
}

output "render_jobs_queue_url" {
  value = aws_sqs_queue.render_jobs.url
}

output "render_jobs_dlq_url" {
  value = aws_sqs_queue.render_jobs_dlq.url
}
