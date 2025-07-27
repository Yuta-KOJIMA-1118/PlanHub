class CreateSchedules < ActiveRecord::Migration[8.0]
  def change
    create_table :schedules do |t|
      t.references :team, null: false, foreign_key: true
      t.references :creator, null: false, foreign_key: { to_table: :users }
      t.string :title, null: false
      t.datetime :start_time, null: false
      t.datetime :end_time, null: false
      t.boolean :all_day, null: false, default: false
      t.boolean :visibility, null: false, default: true
      t.text :note

      t.timestamps
    end
  end
end
