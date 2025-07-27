# app/controllers/api/teams_controller.rb
class Api::TeamsController < ApplicationController
  before_action :authenticate_user!
  skip_before_action :verify_authenticity_token, only: [:create, :join, :members] # <-- :members を追加

  # POST /api/teams
  def create
    schedule_attrs = team_params.except(:participants, :personal_note) # 間違い: team_paramsはparticipantsを持たない
    @team = Team.new(team_params) # <- ここは team_params を直接使う

    if @team.save
      current_user.update(team: @team)

      render json: {
        message: 'チームが正常に作成され、参加しました！',
        team: @team.as_json(only: [:id, :name]),
        user_team_id: current_user.team_id
      }, status: :created
    else
      render json: {
        errors: @team.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # POST /api/teams/join
  def join
    @team = Team.find_by(id: params[:team_id])

    if @team
      if current_user.update(team: @team)
        render json: {
          message: "チーム「#{@team.name}」に参加しました！",
          team: @team.as_json(only: [:id, :name]),
          user_team_id: current_user.team_id
        }, status: :ok
      else
        render json: {
          errors: current_user.errors.full_messages
        }, status: :unprocessable_entity
      end
    else
      render json: {
        errors: ["指定されたチームIDのチームが見つかりません。"]
      }, status: :not_found
    end
  end

  # GET /api/teams/:id/members (同チームのメンバー一覧を取得)
  def members
    # ログイン中のユーザーがチームに所属しているか確認
    unless current_user.team
      render json: { errors: ["チームに所属していません。"] }, status: :forbidden
      return
    end

    # リクエストされたチームIDが、ログイン中のユーザーが所属するチームと一致するか確認
    @team = Team.find_by(id: params[:id])
    unless @team && @team == current_user.team
      render json: { errors: ["指定されたチームのメンバーにアクセスする権限がありません。"] }, status: :unauthorized
      return
    end

    # チームに所属するメンバー（ユーザー）のIDと名前のリストを返す
    # current_user.team.users としても良いですが、ここでは @team.users を使用
    render json: @team.users.as_json(only: [:id, :name]), status: :ok
  end

  private

  def team_params
    params.require(:team).permit(:name)
  end
end