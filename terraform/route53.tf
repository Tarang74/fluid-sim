# # Route53 record pointing to CloudFront distribution for static asset edge caching
# resource "aws_route53_record" "web" {
#   zone_id = ""
#   name    = ""
#   type    = "AAAA"
#
#   alias {
#     name                   = aws_cloudfront_distribution.static_assets.domain_name
#     zone_id                = aws_cloudfront_distribution.static_assets.hosted_zone_id
#     evaluate_target_health = false
#   }
#
#   allow_overwrite = true
# }
#
