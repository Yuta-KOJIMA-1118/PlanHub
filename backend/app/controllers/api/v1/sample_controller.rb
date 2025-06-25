module Api
  module V1
    class SampleController < ApplicationController
      def sample
        # This is a sample action that can be used to demonstrate functionality
        render json: { message: "This is a sample response from the SampleController." }
      end
      end
    end
  end
end
