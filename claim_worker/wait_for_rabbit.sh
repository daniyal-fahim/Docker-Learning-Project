#!/bin/sh
echo "Waiting for RabbitMQ..."
until nc -z rabbitmq 5672; do
  echo "Waiting for RabbitMQ port 5672..."
  sleep 2
done
echo "RabbitMQ ready. Starting service..."
exec "$@"