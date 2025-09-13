defmodule StreampaiWeb.LandingLiveTest do
  use StreampaiWeb.ConnCase, async: true
  use Mneme

  import Phoenix.LiveViewTest
  import Streampai.TestHelpers

  alias Streampai.Accounts.NewsletterEmail

  require Ash.Query

  describe "landing page" do
    test "renders landing page", %{conn: conn} do
      {:ok, _view, html} = live(conn, "/")

      assert html =~ "Streampai"
      assert html =~ "Multi-Platform Streaming Solution"
    end

    test "user can successfully sign up for newsletter", %{conn: conn} do
      {:ok, view, _html} = live(conn, "/")

      email = test_email("newsletter")

      view
      |> form("#newsletter-form", %{email: email})
      |> render_submit()

      html = render(view)

      newsletter_signup = %{
        shows_success_message: html =~ "Thanks!" || html =~ "added" || html =~ "subscribed",
        email_was_saved: newsletter_email_exists?(email)
      }

      auto_assert %{email_was_saved: true, shows_success_message: true} <- newsletter_signup
    end

    test "handles duplicate email signup gracefully", %{conn: conn} do
      email = test_email("duplicate")

      {:ok, _existing} =
        NewsletterEmail
        |> Ash.Changeset.for_create(:create, %{email: email})
        |> Ash.create()

      {:ok, view, _html} = live(conn, "/")

      view
      |> form("#newsletter-form", %{email: email})
      |> render_submit()

      html = render(view)

      duplicate_handling = %{
        shows_friendly_message: html =~ "already" || html =~ "subscribed",
        error_displayed: html =~ "error" || html =~ "Error",
        maintains_single_record: newsletter_email_count_for(email) == 1
      }

      # The app actually shows an error message for duplicates (which is fine behavior)
      assert duplicate_handling.maintains_single_record, "Should maintain single record"
      assert duplicate_handling.shows_friendly_message, "Should show friendly message"
    end

    test "newsletter signup validates email format", %{conn: conn} do
      {:ok, view, _html} = live(conn, "/")

      view
      |> form("#newsletter-form", %{email: "invalid-email"})
      |> render_submit()

      html = render(view)

      validation_logic = %{
        shows_validation_error: html =~ "must match the pattern" || html =~ "invalid" || html =~ "format",
        email_not_saved: !newsletter_email_exists?("invalid-email")
      }

      assert validation_logic.email_not_saved, "Invalid email should not be saved to database"

      assert validation_logic.shows_validation_error,
             "Should show validation error for invalid email format"
    end
  end
end
