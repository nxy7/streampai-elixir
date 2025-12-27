import {
	b as Q,
	t as i,
	i as n,
	c as u,
	a as U,
	S as W,
	s as A,
	g as b,
	j as se,
} from "./iframe-BQDcX1su.js";
import { B as ce } from "./Badge-CXO3PRin.js";
import { C as q } from "./Card-tIayDlwk.js";
import "./preload-helper-PPVm8Dsz.js";
import "./design-system-CwcdUVvG.js";
var ie = i('<img class="h-12 w-12 rounded-lg object-cover">'),
	le = i('<div class="text-gray-500 text-xs uppercase">Views (30d)'),
	O = i('<div class="mt-1 font-bold text-gray-900 text-xl">'),
	ue = i('<div class="text-gray-500 text-xs uppercase">Sponsors'),
	de = i('<div class="text-gray-500 text-xs uppercase">Followers'),
	me = i("<span class=text-gray-400>"),
	ge = i(
		'<div><div class="flex items-start justify-between"><div class="flex items-center space-x-3"><div></div><div><div class="flex items-center gap-2"><span class="font-semibold text-gray-900"></span></div><div class="text-gray-500 text-sm">Connected</div></div></div><div class="flex items-center gap-2"><button type=button aria-label="Refresh stats"><svg aria-hidden=true fill=none stroke=currentColor viewBox="0 0 24 24"><path stroke-linecap=round stroke-linejoin=round stroke-width=2 d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg><span class="hidden sm:inline"></span></button><button type=button aria-label="Disconnect account"><svg aria-hidden=true class="h-4 w-4"fill=none stroke=currentColor viewBox="0 0 24 24"><path stroke-linecap=round stroke-linejoin=round stroke-width=2 d="M6 18L18 6M6 6l12 12"></path></svg><span class="hidden sm:inline"></span></button></div></div><div class="mt-4 grid grid-cols-3 gap-3"></div><div class="mt-3 flex items-center justify-between text-gray-500 text-xs"><span>Last updated: ',
	),
	fe = i('<span class="font-bold text-lg text-white">');
const pe = {
	youtube: {
		name: "YouTube",
		color: "from-red-600 to-red-700",
		bgColor: "bg-red-50",
		textColor: "text-red-700",
		borderColor: "border-red-200",
		badgeVariant: "error",
	},
	twitch: {
		name: "Twitch",
		color: "from-purple-600 to-purple-700",
		bgColor: "bg-purple-50",
		textColor: "text-purple-700",
		borderColor: "border-purple-200",
		badgeVariant: "purple",
	},
	facebook: {
		name: "Facebook",
		color: "from-blue-600 to-blue-700",
		bgColor: "bg-blue-50",
		textColor: "text-blue-700",
		borderColor: "border-blue-200",
		badgeVariant: "info",
	},
	kick: {
		name: "Kick",
		color: "from-green-600 to-green-700",
		bgColor: "bg-green-50",
		textColor: "text-green-700",
		borderColor: "border-green-200",
		badgeVariant: "success",
	},
	tiktok: {
		name: "TikTok",
		color: "from-gray-800 to-black",
		bgColor: "bg-gray-50",
		textColor: "text-gray-700",
		borderColor: "border-gray-200",
		badgeVariant: "neutral",
	},
	trovo: {
		name: "Trovo",
		color: "from-green-500 to-teal-600",
		bgColor: "bg-teal-50",
		textColor: "text-teal-700",
		borderColor: "border-teal-200",
		badgeVariant: "success",
	},
	instagram: {
		name: "Instagram",
		color: "from-pink-500 to-purple-600",
		bgColor: "bg-pink-50",
		textColor: "text-pink-700",
		borderColor: "border-pink-200",
		badgeVariant: "pink",
	},
	rumble: {
		name: "Rumble",
		color: "from-green-600 to-green-800",
		bgColor: "bg-green-50",
		textColor: "text-green-700",
		borderColor: "border-green-200",
		badgeVariant: "success",
	},
};
function M(t) {
	if (t === null) return "-";
	const o = typeof t == "bigint" ? Number(t) : t;
	return o >= 1e6
		? `${(o / 1e6).toFixed(1)}M`
		: o >= 1e3
			? `${(o / 1e3).toFixed(1)}K`
			: o.toLocaleString();
}
function he(t) {
	if (!t) return "Never";
	const o = new Date(t),
		d = new Date().getTime() - o.getTime(),
		l = Math.floor(d / 6e4),
		a = Math.floor(l / 60),
		p = Math.floor(a / 24);
	return l < 1
		? "Just now"
		: l < 60
			? `${l}m ago`
			: a < 24
				? `${a}h ago`
				: p < 7
					? `${p}d ago`
					: o.toLocaleDateString();
}
function F(t) {
	const [o, T] = Q(!1),
		[d, l] = Q(!1),
		a = () => pe[t.data.platform],
		p = async () => {
			if (t.onRefresh) {
				T(!0);
				try {
					await t.onRefresh();
				} finally {
					T(!1);
				}
			}
		},
		Z = async () => {
			if (t.onDisconnect && confirm(`Disconnect your ${a().name} account?`)) {
				l(!0);
				try {
					await t.onDisconnect();
				} finally {
					l(!1);
				}
			}
		};
	return (() => {
		var V = ge(),
			j = V.firstChild,
			K = j.firstChild,
			_ = K.firstChild,
			ee = _.nextSibling,
			P = ee.firstChild,
			te = P.firstChild,
			ne = K.nextSibling,
			m = ne.firstChild,
			Y = m.firstChild,
			ae = Y.nextSibling,
			h = m.nextSibling,
			oe = h.firstChild,
			re = oe.nextSibling,
			w = j.nextSibling,
			B = w.nextSibling,
			E = B.firstChild;
		return (
			E.firstChild,
			n(
				_,
				u(W, {
					get when() {
						return t.data.accountImage;
					},
					get fallback() {
						return (() => {
							var e = fe();
							return n(e, () => a().name[0]), e;
						})();
					},
					get children() {
						var e = ie();
						return (
							U(
								(c) => {
									var g = t.data.accountImage,
										f = a().name;
									return (
										g !== c.e && A(e, "src", (c.e = g)),
										f !== c.t && A(e, "alt", (c.t = f)),
										c
									);
								},
								{ e: void 0, t: void 0 },
							),
							e
						);
					},
				}),
			),
			n(te, () => t.data.accountName),
			n(
				P,
				u(ce, {
					get variant() {
						return a().badgeVariant;
					},
					size: "sm",
					get children() {
						return a().name;
					},
				}),
				null,
			),
			(m.$$click = p),
			n(ae, () => (o() ? "Refreshing..." : "Refresh")),
			(h.$$click = Z),
			n(re, () => (d() ? "..." : "Disconnect")),
			n(
				w,
				u(q, {
					padding: "sm",
					class: "rounded-lg",
					get children() {
						return [
							le(),
							(() => {
								var e = O();
								return n(e, () => M(t.data.viewsLast30d)), e;
							})(),
						];
					},
				}),
				null,
			),
			n(
				w,
				u(q, {
					padding: "sm",
					class: "rounded-lg",
					get children() {
						return [
							ue(),
							(() => {
								var e = O();
								return n(e, () => M(t.data.sponsorCount)), e;
							})(),
						];
					},
				}),
				null,
			),
			n(
				w,
				u(q, {
					padding: "sm",
					class: "rounded-lg",
					get children() {
						return [
							de(),
							(() => {
								var e = O();
								return n(e, () => M(t.data.followerCount)), e;
							})(),
						];
					},
				}),
				null,
			),
			n(E, () => he(t.data.statsLastRefreshedAt), null),
			n(
				B,
				u(W, {
					get when() {
						return t.data.statsLastRefreshedAt;
					},
					get children() {
						var e = me();
						return (
							n(e, () =>
								new Date(t.data.statsLastRefreshedAt).toLocaleString(),
							),
							e
						);
					},
				}),
				null,
			),
			U(
				(e) => {
					var c = `rounded-lg border ${a().borderColor} ${a().bgColor} p-4`,
						g = `h-12 w-12 bg-linear-to-r ${a().color} flex items-center justify-center rounded-lg`,
						f = o(),
						H = `flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors ${o() ? "cursor-not-allowed bg-gray-100 text-gray-400" : `${a().bgColor} ${a().textColor} hover:bg-opacity-80`}`,
						G = `h-4 w-4 ${o() ? "animate-spin" : ""}`,
						z = d(),
						J = `flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors ${d() ? "cursor-not-allowed bg-gray-100 text-gray-400" : "bg-red-50 text-red-600 hover:bg-red-100"}`;
					return (
						c !== e.e && b(V, (e.e = c)),
						g !== e.t && b(_, (e.t = g)),
						f !== e.a && (m.disabled = e.a = f),
						H !== e.o && b(m, (e.o = H)),
						G !== e.i && A(Y, "class", (e.i = G)),
						z !== e.n && (h.disabled = e.n = z),
						J !== e.s && b(h, (e.s = J)),
						e
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
				},
			),
			V
		);
	})();
}
se(["click"]);
try {
	(F.displayName = "StreamingAccountStats"),
		(F.__docgenInfo = {
			description: "",
			displayName: "StreamingAccountStats",
			props: {
				data: {
					defaultValue: null,
					description: "",
					name: "data",
					required: !0,
					type: { name: "StreamingAccountData" },
				},
				onRefresh: {
					defaultValue: null,
					description: "",
					name: "onRefresh",
					required: !1,
					type: { name: "(() => Promise<void>) | undefined" },
				},
				onDisconnect: {
					defaultValue: null,
					description: "",
					name: "onDisconnect",
					required: !1,
					type: { name: "(() => Promise<void>) | undefined" },
				},
			},
		});
} catch {}
const ke = {
		title: "Settings/StreamingAccountStats",
		component: F,
		parameters: { layout: "padded", backgrounds: { default: "light" } },
		tags: ["autodocs"],
	},
	X = {
		platform: "youtube",
		accountName: "StreamerChannel",
		accountImage: null,
		sponsorCount: 1250,
		viewsLast30d: 485e3,
		followerCount: 52400,
		uniqueViewersLast30d: 48750,
		statsLastRefreshedAt: new Date(Date.now() - 7200 * 1e3).toISOString(),
	},
	we = {
		platform: "twitch",
		accountName: "ProGamerTV",
		accountImage: "https://picsum.photos/48",
		sponsorCount: 3420,
		viewsLast30d: 892e3,
		followerCount: 125e3,
		uniqueViewersLast30d: 8750,
		statsLastRefreshedAt: new Date(Date.now() - 1800 * 1e3).toISOString(),
	},
	be = {
		platform: "facebook",
		accountName: "Gaming Page",
		accountImage: null,
		sponsorCount: 450,
		viewsLast30d: 156e3,
		followerCount: 28500,
		uniqueViewersLast30d: null,
		statsLastRefreshedAt: new Date(Date.now() - 300 * 60 * 1e3).toISOString(),
	},
	ve = {
		platform: "kick",
		accountName: "KickStreamer",
		accountImage: null,
		sponsorCount: 890,
		viewsLast30d: 234e3,
		followerCount: 45600,
		uniqueViewersLast30d: 2100,
		statsLastRefreshedAt: new Date(Date.now() - 900 * 1e3).toISOString(),
	},
	r = () => new Promise((t) => setTimeout(t, 1500)),
	s = () => new Promise((t) => setTimeout(t, 1e3)),
	v = { args: { data: X, onRefresh: r, onDisconnect: s } },
	D = { args: { data: we, onRefresh: r, onDisconnect: s } },
	C = { args: { data: be, onRefresh: r, onDisconnect: s } },
	S = { args: { data: ve, onRefresh: r, onDisconnect: s } },
	R = {
		args: {
			data: {
				platform: "tiktok",
				accountName: "TikTokCreator",
				accountImage: null,
				sponsorCount: null,
				viewsLast30d: 25e5,
				followerCount: 89e4,
				uniqueViewersLast30d: null,
				statsLastRefreshedAt: new Date(Date.now() - 2700 * 1e3).toISOString(),
			},
			onRefresh: r,
			onDisconnect: s,
		},
	},
	x = {
		args: {
			data: {
				platform: "instagram",
				accountName: "InstaStreamer",
				accountImage: "https://picsum.photos/48?random=2",
				sponsorCount: 1500,
				viewsLast30d: 45e4,
				followerCount: 95e3,
				uniqueViewersLast30d: null,
				statsLastRefreshedAt: new Date(Date.now() - 10800 * 1e3).toISOString(),
			},
			onRefresh: r,
			onDisconnect: s,
		},
	},
	k = {
		args: {
			data: {
				platform: "rumble",
				accountName: "RumbleChannel",
				accountImage: null,
				sponsorCount: 350,
				viewsLast30d: 125e3,
				followerCount: 18500,
				uniqueViewersLast30d: 4200,
				statsLastRefreshedAt: new Date(
					Date.now() - 480 * 60 * 1e3,
				).toISOString(),
			},
			onRefresh: r,
			onDisconnect: s,
		},
	},
	L = {
		args: {
			data: {
				platform: "trovo",
				accountName: "TrovoStreamer",
				accountImage: null,
				sponsorCount: 220,
				viewsLast30d: 78e3,
				followerCount: 12400,
				uniqueViewersLast30d: 850,
				statsLastRefreshedAt: new Date(
					Date.now() - 720 * 60 * 1e3,
				).toISOString(),
			},
			onRefresh: r,
			onDisconnect: s,
		},
	},
	y = {
		args: {
			data: {
				platform: "youtube",
				accountName: "NewChannel",
				accountImage: null,
				sponsorCount: null,
				viewsLast30d: null,
				followerCount: null,
				uniqueViewersLast30d: null,
				statsLastRefreshedAt: null,
			},
			onRefresh: r,
			onDisconnect: s,
		},
	},
	I = {
		args: {
			data: {
				platform: "twitch",
				accountName: "MegaStreamer",
				accountImage: "https://picsum.photos/48?random=3",
				sponsorCount: 125e3,
				viewsLast30d: 45e6,
				followerCount: 85e5,
				uniqueViewersLast30d: 35e4,
				statsLastRefreshedAt: new Date(Date.now() - 300 * 1e3).toISOString(),
			},
			onRefresh: r,
			onDisconnect: s,
		},
	},
	$ = {
		args: {
			data: {
				platform: "kick",
				accountName: "NewStreamer",
				accountImage: null,
				sponsorCount: 5,
				viewsLast30d: 250,
				followerCount: 42,
				uniqueViewersLast30d: 3,
				statsLastRefreshedAt: new Date(Date.now() - 60 * 1e3).toISOString(),
			},
			onRefresh: r,
			onDisconnect: s,
		},
	},
	N = { args: { data: X } };
v.parameters = {
	...v.parameters,
	docs: {
		...v.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    data: mockYouTubeData,
    onRefresh: simulateRefresh,
    onDisconnect: simulateDisconnect
  }
}`,
			...v.parameters?.docs?.source,
		},
	},
};
D.parameters = {
	...D.parameters,
	docs: {
		...D.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    data: mockTwitchData,
    onRefresh: simulateRefresh,
    onDisconnect: simulateDisconnect
  }
}`,
			...D.parameters?.docs?.source,
		},
	},
};
C.parameters = {
	...C.parameters,
	docs: {
		...C.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    data: mockFacebookData,
    onRefresh: simulateRefresh,
    onDisconnect: simulateDisconnect
  }
}`,
			...C.parameters?.docs?.source,
		},
	},
};
S.parameters = {
	...S.parameters,
	docs: {
		...S.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    data: mockKickData,
    onRefresh: simulateRefresh,
    onDisconnect: simulateDisconnect
  }
}`,
			...S.parameters?.docs?.source,
		},
	},
};
R.parameters = {
	...R.parameters,
	docs: {
		...R.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    data: {
      platform: "tiktok",
      accountName: "TikTokCreator",
      accountImage: null,
      sponsorCount: null,
      viewsLast30d: 2500000,
      followerCount: 890000,
      uniqueViewersLast30d: null,
      statsLastRefreshedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
    },
    onRefresh: simulateRefresh,
    onDisconnect: simulateDisconnect
  }
}`,
			...R.parameters?.docs?.source,
		},
	},
};
x.parameters = {
	...x.parameters,
	docs: {
		...x.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    data: {
      platform: "instagram",
      accountName: "InstaStreamer",
      accountImage: "https://picsum.photos/48?random=2",
      sponsorCount: 1500,
      viewsLast30d: 450000,
      followerCount: 95000,
      uniqueViewersLast30d: null,
      statsLastRefreshedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    },
    onRefresh: simulateRefresh,
    onDisconnect: simulateDisconnect
  }
}`,
			...x.parameters?.docs?.source,
		},
	},
};
k.parameters = {
	...k.parameters,
	docs: {
		...k.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    data: {
      platform: "rumble",
      accountName: "RumbleChannel",
      accountImage: null,
      sponsorCount: 350,
      viewsLast30d: 125000,
      followerCount: 18500,
      uniqueViewersLast30d: 4200,
      statsLastRefreshedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
    },
    onRefresh: simulateRefresh,
    onDisconnect: simulateDisconnect
  }
}`,
			...k.parameters?.docs?.source,
		},
	},
};
L.parameters = {
	...L.parameters,
	docs: {
		...L.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    data: {
      platform: "trovo",
      accountName: "TrovoStreamer",
      accountImage: null,
      sponsorCount: 220,
      viewsLast30d: 78000,
      followerCount: 12400,
      uniqueViewersLast30d: 850,
      statsLastRefreshedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    },
    onRefresh: simulateRefresh,
    onDisconnect: simulateDisconnect
  }
}`,
			...L.parameters?.docs?.source,
		},
	},
};
y.parameters = {
	...y.parameters,
	docs: {
		...y.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    data: {
      platform: "youtube",
      accountName: "NewChannel",
      accountImage: null,
      sponsorCount: null,
      viewsLast30d: null,
      followerCount: null,
      uniqueViewersLast30d: null,
      statsLastRefreshedAt: null
    },
    onRefresh: simulateRefresh,
    onDisconnect: simulateDisconnect
  }
}`,
			...y.parameters?.docs?.source,
		},
	},
};
I.parameters = {
	...I.parameters,
	docs: {
		...I.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    data: {
      platform: "twitch",
      accountName: "MegaStreamer",
      accountImage: "https://picsum.photos/48?random=3",
      sponsorCount: 125000,
      viewsLast30d: 45000000,
      followerCount: 8500000,
      uniqueViewersLast30d: 350000,
      statsLastRefreshedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    },
    onRefresh: simulateRefresh,
    onDisconnect: simulateDisconnect
  }
}`,
			...I.parameters?.docs?.source,
		},
	},
};
$.parameters = {
	...$.parameters,
	docs: {
		...$.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    data: {
      platform: "kick",
      accountName: "NewStreamer",
      accountImage: null,
      sponsorCount: 5,
      viewsLast30d: 250,
      followerCount: 42,
      uniqueViewersLast30d: 3,
      statsLastRefreshedAt: new Date(Date.now() - 60 * 1000).toISOString()
    },
    onRefresh: simulateRefresh,
    onDisconnect: simulateDisconnect
  }
}`,
			...$.parameters?.docs?.source,
		},
	},
};
N.parameters = {
	...N.parameters,
	docs: {
		...N.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    data: mockYouTubeData
  }
}`,
			...N.parameters?.docs?.source,
		},
	},
};
const Le = [
	"YouTube",
	"Twitch",
	"Facebook",
	"Kick",
	"TikTok",
	"Instagram",
	"Rumble",
	"Trovo",
	"NeverRefreshed",
	"LargeNumbers",
	"SmallNumbers",
	"ReadOnly",
];
export {
	C as Facebook,
	x as Instagram,
	S as Kick,
	I as LargeNumbers,
	y as NeverRefreshed,
	N as ReadOnly,
	k as Rumble,
	$ as SmallNumbers,
	R as TikTok,
	L as Trovo,
	D as Twitch,
	v as YouTube,
	Le as __namedExportsOrder,
	ke as default,
};
