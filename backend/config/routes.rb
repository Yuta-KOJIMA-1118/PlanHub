# config/routes.rb

Rails.application.routes.draw do
  devise_for :users, controllers: {
    registrations: 'users/registrations',
    sessions: 'users/auth'
  }, defaults: { format: :json }

  namespace :api do
    get 'me', to: 'sessions#me'
    resources :teams, only: [:create] do
      post 'join', on: :collection
      get 'members', on: :member
    end
    resources :schedules, only: [:index, :create, :update, :destroy]
  end
end