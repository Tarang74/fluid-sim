resource "aws_acm_certificate" "web" {
  domain_name       = var.domain_name
  validation_method = "DNS"
}

# # DNS validation record
# resource "aws_route53_record" "web_certificate_validation" {
#   for_each = {
#     for dvo in aws_acm_certificate.web.domain_validation_options : dvo.domain_name => {
#       name   = dvo.resource_record_name
#       record = dvo.resource_record_value
#       type   = dvo.resource_record_type
#     }
#   }
#
#   allow_overwrite = true
#   name            = each.value.name
#   records         = [each.value.record]
#   ttl             = 60
#   type            = each.value.type
#   zone_id         = ""
# }
#
# # Wait for certificate to be issued
# resource "aws_acm_certificate_validation" "web" {
#   certificate_arn         = aws_acm_certificate.web.arn
#   validation_record_fqdns = [for record in aws_route53_record.web_certificate_validation : record.fqdn]
# }

resource "aws_acm_certificate" "cloudfront" {
  region            = "us-east-1"
  domain_name       = var.domain_name
  validation_method = "DNS"
}

# # DNS validation for CloudFront certificate
# resource "aws_route53_record" "cloudfront_cert_validation" {
#   for_each = {
#     for dvo in aws_acm_certificate.cloudfront.domain_validation_options : dvo.domain_name => {
#       name   = dvo.resource_record_name
#       record = dvo.resource_record_value
#       type   = dvo.resource_record_type
#     }
#   }
#
#   allow_overwrite = true
#   name            = each.value.name
#   records         = [each.value.record]
#   ttl             = 60
#   type            = each.value.type
#   zone_id         = ""
# }
#
# # Wait for CloudFront certificate to be issued
# resource "aws_acm_certificate_validation" "cloudfront" {
#   certificate_arn         = aws_acm_certificate.cloudfront.arn
#   validation_record_fqdns = [for record in aws_route53_record.cloudfront_cert_validation : record.fqdn]
# }
