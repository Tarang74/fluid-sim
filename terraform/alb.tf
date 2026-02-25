resource "aws_lb" "web" {
  name               = ""
  internal           = false
  load_balancer_type = "application"
  security_groups    = [data.aws_security_group.cab432_security_group.id]
  subnets            = [data.aws_subnet.public_subnet_1.id, data.aws_subnet.public_subnet_2.id]
}

# HTTPS listener - return 404
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.web.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = aws_acm_certificate.web.arn

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      message_body = "Not Found"
      status_code  = "404"
    }
  }
}

# HTTP -> HTTPS redirect
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.web.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

// API target group
resource "aws_lb_target_group" "api" {
  name        = ""
  port        = 80
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.main.id
  target_type = "instance"

  health_check {
    path    = "/api/health"
    matcher = "200"
  }
}

// WebSocket target group
resource "aws_lb_target_group" "websocket" {
  name        = ""
  port        = var.websocket_port
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.main.id
  target_type = "ip"

  health_check {
    path    = "/sim/health"
    matcher = "200"
  }
}

// Route /api/* to API target group
resource "aws_lb_listener_rule" "api_https" {
  listener_arn = aws_lb_listener.https.arn

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  condition {
    path_pattern {
      values = ["/api", "/api/*"]
    }
  }
}

// Route /sim/* to WebSocket target group
resource "aws_lb_listener_rule" "websocket_https" {
  listener_arn = aws_lb_listener.https.arn

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.websocket.arn
  }

  condition {
    path_pattern {
      values = ["/sim", "/sim/*"]
    }
  }
}

// Attach API EC2 instance
resource "aws_lb_target_group_attachment" "api" {
  target_group_arn = aws_lb_target_group.api.arn
  target_id        = aws_instance.api_instance.id
  port             = var.api_port_host
}

