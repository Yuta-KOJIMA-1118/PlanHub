class Schedule < ApplicationRecord
  belongs_to :team
  belongs_to :creator, class_name: 'User'
  has_many :schedule_participants
  has_many :participants, through: :schedule_participants, source: :user
end
