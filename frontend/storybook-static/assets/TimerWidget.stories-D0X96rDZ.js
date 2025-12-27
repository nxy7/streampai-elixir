import { w as T, e as r } from "./index-CTbdOwF5.js";
import {
	b as V,
	f as D,
	o as N,
	t as _,
	i as S,
	m as $,
	a as F,
	v as C,
	k as H,
} from "./iframe-BQDcX1su.js";
import "./preload-helper-PPVm8Dsz.js";
var L = _(
		'<div style="display:inline-flex;flex-direction:column;align-items:center;gap:8px;padding:16px 32px;border-radius:12px;font-weight:bold;font-family:system-ui, -apple-system, sans-serif;box-shadow:0 4px 6px rgba(0, 0, 0, 0.1);min-width:200px"><div style=font-variant-numeric:tabular-nums;line-height:1>',
	),
	R = _("<div style=font-size:0.5em;opacity:0.9;letter-spacing:0.05em>");
function B(e) {
	const [a, h] = V(0),
		[E, M] = V(!1);
	function z(o) {
		const i = Math.abs(o),
			n = Math.floor(i / 60),
			s = i % 60;
		return `${o < 0 ? "-" : ""}${n.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
	}
	return (
		D(() => {
			h(e.config.countdownMinutes * 60), M(e.config.autoStart);
		}),
		N(() => {
			const o = setInterval(() => {
				E() &&
					h((i) => {
						const n = i - 1;
						return n <= 0 && !e.config.autoStart ? (M(!1), 0) : n;
					});
			}, 1e3);
			H(() => clearInterval(o));
		}),
		(() => {
			var o = L(),
				i = o.firstChild;
			return (
				S(i, () => z(a())),
				S(
					o,
					(() => {
						var n = $(() => !!e.config.label);
						return () =>
							n() &&
							(() => {
								var s = R();
								return S(s, () => e.config.label), s;
							})();
					})(),
					null,
				),
				F(
					(n) => {
						var s = e.config.backgroundColor,
							w = e.config.textColor,
							k = `${e.config.fontSize}px`;
						return (
							s !== n.e && C(o, "background-color", (n.e = s)),
							w !== n.t && C(o, "color", (n.t = w)),
							k !== n.a && C(o, "font-size", (n.a = k)),
							n
						);
					},
					{ e: void 0, t: void 0, a: void 0 },
				),
				o
			);
		})()
	);
}
try {
	(B.displayName = "TimerWidget"),
		(B.__docgenInfo = {
			description: "",
			displayName: "TimerWidget",
			props: {
				config: {
					defaultValue: null,
					description: "",
					name: "config",
					required: !0,
					type: { name: "TimerConfig" },
				},
			},
		});
} catch {}
const q = {
		title: "Widgets/Timer",
		component: B,
		parameters: { layout: "centered", backgrounds: { default: "dark" } },
		tags: ["autodocs"],
	},
	t = {
		label: "Stream Timer",
		fontSize: 48,
		textColor: "#ffffff",
		backgroundColor: "#6366f1",
		countdownMinutes: 10,
		autoStart: !1,
	},
	c = {
		args: { config: t },
		play: async ({ canvasElement: e }) => {
			const a = T(e);
			await r(a.getByText("Stream Timer")).toBeVisible(),
				await r(a.getByText("10:00")).toBeVisible();
		},
	},
	l = { args: { config: { ...t, autoStart: !0 } } },
	u = {
		args: { config: { ...t, countdownMinutes: 5, label: "5 Min Countdown" } },
		play: async ({ canvasElement: e }) => {
			const a = T(e);
			await r(a.getByText("5 Min Countdown")).toBeVisible(),
				await r(a.getByText("05:00")).toBeVisible();
		},
	},
	g = {
		args: { config: { ...t, countdownMinutes: 60, label: "1 Hour Timer" } },
		play: async ({ canvasElement: e }) => {
			const a = T(e);
			await r(a.getByText("1 Hour Timer")).toBeVisible(),
				await r(a.getByText("60:00")).toBeVisible();
		},
	},
	m = { args: { config: { ...t, fontSize: 72 } } },
	d = { args: { config: { ...t, fontSize: 32 } } },
	f = {
		args: { config: { ...t, label: "" } },
		play: async ({ canvasElement: e }) => {
			const a = T(e);
			await r(a.getByText("10:00")).toBeVisible(),
				await r(a.queryByText("Stream Timer")).toBeNull();
		},
	},
	p = {
		args: {
			config: {
				...t,
				backgroundColor: "#dc2626",
				textColor: "#fef2f2",
				label: "Danger Zone",
			},
		},
	},
	b = {
		args: {
			config: {
				...t,
				backgroundColor: "#10b981",
				textColor: "#ecfdf5",
				label: "Go Time",
			},
		},
	},
	y = {
		args: {
			config: {
				...t,
				backgroundColor: "#1e293b",
				textColor: "#94a3b8",
				label: "Dark Mode",
			},
		},
	},
	x = {
		args: {
			config: {
				...t,
				countdownMinutes: 15,
				backgroundColor: "#f59e0b",
				textColor: "#1e1b4b",
				label: "Break Time",
			},
		},
	},
	v = {
		args: { config: { ...t, countdownMinutes: 180, label: "Marathon Stream" } },
	};
c.parameters = {
	...c.parameters,
	docs: {
		...c.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: defaultConfig
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Stream Timer")).toBeVisible();
    // 10 minutes = 10:00
    await expect(canvas.getByText("10:00")).toBeVisible();
  }
}`,
			...c.parameters?.docs?.source,
		},
	},
};
l.parameters = {
	...l.parameters,
	docs: {
		...l.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: {
      ...defaultConfig,
      autoStart: true
    }
  }
}`,
			...l.parameters?.docs?.source,
		},
	},
};
u.parameters = {
	...u.parameters,
	docs: {
		...u.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: {
      ...defaultConfig,
      countdownMinutes: 5,
      label: "5 Min Countdown"
    }
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("5 Min Countdown")).toBeVisible();
    await expect(canvas.getByText("05:00")).toBeVisible();
  }
}`,
			...u.parameters?.docs?.source,
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
    config: {
      ...defaultConfig,
      countdownMinutes: 60,
      label: "1 Hour Timer"
    }
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("1 Hour Timer")).toBeVisible();
    await expect(canvas.getByText("60:00")).toBeVisible();
  }
}`,
			...g.parameters?.docs?.source,
		},
	},
};
m.parameters = {
	...m.parameters,
	docs: {
		...m.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: {
      ...defaultConfig,
      fontSize: 72
    }
  }
}`,
			...m.parameters?.docs?.source,
		},
	},
};
d.parameters = {
	...d.parameters,
	docs: {
		...d.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: {
      ...defaultConfig,
      fontSize: 32
    }
  }
}`,
			...d.parameters?.docs?.source,
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
    config: {
      ...defaultConfig,
      label: ""
    }
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    // Timer should still show time even without label
    await expect(canvas.getByText("10:00")).toBeVisible();
    // No label should be present
    await expect(canvas.queryByText("Stream Timer")).toBeNull();
  }
}`,
			...f.parameters?.docs?.source,
		},
	},
};
p.parameters = {
	...p.parameters,
	docs: {
		...p.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: {
      ...defaultConfig,
      backgroundColor: "#dc2626",
      textColor: "#fef2f2",
      label: "Danger Zone"
    }
  }
}`,
			...p.parameters?.docs?.source,
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
      backgroundColor: "#10b981",
      textColor: "#ecfdf5",
      label: "Go Time"
    }
  }
}`,
			...b.parameters?.docs?.source,
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
      backgroundColor: "#1e293b",
      textColor: "#94a3b8",
      label: "Dark Mode"
    }
  }
}`,
			...y.parameters?.docs?.source,
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
      countdownMinutes: 15,
      backgroundColor: "#f59e0b",
      textColor: "#1e1b4b",
      label: "Break Time"
    }
  }
}`,
			...x.parameters?.docs?.source,
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
      countdownMinutes: 180,
      label: "Marathon Stream"
    }
  }
}`,
			...v.parameters?.docs?.source,
		},
	},
};
const O = [
	"Default",
	"AutoStart",
	"FiveMinutes",
	"OneHour",
	"LargeFont",
	"SmallFont",
	"NoLabel",
	"RedTheme",
	"GreenTheme",
	"DarkTheme",
	"BreakTimer",
	"LongTimer",
];
export {
	l as AutoStart,
	x as BreakTimer,
	y as DarkTheme,
	c as Default,
	u as FiveMinutes,
	b as GreenTheme,
	m as LargeFont,
	v as LongTimer,
	f as NoLabel,
	g as OneHour,
	p as RedTheme,
	d as SmallFont,
	O as __namedExportsOrder,
	q as default,
};
