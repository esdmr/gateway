# esdmr’s configuration for reverse proxy and other tools at gateway

```mermaid
flowchart LR
	wan{{WAN}}
	lan{{LAN}}
	other_services{{Other Services}}

	subgraph anubis
		challenge_server[Challenge Server]@{shape: 'manual'}
		anubis_metrics[Anubis Metrics]@{shape: 'event'}
	end

	subgraph nginx
		https_server[HTTPS Server]
		directory_server[Directory Server]
		nginx_status[Nginx Status]@{shape: 'event'}
	end

	subgraph nginx-prometheus
		nginx_metrics[Nginx Metrics]@{shape: 'event'}
	end

	subgraph prometheus
		prometheus_api[Prometheus API]@{shape: 'terminal'}
	end

	subgraph grafana
		grafana_dashboard[Grafana Dashboard]@{shape: 'display'}
	end

	wan <--> https_server <--> challenge_server <--> directory_server
	directory_server <--> other_services

	anubis_metrics --> prometheus_api
	other_services --> prometheus_api
	nginx_status ----> nginx_metrics --> prometheus_api
	prometheus_api --> grafana_dashboard <--> lan
```

## Getting Started

1. Clone the repository.

   ```sh
   git clone https://github.com/esdmr/gateway.git
   cd gateway
   ```
2. Manually configure TLS `subjectAltName` (`tls/server/ext.cnf`) and Nginx `server_name` (`nginx/name.inc`).

   See [`dlink.update-name.sh`](dlink.update-name.sh) for an example.
3. Generate CA and server certificates.

   ```sh
	make tls
   ```
4. Download and build Anubis image. (You can also use `ghcr.io/techarohq/anubis` directly.)

   ```sh
   make anubis
   ```
5. Start server using Docker Compose.
   ```
   make up
   ```
