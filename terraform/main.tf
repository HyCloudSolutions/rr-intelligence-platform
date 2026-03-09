terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

terraform {
  backend "s3" {
    bucket         = "restaurantrisk-prod-tf-state-eb8957e0"
    key            = "global/s3/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "restaurantrisk-prod-tf-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

# Automatically fetch the default VPC in the AWS Account
data "aws_vpc" "default" {
  default = true
}

# Automatically fetch the subnets for the default VPC
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}
