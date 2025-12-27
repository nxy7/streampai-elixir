import { c as a, t as h, i as n } from "./iframe-BQDcX1su.js";
import { B as e } from "./Badge-CXO3PRin.js";
import "./preload-helper-PPVm8Dsz.js";
import "./design-system-CwcdUVvG.js";
var S = h("<div style=display:flex;gap:8px;flex-wrap:wrap>"),
	f = h("<div style=display:flex;gap:8px>"),
	w = h(
		'<svg class="mr-1 h-3 w-3"fill=currentColor viewBox="0 0 20 20"><path fill-rule=evenodd d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"clip-rule=evenodd>',
	);
const z = {
		title: "Design System/Badge",
		component: e,
		parameters: { layout: "centered" },
		tags: ["autodocs"],
		argTypes: {
			variant: {
				control: "select",
				options: [
					"success",
					"warning",
					"error",
					"info",
					"neutral",
					"purple",
					"pink",
				],
			},
			size: { control: "select", options: ["sm", "md"] },
		},
	},
	s = { args: { variant: "success", children: "Active" } },
	i = { args: { variant: "warning", children: "Pending" } },
	t = { args: { variant: "error", children: "Failed" } },
	c = { args: { variant: "info", children: "New" } },
	o = { args: { variant: "neutral", children: "Draft" } },
	l = { args: { variant: "purple", children: "Twitch" } },
	d = { args: { variant: "pink", children: "Featured" } },
	u = { args: { size: "sm", variant: "success", children: "Small" } },
	p = { args: { size: "md", variant: "success", children: "Medium" } },
	g = {
		render: () =>
			(() => {
				var r = S();
				return (
					n(r, a(e, { variant: "success", children: "Success" }), null),
					n(r, a(e, { variant: "warning", children: "Warning" }), null),
					n(r, a(e, { variant: "error", children: "Error" }), null),
					n(r, a(e, { variant: "info", children: "Info" }), null),
					n(r, a(e, { variant: "neutral", children: "Neutral" }), null),
					n(r, a(e, { variant: "purple", children: "Purple" }), null),
					n(r, a(e, { variant: "pink", children: "Pink" }), null),
					r
				);
			})(),
	},
	m = {
		render: () =>
			(() => {
				var r = f();
				return (
					n(r, a(e, { variant: "purple", children: "Twitch" }), null),
					n(r, a(e, { variant: "error", children: "YouTube" }), null),
					n(r, a(e, { variant: "success", children: "Kick" }), null),
					n(r, a(e, { variant: "info", children: "Facebook" }), null),
					r
				);
			})(),
		name: "Platform Badges",
	},
	v = {
		render: () =>
			(() => {
				var r = f();
				return (
					n(r, a(e, { variant: "success", children: "Live" }), null),
					n(r, a(e, { variant: "neutral", children: "Offline" }), null),
					n(r, a(e, { variant: "warning", children: "Starting Soon" }), null),
					n(r, a(e, { variant: "error", children: "Ended" }), null),
					r
				);
			})(),
		name: "Status Badges",
	},
	B = {
		render: () =>
			a(e, {
				variant: "success",
				get children() {
					return [w(), "Verified"];
				},
			}),
	};
s.parameters = {
	...s.parameters,
	docs: {
		...s.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    variant: "success",
    children: "Active"
  }
}`,
			...s.parameters?.docs?.source,
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
    variant: "warning",
    children: "Pending"
  }
}`,
			...i.parameters?.docs?.source,
		},
	},
};
t.parameters = {
	...t.parameters,
	docs: {
		...t.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    variant: "error",
    children: "Failed"
  }
}`,
			...t.parameters?.docs?.source,
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
    variant: "info",
    children: "New"
  }
}`,
			...c.parameters?.docs?.source,
		},
	},
};
o.parameters = {
	...o.parameters,
	docs: {
		...o.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    variant: "neutral",
    children: "Draft"
  }
}`,
			...o.parameters?.docs?.source,
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
    variant: "purple",
    children: "Twitch"
  }
}`,
			...l.parameters?.docs?.source,
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
    variant: "pink",
    children: "Featured"
  }
}`,
			...d.parameters?.docs?.source,
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
    size: "sm",
    variant: "success",
    children: "Small"
  }
}`,
			...u.parameters?.docs?.source,
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
    size: "md",
    variant: "success",
    children: "Medium"
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
  render: () => <div style={{
    display: "flex",
    gap: "8px",
    "flex-wrap": "wrap"
  }}>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="neutral">Neutral</Badge>
            <Badge variant="purple">Purple</Badge>
            <Badge variant="pink">Pink</Badge>
        </div>
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
  render: () => <div style={{
    display: "flex",
    gap: "8px"
  }}>
            <Badge variant="purple">Twitch</Badge>
            <Badge variant="error">YouTube</Badge>
            <Badge variant="success">Kick</Badge>
            <Badge variant="info">Facebook</Badge>
        </div>,
  name: "Platform Badges"
}`,
			...m.parameters?.docs?.source,
		},
	},
};
v.parameters = {
	...v.parameters,
	docs: {
		...v.parameters?.docs,
		source: {
			originalSource: `{
  render: () => <div style={{
    display: "flex",
    gap: "8px"
  }}>
            <Badge variant="success">Live</Badge>
            <Badge variant="neutral">Offline</Badge>
            <Badge variant="warning">Starting Soon</Badge>
            <Badge variant="error">Ended</Badge>
        </div>,
  name: "Status Badges"
}`,
			...v.parameters?.docs?.source,
		},
	},
};
B.parameters = {
	...B.parameters,
	docs: {
		...B.parameters?.docs,
		source: {
			originalSource: `{
  render: () => <Badge variant="success">
            <svg class="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            Verified
        </Badge>
}`,
			...B.parameters?.docs?.source,
		},
	},
};
const _ = [
	"Success",
	"Warning",
	"Error",
	"Info",
	"Neutral",
	"Purple",
	"Pink",
	"SmallSize",
	"MediumSize",
	"AllVariants",
	"PlatformBadges",
	"StatusBadges",
	"WithIcon",
];
export {
	g as AllVariants,
	t as Error,
	c as Info,
	p as MediumSize,
	o as Neutral,
	d as Pink,
	m as PlatformBadges,
	l as Purple,
	u as SmallSize,
	v as StatusBadges,
	s as Success,
	i as Warning,
	B as WithIcon,
	_ as __namedExportsOrder,
	z as default,
};
