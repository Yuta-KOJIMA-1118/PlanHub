# スケジュール共有アプリ
# アプリ概要
- チーム単位でスケジュールを共有・管理するアプリ
- 一人ひとりが「繰り返し予定」や「臨時予定」を登録可能
- 予定ごとに「他のメンバーに公開するかどうか」を設定できる
- メンバーのスケジュールを閲覧可能
- 非公開の予定は「予定あり」のみを他のメンバーに表示し、詳細は表示しない
- スケジュール登録時に、複数のチームメンバーを選択して共有可能
- 共有されたメンバーのカレンダーにも同じスケジュールが表示される
- スケジュールは1件のデータで管理され、複数人に割り当てられる
- 各ユーザーは共有された予定に対して自分専用のメモを追加できる（個人ノート）
- マネージャー機能は導入しない（ロール管理なし）

# 使用するWeb技術
- Rails API
- React + Vite
- WebSocket
- FullCalendar.jsなどのカレンダーUIライブラリ
- 認証
- フォームバリデーションは最低限
- SPA

# 採用しない／後回しにするもの
- 技術/機能	理由
- ロール管理（マネージャーなど）	Web技術ではない、評価対象外
- SSE（Server-Sent Events）	WebSocketを使うため不要
- データフィルタリング・検索	Web技術ではない、評価対象外
- フォームバリデーション（UX寄りの高度なもの）	最低限のみ実装
- 通知/PWA/外部API連携など	工数に余裕ができた場合に検討
- tailwindなどのUIに凝ったライブラリ

# 認証方式
- Google OAuth 2.0 のみ使用
  - email / password 認証は導入しない
  - 初回ログイン時にユーザー情報をDBに登録（find_or_create_by）
  - `uid` + `provider` でユーザー識別

# WebSocketの用途
- 同一チーム内の他ユーザーのスケジュール追加・更新・削除をリアルタイム反映
- ユーザーがスケジュールを変更した際、同じチームの全クライアントにブロードキャスト

# 使用ライブラリ

## バックエンド（Rails）
- devise（セッション管理に使う場合）
- omniauth
- omniauth-google-oauth2
- action_cable（WebSocket）

## フロントエンド（React + Vite）
- axios
- fullcalendar
- socket.io-client（WebSocketクライアント）

# DB
## テーブル
- User
  - id
  - name
  - email
  - uid（GoogleのユーザID）
  - provider（google_oauth2固定）
  - image_url（Googleのプロフィール画像のURL）
  - team_id
  - created_at
  - updated_at  
  ※ uid + provider にユニーク制約

- Team
  - id
  - name

- Schedule
  - id
  - creator_id（作成者UserのID）
  - title
  - start_time
  - end_time
  - is_public
  - is_recurring
  - recurrence_rule
  - note（全体共有向けの備考）

- ScheduleParticipant
  - id
  - schedule_id
  - user_id（参加ユーザー）
  - personal_note（個人向けのメモ）

## 関係
- User
  - belongs_to :team
  - has_many :created_schedules, class_name: 'Schedule', foreign_key: 'creator_id'
  - has_many :schedule_participants
  - has_many :schedules, through: :schedule_participants

- Team
  - has_many :users
  - has_many :schedules, through: :users（※チーム内の参加者が関わる全スケジュール）

- Schedule
  - belongs_to :creator, class_name: 'User'
  - has_many :schedule_participants
  - has_many :users, through: :schedule_participants

- ScheduleParticipant
  - belongs_to :schedule
  - belongs_to :user

# ページ構成
## トップページ（`/`）
- ログインボタン（Google OAuth）
- ログイン済みなら `/calendar` にリダイレクト

## カレンダーページ（`/calendar`）
- ログインユーザーの予定を表示（FullCalendarで描画）
- 他のチームメンバーのスケジュールは別カレンダーとして表示
- 非公開スケジュールは「予定あり」としてブロックのみ表示（タイトル・詳細は非表示）
- 月・週・日ビューの切り替えが可能（FullCalendarのビュー機能を使用）
- 予定のクリックで編集モーダルを表示
- 新規追加は空白セルのクリックで対応

## スケジュール作成ページ（モーダル or `/schedule/new`）
- タイトル、開始・終了日時、公開設定（true/false）、繰り返し設定を入力
- 共有するチームメンバーの選択（複数可）
- 全体用メモ（note）、自分用メモ（personal_note）の入力
- 登録後、WebSocket経由で他のクライアントにも即時反映

## スケジュール編集ページ（モーダル or `/schedule/:id/edit`）
- 作成者（creator）のみが全体情報（時間・参加者など）を編集可能
- 他の参加者は「自分の個人メモ（personal_note）」のみ編集可能
- 編集後はリアルタイムで更新がブロードキャストされる

## ログアウト機能
- Google認証のセッション削除とトップページへのリダイレクト

# APIエンドポイント仕様
すべてのAPIは `/api/v1/` 配下に設置される。

## 🔐 認証関連
| メソッド | エンドポイント                        | 説明                                      |
|----------|---------------------------------------|-------------------------------------------|
| GET      | `/auth/google_oauth2/callback`        | Google OAuth認証のコールバックエンドポイント |
| GET      | `/api/v1/me`                          | 現在ログイン中のユーザー情報の取得         |
| DELETE   | `/api/v1/logout`                      | ログアウト（セッションの削除）             |

---

## 👤 ユーザー関連
| メソッド | エンドポイント           | 説明                                      |
|----------|--------------------------|-------------------------------------------|
| GET      | `/api/v1/users`          | 同じチームに所属するユーザー一覧の取得     |
| GET      | `/api/v1/users/:id`      | 特定ユーザーの情報取得（任意で使用）       |

---

## 📅 スケジュール関連
### 一覧・取得
| メソッド | エンドポイント            | 説明                                            |
|----------|---------------------------|-------------------------------------------------|
| GET      | `/api/v1/schedules`       | 自分が関係しているスケジュールの一覧取得       |
| GET      | `/api/v1/schedules/:id`   | スケジュールの詳細情報（全体＋個人ノート）取得 |

### 作成・更新・削除
| メソッド | エンドポイント            | 説明                                  |
|----------|---------------------------|---------------------------------------|
| POST     | `/api/v1/schedules`       | 新しいスケジュールを作成（共有先を指定） |
| PUT      | `/api/v1/schedules/:id`   | スケジュール全体情報の更新（作成者のみ） |
| DELETE   | `/api/v1/schedules/:id`   | スケジュールの削除（作成者のみ）         |

### 個人メモ更新
| メソッド | エンドポイント                      | 説明                              |
|----------|-------------------------------------|-----------------------------------|
| PATCH    | `/api/v1/schedules/:id/note`        | スケジュールに対する個人メモの更新 |

---

## 📦 リクエスト例
### スケジュール作成（POST）
```json
POST /api/v1/schedules

{
  "title": "ゼミミーティング",
  "start_time": "2025-07-22T13:00:00+09:00",
  "end_time": "2025-07-22T14:30:00+09:00",
  "is_public": true,
  "is_recurring": false,
  "recurrence_rule": null,
  "note": "教室A-101",
  "participant_user_ids": [2, 3, 5]
}
```

# 開発前に決めたこと
- 認証後はRailsのセッションCookieを用いてログイン状態を維持する
- 日時は全てUTCでAPIに送受信し、表示はJSTに補正する（FullCalendar側で対応）
- WebSocketはチーム単位で購読（例：TeamChannel_1）
- エラー時のレスポンスは `{ error: "メッセージ" }` 形式で統一
- 同一スケジュールは複数人に共有され、1件のデータとして保持