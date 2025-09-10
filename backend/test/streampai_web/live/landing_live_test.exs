defmodule StreampaiWeb.LandingLiveTest do
  use StreampaiWeb.ConnCase, async: true
  use Mneme
  import Phoenix.LiveViewTest
  require Ash.Query

  alias Streampai.Accounts.NewsletterEmail

  describe "landing page" do
    test "renders landing page", %{conn: conn} do
      {:ok, _view, html} = live(conn, "/")

      assert html =~ "Streampai"
      assert html =~ "Multi-Platform Streaming Solution"
    end

    test "user can successfully sign up for newsletter", %{conn: conn} do
      {:ok, view, _html} = live(conn, "/")

      email = "test@example.com"

      # Simulate user filling out and submitting the newsletter form
      view
      |> form("#newsletter-form", %{email: email})
      |> render_submit()

      # Check that success message appears in flash
      html = render(view)

      assert html =~ "Thanks! We'll notify you when Streampai launches." or
               html =~ "Your email has been added to our newsletter"

      # Verify email was actually saved to database using Ash
      result =
        NewsletterEmail
        |> Ash.Query.filter(email == email)
        |> Ash.read()

      auto_assert {:ok, [%NewsletterEmail{email: "test@example.com"}]} <- result
    end

    test "shows friendly message for duplicate email signup", %{conn: conn} do
      email = "duplicate@example.com"

      # Create newsletter email first
      result =
        NewsletterEmail
        |> Ash.Changeset.for_create(:create, %{email: email})
        |> Ash.create()

      auto_assert {:ok, %NewsletterEmail{}} <- result

      {:ok, view, _html} = live(conn, "/")

      # Try to sign up with same email
      view
      |> form("#newsletter-form", %{email: email})
      |> render_submit()

      # Should show friendly duplicate message in flash
      html = render(view)
      assert html =~ "You're already subscribed" or html =~ "already subscribed"
    end

    test "verifies database interaction works correctly", %{conn: conn} do
      {:ok, view, _html} = live(conn, "/")

      # Submit a valid email
      view
      |> form("#newsletter-form", %{email: "db-test@example.com"})
      |> render_submit()

      # Verify email was saved to database
      result =
        NewsletterEmail
        |> Ash.Query.filter(email == "db-test@example.com")
        |> Ash.read()

      auto_assert {:ok, [%NewsletterEmail{email: "db-test@example.com"}]} <- result
    end
  end
end
