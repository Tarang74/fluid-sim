resource "aws_s3_bucket" "render_bucket" {
  bucket        = ""
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "render_bucket" {
  bucket = aws_s3_bucket.render_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "render_bucket" {
  bucket = aws_s3_bucket.render_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket" "simulation_bucket" {
  bucket        = ""
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "simulation_bucket" {
  bucket = aws_s3_bucket.simulation_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "simulation_bucket" {
  bucket = aws_s3_bucket.simulation_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket" "static_assets" {
  bucket        = ""
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  versioning_configuration {
    status = "Enabled"
  }
}

# CloudFront Origin Access Identity for S3
resource "aws_cloudfront_origin_access_identity" "static_assets" {
  comment = "OAI for static assets bucket"
}

# S3 bucket policy
resource "aws_s3_bucket_policy" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # {
      #   Sid    = "AllowCloudFrontServicePrincipal"
      #   Effect = "Allow"
      #   Principal = {
      #     Service = "cloudfront.amazonaws.com"
      #   }
      #   Action   = "s3:GetObject"
      #   Resource = "${aws_s3_bucket.static_assets.arn}/*"
      #   Condition = {
      #     StringEquals = {
      #       "AWS:SourceArn" = aws_cloudfront_distribution.static_assets.arn
      #     }
      #   }
      # }
      {
        Sid    = "AllowCloudFrontOAI"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.static_assets.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.static_assets.arn}/*"
      }
    ]
  })
}

# Upload static assets
locals {
  static_files = fileset("${path.module}/../app/web/dist", "**/*.{html,js,css,png,wasm}")
}

resource "aws_s3_object" "static_files" {
  for_each = local.static_files

  bucket = aws_s3_bucket.static_assets.id
  key    = each.value
  source = "${path.module}/../app/web/dist/${each.value}"
  content_type = lookup({
    "html" = "text/html"
    "js"   = "application/javascript"
    "css"  = "text/css"
    "png"  = "image/png"
    "wasm" = "application/wasm"
  }, regex("\\.(\\w+)$", each.value)[0], "application/octet-stream")

  etag = filemd5("${path.module}/../app/web/dist/${each.value}")
}
