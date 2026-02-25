resource "aws_cognito_user_pool" "user_pool" {
  name = ""

  alias_attributes         = ["email"]
  auto_verified_attributes = ["email"]

  username_configuration {
    case_sensitive = false
  }

  password_policy {
    require_numbers = true
    require_symbols = true
    minimum_length  = 8
  }

  email_configuration {
    from_email_address    = ""
    email_sending_account = "DEVELOPER"
    source_arn            = ""
  }

  # MFA Configuration
  mfa_configuration = "OPTIONAL"

  software_token_mfa_configuration {
    enabled = true
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"

    email_subject = ""
    email_message = ""
  }
}

resource "aws_cognito_user_pool_client" "client" {
  name                   = "client"
  user_pool_id           = aws_cognito_user_pool.user_pool.id
  id_token_validity      = 1
  access_token_validity  = 1
  refresh_token_validity = 7
  explicit_auth_flows    = ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
  generate_secret        = true

  # Enable OAuth flows for federated login
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes                 = ["email", "openid", "profile"]

  # Add Google
  supported_identity_providers = ["COGNITO", "Google"]

  # Callback URLs for OAuth
  callback_urls = [
    "http://localhost:5173/oauth/callback",
  ]
}

resource "aws_cognito_user_pool_domain" "domain" {
  domain       = ""
  user_pool_id = aws_cognito_user_pool.user_pool.id
}

resource "aws_cognito_identity_provider" "google" {
  user_pool_id  = aws_cognito_user_pool.user_pool.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    client_id        = ""
    client_secret    = ""
    authorize_scopes = "openid profile email"
  }

  attribute_mapping = {
    email              = "email"
    email_verified     = "email_verified"
    preferred_username = "name"
  }
}
