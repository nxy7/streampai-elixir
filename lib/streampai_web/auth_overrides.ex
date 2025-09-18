defmodule StreampaiWeb.AuthOverrides do
  @moduledoc false
  use AshAuthentication.Phoenix.Overrides

  override AshAuthentication.Phoenix.Components.Banner do
    set :image_url, "/images/logo-black.png"
  end

  override AshAuthentication.Phoenix.Components.OAuth2 do
    set :icon_src, %{
      twitch: "/images/twitch-logo.svg"
    }
  end

  override AshAuthentication.Phoenix.Components.Password.Input do
    set :field_class, "mt-2 mb-2"
    set :label_class, "block text-sm font-medium text-gray-700 mb-1"

    @base_input_class """
    appearance-none block w-full px-3 py-2 border rounded-md
    shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm
    text-black
    """

    set :input_class,
        @base_input_class <>
          """
          border-gray-300 focus:ring-blue-400 focus:border-blue-500
          """

    set :input_class_with_error,
        @base_input_class <>
          """
          border-red-400 focus:border-red-400 focus:ring-red-300
          """

    set :submit_class, """
    w-full flex justify-center py-2 px-4 border border-transparent rounded-md
    shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
    mt-4 mb-4
    """

    set :password_input_label, "Password"
    set :password_confirmation_input_label, "Password Confirmation"
    set :identity_input_label, "Email"
    set :identity_input_placeholder, nil
    set :error_ul, "text-red-400 font-light my-3 italic text-sm"
    set :error_li, nil
    set :input_debounce, 350
  end
end
