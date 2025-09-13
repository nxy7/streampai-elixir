defmodule StreampaiWeb.ContactLive do
  @moduledoc false
  use StreampaiWeb, :live_view

  import StreampaiWeb.Components.StaticPageLayout

  def mount(_params, _session, socket) do
    {:ok,
     assign(socket,
       form_submitted: false,
       name: "",
       email: "",
       subject: "",
       message: ""
     ), layout: false}
  end

  def handle_event("submit_contact", _params, socket) do
    {:noreply,
     assign(socket,
       form_submitted: true,
       name: "",
       email: "",
       subject: "",
       message: ""
     )}
  end

  def handle_event("reset_form", _params, socket) do
    {:noreply, assign(socket, form_submitted: false)}
  end

  def render(assigns) do
    ~H"""
    <.static_page_layout
      title="Contact Us"
      description="Get in touch with the Streampai team. Send us your questions, feedback, or support requests."
    >
      <h1 class="text-4xl font-bold text-white mb-8">Contact Us</h1>

      <%= if @form_submitted do %>
        <!-- Success Message -->
        <div class="bg-green-500/20 border border-green-500/30 rounded-xl p-6 mb-8">
          <div class="flex items-center">
            <svg
              class="w-6 h-6 text-green-400 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <div>
              <h3 class="text-lg font-semibold text-white mb-1">
                Message Sent Successfully!
              </h3>
              <p class="text-green-300">
                Thank you for contacting us. We'll get back to you within 24 hours.
              </p>
            </div>
          </div>
          <button
            phx-click="reset_form"
            class="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Send Another Message
          </button>
        </div>
      <% else %>
        <!-- Contact Form -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Form -->
          <div>
            <form phx-submit="submit_contact" class="space-y-6">
              <div>
                <label for="name" class="block text-sm font-medium text-white mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={@name}
                  required
                  class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label for="email" class="block text-sm font-medium text-white mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={@email}
                  required
                  class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label for="subject" class="block text-sm font-medium text-white mb-2">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="billing">Billing Question</option>
                  <option value="feature">Feature Request</option>
                  <option value="partnership">Partnership</option>
                </select>
              </div>

              <div>
                <label for="message" class="block text-sm font-medium text-white mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows="6"
                  required
                  class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Tell us how we can help you..."
                ></textarea>
              </div>

              <button
                type="submit"
                class="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all"
              >
                Send Message
              </button>
            </form>
          </div>
          
    <!-- Contact Info -->
          <div>
            <div class="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
              <h3 class="text-xl font-semibold text-white mb-4">Get in Touch</h3>
              <div class="space-y-4">
                <div class="flex items-start space-x-3">
                  <svg
                    class="w-5 h-5 text-purple-400 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <div>
                    <p class="text-white font-medium">Email</p>
                    <p class="text-gray-300">contact@streampai.com</p>
                  </div>
                </div>

                <div class="flex items-start space-x-3">
                  <svg
                    class="w-5 h-5 text-purple-400 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p class="text-white font-medium">Response Time</p>
                    <p class="text-gray-300">Within 24 hours</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-6">
              <h4 class="text-lg font-semibold text-white mb-3">Quick Support</h4>
              <p class="text-gray-300 mb-4">
                For immediate help, check out our support center.
              </p>
              <a
                href="/support"
                class="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium"
              >
                Visit Support Center
                <svg
                  class="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      <% end %>
    </.static_page_layout>
    """
  end
end
