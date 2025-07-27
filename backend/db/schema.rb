# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_07_26_130459) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "schedule_participants", force: :cascade do |t|
    t.bigint "schedule_id", null: false
    t.bigint "user_id", null: false
    t.text "personal_note"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["schedule_id", "user_id"], name: "index_schedule_participants_on_schedule_id_and_user_id", unique: true
    t.index ["schedule_id"], name: "index_schedule_participants_on_schedule_id"
    t.index ["user_id"], name: "index_schedule_participants_on_user_id"
  end

  create_table "schedules", force: :cascade do |t|
    t.bigint "team_id", null: false
    t.bigint "creator_id", null: false
    t.string "title", null: false
    t.datetime "start_time", null: false
    t.datetime "end_time", null: false
    t.boolean "all_day", default: false, null: false
    t.boolean "visibility", default: true, null: false
    t.text "note"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["creator_id"], name: "index_schedules_on_creator_id"
    t.index ["team_id"], name: "index_schedules_on_team_id"
  end

  create_table "teams", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "name", null: false
    t.bigint "team_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["team_id"], name: "index_users_on_team_id"
  end

  add_foreign_key "schedule_participants", "schedules"
  add_foreign_key "schedule_participants", "users"
  add_foreign_key "schedules", "teams"
  add_foreign_key "schedules", "users", column: "creator_id"
  add_foreign_key "users", "teams"
end
