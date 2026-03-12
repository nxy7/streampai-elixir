defmodule Streampai.Vault do
  @moduledoc false
  use Cloak.Vault, otp_app: :streampai

  @impl GenServer
  def init(config) do
    config =
      Keyword.put(config, :ciphers,
        default: {
          Cloak.Ciphers.AES.GCM,
          tag: "AES.GCM.V1", key: decode_env!("CLOAK_KEY"), iv_length: 12
        }
      )

    {:ok, config}
  end

  defp decode_env!(var) do
    case System.get_env(var) do
      nil ->
        raise """
        Missing #{var} environment variable.

        Generate one with:
            32 |> :crypto.strong_rand_bytes() |> Base.encode64()
        """

      val ->
        Base.decode64!(val)
    end
  end
end
