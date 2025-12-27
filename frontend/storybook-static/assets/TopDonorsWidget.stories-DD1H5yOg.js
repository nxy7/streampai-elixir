import {
	t as c,
	i as a,
	c as m,
	S as z,
	a as R,
	F as O,
	g as W,
	v as f,
} from "./iframe-BQDcX1su.js";
import "./preload-helper-PPVm8Dsz.js";
var P =
		c(`<div class=widget-container style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif"><div class=top-donors-widget><div class=widget-title><div class=title-glow></div><span class=title-text></span><div class=title-decoration></div></div><div class=donors-list><div class=donors-container></div></div></div><style>
        .widget-container {
          width: 100%;
          height: 100%;
          container-type: size;
          container-name: widget;
        }

        .top-donors-widget {
          padding: 1.5rem;
          border-radius: 1.25rem;
          background: linear-gradient(145deg, var(--bg-color), color-mix(in srgb, var(--bg-color) 90%, white));
          backdrop-filter: blur(20px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-color);
          width: 100%;
          max-width: 380px;
          max-height: 100%;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          box-sizing: border-box;
        }

        .widget-title {
          position: relative;
          text-align: center;
          margin-bottom: 1rem;
          overflow: hidden;
          flex-shrink: 0;
        }

        .title-glow {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.3), transparent);
          border-radius: 0.5rem;
          opacity: 0;
          animation: titleGlow 4s ease-in-out infinite;
        }

        @keyframes titleGlow {
          0%,
          100% {
            transform: translateX(-100%);
            opacity: 0;
          }
          50% {
            transform: translateX(100%);
            opacity: 1;
          }
        }

        .title-text {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-color);
          position: relative;
          z-index: 2;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          background: linear-gradient(135deg, var(--text-color), var(--highlight-color));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .title-decoration {
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 3px;
          background: linear-gradient(90deg, var(--highlight-color), #ffed4e, var(--highlight-color));
          border-radius: 2px;
          box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }

        .donors-list {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
          position: relative;
        }

        .donors-list::-webkit-scrollbar {
          width: 6px;
        }

        .donors-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .donors-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .donors-list::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .donors-container {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          position: relative;
          min-height: 0;
        }

        .donor-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .donor-item.last-podium {
          margin-bottom: 1.5rem;
        }

        .donor-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .donor-item.top-1 {
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1));
          border-color: rgba(255, 215, 0, 0.3);
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
        }

        .donor-item.top-2 {
          background: linear-gradient(135deg, rgba(192, 192, 192, 0.2), rgba(192, 192, 192, 0.1));
          border-color: rgba(192, 192, 192, 0.3);
          box-shadow: 0 0 15px rgba(192, 192, 192, 0.2);
        }

        .donor-item.top-3 {
          background: linear-gradient(135deg, rgba(205, 127, 50, 0.2), rgba(205, 127, 50, 0.1));
          border-color: rgba(205, 127, 50, 0.3);
          box-shadow: 0 0 12px rgba(205, 127, 50, 0.2);
        }

        .donor-glow {
          position: absolute;
          inset: -2px;
          background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%);
          border-radius: 1rem;
          opacity: 0.5;
          filter: blur(8px);
          animation: donorGlow 3s ease-in-out infinite;
          z-index: -1;
        }

        @keyframes donorGlow {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.7;
          }
        }

        .donor-rank {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 3rem;
        }

        .rank-emoji {
          font-size: 1.5rem;
          margin-bottom: 0.25rem;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .rank-number {
          font-size: 0.875rem;
          font-weight: 700;
          color: color-mix(in srgb, var(--text-color) 70%, transparent);
          line-height: 1;
        }

        .donor-info {
          flex: 1;
          min-width: 0;
        }

        .donor-name {
          font-weight: 700;
          color: var(--text-color);
          margin-bottom: 0.25rem;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          word-break: break-word;
        }

        .donor-amount {
          font-size: 0.875rem;
          font-weight: 600;
          color: #10b981;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .top-1 .donor-name {
          font-size: 1.125rem;
        }

        .top-2 .donor-name {
          font-size: 1.0625rem;
        }

        .top-3 .donor-name {
          font-size: 1.03125rem;
        }

        @container widget (max-width: 300px) {
          .top-donors-widget {
            padding: 1rem;
          }

          .donor-item {
            padding: 0.75rem;
            gap: 0.75rem;
          }

          .rank-emoji {
            font-size: 1.25rem;
          }

          .donor-name {
            font-size: 0.9375rem;
          }

          .top-1 .donor-name {
            font-size: 1rem;
          }
        }

        @container widget (max-height: 400px) {
          .donors-container {
            gap: 0.5rem;
          }

          .donor-item {
            padding: 0.75rem;
          }
        }
      `),
	U = c(
		"<div class=donor-rank><span class=rank-emoji></span><span class=rank-number>",
	),
	X = c("<div class=donor-amount>"),
	q = c("<div class=donor-glow>"),
	I = c("<div><div class=donor-info><div class=donor-name>");
function T(r) {
	const u = () =>
			(r.donors || [])
				.sort((t, s) => s.amount - t.amount)
				.slice(0, r.config.topCount),
		A = (t) => {
			switch (t) {
				case 0:
					return "👑";
				case 1:
					return "🥈";
				case 2:
					return "🥉";
				default:
					return "🎖️";
			}
		},
		G = (t) => {
			switch (t) {
				case 0:
					return "top-1";
				case 1:
					return "top-2";
				case 2:
					return "top-3";
				default:
					return "regular";
			}
		},
		E = (t, s) =>
			`${s}${t.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	return (() => {
		var t = P(),
			s = t.firstChild,
			F = s.firstChild,
			V = F.firstChild,
			j = V.nextSibling,
			B = F.nextSibling,
			H = B.firstChild;
		return (
			a(j, () => r.config.title || "🏆 Top Donors"),
			a(
				H,
				m(O, {
					get each() {
						return u();
					},
					children: (o, i) =>
						(() => {
							var d = I(),
								l = d.firstChild,
								p = l.firstChild;
							return (
								a(
									d,
									m(z, {
										get when() {
											return r.config.showRanking;
										},
										get children() {
											var g = U(),
												N = g.firstChild,
												L = N.nextSibling;
											return a(N, () => A(i())), a(L, () => i() + 1), g;
										},
									}),
									l,
								),
								a(p, () => o.username),
								a(
									l,
									m(z, {
										get when() {
											return r.config.showAmounts;
										},
										get children() {
											var g = X();
											return a(g, () => E(o.amount, o.currency)), g;
										},
									}),
									null,
								),
								a(
									d,
									m(z, {
										get when() {
											return i() < 3;
										},
										get children() {
											return q();
										},
									}),
									null,
								),
								R(() =>
									W(
										d,
										`donor-item ${G(i())} ${i() === 2 ? "last-podium" : ""}`,
									),
								),
								d
							);
						})(),
				}),
			),
			R(
				(o) => {
					var i = r.config.backgroundColor || "#1f2937",
						d = r.config.textColor || "#ffffff",
						l = r.config.highlightColor || "#ffd700",
						p = `${r.config.fontSize}px`;
					return (
						i !== o.e && f(s, "--bg-color", (o.e = i)),
						d !== o.t && f(s, "--text-color", (o.t = d)),
						l !== o.a && f(s, "--highlight-color", (o.a = l)),
						p !== o.o && f(s, "font-size", (o.o = p)),
						o
					);
				},
				{ e: void 0, t: void 0, a: void 0, o: void 0 },
			),
			t
		);
	})();
}
try {
	(T.displayName = "TopDonorsWidget"),
		(T.__docgenInfo = {
			description: "",
			displayName: "TopDonorsWidget",
			props: {
				config: {
					defaultValue: null,
					description: "",
					name: "config",
					required: !0,
					type: { name: "TopDonorsConfig" },
				},
				donors: {
					defaultValue: null,
					description: "",
					name: "donors",
					required: !0,
					type: { name: "Donor[]" },
				},
			},
		});
} catch {}
var K = c("<div style=width:380px;height:500px>");
const J = {
		title: "Widgets/TopDonors",
		component: T,
		parameters: { layout: "centered", backgrounds: { default: "dark" } },
		tags: ["autodocs"],
		decorators: [
			(r) =>
				(() => {
					var u = K();
					return a(u, m(r, {})), u;
				})(),
		],
	},
	e = {
		title: "Top Donors",
		topCount: 5,
		fontSize: 16,
		showAmounts: !0,
		showRanking: !0,
		backgroundColor: "#1f2937",
		textColor: "#ffffff",
		highlightColor: "#ffd700",
	},
	n = [
		{ id: "1", username: "GenerousGamer", amount: 500, currency: "$" },
		{ id: "2", username: "StreamSupporter", amount: 250, currency: "$" },
		{ id: "3", username: "LoyalFan", amount: 150, currency: "$" },
		{ id: "4", username: "BigTipper", amount: 100, currency: "$" },
		{ id: "5", username: "KindViewer", amount: 75, currency: "$" },
		{ id: "6", username: "AwesomeDonor", amount: 50, currency: "$" },
	],
	b = { args: { config: e, donors: n } },
	h = { args: { config: { ...e, topCount: 3 }, donors: n } },
	x = {
		args: {
			config: { ...e, topCount: 10 },
			donors: [
				...n,
				{ id: "7", username: "GreatSupporter", amount: 40, currency: "$" },
				{ id: "8", username: "NiceViewer", amount: 30, currency: "$" },
				{ id: "9", username: "CoolDonor", amount: 25, currency: "$" },
				{ id: "10", username: "HappyTipper", amount: 20, currency: "$" },
			],
		},
	},
	w = { args: { config: { ...e, showAmounts: !1 }, donors: n } },
	v = { args: { config: { ...e, showRanking: !1 }, donors: n } },
	k = { args: { config: { ...e, fontSize: 20 }, donors: n } },
	y = { args: { config: { ...e, fontSize: 12 }, donors: n } },
	C = { args: { config: { ...e, title: "Hall of Fame" }, donors: n } },
	S = {
		args: {
			config: {
				...e,
				backgroundColor: "#4c1d95",
				textColor: "#f3e8ff",
				highlightColor: "#a78bfa",
			},
			donors: n,
		},
	},
	$ = {
		args: {
			config: {
				...e,
				backgroundColor: "#0f172a",
				textColor: "#cbd5e1",
				highlightColor: "#38bdf8",
			},
			donors: n,
		},
	},
	D = { args: { config: e, donors: [n[0]] } },
	_ = { args: { config: e, donors: [] } };
b.parameters = {
	...b.parameters,
	docs: {
		...b.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: defaultConfig,
    donors: sampleDonors
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
      topCount: 3
    },
    donors: sampleDonors
  }
}`,
			...h.parameters?.docs?.source,
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
      topCount: 10
    },
    donors: [...sampleDonors, {
      id: "7",
      username: "GreatSupporter",
      amount: 40,
      currency: "$"
    }, {
      id: "8",
      username: "NiceViewer",
      amount: 30,
      currency: "$"
    }, {
      id: "9",
      username: "CoolDonor",
      amount: 25,
      currency: "$"
    }, {
      id: "10",
      username: "HappyTipper",
      amount: 20,
      currency: "$"
    }]
  }
}`,
			...x.parameters?.docs?.source,
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
      showAmounts: false
    },
    donors: sampleDonors
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
    config: {
      ...defaultConfig,
      showRanking: false
    },
    donors: sampleDonors
  }
}`,
			...v.parameters?.docs?.source,
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
      fontSize: 20
    },
    donors: sampleDonors
  }
}`,
			...k.parameters?.docs?.source,
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
    config: {
      ...defaultConfig,
      fontSize: 12
    },
    donors: sampleDonors
  }
}`,
			...y.parameters?.docs?.source,
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
      title: "Hall of Fame"
    },
    donors: sampleDonors
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
      backgroundColor: "#4c1d95",
      textColor: "#f3e8ff",
      highlightColor: "#a78bfa"
    },
    donors: sampleDonors
  }
}`,
			...S.parameters?.docs?.source,
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
      backgroundColor: "#0f172a",
      textColor: "#cbd5e1",
      highlightColor: "#38bdf8"
    },
    donors: sampleDonors
  }
}`,
			...$.parameters?.docs?.source,
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
    config: defaultConfig,
    donors: [sampleDonors[0]]
  }
}`,
			...D.parameters?.docs?.source,
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
    donors: []
  }
}`,
			..._.parameters?.docs?.source,
		},
	},
};
const Q = [
	"Default",
	"Top3Only",
	"Top10",
	"NoAmounts",
	"NoRanking",
	"LargeFont",
	"SmallFont",
	"CustomTitle",
	"PurpleTheme",
	"DarkBlueTheme",
	"SingleDonor",
	"Empty",
];
export {
	C as CustomTitle,
	$ as DarkBlueTheme,
	b as Default,
	_ as Empty,
	k as LargeFont,
	w as NoAmounts,
	v as NoRanking,
	S as PurpleTheme,
	D as SingleDonor,
	y as SmallFont,
	x as Top10,
	h as Top3Only,
	Q as __namedExportsOrder,
	J as default,
};
