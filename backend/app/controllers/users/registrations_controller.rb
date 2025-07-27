# app/controllers/users/registrations_controller.rb
class Users::RegistrationsController < Devise::RegistrationsController
  # 登録アクションに対してCSRFトークン認証をスキップ
  skip_before_action :verify_authenticity_token, only: [:create]

  # POST /resource
  def create
    build_resource(sign_up_params)

    if resource.save
      if resource.active_for_authentication?
        set_flash_message! :notice, :signed_up
        sign_up(resource_name, resource) # Deviseがユーザーをセッションにサインインさせます
        
        # 登録成功時のJSONレスポンス
        render json: {
          message: 'ユーザー登録が完了しました！',
          user: resource.as_json(only: [:id, :email, :name]),
          redirect_url: 'http://localhost:5173/calendar'
        }, status: :created
      else
        set_flash_message! :notice, :"signed_up_but_#{resource.inactive_message}"
        expire_data_after_sign_in!
        render json: { message: "ユーザー登録は完了しましたが、アカウントが非アクティブです: #{resource.inactive_message}" }, status: :accepted
      end
    else
      clean_up_passwords resource
      set_minimum_password_length
      logger.debug "ユーザー登録失敗: エラーメッセージ -> #{resource.errors.full_messages.inspect}"
      render json: { errors: resource.errors.full_messages }, status: :unprocessable_entity
    end
  end

  protected

  def sign_up_params
    params.require(:user).permit(:name, :email, :password, :password_confirmation)
  end
end