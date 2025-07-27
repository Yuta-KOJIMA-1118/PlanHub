class User < ApplicationRecord
  devise :database_authenticatable, :registerable, # database_authenticatable: パスワードのハッシュ化と認証, registerable: ユーザー登録機能
         :recoverable, :rememberable, :validatable # recoverable: パスワードリセット機能, rememberable: ログイン状態の保持, validatable: 入力値の検証

  belongs_to :team, optional: true
  has_many :created_schedules, class_name: 'Schedule', foreign_key: 'creator_id', dependent: :destroy
  has_many :schedule_participants, dependent: :destroy
  has_many :participating_schedules, through: :schedule_participants, source: :schedule

  # マイグレーションで name, null: false としているので、presence: true は必須
  validates :name, presence: true
end
