# app/controllers/api/schedules_controller.rb
class Api::SchedulesController < ApplicationController
  before_action :authenticate_user!
  skip_before_action :verify_authenticity_token, only: [:create, :update, :destroy]

  # GET /api/schedules (チームの全スケジュールを取得)
  def index
    unless current_user.team
      render json: { errors: ["チームに所属していないため、スケジュールを閲覧できません。"] }, status: :forbidden
      return
    end

    schedules = current_user.team.schedules.includes(
      :creator,
      schedule_participants: :user
    ).order(start_time: :asc)

    processed_schedules = schedules.map do |schedule|
      is_creator = (schedule.creator == current_user)
      is_participant = schedule.schedule_participants.exists?(user: current_user)
      my_participant_record = schedule.schedule_participants.find_by(user: current_user)

      schedule_data = {
        id: schedule.id,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        all_day: schedule.all_day,
        visibility: schedule.visibility,
        members: schedule.schedule_participants.map(&:user_id) || [],
        creator: schedule.creator ? { id: schedule.creator.id, name: schedule.creator.name } : nil
      }

      if schedule.visibility
        schedule_data[:title] = schedule.title
        schedule_data[:note] = schedule.note
      elsif is_creator || is_participant
        schedule_data[:title] = schedule.title
        schedule_data[:note] = schedule.note
      else
        schedule_data[:title] = "非公開な予定"
        schedule_data[:note] = "非公開な予定"
      end

      if is_creator || is_participant
        schedule_data[:personal_note] = my_participant_record&.personal_note
      else
        schedule_data[:personal_note] = nil
      end
      
      schedule_data
    end

    render json: processed_schedules, status: :ok
  end

  # POST /api/schedules (予定の作成)
  def create
    unless current_user.team
      render json: { errors: ["チームに所属していないため、予定を作成できません。"] }, status: :forbidden
      return
    end

    schedule_attrs = schedule_params.except(:participants, :personal_note, :members) # :members も除外
    schedule_attrs[:title] = schedule_attrs[:title].presence || "新しい予定"

    @schedule = current_user.created_schedules.build(schedule_attrs)
    @schedule.team = current_user.team

    ActiveRecord::Base.transaction do
      if @schedule.save
        participant_ids = params[:schedule][:participants] || []
        personal_note_for_creator = params[:schedule][:personal_note]

        participant_ids.each do |user_id|
          user = User.find_by(id: user_id)
          next unless user

          note_for_this_participant = (user.id == current_user.id) ? personal_note_for_creator : nil

          participant = @schedule.schedule_participants.build(
            user: user,
            personal_note: note_for_this_participant
          )
          unless participant.save
            raise ActiveRecord::Rollback, "参加者の保存に失敗しました: #{participant.errors.full_messages.join(', ')}"
          end
        end

        render json: {
          message: '予定が正常に作成されました！',
          schedule: @schedule.as_json(
            # methods: [:creator_name], # <-- この行を削除
            include: { # 関連するオブジェクトを含める
              schedule_participants: {
                only: [:id, :personal_note],
                include: { user: { only: [:id, :name] } }
              },
              creator: { only: [:id, :name] } # <-- creator オブジェクトを直接含める
            }
          ),
          creator_personal_note: personal_note_for_creator
        }, status: :created
      else
        render json: {
          errors: @schedule.errors.full_messages
        }, status: :unprocessable_entity
      end
    end
  rescue ActiveRecord::Rollback => e
    render json: { errors: ["予定の作成に失敗しました: #{e.message}"] }, status: :unprocessable_entity
  end

  # PATCH/PUT /api/schedules/:id (予定の更新)
  def update
    @schedule = Schedule.find_by(id: params[:id])

    unless @schedule && (@schedule.creator == current_user || @schedule.schedule_participants.exists?(user: current_user))
      render json: { errors: ["予定が見つからないか、更新する権限がありません。"] }, status: :not_found
      return
    end

    schedule_attrs = schedule_params.except(:participants, :personal_note, :members) # :members も除外
    participant_ids = params[:schedule][:participants] || []
    personal_note_for_creator = params[:schedule][:personal_note]

    ActiveRecord::Base.transaction do
      if @schedule.update(schedule_attrs)
        @schedule.schedule_participants.destroy_all

        participant_ids.each do |user_id|
          user = User.find_by(id: user_id)
          next unless user

          note_for_this_participant = (user.id == current_user.id) ? personal_note_for_creator : nil

          participant = @schedule.schedule_participants.build(
            user: user,
            personal_note: note_for_this_participant
          )
          unless participant.save
            raise ActiveRecord::Rollback, "参加者の保存に失敗しました: #{participant.errors.full_messages.join(', ')}"
          end
        end

        render json: {
          message: '予定が正常に更新されました！',
          schedule: @schedule.as_json(
            # methods: [:creator_name], # <-- この行を削除
            include: { # 関連するオブジェクトを含める
              schedule_participants: {
                only: [:id, :personal_note],
                include: { user: { only: [:id, :name] } }
              },
              creator: { only: [:id, :name] } # <-- creator オブジェクトを直接含める
            }
          ),
          creator_personal_note: personal_note_for_creator
        }, status: :ok
      else
        render json: {
          errors: @schedule.errors.full_messages
        }, status: :unprocessable_entity
      end
    end
  rescue ActiveRecord::Rollback => e
    render json: { errors: ["予定の更新に失敗しました: #{e.message}"] }, status: :unprocessable_entity
  end

  # DELETE /api/schedules/:id (予定の削除)
  def destroy
    @schedule = Schedule.find_by(id: params[:id])

    # 予定が存在しない、または現在のユーザーが作成者ではない場合は拒否
    # 仮保存した予定を削除できるように、権限チェックを調整
    unless @schedule && (
      @schedule.creator == current_user || # 作成者であるか
      @schedule.schedule_participants.exists?(user: current_user) # または参加者であるか
    )
      render json: { errors: ["予定が見つからないか、削除する権限がありません。"] }, status: :not_found
      return
    end

    if @schedule.destroy
      head :no_content # 204 No Content
    else
      render json: { errors: ["予定の削除に失敗しました。"] }, status: :unprocessable_entity
    end
  end

  private

  # ScheduleとScheduleParticipantのパラメータをまとめて許可
  def schedule_params
    params.require(:schedule).permit(
      :title, :start_time, :end_time, :all_day, :visibility, :note,
      :personal_note, # personal_noteは後で処理
      # フロントエンドから渡されるmembersも許可する必要がある
      participants: [] # participants (メンバーIDの配列) を許可
    )
  end
end