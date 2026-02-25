# Port mapping
variable "api_port_host" {
  default = ""
}
variable "api_port_container" {
  default = ""
}
variable "render_port" {
  default = ""
}
variable "websocket_port" {
  default = ""
}
variable "postgres_port_host" {
  default = ""
}
variable "postgres_port_container" {
  default = ""
}

# Redis
variable "redis_username" {
  sensitive = true
  default   = ""
}
variable "redis_password" {
  sensitive = true
  default   = ""
}
variable "redis_port" {
  default = ""
}

# Postgres
variable "postgres_username" {
  sensitive = true
  default   = ""
}
variable "postgres_password" {
  sensitive = true
  default   = ""
}
variable "postgres_database_name" {
  sensitive = true
  default   = ""
}
