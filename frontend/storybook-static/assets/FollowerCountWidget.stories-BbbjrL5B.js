import {
	t as b,
	i as a,
	c as v,
	S as _,
	a as z,
	v as t,
} from "./iframe-BQDcX1su.js";
import "./preload-helper-PPVm8Dsz.js";
var F = b(
		'<svg aria-hidden=true width=24 height=24 viewBox="0 0 24 24"fill=currentColor style=flex-shrink:0><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z">',
	),
	I = b("<span style=font-size:0.7em;opacity:0.9>"),
	L = b(
		'<div style="display:inline-flex;align-items:center;gap:12px;padding:16px 24px;border-radius:12px;font-weight:bold;font-family:system-ui, -apple-system, sans-serif;box-shadow:0 4px 6px rgba(0, 0, 0, 0.1)"><span>',
	);
function C(n) {
	const k = () => n.count ?? 0;
	return (() => {
		var r = L(),
			S = r.firstChild;
		return (
			a(
				r,
				v(_, {
					get when() {
						return n.config.showIcon;
					},
					get children() {
						return F();
					},
				}),
				S,
			),
			a(S, () => k().toLocaleString()),
			a(
				r,
				v(_, {
					get when() {
						return n.config.label;
					},
					get children() {
						var e = I();
						return a(e, () => n.config.label), e;
					},
				}),
				null,
			),
			z(
				(e) => {
					var h = n.config.backgroundColor,
						x = n.config.textColor,
						y = `${n.config.fontSize}px`,
						w = n.config.animateOnChange ? "transform 0.3s ease" : "none";
					return (
						h !== e.e && t(r, "background-color", (e.e = h)),
						x !== e.t && t(r, "color", (e.t = x)),
						y !== e.a && t(r, "font-size", (e.a = y)),
						w !== e.o && t(r, "transition", (e.o = w)),
						e
					);
				},
				{ e: void 0, t: void 0, a: void 0, o: void 0 },
			),
			r
		);
	})();
}
try {
	(C.displayName = "FollowerCountWidget"),
		(C.__docgenInfo = {
			description: "",
			displayName: "FollowerCountWidget",
			props: {
				config: {
					defaultValue: null,
					description: "",
					name: "config",
					required: !0,
					type: { name: "FollowerCountConfig" },
				},
				count: {
					defaultValue: null,
					description: "",
					name: "count",
					required: !1,
					type: { name: "number | undefined" },
				},
			},
		});
} catch {}
const W = {
		title: "Widgets/FollowerCount",
		component: C,
		parameters: { layout: "centered", backgrounds: { default: "dark" } },
		tags: ["autodocs"],
	},
	o = {
		label: "Followers",
		fontSize: 32,
		textColor: "#ffffff",
		backgroundColor: "#6366f1",
		showIcon: !0,
		animateOnChange: !0,
	},
	s = { args: { config: o, count: 12543 } },
	c = { args: { config: o, count: 42 } },
	i = { args: { config: o, count: 1234567 } },
	l = { args: { config: { ...o, showIcon: !1 }, count: 8765 } },
	u = { args: { config: { ...o, label: "" }, count: 5e3 } },
	g = { args: { config: { ...o, fontSize: 48 }, count: 9999 } },
	f = { args: { config: { ...o, fontSize: 20 }, count: 3210 } },
	d = {
		args: {
			config: {
				...o,
				backgroundColor: "#dc2626",
				textColor: "#fef2f2",
				label: "Subscribers",
			},
			count: 25e3,
		},
	},
	m = {
		args: {
			config: {
				...o,
				backgroundColor: "#10b981",
				textColor: "#ecfdf5",
				label: "Members",
			},
			count: 750,
		},
	},
	p = { args: { config: o, count: 0 } };
s.parameters = {
	...s.parameters,
	docs: {
		...s.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: defaultConfig,
    count: 12543
  }
}`,
			...s.parameters?.docs?.source,
		},
	},
};
c.parameters = {
	...c.parameters,
	docs: {
		...c.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: defaultConfig,
    count: 42
  }
}`,
			...c.parameters?.docs?.source,
		},
	},
};
i.parameters = {
	...i.parameters,
	docs: {
		...i.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: defaultConfig,
    count: 1234567
  }
}`,
			...i.parameters?.docs?.source,
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
      showIcon: false
    },
    count: 8765
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
      label: ""
    },
    count: 5000
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
      fontSize: 48
    },
    count: 9999
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
    config: {
      ...defaultConfig,
      fontSize: 20
    },
    count: 3210
  }
}`,
			...f.parameters?.docs?.source,
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
      backgroundColor: "#dc2626",
      textColor: "#fef2f2",
      label: "Subscribers"
    },
    count: 25000
  }
}`,
			...d.parameters?.docs?.source,
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
      backgroundColor: "#10b981",
      textColor: "#ecfdf5",
      label: "Members"
    },
    count: 750
  }
}`,
			...m.parameters?.docs?.source,
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
    config: defaultConfig,
    count: 0
  }
}`,
			...p.parameters?.docs?.source,
		},
	},
};
const O = [
	"Default",
	"SmallCount",
	"LargeCount",
	"NoIcon",
	"NoLabel",
	"LargeFont",
	"SmallFont",
	"CustomColors",
	"GreenTheme",
	"Zero",
];
export {
	d as CustomColors,
	s as Default,
	m as GreenTheme,
	i as LargeCount,
	g as LargeFont,
	l as NoIcon,
	u as NoLabel,
	c as SmallCount,
	f as SmallFont,
	p as Zero,
	O as __namedExportsOrder,
	W as default,
};
