import {
	t as o,
	i as a,
	c as s,
	S as w,
	a as D,
	b as K,
	F as ue,
	d as Je,
	e as me,
	o as Ze,
	f as ot,
	s as mt,
	m as Xe,
	u as ft,
	g as c,
	h as St,
	j as wt,
	k as ut,
} from "./iframe-BQDcX1su.js";
import { f as bt, a as xt, b as $t } from "./formatters-C5hHeGWB.js";
import {
	b as Me,
	t as J,
	a as rt,
	i as ke,
	c as gt,
} from "./design-system-CwcdUVvG.js";
import "./preload-helper-PPVm8Dsz.js";
var Ct = o('<div class="mt-2 flex flex-wrap gap-2">'),
	_t = o('<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">'),
	kt = o(
		'<div class=space-y-6><div class="flex items-center justify-between"><div><h2>Stream Settings</h2><p>Configure your stream before going live</p></div><span>OFFLINE</span></div><div class=space-y-4><div><label>Stream Title<input type=text placeholder="Enter your stream title..."></label></div><div><label>Description<textarea rows=3 placeholder="Describe your stream..."></textarea></label></div><div><label>Category<select><option value>Select a category...</option></select></label></div><div><label>Tags</label><div class="mt-1 flex gap-2"><input type=text placeholder="Add a tag..."><button type=button>Add</button></div></div><div><label>Thumbnail</label><div class="mt-1 flex h-32 items-center justify-center rounded-lg border-2 border-gray-300 border-dashed bg-gray-50"><div class="text-center text-gray-500"><div class="mb-1 text-2xl">[img]</div><div class=text-sm>Click to upload thumbnail</div></div></div></div></div><div class="rounded-lg border border-amber-200 bg-amber-50 p-4"><div class="flex items-start gap-3"><div class="text-amber-600 text-xl">[i]</div><div class=flex-1><h4 class="font-medium text-amber-800">Ready to start streaming?</h4><p class="mt-1 text-amber-700 text-sm">Configure your streaming software (OBS, Streamlabs, etc.) with the stream key below, then start streaming to go live.</p><button type=button>',
	),
	Mt = o("<option>"),
	Dt = o(
		'<span class="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-purple-800 text-sm"><button type=button class=hover:text-purple-600>x',
	),
	Tt = o(
		'<div class=space-y-3><div class="h-4 w-24 animate-pulse rounded bg-gray-200"></div><div class="h-5 w-full animate-pulse rounded bg-gray-200"></div><div class="h-5 w-3/4 animate-pulse rounded bg-gray-200">',
	),
	Pt = o('<div class="text-center text-gray-500">No stream key available'),
	Kt = o(
		'<div class="mb-3 flex items-center justify-between"><span class="font-medium text-gray-700 text-sm">Stream Key</span><button type=button>',
	),
	At = o(
		'<div class=mb-2><label class="mb-1 block text-gray-500 text-xs">RTMP URL</label><code class="block rounded bg-white px-2 py-1 font-mono text-gray-900 text-sm">',
	),
	It = o(
		'<div class=mb-3><label class="mb-1 block text-gray-500 text-xs">Stream Key</label><code class="block rounded bg-white px-2 py-1 font-mono text-gray-600 text-sm">',
	),
	Vt = o(
		'<div class="mb-2 border-gray-200 border-t pt-2"><label class="mb-1 block text-gray-500 text-xs">SRT URL (Alternative)</label><code class="block rounded bg-white px-2 py-1 font-mono text-gray-600 text-xs">',
	),
	Lt = o("<span>"),
	Gt = o('<span class="font-bold text-green-600 text-sm">'),
	qt = o('<div class="mt-0.5 truncate text-gray-700 text-sm">'),
	Ft = o(
		'<div><span></span><div class="min-w-0 flex-1"><div class="flex items-center gap-1.5"><span></span><span class="ml-auto text-gray-400 text-xs">',
	),
	Et = o(
		'<div class="flex h-full flex-col"><div class=mb-4><h3 class="font-semibold text-gray-900 text-lg">Stream Actions</h3><p class="text-gray-500 text-sm">Control your stream with quick actions</p></div><div class="grid gap-3"></div><div class="mt-auto pt-4"><div class="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center text-gray-500 text-sm">More actions coming soon',
	),
	Nt = o(
		'<button type=button><div></div><div class="min-w-0 flex-1"><div class="font-medium text-gray-900"></div><div class="text-gray-500 text-sm"></div></div><div class="shrink-0 text-gray-400">&gt;',
	),
	zt = o(
		'<span class="ml-0.5 rounded-full bg-purple-600 px-1.5 text-white text-[10px]">',
	),
	jt = o(
		'<button type=button class="absolute top-1/2 right-1.5 -translate-y-1/2 text-gray-400 text-xs hover:text-gray-600"data-testid=clear-search>x',
	),
	Rt = o(
		'<button type=button class="text-gray-500 text-xs hover:text-gray-700"data-testid=clear-filters>Clear',
	),
	Ot = o(
		'<div class="absolute top-full left-0 right-0 z-20 mt-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg"><div class="mb-1.5 flex items-center justify-between"><span class="font-medium text-gray-600 text-xs">Event Types</span><div class="flex gap-2"><button type=button class="text-purple-600 text-xs hover:text-purple-700"data-testid=select-all-types>All</button></div></div><div class="flex flex-wrap gap-1">',
	),
	Wt = o('<span class="font-medium text-gray-700">'),
	lt = o('<span class="font-medium text-gray-700">matching "<!>"'),
	Bt = o("<span class=text-gray-400>•"),
	Ut = o(
		'<div class="mt-1.5 flex items-center gap-1 text-gray-500 text-xs"><span>Showing:</span><span class=text-gray-400>(<!> events)',
	),
	Ht = o(
		'<div class="relative shrink-0 border-gray-200 border-b py-2"><div class="flex items-center gap-2"><button type=button data-testid=filter-toggle><span>[=]</span><span>Filter</span><span class=text-[10px]></span></button><div class="relative flex-1"><input type=text class="w-full rounded border border-gray-200 bg-gray-50 px-2 py-1 pr-6 text-xs placeholder:text-gray-400 focus:border-purple-300 focus:bg-white focus:outline-none"placeholder="Search by name or message..."data-testid=search-input>',
	),
	Yt = o('<div class="min-h-0 flex-1 overflow-y-auto">'),
	Jt = o(
		'<div class="absolute bottom-full left-0 z-10 mb-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg"><div class="mb-2 flex items-center justify-between"><span class="font-medium text-gray-700 text-xs">Select platforms</span><button type=button class="text-purple-600 text-xs hover:text-purple-700">Select all</button></div><div class="flex flex-wrap gap-1.5">',
	),
	Qt = o(
		'<div class="shrink-0 border-gray-200 border-t pt-3"><div class="relative mb-2"><button type=button class="flex items-center gap-1.5 text-gray-500 text-xs transition-colors hover:text-gray-700"><span>Send to:</span><span class="font-medium text-gray-700"></span><span class=text-[10px]></span></button></div><div class="flex gap-2"><input type=text placeholder="Send a message to chat..."><button type=button>Send',
	),
	Xt = o('<div class="min-h-0 flex-1 overflow-y-auto py-4">'),
	Zt = o(
		'<div class="flex h-full flex-col"><div class="shrink-0 border-gray-200 border-b pb-4"><div class="flex items-center justify-between"><div class="flex items-center gap-4"><span><span class="mr-2 animate-pulse">[*]</span> LIVE</span><div class="text-gray-600 text-sm"><span class=font-medium></span></div></div><div class="flex items-center gap-4"><div class="flex rounded-lg border border-gray-200 bg-gray-100 p-0.5"><button type=button data-testid=view-mode-events><span>[#]</span><span>Events</span></button><button type=button data-testid=view-mode-actions><span>[&gt;]</span><span>Actions</span></button></div><div class=text-center><div class="font-bold text-purple-600 text-xl"></div><div class="text-gray-500 text-xs">Viewers',
	),
	ea = o("<button type=button><span></span><span>"),
	ta = o('<div class="mb-2 text-3xl">[?]'),
	aa = o("<div>No events match your filters"),
	na = o(
		'<button type=button class="mt-2 text-purple-600 text-sm hover:text-purple-700"data-testid=clear-filters-empty>Clear filters',
	),
	ra = o(
		'<div class="flex h-full items-center justify-center text-gray-400"><div class=text-center>',
	),
	ia = o('<div class="mb-2 text-3xl">[chat]'),
	sa = o("<div>Waiting for activity..."),
	oa = o(
		"<button type=button><span class=font-medium></span><span class=capitalize>",
	),
	la = o(
		'<div class=space-y-6><div class="flex items-center justify-between"><div><h2>Stream Summary</h2><p>Stream ended </p></div><span>OFFLINE</span></div><div class="grid grid-cols-2 gap-4 md:grid-cols-4"><div class="rounded-lg bg-purple-50 p-4 text-center"><div class="font-bold text-2xl text-purple-600"></div><div class="text-gray-600 text-sm">Duration</div></div><div class="rounded-lg bg-blue-50 p-4 text-center"><div class="font-bold text-2xl text-blue-600"></div><div class="text-gray-600 text-sm">Peak Viewers</div></div><div class="rounded-lg bg-green-50 p-4 text-center"><div class="font-bold text-2xl text-green-600"></div><div class="text-gray-600 text-sm">Avg Viewers</div></div><div class="rounded-lg bg-pink-50 p-4 text-center"><div class="font-bold text-2xl text-pink-600"></div><div class="text-gray-600 text-sm">Messages</div></div></div><div><div class="divide-y divide-gray-100"><div class="flex items-center justify-between p-4"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">$</div><div><div class="font-medium text-gray-900">Donations</div><div class="text-gray-500 text-sm"> donations</div></div></div><div class="font-bold text-green-600 text-xl">$</div></div><div class="flex items-center justify-between p-4"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">+</div><div><div class="font-medium text-gray-900">New Followers</div><div class="text-gray-500 text-sm">People who followed</div></div></div><div class="font-bold text-blue-600 text-xl">+</div></div><div class="flex items-center justify-between p-4"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">*</div><div><div class="font-medium text-gray-900">New Subscribers</div><div class="text-gray-500 text-sm">Paid subscriptions</div></div></div><div class="font-bold text-purple-600 text-xl">+</div></div><div class="flex items-center justify-between p-4"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">></div><div><div class="font-medium text-gray-900">Raids</div><div class="text-gray-500 text-sm">Incoming raids</div></div></div><div class="font-bold text-orange-600 text-xl"></div></div></div></div><div class="flex justify-center"><button type=button>Start New Stream',
	),
	da = o("<div>");
const ca = [
		"Gaming",
		"Just Chatting",
		"Music",
		"Art",
		"Software Development",
		"Education",
		"Sports",
		"Other",
	],
	ht = {
		twitch: "bg-purple-600",
		youtube: "bg-red-600",
		kick: "bg-green-600",
		facebook: "bg-blue-600",
	},
	yt = { twitch: "T", youtube: "Y", kick: "K", facebook: "F" },
	vt = (e) => ["donation", "raid", "subscription", "cheer"].includes(e),
	pt = (e) => {
		switch (e) {
			case "donation":
				return "$";
			case "follow":
				return "+";
			case "subscription":
				return "*";
			case "raid":
				return ">";
			case "cheer":
				return "~";
			case "chat":
			default:
				return "";
		}
	},
	et = (e) => {
		switch (e) {
			case "donation":
				return "text-green-400";
			case "follow":
				return "text-blue-400";
			case "subscription":
				return "text-purple-400";
			case "raid":
				return "text-orange-400";
			case "cheer":
				return "text-pink-400";
			case "chat":
			default:
				return "text-gray-300";
		}
	};
function tt(e) {
	const [u, y] = K(""),
		g = () => {
			const l = u().trim();
			l &&
				!e.metadata.tags.includes(l) &&
				(e.onMetadataChange({ ...e.metadata, tags: [...e.metadata.tags, l] }),
				y(""));
		},
		m = (l) => {
			e.onMetadataChange({
				...e.metadata,
				tags: e.metadata.tags.filter((p) => p !== l),
			});
		};
	return (() => {
		var l = kt(),
			p = l.firstChild,
			S = p.firstChild,
			d = S.firstChild,
			b = d.nextSibling,
			M = S.nextSibling,
			v = p.nextSibling,
			k = v.firstChild,
			T = k.firstChild,
			E = T.firstChild,
			G = E.nextSibling,
			ie = k.nextSibling,
			R = ie.firstChild,
			Q = R.firstChild,
			I = Q.nextSibling,
			O = ie.nextSibling,
			Z = O.firstChild,
			fe = Z.firstChild,
			q = fe.nextSibling;
		q.firstChild;
		var N = O.nextSibling,
			ee = N.firstChild,
			Se = ee.nextSibling,
			z = Se.firstChild,
			te = z.nextSibling,
			ae = N.nextSibling,
			se = ae.firstChild,
			oe = v.nextSibling,
			we = oe.firstChild,
			le = we.firstChild,
			de = le.nextSibling,
			be = de.firstChild,
			xe = be.nextSibling,
			r = xe.nextSibling;
		return (
			(G.$$input = (t) =>
				e.onMetadataChange({ ...e.metadata, title: t.currentTarget.value })),
			(I.$$input = (t) =>
				e.onMetadataChange({
					...e.metadata,
					description: t.currentTarget.value,
				})),
			q.addEventListener("change", (t) =>
				e.onMetadataChange({ ...e.metadata, category: t.currentTarget.value }),
			),
			a(
				q,
				s(ue, {
					each: ca,
					children: (t) =>
						(() => {
							var n = Mt();
							return (n.value = t), a(n, t), n;
						})(),
				}),
				null,
			),
			(z.$$keydown = (t) => {
				t.key === "Enter" && (t.preventDefault(), g());
			}),
			(z.$$input = (t) => y(t.currentTarget.value)),
			(te.$$click = g),
			a(
				N,
				s(w, {
					get when() {
						return e.metadata.tags.length > 0;
					},
					get children() {
						var t = Ct();
						return (
							a(
								t,
								s(ue, {
									get each() {
										return e.metadata.tags;
									},
									children: (n) =>
										(() => {
											var i = Dt(),
												h = i.firstChild;
											return a(i, n, h), (h.$$click = () => m(n)), i;
										})(),
								}),
							),
							t
						);
					},
				}),
				null,
			),
			Je(r, "click", e.onShowStreamKey, !0),
			a(r, () => (e.showStreamKey ? "Hide Stream Key" : "Show Stream Key")),
			a(
				l,
				s(w, {
					get when() {
						return e.showStreamKey;
					},
					get children() {
						var t = _t();
						return (
							a(
								t,
								s(w, {
									get when() {
										return !e.isLoadingStreamKey;
									},
									get fallback() {
										return Tt();
									},
									get children() {
										return s(w, {
											get when() {
												return e.streamKeyData;
											},
											get fallback() {
												return Pt();
											},
											children: (n) => [
												(() => {
													var i = Kt(),
														h = i.firstChild,
														x = h.nextSibling;
													return (
														Je(x, "click", e.onCopyStreamKey, !0),
														a(x, () => (e.copied ? "Copied!" : "Copy Key")),
														D(() => c(x, `${Me.ghost} text-sm`)),
														i
													);
												})(),
												(() => {
													var i = At(),
														h = i.firstChild,
														x = h.nextSibling;
													return a(x, () => n().rtmpsUrl), i;
												})(),
												(() => {
													var i = It(),
														h = i.firstChild,
														x = h.nextSibling;
													return a(x, () => n().rtmpsStreamKey), i;
												})(),
												s(w, {
													get when() {
														return n().srtUrl;
													},
													get children() {
														var i = Vt(),
															h = i.firstChild,
															x = h.nextSibling;
														return a(x, () => n().srtUrl), i;
													},
												}),
											],
										});
									},
								}),
							),
							t
						);
					},
				}),
				null,
			),
			D(
				(t) => {
					var n = J.h2,
						i = J.muted,
						h = rt.neutral,
						x = J.label,
						W = `${ke.text} mt-1`,
						ne = J.label,
						$e = `${ke.textarea} mt-1`,
						ce = J.label,
						Ce = `${ke.select} mt-1`,
						Te = J.label,
						Pe = ke.text,
						f = Me.secondary,
						V = J.label,
						$ = `${Me.secondary} mt-3`;
					return (
						n !== t.e && c(d, (t.e = n)),
						i !== t.t && c(b, (t.t = i)),
						h !== t.a && c(M, (t.a = h)),
						x !== t.o && c(T, (t.o = x)),
						W !== t.i && c(G, (t.i = W)),
						ne !== t.n && c(R, (t.n = ne)),
						$e !== t.s && c(I, (t.s = $e)),
						ce !== t.h && c(Z, (t.h = ce)),
						Ce !== t.r && c(q, (t.r = Ce)),
						Te !== t.d && c(ee, (t.d = Te)),
						Pe !== t.l && c(z, (t.l = Pe)),
						f !== t.u && c(te, (t.u = f)),
						V !== t.c && c(se, (t.c = V)),
						$ !== t.w && c(r, (t.w = $)),
						t
					);
				},
				{
					e: void 0,
					t: void 0,
					a: void 0,
					o: void 0,
					i: void 0,
					n: void 0,
					s: void 0,
					h: void 0,
					r: void 0,
					d: void 0,
					l: void 0,
					u: void 0,
					c: void 0,
					w: void 0,
				},
			),
			D(() => (G.value = e.metadata.title)),
			D(() => (I.value = e.metadata.description)),
			D(() => (q.value = e.metadata.category)),
			D(() => (z.value = u())),
			l
		);
	})();
}
const dt = ["twitch", "youtube", "kick", "facebook"],
	ma = 52;
function ua(e) {
	const u = () =>
		e.isSticky && e.stickyIndex !== void 0
			? { top: `${e.stickyIndex * ma}px` }
			: {};
	return (() => {
		var y = Ft(),
			g = y.firstChild,
			m = g.nextSibling,
			l = m.firstChild,
			p = l.firstChild,
			S = p.nextSibling;
		return (
			a(g, () => yt[e.item.platform] || "?"),
			a(
				l,
				s(w, {
					get when() {
						return e.item.type !== "chat";
					},
					get children() {
						var d = Lt();
						return (
							a(d, () => pt(e.item.type)),
							D(() => c(d, `text-xs ${et(e.item.type)}`)),
							d
						);
					},
				}),
				p,
			),
			a(p, () => e.item.username),
			a(
				l,
				s(w, {
					get when() {
						return e.item.amount;
					},
					get children() {
						var d = Gt();
						return a(d, () => bt(e.item.amount, e.item.currency)), d;
					},
				}),
				S,
			),
			a(S, () => xt(e.item.timestamp)),
			a(
				m,
				s(w, {
					get when() {
						return e.item.message;
					},
					get children() {
						var d = qt();
						return a(d, () => e.item.message), d;
					},
				}),
				null,
			),
			D(
				(d) => {
					var b = `flex items-center gap-2 rounded px-2 py-2 transition-colors hover:bg-gray-50 ${e.isSticky ? "sticky z-10 border-amber-200 border-b bg-amber-50 shadow-sm" : vt(e.item.type) ? "bg-gray-50/50" : ""}`,
						M = u(),
						v = `flex h-6 w-6 shrink-0 items-center justify-center rounded text-white text-xs ${ht[e.item.platform] || "bg-gray-500"}`,
						k = `font-medium text-sm ${e.item.type === "chat" ? "text-gray-800" : et(e.item.type)}`;
					return (
						b !== d.e && c(y, (d.e = b)),
						(d.t = St(y, M, d.t)),
						v !== d.a && c(g, (d.a = v)),
						k !== d.o && c(p, (d.o = k)),
						d
					);
				},
				{ e: void 0, t: void 0, a: void 0, o: void 0 },
			),
			y
		);
	})();
}
function ga(e) {
	const u = [
		{
			id: "poll",
			icon: "[?]",
			title: "Start Poll",
			description: "Create an interactive poll for viewers",
			color: "bg-blue-500",
			hoverColor: "hover:bg-blue-600",
			onClick: e.onStartPoll,
		},
		{
			id: "giveaway",
			icon: "[*]",
			title: "Start Giveaway",
			description: "Launch a giveaway for your audience",
			color: "bg-green-500",
			hoverColor: "hover:bg-green-600",
			onClick: e.onStartGiveaway,
		},
		{
			id: "timers",
			icon: "[~]",
			title: "Modify Timers",
			description: "Adjust stream timers and countdowns",
			color: "bg-orange-500",
			hoverColor: "hover:bg-orange-600",
			onClick: e.onModifyTimers,
		},
		{
			id: "settings",
			icon: "[=]",
			title: "Stream Settings",
			description: "Change title, category, and tags",
			color: "bg-purple-500",
			hoverColor: "hover:bg-purple-600",
			onClick: e.onChangeStreamSettings,
		},
	];
	return (() => {
		var y = Et(),
			g = y.firstChild,
			m = g.nextSibling;
		return (
			a(
				m,
				s(ue, {
					each: u,
					children: (l) =>
						(() => {
							var p = Nt(),
								S = p.firstChild,
								d = S.nextSibling,
								b = d.firstChild,
								M = b.nextSibling;
							return (
								Je(p, "click", l.onClick, !0),
								a(S, () => l.icon),
								a(b, () => l.title),
								a(M, () => l.description),
								D(
									(v) => {
										var k = `flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:border-gray-300 hover:shadow-md ${l.onClick ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`,
											T = !l.onClick,
											E = `action-${l.id}`,
											G = `flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-white text-xl ${l.color} ${l.onClick ? l.hoverColor : ""}`;
										return (
											k !== v.e && c(p, (v.e = k)),
											T !== v.t && (p.disabled = v.t = T),
											E !== v.a && mt(p, "data-testid", (v.a = E)),
											G !== v.o && c(S, (v.o = G)),
											v
										);
									},
									{ e: void 0, t: void 0, a: void 0, o: void 0 },
								),
								p
							);
						})(),
				}),
			),
			y
		);
	})();
}
const Y = ["chat", "donation", "follow", "subscription", "raid", "cheer"],
	ct = {
		chat: "Chat",
		donation: "Donations",
		follow: "Follows",
		subscription: "Subs",
		raid: "Raids",
		cheer: "Cheers",
	};
function at(e) {
	const [u, y] = K(""),
		[g, m] = K(new Set(e.connectedPlatforms || dt)),
		[l, p] = K(!1),
		[S, d] = K(new Set()),
		[b, M] = K(!0),
		[v, k] = K(new Set(Y)),
		[T, E] = K(""),
		[G, ie] = K(!1),
		[R, Q] = K("events");
	let I;
	const O = me(() => e.connectedPlatforms || [...dt]),
		Z = (r) => {
			const t = Math.floor(r / 3600),
				n = Math.floor((r % 3600) / 60),
				i = r % 60;
			return `${t.toString().padStart(2, "0")}:${n.toString().padStart(2, "0")}:${i.toString().padStart(2, "0")}`;
		},
		fe = (r) => {
			if (!v().has(r.type)) return !1;
			const t = T().toLowerCase().trim();
			if (t) {
				const n = r.username.toLowerCase().includes(t),
					i = r.message?.toLowerCase().includes(t) ?? !1;
				if (!n && !i) return !1;
			}
			return !0;
		},
		q = me(() =>
			e.activities
				.filter(fe)
				.sort((n, i) => {
					const h =
							n.timestamp instanceof Date
								? n.timestamp.getTime()
								: new Date(n.timestamp).getTime(),
						x =
							i.timestamp instanceof Date
								? i.timestamp.getTime()
								: new Date(i.timestamp).getTime();
					return h - x;
				})
				.slice(-200),
		),
		N = me(() => {
			const r = v().size === Y.length,
				t = T().trim().length > 0;
			return !r || t;
		}),
		ee = (r) => {
			k((t) => {
				const n = new Set(t);
				return n.has(r) ? n.size > 1 && n.delete(r) : n.add(r), n;
			});
		},
		Se = () => {
			k(new Set(Y));
		},
		z = () => {
			k(new Set(Y)), E("");
		},
		te = 3,
		ae = () => {
			const r = e.stickyDuration || 12e4,
				t = Date.now(),
				n = [];
			for (const i of e.activities)
				if (vt(i.type) && i.isImportant !== !1) {
					const h =
						i.timestamp instanceof Date
							? i.timestamp.getTime()
							: new Date(i.timestamp).getTime();
					t - h < r && n.push({ id: i.id, time: h });
				}
			return (
				n.sort((i, h) => h.time - i.time),
				new Set(n.slice(0, te).map((i) => i.id))
			);
		};
	Ze(() => {
		d(ae());
	}),
		ot(() => {
			e.activities.length > 0 && d(ae());
		}),
		Ze(() => {
			e.stickyDuration;
			const r = setInterval(() => {
				d(ae());
			}, 1e4);
			ut(() => clearInterval(r));
		});
	const se = me(() => {
		const r = S();
		if (r.size === 0) return new Map();
		const t = q()
				.filter((i) => r.has(i.id))
				.sort((i, h) => {
					const x =
							i.timestamp instanceof Date
								? i.timestamp.getTime()
								: new Date(i.timestamp).getTime(),
						W =
							h.timestamp instanceof Date
								? h.timestamp.getTime()
								: new Date(h.timestamp).getTime();
					return x - W;
				}),
			n = new Map();
		return (
			t.forEach((i, h) => {
				n.set(i.id, h);
			}),
			n
		);
	});
	ot(() => {
		const r = q();
		b() &&
			I &&
			r.length > 0 &&
			requestAnimationFrame(() => {
				I && (I.scrollTop = I.scrollHeight);
			});
	});
	const oe = () => {
			if (!I) return;
			const { scrollTop: r, scrollHeight: t, clientHeight: n } = I,
				i = t - r - n < 100;
			M(i);
		},
		we = (r) => {
			m((t) => {
				const n = new Set(t);
				return n.has(r) ? n.size > 1 && n.delete(r) : n.add(r), n;
			});
		},
		le = () => {
			m(new Set(O()));
		},
		de = () => {
			const r = u().trim();
			r && e.onSendMessage && (e.onSendMessage(r, [...g()]), y(""));
		},
		be = (r) => {
			r.key === "Enter" && !r.shiftKey && (r.preventDefault(), de());
		},
		xe = me(() => {
			const r = g(),
				t = O();
			if (r.size === t.length) return "All";
			if (r.size === 1) {
				const n = [...r][0];
				return n.charAt(0).toUpperCase() + n.slice(1);
			}
			return `${r.size} platforms`;
		});
	return (() => {
		var r = Zt(),
			t = r.firstChild,
			n = t.firstChild,
			i = n.firstChild,
			h = i.firstChild,
			x = h.nextSibling,
			W = x.firstChild,
			ne = i.nextSibling,
			$e = ne.firstChild,
			ce = $e.firstChild,
			Ce = ce.nextSibling,
			Te = $e.nextSibling,
			Pe = Te.firstChild;
		return (
			a(W, () => Z(e.streamDuration)),
			(ce.$$click = () => Q("events")),
			(Ce.$$click = () => Q("actions")),
			a(Pe, () => e.viewerCount),
			a(
				r,
				s(w, {
					get when() {
						return R() === "events";
					},
					get children() {
						return [
							(() => {
								var f = Ht(),
									V = f.firstChild,
									$ = V.firstChild,
									j = $.firstChild,
									B = j.nextSibling,
									Ke = B.nextSibling,
									Ae = $.nextSibling,
									X = Ae.firstChild;
								return (
									($.$$click = () => ie(!G())),
									a(
										$,
										s(w, {
											get when() {
												return N();
											},
											get children() {
												var _ = zt();
												return (
													a(
														_,
														() => Y.length - v().size + (T().trim() ? 1 : 0),
													),
													_
												);
											},
										}),
										Ke,
									),
									a(Ke, () => (G() ? "^" : "v")),
									(X.$$input = (_) => E(_.currentTarget.value)),
									a(
										Ae,
										s(w, {
											get when() {
												return T();
											},
											get children() {
												var _ = jt();
												return (_.$$click = () => E("")), _;
											},
										}),
										null,
									),
									a(
										f,
										s(w, {
											get when() {
												return G();
											},
											get children() {
												var _ = Ot(),
													P = _.firstChild,
													F = P.firstChild,
													U = F.nextSibling,
													H = U.firstChild,
													L = P.nextSibling;
												return (
													(H.$$click = Se),
													a(
														U,
														s(w, {
															get when() {
																return N();
															},
															get children() {
																var C = Rt();
																return (C.$$click = z), C;
															},
														}),
														null,
													),
													a(
														L,
														s(ue, {
															each: Y,
															children: (C) =>
																(() => {
																	var A = ea(),
																		_e = A.firstChild,
																		Qe = _e.nextSibling;
																	return (
																		(A.$$click = () => ee(C)),
																		mt(A, "data-testid", `filter-type-${C}`),
																		a(_e, () => pt(C) || "..."),
																		a(Qe, () => ct[C]),
																		D(() =>
																			c(
																				A,
																				`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-all ${v().has(C) ? `${et(C)} bg-gray-800` : "bg-gray-200 text-gray-500 hover:bg-gray-300"}`,
																			),
																		),
																		A
																	);
																})(),
														}),
													),
													_
												);
											},
										}),
										null,
									),
									a(
										f,
										s(w, {
											get when() {
												return Xe(() => !!N())() && !G();
											},
											get children() {
												var _ = Ut(),
													P = _.firstChild,
													F = P.nextSibling,
													U = F.firstChild,
													H = U.nextSibling;
												return (
													H.nextSibling,
													a(
														_,
														s(w, {
															get when() {
																return v().size < Y.length;
															},
															get children() {
																var L = Wt();
																return (
																	a(L, () =>
																		[...v()].map((C) => ct[C]).join(", "),
																	),
																	L
																);
															},
														}),
														F,
													),
													a(
														_,
														s(w, {
															get when() {
																return (
																	Xe(() => !!T().trim())() &&
																	v().size === Y.length
																);
															},
															get children() {
																var L = lt(),
																	C = L.firstChild,
																	A = C.nextSibling;
																return (
																	A.nextSibling, a(L, () => T().trim(), A), L
																);
															},
														}),
														F,
													),
													a(
														_,
														s(w, {
															get when() {
																return (
																	Xe(() => !!T().trim())() &&
																	v().size < Y.length
																);
															},
															get children() {
																return [
																	Bt(),
																	(() => {
																		var L = lt(),
																			C = L.firstChild,
																			A = C.nextSibling;
																		return (
																			A.nextSibling,
																			a(L, () => T().trim(), A),
																			L
																		);
																	})(),
																];
															},
														}),
														F,
													),
													a(F, () => q().length, H),
													_
												);
											},
										}),
										null,
									),
									D(() =>
										c(
											$,
											`flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors ${N() ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`,
										),
									),
									D(() => (X.value = T())),
									f
								);
							})(),
							(() => {
								var f = Yt();
								f.addEventListener("scroll", oe);
								var V = I;
								return (
									typeof V == "function" ? ft(V, f) : (I = f),
									a(
										f,
										s(w, {
											get when() {
												return q().length > 0;
											},
											get fallback() {
												return (() => {
													var $ = ra(),
														j = $.firstChild;
													return (
														a(
															j,
															s(w, {
																get when() {
																	return N();
																},
																get fallback() {
																	return [ia(), sa()];
																},
																get children() {
																	return [
																		ta(),
																		aa(),
																		(() => {
																			var B = na();
																			return (B.$$click = z), B;
																		})(),
																	];
																},
															}),
														),
														$
													);
												})();
											},
											get children() {
												return s(ue, {
													get each() {
														return q();
													},
													children: ($) => {
														const j = () => S().has($.id),
															B = () => (j() ? se().get($.id) : void 0);
														return s(ua, {
															item: $,
															get isSticky() {
																return j();
															},
															get stickyIndex() {
																return B();
															},
														});
													},
												});
											},
										}),
									),
									f
								);
							})(),
							(() => {
								var f = Qt(),
									V = f.firstChild,
									$ = V.firstChild,
									j = $.firstChild,
									B = j.nextSibling,
									Ke = B.nextSibling,
									Ae = V.nextSibling,
									X = Ae.firstChild,
									_ = X.nextSibling;
								return (
									($.$$click = () => p(!l())),
									a(B, xe),
									a(Ke, () => (l() ? "^" : "v")),
									a(
										V,
										s(w, {
											get when() {
												return l();
											},
											get children() {
												var P = Jt(),
													F = P.firstChild,
													U = F.firstChild,
													H = U.nextSibling,
													L = F.nextSibling;
												return (
													(H.$$click = le),
													a(
														L,
														s(ue, {
															get each() {
																return O();
															},
															children: (C) =>
																(() => {
																	var A = oa(),
																		_e = A.firstChild,
																		Qe = _e.nextSibling;
																	return (
																		(A.$$click = () => we(C)),
																		a(_e, () => yt[C]),
																		a(Qe, C),
																		D(() =>
																			c(
																				A,
																				`flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-all ${g().has(C) ? `${ht[C]} text-white` : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`,
																			),
																		),
																		A
																	);
																})(),
														}),
													),
													P
												);
											},
										}),
										null,
									),
									(X.$$keydown = be),
									(X.$$input = (P) => y(P.currentTarget.value)),
									(_.$$click = de),
									D(
										(P) => {
											var F = `${ke.text} flex-1`,
												U = Me.primary,
												H = !u().trim();
											return (
												F !== P.e && c(X, (P.e = F)),
												U !== P.t && c(_, (P.t = U)),
												H !== P.a && (_.disabled = P.a = H),
												P
											);
										},
										{ e: void 0, t: void 0, a: void 0 },
									),
									D(() => (X.value = u())),
									f
								);
							})(),
						];
					},
				}),
				null,
			),
			a(
				r,
				s(w, {
					get when() {
						return R() === "actions";
					},
					get children() {
						var f = Xt();
						return (
							a(
								f,
								s(ga, {
									get onStartPoll() {
										return e.onStartPoll;
									},
									get onStartGiveaway() {
										return e.onStartGiveaway;
									},
									get onModifyTimers() {
										return e.onModifyTimers;
									},
									get onChangeStreamSettings() {
										return e.onChangeStreamSettings;
									},
								}),
							),
							f
						);
					},
				}),
				null,
			),
			D(
				(f) => {
					var V = rt.success,
						$ = `flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-all ${R() === "events" ? "bg-white font-medium text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`,
						j = `flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-all ${R() === "actions" ? "bg-white font-medium text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`;
					return (
						V !== f.e && c(h, (f.e = V)),
						$ !== f.t && c(ce, (f.t = $)),
						j !== f.a && c(Ce, (f.a = j)),
						f
					);
				},
				{ e: void 0, t: void 0, a: void 0 },
			),
			r
		);
	})();
}
function nt(e) {
	const u = (g) => {
			const m = Math.floor(g / 3600),
				l = Math.floor((g % 3600) / 60);
			return m > 0 ? `${m}h ${l}m` : `${l}m`;
		},
		y = me(() => {
			const g = e.summary.endedAt,
				m = g instanceof Date ? g : new Date(g);
			return $t(m.toISOString());
		});
	return (() => {
		var g = la(),
			m = g.firstChild,
			l = m.firstChild,
			p = l.firstChild,
			S = p.nextSibling;
		S.firstChild;
		var d = l.nextSibling,
			b = m.nextSibling,
			M = b.firstChild,
			v = M.firstChild,
			k = M.nextSibling,
			T = k.firstChild,
			E = k.nextSibling,
			G = E.firstChild,
			ie = E.nextSibling,
			R = ie.firstChild,
			Q = b.nextSibling,
			I = Q.firstChild,
			O = I.firstChild,
			Z = O.firstChild,
			fe = Z.firstChild,
			q = fe.nextSibling,
			N = q.firstChild,
			ee = N.nextSibling,
			Se = ee.firstChild,
			z = Z.nextSibling;
		z.firstChild;
		var te = O.nextSibling,
			ae = te.firstChild,
			se = ae.nextSibling;
		se.firstChild;
		var oe = te.nextSibling,
			we = oe.firstChild,
			le = we.nextSibling;
		le.firstChild;
		var de = oe.nextSibling,
			be = de.firstChild,
			xe = be.nextSibling,
			r = Q.nextSibling,
			t = r.firstChild;
		return (
			a(S, y, null),
			a(v, () => u(e.summary.duration)),
			a(T, () => e.summary.peakViewers),
			a(G, () => e.summary.averageViewers),
			a(R, () => e.summary.totalMessages),
			a(ee, () => e.summary.totalDonations, Se),
			a(z, () => e.summary.donationAmount.toFixed(2), null),
			a(se, () => e.summary.newFollowers, null),
			a(le, () => e.summary.newSubscribers, null),
			a(xe, () => e.summary.raids),
			Je(t, "click", e.onStartNewStream, !0),
			D(
				(n) => {
					var i = J.h2,
						h = J.muted,
						x = rt.neutral,
						W = gt.base,
						ne = Me.gradient;
					return (
						i !== n.e && c(p, (n.e = i)),
						h !== n.t && c(S, (n.t = h)),
						x !== n.a && c(d, (n.a = x)),
						W !== n.o && c(Q, (n.o = W)),
						ne !== n.i && c(t, (n.i = ne)),
						n
					);
				},
				{ e: void 0, t: void 0, a: void 0, o: void 0, i: void 0 },
			),
			g
		);
	})();
}
function ge(e) {
	return (() => {
		var u = da();
		return (
			a(
				u,
				s(w, {
					get when() {
						return e.phase === "pre-stream";
					},
					get children() {
						return s(tt, {
							get metadata() {
								return (
									e.metadata || {
										title: "",
										description: "",
										category: "",
										tags: [],
									}
								);
							},
							get onMetadataChange() {
								return e.onMetadataChange || (() => {});
							},
							get streamKeyData() {
								return e.streamKeyData;
							},
							get onShowStreamKey() {
								return e.onShowStreamKey;
							},
							get showStreamKey() {
								return e.showStreamKey;
							},
							get isLoadingStreamKey() {
								return e.isLoadingStreamKey;
							},
							get onCopyStreamKey() {
								return e.onCopyStreamKey;
							},
							get copied() {
								return e.copied;
							},
						});
					},
				}),
				null,
			),
			a(
				u,
				s(w, {
					get when() {
						return e.phase === "live";
					},
					get children() {
						return s(at, {
							get activities() {
								return e.activities || [];
							},
							get streamDuration() {
								return e.streamDuration || 0;
							},
							get viewerCount() {
								return e.viewerCount || 0;
							},
							get stickyDuration() {
								return e.stickyDuration;
							},
							get connectedPlatforms() {
								return e.connectedPlatforms;
							},
							get onSendMessage() {
								return e.onSendMessage;
							},
							get onStartPoll() {
								return e.onStartPoll;
							},
							get onStartGiveaway() {
								return e.onStartGiveaway;
							},
							get onModifyTimers() {
								return e.onModifyTimers;
							},
							get onChangeStreamSettings() {
								return e.onChangeStreamSettings;
							},
						});
					},
				}),
				null,
			),
			a(
				u,
				s(w, {
					get when() {
						return e.phase === "post-stream";
					},
					get children() {
						return s(nt, {
							get summary() {
								return (
									e.summary || {
										duration: 0,
										peakViewers: 0,
										averageViewers: 0,
										totalMessages: 0,
										totalDonations: 0,
										donationAmount: 0,
										newFollowers: 0,
										newSubscribers: 0,
										raids: 0,
										endedAt: new Date(),
									}
								);
							},
							get onStartNewStream() {
								return e.onStartNewStream;
							},
						});
					},
				}),
				null,
			),
			D(() => c(u, `${gt.default} h-full`)),
			u
		);
	})();
}
wt(["input", "keydown", "click"]);
try {
	(tt.displayName = "PreStreamSettings"),
		(tt.__docgenInfo = {
			description: "",
			displayName: "PreStreamSettings",
			props: {
				metadata: {
					defaultValue: null,
					description: "",
					name: "metadata",
					required: !0,
					type: { name: "StreamMetadata" },
				},
				onMetadataChange: {
					defaultValue: null,
					description: "",
					name: "onMetadataChange",
					required: !0,
					type: { name: "(metadata: StreamMetadata) => void" },
				},
				streamKeyData: {
					defaultValue: null,
					description: "",
					name: "streamKeyData",
					required: !1,
					type: { name: "StreamKeyData | undefined" },
				},
				onShowStreamKey: {
					defaultValue: null,
					description: "",
					name: "onShowStreamKey",
					required: !1,
					type: { name: "(() => void) | undefined" },
				},
				showStreamKey: {
					defaultValue: null,
					description: "",
					name: "showStreamKey",
					required: !1,
					type: { name: "boolean | undefined" },
				},
				isLoadingStreamKey: {
					defaultValue: null,
					description: "",
					name: "isLoadingStreamKey",
					required: !1,
					type: { name: "boolean | undefined" },
				},
				onCopyStreamKey: {
					defaultValue: null,
					description: "",
					name: "onCopyStreamKey",
					required: !1,
					type: { name: "(() => void) | undefined" },
				},
				copied: {
					defaultValue: null,
					description: "",
					name: "copied",
					required: !1,
					type: { name: "boolean | undefined" },
				},
			},
		});
} catch {}
try {
	(at.displayName = "LiveStreamControlCenter"),
		(at.__docgenInfo = {
			description: "",
			displayName: "LiveStreamControlCenter",
			props: {
				activities: {
					defaultValue: null,
					description: "",
					name: "activities",
					required: !0,
					type: { name: "ActivityItem[]" },
				},
				streamDuration: {
					defaultValue: null,
					description: "",
					name: "streamDuration",
					required: !0,
					type: { name: "number" },
				},
				viewerCount: {
					defaultValue: null,
					description: "",
					name: "viewerCount",
					required: !0,
					type: { name: "number" },
				},
				stickyDuration: {
					defaultValue: null,
					description: "",
					name: "stickyDuration",
					required: !1,
					type: { name: "number | undefined" },
				},
				connectedPlatforms: {
					defaultValue: null,
					description: "",
					name: "connectedPlatforms",
					required: !1,
					type: {
						name: '("twitch" | "youtube" | "kick" | "facebook")[] | undefined',
					},
				},
				onSendMessage: {
					defaultValue: null,
					description: "",
					name: "onSendMessage",
					required: !1,
					type: {
						name: '((message: string, platforms: ("twitch" | "youtube" | "kick" | "facebook")[]) => void) | undefined',
					},
				},
				onStartPoll: {
					defaultValue: null,
					description: "",
					name: "onStartPoll",
					required: !1,
					type: { name: "(() => void) | undefined" },
				},
				onStartGiveaway: {
					defaultValue: null,
					description: "",
					name: "onStartGiveaway",
					required: !1,
					type: { name: "(() => void) | undefined" },
				},
				onModifyTimers: {
					defaultValue: null,
					description: "",
					name: "onModifyTimers",
					required: !1,
					type: { name: "(() => void) | undefined" },
				},
				onChangeStreamSettings: {
					defaultValue: null,
					description: "",
					name: "onChangeStreamSettings",
					required: !1,
					type: { name: "(() => void) | undefined" },
				},
			},
		});
} catch {}
try {
	(nt.displayName = "PostStreamSummary"),
		(nt.__docgenInfo = {
			description: "",
			displayName: "PostStreamSummary",
			props: {
				summary: {
					defaultValue: null,
					description: "",
					name: "summary",
					required: !0,
					type: { name: "StreamSummary" },
				},
				onStartNewStream: {
					defaultValue: null,
					description: "",
					name: "onStartNewStream",
					required: !1,
					type: { name: "(() => void) | undefined" },
				},
			},
		});
} catch {}
try {
	(ge.displayName = "StreamControlsWidget"),
		(ge.__docgenInfo = {
			description: "",
			displayName: "StreamControlsWidget",
			props: {
				phase: {
					defaultValue: null,
					description: "",
					name: "phase",
					required: !0,
					type: {
						name: "enum",
						value: [
							{ value: '"pre-stream"' },
							{ value: '"live"' },
							{ value: '"post-stream"' },
						],
					},
				},
				metadata: {
					defaultValue: null,
					description: "",
					name: "metadata",
					required: !1,
					type: { name: "StreamMetadata | undefined" },
				},
				onMetadataChange: {
					defaultValue: null,
					description: "",
					name: "onMetadataChange",
					required: !1,
					type: { name: "((metadata: StreamMetadata) => void) | undefined" },
				},
				streamKeyData: {
					defaultValue: null,
					description: "",
					name: "streamKeyData",
					required: !1,
					type: { name: "StreamKeyData | undefined" },
				},
				onShowStreamKey: {
					defaultValue: null,
					description: "",
					name: "onShowStreamKey",
					required: !1,
					type: { name: "(() => void) | undefined" },
				},
				showStreamKey: {
					defaultValue: null,
					description: "",
					name: "showStreamKey",
					required: !1,
					type: { name: "boolean | undefined" },
				},
				isLoadingStreamKey: {
					defaultValue: null,
					description: "",
					name: "isLoadingStreamKey",
					required: !1,
					type: { name: "boolean | undefined" },
				},
				onCopyStreamKey: {
					defaultValue: null,
					description: "",
					name: "onCopyStreamKey",
					required: !1,
					type: { name: "(() => void) | undefined" },
				},
				copied: {
					defaultValue: null,
					description: "",
					name: "copied",
					required: !1,
					type: { name: "boolean | undefined" },
				},
				activities: {
					defaultValue: null,
					description: "",
					name: "activities",
					required: !1,
					type: { name: "ActivityItem[] | undefined" },
				},
				streamDuration: {
					defaultValue: null,
					description: "",
					name: "streamDuration",
					required: !1,
					type: { name: "number | undefined" },
				},
				viewerCount: {
					defaultValue: null,
					description: "",
					name: "viewerCount",
					required: !1,
					type: { name: "number | undefined" },
				},
				stickyDuration: {
					defaultValue: null,
					description: "",
					name: "stickyDuration",
					required: !1,
					type: { name: "number | undefined" },
				},
				connectedPlatforms: {
					defaultValue: null,
					description: "",
					name: "connectedPlatforms",
					required: !1,
					type: {
						name: '("twitch" | "youtube" | "kick" | "facebook")[] | undefined',
					},
				},
				onSendMessage: {
					defaultValue: null,
					description: "",
					name: "onSendMessage",
					required: !1,
					type: {
						name: '((message: string, platforms: ("twitch" | "youtube" | "kick" | "facebook")[]) => void) | undefined',
					},
				},
				summary: {
					defaultValue: null,
					description: "",
					name: "summary",
					required: !1,
					type: { name: "StreamSummary | undefined" },
				},
				onStartNewStream: {
					defaultValue: null,
					description: "",
					name: "onStartNewStream",
					required: !1,
					type: { name: "(() => void) | undefined" },
				},
				onStartPoll: {
					defaultValue: null,
					description: "",
					name: "onStartPoll",
					required: !1,
					type: { name: "(() => void) | undefined" },
				},
				onStartGiveaway: {
					defaultValue: null,
					description: "",
					name: "onStartGiveaway",
					required: !1,
					type: { name: "(() => void) | undefined" },
				},
				onModifyTimers: {
					defaultValue: null,
					description: "",
					name: "onModifyTimers",
					required: !1,
					type: { name: "(() => void) | undefined" },
				},
				onChangeStreamSettings: {
					defaultValue: null,
					description: "",
					name: "onChangeStreamSettings",
					required: !1,
					type: { name: "(() => void) | undefined" },
				},
			},
		});
} catch {}
var ha = o("<div style=width:500px;height:600px>");
const ka = {
		title: "Components/StreamControlsWidget",
		component: ge,
		parameters: { layout: "centered" },
		tags: ["autodocs"],
		decorators: [
			(e) =>
				(() => {
					var u = ha();
					return a(u, s(e, {})), u;
				})(),
		],
	},
	it = {
		title: "Epic Gaming Session!",
		description:
			"Join me for an amazing gaming session where we explore new worlds and have fun!",
		category: "Gaming",
		tags: ["gaming", "fun", "interactive"],
	},
	st = {
		rtmpsUrl: "rtmps://live.cloudflare.com:443/live",
		rtmpsStreamKey: "abc123def456ghi789",
		srtUrl: "srt://live.cloudflare.com:778?streamid=abc123",
	},
	De = (e) => {
		const u = [
				"chat",
				"chat",
				"chat",
				"donation",
				"follow",
				"subscription",
				"raid",
				"cheer",
			],
			y = ["twitch", "youtube", "kick", "facebook"],
			g = [
				"StreamFan",
				"GamerPro",
				"ChattyKathy",
				"ViewerOne",
				"SuperDonor",
				"TwitchLover",
				"YouTubeFan",
				"KickUser",
			],
			m = [
				"Great stream!",
				"Hello everyone!",
				"This is amazing!",
				"Keep up the good work!",
				"Love this content!",
				"First time here, loving it!",
				"Can you play that song again?",
				"What's your setup?",
				"GG!",
				"Poggers!",
			];
		return Array.from({ length: e }, (l, p) => {
			const S = u[Math.floor(Math.random() * u.length)],
				d = ["donation", "cheer"].includes(S),
				b = (e - 1 - p) * 15e3;
			return {
				id: `activity-${p}`,
				type: S,
				username: `${g[Math.floor(Math.random() * g.length)]}${p}`,
				message:
					S !== "follow" ? m[Math.floor(Math.random() * m.length)] : void 0,
				amount: d ? Math.floor(Math.random() * 100) + 1 : void 0,
				currency: d ? "$" : void 0,
				platform: y[Math.floor(Math.random() * y.length)],
				timestamp: new Date(Date.now() - b),
				isImportant: ["donation", "raid", "subscription", "cheer"].includes(S),
			};
		});
	},
	ya = [
		{
			id: "1",
			type: "donation",
			username: "GenerousDonor",
			message: "Great stream! Keep it up!",
			amount: 25,
			currency: "$",
			platform: "twitch",
			timestamp: new Date(),
			isImportant: !0,
		},
		{
			id: "2",
			type: "chat",
			username: "ChatterBox",
			message: "Hello everyone! Excited to be here!",
			platform: "youtube",
			timestamp: new Date(Date.now() - 3e4),
		},
		{
			id: "3",
			type: "follow",
			username: "NewFollower123",
			platform: "twitch",
			timestamp: new Date(Date.now() - 6e4),
		},
		{
			id: "4",
			type: "subscription",
			username: "LoyalSubscriber",
			message: "6 months strong!",
			platform: "twitch",
			timestamp: new Date(Date.now() - 9e4),
			isImportant: !0,
		},
		{
			id: "5",
			type: "chat",
			username: "QuestionAsker",
			message: "What game are you playing next?",
			platform: "kick",
			timestamp: new Date(Date.now() - 12e4),
		},
		{
			id: "6",
			type: "raid",
			username: "RaidLeader",
			message: "Incoming with 150 viewers!",
			platform: "twitch",
			timestamp: new Date(Date.now() - 15e4),
			isImportant: !0,
		},
		{
			id: "7",
			type: "chat",
			username: "ActiveViewer",
			message: "This is so entertaining!",
			platform: "youtube",
			timestamp: new Date(Date.now() - 18e4),
		},
		{
			id: "8",
			type: "donation",
			username: "BigTipper",
			message: "Amazing content!",
			amount: 100,
			currency: "$",
			platform: "kick",
			timestamp: new Date(Date.now() - 21e4),
			isImportant: !0,
		},
		{
			id: "9",
			type: "chat",
			username: "RegularViewer",
			message: "Love your streams!",
			platform: "facebook",
			timestamp: new Date(Date.now() - 24e4),
		},
		{
			id: "10",
			type: "cheer",
			username: "CheerMaster",
			message: "Cheer100 Let's go!",
			amount: 1,
			currency: "$",
			platform: "twitch",
			timestamp: new Date(Date.now() - 27e4),
		},
	],
	va = De(30),
	pa = {
		duration: 7200,
		peakViewers: 1250,
		averageViewers: 850,
		totalMessages: 4532,
		totalDonations: 23,
		donationAmount: 342.5,
		newFollowers: 156,
		newSubscribers: 12,
		raids: 3,
		endedAt: new Date(Date.now() - 3e5),
	},
	Ie = {
		args: {
			phase: "pre-stream",
			metadata: it,
			onMetadataChange: (e) => console.log("Metadata changed:", e),
			streamKeyData: st,
			showStreamKey: !1,
			onShowStreamKey: () => console.log("Toggle stream key"),
			isLoadingStreamKey: !1,
			copied: !1,
			onCopyStreamKey: () => console.log("Copy stream key"),
		},
	},
	Ve = {
		args: {
			phase: "pre-stream",
			metadata: { title: "", description: "", category: "", tags: [] },
			onMetadataChange: (e) => console.log("Metadata changed:", e),
			showStreamKey: !1,
		},
	},
	Le = {
		args: {
			phase: "pre-stream",
			metadata: it,
			onMetadataChange: (e) => console.log("Metadata changed:", e),
			streamKeyData: st,
			showStreamKey: !0,
			isLoadingStreamKey: !1,
			copied: !1,
			onCopyStreamKey: () => console.log("Copy stream key"),
		},
	},
	Ge = {
		args: {
			phase: "pre-stream",
			metadata: it,
			onMetadataChange: (e) => console.log("Metadata changed:", e),
			showStreamKey: !0,
			isLoadingStreamKey: !0,
		},
	},
	re = (e, u) => {
		console.log(`Sending message to ${u.join(", ")}: ${e}`);
	},
	he = () => console.log("Start poll clicked"),
	ye = () => console.log("Start giveaway clicked"),
	ve = () => console.log("Modify timers clicked"),
	pe = () => console.log("Change stream settings clicked"),
	qe = {
		args: {
			phase: "live",
			activities: va,
			streamDuration: 3723,
			viewerCount: 1024,
			stickyDuration: 3e4,
			connectedPlatforms: ["twitch", "youtube", "kick"],
			onSendMessage: re,
			onStartPoll: he,
			onStartGiveaway: ye,
			onModifyTimers: ve,
			onChangeStreamSettings: pe,
		},
	},
	Fe = {
		args: {
			phase: "live",
			activities: [],
			streamDuration: 60,
			viewerCount: 5,
			connectedPlatforms: ["twitch"],
			onSendMessage: re,
			onStartPoll: he,
			onStartGiveaway: ye,
			onModifyTimers: ve,
			onChangeStreamSettings: pe,
		},
	},
	Ee = {
		args: {
			phase: "live",
			activities: De(50),
			streamDuration: 10800,
			viewerCount: 5e3,
			stickyDuration: 3e4,
			connectedPlatforms: ["twitch", "youtube", "kick", "facebook"],
			onSendMessage: re,
			onStartPoll: he,
			onStartGiveaway: ye,
			onModifyTimers: ve,
			onChangeStreamSettings: pe,
		},
	},
	Ne = {
		args: {
			phase: "live",
			activities: De(1e3),
			streamDuration: 36e3,
			viewerCount: 15e3,
			stickyDuration: 3e4,
			connectedPlatforms: ["twitch", "youtube", "kick", "facebook"],
			onSendMessage: re,
			onStartPoll: he,
			onStartGiveaway: ye,
			onModifyTimers: ve,
			onChangeStreamSettings: pe,
		},
	},
	ze = {
		args: {
			phase: "live",
			activities: ya.filter((e) => e.type === "chat"),
			streamDuration: 1800,
			viewerCount: 150,
			connectedPlatforms: ["twitch", "youtube"],
			onSendMessage: re,
			onStartPoll: he,
			onStartGiveaway: ye,
			onModifyTimers: ve,
			onChangeStreamSettings: pe,
		},
	},
	je = {
		args: {
			phase: "live",
			activities: [
				{
					id: "d1",
					type: "donation",
					username: "BigSpender1",
					message: "Amazing stream!",
					amount: 500,
					currency: "$",
					platform: "twitch",
					timestamp: new Date(),
					isImportant: !0,
				},
				{
					id: "d2",
					type: "donation",
					username: "Generous2",
					message: "Keep up the great work!",
					amount: 250,
					currency: "$",
					platform: "youtube",
					timestamp: new Date(Date.now() - 3e4),
					isImportant: !0,
				},
				{
					id: "d3",
					type: "donation",
					username: "Supporter3",
					message: "Love your content!",
					amount: 100,
					currency: "$",
					platform: "kick",
					timestamp: new Date(Date.now() - 6e4),
					isImportant: !0,
				},
				...De(20),
			],
			streamDuration: 2400,
			viewerCount: 2500,
			connectedPlatforms: ["twitch", "youtube", "kick"],
			onSendMessage: re,
			onStartPoll: he,
			onStartGiveaway: ye,
			onModifyTimers: ve,
			onChangeStreamSettings: pe,
		},
	},
	Re = {
		args: {
			phase: "post-stream",
			summary: pa,
			onStartNewStream: () => console.log("Start new stream"),
		},
	},
	Oe = {
		args: {
			phase: "post-stream",
			summary: {
				duration: 900,
				peakViewers: 50,
				averageViewers: 25,
				totalMessages: 120,
				totalDonations: 2,
				donationAmount: 15,
				newFollowers: 8,
				newSubscribers: 1,
				raids: 0,
				endedAt: new Date(Date.now() - 12e4),
			},
			onStartNewStream: () => console.log("Start new stream"),
		},
	},
	We = {
		args: {
			phase: "post-stream",
			summary: {
				duration: 14400,
				peakViewers: 1e4,
				averageViewers: 7500,
				totalMessages: 25e3,
				totalDonations: 150,
				donationAmount: 2500,
				newFollowers: 1200,
				newSubscribers: 85,
				raids: 8,
				endedAt: new Date(Date.now() - 18e4),
			},
			onStartNewStream: () => console.log("Start new stream"),
		},
	};
function fa() {
	const [e, u] = K({ title: "", description: "", category: "", tags: [] }),
		[y, g] = K(!1),
		[m, l] = K(!1);
	return s(ge, {
		phase: "pre-stream",
		get metadata() {
			return e();
		},
		onMetadataChange: u,
		streamKeyData: st,
		get showStreamKey() {
			return y();
		},
		onShowStreamKey: () => g(!y()),
		get copied() {
			return m();
		},
		onCopyStreamKey: () => {
			l(!0), setTimeout(() => l(!1), 2e3);
		},
	});
}
const Be = { render: () => s(fa, {}), args: { phase: "pre-stream" } };
function Sa() {
	const [e, u] = K(De(15)),
		[y, g] = K(0),
		[m, l] = K(100);
	return (
		Ze(() => {
			const S = setInterval(() => {
					g((b) => b + 1);
				}, 1e3),
				d = setInterval(() => {
					const b = ["chat", "chat", "chat", "follow", "donation"],
						M = b[Math.floor(Math.random() * b.length)],
						v = {
							id: `sim-${Date.now()}`,
							type: M,
							username: `User${Math.floor(Math.random() * 1e3)}`,
							message:
								M === "chat"
									? "Random chat message!"
									: M === "donation"
										? "Thanks for the stream!"
										: void 0,
							amount:
								M === "donation" ? Math.floor(Math.random() * 50) + 1 : void 0,
							currency: "$",
							platform: ["twitch", "youtube", "kick"][
								Math.floor(Math.random() * 3)
							],
							timestamp: new Date(),
							isImportant: M === "donation",
						};
					u((k) => [...k, v].slice(-100)),
						l((k) => Math.max(0, k + Math.floor(Math.random() * 10) - 3));
				}, 333);
			ut(() => {
				clearInterval(S), clearInterval(d);
			});
		}),
		s(ge, {
			phase: "live",
			get activities() {
				return e();
			},
			get streamDuration() {
				return y();
			},
			get viewerCount() {
				return m();
			},
			stickyDuration: 15e3,
			connectedPlatforms: ["twitch", "youtube", "kick"],
			onSendMessage: (S, d) => {
				const b = {
					id: `sent-${Date.now()}`,
					type: "chat",
					username: "Streamer (You)",
					message: S,
					platform: d[0] || "twitch",
					timestamp: new Date(),
				};
				u((M) => [...M, b].slice(-1e3)),
					console.log(`Message sent to ${d.join(", ")}: ${S}`);
			},
		})
	);
}
const Ue = { render: () => s(Sa, {}), args: { phase: "live" } };
function wa() {
	const e = () => {
			const y = Date.now();
			return [
				...Array.from({ length: 20 }, (g, m) => ({
					id: `chat-${m}`,
					type: "chat",
					username: `Chatter${m}`,
					message: `Old chat message ${m}`,
					platform: "twitch",
					timestamp: new Date(y - (25 - m) * 6e4),
				})),
				{
					id: "donation-1",
					type: "donation",
					username: "StickyDonor1",
					message: "First sticky donation!",
					amount: 50,
					currency: "$",
					platform: "twitch",
					timestamp: new Date(y - 9e4),
					isImportant: !0,
				},
				{
					id: "donation-2",
					type: "donation",
					username: "StickyDonor2",
					message: "Second sticky donation!",
					amount: 100,
					currency: "$",
					platform: "youtube",
					timestamp: new Date(y - 6e4),
					isImportant: !0,
				},
				{
					id: "donation-3",
					type: "donation",
					username: "StickyDonor3",
					message: "Third sticky donation!",
					amount: 25,
					currency: "$",
					platform: "kick",
					timestamp: new Date(y - 3e4),
					isImportant: !0,
				},
				...Array.from({ length: 10 }, (g, m) => ({
					id: `recent-chat-${m}`,
					type: "chat",
					username: `RecentChatter${m}`,
					message: `Recent chat message ${m}`,
					platform: "youtube",
					timestamp: new Date(y - (10 - m) * 1e3),
				})),
			];
		},
		[u] = K(e());
	return s(ge, {
		phase: "live",
		get activities() {
			return u();
		},
		streamDuration: 300,
		viewerCount: 500,
		stickyDuration: 12e4,
		connectedPlatforms: ["twitch", "youtube", "kick"],
		onSendMessage: (y, g) => console.log(`Send to ${g}: ${y}`),
	});
}
const He = {
		render: () => s(wa, {}),
		args: { phase: "live" },
		parameters: {
			docs: {
				description: {
					story:
						"Test story for verifying sticky donation events. The 3 donations should have yellow/amber backgrounds and stick to the top when scrolling.",
				},
			},
		},
	},
	ba = () => {
		const e = Date.now();
		return [
			{
				id: "chat-1",
				type: "chat",
				username: "ChatFan",
				message: "Great stream! Love the content!",
				platform: "twitch",
				timestamp: new Date(e - 3e5),
			},
			{
				id: "chat-2",
				type: "chat",
				username: "ViewerAlice",
				message: "Hello everyone!",
				platform: "youtube",
				timestamp: new Date(e - 28e4),
			},
			{
				id: "chat-3",
				type: "chat",
				username: "GamerBob",
				message: "What game is this?",
				platform: "kick",
				timestamp: new Date(e - 26e4),
			},
			{
				id: "donation-1",
				type: "donation",
				username: "GenerousDonor",
				message: "Keep up the amazing work!",
				amount: 50,
				currency: "$",
				platform: "twitch",
				timestamp: new Date(e - 24e4),
				isImportant: !0,
			},
			{
				id: "donation-2",
				type: "donation",
				username: "BigTipper",
				message: "Love your streams!",
				amount: 100,
				currency: "$",
				platform: "youtube",
				timestamp: new Date(e - 22e4),
				isImportant: !0,
			},
			{
				id: "follow-1",
				type: "follow",
				username: "NewFollower123",
				platform: "twitch",
				timestamp: new Date(e - 2e5),
			},
			{
				id: "follow-2",
				type: "follow",
				username: "StreamLover",
				platform: "kick",
				timestamp: new Date(e - 18e4),
			},
			{
				id: "sub-1",
				type: "subscription",
				username: "LoyalSub",
				message: "6 months strong!",
				platform: "twitch",
				timestamp: new Date(e - 16e4),
				isImportant: !0,
			},
			{
				id: "raid-1",
				type: "raid",
				username: "RaidLeader",
				message: "Incoming with 200 viewers!",
				platform: "twitch",
				timestamp: new Date(e - 14e4),
				isImportant: !0,
			},
			{
				id: "cheer-1",
				type: "cheer",
				username: "CheerMaster",
				message: "Cheer500 Let's go!",
				amount: 5,
				currency: "$",
				platform: "twitch",
				timestamp: new Date(e - 12e4),
				isImportant: !0,
			},
			{
				id: "chat-4",
				type: "chat",
				username: "ChatFan",
				message: "Thanks for answering my question!",
				platform: "twitch",
				timestamp: new Date(e - 1e5),
			},
			{
				id: "chat-5",
				type: "chat",
				username: "RandomViewer",
				message: "GG!",
				platform: "facebook",
				timestamp: new Date(e - 8e4),
			},
		];
	},
	Ye = {
		args: {
			phase: "live",
			activities: ba(),
			streamDuration: 1800,
			viewerCount: 500,
			connectedPlatforms: ["twitch", "youtube", "kick", "facebook"],
			onSendMessage: re,
		},
		parameters: {
			docs: {
				description: {
					story:
						"Test story for verifying event filtering. Use the filter button to filter by event type, or the search box to find events by username or message content. Try searching for 'ChatFan' or 'amazing' to test text filtering.",
				},
			},
		},
	};
Ie.parameters = {
	...Ie.parameters,
	docs: {
		...Ie.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    phase: "pre-stream",
    metadata: sampleMetadata,
    onMetadataChange: (metadata: StreamMetadata) => console.log("Metadata changed:", metadata),
    streamKeyData: sampleStreamKeyData,
    showStreamKey: false,
    onShowStreamKey: () => console.log("Toggle stream key"),
    isLoadingStreamKey: false,
    copied: false,
    onCopyStreamKey: () => console.log("Copy stream key")
  }
}`,
			...Ie.parameters?.docs?.source,
		},
	},
};
Ve.parameters = {
	...Ve.parameters,
	docs: {
		...Ve.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    phase: "pre-stream",
    metadata: {
      title: "",
      description: "",
      category: "",
      tags: []
    },
    onMetadataChange: (metadata: StreamMetadata) => console.log("Metadata changed:", metadata),
    showStreamKey: false
  }
}`,
			...Ve.parameters?.docs?.source,
		},
	},
};
Le.parameters = {
	...Le.parameters,
	docs: {
		...Le.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    phase: "pre-stream",
    metadata: sampleMetadata,
    onMetadataChange: (metadata: StreamMetadata) => console.log("Metadata changed:", metadata),
    streamKeyData: sampleStreamKeyData,
    showStreamKey: true,
    isLoadingStreamKey: false,
    copied: false,
    onCopyStreamKey: () => console.log("Copy stream key")
  }
}`,
			...Le.parameters?.docs?.source,
		},
	},
};
Ge.parameters = {
	...Ge.parameters,
	docs: {
		...Ge.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    phase: "pre-stream",
    metadata: sampleMetadata,
    onMetadataChange: (metadata: StreamMetadata) => console.log("Metadata changed:", metadata),
    showStreamKey: true,
    isLoadingStreamKey: true
  }
}`,
			...Ge.parameters?.docs?.source,
		},
	},
};
qe.parameters = {
	...qe.parameters,
	docs: {
		...qe.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    phase: "live",
    activities: manyActivities,
    streamDuration: 3723,
    // 1 hour 2 minutes 3 seconds
    viewerCount: 1024,
    stickyDuration: 30000,
    connectedPlatforms: ["twitch", "youtube", "kick"],
    onSendMessage: handleSendMessage,
    onStartPoll: handleStartPoll,
    onStartGiveaway: handleStartGiveaway,
    onModifyTimers: handleModifyTimers,
    onChangeStreamSettings: handleChangeStreamSettings
  }
}`,
			...qe.parameters?.docs?.source,
		},
	},
};
Fe.parameters = {
	...Fe.parameters,
	docs: {
		...Fe.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    phase: "live",
    activities: [],
    streamDuration: 60,
    viewerCount: 5,
    connectedPlatforms: ["twitch"],
    onSendMessage: handleSendMessage,
    onStartPoll: handleStartPoll,
    onStartGiveaway: handleStartGiveaway,
    onModifyTimers: handleModifyTimers,
    onChangeStreamSettings: handleChangeStreamSettings
  }
}`,
			...Fe.parameters?.docs?.source,
		},
	},
};
Ee.parameters = {
	...Ee.parameters,
	docs: {
		...Ee.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    phase: "live",
    activities: generateActivities(50),
    streamDuration: 10800,
    // 3 hours
    viewerCount: 5000,
    stickyDuration: 30000,
    connectedPlatforms: ["twitch", "youtube", "kick", "facebook"],
    onSendMessage: handleSendMessage,
    onStartPoll: handleStartPoll,
    onStartGiveaway: handleStartGiveaway,
    onModifyTimers: handleModifyTimers,
    onChangeStreamSettings: handleChangeStreamSettings
  }
}`,
			...Ee.parameters?.docs?.source,
		},
	},
};
Ne.parameters = {
	...Ne.parameters,
	docs: {
		...Ne.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    phase: "live",
    activities: generateActivities(1000),
    streamDuration: 36000,
    // 10 hours
    viewerCount: 15000,
    stickyDuration: 30000,
    connectedPlatforms: ["twitch", "youtube", "kick", "facebook"],
    onSendMessage: handleSendMessage,
    onStartPoll: handleStartPoll,
    onStartGiveaway: handleStartGiveaway,
    onModifyTimers: handleModifyTimers,
    onChangeStreamSettings: handleChangeStreamSettings
  }
}`,
			...Ne.parameters?.docs?.source,
		},
	},
};
ze.parameters = {
	...ze.parameters,
	docs: {
		...ze.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    phase: "live",
    activities: sampleActivities.filter(a => a.type === "chat"),
    streamDuration: 1800,
    viewerCount: 150,
    connectedPlatforms: ["twitch", "youtube"],
    onSendMessage: handleSendMessage,
    onStartPoll: handleStartPoll,
    onStartGiveaway: handleStartGiveaway,
    onModifyTimers: handleModifyTimers,
    onChangeStreamSettings: handleChangeStreamSettings
  }
}`,
			...ze.parameters?.docs?.source,
		},
	},
};
je.parameters = {
	...je.parameters,
	docs: {
		...je.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    phase: "live",
    activities: [{
      id: "d1",
      type: "donation" as const,
      username: "BigSpender1",
      message: "Amazing stream!",
      amount: 500.0,
      currency: "$",
      platform: "twitch",
      timestamp: new Date(),
      isImportant: true
    }, {
      id: "d2",
      type: "donation" as const,
      username: "Generous2",
      message: "Keep up the great work!",
      amount: 250.0,
      currency: "$",
      platform: "youtube",
      timestamp: new Date(Date.now() - 30000),
      isImportant: true
    }, {
      id: "d3",
      type: "donation" as const,
      username: "Supporter3",
      message: "Love your content!",
      amount: 100.0,
      currency: "$",
      platform: "kick",
      timestamp: new Date(Date.now() - 60000),
      isImportant: true
    }, ...generateActivities(20)],
    streamDuration: 2400,
    viewerCount: 2500,
    connectedPlatforms: ["twitch", "youtube", "kick"],
    onSendMessage: handleSendMessage,
    onStartPoll: handleStartPoll,
    onStartGiveaway: handleStartGiveaway,
    onModifyTimers: handleModifyTimers,
    onChangeStreamSettings: handleChangeStreamSettings
  }
}`,
			...je.parameters?.docs?.source,
		},
	},
};
Re.parameters = {
	...Re.parameters,
	docs: {
		...Re.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    phase: "post-stream",
    summary: sampleSummary,
    onStartNewStream: () => console.log("Start new stream")
  }
}`,
			...Re.parameters?.docs?.source,
		},
	},
};
Oe.parameters = {
	...Oe.parameters,
	docs: {
		...Oe.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    phase: "post-stream",
    summary: {
      duration: 900,
      // 15 minutes
      peakViewers: 50,
      averageViewers: 25,
      totalMessages: 120,
      totalDonations: 2,
      donationAmount: 15.0,
      newFollowers: 8,
      newSubscribers: 1,
      raids: 0,
      endedAt: new Date(Date.now() - 120000) // 2 minutes ago
    },
    onStartNewStream: () => console.log("Start new stream")
  }
}`,
			...Oe.parameters?.docs?.source,
		},
	},
};
We.parameters = {
	...We.parameters,
	docs: {
		...We.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    phase: "post-stream",
    summary: {
      duration: 14400,
      // 4 hours
      peakViewers: 10000,
      averageViewers: 7500,
      totalMessages: 25000,
      totalDonations: 150,
      donationAmount: 2500.0,
      newFollowers: 1200,
      newSubscribers: 85,
      raids: 8,
      endedAt: new Date(Date.now() - 180000) // 3 minutes ago
    },
    onStartNewStream: () => console.log("Start new stream")
  }
}`,
			...We.parameters?.docs?.source,
		},
	},
};
Be.parameters = {
	...Be.parameters,
	docs: {
		...Be.parameters?.docs,
		source: {
			originalSource: `{
  render: () => <InteractivePreStreamWrapper />,
  args: {
    phase: "pre-stream"
  }
}`,
			...Be.parameters?.docs?.source,
		},
	},
};
Ue.parameters = {
	...Ue.parameters,
	docs: {
		...Ue.parameters?.docs,
		source: {
			originalSource: `{
  render: () => <InteractiveLiveWrapper />,
  args: {
    phase: "live"
  }
}`,
			...Ue.parameters?.docs?.source,
		},
	},
};
He.parameters = {
	...He.parameters,
	docs: {
		...He.parameters?.docs,
		source: {
			originalSource: `{
  render: () => <StickyTestWrapper />,
  args: {
    phase: "live"
  },
  parameters: {
    docs: {
      description: {
        story: "Test story for verifying sticky donation events. The 3 donations should have yellow/amber backgrounds and stick to the top when scrolling."
      }
    }
  }
}`,
			...He.parameters?.docs?.source,
		},
	},
};
Ye.parameters = {
	...Ye.parameters,
	docs: {
		...Ye.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    phase: "live",
    activities: generateFilterTestActivities(),
    streamDuration: 1800,
    viewerCount: 500,
    connectedPlatforms: ["twitch", "youtube", "kick", "facebook"],
    onSendMessage: handleSendMessage
  },
  parameters: {
    docs: {
      description: {
        story: "Test story for verifying event filtering. Use the filter button to filter by event type, or the search box to find events by username or message content. Try searching for 'ChatFan' or 'amazing' to test text filtering."
      }
    }
  }
}`,
			...Ye.parameters?.docs?.source,
		},
	},
};
const Ma = [
	"PreStream",
	"PreStreamEmpty",
	"PreStreamWithKeyVisible",
	"PreStreamKeyLoading",
	"Live",
	"LiveEmpty",
	"LiveBusy",
	"LiveVirtualized",
	"LiveChatOnly",
	"LiveManyDonations",
	"PostStream",
	"PostStreamShort",
	"PostStreamSuccessful",
	"InteractivePreStream",
	"InteractiveLive",
	"StickyEventsTest",
	"FilterTest",
];
export {
	Ye as FilterTest,
	Ue as InteractiveLive,
	Be as InteractivePreStream,
	qe as Live,
	Ee as LiveBusy,
	ze as LiveChatOnly,
	Fe as LiveEmpty,
	je as LiveManyDonations,
	Ne as LiveVirtualized,
	Re as PostStream,
	Oe as PostStreamShort,
	We as PostStreamSuccessful,
	Ie as PreStream,
	Ve as PreStreamEmpty,
	Ge as PreStreamKeyLoading,
	Le as PreStreamWithKeyVisible,
	He as StickyEventsTest,
	Ma as __namedExportsOrder,
	ka as default,
};
