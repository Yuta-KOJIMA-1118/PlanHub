FROM ruby:3.2

WORKDIR /app

RUN apt-get update -qq && \
    apt-get install -y nodejs postgresql-client

# Gemfile 先にコピー（キャッシュ最適化）
COPY Gemfile Gemfile.lock ./
COPY entrypoint.sh ./

# bundler install + bootsnap
RUN bundle install && \
    rm -rf ~/.bundle "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git && \
    bundle exec bootsnap precompile --gemfile

# アプリ本体コピー
COPY . .

# 実行コマンドは entrypoint.sh 経由で起動
ENTRYPOINT ["./entrypoint.sh"]
CMD ["rails", "server", "-b", "0.0.0.0"]
