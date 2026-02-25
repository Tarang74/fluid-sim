resource "terraform_data" "api_cloudinit_fingerprint" {
  triggers_replace = filesha256("${path.module}/user-data/api_user_data.sh")
}
resource "terraform_data" "postgres_cloudinit_fingerprint" {
  triggers_replace = filesha256("${path.module}/user-data/postgres_user_data.sh")
}

resource "aws_instance" "api_instance" {
  ami                                  = data.aws_ami.ubuntu_22.id
  key_name                             = var.aws_key_name
  instance_type                        = "t3.micro"
  instance_initiated_shutdown_behavior = "terminate"
  security_groups                      = [data.aws_security_group.cab432_security_group.id]
  subnet_id                            = data.aws_subnet.public_subnet_2.id
  iam_instance_profile                 = ""

  private_ip = var.api_private_ip

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
  }

  user_data                   = data.cloudinit_config.api_userdata.rendered
  user_data_replace_on_change = true

  lifecycle {
    replace_triggered_by = [
      terraform_data.api_cloudinit_fingerprint
    ]

    ignore_changes = [ami, security_groups]
  }

  tags = {
    Name = ""
  }
}

resource "aws_instance" "postgres_instance" {
  ami                                  = data.aws_ami.ubuntu_22.id
  key_name                             = ""
  instance_type                        = "t3.micro"
  instance_initiated_shutdown_behavior = "terminate"
  security_groups                      = [data.aws_security_group.cab432_security_group.id]
  subnet_id                            = data.aws_subnet.public_subnet_2.id
  iam_instance_profile                 = ""

  private_ip = var.postgres_private_ip

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  user_data                   = data.cloudinit_config.postgres_userdata.rendered
  user_data_replace_on_change = true

  lifecycle {
    replace_triggered_by = [
      terraform_data.postgres_cloudinit_fingerprint
    ]

    ignore_changes = [ami, security_groups]
  }

  tags = {
    Name = ""
  }
}

