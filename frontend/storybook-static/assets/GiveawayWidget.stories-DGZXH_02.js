import {
	e as u,
	t as c,
	i as a,
	c as g,
	a as v,
	m as x,
	S as m,
	v as f,
	g as L,
} from "./iframe-BQDcX1su.js";
import { w as W, e as i, a as N } from "./index-CTbdOwF5.js";
import "./preload-helper-PPVm8Dsz.js";
var U = c(
		"<div class=giveaway-title style=font-size:1.5em;font-weight:bold;margin-bottom:0.75rem;line-height:1.2>",
	),
	Z = c(
		"<div class=giveaway-description style=font-size:0.9em;opacity:0.9;margin-bottom:1rem;line-height:1.4>",
	),
	D = c(
		'<div class=patreon-info style="margin-top:0.5rem;font-size:0.8em;opacity:0.9;padding:0.25rem 0.5rem;background-color:rgba(255, 255, 255, 0.2);border-radius:0.25rem;display:inline-block"> Patreons (<!>x entries)',
	),
	H = c(
		'<div class=entry-method style="margin-top:0.75rem;font-size:0.875em;font-weight:500;padding:0.375rem 0.75rem;background-color:rgba(255, 255, 255, 0.2);border-radius:0.375rem;display:inline-block">',
	),
	Y = c(
		'<div class=status-active style=padding:0.75rem;border-radius:0.5rem;color:white><div class=status-label style=font-size:0.875em;font-weight:600;margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:0.05em></div><div class=participant-count style="margin:0.75rem 0"><div class=count-value style=font-size:2em;font-weight:bold;line-height:1;margin-bottom:0.25rem></div><div class=count-label style=font-size:0.875em;opacity:0.9>',
	),
	O = c(
		'<div class=winner-patreon-badge style="display:inline-block;padding:0.25rem 0.75rem;background:linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);border-radius:0.375rem;font-size:0.75em;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">',
	),
	J = c(
		'<div style="padding:1rem;border-radius:0.5rem;background:linear-gradient(135deg, #10b981 0%, #059669 100%);color:white"><div class=winner-label style=font-size:1.1em;font-weight:600;margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:0.05em></div><div class=winner-name style=font-size:1.8em;font-weight:bold;margin-bottom:0.5rem;line-height:1.1>',
	),
	K = c(
		'<div class=status-inactive style="padding:0.75rem;border-radius:0.5rem;background-color:rgba(107, 114, 128, 0.1);opacity:0.7"><div class=inactive-label style=font-size:1em;font-weight:500>',
	),
	Q = c(
		'<div class=progress-container style=margin-top:1rem><div class=progress-bar style="width:100%;height:8px;background-color:rgba(0, 0, 0, 0.1);border-radius:4px;overflow:hidden;margin-bottom:0.5rem"><div class=progress-fill style="height:100%;border-radius:4px;transition:width 0.8s ease"></div></div><div class=progress-text style=font-size:0.875em;opacity:0.8;font-weight:500> / ',
	),
	X =
		c(`<div style="font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;padding:1rem"><style>
        .winner-fade { animation: fadeIn 1s ease-out; }
        .winner-slide { animation: slideInUp 1s ease-out; }
        .winner-bounce { animation: bounceIn 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
        .winner-confetti { animation: confettiCelebration 2s ease-out; }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideInUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes confettiCelebration {
          0% { transform: scale(0.5) rotateZ(0deg); opacity: 0; }
          50% { transform: scale(1.1) rotateZ(180deg); opacity: 1; }
          100% { transform: scale(1) rotateZ(360deg); opacity: 1; }
        }

        .font-small .count-value { font-size: 1.5em; }
        .font-small .giveaway-title { font-size: 1.2em; }
        .font-small .winner-name { font-size: 1.4em; }
        .font-medium .count-value { font-size: 2em; }
        .font-medium .giveaway-title { font-size: 1.5em; }
        .font-medium .winner-name { font-size: 1.8em; }
        .font-large .count-value { font-size: 2.5em; }
        .font-large .giveaway-title { font-size: 1.75em; }
        .font-large .winner-name { font-size: 2.2em; }
        .font-extra-large .count-value { font-size: 3em; }
        .font-extra-large .giveaway-title { font-size: 2em; }
        .font-extra-large .winner-name { font-size: 2.5em; }
      </style><div class=giveaway-container style="border-radius:0.75rem;padding:1.5rem;box-shadow:0 4px 6px rgba(0, 0, 0, 0.1);text-align:center;position:relative;overflow:hidden"><div class=giveaway-status style=margin-bottom:1rem>`);
function F(e) {
	const n = u(() =>
			e.event
				? e.event.type === "update"
					? e.event.participants
					: e.event.totalParticipants
				: 0,
		),
		I = u(() =>
			e.event
				? e.event.type === "update"
					? e.event.patreons
					: e.event.patreonParticipants
				: 0,
		),
		G = u(() => (e.event ? e.event.type === "update" && e.event.isActive : !1)),
		p = u(() =>
			!e.event || e.event.type !== "result" ? null : e.event.winner,
		),
		M = u(() =>
			!e.config.showProgressBar || e.config.targetParticipants <= 0
				? 0
				: Math.min(100, (n() / e.config.targetParticipants) * 100),
		),
		j = u(() => (p() ? `winner-${e.config.winnerAnimation}` : "")),
		q = u(() => `font-${e.config.fontSize}`);
	return (() => {
		var B = X(),
			R = B.firstChild,
			y = R.nextSibling,
			w = y.firstChild;
		return (
			a(
				y,
				g(m, {
					get when() {
						return x(() => !!e.config.showTitle)() && e.config.title;
					},
					get children() {
						var t = U();
						return (
							a(t, () => e.config.title),
							v((r) => f(t, "color", e.config.titleColor)),
							t
						);
					},
				}),
				w,
			),
			a(
				y,
				g(m, {
					get when() {
						return (
							x(() => !!e.config.showDescription)() && e.config.description
						);
					},
					get children() {
						var t = Z();
						return a(t, () => e.config.description), t;
					},
				}),
				w,
			),
			a(
				w,
				g(m, {
					get when() {
						return G();
					},
					get children() {
						var t = Y(),
							r = t.firstChild,
							l = r.nextSibling,
							s = l.firstChild,
							E = s.nextSibling;
						return (
							a(r, () => e.config.activeLabel || "Giveaway Active"),
							a(s, n),
							a(E, () => (n() === 1 ? "Participant" : "Participants")),
							a(
								t,
								g(m, {
									get when() {
										return x(() => e.config.patreonMultiplier > 1)() && I() > 0;
									},
									get children() {
										var o = D(),
											b = o.firstChild,
											h = b.nextSibling;
										return (
											h.nextSibling,
											a(o, I, b),
											a(o, () => e.config.patreonMultiplier, h),
											o
										);
									},
								}),
								null,
							),
							a(
								t,
								g(m, {
									get when() {
										return e.config.showEntryMethod;
									},
									get children() {
										var o = H();
										return (
											a(
												o,
												() => e.config.entryMethodText || "Type !join to enter",
											),
											o
										);
									},
								}),
								null,
							),
							v((o) =>
								f(
									t,
									"background",
									`linear-gradient(135deg, ${e.config.accentColor} 0%, color-mix(in srgb, ${e.config.accentColor} 80%, transparent) 100%)`,
								),
							),
							t
						);
					},
				}),
				null,
			),
			a(
				w,
				g(m, {
					get when() {
						return p();
					},
					get children() {
						var t = J(),
							r = t.firstChild,
							l = r.nextSibling;
						return (
							a(r, () => e.config.winnerLabel || "Winner!"),
							a(l, () => p()?.username),
							a(
								t,
								g(m, {
									get when() {
										return p()?.isPatreon;
									},
									get children() {
										var s = O();
										return (
											a(s, () => e.config.patreonBadgeText || "Patreon"), s
										);
									},
								}),
								null,
							),
							v(() => L(t, `status-winner ${j()}`)),
							t
						);
					},
				}),
				null,
			),
			a(
				w,
				g(m, {
					get when() {
						return x(() => !G())() && !p();
					},
					get children() {
						var t = K(),
							r = t.firstChild;
						return (
							a(r, () => e.config.inactiveLabel || "No Active Giveaway"),
							v((l) => f(t, "color", e.config.textColor)),
							t
						);
					},
				}),
				null,
			),
			a(
				y,
				g(m, {
					get when() {
						return (
							x(() => !!e.config.showProgressBar)() &&
							e.config.targetParticipants > 0
						);
					},
					get children() {
						var t = Q(),
							r = t.firstChild,
							l = r.firstChild,
							s = r.nextSibling,
							E = s.firstChild;
						return (
							a(s, n, E),
							a(s, () => e.config.targetParticipants, null),
							v(
								(o) => {
									var b = `${M()}%`,
										h = e.config.accentColor;
									return (
										b !== o.e && f(l, "width", (o.e = b)),
										h !== o.t && f(l, "background-color", (o.t = h)),
										o
									);
								},
								{ e: void 0, t: void 0 },
							),
							t
						);
					},
				}),
				null,
			),
			v(
				(t) => {
					var r = `giveaway-widget ${q()} ${p() ? "has-winner" : ""} ${G() ? "is-active" : ""}`,
						l = e.config.textColor,
						s = e.config.backgroundColor;
					return (
						r !== t.e && L(B, (t.e = r)),
						l !== t.t && f(B, "color", (t.t = l)),
						s !== t.a && f(y, "background-color", (t.a = s)),
						t
					);
				},
				{ e: void 0, t: void 0, a: void 0 },
			),
			B
		);
	})();
}
try {
	(F.displayName = "GiveawayWidget"),
		(F.__docgenInfo = {
			description: "",
			displayName: "GiveawayWidget",
			props: {
				config: {
					defaultValue: null,
					description: "",
					name: "config",
					required: !0,
					type: { name: "GiveawayConfig" },
				},
				event: {
					defaultValue: null,
					description: "",
					name: "event",
					required: !1,
					type: { name: "GiveawayEvent | undefined" },
				},
			},
		});
} catch {}
var ee = c("<div style=width:350px>");
const ie = {
		title: "Widgets/Giveaway",
		component: F,
		parameters: { layout: "centered", backgrounds: { default: "dark" } },
		tags: ["autodocs"],
		decorators: [
			(e) =>
				(() => {
					var n = ee();
					return a(n, g(e, {})), n;
				})(),
		],
	},
	d = {
		showTitle: !0,
		title: "Stream Giveaway",
		showDescription: !0,
		description: "Win a $50 Steam Gift Card!",
		activeLabel: "Giveaway Active",
		inactiveLabel: "No Active Giveaway",
		winnerLabel: "Winner!",
		entryMethodText: "Type !join to enter",
		showEntryMethod: !0,
		showProgressBar: !0,
		targetParticipants: 100,
		patreonMultiplier: 2,
		patreonBadgeText: "Patreon",
		winnerAnimation: "bounce",
		titleColor: "#ffffff",
		textColor: "#e2e8f0",
		backgroundColor: "#1e293b",
		accentColor: "#8b5cf6",
		fontSize: "medium",
		showPatreonInfo: !0,
	},
	P = {
		args: { config: d, event: void 0 },
		play: async ({ canvasElement: e }) => {
			const n = W(e);
			await i(n.getByText("Stream Giveaway")).toBeVisible(),
				await i(n.getByText("No Active Giveaway")).toBeVisible();
		},
	},
	$ = {
		args: {
			config: d,
			event: { type: "update", participants: 45, patreons: 8, isActive: !0 },
		},
		play: async ({ canvasElement: e }) => {
			const n = W(e);
			await i(n.getByText("Stream Giveaway")).toBeVisible(),
				await i(n.getByText("Giveaway Active")).toBeVisible(),
				await i(n.getByText("45")).toBeVisible(),
				await i(n.getByText("Participants")).toBeVisible(),
				await i(n.getByText("Type !join to enter")).toBeVisible(),
				await i(n.getByText("8 Patreons (2x entries)")).toBeVisible(),
				await i(n.getByText("45 / 100")).toBeVisible();
		},
	},
	_ = {
		args: {
			config: d,
			event: { type: "update", participants: 87, patreons: 15, isActive: !0 },
		},
	},
	T = {
		args: {
			config: d,
			event: { type: "update", participants: 100, patreons: 20, isActive: !0 },
		},
	},
	C = {
		args: {
			config: d,
			event: {
				type: "result",
				winner: { username: "LuckyWinner123", isPatreon: !1 },
				totalParticipants: 100,
				patreonParticipants: 20,
			},
		},
		play: async ({ canvasElement: e }) => {
			const n = W(e);
			await N(
				() => {
					i(n.getByText("Winner!")).toBeVisible();
				},
				{ timeout: 2e3 },
			),
				await i(n.getByText("LuckyWinner123")).toBeVisible(),
				await i(n.queryByText("Patreon")).toBeNull();
		},
	},
	S = {
		args: {
			config: d,
			event: {
				type: "result",
				winner: { username: "PatreonSupporter", isPatreon: !0 },
				totalParticipants: 85,
				patreonParticipants: 12,
			},
		},
		play: async ({ canvasElement: e }) => {
			const n = W(e);
			await N(
				() => {
					i(n.getByText("Winner!")).toBeVisible();
				},
				{ timeout: 2e3 },
			),
				await i(n.getByText("PatreonSupporter")).toBeVisible(),
				await i(n.getByText("Patreon")).toBeVisible();
		},
	},
	A = {
		args: {
			config: { ...d, winnerAnimation: "fade" },
			event: {
				type: "result",
				winner: { username: "FadeWinner", isPatreon: !1 },
				totalParticipants: 75,
				patreonParticipants: 10,
			},
		},
	},
	z = {
		args: {
			config: { ...d, fontSize: "small" },
			event: { type: "update", participants: 50, patreons: 5, isActive: !0 },
		},
	},
	V = {
		args: {
			config: { ...d, fontSize: "large" },
			event: { type: "update", participants: 60, patreons: 8, isActive: !0 },
		},
	},
	k = {
		args: {
			config: { ...d, showProgressBar: !1 },
			event: { type: "update", participants: 40, patreons: 6, isActive: !0 },
		},
	};
P.parameters = {
	...P.parameters,
	docs: {
		...P.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: defaultConfig,
    event: undefined
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Stream Giveaway")).toBeVisible();
    await expect(canvas.getByText("No Active Giveaway")).toBeVisible();
  }
}`,
			...P.parameters?.docs?.source,
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
    config: defaultConfig,
    event: {
      type: "update",
      participants: 45,
      patreons: 8,
      isActive: true
    }
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Stream Giveaway")).toBeVisible();
    await expect(canvas.getByText("Giveaway Active")).toBeVisible();
    await expect(canvas.getByText("45")).toBeVisible();
    await expect(canvas.getByText("Participants")).toBeVisible();
    await expect(canvas.getByText("Type !join to enter")).toBeVisible();
    await expect(canvas.getByText("8 Patreons (2x entries)")).toBeVisible();
    // Progress bar should show 45/100
    await expect(canvas.getByText("45 / 100")).toBeVisible();
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
    config: defaultConfig,
    event: {
      type: "update",
      participants: 87,
      patreons: 15,
      isActive: true
    }
  }
}`,
			..._.parameters?.docs?.source,
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
    config: defaultConfig,
    event: {
      type: "update",
      participants: 100,
      patreons: 20,
      isActive: true
    }
  }
}`,
			...T.parameters?.docs?.source,
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
    config: defaultConfig,
    event: {
      type: "result",
      winner: {
        username: "LuckyWinner123",
        isPatreon: false
      },
      totalParticipants: 100,
      patreonParticipants: 20
    }
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    // Wait for animation to complete before checking visibility
    await waitFor(() => {
      expect(canvas.getByText("Winner!")).toBeVisible();
    }, {
      timeout: 2000
    });
    await expect(canvas.getByText("LuckyWinner123")).toBeVisible();
    // Non-patreon winner should not show patreon badge
    await expect(canvas.queryByText("Patreon")).toBeNull();
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
    config: defaultConfig,
    event: {
      type: "result",
      winner: {
        username: "PatreonSupporter",
        isPatreon: true
      },
      totalParticipants: 85,
      patreonParticipants: 12
    }
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    // Wait for animation to complete before checking visibility
    await waitFor(() => {
      expect(canvas.getByText("Winner!")).toBeVisible();
    }, {
      timeout: 2000
    });
    await expect(canvas.getByText("PatreonSupporter")).toBeVisible();
    // Patreon winner should show badge
    await expect(canvas.getByText("Patreon")).toBeVisible();
  }
}`,
			...S.parameters?.docs?.source,
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
      winnerAnimation: "fade" as const
    },
    event: {
      type: "result",
      winner: {
        username: "FadeWinner",
        isPatreon: false
      },
      totalParticipants: 75,
      patreonParticipants: 10
    }
  }
}`,
			...A.parameters?.docs?.source,
		},
	},
};
z.parameters = {
	...z.parameters,
	docs: {
		...z.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: {
      ...defaultConfig,
      fontSize: "small" as const
    },
    event: {
      type: "update",
      participants: 50,
      patreons: 5,
      isActive: true
    }
  }
}`,
			...z.parameters?.docs?.source,
		},
	},
};
V.parameters = {
	...V.parameters,
	docs: {
		...V.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: {
      ...defaultConfig,
      fontSize: "large" as const
    },
    event: {
      type: "update",
      participants: 60,
      patreons: 8,
      isActive: true
    }
  }
}`,
			...V.parameters?.docs?.source,
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
    config: {
      ...defaultConfig,
      showProgressBar: false
    },
    event: {
      type: "update",
      participants: 40,
      patreons: 6,
      isActive: true
    }
  }
}`,
			...k.parameters?.docs?.source,
		},
	},
};
const re = [
	"Inactive",
	"Active",
	"HighParticipation",
	"TargetReached",
	"WinnerAnnounced",
	"PatreonWinner",
	"FadeAnimation",
	"SmallFont",
	"LargeFont",
	"NoProgressBar",
];
export {
	$ as Active,
	A as FadeAnimation,
	_ as HighParticipation,
	P as Inactive,
	V as LargeFont,
	k as NoProgressBar,
	S as PatreonWinner,
	z as SmallFont,
	T as TargetReached,
	C as WinnerAnnounced,
	re as __namedExportsOrder,
	ie as default,
};
