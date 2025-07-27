class TeamChannel < ApplicationCable::Channel
  	def subscribed
    	stream_from "team_#{params[:team_id]}"
  	end

  	def unsubscribed
    	# チャンネルを離れたときの後処理はここに書く
  	end
end
