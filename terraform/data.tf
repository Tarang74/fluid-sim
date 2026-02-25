data "aws_security_group" "cab432_security_group" {
  name = ""
}

data "aws_subnet" "public_subnet_1" {
  filter {
    name   = "tag:Name"
    values = ["aws-controltower-PublicSubnet1"]
  }
}

data "aws_subnet" "public_subnet_2" {
  filter {
    name   = "tag:Name"
    values = ["aws-controltower-PublicSubnet2"]
  }
}

data "aws_vpc" "main" {
  id = ""
}

data "aws_iam_role" "execution" {
  name = ""
}
data "aws_iam_role" "task" {
  name = ""
}
data "aws_iam_role" "lambda" {
  name = ""
}

data "aws_ami" "ubuntu_22" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }

  owners = ["099720109477"] # Canonical
}
