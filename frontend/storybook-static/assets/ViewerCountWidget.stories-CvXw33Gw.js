import {
	b as K,
	f as Q,
	o as Y,
	t as d,
	i as r,
	c as g,
	S as m,
	m as p,
	a as S,
	F as U,
	v as G,
	s as b,
	g as N,
} from "./iframe-BQDcX1su.js";
import { g as Z } from "./widgetHelpers-yXM85bUd.js";
import "./preload-helper-PPVm8Dsz.js";
var ee = d('<span class="font-medium text-gray-300 text-sm">'),
	te = d(
		'<div class="flex items-center space-x-3 rounded-xl border border-gray-700 bg-linear-to-r from-gray-800 to-gray-900 px-6 py-4 text-white shadow-lg"><svg aria-hidden=true class="h-8 w-8"fill=currentColor><path></path></svg><span>',
	),
	ae = d('<div class="text-blue-100 text-sm">'),
	re = d(
		'<div class="flex items-center justify-center space-x-3 rounded-xl bg-linear-to-r from-blue-600 to-purple-600 p-4 text-white shadow-lg"><svg aria-hidden=true class="h-10 w-10"fill=currentColor><path></path></svg><div class=text-center><div>',
	),
	ne = d('<div class="flex items-center justify-center space-x-4">'),
	X = d("<div class=space-y-3>"),
	oe = d('<span class="font-medium text-sm">'),
	ie = d(
		'<div class="rounded-xl bg-linear-to-r from-blue-600 to-purple-600 p-5 text-center text-white shadow-lg"><div class="mb-2 flex items-center justify-center space-x-2"><svg aria-hidden=true class="h-7 w-7"fill=currentColor><path></path></svg></div><div>',
	),
	se = d('<div class="flex items-center justify-center space-x-3">'),
	le = d("<div class=viewer-display>"),
	ce = d(
		'<div class="viewer-count-widget flex h-full items-center justify-center p-4 font-sans">',
	),
	de = d(
		'<div class="flex items-center space-x-2 text-gray-400"><svg aria-hidden=true class="h-6 w-6 animate-pulse"fill=currentColor viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path></svg><span>Loading viewers...',
	),
	ge = d(
		'<div class="flex items-center space-x-2 rounded-lg border border-gray-700 bg-gray-900 bg-opacity-80 px-3 py-2 text-white"><div></div><span class=font-bold>',
	),
	ue = d('<div><div class="font-bold text-lg">');
function fe() {
	return {
		animateNumber: (e, y, j) => {
			const x = Date.now(),
				k = y - e;
			function C() {
				const $ = Date.now() - x,
					v = Math.min($ / 800, 1),
					o = 1 - (1 - v) ** 3,
					i = Math.round(e + k * o);
				j(i), v < 1 && requestAnimationFrame(C);
			}
			requestAnimationFrame(C);
		},
	};
}
function J(e) {
	const y = () => e.id || "viewer-count-widget",
		{ animateNumber: j } = fe(),
		[V, x] = K(0),
		[k, C] = K({});
	Q(() => {
		const o = e.data?.total_viewers;
		if (o !== void 0)
			if (e.config.animation_enabled) {
				const i = V();
				i !== o ? j(i, o, x) : x(o);
			} else x(o);
	}),
		Q(() => {
			const o = e.data?.platform_breakdown;
			if (o)
				if (e.config.animation_enabled)
					Object.entries(o).forEach(([i, s]) => {
						const n = k()[i] || 0,
							l = s.viewers;
						n !== l &&
							j(n, l, (c) => {
								C((a) => ({ ...a, [i]: c }));
							});
					});
				else {
					const i = {};
					Object.entries(o).forEach(([s, n]) => {
						i[s] = n.viewers;
					}),
						C(i);
				}
		}),
		Y(() => {
			if (e.data && (x(e.data.total_viewers), e.data.platform_breakdown)) {
				const o = {};
				Object.entries(e.data.platform_breakdown).forEach(([i, s]) => {
					o[i] = s.viewers;
				}),
					C(o);
			}
		});
	const z = () => Z(e.config.font_size, "counter"),
		$ = () =>
			e.data?.platform_breakdown
				? Object.entries(e.data.platform_breakdown).filter(
						([o, i]) => i.viewers > 0,
					)
				: [],
		v = {
			viewBox: "0 0 24 24",
			path: "M15 12c0 1.654-1.346 3-3 3s-3-1.346-3-3 1.346-3 3-3 3 1.346 3 3zm9-.449s-4.252 8.449-11.985 8.449c-7.18 0-12.015-8.449-12.015-8.449s4.446-7.551 12.015-7.551c7.694 0 11.985 7.551 11.985 7.551z",
		};
	return (() => {
		var o = ce();
		return (
			r(
				o,
				g(m, {
					get when() {
						return e.data;
					},
					get fallback() {
						return de();
					},
					get children() {
						var i = le();
						return (
							r(
								i,
								g(m, {
									get when() {
										return e.config.display_style === "minimal";
									},
									get children() {
										var s = te(),
											n = s.firstChild,
											l = n.firstChild,
											c = n.nextSibling;
										return (
											r(
												c,
												(() => {
													var a = p(() => !!e.config.animation_enabled);
													return () =>
														a()
															? V().toLocaleString()
															: e.data?.total_viewers.toLocaleString();
												})(),
											),
											r(
												s,
												g(m, {
													get when() {
														return e.config.viewer_label;
													},
													get children() {
														var a = ee();
														return r(a, () => e.config.viewer_label), a;
													},
												}),
												null,
											),
											S(
												(a) => {
													var u = e.config.icon_color || "#ef4444",
														t = v.viewBox,
														w = v.path,
														h = `${z()} font-bold`;
													return (
														u !== a.e && G(n, "color", (a.e = u)),
														t !== a.t && b(n, "viewBox", (a.t = t)),
														w !== a.a && b(l, "d", (a.a = w)),
														h !== a.o && N(c, (a.o = h)),
														a
													);
												},
												{ e: void 0, t: void 0, a: void 0, o: void 0 },
											),
											s
										);
									},
								}),
								null,
							),
							r(
								i,
								g(m, {
									get when() {
										return e.config.display_style === "detailed";
									},
									get children() {
										var s = X();
										return (
											r(
												s,
												g(m, {
													get when() {
														return e.config.show_total;
													},
													get children() {
														var n = re(),
															l = n.firstChild,
															c = l.firstChild,
															a = l.nextSibling,
															u = a.firstChild;
														return (
															r(
																u,
																(() => {
																	var t = p(() => !!e.config.animation_enabled);
																	return () =>
																		t()
																			? V().toLocaleString()
																			: e.data?.total_viewers.toLocaleString();
																})(),
															),
															r(
																a,
																g(m, {
																	get when() {
																		return e.config.viewer_label;
																	},
																	get children() {
																		var t = ae();
																		return r(t, () => e.config.viewer_label), t;
																	},
																}),
																null,
															),
															S(
																(t) => {
																	var w = e.config.icon_color || "#ef4444",
																		h = v.viewBox,
																		L = v.path,
																		D = `${z()} font-bold`;
																	return (
																		w !== t.e && G(l, "color", (t.e = w)),
																		h !== t.t && b(l, "viewBox", (t.t = h)),
																		L !== t.a && b(c, "d", (t.a = L)),
																		D !== t.o && N(u, (t.o = D)),
																		t
																	);
																},
																{ e: void 0, t: void 0, a: void 0, o: void 0 },
															),
															n
														);
													},
												}),
												null,
											),
											r(
												s,
												g(m, {
													get when() {
														return (
															p(() => !!e.config.show_platforms)() &&
															$().length > 0
														);
													},
													get children() {
														var n = ne();
														return (
															r(
																n,
																g(U, {
																	get each() {
																		return $();
																	},
																	children: ([l, c]) =>
																		(() => {
																			var a = ge(),
																				u = a.firstChild,
																				t = u.nextSibling;
																			return (
																				r(
																					t,
																					(() => {
																						var w = p(
																							() =>
																								!!e.config.animation_enabled,
																						);
																						return () =>
																							w()
																								? (k()[l] || 0).toLocaleString()
																								: c.viewers.toLocaleString();
																					})(),
																				),
																				S(() =>
																					N(
																						u,
																						`h-4 w-4 rounded-full ${c.color} shadow-lg`,
																					),
																				),
																				a
																			);
																		})(),
																}),
															),
															n
														);
													},
												}),
												null,
											),
											s
										);
									},
								}),
								null,
							),
							r(
								i,
								g(m, {
									get when() {
										return e.config.display_style === "cards";
									},
									get children() {
										var s = X();
										return (
											r(
												s,
												g(m, {
													get when() {
														return e.config.show_total;
													},
													get children() {
														var n = ie(),
															l = n.firstChild,
															c = l.firstChild,
															a = c.firstChild,
															u = l.nextSibling;
														return (
															r(
																l,
																g(m, {
																	get when() {
																		return e.config.viewer_label;
																	},
																	get children() {
																		var t = oe();
																		return r(t, () => e.config.viewer_label), t;
																	},
																}),
																null,
															),
															r(
																u,
																(() => {
																	var t = p(() => !!e.config.animation_enabled);
																	return () =>
																		t()
																			? V().toLocaleString()
																			: e.data?.total_viewers.toLocaleString();
																})(),
															),
															S(
																(t) => {
																	var w = e.config.icon_color || "#ef4444",
																		h = v.viewBox,
																		L = v.path,
																		D = `${z()} font-bold`;
																	return (
																		w !== t.e && G(c, "color", (t.e = w)),
																		h !== t.t && b(c, "viewBox", (t.t = h)),
																		L !== t.a && b(a, "d", (t.a = L)),
																		D !== t.o && N(u, (t.o = D)),
																		t
																	);
																},
																{ e: void 0, t: void 0, a: void 0, o: void 0 },
															),
															n
														);
													},
												}),
												null,
											),
											r(
												s,
												g(m, {
													get when() {
														return (
															p(() => !!e.config.show_platforms)() &&
															$().length > 0
														);
													},
													get children() {
														var n = se();
														return (
															r(
																n,
																g(U, {
																	get each() {
																		return $();
																	},
																	children: ([l, c]) =>
																		(() => {
																			var a = ue(),
																				u = a.firstChild;
																			return (
																				r(
																					u,
																					(() => {
																						var t = p(
																							() =>
																								!!e.config.animation_enabled,
																						);
																						return () =>
																							t()
																								? (k()[l] || 0).toLocaleString()
																								: c.viewers.toLocaleString();
																					})(),
																				),
																				S(() =>
																					N(
																						a,
																						`${c.color} rounded-xl p-3 text-center text-white shadow-lg transition-shadow duration-200 hover:shadow-xl`,
																					),
																				),
																				a
																			);
																		})(),
																}),
															),
															n
														);
													},
												}),
												null,
											),
											s
										);
									},
								}),
								null,
							),
							i
						);
					},
				}),
			),
			S(() => b(o, "id", y())),
			o
		);
	})();
}
try {
	(J.displayName = "ViewerCountWidget"),
		(J.__docgenInfo = {
			description: "",
			displayName: "ViewerCountWidget",
			props: {
				config: {
					defaultValue: null,
					description: "",
					name: "config",
					required: !0,
					type: { name: "ViewerCountConfig" },
				},
				data: {
					defaultValue: null,
					description: "",
					name: "data",
					required: !0,
					type: { name: "ViewerData | null" },
				},
				id: {
					defaultValue: null,
					description: "",
					name: "id",
					required: !1,
					type: { name: "string | undefined" },
				},
			},
		});
} catch {}
var me = d("<div style=width:400px;height:200px>");
const he = {
		title: "Widgets/ViewerCount",
		component: J,
		parameters: { layout: "centered", backgrounds: { default: "dark" } },
		tags: ["autodocs"],
		decorators: [
			(e) =>
				(() => {
					var y = me();
					return r(y, g(e, {})), y;
				})(),
		],
	},
	f = {
		display_style: "minimal",
		font_size: "medium",
		viewer_label: "Viewers",
		show_total: !0,
		show_platforms: !0,
		animation_enabled: !0,
		icon_color: "#ef4444",
	},
	_ = {
		total_viewers: 1234,
		platform_breakdown: {
			twitch: { viewers: 800, color: "bg-purple-600" },
			youtube: { viewers: 350, color: "bg-red-600" },
			kick: { viewers: 84, color: "bg-green-600" },
		},
	},
	F = { args: { config: f, data: _ } },
	A = { args: { config: { ...f, display_style: "detailed" }, data: _ } },
	B = { args: { config: { ...f, display_style: "cards" }, data: _ } },
	P = { args: { config: { ...f, font_size: "small" }, data: _ } },
	E = { args: { config: { ...f, font_size: "large" }, data: _ } },
	M = {
		args: {
			config: { ...f, show_platforms: !1, display_style: "detailed" },
			data: _,
		},
	},
	O = { args: { config: { ...f, viewer_label: "" }, data: _ } },
	T = { args: { config: { ...f, animation_enabled: !1 }, data: _ } },
	q = { args: { config: { ...f, icon_color: "#10b981" }, data: _ } },
	I = {
		args: {
			config: f,
			data: {
				total_viewers: 5e4,
				platform_breakdown: {
					twitch: { viewers: 3e4, color: "bg-purple-600" },
					youtube: { viewers: 15e3, color: "bg-red-600" },
					kick: { viewers: 5e3, color: "bg-green-600" },
				},
			},
		},
	},
	W = {
		args: {
			config: f,
			data: {
				total_viewers: 12,
				platform_breakdown: {
					twitch: { viewers: 8, color: "bg-purple-600" },
					youtube: { viewers: 4, color: "bg-red-600" },
				},
			},
		},
	},
	H = {
		args: {
			config: { ...f, display_style: "detailed" },
			data: {
				total_viewers: 500,
				platform_breakdown: {
					twitch: { viewers: 500, color: "bg-purple-600" },
				},
			},
		},
	},
	R = { args: { config: f, data: null } };
F.parameters = {
	...F.parameters,
	docs: {
		...F.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: defaultConfig,
    data: sampleData
  }
}`,
			...F.parameters?.docs?.source,
		},
	},
};
A.parameters = {
	...A.parameters,
	docs: {
		...A.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: {
      ...defaultConfig,
      display_style: "detailed" as const
    },
    data: sampleData
  }
}`,
			...A.parameters?.docs?.source,
		},
	},
};
B.parameters = {
	...B.parameters,
	docs: {
		...B.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: {
      ...defaultConfig,
      display_style: "cards" as const
    },
    data: sampleData
  }
}`,
			...B.parameters?.docs?.source,
		},
	},
};
P.parameters = {
	...P.parameters,
	docs: {
		...P.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: {
      ...defaultConfig,
      font_size: "small" as const
    },
    data: sampleData
  }
}`,
			...P.parameters?.docs?.source,
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
      font_size: "large" as const
    },
    data: sampleData
  }
}`,
			...E.parameters?.docs?.source,
		},
	},
};
M.parameters = {
	...M.parameters,
	docs: {
		...M.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: {
      ...defaultConfig,
      show_platforms: false,
      display_style: "detailed" as const
    },
    data: sampleData
  }
}`,
			...M.parameters?.docs?.source,
		},
	},
};
O.parameters = {
	...O.parameters,
	docs: {
		...O.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: {
      ...defaultConfig,
      viewer_label: ""
    },
    data: sampleData
  }
}`,
			...O.parameters?.docs?.source,
		},
	},
};
T.parameters = {
	...T.parameters,
	docs: {
		...T.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: {
      ...defaultConfig,
      animation_enabled: false
    },
    data: sampleData
  }
}`,
			...T.parameters?.docs?.source,
		},
	},
};
q.parameters = {
	...q.parameters,
	docs: {
		...q.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: {
      ...defaultConfig,
      icon_color: "#10b981"
    },
    data: sampleData
  }
}`,
			...q.parameters?.docs?.source,
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
    config: defaultConfig,
    data: {
      total_viewers: 50000,
      platform_breakdown: {
        twitch: {
          viewers: 30000,
          color: "bg-purple-600"
        },
        youtube: {
          viewers: 15000,
          color: "bg-red-600"
        },
        kick: {
          viewers: 5000,
          color: "bg-green-600"
        }
      }
    }
  }
}`,
			...I.parameters?.docs?.source,
		},
	},
};
W.parameters = {
	...W.parameters,
	docs: {
		...W.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: defaultConfig,
    data: {
      total_viewers: 12,
      platform_breakdown: {
        twitch: {
          viewers: 8,
          color: "bg-purple-600"
        },
        youtube: {
          viewers: 4,
          color: "bg-red-600"
        }
      }
    }
  }
}`,
			...W.parameters?.docs?.source,
		},
	},
};
H.parameters = {
	...H.parameters,
	docs: {
		...H.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: {
      ...defaultConfig,
      display_style: "detailed" as const
    },
    data: {
      total_viewers: 500,
      platform_breakdown: {
        twitch: {
          viewers: 500,
          color: "bg-purple-600"
        }
      }
    }
  }
}`,
			...H.parameters?.docs?.source,
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
    config: defaultConfig,
    data: null
  }
}`,
			...R.parameters?.docs?.source,
		},
	},
};
const pe = [
	"MinimalStyle",
	"DetailedStyle",
	"CardsStyle",
	"SmallFont",
	"LargeFont",
	"NoPlatforms",
	"NoLabel",
	"NoAnimation",
	"CustomIconColor",
	"HighViewerCount",
	"LowViewerCount",
	"SinglePlatform",
	"Loading",
];
export {
	B as CardsStyle,
	q as CustomIconColor,
	A as DetailedStyle,
	I as HighViewerCount,
	E as LargeFont,
	R as Loading,
	W as LowViewerCount,
	F as MinimalStyle,
	T as NoAnimation,
	O as NoLabel,
	M as NoPlatforms,
	H as SinglePlatform,
	P as SmallFont,
	pe as __namedExportsOrder,
	he as default,
};
