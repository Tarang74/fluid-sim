resource "aws_ecs_cluster" "cluster" {
  name = ""

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# resource "aws_cloudwatch_log_group" "render" {
#   name              = ""
#   retention_in_days = 14
# }
#
# resource "aws_cloudwatch_log_group" "websocket" {
#   name              = ""
#   retention_in_days = 14
# }

resource "aws_ecs_task_definition" "render" {
  family                   = ""
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 4096
  memory                   = 8192
  execution_role_arn       = data.aws_iam_role.execution.arn
  task_role_arn            = data.aws_iam_role.task.arn

  ephemeral_storage {
    size_in_gib = 50
  }

  container_definitions = jsonencode([
    {
      name  = "render"
      image = aws_ecr_repository.render_repository.repository_url

      essential = true

      portMappings = [
        {
          containerPort = tonumber(var.render_port)
          protocol      = "tcp"
        }
      ]
      environment = [
        { name = "BLENDER_PATH", value = "/usr/bin/blender" },
        { name = "API_PRIVATE_IP", value = var.api_private_ip },
        { name = "API_PORT_HOST", value = var.api_port_host }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = ""
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_task_definition" "websocket" {
  family                   = ""
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 1024
  memory                   = 8192
  execution_role_arn       = data.aws_iam_role.execution.arn
  task_role_arn            = data.aws_iam_role.task.arn

  ephemeral_storage {
    size_in_gib = 50
  }

  container_definitions = jsonencode([
    {
      name      = "websocket"
      image     = aws_ecr_repository.websocket_repository.repository_url
      essential = true

      portMappings = [
        {
          containerPort = tonumber(var.websocket_port)
          protocol      = "tcp"
        }
      ]
      environment = [
        { name = "WEBSOCKET_PORT", value = var.websocket_port },
        { name = "S3_SIMULATION_BUCKET", value = aws_s3_bucket.simulation_bucket.id },
        { name = "SQS_RENDER_JOBS_URL", value = aws_sqs_queue.render_jobs.url },
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = ""
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "render" {
  name                   = ""
  cluster                = aws_ecs_cluster.cluster.id
  task_definition        = aws_ecs_task_definition.render.arn
  desired_count          = 2
  platform_version       = "LATEST"
  launch_type            = "FARGATE"
  enable_execute_command = true

  network_configuration {
    subnets          = [data.aws_subnet.public_subnet_1.id, data.aws_subnet.public_subnet_2.id]
    security_groups  = [data.aws_security_group.cab432_security_group.id]
    assign_public_ip = true
  }

  deployment_minimum_healthy_percent = 70
  deployment_maximum_percent         = 200
}

resource "aws_ecs_service" "websocket" {
  name                   = ""
  cluster                = aws_ecs_cluster.cluster.id
  task_definition        = aws_ecs_task_definition.websocket.arn
  desired_count          = 1
  platform_version       = "LATEST"
  launch_type            = "FARGATE"
  enable_execute_command = true

  network_configuration {
    subnets          = [data.aws_subnet.public_subnet_1.id, data.aws_subnet.public_subnet_2.id]
    security_groups  = [data.aws_security_group.cab432_security_group.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.websocket.arn
    container_name   = "websocket"
    container_port   = tonumber(var.websocket_port)
  }
  deployment_minimum_healthy_percent = 70
  deployment_maximum_percent         = 200
}

# Autoscaling for render
resource "aws_appautoscaling_target" "render" {
  max_capacity       = 60
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.cluster.name}/${aws_ecs_service.render.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "render_jobs_scale_up" {
  name               = ""
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.render.resource_id
  scalable_dimension = aws_appautoscaling_target.render.scalable_dimension
  service_namespace  = aws_appautoscaling_target.render.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 120
    metric_aggregation_type = "Average"

    step_adjustment {
      metric_interval_lower_bound = 0
      metric_interval_upper_bound = 10
      scaling_adjustment          = 2
    }

    step_adjustment {
      metric_interval_lower_bound = 10
      metric_interval_upper_bound = 50
      scaling_adjustment          = 4
    }

    step_adjustment {
      metric_interval_lower_bound = 50
      scaling_adjustment          = 6
    }
  }
}

resource "aws_appautoscaling_policy" "render_jobs_scale_down" {
  name               = ""
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.render.resource_id
  scalable_dimension = aws_appautoscaling_target.render.scalable_dimension
  service_namespace  = aws_appautoscaling_target.render.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 120
    metric_aggregation_type = "Average"

    step_adjustment {
      metric_interval_lower_bound = null
      metric_interval_upper_bound = 0
      scaling_adjustment          = -1
    }
  }
}

# Autoscaling for websocket
resource "aws_appautoscaling_target" "websocket" {
  max_capacity       = 2
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.cluster.name}/${aws_ecs_service.websocket.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "websocket_cpu" {
  name               = ""
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.websocket.resource_id
  scalable_dimension = aws_appautoscaling_target.websocket.scalable_dimension
  service_namespace  = aws_appautoscaling_target.websocket.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70
    scale_in_cooldown  = 86400
    scale_out_cooldown = 60
  }
}

