import { Title } from "@solidjs/meta";
import { createSignal, createEffect, Show, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useCurrentUser } from "~/lib/auth";
import { client } from "~/lib/urql";
import { graphql } from "gql.tada";
import { button, card, text, badge, input } from "~/styles/design-system";

const ListUsersQuery = graphql(`
  query ListUsers($sort: [UserSortInput!], $filter: UserFilterInput) {
    listUsers(sort: $sort, filter: $filter) {
      results {
        id
        email
        name
        tier
        role
        confirmedAt
        displayAvatar
      }
    }
  }
`);

const GrantProAccessMutation = graphql(`
  mutation GrantProAccess($id: ID!, $input: GrantProAccessInput!) {
    grantProAccess(id: $id, input: $input) {
      result {
        id
        tier
      }
      errors {
        message
      }
    }
  }
`);

const RevokeProAccessMutation = graphql(`
  mutation RevokeProAccess($id: ID!) {
    revokeProAccess(id: $id) {
      result {
        id
        tier
      }
      errors {
        message
      }
    }
  }
`);

interface User {
  id: string;
  email: string;
  name: string;
  tier: string | null;
  role: string | null;
  confirmedAt: string | null;
  displayAvatar: string | null;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const { user: currentUser, isLoading: authLoading } = useCurrentUser();

  const [users, setUsers] = createSignal<User[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [successMessage, setSuccessMessage] = createSignal<string | null>(null);

  const [showGrantModal, setShowGrantModal] = createSignal(false);
  const [selectedUser, setSelectedUser] = createSignal<User | null>(null);
  const [grantDuration, setGrantDuration] = createSignal("30");
  const [grantReason, setGrantReason] = createSignal("");
  const [grantingPro, setGrantingPro] = createSignal(false);

  const [showRevokeConfirm, setShowRevokeConfirm] = createSignal(false);
  const [userToRevoke, setUserToRevoke] = createSignal<User | null>(null);
  const [revokingPro, setRevokingPro] = createSignal(false);

  createEffect(() => {
    const user = currentUser();
    if (!authLoading() && (!user || user.role !== "admin")) {
      navigate("/dashboard");
    }
  });

  const loadUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.query(ListUsersQuery, {
        sort: [{ field: "EMAIL", order: "ASC" }],
      });

      if (result.error) {
        setError("Failed to load users. Please try again.");
        console.error("GraphQL error:", result.error);
      } else if (result.data?.listUsers?.results) {
        setUsers(result.data.listUsers.results);
      }
    } catch (err) {
      setError("Failed to load users. Please try again.");
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  createEffect(() => {
    if (!authLoading() && currentUser()?.role === "admin") {
      loadUsers();
    }
  });

  const openGrantModal = (user: User) => {
    setSelectedUser(user);
    setGrantDuration("30");
    setGrantReason("");
    setShowGrantModal(true);
    setError(null);
    setSuccessMessage(null);
  };

  const closeGrantModal = () => {
    setShowGrantModal(false);
    setSelectedUser(null);
    setGrantReason("");
  };

  const handleGrantPro = async () => {
    const user = selectedUser();
    if (!user) return;

    const reason = grantReason().trim();
    if (!reason) {
      setError("Please provide a reason for granting PRO access");
      return;
    }

    setGrantingPro(true);
    setError(null);

    try {
      const result = await client.mutation(GrantProAccessMutation, {
        id: user.id,
        input: {
          durationDays: parseInt(grantDuration()),
          reason: reason,
        },
      });

      if (result.error) {
        setError("Failed to grant PRO access. Please try again.");
        console.error("GraphQL error:", result.error);
      } else if (result.data?.grantProAccess?.errors && result.data.grantProAccess.errors.length > 0) {
        setError(result.data.grantProAccess.errors[0].message || "Failed to grant PRO access");
      } else {
        setSuccessMessage(`PRO access granted to ${user.email} for ${grantDuration()} days`);
        closeGrantModal();
        await loadUsers();

        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err) {
      setError("Failed to grant PRO access. Please try again.");
      console.error("Error granting PRO:", err);
    } finally {
      setGrantingPro(false);
    }
  };

  const openRevokeConfirm = (user: User) => {
    setUserToRevoke(user);
    setShowRevokeConfirm(true);
    setError(null);
    setSuccessMessage(null);
  };

  const closeRevokeConfirm = () => {
    setShowRevokeConfirm(false);
    setUserToRevoke(null);
  };

  const handleRevokePro = async () => {
    const user = userToRevoke();
    if (!user) return;

    setRevokingPro(true);
    setError(null);

    try {
      const result = await client.mutation(RevokeProAccessMutation, {
        id: user.id,
      });

      if (result.error) {
        setError("Failed to revoke PRO access. Please try again.");
        console.error("GraphQL error:", result.error);
      } else if (result.data?.revokeProAccess?.errors && result.data.revokeProAccess.errors.length > 0) {
        setError(result.data.revokeProAccess.errors[0].message || "Failed to revoke PRO access");
      } else {
        setSuccessMessage(`PRO access revoked for ${user.email}`);
        closeRevokeConfirm();
        await loadUsers();

        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err) {
      setError("Failed to revoke PRO access. Please try again.");
      console.error("Error revoking PRO:", err);
    } finally {
      setRevokingPro(false);
    }
  };

  const getRoleBadgeClass = (role: string | null) => {
    if (role === "admin") return badge.error;
    return badge.neutral;
  };

  const getTierBadgeClass = (tier: string | null) => {
    if (tier === "pro") return "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800";
    return badge.neutral;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <>
      <Title>Users - Admin - Streampai</Title>
      <Show
        when={!authLoading()}
        fallback={
          <div class="flex items-center justify-center min-h-screen">
            <div class="text-gray-500">Loading...</div>
          </div>
        }
      >
        <Show when={currentUser()?.role === "admin"}>
          <>
            <div class="max-w-6xl mx-auto space-y-6">
              <Show when={successMessage()}>
                <div class="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <svg class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div class="flex-1">
                    <p class="text-sm text-green-800 font-medium">{successMessage()}</p>
                  </div>
                  <button
                    onClick={() => setSuccessMessage(null)}
                    class="text-green-500 hover:text-green-700"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </Show>

              <Show when={error()}>
                <div class="flex items-start space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
                  <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div class="flex-1">
                    <p class="text-sm text-red-800 font-medium">{error()}</p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    class="text-red-500 hover:text-red-700"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </Show>

              <div class={card.base}>
                <div class="px-6 py-4 border-b border-gray-200">
                  <h3 class={text.h3}>All Users</h3>
                  <p class={text.muted}>Manage user accounts and PRO access</p>
                </div>

                <Show
                  when={!loading()}
                  fallback={
                    <div class="px-6 py-12 text-center">
                      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                      <p class="mt-4 text-gray-500">Loading users...</p>
                    </div>
                  }
                >
                  <div class="overflow-x-auto">
                    <table class="w-full">
                      <thead class="bg-gray-50">
                        <tr>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody class="bg-white divide-y divide-gray-200">
                        <For each={users()}>
                          {(user) => (
                            <tr class={currentUser()?.id === user.id ? "bg-purple-50" : "hover:bg-gray-50"}>
                              <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center">
                                  <div class="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center overflow-hidden">
                                    <Show
                                      when={user.displayAvatar}
                                      fallback={
                                        <span class="text-white font-medium text-sm">
                                          {user.email[0].toUpperCase()}
                                        </span>
                                      }
                                    >
                                      <img
                                        src={user.displayAvatar!}
                                        alt={user.name}
                                        class="w-10 h-10 rounded-full object-cover"
                                      />
                                    </Show>
                                  </div>
                                  <div class="ml-3">
                                    <div class="flex items-center space-x-2">
                                      <span class="text-sm font-medium text-gray-900">{user.name}</span>
                                      <Show when={currentUser()?.id === user.id}>
                                        <span class={badge.info}>Current User</span>
                                      </Show>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                              <td class="px-6 py-4 whitespace-nowrap">
                                <span class={getRoleBadgeClass(user.role)}>
                                  {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Regular"}
                                </span>
                              </td>
                              <td class="px-6 py-4 whitespace-nowrap">
                                <span class={getTierBadgeClass(user.tier)}>
                                  {user.tier === "pro" ? "Pro" : "Free"}
                                </span>
                              </td>
                              <td class="px-6 py-4 whitespace-nowrap">
                                <Show
                                  when={user.confirmedAt}
                                  fallback={
                                    <span class={badge.warning}>Pending</span>
                                  }
                                >
                                  <span class={badge.success}>Confirmed</span>
                                </Show>
                              </td>
                              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div class="flex items-center space-x-3">
                                  <Show when={user.tier === "pro"}>
                                    <button
                                      onClick={() => openRevokeConfirm(user)}
                                      class="text-red-600 hover:text-red-900 hover:underline"
                                    >
                                      Revoke PRO
                                    </button>
                                  </Show>
                                  <Show when={user.tier !== "pro"}>
                                    <button
                                      onClick={() => openGrantModal(user)}
                                      class="text-green-600 hover:text-green-900 hover:underline"
                                    >
                                      Grant PRO
                                    </button>
                                  </Show>
                                </div>
                              </td>
                            </tr>
                          )}
                        </For>
                      </tbody>
                    </table>

                    <Show when={users().length === 0}>
                      <div class="text-center py-12">
                        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0A9 9 0 1110.5 3.5a9 9 0 018.999 8.499z" />
                        </svg>
                        <p class="mt-4 text-sm text-gray-500">No users found</p>
                      </div>
                    </Show>
                  </div>
                </Show>
              </div>
            </div>
          </>

          <Show when={showGrantModal()}>
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
              <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div class="px-6 py-4 border-b border-gray-200">
                  <div class="flex items-center justify-between">
                    <h3 class={text.h3}>Grant PRO Access</h3>
                    <button onClick={closeGrantModal} class="text-gray-400 hover:text-gray-500">
                      <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div class="px-6 py-4 space-y-4">
                  <div>
                    <p class={text.body}>
                      Grant PRO access to <span class="font-semibold">{selectedUser()?.email}</span>
                    </p>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                    <select
                      value={grantDuration()}
                      onInput={(e) => setGrantDuration(e.currentTarget.value)}
                      class={input.select}
                    >
                      <option value="7">7 days</option>
                      <option value="30">30 days</option>
                      <option value="90">90 days (3 months)</option>
                      <option value="180">180 days (6 months)</option>
                      <option value="365">365 days (1 year)</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Reason <span class="text-red-500">*</span>
                    </label>
                    <textarea
                      value={grantReason()}
                      onInput={(e) => setGrantReason(e.currentTarget.value)}
                      rows={3}
                      class={input.textarea}
                      placeholder="e.g., Beta tester, Partner program, Promotional access..."
                    />
                    <p class={text.helper}>This will be logged for auditing purposes</p>
                  </div>
                </div>

                <div class="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
                  <button onClick={closeGrantModal} class={button.secondary}>
                    Cancel
                  </button>
                  <button
                    onClick={handleGrantPro}
                    disabled={grantingPro() || !grantReason().trim()}
                    class={button.primary}
                  >
                    <Show when={grantingPro()} fallback="Grant PRO Access">
                      Granting...
                    </Show>
                  </button>
                </div>
              </div>
            </div>
          </Show>

          <Show when={showRevokeConfirm()}>
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
              <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div class="px-6 py-4 border-b border-gray-200">
                  <div class="flex items-center justify-between">
                    <h3 class={text.h3}>Revoke PRO Access</h3>
                    <button onClick={closeRevokeConfirm} class="text-gray-400 hover:text-gray-500">
                      <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div class="px-6 py-4 space-y-4">
                  <p class={text.body}>
                    Are you sure you want to revoke PRO access for{" "}
                    <span class="font-semibold">{userToRevoke()?.email}</span>?
                  </p>
                  <p class={text.muted}>This action cannot be undone.</p>
                </div>

                <div class="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
                  <button onClick={closeRevokeConfirm} class={button.secondary}>
                    Cancel
                  </button>
                  <button
                    onClick={handleRevokePro}
                    disabled={revokingPro()}
                    class={button.danger}
                  >
                    <Show when={revokingPro()} fallback="Revoke PRO">
                      Revoking...
                    </Show>
                  </button>
                </div>
              </div>
            </div>
          </Show>
        </Show>
      </Show>
    </>
  );
}
