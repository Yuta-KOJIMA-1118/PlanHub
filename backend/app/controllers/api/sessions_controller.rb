# app/controllers/api/sessions_controller.rb
class Api::SessionsController < ApplicationController
  # ログインしているユーザーのみアクセス可能
  before_action :authenticate_user!

  # GET /api/me
  def me
    if current_user
      render json: {
        id: current_user.id,
        email: current_user.email,
        name: current_user.name,
        team_id: current_user.team_id,
        team_name: current_user.team&.name
      }, status: :ok
    else
      render json: { error: 'ユーザーが認証されていません' }, status: :unauthorized
    end
  end

  # 必要であれば、ログアウト時にセッションクリアも行う
  # def destroy
  #   sign_out current_user
  #   head :no_content
  # end
end