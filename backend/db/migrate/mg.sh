echo "--- データベースをドロップ＆作成中... ---"
# データベースを削除し、新しく作成します
docker-compose exec backend rails db:drop db:create

echo "--- マイグレーションを個別に実行中... ---"
# マイグレーションファイルをタイムスタンプ順に一つずつ実行します
# VERSIONの数値は、お手元のファイル名と一致させてください。
docker-compose exec backend rails db:migrate:up VERSION=20250726130430
docker-compose exec backend rails db:migrate:up VERSION=20250726130438
docker-compose exec backend rails db:migrate:up VERSION=20250726130445
docker-compose exec backend rails db:migrate:up VERSION=20250726130459