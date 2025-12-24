import { Title } from "@solidjs/meta";
import { Show, For, createSignal, createEffect, createMemo } from "solid-js";
import { useCurrentUser, getLoginUrl } from "~/lib/auth";
import { button, card, text, input } from "~/styles/design-system";
import { graphql } from "gql.tada";
import { client } from "~/lib/urql";
import { useUserPreferencesForUser, useUserRolesData, type UserRole } from "~/lib/useElectric";

const REQUEST_FILE_UPLOAD = graphql(`
  mutation RequestFileUpload($filename: String!, $contentType: String, $fileType: String!, $estimatedSize: Int!) {
    requestFileUpload(filename: $filename, contentType: $contentType, fileType: $fileType, estimatedSize: $estimatedSize) {
      id
      uploadUrl
      uploadHeaders {
        key
        value
      }
      maxSize
    }
  }
`);

const CONFIRM_FILE_UPLOAD = graphql(`
  mutation ConfirmFileUpload($fileId: ID!) {
    confirmFileUpload(fileId: $fileId) {
      id
      url
    }
  }
`);

const UPDATE_AVATAR = graphql(`
  mutation UpdateAvatar($id: ID!, $fileId: ID!) {
    updateAvatar(id: $id, input: { fileId: $fileId }) {
      result {
        id
        displayAvatar
      }
      errors {
        message
      }
    }
  }
`);

const SAVE_DONATION_SETTINGS = graphql(`
  mutation SaveDonationSettings($minAmount: Int, $maxAmount: Int, $currency: String, $defaultVoice: String) {
    saveDonationSettings(minAmount: $minAmount, maxAmount: $maxAmount, currency: $currency, defaultVoice: $defaultVoice) {
      userId
      emailNotifications
      minDonationAmount
      maxDonationAmount
      donationCurrency
      defaultVoice
      updatedAt
    }
  }
`);

const TOGGLE_EMAIL_NOTIFICATIONS = graphql(`
  mutation ToggleEmailNotifications {
    toggleEmailNotifications {
      userId
      emailNotifications
      updatedAt
    }
  }
`);

const UPDATE_NAME = graphql(`
  mutation UpdateName($name: String!) {
    updateName(name: $name) {
      id
      name
    }
  }
`);

// User lookup for role management (to get user details like name and avatar)
const LOOKUP_USER_BY_NAME = graphql(`
  query LookupUserByName($name: String!) {
    userByName(name: $name) {
      id
      name
      displayAvatar
    }
  }
`);

// User info lookup by ID (for enriching Electric sync role data)
const GET_USER_INFO = graphql(`
  query GetUserInfo($id: String!) {
    userInfo(id: $id) {
      id
      name
      displayAvatar
    }
  }
`);

const GET_PUBLIC_PROFILE = graphql(`
  query GetPublicProfile($username: String!) {
    publicProfile(username: $username) {
      id
      name
    }
  }
`);

// Role Management Mutations
const INVITE_USER_ROLE = graphql(`
  mutation InviteUserRole($input: InviteUserRoleInput!) {
    inviteUserRole(input: $input) {
      result {
        id
        roleType
        roleStatus
      }
      errors {
        message
      }
    }
  }
`);

const ACCEPT_ROLE_INVITATION = graphql(`
  mutation AcceptRoleInvitation($id: ID!) {
    acceptRoleInvitation(id: $id) {
      result {
        id
        roleStatus
      }
      errors {
        message
      }
    }
  }
`);

const DECLINE_ROLE_INVITATION = graphql(`
  mutation DeclineRoleInvitation($id: ID!) {
    declineRoleInvitation(id: $id) {
      result {
        id
        roleStatus
      }
      errors {
        message
      }
    }
  }
`);

const REVOKE_USER_ROLE = graphql(`
  mutation RevokeUserRole($id: ID!) {
    revokeUserRole(id: $id) {
      result {
        id
        revokedAt
      }
      errors {
        message
      }
    }
  }
`);

// User info cache type
type UserInfo = { id: string; name: string; displayAvatar: string | null };

export default function Settings() {
  const { user, isLoading } = useCurrentUser();
  const prefs = useUserPreferencesForUser(() => user()?.id);
  const rolesData = useUserRolesData(() => user()?.id);
  const [isUploading, setIsUploading] = createSignal(false);
  const [uploadError, setUploadError] = createSignal<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = createSignal(false);
  let fileInputRef: HTMLInputElement | undefined;

  // Donation settings form state
  const [minAmount, setMinAmount] = createSignal<number | null>(null);
  const [maxAmount, setMaxAmount] = createSignal<number | null>(null);
  const [currency, setCurrency] = createSignal("USD");
  const [defaultVoice, setDefaultVoice] = createSignal("random");
  const [isSavingSettings, setIsSavingSettings] = createSignal(false);
  const [saveError, setSaveError] = createSignal<string | null>(null);
  const [saveSuccess, setSaveSuccess] = createSignal(false);

  // Display name state
  const [displayName, setDisplayName] = createSignal("");
  const [isUpdatingName, setIsUpdatingName] = createSignal(false);
  const [nameError, setNameError] = createSignal<string | null>(null);
  const [nameSuccess, setNameSuccess] = createSignal(false);

  // Email notifications state
  const [isTogglingNotifications, setIsTogglingNotifications] = createSignal(false);

  // Role management state (Electric SQL synced)
  const [inviteUsername, setInviteUsername] = createSignal("");
  const [inviteRoleType, setInviteRoleType] = createSignal<"moderator" | "manager">("moderator");
  const [isInviting, setIsInviting] = createSignal(false);
  const [inviteError, setInviteError] = createSignal<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = createSignal(false);
  const [processingRoleId, setProcessingRoleId] = createSignal<string | null>(null);

  // User info cache for role display (granter/user names and avatars)
  const [userInfoCache, setUserInfoCache] = createSignal<Map<string, UserInfo>>(new Map());

  // Fetch user info for a given user ID (used to enrich role data)
  const fetchUserInfo = async (userId: string): Promise<UserInfo | null> => {
    const cached = userInfoCache().get(userId);
    if (cached) return cached;

    try {
      const result = await client.query(GET_USER_INFO, { id: userId }, { fetchOptions: { credentials: "include" } });
      if (result.data?.userInfo) {
        const info: UserInfo = {
          id: result.data.userInfo.id,
          name: result.data.userInfo.name,
          displayAvatar: result.data.userInfo.displayAvatar,
        };
        setUserInfoCache((prev) => new Map(prev).set(userId, info));
        return info;
      }
    } catch (e) {
      console.error("Failed to fetch user info:", e);
    }
    return null;
  };

  // Derived state from Electric sync with user info enrichment
  const pendingInvitations = createMemo(() => rolesData.data().pendingInvitations);
  const myRoles = createMemo(() => rolesData.data().myAcceptedRoles);
  const rolesIGranted = createMemo(() => rolesData.data().rolesIGranted);
  const pendingInvitationsSent = createMemo(() => rolesData.data().pendingInvitationsSent);
  const loadingRoles = createMemo(() => rolesData.isLoading());

  // Load user info for all roles when roles change
  createEffect(() => {
    const allRoles = [...pendingInvitations(), ...myRoles(), ...rolesIGranted(), ...pendingInvitationsSent()];
    const userIds = new Set<string>();

    for (const role of allRoles) {
      userIds.add(role.user_id);
      userIds.add(role.granter_id);
    }

    // Fetch info for any users we don't have cached
    for (const userId of userIds) {
      if (!userInfoCache().has(userId)) {
        fetchUserInfo(userId);
      }
    }
  });

  // Helper to get user info from cache
  const getUserInfo = (userId: string): UserInfo | null => {
    return userInfoCache().get(userId) || null;
  };

  // Track if we've initialized form state from preferences
  const [formInitialized, setFormInitialized] = createSignal(false);

  // Populate form state from Electric preferences when they load
  createEffect(() => {
    const data = prefs.data();
    if (data && !formInitialized()) {
      setMinAmount(data.min_donation_amount);
      setMaxAmount(data.max_donation_amount);
      setCurrency(data.donation_currency || "USD");
      setDefaultVoice(data.default_voice || "random");
      setDisplayName(data.name || "");
      setFormInitialized(true);
    }
  });

  const handleSaveDonationSettings = async (e: Event) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const result = await client.mutation(SAVE_DONATION_SETTINGS, {
        minAmount: minAmount(),
        maxAmount: maxAmount(),
        currency: currency(),
        defaultVoice: defaultVoice(),
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Save donation settings error:", error);
      setSaveError(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleUpdateName = async () => {
    const name = displayName().trim();
    if (!name) {
      setNameError("Name is required");
      return;
    }

    setIsUpdatingName(true);
    setNameError(null);
    setNameSuccess(false);

    try {
      const result = await client.mutation(UPDATE_NAME, { name });

      if (result.error) {
        throw new Error(result.error.message);
      }

      setNameSuccess(true);
      setDisplayName(""); // Clear local override so Electric-synced value shows
      setTimeout(() => setNameSuccess(false), 3000);
    } catch (error) {
      console.error("Update name error:", error);
      setNameError(error instanceof Error ? error.message : "Failed to update name");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleToggleEmailNotifications = async () => {
    setIsTogglingNotifications(true);

    try {
      const result = await client.mutation(TOGGLE_EMAIL_NOTIFICATIONS, {});

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error("Toggle notifications error:", error);
    } finally {
      setIsTogglingNotifications(false);
    }
  };

  const handleInviteUser = async (e: Event) => {
    e.preventDefault();
    const currentUser = user();
    if (!currentUser) return;

    const username = inviteUsername().trim();
    if (!username) {
      setInviteError("Please enter a username");
      return;
    }

    setIsInviting(true);
    setInviteError(null);
    setInviteSuccess(false);

    try {
      // First lookup the user by name
      const lookupResult = await client.query(LOOKUP_USER_BY_NAME, { name: username }, { fetchOptions: { credentials: "include" } });

      if (!lookupResult.data?.userByName) {
        throw new Error(`User "${username}" not found`);
      }

      const targetUser = lookupResult.data.userByName;

      if (targetUser.id === currentUser.id) {
        throw new Error("You cannot invite yourself");
      }

      // Send the invitation
      const result = await client.mutation(INVITE_USER_ROLE, {
        input: {
          userId: targetUser.id,
          granterId: currentUser.id,
          roleType: inviteRoleType(),
        },
      }, { fetchOptions: { credentials: "include" } });

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (result.data?.inviteUserRole?.errors?.length > 0) {
        throw new Error(result.data.inviteUserRole.errors[0].message);
      }

      setInviteSuccess(true);
      setInviteUsername("");
      setTimeout(() => setInviteSuccess(false), 3000);
      // Electric sync will automatically update the roles data
    } catch (error) {
      console.error("Invite error:", error);
      setInviteError(error instanceof Error ? error.message : "Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const handleAcceptInvitation = async (roleId: string) => {
    setProcessingRoleId(roleId);
    try {
      const result = await client.mutation(ACCEPT_ROLE_INVITATION, { id: roleId }, { fetchOptions: { credentials: "include" } });

      if (result.error) {
        throw new Error(result.error.message);
      }
      // Electric sync will automatically update
    } catch (error) {
      console.error("Accept invitation error:", error);
    } finally {
      setProcessingRoleId(null);
    }
  };

  const handleDeclineInvitation = async (roleId: string) => {
    setProcessingRoleId(roleId);
    try {
      const result = await client.mutation(DECLINE_ROLE_INVITATION, { id: roleId }, { fetchOptions: { credentials: "include" } });

      if (result.error) {
        throw new Error(result.error.message);
      }
      // Electric sync will automatically update
    } catch (error) {
      console.error("Decline invitation error:", error);
    } finally {
      setProcessingRoleId(null);
    }
  };

  const handleRevokeRole = async (roleId: string) => {
    if (!confirm("Are you sure you want to revoke this role?")) return;

    setProcessingRoleId(roleId);
    try {
      const result = await client.mutation(REVOKE_USER_ROLE, { id: roleId }, { fetchOptions: { credentials: "include" } });

      if (result.error) {
        throw new Error(result.error.message);
      }
      // Electric sync will automatically update
    } catch (error) {
      console.error("Revoke role error:", error);
    } finally {
      setProcessingRoleId(null);
    }
  };

  const formatRoleType = (roleType: string) => {
    return roleType.charAt(0).toUpperCase() + roleType.slice(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleAvatarUpload = async (file: File) => {
    const currentUser = user();
    if (!currentUser) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      // Step 1: Request presigned upload URL
      const requestResult = await client.mutation(REQUEST_FILE_UPLOAD, {
        filename: file.name,
        contentType: file.type,
        fileType: "avatar",
        estimatedSize: file.size,
      });

      if (requestResult.error || !requestResult.data?.requestFileUpload) {
        throw new Error(requestResult.error?.message || "Failed to get upload URL");
      }

      const { id: fileId, uploadUrl, uploadHeaders } = requestResult.data.requestFileUpload;

      // Step 2: Upload directly to S3
      const headers: Record<string, string> = {};
      for (const header of uploadHeaders) {
        headers[header.key] = header.value;
      }

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers,
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      // Step 3: Confirm upload
      const confirmResult = await client.mutation(CONFIRM_FILE_UPLOAD, {
        fileId,
      });

      if (confirmResult.error || !confirmResult.data?.confirmFileUpload) {
        throw new Error(confirmResult.error?.message || "Failed to confirm upload");
      }

      // Step 4: Update user avatar
      const updateResult = await client.mutation(UPDATE_AVATAR, {
        id: currentUser.id,
        fileId,
      });

      if (updateResult.error || updateResult.data?.updateAvatar?.errors?.length > 0) {
        const errorMsg = updateResult.data?.updateAvatar?.errors?.[0]?.message || updateResult.error?.message || "Failed to update avatar";
        throw new Error(errorMsg);
      }

      setUploadSuccess(true);
    } catch (error) {
      console.error("Avatar upload error:", error);
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setUploadError("Please select an image file");
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("File size must be less than 5MB");
        return;
      }
      handleAvatarUpload(file);
    }
  };

  const platformConnections = [
    {
      name: "Twitch",
      platform: "twitch",
      connected: false,
      color: "from-purple-600 to-purple-700",
    },
    {
      name: "YouTube",
      platform: "youtube",
      connected: false,
      color: "from-red-600 to-red-700",
    },
    {
      name: "Facebook",
      platform: "facebook",
      connected: false,
      color: "from-blue-600 to-blue-700",
    },
    {
      name: "Kick",
      platform: "kick",
      connected: false,
      color: "from-green-600 to-green-700",
    },
  ];

  const currencies = ["USD", "EUR", "GBP", "CAD", "AUD"];

  return (
    <>
      <Title>Settings - Streampai</Title>
      <Show
        when={!isLoading()}
        fallback={
          <div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            <div class="text-white text-xl">Loading...</div>
          </div>
        }
      >
        <Show
          when={user()}
          fallback={
            <div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
              <div class="text-center py-12">
                <h2 class="text-2xl font-bold text-white mb-4">
                  Not Authenticated
                </h2>
                <p class="text-gray-300 mb-6">
                  Please sign in to access settings.
                </p>
                <a
                  href={getLoginUrl()}
                  class="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  Sign In
                </a>
              </div>
            </div>
          }
        >
          <>
            <div class="max-w-6xl mx-auto space-y-6">
              {/* Subscription Widget Placeholder */}
              <div class="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-sm p-6 text-white">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-xl font-bold mb-2">Free Plan</h3>
                    <p class="text-purple-100">
                      Get started with basic features
                    </p>
                  </div>
                  <button class="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-colors">
                    Upgrade to Pro
                  </button>
                </div>
              </div>

              {/* Account Settings */}
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-6">
                  Account Settings
                </h3>
                <div class="space-y-6">
                  {/* Email */}
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user()?.email || ""}
                      class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                      readonly
                    />
                    <p class="text-xs text-gray-500 mt-1">
                      Your email address cannot be changed
                    </p>
                  </div>

                  {/* Display Name */}
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Display Name
                    </label>
                    <div class="relative">
                      <input
                        type="text"
                        value={displayName() || prefs.data()?.name || ""}
                        onInput={(e) => setDisplayName(e.currentTarget.value)}
                        placeholder="Enter display name"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10"
                      />
                    </div>
                    <p class="text-xs text-gray-500 mt-1">
                      Name must be 3-30 characters and contain only letters,
                      numbers, and underscores
                    </p>
                    <div class="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleUpdateName}
                        disabled={isUpdatingName()}
                        class={`bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors text-sm ${
                          isUpdatingName() ? "opacity-50 cursor-not-allowed" : "hover:bg-purple-700"
                        }`}
                      >
                        {isUpdatingName() ? "Updating..." : "Update Name"}
                      </button>
                      <Show when={nameSuccess()}>
                        <span class="text-green-600 text-sm">Name updated!</span>
                      </Show>
                      <Show when={nameError()}>
                        <span class="text-red-600 text-sm">{nameError()}</span>
                      </Show>
                    </div>
                  </div>

                  {/* Avatar Upload Section */}
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Profile Avatar
                    </label>
                    <div class="flex items-center space-x-4">
                      <div class="relative w-20 h-20">
                        <div class="w-20 h-20 bg-linear-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
                          <Show
                            when={prefs.data()?.avatar_url}
                            fallback={
                              <span class="text-white font-bold text-2xl">
                                {prefs.data()?.name?.[0]?.toUpperCase() || "U"}
                              </span>
                            }
                          >
                            <img
                              src={prefs.data()!.avatar_url!}
                              alt="Avatar"
                              class="w-full h-full object-cover"
                            />
                          </Show>
                        </div>
                        <Show when={isUploading()}>
                          <div class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                            <div class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        </Show>
                      </div>
                      <div class="flex-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          class="hidden"
                          id="avatar-upload"
                          onChange={handleFileSelect}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef?.click()}
                          disabled={isUploading()}
                          class={`bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors text-sm ${
                            isUploading() ? "opacity-50 cursor-not-allowed" : "hover:bg-purple-700"
                          }`}
                        >
                          {isUploading() ? "Uploading..." : "Upload New Avatar"}
                        </button>
                        <p class="text-xs text-gray-500 mt-1">
                          JPG, PNG or GIF. Max size 5MB. Recommended: 256x256px
                        </p>
                        <Show when={uploadError()}>
                          <p class="text-xs text-red-600 mt-1">{uploadError()}</p>
                        </Show>
                        <Show when={uploadSuccess()}>
                          <p class="text-xs text-green-600 mt-1">Avatar updated successfully!</p>
                        </Show>
                      </div>
                    </div>
                  </div>

                  {/* Streaming Platforms */}
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Streaming Platforms
                    </label>
                    <div class="space-y-2">
                      <For each={platformConnections}>
                        {(connection) => (
                          <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div class="flex items-center space-x-3">
                              <div
                                class={`w-10 h-10 bg-gradient-to-r ${connection.color} rounded-lg flex items-center justify-center`}
                              >
                                <span class="text-white font-bold text-sm">
                                  {connection.name[0]}
                                </span>
                              </div>
                              <div>
                                <p class="font-medium text-gray-900">
                                  {connection.name}
                                </p>
                                <p class="text-sm text-gray-500">
                                  {connection.connected
                                    ? "Connected"
                                    : "Not connected"}
                                </p>
                              </div>
                            </div>
                            <button
                              class={
                                connection.connected
                                  ? "text-red-600 hover:text-red-700 text-sm font-medium"
                                  : "bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                              }
                            >
                              {connection.connected ? "Disconnect" : "Connect"}
                            </button>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                </div>
              </div>

              {/* Donation Page */}
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-6">
                  Donation Page
                </h3>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Public Donation URL
                    </label>
                    <div class="flex items-center space-x-3">
                      <input
                        type="text"
                        value={`${window.location.origin}/u/${prefs.data()?.name || ""}`}
                        class="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                        readonly
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/u/${prefs.data()?.name || ""}`);
                        }}
                        class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                      >
                        Copy URL
                      </button>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">
                      Share this link with your viewers so they can support you
                      with donations
                    </p>
                  </div>

                  <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div class="flex items-center space-x-3">
                      <div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
                        <Show
                          when={prefs.data()?.avatar_url}
                          fallback={
                            <span class="text-white font-bold">
                              {prefs.data()?.name?.[0]?.toUpperCase() || "U"}
                            </span>
                          }
                        >
                          <img
                            src={prefs.data()!.avatar_url!}
                            alt="Avatar"
                            class="w-10 h-10 rounded-full object-cover"
                          />
                        </Show>
                      </div>
                      <div>
                        <h4 class="font-medium text-gray-900">
                          Support {prefs.data()?.name}
                        </h4>
                        <p class="text-sm text-gray-600">
                          Public donation page
                        </p>
                      </div>
                    </div>
                    <a
                      href={`/u/${prefs.data()?.name || ""}`}
                      target="_blank"
                      class="text-purple-600 hover:text-purple-700 font-medium text-sm"
                    >
                      Preview →
                    </a>
                  </div>
                </div>
              </div>

              {/* Donation Settings */}
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-6">
                  Donation Settings
                </h3>
                <form class="space-y-4" onSubmit={handleSaveDonationSettings}>
                  <div class="grid md:grid-cols-3 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Amount
                      </label>
                      <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span class="text-gray-500 text-sm">{currency()}</span>
                        </div>
                        <input
                          type="number"
                          placeholder="No minimum"
                          value={minAmount() ?? ""}
                          onInput={(e) => {
                            const val = e.currentTarget.value;
                            setMinAmount(val ? parseInt(val, 10) : null);
                          }}
                          class="w-full border border-gray-300 rounded-lg pl-12 pr-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <p class="text-xs text-gray-500 mt-1">
                        Leave empty for no minimum
                      </p>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Amount
                      </label>
                      <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span class="text-gray-500 text-sm">{currency()}</span>
                        </div>
                        <input
                          type="number"
                          placeholder="No maximum"
                          value={maxAmount() ?? ""}
                          onInput={(e) => {
                            const val = e.currentTarget.value;
                            setMaxAmount(val ? parseInt(val, 10) : null);
                          }}
                          class="w-full border border-gray-300 rounded-lg pl-12 pr-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <p class="text-xs text-gray-500 mt-1">
                        Leave empty for no maximum
                      </p>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        value={currency()}
                        onChange={(e) => setCurrency(e.currentTarget.value)}
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <For each={currencies}>
                          {(curr) => (
                            <option value={curr}>{curr}</option>
                          )}
                        </For>
                      </select>
                    </div>
                  </div>

                  {/* Default TTS Voice */}
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Default TTS Voice
                    </label>
                    <select
                      value={defaultVoice()}
                      onChange={(e) => setDefaultVoice(e.currentTarget.value)}
                      class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="random">
                        Random (different voice each time)
                      </option>
                      <option value="google_en_us_male">
                        Google TTS - English (US) Male
                      </option>
                      <option value="google_en_us_female">
                        Google TTS - English (US) Female
                      </option>
                    </select>
                    <p class="text-xs text-gray-500 mt-1">
                      This voice will be used when donors don't select a voice,
                      and for donations from streaming platforms
                    </p>
                  </div>

                  {/* Info box */}
                  <div class="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <svg
                      class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div class="text-sm text-blue-800">
                      <p class="font-medium mb-1">How donation limits work:</p>
                      <ul class="space-y-1 text-blue-700">
                        <li>
                          • Set limits to control the donation amounts your
                          viewers can send
                        </li>
                        <li>
                          • Both fields are optional - leave empty to allow any
                          amount
                        </li>
                        <li>
                          • Preset buttons and custom input will be filtered
                          based on your limits
                        </li>
                        <li>
                          • Changes apply immediately to your donation page
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div class="pt-4 flex items-center gap-4">
                    <button
                      type="submit"
                      disabled={isSavingSettings()}
                      class={`bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                        isSavingSettings() ? "opacity-50 cursor-not-allowed" : "hover:bg-purple-700"
                      }`}
                    >
                      {isSavingSettings() ? "Saving..." : "Save Donation Settings"}
                    </button>
                    <Show when={saveSuccess()}>
                      <span class="text-green-600 text-sm">Settings saved successfully!</span>
                    </Show>
                    <Show when={saveError()}>
                      <span class="text-red-600 text-sm">{saveError()}</span>
                    </Show>
                  </div>
                </form>
              </div>

              {/* Role Invitations */}
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-6">
                  Role Invitations
                </h3>
                <Show
                  when={!loadingRoles() && pendingInvitations().length > 0}
                  fallback={
                    <div class="text-center py-8 text-gray-500">
                      <svg
                        class="w-12 h-12 mx-auto mb-3 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <p class="text-sm">No pending role invitations</p>
                      <p class="text-xs text-gray-400 mt-1">
                        You'll see invitations here when streamers invite you to
                        moderate their channels
                      </p>
                    </div>
                  }
                >
                  <div class="space-y-3">
                    <For each={pendingInvitations()}>
                      {(invitation) => {
                        const granterInfo = () => getUserInfo(invitation.granter_id);
                        return (
                          <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div class="flex items-center gap-3">
                              <div class="w-10 h-10 bg-linear-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
                                <Show
                                  when={granterInfo()?.displayAvatar}
                                  fallback={
                                    <span class="text-white font-bold">
                                      {granterInfo()?.name?.[0]?.toUpperCase() || "?"}
                                    </span>
                                  }
                                >
                                  <img
                                    src={granterInfo()!.displayAvatar!}
                                    alt={granterInfo()?.name || "User"}
                                    class="w-full h-full object-cover"
                                  />
                                </Show>
                              </div>
                              <div>
                                <p class="font-medium text-gray-900">
                                  {granterInfo()?.name || "Loading..."}
                                </p>
                                <p class="text-sm text-gray-500">
                                  Invited you as <span class="font-medium text-purple-600">{formatRoleType(invitation.role_type)}</span>
                                </p>
                                <p class="text-xs text-gray-400">
                                  {formatDate(invitation.granted_at)}
                                </p>
                              </div>
                            </div>
                            <div class="flex gap-2">
                              <button
                                onClick={() => handleAcceptInvitation(invitation.id)}
                                disabled={processingRoleId() === invitation.id}
                                class="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                              >
                                {processingRoleId() === invitation.id ? "..." : "Accept"}
                              </button>
                              <button
                                onClick={() => handleDeclineInvitation(invitation.id)}
                                disabled={processingRoleId() === invitation.id}
                                class="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium disabled:opacity-50"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </Show>
              </div>

              {/* My Roles in Other Channels */}
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-6">
                  My Roles in Other Channels
                </h3>
                <Show
                  when={!loadingRoles() && myRoles().length > 0}
                  fallback={
                    <div class="text-center py-8 text-gray-500">
                      <svg
                        class="w-12 h-12 mx-auto mb-3 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                        />
                      </svg>
                      <p class="text-sm">
                        You don't have any roles in other channels
                      </p>
                      <p class="text-xs text-gray-400 mt-1">
                        Roles granted to you by other streamers will appear here
                      </p>
                    </div>
                  }
                >
                  <div class="space-y-3">
                    <For each={myRoles()}>
                      {(role) => {
                        const granterInfo = () => getUserInfo(role.granter_id);
                        return (
                          <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div class="flex items-center gap-3">
                              <div class="w-10 h-10 bg-linear-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
                                <Show
                                  when={granterInfo()?.displayAvatar}
                                  fallback={
                                    <span class="text-white font-bold">
                                      {granterInfo()?.name?.[0]?.toUpperCase() || "?"}
                                    </span>
                                  }
                                >
                                  <img
                                    src={granterInfo()!.displayAvatar!}
                                    alt={granterInfo()?.name || "User"}
                                    class="w-full h-full object-cover"
                                  />
                                </Show>
                              </div>
                              <div>
                                <p class="font-medium text-gray-900">
                                  {granterInfo()?.name || "Loading..."}'s channel
                                </p>
                                <p class="text-sm text-gray-500">
                                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    {formatRoleType(role.role_type)}
                                  </span>
                                </p>
                                <p class="text-xs text-gray-400 mt-1">
                                  Since {formatDate(role.accepted_at || role.granted_at)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </Show>
              </div>

              {/* Divider */}
              <div class="relative">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-gray-300"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-2 bg-gray-50 text-gray-500">
                    Channel Management
                  </span>
                </div>
              </div>

              {/* Role Management */}
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-6">
                  Role Management
                </h3>

                {/* Invite User Form */}
                <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 class="font-medium text-gray-900 mb-3">Invite User</h4>
                  <form class="space-y-3" onSubmit={handleInviteUser}>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <input
                          type="text"
                          placeholder="Enter username"
                          value={inviteUsername()}
                          onInput={(e) => setInviteUsername(e.currentTarget.value)}
                          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <select
                          value={inviteRoleType()}
                          onChange={(e) => setInviteRoleType(e.currentTarget.value as "moderator" | "manager")}
                          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        >
                          <option value="moderator">Moderator</option>
                          <option value="manager">Manager</option>
                        </select>
                      </div>
                      <div>
                        <button
                          type="submit"
                          disabled={isInviting()}
                          class={`w-full bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                            isInviting() ? "opacity-50 cursor-not-allowed" : "hover:bg-purple-700"
                          }`}
                        >
                          {isInviting() ? "Sending..." : "Send Invitation"}
                        </button>
                      </div>
                    </div>
                    <Show when={inviteError()}>
                      <p class="text-red-600 text-sm">{inviteError()}</p>
                    </Show>
                    <Show when={inviteSuccess()}>
                      <p class="text-green-600 text-sm">Invitation sent successfully!</p>
                    </Show>
                  </form>
                  <div class="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div class="flex">
                      <svg
                        class="w-5 h-5 text-blue-500 flex-shrink-0 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div class="text-sm text-blue-800">
                        <p class="font-medium">Role Permissions:</p>
                        <ul class="mt-1 text-blue-700 text-xs space-y-1">
                          <li>
                            • <strong>Moderator:</strong> Can moderate chat and
                            manage stream settings
                          </li>
                          <li>
                            • <strong>Manager:</strong> Can manage channel
                            operations and configurations
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pending Invitations Sent */}
                <Show when={!loadingRoles() && pendingInvitationsSent().length > 0}>
                  <div class="space-y-3 mb-6">
                    <h4 class="font-medium text-gray-700 text-sm">Pending Invitations</h4>
                    <For each={pendingInvitationsSent()}>
                      {(role) => {
                        const userInfo = () => getUserInfo(role.user_id);
                        return (
                          <div class="flex items-center justify-between p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                            <div class="flex items-center gap-3">
                              <div class="w-10 h-10 bg-linear-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center overflow-hidden">
                                <Show
                                  when={userInfo()?.displayAvatar}
                                  fallback={
                                    <span class="text-white font-bold">
                                      {userInfo()?.name?.[0]?.toUpperCase() || "?"}
                                    </span>
                                  }
                                >
                                  <img
                                    src={userInfo()!.displayAvatar!}
                                    alt={userInfo()?.name || "User"}
                                    class="w-full h-full object-cover"
                                  />
                                </Show>
                              </div>
                              <div>
                                <p class="font-medium text-gray-900">
                                  {userInfo()?.name || "Loading..."}
                                </p>
                                <p class="text-sm text-gray-500">
                                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    {formatRoleType(role.role_type)} (Pending)
                                  </span>
                                </p>
                                <p class="text-xs text-gray-400 mt-1">
                                  Invited {formatDate(role.granted_at)}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRevokeRole(role.id)}
                              disabled={processingRoleId() === role.id}
                              class="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                            >
                              {processingRoleId() === role.id ? "..." : "Cancel"}
                            </button>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </Show>

                {/* Users I've Granted Roles To */}
                <Show
                  when={!loadingRoles() && rolesIGranted().length > 0}
                  fallback={
                    <Show when={pendingInvitationsSent().length === 0}>
                      <div class="text-center py-8 text-gray-500">
                        <svg
                          class="w-12 h-12 mx-auto mb-3 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <p class="text-sm">No roles granted yet</p>
                        <p class="text-xs text-gray-400 mt-1">
                          Users you've granted permissions to will appear here
                        </p>
                      </div>
                    </Show>
                  }
                >
                  <div class="space-y-3">
                    <h4 class="font-medium text-gray-700 text-sm">Your Team</h4>
                    <For each={rolesIGranted()}>
                      {(role) => {
                        const userInfo = () => getUserInfo(role.user_id);
                        return (
                          <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div class="flex items-center gap-3">
                              <div class="w-10 h-10 bg-linear-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
                                <Show
                                  when={userInfo()?.displayAvatar}
                                  fallback={
                                    <span class="text-white font-bold">
                                      {userInfo()?.name?.[0]?.toUpperCase() || "?"}
                                    </span>
                                  }
                                >
                                  <img
                                    src={userInfo()!.displayAvatar!}
                                    alt={userInfo()?.name || "User"}
                                    class="w-full h-full object-cover"
                                  />
                                </Show>
                              </div>
                              <div>
                                <p class="font-medium text-gray-900">
                                  {userInfo()?.name || "Loading..."}
                                </p>
                                <p class="text-sm text-gray-500">
                                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    {formatRoleType(role.role_type)}
                                  </span>
                                </p>
                                <p class="text-xs text-gray-400 mt-1">
                                  Since {formatDate(role.accepted_at || role.granted_at)}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRevokeRole(role.id)}
                              disabled={processingRoleId() === role.id}
                              class="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                            >
                              {processingRoleId() === role.id ? "..." : "Revoke"}
                            </button>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </Show>
              </div>

              {/* Notification Preferences */}
              <Show when={user()}>
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 class="text-lg font-medium text-gray-900 mb-6">
                    Notification Preferences
                  </h3>
                  <div class="space-y-4">
                    <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p class="font-medium text-gray-900">
                          Email Notifications
                        </p>
                        <p class="text-sm text-gray-600">
                          Receive notifications about important events
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleEmailNotifications}
                        disabled={isTogglingNotifications()}
                        class={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          prefs.data()?.email_notifications ? "bg-purple-600" : "bg-gray-300"
                        } ${isTogglingNotifications() ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <span
                          class={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            prefs.data()?.email_notifications ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </Show>
            </div>
          </>
        </Show>
      </Show>
    </>
  );
}
