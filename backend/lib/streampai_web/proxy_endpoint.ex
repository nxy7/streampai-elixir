defmodule StreampaiWeb.ProxyEndpoint do
  use Beacon.ProxyEndpoint,
    otp_app: :streampai,
    session_options: Application.compile_env!(:streampai, :session_options),
    fallback: StreampaiWeb.Endpoint
end
