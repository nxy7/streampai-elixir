import { Title } from "@solidjs/meta";
import { useParams } from "@solidjs/router";
import { Show, createSignal, createEffect, createMemo, For } from "solid-js";
import { graphql } from "gql.tada";
import { client } from "~/lib/urql";
import { createUserPreferencesCollection, type UserPreferences } from "~/lib/electric";
import { useLiveQuery } from "@tanstack/solid-db";
import { createLocalStorageStore } from "~/lib/useLocalStorage";
import LoadingIndicator from "~/components/LoadingIndicator";

const GET_USER_BY_NAME = graphql(`
  query GetPublicProfile($username: String!) {
    publicProfile(username: $username) {
      id
      name
      displayAvatar
    }
  }
`);

type StreamerPrefs = {
  selectedAmount: number | null;
  customAmount: string;
  message: string;
};

export default function DonationPage() {
  const params = useParams<{ username: string }>();
  const [userId, setUserId] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [graphqlDone, setGraphqlDone] = createSignal(false);

  const [preferencesCollection, setPreferencesCollection] = createSignal<ReturnType<typeof createUserPreferencesCollection> | null>(null);

  // Global donor info (same across all streamers)
  const [donorInfo, setDonorInfo] = createLocalStorageStore("donor_info", {
    name: "",
    email: "",
  });

  // Per-streamer preferences (amount, message)
  const [streamerPrefs, setStreamerPrefs] = createLocalStorageStore<Record<string, StreamerPrefs>>("donation_streamer_prefs", {});

  createEffect(async () => {
    const username = params.username;
    if (!username) {
      setError("Invalid username");
      setGraphqlDone(true);
      return;
    }

    try {
      const result = await client.query(GET_USER_BY_NAME, { username });

      if (result.error) {
        setError("User not found");
        setGraphqlDone(true);
        return;
      }

      const user = result.data?.publicProfile;
      if (!user) {
        setError("User not found");
        setGraphqlDone(true);
        return;
      }

      setUserId(user.id);
      setPreferencesCollection(createUserPreferencesCollection(user.id));
      setGraphqlDone(true);
    } catch (e) {
      console.error("Error fetching user:", e);
      setError("Failed to load user");
      setGraphqlDone(true);
    }
  });

  const prefsQuery = () => {
    const collection = preferencesCollection();
    if (!collection) return null;
    return useLiveQuery(() => collection);
  };

  const prefs = () => {
    const query = prefsQuery();
    if (!query) return null;
    const data = query.data;
    return data?.[0] ?? null;
  };

  // Single loading state: wait for GraphQL + Electric (unless error)
  const isReady = () => {
    // Must have completed GraphQL
    if (!graphqlDone()) return false;
    // If there's an error, we're ready to show error page
    if (error()) return true;
    // Otherwise wait for Electric data
    const query = prefsQuery();
    if (!query) return false;
    // Check if query has loaded (isLoading is false or data exists)
    return !(query.isLoading?.() ?? true) || prefs() !== null;
  };

  // Use Electric-synced values for real-time updates
  const userName = () => prefs()?.name ?? null;
  const userAvatar = () => prefs()?.avatar_url ?? null;

  // Get current streamer's preferences
  const currentStreamerPrefs = createMemo(() => {
    const id = userId();
    if (!id) return { selectedAmount: null, customAmount: "", message: "" };
    return streamerPrefs[id] ?? { selectedAmount: null, customAmount: "", message: "" };
  });

  // Update current streamer's preferences
  const updateStreamerPrefs = (updates: Partial<StreamerPrefs>) => {
    const id = userId();
    if (!id) return;
    const current = streamerPrefs[id] ?? { selectedAmount: null, customAmount: "", message: "" };
    setStreamerPrefs(id, { ...current, ...updates });
  };

  // Invalidate preset selection when user preferences change and amount is out of range
  // Note: We only invalidate preset amounts, not custom amounts, to allow typing
  createEffect(() => {
    const userPrefs = prefs();
    const id = userId();
    if (!userPrefs || !id) return;

    const current = streamerPrefs[id];
    if (!current) return;

    const min = userPrefs.min_donation_amount ?? 0;
    const max = userPrefs.max_donation_amount;

    // Check if selected preset amount is now out of range
    if (current.selectedAmount !== null) {
      const isOutOfRange = current.selectedAmount < min || (max !== null && current.selectedAmount > max);
      if (isOutOfRange) {
        setStreamerPrefs(id, { ...current, selectedAmount: null });
      }
    }
    // Custom amounts are validated via isValidAmount() - we don't clear them
    // to allow users to type freely (e.g., typing "10" requires first typing "1")
  });

  const presetAmounts = () => {
    const userPrefs = prefs();
    const min = userPrefs?.min_donation_amount ?? 1;
    const max = userPrefs?.max_donation_amount ?? 1000;

    const amounts = [5, 10, 25, 50, 100, 250];
    return amounts.filter((a) => a >= min && a <= max);
  };

  const currency = () => prefs()?.donation_currency ?? "USD";

  const getCurrencySymbol = (curr: string) => {
    const symbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      CAD: "C$",
      AUD: "A$",
    };
    return symbols[curr] ?? curr;
  };

  const finalAmount = () => {
    const streamerPref = currentStreamerPrefs();
    if (streamerPref.selectedAmount !== null && streamerPref.selectedAmount > 0) {
      return streamerPref.selectedAmount;
    }
    const custom = parseFloat(streamerPref.customAmount);
    // Only return positive custom amounts
    return isNaN(custom) || custom <= 0 ? null : custom;
  };

  const isValidAmount = () => {
    const amount = finalAmount();
    if (amount === null || amount <= 0) return false;

    const userPrefs = prefs();
    const min = userPrefs?.min_donation_amount ?? 1;
    const max = userPrefs?.max_donation_amount;

    if (amount < min) return false;
    if (max !== null && max !== undefined && amount > max) return false;
    return true;
  };

  const handleDonate = () => {
    if (!isValidAmount()) return;
    // Payment integration will be added later
    alert(`Donation of ${getCurrencySymbol(currency())}${finalAmount()} will be processed. Payment integration coming soon!`);
  };

  return (
    <>
      <Title>{userName() ? `Support ${userName()}` : "Donation Page"} - Streampai</Title>

      <Show
        when={isReady()}
        fallback={<LoadingIndicator />}
      >
        <div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
          <Show
            when={!error()}
            fallback={
              <div class="flex items-center justify-center min-h-screen">
                <div class="text-center">
                  <div class="text-6xl mb-4">😕</div>
                  <h1 class="text-2xl font-bold text-white mb-2">User Not Found</h1>
                  <p class="text-gray-300">
                    The user "{params.username}" doesn't exist or has been removed.
                  </p>
                  <a
                    href="/"
                    class="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                  >
                    Go Home
                  </a>
                </div>
              </div>
            }
          >
            <div class="max-w-2xl mx-auto px-4 py-12">
              {/* User Header */}
              <div class="text-center mb-8">
                <div class="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
                  <Show
                    when={userAvatar()}
                    fallback={
                      <span class="text-white font-bold text-3xl">
                        {userName()?.[0]?.toUpperCase() || "?"}
                      </span>
                    }
                  >
                    <img
                      src={userAvatar()!}
                      alt={userName() ?? "User"}
                      class="w-full h-full object-cover"
                    />
                  </Show>
                </div>
                <h1 class="text-3xl font-bold text-white mb-2">
                  Support {userName()}
                </h1>
                <p class="text-gray-300">
                  Send a donation to show your appreciation!
                </p>
              </div>

              {/* Donation Card */}
              <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
                {/* Amount Selection */}
                <div class="mb-6">
                  <label class="block text-white font-medium mb-3">
                    Select Amount ({currency()})
                  </label>
                  <div class="grid grid-cols-3 gap-3 mb-4">
                    <For each={presetAmounts()}>
                      {(amount) => (
                        <button
                          type="button"
                          onClick={() => {
                            updateStreamerPrefs({ selectedAmount: amount, customAmount: "" });
                          }}
                          class={`py-3 px-4 rounded-lg font-semibold transition-all ${
                            currentStreamerPrefs().selectedAmount === amount
                              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                              : "bg-white/20 text-white hover:bg-white/30"
                          }`}
                        >
                          {getCurrencySymbol(currency())}{amount}
                        </button>
                      )}
                    </For>
                  </div>

                  {/* Custom Amount */}
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {getCurrencySymbol(currency())}
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Custom amount"
                      value={currentStreamerPrefs().customAmount}
                      onBeforeInput={(e) => {
                        // Block non-numeric input except decimal point
                        const data = e.data;
                        if (data && !/^[\d.]$/.test(data)) {
                          e.preventDefault();
                        }
                        // Block multiple decimal points
                        if (data === "." && currentStreamerPrefs().customAmount.includes(".")) {
                          e.preventDefault();
                        }
                      }}
                      onInput={(e) => {
                        const value = e.currentTarget.value;
                        // Filter to only valid characters (handles paste)
                        const filtered = value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
                        if (filtered !== value) {
                          e.currentTarget.value = filtered;
                        }
                        updateStreamerPrefs({ customAmount: filtered, selectedAmount: null });
                      }}
                      class="w-full bg-white/20 border border-white/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <Show when={prefs()?.min_donation_amount || prefs()?.max_donation_amount}>
                    <p class="text-gray-400 text-sm mt-2">
                      <Show when={prefs()?.min_donation_amount}>
                        Min: {getCurrencySymbol(currency())}{prefs()?.min_donation_amount}
                      </Show>
                      <Show when={prefs()?.min_donation_amount && prefs()?.max_donation_amount}>
                        {" • "}
                      </Show>
                      <Show when={prefs()?.max_donation_amount}>
                        Max: {getCurrencySymbol(currency())}{prefs()?.max_donation_amount}
                      </Show>
                    </p>
                  </Show>

                  {/* Show error when amount is out of range */}
                  <Show when={finalAmount() !== null && !isValidAmount()}>
                    <p class="text-red-400 text-sm mt-2">
                      Amount must be between {getCurrencySymbol(currency())}{prefs()?.min_donation_amount ?? 1}
                      {prefs()?.max_donation_amount ? ` and ${getCurrencySymbol(currency())}${prefs()?.max_donation_amount}` : ""}
                    </p>
                  </Show>
                </div>

                {/* Donor Name (global) */}
                <div class="mb-6">
                  <label class="block text-white font-medium mb-2">
                    Your Name (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Anonymous"
                    value={donorInfo.name}
                    onInput={(e) => setDonorInfo("name", e.currentTarget.value)}
                    class="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Donor Email (global) */}
                <div class="mb-6">
                  <label class="block text-white font-medium mb-2">
                    Your Email (for receipt)
                  </label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={donorInfo.email}
                    onInput={(e) => setDonorInfo("email", e.currentTarget.value)}
                    class="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Message (per-streamer) */}
                <div class="mb-6">
                  <label class="block text-white font-medium mb-2">
                    Message (optional)
                  </label>
                  <textarea
                    placeholder="Say something nice..."
                    value={currentStreamerPrefs().message}
                    onInput={(e) => updateStreamerPrefs({ message: e.currentTarget.value })}
                    rows={3}
                    class="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>

                {/* Donate Button */}
                <button
                  type="button"
                  onClick={handleDonate}
                  disabled={!isValidAmount()}
                  class={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
                    isValidAmount()
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl"
                      : "bg-gray-600 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Show
                    when={finalAmount()}
                    fallback="Select an amount"
                  >
                    Donate {getCurrencySymbol(currency())}{finalAmount()}
                  </Show>
                </button>

                <p class="text-center text-gray-400 text-sm mt-4">
                  Powered by Streampai
                </p>
              </div>
            </div>
          </Show>
        </div>
      </Show>
    </>
  );
}
