resource "aws_ecr_repository" "api_repository" {
  name                 = ""
  image_tag_mutability = "MUTABLE"
  force_delete = true

  image_scanning_configuration {
    scan_on_push = true
  }

  lifecycle {
    ignore_changes = [tags, tags_all]
  }
}

resource "aws_ecr_repository" "render_repository" {
  name                 = ""
  image_tag_mutability = "MUTABLE"
  force_delete = true

  image_scanning_configuration {
    scan_on_push = true
  }

  lifecycle {
    ignore_changes = [tags, tags_all]
  }
}

resource "aws_ecr_repository" "websocket_repository" {
  name                 = ""
  image_tag_mutability = "MUTABLE"
  force_delete = true

  image_scanning_configuration {
    scan_on_push = true
  }

  lifecycle {
    ignore_changes = [tags, tags_all]
  }
}

resource "aws_ecr_repository" "postgres_repository" {
  name                 = ""
  image_tag_mutability = "MUTABLE"
  force_delete = true

  image_scanning_configuration {
    scan_on_push = true
  }

  lifecycle {
    ignore_changes = [tags, tags_all]
  }
}

