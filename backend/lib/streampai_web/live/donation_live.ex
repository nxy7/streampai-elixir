defmodule StreampaiWeb.DonationLive do
  @moduledoc """
  Public donation page for users where viewers can make donations.
  Available at /u/{userName}
  """
  use StreampaiWeb, :live_view

  alias Streampai.Accounts.User

  def mount(%{"username" => username}, _session, socket) do
    # Find user by username
    case find_user_by_username(username) do
      {:ok, user} ->
        {:ok,
         socket
         |> assign(:user, user)
         |> assign(:top_donors, get_top_donors_placeholder())
         |> assign(:voice_options, get_voice_options())
         |> assign(:donation_form, get_initial_form())
         |> assign(:page_title, "Donate to #{user.name}")
         |> assign(:meta_description, "Support #{user.name} with a donation")
         |> assign(:selected_amount, nil)
         |> assign(:custom_amount, "")
         |> assign(:processing, false), layout: false}

      {:error, :not_found} ->
        {
          :ok,
          socket
          |> put_flash(:error, "User not found")
          #  |> redirect(to: "/")
        }
    end
  end

  def handle_event("select_amount", %{"amount" => amount}, socket) do
    {:noreply,
     socket
     |> assign(:selected_amount, String.to_integer(amount))
     |> assign(:custom_amount, "")}
  end

  def handle_event("custom_amount_changed", %{"custom_amount" => amount}, socket) do
    {:noreply,
     socket
     |> assign(:custom_amount, amount)
     |> assign(:selected_amount, nil)}
  end

  def handle_event("update_form", %{"donation" => params}, socket) do
    form = %{
      donor_name: params["donor_name"] || "",
      message: params["message"] || "",
      voice: params["voice"] || "default"
    }

    {:noreply, assign(socket, :donation_form, form)}
  end

  def handle_event("submit_donation", %{"donation" => params}, socket) do
    amount = get_donation_amount(socket.assigns)

    if amount && amount > 0 do
      # TODO: Process actual donation
      process_donation(socket, params, amount)
    else
      {:noreply,
       socket
       |> put_flash(:error, "Please select or enter a valid donation amount")}
    end
  end

  defp process_donation(socket, params, amount) do
    # Simulate processing
    {:noreply,
     socket
     |> assign(:processing, true)
     |> put_flash(:info, "Processing donation of $#{amount}...")
     |> push_event("donation_submitted", %{
       amount: amount,
       donor: params["donor_name"] || "Anonymous",
       message: params["message"] || "",
       voice: params["voice"] || "default"
     })}
  end

  defp get_donation_amount(assigns) do
    cond do
      assigns.selected_amount ->
        assigns.selected_amount

      assigns.custom_amount != "" ->
        case Float.parse(assigns.custom_amount) do
          {amount, ""} -> trunc(amount)
          _ -> nil
        end

      true ->
        nil
    end
  end

  defp find_user_by_username(username) do
    import Ash.Query

    # TODO load avatar too
    query = User |> for_read(:get, %{}, load: [:avatar]) |> filter(name == ^username)

    case Ash.read_one(query, authorize?: false) do
      {:ok, user} when not is_nil(user) -> {:ok, user}
      {:ok, nil} -> {:error, :not_found}
      {:error, _} -> {:error, :not_found}
    end
  end

  defp get_top_donors_placeholder do
    [
      %{
        name: "GenerousViewer",
        amount: 150,
        message: "Keep up the great content!",
        timestamp: ~U[2024-01-15 14:30:00Z]
      },
      %{
        name: "SuperFan99",
        amount: 100,
        message: "Love the streams! 💜",
        timestamp: ~U[2024-01-14 19:45:00Z]
      },
      %{
        name: "Anonymous",
        amount: 75,
        message: "Thanks for the entertainment",
        timestamp: ~U[2024-01-13 21:20:00Z]
      },
      %{
        name: "StreamLover",
        amount: 50,
        message: "Amazing gameplay today!",
        timestamp: ~U[2024-01-12 16:15:00Z]
      },
      %{
        name: "CoffeeSupporter",
        amount: 25,
        message: "Buy yourself some coffee! ☕",
        timestamp: ~U[2024-01-11 12:30:00Z]
      }
    ]
  end

  defp get_voice_options do
    [
      %{value: "default", label: "Default Voice"},
      %{value: "robotic", label: "Robotic"},
      %{value: "cheerful", label: "Cheerful"},
      %{value: "calm", label: "Calm"},
      %{value: "excited", label: "Excited"},
      %{value: "whisper", label: "Whisper"}
    ]
  end

  defp get_initial_form do
    %{
      donor_name: "",
      message: "",
      voice: "default"
    }
  end

  def render(assigns) do
    ~H"""
    <div class="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      <div class="container mx-auto px-4 py-8 max-w-6xl">
        <!-- Header -->
        <div class="text-center mb-12">
          <div class="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-6 flex items-center justify-center overflow-hidden">
            <%= if @user.avatar do %>
              <img
                src={@user.avatar}
                alt={@user.name}
                class="w-full h-full object-cover"
              />
            <% else %>
              <span class="text-3xl font-bold text-white">
                {@user.name |> String.first() |> String.upcase()}
              </span>
            <% end %>
          </div>
          <h1 class="text-4xl font-bold text-white mb-4">
            Support {@user.name}
          </h1>
          <p class="text-xl text-purple-200">
            Show your support with a donation
          </p>
        </div>

        <div class="grid lg:grid-cols-3 gap-8">
          <!-- Donation Form -->
          <div class="lg:col-span-2">
            <div class="bg-black/30 backdrop-blur rounded-xl p-8 border border-purple-500/30">
              <h2 class="text-2xl font-bold text-white mb-6">Make a Donation</h2>

              <form phx-submit="submit_donation" phx-change="update_form">
                <!-- Amount Selection -->
                <div class="mb-6">
                  <label class="block text-lg font-medium text-white mb-4">
                    Choose Amount
                  </label>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <%= for amount <- [5, 10, 25, 50] do %>
                      <button
                        type="button"
                        phx-click="select_amount"
                        phx-value-amount={amount}
                        class={[
                          "px-4 py-3 rounded-lg font-semibold transition-all",
                          if(@selected_amount == amount,
                            do: "bg-purple-600 text-white ring-2 ring-purple-400",
                            else: "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600"
                          )
                        ]}
                      >
                        ${amount}
                      </button>
                    <% end %>
                  </div>

                  <div class="flex items-center space-x-2">
                    <span class="text-white font-medium">$</span>
                    <input
                      type="number"
                      name="custom_amount"
                      value={@custom_amount}
                      phx-change="custom_amount_changed"
                      phx-value-amount=""
                      placeholder="Custom amount"
                      min="1"
                      max="1000"
                      class="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
    <!-- Donor Information -->
                <div class="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label class="block text-sm font-medium text-white mb-2">
                      Your Name (optional)
                    </label>
                    <input
                      type="text"
                      name="donation[donor_name]"
                      value={@donation_form.donor_name}
                      placeholder="Anonymous"
                      class="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-white mb-2">
                      Voice for Message
                    </label>
                    <select
                      name="donation[voice]"
                      class="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <%= for option <- @voice_options do %>
                        <option
                          value={option.value}
                          selected={@donation_form.voice == option.value}
                        >
                          {option.label}
                        </option>
                      <% end %>
                    </select>
                  </div>
                </div>
                
    <!-- Message -->
                <div class="mb-6">
                  <label class="block text-sm font-medium text-white mb-2">
                    Message (optional)
                  </label>
                  <textarea
                    name="donation[message]"
                    rows="4"
                    value={@donation_form.message}
                    placeholder="Leave a nice message..."
                    class="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  ></textarea>
                  <p class="text-sm text-gray-400 mt-1">
                    Your message will be read aloud with the selected voice
                  </p>
                </div>
                
    <!-- Submit Button -->
                <div class="text-center">
                  <button
                    type="submit"
                    disabled={@processing}
                    class={[
                      "px-8 py-4 rounded-lg font-bold text-lg transition-all",
                      if(@processing,
                        do: "bg-gray-600 text-gray-300 cursor-not-allowed",
                        else:
                          "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-purple-500/25"
                      )
                    ]}
                  >
                    <%= if @processing do %>
                      Processing...
                    <% else %>
                      <%= case get_donation_amount(assigns) do %>
                        <% nil -> %>
                          Select Amount to Donate
                        <% amount -> %>
                          Donate ${amount}
                      <% end %>
                    <% end %>
                  </button>
                </div>
              </form>
            </div>
          </div>
          
    <!-- Top Donors Sidebar -->
          <div class="lg:col-span-1">
            <div class="bg-black/30 backdrop-blur rounded-xl p-6 border border-purple-500/30">
              <h3 class="text-xl font-bold text-white mb-6 flex items-center">
                <.icon name="hero-trophy" class="w-6 h-6 text-yellow-400 mr-2" /> Top Donors
              </h3>

              <div class="space-y-4">
                <%= for {donor, index} <- Enum.with_index(@top_donors) do %>
                  <div class="flex items-start space-x-3">
                    <div class={[
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      case index do
                        0 -> "bg-yellow-500 text-black"
                        1 -> "bg-gray-400 text-black"
                        2 -> "bg-amber-600 text-white"
                        _ -> "bg-purple-600 text-white"
                      end
                    ]}>
                      {index + 1}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between">
                        <p class="text-white font-medium truncate">{donor.name}</p>
                        <span class="text-green-400 font-bold">${donor.amount}</span>
                      </div>
                      <p class="text-purple-200 text-sm truncate">{donor.message}</p>
                      <p class="text-gray-400 text-xs">
                        {Calendar.strftime(donor.timestamp, "%b %d")}
                      </p>
                    </div>
                  </div>
                <% end %>
              </div>

              <div class="mt-6 pt-6 border-t border-gray-700">
                <p class="text-center text-gray-400 text-sm">
                  Thank you to all supporters! 💜
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    """
  end
end
