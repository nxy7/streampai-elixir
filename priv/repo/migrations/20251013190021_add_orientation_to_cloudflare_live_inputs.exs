defmodule Streampai.Repo.Migrations.AddOrientationToCloudflareLiveInputs do
  use Ecto.Migration

  def change do
    alter table(:cloudflare_live_inputs) do
      add :orientation, :string, null: false, default: "horizontal"
    end

    execute(
      """
      ALTER TABLE cloudflare_live_inputs
      DROP CONSTRAINT cloudflare_live_inputs_pkey,
      ADD PRIMARY KEY (user_id, orientation);
      """,
      """
      ALTER TABLE cloudflare_live_inputs
      DROP CONSTRAINT cloudflare_live_inputs_pkey,
      ADD PRIMARY KEY (user_id);
      """
    )

    drop unique_index(:cloudflare_live_inputs, [:user_id],
           name: :cloudflare_live_inputs_one_live_input_per_user_index
         )

    create unique_index(:cloudflare_live_inputs, [:user_id, :orientation],
             name: :cloudflare_live_inputs_one_live_input_per_user_orientation_index
           )
  end
end
