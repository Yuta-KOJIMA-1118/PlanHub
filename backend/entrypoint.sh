#!/bin/bash
set -e

# DB 起動待ち（pg_isready）
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$POSTGRES_USER"; do
  echo "Waiting for PostgreSQL to start..."
  sleep 1
done

# 初期化（マイグレーション含む）
# bundle exec rails db:drop db:create db:migrate

# CMD に渡されたコマンドを実行（server 起動など）
exec "$@"