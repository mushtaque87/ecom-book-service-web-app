terraform {
  required_providers {
    linode = {
      source  = "linode/linode"
      version = "~> 1.0"
    }
  }
}

provider "linode" {
  token = var.linode_token
}

resource "linode_lke_cluster" "book_cluster" {
  label       = "book_cluster"
  k8s_version = "1.33"
  region      = "ap-west"
  pool {
    type  = "g6-standard-1"
    count = 3
  }
}

output "kubeconfig" {
  value     = linode_lke_cluster.book_cluster.kubeconfig
  sensitive = true
}

variable "linode_token" {
  description = "Linode API token"
  type        = string
}
