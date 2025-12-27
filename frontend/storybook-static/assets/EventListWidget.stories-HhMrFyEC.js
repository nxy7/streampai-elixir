import {
	t as s,
	i as a,
	c as o,
	F as W,
	S as c,
	m as M,
	a as g,
	g as f,
	v as R,
} from "./iframe-BQDcX1su.js";
import { d as Y, a as q, g as G, c as U } from "./eventMetadata-BsurlWsB.js";
import { f as j, a as B } from "./formatters-C5hHeGWB.js";
import { g as V, b as X } from "./widgetHelpers-yXM85bUd.js";
import "./preload-helper-PPVm8Dsz.js";
var A = s("<div>"),
	K =
		s(`<div class="relative h-full w-full overflow-hidden"style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif"><div></div><style>
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          50% {
            opacity: 1;
            transform: scale(1.05) translateY(-5px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-slide-in {
          animation: slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `),
	H = s(
		'<div class="flex h-full items-center justify-center"><div class="text-center text-gray-400"><div class="mb-4 text-4xl">📋</div><div>No events yet</div><div class="mt-2 text-sm">Events will appear here as they happen',
	),
	J = s(
		'<div class="absolute inset-0 rounded-lg bg-linear-to-r from-purple-500/20 to-pink-500/20 opacity-30 blur-sm">',
	),
	Q = s('<div class="font-bold text-green-400 text-sm">'),
	Z = s('<div class="ml-2 text-gray-400 text-xs">'),
	ee = s(
		'<div class="flex items-center justify-between"><div class="flex min-w-0 flex-1 items-center space-x-2"><span class=text-sm></span><div class="truncate font-medium text-sm text-white">',
	),
	te = s('<div><div class="relative z-10">'),
	ae = s(
		'<div class="mb-2 flex items-center justify-between"><div class="flex items-center space-x-2"><span class=text-lg></span><div><div></div><div class="text-gray-400 text-xs uppercase tracking-wide">',
	),
	ne = s("<div class=mb-2><div>"),
	re = s(
		'<div class="mt-2 flex justify-end"><div class="rounded-full border border-white/20 bg-white/10 px-2 py-1 font-semibold text-white text-xs backdrop-blur-sm">',
	);
function D(n) {
	const d = () => V(n.config.fontSize, "content"),
		L = () =>
			(n.events || [])
				.filter((y) => n.config.eventTypes.includes(y.type))
				.slice(0, n.config.maxEvents),
		I = () => X(n.config.animationType, "in");
	return (() => {
		var y = K(),
			N = y.firstChild;
		return (
			a(
				N,
				o(c, {
					get when() {
						return L().length > 0;
					},
					get fallback() {
						return (() => {
							var v = H(),
								t = v.firstChild,
								T = t.firstChild,
								p = T.nextSibling;
							return g(() => f(p, `font-medium ${d()}`)), v;
						})();
					},
					get children() {
						var v = A();
						return (
							a(
								v,
								o(W, {
									get each() {
										return L();
									},
									children: (t, T) =>
										(() => {
											var p = te(),
												P = p.firstChild;
											return (
												a(
													p,
													o(c, {
														get when() {
															return !n.config.compactMode;
														},
														get children() {
															return J();
														},
													}),
													P,
												),
												a(
													P,
													o(c, {
														get when() {
															return n.config.compactMode;
														},
														get fallback() {
															return [
																(() => {
																	var e = ae(),
																		r = e.firstChild,
																		u = r.firstChild,
																		z = u.nextSibling,
																		l = z.firstChild,
																		O = l.nextSibling;
																	return (
																		a(u, () => Y(t.type)),
																		a(l, () => t.username),
																		a(O, () => q(t.type)),
																		a(
																			e,
																			o(c, {
																				get when() {
																					return n.config.showTimestamps;
																				},
																				get children() {
																					var F = A();
																					return (
																						a(F, () => B(t.timestamp)),
																						g(() =>
																							f(
																								F,
																								`text-gray-400 text-xs ${d()}`,
																							),
																						),
																						F
																					);
																				},
																			}),
																			null,
																		),
																		g(() =>
																			f(l, `font-semibold ${U(t.type)} ${d()}`),
																		),
																		e
																	);
																})(),
																o(c, {
																	get when() {
																		return (
																			M(
																				() =>
																					!!(n.config.showAmounts && t.amount),
																			)() && t.type === "donation"
																		);
																	},
																	get children() {
																		var e = ne(),
																			r = e.firstChild;
																		return (
																			a(r, () => j(t.amount, t.currency)),
																			g(() =>
																				f(r, `font-bold text-green-400 ${d()}`),
																			),
																			e
																		);
																	},
																}),
																o(c, {
																	get when() {
																		return (
																			M(() => !!t.message)() &&
																			t.message.trim() !== ""
																		);
																	},
																	get children() {
																		var e = A();
																		return (
																			a(e, () => t.message),
																			g(() =>
																				f(
																					e,
																					`text-gray-200 leading-relaxed ${d()}`,
																				),
																			),
																			e
																		);
																	},
																}),
																o(c, {
																	get when() {
																		return n.config.showPlatform;
																	},
																	get children() {
																		var e = re(),
																			r = e.firstChild;
																		return a(r, () => G(t.platform.icon)), e;
																	},
																}),
															];
														},
														get children() {
															var e = ee(),
																r = e.firstChild,
																u = r.firstChild,
																z = u.nextSibling;
															return (
																a(u, () => Y(t.type)),
																a(z, () => t.username),
																a(
																	r,
																	o(c, {
																		get when() {
																			return (
																				M(
																					() =>
																						!!(
																							n.config.showAmounts && t.amount
																						),
																				)() && t.type === "donation"
																			);
																		},
																		get children() {
																			var l = Q();
																			return (
																				a(l, () => j(t.amount, t.currency)), l
																			);
																		},
																	}),
																	null,
																),
																a(
																	e,
																	o(c, {
																		get when() {
																			return n.config.showTimestamps;
																		},
																		get children() {
																			var l = Z();
																			return a(l, () => B(t.timestamp)), l;
																		},
																	}),
																	null,
																),
																e
															);
														},
													}),
												),
												g(
													(e) => {
														var r = `relative transition-all duration-300 ${I()} ${n.config.compactMode ? "rounded border border-white/10 bg-gray-900/80 p-2" : "rounded-lg border border-white/20 bg-linear-to-br from-gray-900/95 to-gray-800/95 p-4 shadow-lg backdrop-blur-lg"}`,
															u = `${T() * 100}ms`;
														return (
															r !== e.e && f(p, (e.e = r)),
															u !== e.t && R(p, "animation-delay", (e.t = u)),
															e
														);
													},
													{ e: void 0, t: void 0 },
												),
												p
											);
										})(),
								}),
							),
							g(() => f(v, n.config.compactMode ? "space-y-1" : "space-y-2")),
							v
						);
					},
				}),
			),
			g(() =>
				f(
					N,
					`h-full w-full overflow-y-auto ${n.config.compactMode ? "space-y-2 p-2" : "space-y-3 p-4"}`,
				),
			),
			y
		);
	})();
}
try {
	(D.displayName = "EventListWidget"),
		(D.__docgenInfo = {
			description: "",
			displayName: "EventListWidget",
			props: {
				config: {
					defaultValue: null,
					description: "",
					name: "config",
					required: !0,
					type: { name: "EventListConfig" },
				},
				events: {
					defaultValue: null,
					description: "",
					name: "events",
					required: !0,
					type: { name: "StreamEvent[]" },
				},
			},
		});
} catch {}
var se = s("<div style=width:400px;height:500px;background:rgba(0,0,0,0.5)>");
const de = {
		title: "Widgets/EventList",
		component: D,
		parameters: { layout: "fullscreen", backgrounds: { default: "dark" } },
		tags: ["autodocs"],
		decorators: [
			(n) =>
				(() => {
					var d = se();
					return a(d, o(n, {})), d;
				})(),
		],
	},
	i = {
		animationType: "slide",
		maxEvents: 10,
		eventTypes: ["donation", "follow", "subscription", "raid", "chat_message"],
		showTimestamps: !0,
		showPlatform: !0,
		showAmounts: !0,
		fontSize: "medium",
		compactMode: !1,
	},
	m = [
		{
			id: "1",
			type: "donation",
			username: "GenerousDonor",
			message: "Great stream! Keep it up!",
			amount: 25,
			currency: "$",
			timestamp: new Date(),
			platform: { icon: "twitch", color: "bg-purple-600" },
		},
		{
			id: "2",
			type: "follow",
			username: "NewFollower",
			timestamp: new Date(),
			platform: { icon: "youtube", color: "bg-red-600" },
		},
		{
			id: "3",
			type: "subscription",
			username: "LoyalSub",
			message: "6 month resub!",
			timestamp: new Date(),
			platform: { icon: "twitch", color: "bg-purple-600" },
		},
		{
			id: "4",
			type: "raid",
			username: "RaidLeader",
			message: "Incoming with 150 viewers!",
			timestamp: new Date(),
			platform: { icon: "twitch", color: "bg-purple-600" },
		},
		{
			id: "5",
			type: "donation",
			username: "BigTipper",
			message: "Amazing content!",
			amount: 100,
			currency: "$",
			timestamp: new Date(),
			platform: { icon: "kick", color: "bg-green-600" },
		},
	],
	b = { args: { config: i, events: m } },
	h = { args: { config: { ...i, animationType: "fade" }, events: m } },
	w = { args: { config: { ...i, animationType: "bounce" }, events: m } },
	x = { args: { config: { ...i, compactMode: !0 }, events: m } },
	$ = { args: { config: { ...i, fontSize: "small" }, events: m } },
	_ = { args: { config: { ...i, fontSize: "large" }, events: m } },
	C = { args: { config: { ...i, eventTypes: ["donation"] }, events: m } },
	S = { args: { config: { ...i, showTimestamps: !1 }, events: m } },
	E = { args: { config: { ...i, showPlatform: !1 }, events: m } },
	k = { args: { config: i, events: [] } };
b.parameters = {
	...b.parameters,
	docs: {
		...b.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: defaultConfig,
    events: sampleEvents
  }
}`,
			...b.parameters?.docs?.source,
		},
	},
};
h.parameters = {
	...h.parameters,
	docs: {
		...h.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: {
      ...defaultConfig,
      animationType: "fade" as const
    },
    events: sampleEvents
  }
}`,
			...h.parameters?.docs?.source,
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
      animationType: "bounce" as const
    },
    events: sampleEvents
  }
}`,
			...w.parameters?.docs?.source,
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
    config: {
      ...defaultConfig,
      compactMode: true
    },
    events: sampleEvents
  }
}`,
			...x.parameters?.docs?.source,
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
    config: {
      ...defaultConfig,
      fontSize: "small" as const
    },
    events: sampleEvents
  }
}`,
			...$.parameters?.docs?.source,
		},
	},
};
_.parameters = {
	..._.parameters,
	docs: {
		..._.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: {
      ...defaultConfig,
      fontSize: "large" as const
    },
    events: sampleEvents
  }
}`,
			..._.parameters?.docs?.source,
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
    config: {
      ...defaultConfig,
      eventTypes: ["donation"]
    },
    events: sampleEvents
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
    config: {
      ...defaultConfig,
      showTimestamps: false
    },
    events: sampleEvents
  }
}`,
			...S.parameters?.docs?.source,
		},
	},
};
E.parameters = {
	...E.parameters,
	docs: {
		...E.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: {
      ...defaultConfig,
      showPlatform: false
    },
    events: sampleEvents
  }
}`,
			...E.parameters?.docs?.source,
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
    config: defaultConfig,
    events: []
  }
}`,
			...k.parameters?.docs?.source,
		},
	},
};
const ue = [
	"Default",
	"FadeAnimation",
	"BounceAnimation",
	"CompactMode",
	"SmallFont",
	"LargeFont",
	"DonationsOnly",
	"NoTimestamps",
	"NoPlatform",
	"Empty",
];
export {
	w as BounceAnimation,
	x as CompactMode,
	b as Default,
	C as DonationsOnly,
	k as Empty,
	h as FadeAnimation,
	_ as LargeFont,
	E as NoPlatform,
	S as NoTimestamps,
	$ as SmallFont,
	ue as __namedExportsOrder,
	de as default,
};
