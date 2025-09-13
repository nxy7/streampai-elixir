defmodule StreampaiWeb.PageController do
  use StreampaiWeb, :controller

  def home(conn, _params) do
    render(conn, :home, layout: false)
  end
end
