class ApplicationController < ActionController::API
  include ActionController::Cookies
  include ActionController::RequestForgeryProtection  # 追加
  protect_from_forgery with: :null_session           # または :exception
end
