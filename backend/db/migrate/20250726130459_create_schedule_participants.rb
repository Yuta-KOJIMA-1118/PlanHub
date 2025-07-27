class CreateScheduleParticipants < ActiveRecord::Migration[8.0]
  def change
    create_table :schedule_participants do |t|
      t.references :schedule, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.text :personal_note

      t.timestamps
    end

    add_index :schedule_participants, [:schedule_id, :user_id], unique: true
  end
end
