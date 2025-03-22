FROM haproxy:bookworm

USER root
RUN apt-get update && apt-get install -y curl screen && rm -rf /var/lib/apt/lists/*

USER haproxy
RUN curl https://install.duckdb.org | sh

CMD screen -dmS duckdb_ui /var/lib/haproxy/.duckdb/cli/latest/duckdb -ui && while true; do sleep 1; done
