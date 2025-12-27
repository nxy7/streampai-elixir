import {
	b as Z,
	o as q,
	t as i,
	i as _,
	c as b,
	S as M,
	a as z,
	g as A,
	v as N,
	s as j,
	h as O,
	k as P,
} from "./iframe-BQDcX1su.js";
import "./preload-helper-PPVm8Dsz.js";
var V = i("<div style=width:100%;height:100%;position:relative>"),
	G =
		i(`<div style=width:100%;height:100%;position:relative;overflow:hidden><style>
        .slide-transition {
          animation: slideIn var(--transition-duration, 500ms) ease-in-out;
        }

        .slide-fade {
          animation: fadeIn var(--transition-duration, 500ms) ease-in-out;
        }

        .slide-slide {
          animation: slideInFromRight var(--transition-duration, 500ms) ease-in-out;
        }

        .slide-slide-up {
          animation: slideInFromBottom var(--transition-duration, 500ms) ease-in-out;
        }

        .slide-zoom {
          animation: zoomIn var(--transition-duration, 500ms) ease-in-out;
        }

        .slide-flip {
          animation: flipIn var(--transition-duration, 500ms) ease-in-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideInFromBottom {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes flipIn {
          from {
            transform: rotateY(90deg);
            opacity: 0;
          }
          to {
            transform: rotateY(0);
            opacity: 1;
          }
        }
      `),
	H = i(
		"<div style=color:white;text-align:center;padding:20px><p>No images available for slider</p><p style=font-size:0.8em;opacity:0.7>Upload images or wait for demo images to load",
	),
	J = i(
		"<div style=position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center><img style=border-radius:4px>",
	);
function k(a) {
	const [s, L] = Z(0),
		c = () => a.config.images || [],
		W = () => {
			const e = c();
			return e.length === 0 ? null : e[s() % e.length];
		},
		Y = () => Math.max(1e3, (a.config.slideDuration || 5) * 1e3),
		R = () => Math.max(200, Math.min(2e3, a.config.transitionDuration || 500)),
		U = () => {
			switch (a.config.fitMode || "contain") {
				case "cover":
					return { width: "100%", height: "100%", "object-fit": "cover" };
				case "fill":
					return { width: "100%", height: "100%", "object-fit": "fill" };
				default:
					return {
						"max-width": "100%",
						"max-height": "100%",
						"object-fit": "contain",
					};
			}
		},
		E = () => {
			const e = c();
			e.length <= 1 || L((T) => (T + 1) % e.length);
		};
	return (
		q(() => {
			if (c().length > 1) {
				const e = setInterval(E, Y());
				P(() => clearInterval(e));
			}
		}),
		(() => {
			var e = G(),
				T = e.firstChild;
			return (
				_(
					e,
					b(M, {
						get when() {
							return c().length > 0;
						},
						get fallback() {
							return (() => {
								var r = H(),
									o = r.firstChild;
								return o.nextSibling, r;
							})();
						},
						get children() {
							var r = V();
							return (
								_(
									r,
									b(M, {
										get when() {
											return W();
										},
										children: (o) =>
											(() => {
												var l = J(),
													x = l.firstChild;
												return (
													z(
														(n) => {
															var w = `slide-transition slide-${a.config.transitionType}`,
																D = `${R()}ms`,
																F = o().url,
																$ = o().alt || `Slide ${o().index + 1}`,
																X = { ...U() };
															return (
																w !== n.e && A(l, (n.e = w)),
																D !== n.t &&
																	N(l, "--transition-duration", (n.t = D)),
																F !== n.a && j(x, "src", (n.a = F)),
																$ !== n.o && j(x, "alt", (n.o = $)),
																(n.i = O(x, X, n.i)),
																n
															);
														},
														{
															e: void 0,
															t: void 0,
															a: void 0,
															o: void 0,
															i: void 0,
														},
													),
													l
												);
											})(),
									}),
								),
								r
							);
						},
					}),
					T,
				),
				z((r) =>
					N(e, "background-color", a.config.backgroundColor || "transparent"),
				),
				e
			);
		})()
	);
}
try {
	(k.displayName = "SliderWidget"),
		(k.__docgenInfo = {
			description: "",
			displayName: "SliderWidget",
			props: {
				config: {
					defaultValue: null,
					description: "",
					name: "config",
					required: !0,
					type: { name: "SliderConfig" },
				},
			},
		});
} catch {}
var K = i("<div style=width:600px;height:400px>");
const te = {
		title: "Widgets/Slider",
		component: k,
		parameters: { layout: "fullscreen", backgrounds: { default: "dark" } },
		tags: ["autodocs"],
		decorators: [
			(a) =>
				(() => {
					var s = K();
					return _(s, b(a, {})), s;
				})(),
		],
	},
	B = [
		{
			id: "1",
			url: "https://picsum.photos/seed/slide1/800/600",
			alt: "Slide 1",
			index: 0,
		},
		{
			id: "2",
			url: "https://picsum.photos/seed/slide2/800/600",
			alt: "Slide 2",
			index: 1,
		},
		{
			id: "3",
			url: "https://picsum.photos/seed/slide3/800/600",
			alt: "Slide 3",
			index: 2,
		},
	],
	t = {
		slideDuration: 5,
		transitionDuration: 500,
		transitionType: "fade",
		fitMode: "contain",
		backgroundColor: "#1a1a2e",
		images: B,
	},
	d = { args: { config: t } },
	g = { args: { config: { ...t, transitionType: "slide" } } },
	m = { args: { config: { ...t, transitionType: "slide-up" } } },
	u = { args: { config: { ...t, transitionType: "zoom" } } },
	f = { args: { config: { ...t, transitionType: "flip" } } },
	p = { args: { config: { ...t, fitMode: "cover" } } },
	h = { args: { config: { ...t, fitMode: "fill" } } },
	y = { args: { config: { ...t, slideDuration: 2, transitionDuration: 200 } } },
	v = {
		args: { config: { ...t, slideDuration: 8, transitionDuration: 1500 } },
	},
	S = { args: { config: { ...t, backgroundColor: "#f8fafc" } } },
	C = { args: { config: { ...t, images: [B[0]] } } },
	I = { args: { config: { ...t, images: [] } } };
d.parameters = {
	...d.parameters,
	docs: {
		...d.parameters?.docs,
		source: {
			originalSource: `{
  args: {
    config: defaultConfig
  }
}`,
			...d.parameters?.docs?.source,
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
      transitionType: "slide" as const
    }
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
      transitionType: "slide-up" as const
    }
  }
}`,
			...m.parameters?.docs?.source,
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
      transitionType: "zoom" as const
    }
  }
}`,
			...u.parameters?.docs?.source,
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
      transitionType: "flip" as const
    }
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
      fitMode: "cover" as const
    }
  }
}`,
			...p.parameters?.docs?.source,
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
      fitMode: "fill" as const
    }
  }
}`,
			...h.parameters?.docs?.source,
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
      slideDuration: 2,
      transitionDuration: 200
    }
  }
}`,
			...y.parameters?.docs?.source,
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
      slideDuration: 8,
      transitionDuration: 1500
    }
  }
}`,
			...v.parameters?.docs?.source,
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
      backgroundColor: "#f8fafc"
    }
  }
}`,
			...S.parameters?.docs?.source,
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
      images: [sampleImages[0]]
    }
  }
}`,
			...C.parameters?.docs?.source,
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
    config: {
      ...defaultConfig,
      images: []
    }
  }
}`,
			...I.parameters?.docs?.source,
		},
	},
};
const ne = [
	"Default",
	"SlideTransition",
	"SlideUpTransition",
	"ZoomTransition",
	"FlipTransition",
	"CoverFit",
	"FillFit",
	"FastTransition",
	"SlowTransition",
	"LightBackground",
	"SingleImage",
	"NoImages",
];
export {
	p as CoverFit,
	d as Default,
	y as FastTransition,
	h as FillFit,
	f as FlipTransition,
	S as LightBackground,
	I as NoImages,
	C as SingleImage,
	g as SlideTransition,
	m as SlideUpTransition,
	v as SlowTransition,
	u as ZoomTransition,
	ne as __namedExportsOrder,
	te as default,
};
