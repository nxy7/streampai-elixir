import {
	b as N,
	e as w,
	o as X,
	t as u,
	i as o,
	c as f,
	a as h,
	S as y,
	F as J,
	m as K,
	v as a,
	g as Q,
	k as Z,
} from "./iframe-BQDcX1su.js";
import "./preload-helper-PPVm8Dsz.js";
var ee = u(
		"<div class=widget-title style=position:relative;text-align:center;margin-bottom:1rem;overflow:hidden;flex-shrink:0><span class=title-text>",
	),
	te = u(
		'<div class=current-amount style="font-size:1.1rem;font-weight:800;text-shadow:0 1px 2px rgba(0, 0, 0, 0.1)">',
	),
	re = u(
		'<div style="position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);animation:shimmer 3s infinite;border-radius:1.25rem">',
	),
	ne = u(
		'<div style=position:absolute;top:-45px;transform:translateX(-50%);z-index:20><div style="color:white;padding:0.5rem 0.75rem;border-radius:1rem;font-size:0.875rem;font-weight:700;white-space:nowrap;box-shadow:0 4px 12px rgba(0, 0, 0, 0.15);position:relative">%',
	),
	oe = u(
		"<div class=days-left-subtle style=font-size:0.875rem;text-align:center;font-weight:500;margin-top:0.5rem> days left",
	),
	ae = u(`<div class=widget-container style=width:100%;height:100%><style>
        .donation-goal-widget {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          padding: 1.5rem;
          border-radius: 1.25rem;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95));
          backdrop-filter: blur(20px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.2);
          width: 100%;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          box-sizing: border-box;
        }
        .title-text {
          font-size: 1.5rem;
          font-weight: 800;
          position: relative;
          z-index: 2;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .progress-track {
          position: relative;
          height: 2.5rem;
          margin-bottom: 1rem;
        }
        .progress-background {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, color-mix(in srgb, var(--bg-color, #e5e7eb) 90%, white), var(--bg-color, #e5e7eb), color-mix(in srgb, var(--bg-color, #e5e7eb) 90%, black));
          border-radius: 1.25rem;
          overflow: hidden;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .progress-bar {
          position: relative;
          height: 100%;
          background: linear-gradient(135deg, var(--bar-color, #10b981), color-mix(in srgb, var(--bar-color, #10b981) 80%, white), var(--bar-color, #10b981), color-mix(in srgb, var(--bar-color, #10b981) 90%, white));
          border-radius: 1.25rem;
          transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          box-shadow: 0 0 20px rgba(168, 85, 247, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
        @keyframes floatUp {
          0% { transform: translateY(0) scale(0.7) rotate(-5deg); opacity: 0; }
          15% { transform: translateY(-15px) scale(1.2) rotate(2deg); opacity: 1; }
          85% { transform: translateY(-80px) scale(1) rotate(-2deg); opacity: 1; }
          100% { transform: translateY(-120px) scale(0.8) rotate(5deg); opacity: 0; }
        }
        .floating-bubble {
          position: absolute;
          pointer-events: none;
          animation: floatUp 4s ease-out forwards;
          z-index: 15;
        }
        .theme-minimal { background: rgba(255, 255, 255, 0.9); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); padding: 1.5rem; }
        .theme-minimal .progress-track { height: 1.5rem; }
        .theme-minimal .title-text { font-size: 1.25rem; }
        .theme-modern {
          background: linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9));
          border: 1px solid rgba(148, 163, 184, 0.1);
          color: #e2e8f0;
        }
      </style><div><div class=progress-section style=position:relative><div class=progress-container style=position:relative;margin-bottom:1rem><div class=progress-labels style=display:flex;justify-content:space-between;margin-bottom:0.75rem;font-weight:600><div class=goal-amount style=font-size:1rem></div></div><div class=progress-track><div class=progress-background><div class=progress-texture></div></div><div class=progress-bar><div style="position:absolute;top:0;left:0;right:0;height:40%;background:linear-gradient(180deg, rgba(255, 255, 255, 0.4), transparent);border-radius:1.25rem 1.25rem 0 0"></div></div></div></div><div class=stats-container style=display:flex;justify-content:center;gap:1rem;flex-wrap:wrap;margin-top:1rem></div></div></div><style>
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 200%; }
        }
      `),
	ie = u(
		'<div class=floating-bubble style=bottom:0><div style="display:flex;align-items:center;color:white;padding:0.5rem 1rem;border-radius:2rem;font-weight:800;font-size:0.875rem;white-space:nowrap;box-shadow:0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3);position:relative;z-index:2"><span style=font-size:1.1rem;margin-right:0.25rem>+</span><span style=font-weight:900>',
	);
function P(e) {
	const [b, W] = N([]),
		[U, Y] = N(null),
		M = w(() => {
			const n = e.currentAmount || e.config.startingAmount || 0,
				i = e.config.goalAmount || 1e3;
			return Math.min((n / i) * 100, 100);
		}),
		q = w(() => {
			const n = e.config.currency || "$",
				i = e.config.goalAmount || 1e3;
			return `${n}${i.toLocaleString()}`;
		}),
		B = w(() => {
			const n = e.config.currency || "$",
				i = e.currentAmount || e.config.startingAmount || 0;
			return `${n}${i.toLocaleString()}`;
		}),
		F = w(() => {
			if (!e.config.endDate) return null;
			const n = new Date(e.config.endDate),
				i = new Date(),
				s = n.getTime() - i.getTime(),
				x = Math.ceil(s / (1e3 * 60 * 60 * 24));
			return x > 0 ? x : 0;
		}),
		V = w(() => {
			switch (e.config.theme) {
				case "minimal":
					return "theme-minimal";
				case "modern":
					return "theme-modern";
				default:
					return "theme-default";
			}
		});
	return (
		X(() => {
			let n;
			if (e.donation && e.config.animationEnabled && e.donation.id !== U()) {
				Y(e.donation.id);
				const i = {
					id: e.donation.id,
					amount: e.donation.amount,
					currency: e.donation.currency || e.config.currency || "$",
					x: Math.random() * 80 + 10,
					y: 0,
				};
				W([...b(), i]),
					(n = window.setTimeout(() => {
						W(b().filter((s) => s.id !== i.id));
					}, 4e3));
			}
			Z(() => {
				n !== void 0 && clearTimeout(n);
			});
		}),
		(() => {
			var n = ae(),
				i = n.firstChild,
				s = i.nextSibling,
				x = s.firstChild,
				T = x.firstChild,
				E = T.firstChild,
				L = E.firstChild,
				I = E.nextSibling,
				j = I.firstChild,
				R = j.nextSibling,
				H = R.firstChild,
				O = T.nextSibling;
			return (
				o(
					s,
					f(y, {
						get when() {
							return e.config.title;
						},
						get children() {
							var t = ee(),
								r = t.firstChild;
							return (
								o(r, () => e.config.title),
								h((d) => a(r, "color", e.config.textColor)),
								t
							);
						},
					}),
					x,
				),
				o(
					E,
					f(y, {
						get when() {
							return e.config.showAmountRaised;
						},
						get children() {
							var t = te();
							return o(t, B), h((r) => a(t, "color", e.config.barColor)), t;
						},
					}),
					L,
				),
				o(L, q),
				o(
					R,
					f(y, {
						get when() {
							return e.config.animationEnabled;
						},
						get children() {
							return re();
						},
					}),
					H,
				),
				o(
					I,
					f(y, {
						get when() {
							return e.config.showPercentage;
						},
						get children() {
							var t = ne(),
								r = t.firstChild,
								d = r.firstChild;
							return (
								o(r, () => Math.round(M()), d),
								h(
									(c) => {
										var m = `${Math.min(M(), 95)}%`,
											l = e.config.barColor;
										return (
											m !== c.e && a(t, "left", (c.e = m)),
											l !== c.t && a(r, "background", (c.t = l)),
											c
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
				o(
					T,
					f(J, {
						get each() {
							return b();
						},
						children: (t) =>
							(() => {
								var r = ie(),
									d = r.firstChild,
									c = d.firstChild,
									m = c.nextSibling;
								return (
									o(m, () => t.currency, null),
									o(m, () => t.amount.toFixed(2), null),
									h(
										(l) => {
											var v = `${t.x}%`,
												p = `linear-gradient(135deg, ${e.config.barColor}, color-mix(in srgb, ${e.config.barColor} 80%, white))`;
											return (
												v !== l.e && a(r, "left", (l.e = v)),
												p !== l.t && a(d, "background", (l.t = p)),
												l
											);
										},
										{ e: void 0, t: void 0 },
									),
									r
								);
							})(),
					}),
					null,
				),
				o(
					O,
					f(y, {
						get when() {
							return K(() => !!e.config.showDaysLeft)() && F() !== null;
						},
						get children() {
							var t = oe(),
								r = t.firstChild;
							return (
								o(t, F, r),
								h((d) =>
									a(
										t,
										"color",
										`color-mix(in srgb, ${e.config.textColor} 50%, transparent)`,
									),
								),
								t
							);
						},
					}),
				),
				h(
					(t) => {
						var r = `donation-goal-widget ${V()}`,
							d = e.config.barColor || "#10b981",
							c = e.config.backgroundColor || "#e5e7eb",
							m = e.config.textColor || "#1f2937",
							l = e.config.textColor || "#1f2937",
							v = `color-mix(in srgb, ${e.config.textColor} 70%, transparent)`,
							p = `${M()}%`;
						return (
							r !== t.e && Q(s, (t.e = r)),
							d !== t.t && a(s, "--bar-color", (t.t = d)),
							c !== t.a && a(s, "--bg-color", (t.a = c)),
							m !== t.o && a(s, "--text-color", (t.o = m)),
							l !== t.i && a(s, "color", (t.i = l)),
							v !== t.n && a(L, "color", (t.n = v)),
							p !== t.s && a(R, "width", (t.s = p)),
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
					},
				),
				n
			);
		})()
	);
}
try {
	(P.displayName = "DonationGoalWidget"),
		(P.__docgenInfo = {
			description: "",
			displayName: "DonationGoalWidget",
			props: {
				config: {
					defaultValue: null,
					description: "",
					name: "config",
					required: !0,
					type: { name: "DonationGoalConfig" },
				},
				currentAmount: {
					defaultValue: null,
					description: "",
					name: "currentAmount",
					required: !0,
					type: { name: "number" },
				},
				donation: {
					defaultValue: null,
					description: "",
					name: "donation",
					required: !1,
					type: { name: "DonationEvent | null | undefined" },
				},
			},
		});
} catch {}
var se = u("<div style=width:400px;padding:20px;background:rgba(0,0,0,0.5)>");
const de = {
		title: "Widgets/DonationGoal",
		component: P,
		parameters: { layout: "fullscreen", backgrounds: { default: "dark" } },
		tags: ["autodocs"],
		decorators: [
			(e) =>
				(() => {
					var b = se();
					return o(b, f(e, {})), b;
				})(),
		],
	},
	g = {
		goalAmount: 1e3,
		startingAmount: 0,
		currency: "$",
		startDate: "2024-01-01",
		endDate: "2024-12-31",
		title: "Stream Goal",
		showPercentage: !0,
		showAmountRaised: !0,
		showDaysLeft: !0,
		theme: "default",
		barColor: "#10b981",
		backgroundColor: "#e5e7eb",
		textColor: "#1f2937",
		animationEnabled: !0,
	},
	C = { args: { config: g, currentAmount: 350 } },
	$ = { args: { config: g, currentAmount: 500 } },
	A = {
		args: { config: { ...g, title: "Almost There!" }, currentAmount: 950 },
	},
	_ = {
		args: { config: { ...g, title: "Goal Reached! 🎉" }, currentAmount: 1e3 },
	},
	k = { args: { config: { ...g, theme: "minimal" }, currentAmount: 420 } },
	D = {
		args: {
			config: { ...g, theme: "modern", textColor: "#e2e8f0" },
			currentAmount: 600,
		},
	},
	S = {
		args: {
			config: {
				...g,
				barColor: "#8b5cf6",
				backgroundColor: "#fef3c7",
				textColor: "#7c2d12",
				title: "Custom Styled Goal",
			},
			currentAmount: 750,
		},
	},
	z = {
		args: {
			config: g,
			currentAmount: 400,
			donation: {
				id: "1",
				amount: 50,
				currency: "$",
				username: "GenerousDonor",
				timestamp: new Date(),
			},
		},
	},
	G = {
		args: {
			config: {
				...g,
				showPercentage: !1,
				showDaysLeft: !1,
				showAmountRaised: !1,
			},
			currentAmount: 300,
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
    currentAmount: 350
  }
}`,
			...C.parameters?.docs?.source,
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
    currentAmount: 500
  }
}`,
			...$.parameters?.docs?.source,
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
      title: "Almost There!"
    },
    currentAmount: 950
  }
}`,
			...A.parameters?.docs?.source,
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
      title: "Goal Reached! 🎉"
    },
    currentAmount: 1000
  }
}`,
			..._.parameters?.docs?.source,
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
      theme: "minimal" as const
    },
    currentAmount: 420
  }
}`,
			...k.parameters?.docs?.source,
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
    config: {
      ...defaultConfig,
      theme: "modern" as const,
      textColor: "#e2e8f0"
    },
    currentAmount: 600
  }
}`,
			...D.parameters?.docs?.source,
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
      barColor: "#8b5cf6",
      backgroundColor: "#fef3c7",
      textColor: "#7c2d12",
      title: "Custom Styled Goal"
    },
    currentAmount: 750
  }
}`,
			...S.parameters?.docs?.source,
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
    config: defaultConfig,
    currentAmount: 400,
    donation: {
      id: "1",
      amount: 50,
      currency: "$",
      username: "GenerousDonor",
      timestamp: new Date()
    }
  }
}`,
			...z.parameters?.docs?.source,
		},
	},
};
G.parameters = {
	...G.parameters,
	docs: {
		...G.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: {
      ...defaultConfig,
      showPercentage: false,
      showDaysLeft: false,
      showAmountRaised: false
    },
    currentAmount: 300
  }
}`,
			...G.parameters?.docs?.source,
		},
	},
};
const ge = [
	"Default",
	"HalfwayThere",
	"AlmostComplete",
	"Completed",
	"MinimalTheme",
	"ModernTheme",
	"CustomColors",
	"WithDonation",
	"NoExtras",
];
export {
	A as AlmostComplete,
	_ as Completed,
	S as CustomColors,
	C as Default,
	$ as HalfwayThere,
	k as MinimalTheme,
	D as ModernTheme,
	G as NoExtras,
	z as WithDonation,
	ge as __namedExportsOrder,
	de as default,
};
