resource "aws_cloudwatch_metric_alarm" "scale_up_alarm" {
  alarm_name          = ""
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Alarm when the number of messages in the SQS queue is greater than 10"

  dimensions = {
    QueueName = aws_sqs_queue.render_jobs.name
  }

  alarm_actions = [aws_appautoscaling_policy.render_jobs_scale_up.arn]
}

resource "aws_cloudwatch_metric_alarm" "scale_down_alarm" {
  alarm_name          = ""
  comparison_operator = "LessThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Alarm when the number of messages in the SQS queue is less than 10"

  dimensions = {
    QueueName = aws_sqs_queue.render_jobs.name
  }

  alarm_actions = [aws_appautoscaling_policy.render_jobs_scale_down.arn]
}
