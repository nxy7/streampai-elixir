defmodule Streampai.Repo.Migrations.RenameSmartWidgetLayoutsToSmartCanvasLayouts do
  use Ecto.Migration

  def up do
    rename table("smart_widget_layouts"), to: table("smart_canvas_layouts")
  end

  def down do
    rename table("smart_canvas_layouts"), to: table("smart_widget_layouts")
  end
end
