resource "aws_lambda_function" "simulation_cleanup" {
  filename         = "${path.module}/lambdas/simulation-cleanup.zip"
  function_name    = ""
  role             = data.aws_iam_role.lambda.arn
  handler          = "simulation-cleanup.handler"
  source_code_hash = data.archive_file.simulation_cleanup.output_base64sha256
  runtime          = "nodejs22.x"
  timeout          = 60
  memory_size      = 256

  environment {
    variables = {
      SIMULATION_BUCKET = aws_s3_bucket.simulation_bucket.bucket
    }
  }
}

data "archive_file" "simulation_cleanup" {
  type        = "zip"
  source_file = "${path.module}/lambdas/simulation-cleanup.js"
  output_path = "${path.module}/lambdas/simulation-cleanup.zip"
}

resource "aws_s3_bucket_notification" "render_complete" {
  bucket = aws_s3_bucket.render_bucket.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.simulation_cleanup.arn
    events              = ["s3:ObjectCreated:*"]
    filter_suffix       = ".png"
  }

  depends_on = [aws_lambda_permission.allow_s3_invoke]
}

resource "aws_lambda_permission" "allow_s3_invoke" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.simulation_cleanup.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.render_bucket.arn
}
