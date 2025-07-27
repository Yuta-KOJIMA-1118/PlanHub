# app/controllers/users/sessions_controller.rb
class Users::AuthController < Devise::SessionsController
  # ログインアクションに対してCSRFトークン認証をスキップ (これは維持)
  skip_before_action :verify_authenticity_token, only: [:create]

  # POST /resource/sign_in
  def create
    self.resource = warden.authenticate!(auth_options) # Devise/Wardenが認証を行う
    set_flash_message!(:notice, :signed_in)
    sign_in(resource_name, resource) # ユーザーをセッションにサインイン

    # ログイン成功時のJSONレスポンス
    render json: {
      message: 'ログインに成功しました！',
      user: resource.as_json(only: [:id, :email, :name]),
      redirect_url: 'http://localhost:5173/calendar'
    }, status: :ok
  rescue ActionController::ParameterMissing => e
    # パラメータ不足のエラーハンドリング
    render json: { errors: ["Missing parameter: #{e.param}"] }, status: :bad_request
  rescue => e # <-- このrescueブロックを復活させる
    # 認証失敗時のエラーハンドリング
    # Deviseの認証失敗は通常 warden.authenticate! で処理されるため、
    # ここに到達するのは認証情報が完全に間違っている場合や、予期せぬエラー
    render json: { errors: ["ログインに失敗しました。メールアドレスまたはパスワードが正しくありません。"] }, status: :unauthorized # 401 Unauthorized
  end

  # DELETE /resource/sign_out
  def destroy
    signed_out = sign_out(resource_name)
    set_flash_message! :notice, :signed_out if signed_out
    yield if block_given?
    render json: { message: 'ログアウトしました！' }, status: :ok # 200 OK
  end

  protected

  # 認証時に使用するパラメータを許可
  def sign_in_params
    params.require(resource_name).permit(:email, :password)
  end

  # Deviseの認証オプション
  # デフォルトでは scope: resource_name, recall: "#{controller_path}#new"
  # これをカスタマイズすることで、認証失敗時のリダイレクト先などを制御できます
  # 今回は CustomDeviseFailureApp で制御しないので、デフォルトでOK
  # def auth_options
  #   { scope: resource_name, recall: "#{controller_path}#new" }
  # end
end