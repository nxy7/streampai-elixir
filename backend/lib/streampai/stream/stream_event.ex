defmodule Streampai.Stream.StreamEvent do
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream
end
