import {
	t as n,
	i as r,
	c as m,
	S as M,
	a as _,
	m as T,
	F as A,
	g as S,
	s as N,
	v as U,
} from "./iframe-BQDcX1su.js";
import { g as I } from "./widgetHelpers-yXM85bUd.js";
import "./preload-helper-PPVm8Dsz.js";
var W =
		n(`<div class="flex h-full w-full flex-col text-white"style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif"><div class="flex flex-1 flex-col justify-end overflow-y-hidden p-3"><div class="flex flex-col gap-2"></div></div><style>
        .overflow-y-hidden::-webkit-scrollbar {
          width: 6px;
        }

        .overflow-y-hidden::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
        }

        .overflow-y-hidden::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }

        .overflow-y-hidden::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `),
	G = n(
		'<div style=width:20px;height:20px><svg aria-hidden=true fill=currentColor viewBox="0 0 24 24"style=width:12px;height:12px;color:white><path>',
	),
	O = n("<div>"),
	j = n('<span class="mr-2 text-gray-500 text-xs">'),
	q = n(
		'<div><div class="min-w-0 flex-1"><span class=font-semibold>:</span><span class="ml-1 text-gray-100">',
	);
function k(a) {
	const u = () => I(a.config.fontSize, "standard"),
		V = () => (a.messages || []).slice(-a.config.maxMessages),
		z = (s) =>
			(s instanceof Date ? s : new Date(s)).toLocaleTimeString("en-US", {
				hour12: !1,
				hour: "2-digit",
				minute: "2-digit",
			}),
		H = (s) =>
			({
				twitch:
					"M11.64 5.93H13.07V10.21H11.64M15.57 5.93H17V10.21H15.57M7 2L3.43 5.57V18.43H7.71V22L11.29 18.43H14.14L20.57 12V2M18.86 11.29L16.71 13.43H14.14L12.29 15.29V13.43H8.57V3.71H18.86Z",
				youtube:
					"M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
				facebook:
					"M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
				kick: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
			})[s.icon] ||
			"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
		B = (s) =>
			a.config.showEmotes
				? s.content
				: s.content
						.replace(/:[a-zA-Z0-9_+-]+:/g, "")
						.replace(/[\u{1F600}-\u{1F64F}]/gu, "")
						.replace(/[\u{1F300}-\u{1F5FF}]/gu, "")
						.replace(/[\u{1F680}-\u{1F6FF}]/gu, "")
						.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "")
						.replace(/[\u{2600}-\u{26FF}]/gu, "")
						.replace(/[\u{2700}-\u{27BF}]/gu, "")
						.replace(/[\u{1F900}-\u{1F9FF}]/gu, "")
						.replace(/[\u{1FA00}-\u{1FA6F}]/gu, "")
						.replace(/[\u{1FA70}-\u{1FAFF}]/gu, "")
						.replace(/[\u{FE00}-\u{FE0F}]/gu, "")
						.replace(/[\u{200D}]/gu, "")
						.trim();
	return (() => {
		var s = W(),
			d = s.firstChild,
			D = d.firstChild;
		return (
			r(
				D,
				m(A, {
					get each() {
						return V();
					},
					children: (t) =>
						(() => {
							var i = q(),
								f = i.firstChild,
								c = f.firstChild,
								P = c.firstChild,
								E = c.nextSibling;
							return (
								r(
									i,
									m(M, {
										get when() {
											return a.config.showPlatform;
										},
										get children() {
											var e = G(),
												p = e.firstChild,
												h = p.firstChild;
											return (
												_(
													(g) => {
														var $ = `flex shrink-0 items-center justify-center rounded ${t.platform.color}`,
															L = H(t.platform);
														return (
															$ !== g.e && S(e, (g.e = $)),
															L !== g.t && N(h, "d", (g.t = L)),
															g
														);
													},
													{ e: void 0, t: void 0 },
												),
												e
											);
										},
									}),
									f,
								),
								r(
									i,
									m(M, {
										get when() {
											return T(() => !!a.config.showBadges)() && t.badge;
										},
										get children() {
											var e = O();
											return (
												r(e, () => t.badge),
												_(() =>
													S(
														e,
														`shrink-0 rounded px-2 py-1 font-semibold text-xs ${t.badgeColor}`,
													),
												),
												e
											);
										},
									}),
									f,
								),
								r(
									f,
									m(M, {
										get when() {
											return a.config.showTimestamps;
										},
										get children() {
											var e = j();
											return r(e, () => z(t.timestamp)), e;
										},
									}),
									c,
								),
								r(c, () => t.username, P),
								r(E, () => B(t)),
								_(
									(e) => {
										var p = `flex items-start space-x-2 ${u()}`,
											h = t.usernameColor;
										return (
											p !== e.e && S(i, (e.e = p)),
											h !== e.t && U(c, "color", (e.t = h)),
											e
										);
									},
									{ e: void 0, t: void 0 },
								),
								i
							);
						})(),
				}),
			),
			s
		);
	})();
}
try {
	(k.displayName = "ChatWidget"),
		(k.__docgenInfo = {
			description: "",
			displayName: "ChatWidget",
			props: {
				config: {
					defaultValue: null,
					description: "",
					name: "config",
					required: !0,
					type: { name: "ChatConfig" },
				},
				messages: {
					defaultValue: null,
					description: "",
					name: "messages",
					required: !0,
					type: { name: "ChatMessage[]" },
				},
			},
		});
} catch {}
var R = n("<div style=width:400px;height:500px;background:rgba(0,0,0,0.5)>");
const Q = {
		title: "Widgets/Chat",
		component: k,
		parameters: { layout: "fullscreen", backgrounds: { default: "dark" } },
		tags: ["autodocs"],
		decorators: [
			(a) =>
				(() => {
					var u = R();
					return r(u, m(a, {})), u;
				})(),
		],
	},
	o = {
		fontSize: "medium",
		showTimestamps: !0,
		showBadges: !0,
		showPlatform: !0,
		showEmotes: !0,
		maxMessages: 15,
	},
	l = [
		{
			id: "1",
			username: "GamerPro",
			content: "Hello everyone! PogChamp",
			timestamp: new Date(),
			platform: { icon: "twitch", color: "bg-purple-600" },
			badge: "MOD",
			badgeColor: "bg-green-600 text-white",
			usernameColor: "#ff6b6b",
		},
		{
			id: "2",
			username: "StreamFan",
			content: "Great stream today!",
			timestamp: new Date(),
			platform: { icon: "youtube", color: "bg-red-600" },
			usernameColor: "#4ecdc4",
		},
		{
			id: "3",
			username: "CoolViewer",
			content: "LUL that was hilarious",
			timestamp: new Date(),
			platform: { icon: "twitch", color: "bg-purple-600" },
			badge: "VIP",
			badgeColor: "bg-pink-600 text-white",
			usernameColor: "#45b7d1",
		},
		{
			id: "4",
			username: "HappyDonator",
			content: "First time here, loving it!",
			timestamp: new Date(),
			platform: { icon: "kick", color: "bg-green-600" },
			usernameColor: "#96ceb4",
		},
		{
			id: "5",
			username: "EpicGamer",
			content: "Let's gooo!",
			timestamp: new Date(),
			platform: { icon: "twitch", color: "bg-purple-600" },
			badge: "SUB",
			badgeColor: "bg-purple-600 text-white",
			usernameColor: "#feca57",
		},
	],
	w = { args: { config: o, messages: l } },
	b = { args: { config: { ...o, fontSize: "small" }, messages: l } },
	C = { args: { config: { ...o, fontSize: "large" }, messages: l } },
	v = { args: { config: { ...o, showBadges: !1 }, messages: l } },
	F = { args: { config: { ...o, showTimestamps: !1 }, messages: l } },
	x = {
		args: {
			config: { ...o, showTimestamps: !1, showBadges: !1, showPlatform: !1 },
			messages: l,
		},
	},
	y = { args: { config: o, messages: [] } };
w.parameters = {
	...w.parameters,
	docs: {
		...w.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: defaultConfig,
    messages: sampleMessages
  }
}`,
			...w.parameters?.docs?.source,
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
    config: {
      ...defaultConfig,
      fontSize: "small" as const
    },
    messages: sampleMessages
  }
}`,
			...b.parameters?.docs?.source,
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
      fontSize: "large" as const
    },
    messages: sampleMessages
  }
}`,
			...C.parameters?.docs?.source,
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
    config: {
      ...defaultConfig,
      showBadges: false
    },
    messages: sampleMessages
  }
}`,
			...v.parameters?.docs?.source,
		},
	},
};
F.parameters = {
	...F.parameters,
	docs: {
		...F.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: {
      ...defaultConfig,
      showTimestamps: false
    },
    messages: sampleMessages
  }
}`,
			...F.parameters?.docs?.source,
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
      showTimestamps: false,
      showBadges: false,
      showPlatform: false
    },
    messages: sampleMessages
  }
}`,
			...x.parameters?.docs?.source,
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
    config: defaultConfig,
    messages: []
  }
}`,
			...y.parameters?.docs?.source,
		},
	},
};
const X = [
	"Default",
	"SmallFont",
	"LargeFont",
	"NoBadges",
	"NoTimestamps",
	"MinimalView",
	"Empty",
];
export {
	w as Default,
	y as Empty,
	C as LargeFont,
	x as MinimalView,
	v as NoBadges,
	F as NoTimestamps,
	b as SmallFont,
	X as __namedExportsOrder,
	Q as default,
};
