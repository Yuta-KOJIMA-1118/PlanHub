class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users do |t|
      ## パスワード認証用のDeviseフィールド
      t.string :email,              null: false, default: ""
      t.string :encrypted_password, null: false, default: ""

      ## ビジネスロジック用のフィールド
      t.string :name, null: false
      t.references :team, foreign_key: true
      t.timestamps
    end

    ## emailにユニーク制約
    add_index :users, :email, unique: true
  end
end