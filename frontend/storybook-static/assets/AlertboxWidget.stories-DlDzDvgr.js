import {
	e as E,
	t as c,
	i as n,
	c as y,
	S as $,
	m as F,
	a as A,
	g as u,
	v as M,
} from "./iframe-BQDcX1su.js";
import { w as T, a as G, e as r } from "./index-CTbdOwF5.js";
import { g as H, a as I, b as O, c as J } from "./eventMetadata-BsurlWsB.js";
import { f as z, g as Q, a as U } from "./widgetHelpers-yXM85bUd.js";
import "./preload-helper-PPVm8Dsz.js";
var ee = c(
		'<div class="mb-6 text-center"><div class="relative inline-block"><div class="absolute inset-0 font-black text-4xl text-green-400 opacity-50 blur-sm"></div><div class="relative font-black text-4xl text-green-400 drop-shadow-lg">',
	),
	te = c(
		'<div class="mb-4 text-center"><div class="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm"><div class="font-medium text-gray-200 leading-relaxed">',
	),
	ae = c(
		'<div><div class="absolute inset-0 rounded-lg bg-linear-to-r from-purple-500/50 to-pink-500/50 opacity-20 blur-sm"></div><div></div><div class="relative z-10"><div class="mb-6 text-center"><div></div><div class="font-bold text-2xl text-white drop-shadow-sm"></div><div class="mt-3 flex justify-center"><div class="rounded-full border border-white/20 bg-white/10 px-3 py-1 font-semibold text-white text-xs backdrop-blur-sm"><span class=opacity-70>via</span> <span class=font-bold></span></div></div></div><div class="absolute top-4 right-4 h-2 w-2 animate-pulse rounded-full bg-white/30"></div><div class="absolute bottom-4 left-4 h-1 w-1 animate-pulse rounded-full bg-white/20 delay-300"></div></div><div class="absolute right-0 bottom-0 left-0 h-1 overflow-hidden rounded-b-lg bg-white/10"><div class="h-full bg-linear-to-r from-purple-500 to-pink-500"style=width:100%>',
	),
	ne =
		c(`<div class="alertbox-widget relative h-full w-full overflow-hidden"><style>
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.85) translateY(20px); filter: blur(4px); }
          to { opacity: 1; transform: scale(1) translateY(0); filter: blur(0px); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(-60px) scale(0.8) rotateX(15deg); filter: blur(4px); }
          to { opacity: 1; transform: translateY(0) scale(1) rotateX(0deg); filter: blur(0px); }
        }
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.2) translateY(-100px) rotateZ(-5deg); filter: blur(4px); }
          50% { opacity: 1; transform: scale(1.15) translateY(-10px) rotateZ(2deg); filter: blur(1px); }
          75% { transform: scale(0.95) translateY(5px) rotateZ(-1deg); filter: blur(0px); }
          100% { opacity: 1; transform: scale(1) translateY(0) rotateZ(0deg); filter: blur(0px); }
        }
        @keyframes fade-out {
          from { opacity: 1; transform: scale(1) translateY(0); filter: blur(0px); }
          to { opacity: 0; transform: scale(0.85) translateY(-20px); filter: blur(4px); }
        }
        @keyframes slide-out {
          from { opacity: 1; transform: translateY(0) scale(1) rotateX(0deg); filter: blur(0px); }
          to { opacity: 0; transform: translateY(-60px) scale(0.8) rotateX(15deg); filter: blur(4px); }
        }
        @keyframes bounce-out {
          0% { opacity: 1; transform: scale(1) translateY(0) rotateZ(0deg); filter: blur(0px); }
          25% { transform: scale(1.05) translateY(-5px) rotateZ(1deg); filter: blur(0px); }
          50% { opacity: 1; transform: scale(0.95) translateY(10px) rotateZ(-2deg); filter: blur(1px); }
          100% { opacity: 0; transform: scale(0.2) translateY(100px) rotateZ(5deg); filter: blur(4px); }
        }
        .animate-fade-in { animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-in { animation: slide-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-bounce-in { animation: bounce-in 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-out { animation: fade-out 0.6s cubic-bezier(0.3, 0, 0.8, 0.15) forwards; }
        .animate-slide-out { animation: slide-out 0.5s cubic-bezier(0.3, 0, 0.8, 0.15) forwards; }
        .animate-bounce-out { animation: bounce-out 0.8s cubic-bezier(0.3, 0, 0.8, 0.15) forwards; }
      </style><div></div><style>
        @keyframes progress-width-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `);
function _(e) {
	const t = E(() => Q(e.config.fontSize, "alertbox")),
		x = E(() => U(e.config.alertPosition)),
		W = (l) =>
			({
				donation: "Donation",
				follow: "New Follower",
				subscription: "New Subscriber",
				raid: "Raid",
			})[l] || I(l);
	return (() => {
		var l = ne(),
			S = l.firstChild,
			C = S.nextSibling;
		return (
			n(
				C,
				y($, {
					get when() {
						return e.event;
					},
					get children() {
						var h = ae(),
							Z = h.firstChild,
							V = Z.nextSibling,
							d = V.nextSibling,
							k = d.firstChild,
							B = k.firstChild,
							D = B.nextSibling,
							q = D.nextSibling,
							L = q.firstChild,
							R = L.firstChild,
							P = R.nextSibling,
							j = P.nextSibling,
							N = k.nextSibling,
							K = d.nextSibling,
							X = K.firstChild;
						return (
							n(B, () => W(e.event?.type || "donation")),
							n(D, () => e.event?.username),
							n(j, () => H(e.event?.platform.icon || "")),
							n(
								d,
								y($, {
									get when() {
										return F(() => !!e.config.showAmount)() && e.event?.amount;
									},
									get children() {
										var a = ee(),
											i = a.firstChild,
											o = i.firstChild,
											m = o.nextSibling;
										return (
											n(o, () => z(e.event?.amount, e.event?.currency)),
											n(m, () => z(e.event?.amount, e.event?.currency)),
											a
										);
									},
								}),
								N,
							),
							n(
								d,
								y($, {
									get when() {
										return (
											F(() => !!e.config.showMessage)() && e.event?.message
										);
									},
									get children() {
										var a = te(),
											i = a.firstChild,
											o = i.firstChild;
										return n(o, () => e.event?.message), a;
									},
								}),
								N,
							),
							A(
								(a) => {
									var i = `alert-card relative mx-4 w-96 rounded-lg border border-white/20 bg-linear-to-br from-gray-900/95 to-gray-800/95 p-8 shadow-2xl backdrop-blur-lg ${t()} animate-${e.config.animationType}-in`,
										o = `absolute inset-0 rounded-lg bg-linear-to-r ${O(e.event?.type || "donation")} animate-pulse opacity-10`,
										m = `font-extrabold text-sm uppercase tracking-wider ${J(e.event?.type || "donation")} mb-2 drop-shadow-sm`,
										Y = `progress-width-shrink ${e.config.displayDuration}s linear forwards`;
									return (
										i !== a.e && u(h, (a.e = i)),
										o !== a.t && u(V, (a.t = o)),
										m !== a.a && u(B, (a.a = m)),
										Y !== a.o && M(X, "animation", (a.o = Y)),
										a
									);
								},
								{ e: void 0, t: void 0, a: void 0, o: void 0 },
							),
							h
						);
					},
				}),
			),
			A(() => u(C, `absolute inset-0 flex justify-center ${x()}`)),
			l
		);
	})();
}
try {
	(_.displayName = "AlertboxWidget"),
		(_.__docgenInfo = {
			description: "",
			displayName: "AlertboxWidget",
			props: {
				config: {
					defaultValue: null,
					description: "",
					name: "config",
					required: !0,
					type: { name: "AlertConfig" },
				},
				event: {
					defaultValue: null,
					description: "",
					name: "event",
					required: !0,
					type: { name: "AlertEvent | null" },
				},
			},
		});
} catch {}
var re = c("<div style=width:500px;height:400px>");
const de = {
		title: "Widgets/Alertbox",
		component: _,
		parameters: { layout: "centered", backgrounds: { default: "dark" } },
		tags: ["autodocs"],
		argTypes: { config: { control: "object" }, event: { control: "object" } },
		decorators: [
			(e) =>
				(() => {
					var t = re();
					return n(t, y(e, {})), t;
				})(),
		],
	},
	s = {
		animationType: "fade",
		displayDuration: 5,
		soundEnabled: !1,
		soundVolume: 75,
		showMessage: !0,
		showAmount: !0,
		fontSize: "medium",
		alertPosition: "center",
	},
	p = {
		args: {
			config: s,
			event: {
				id: "1",
				type: "donation",
				username: "GenerousViewer",
				message: "Great stream! Keep it up!",
				amount: 25,
				currency: "$",
				timestamp: new Date(),
				platform: { icon: "twitch", color: "bg-purple-600" },
			},
		},
		play: async ({ canvasElement: e }) => {
			const t = T(e);
			await G(
				() => {
					r(t.getByText("GenerousViewer")).toBeVisible();
				},
				{ timeout: 2e3 },
			),
				await r(t.getByText("Donation")).toBeVisible();
			const x = t.getAllByText("$25.00");
			await r(x.length).toBeGreaterThan(0),
				await r(t.getByText("Great stream! Keep it up!")).toBeVisible(),
				await r(t.getByText("Twitch")).toBeVisible();
		},
	},
	g = {
		args: {
			config: s,
			event: {
				id: "2",
				type: "follow",
				username: "NewFollower",
				timestamp: new Date(),
				platform: { icon: "youtube", color: "bg-red-600" },
			},
		},
		play: async ({ canvasElement: e }) => {
			const t = T(e);
			await G(
				() => {
					r(t.getByText("NewFollower")).toBeVisible();
				},
				{ timeout: 2e3 },
			),
				await r(t.getByText("New Follower")).toBeVisible(),
				await r(t.getByText("YouTube")).toBeVisible();
		},
	},
	f = {
		args: {
			config: s,
			event: {
				id: "3",
				type: "subscription",
				username: "LoyalSubscriber",
				message: "Happy to support!",
				timestamp: new Date(),
				platform: { icon: "twitch", color: "bg-purple-600" },
			},
		},
	},
	b = {
		args: {
			config: s,
			event: {
				id: "4",
				type: "raid",
				username: "BigStreamer",
				message: "Raiding with 150 viewers!",
				timestamp: new Date(),
				platform: { icon: "twitch", color: "bg-purple-600" },
			},
		},
	},
	w = {
		args: {
			config: { ...s, fontSize: "large" },
			event: {
				id: "5",
				type: "donation",
				username: "WhaleViewer",
				message: "This is for you!",
				amount: 500,
				currency: "$",
				timestamp: new Date(),
				platform: { icon: "twitch", color: "bg-purple-600" },
			},
		},
	},
	v = {
		args: { config: s, event: null },
		play: async ({ canvasElement: e }) => {
			const t = T(e);
			await r(t.queryByText("Donation")).toBeNull(),
				await r(t.queryByText("New Follower")).toBeNull();
		},
	};
p.parameters = {
	...p.parameters,
	docs: {
		...p.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: defaultConfig,
    event: {
      id: "1",
      type: "donation",
      username: "GenerousViewer",
      message: "Great stream! Keep it up!",
      amount: 25,
      currency: "$",
      timestamp: new Date(),
      platform: {
        icon: "twitch",
        color: "bg-purple-600"
      }
    }
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    // Wait for animation to complete before checking visibility
    await waitFor(() => {
      expect(canvas.getByText("GenerousViewer")).toBeVisible();
    }, {
      timeout: 2000
    });
    await expect(canvas.getByText("Donation")).toBeVisible();
    // Amount appears twice (once as shadow, once as main text), so use getAllByText
    const amounts = canvas.getAllByText("$25.00");
    await expect(amounts.length).toBeGreaterThan(0);
    await expect(canvas.getByText("Great stream! Keep it up!")).toBeVisible();
    await expect(canvas.getByText("Twitch")).toBeVisible();
  }
}`,
			...p.parameters?.docs?.source,
		},
	},
};
g.parameters = {
	...g.parameters,
	docs: {
		...g.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: defaultConfig,
    event: {
      id: "2",
      type: "follow",
      username: "NewFollower",
      timestamp: new Date(),
      platform: {
        icon: "youtube",
        color: "bg-red-600"
      }
    }
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    // Wait for animation to complete before checking visibility
    await waitFor(() => {
      expect(canvas.getByText("NewFollower")).toBeVisible();
    }, {
      timeout: 2000
    });
    await expect(canvas.getByText("New Follower")).toBeVisible();
    await expect(canvas.getByText("YouTube")).toBeVisible();
  }
}`,
			...g.parameters?.docs?.source,
		},
	},
};
f.parameters = {
	...f.parameters,
	docs: {
		...f.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: defaultConfig,
    event: {
      id: "3",
      type: "subscription",
      username: "LoyalSubscriber",
      message: "Happy to support!",
      timestamp: new Date(),
      platform: {
        icon: "twitch",
        color: "bg-purple-600"
      }
    }
  }
}`,
			...f.parameters?.docs?.source,
		},
	},
};
b.parameters = {
	...b.parameters,
	docs: {
		...b.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: defaultConfig,
    event: {
      id: "4",
      type: "raid",
      username: "BigStreamer",
      message: "Raiding with 150 viewers!",
      timestamp: new Date(),
      platform: {
        icon: "twitch",
        color: "bg-purple-600"
      }
    }
  }
}`,
			...b.parameters?.docs?.source,
		},
	},
};
w.parameters = {
	...w.parameters,
	docs: {
		...w.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: {
      ...defaultConfig,
      fontSize: "large" as const
    },
    event: {
      id: "5",
      type: "donation",
      username: "WhaleViewer",
      message: "This is for you!",
      amount: 500,
      currency: "$",
      timestamp: new Date(),
      platform: {
        icon: "twitch",
        color: "bg-purple-600"
      }
    }
  }
}`,
			...w.parameters?.docs?.source,
		},
	},
};
v.parameters = {
	...v.parameters,
	docs: {
		...v.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: defaultConfig,
    event: null
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    // When no event, the alert card should not be visible
    await expect(canvas.queryByText("Donation")).toBeNull();
    await expect(canvas.queryByText("New Follower")).toBeNull();
  }
}`,
			...v.parameters?.docs?.source,
		},
	},
};
const me = [
	"Donation",
	"Follow",
	"Subscription",
	"Raid",
	"LargeDonation",
	"NoEvent",
];
export {
	p as Donation,
	g as Follow,
	w as LargeDonation,
	v as NoEvent,
	b as Raid,
	f as Subscription,
	me as __namedExportsOrder,
	de as default,
};
