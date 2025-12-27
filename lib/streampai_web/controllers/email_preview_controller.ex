defmodule StreampaiWeb.EmailPreviewController do
  @moduledoc """
  Controller for previewing email templates in development.

  Accessible at /dev/email-preview/*
  Only available when dev_routes is enabled.
  """

  use StreampaiWeb, :controller

  alias Streampai.Emails

  @sample_user %{
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "streamer@example.com",
    display_name: "AwesomeStreamer",
    name: "AwesomeStreamer"
  }

  def index(conn, _params) do
    templates = [
      %{name: "Welcome Email", path: "/dev/email-preview/welcome"},
      %{name: "Newsletter Confirmation", path: "/dev/email-preview/newsletter"},
      %{name: "Email Confirmation", path: "/dev/email-preview/confirm"},
      %{name: "Password Reset", path: "/dev/email-preview/password-reset"}
    ]

    html(conn, """
    <!DOCTYPE html>
    <html>
    <head>
      <title>Email Template Previews</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 800px;
          margin: 40px auto;
          padding: 20px;
          background: #f4f4f8;
        }
        h1 { color: #1a1a2e; margin-bottom: 8px; }
        p { color: #666; margin-bottom: 32px; }
        .templates { display: flex; flex-direction: column; gap: 16px; }
        a {
          display: block;
          background: white;
          padding: 20px;
          border-radius: 8px;
          text-decoration: none;
          color: #667eea;
          font-weight: 500;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        a:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        .note {
          margin-top: 32px;
          padding: 16px;
          background: #fff3cd;
          border-radius: 8px;
          color: #856404;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <h1>Email Template Previews</h1>
      <p>Click on a template to preview it. Sent emails can be viewed at <a href="/dev/mailbox">/dev/mailbox</a></p>
      <div class="templates">
        #{Enum.map_join(templates, "\n", fn t -> "<a href=\"#{t.path}\">#{t.name}</a>" end)}
      </div>
      <div class="note">
        <strong>Note:</strong> These previews use sample data. In production, emails will be
        personalized for each user.
      </div>
    </body>
    </html>
    """)
  end

  def welcome(conn, _params) do
    render_email_preview(conn, Emails.welcome_email_preview(@sample_user))
  end

  def newsletter(conn, _params) do
    render_email_preview(conn, Emails.newsletter_email_preview("subscriber@example.com"))
  end

  def confirm(conn, _params) do
    render_email_preview(conn, Emails.confirm_email_preview(@sample_user, "sample-token-abc123"))
  end

  def password_reset(conn, _params) do
    render_email_preview(
      conn,
      Emails.password_reset_email_preview(@sample_user, "sample-reset-token")
    )
  end

  @doc """
  Sends a test email to the Swoosh local mailbox for verification.
  Only available in dev mode.
  """
  def send_test(conn, %{"type" => type}) do
    result =
      case type do
        "welcome" ->
          Emails.send_welcome_email(@sample_user)

        "newsletter" ->
          Emails.send_newsletter_confirmation_email("test@example.com")

        "confirm" ->
          Emails.send_new_user_confirmation_email(@sample_user, "test-token")

        "password_reset" ->
          Emails.send_password_reset_email(@sample_user, "test-reset-token")

        _ ->
          {:error, :unknown_type}
      end

    case result do
      {:ok, _} ->
        html(conn, """
        <!DOCTYPE html>
        <html>
        <head>
          <title>Email Sent</title>
          <meta http-equiv="refresh" content="2;url=/dev/mailbox">
          <style>
            body { font-family: -apple-system, sans-serif; max-width: 600px; margin: 80px auto; text-align: center; }
            .success { color: #28a745; font-size: 48px; margin-bottom: 16px; }
            a { color: #667eea; }
          </style>
        </head>
        <body>
          <div class="success">✓</div>
          <h1>Email Sent!</h1>
          <p>Redirecting to <a href="/dev/mailbox">mailbox</a>...</p>
        </body>
        </html>
        """)

      {:error, reason} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: inspect(reason)})
    end
  end

  defp render_email_preview(conn, {subject, html_body, text_body}) do
    html(conn, """
    <!DOCTYPE html>
    <html>
    <head>
      <title>Preview: #{subject}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 0;
          background: #f4f4f8;
        }
        .toolbar {
          position: sticky;
          top: 0;
          background: #1a1a2e;
          color: white;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          gap: 24px;
          z-index: 100;
        }
        .toolbar a { color: #667eea; text-decoration: none; }
        .toolbar h2 { margin: 0; font-size: 16px; flex-grow: 1; }
        .tabs {
          display: flex;
          gap: 8px;
        }
        .tab {
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        .tab.active { background: #667eea; }
        .content { padding: 24px; }
        .preview-frame {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        iframe {
          width: 100%;
          height: 80vh;
          border: none;
        }
        .text-preview {
          padding: 24px;
          white-space: pre-wrap;
          font-family: monospace;
          background: white;
          border-radius: 8px;
          display: none;
        }
      </style>
    </head>
    <body>
      <div class="toolbar">
        <a href="/dev/email-preview">&larr; Back</a>
        <h2>Subject: #{subject}</h2>
        <div class="tabs">
          <button class="tab active" onclick="showHtml()">HTML</button>
          <button class="tab" onclick="showText()">Plain Text</button>
        </div>
      </div>
      <div class="content">
        <div class="preview-frame">
          <iframe id="html-preview" srcdoc="#{html_escape(html_body)}"></iframe>
          <pre id="text-preview" class="text-preview">#{text_body}</pre>
        </div>
      </div>
      <script>
        function showHtml() {
          document.getElementById('html-preview').style.display = 'block';
          document.getElementById('text-preview').style.display = 'none';
          document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === 0));
        }
        function showText() {
          document.getElementById('html-preview').style.display = 'none';
          document.getElementById('text-preview').style.display = 'block';
          document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === 1));
        }
      </script>
    </body>
    </html>
    """)
  end

  defp html_escape(string) do
    string
    |> String.replace("&", "&amp;")
    |> String.replace("<", "&lt;")
    |> String.replace(">", "&gt;")
    |> String.replace("\"", "&quot;")
  end
end
