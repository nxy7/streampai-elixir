import {
	l as p,
	t as u,
	i as l,
	c as a,
	s as o,
	S as s,
	n as g,
	p as f,
	m,
} from "./iframe-BQDcX1su.js";
import { d as h } from "./design-system-CwcdUVvG.js";
var _ = u('<label class="mb-1 block font-medium text-gray-700 text-sm">'),
	b = u('<p class="mt-1 text-red-600 text-sm">'),
	x = u('<p class="mt-1 text-gray-500 text-xs">'),
	v = u("<div class=w-full><input>"),
	I = u("<div class=w-full><textarea>"),
	q = u("<div class=w-full><select>");
const y =
	"w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:border-transparent transition-colors";
function $(d) {
	const [e, c] = p(d, ["label", "error", "helperText", "class", "id"]),
		i = e.id ?? `input-${Math.random().toString(36).slice(2)}`;
	return (() => {
		var t = v(),
			n = t.firstChild;
		return (
			l(
				t,
				a(s, {
					get when() {
						return e.label;
					},
					get children() {
						var r = _();
						return o(r, "for", i), l(r, () => e.label), r;
					},
				}),
				n,
			),
			o(n, "id", i),
			g(
				n,
				f(
					{
						get class() {
							return h(
								y,
								e.error
									? "border-red-300 focus:ring-red-500"
									: "border-gray-300 focus:ring-purple-500",
								"disabled:cursor-not-allowed disabled:bg-gray-50",
								e.class,
							);
						},
					},
					c,
				),
				!1,
				!1,
			),
			l(
				t,
				a(s, {
					get when() {
						return e.error;
					},
					get children() {
						var r = b();
						return l(r, () => e.error), r;
					},
				}),
				null,
			),
			l(
				t,
				a(s, {
					get when() {
						return m(() => !!e.helperText)() && !e.error;
					},
					get children() {
						var r = x();
						return l(r, () => e.helperText), r;
					},
				}),
				null,
			),
			t
		);
	})();
}
function T(d) {
	const [e, c] = p(d, ["label", "error", "helperText", "class", "id"]),
		i = e.id ?? `textarea-${Math.random().toString(36).slice(2)}`;
	return (() => {
		var t = I(),
			n = t.firstChild;
		return (
			l(
				t,
				a(s, {
					get when() {
						return e.label;
					},
					get children() {
						var r = _();
						return o(r, "for", i), l(r, () => e.label), r;
					},
				}),
				n,
			),
			o(n, "id", i),
			g(
				n,
				f(
					{
						get class() {
							return h(
								y,
								"resize-none",
								e.error
									? "border-red-300 focus:ring-red-500"
									: "border-gray-300 focus:ring-purple-500",
								"disabled:cursor-not-allowed disabled:bg-gray-50",
								e.class,
							);
						},
					},
					c,
				),
				!1,
				!1,
			),
			l(
				t,
				a(s, {
					get when() {
						return e.error;
					},
					get children() {
						var r = b();
						return l(r, () => e.error), r;
					},
				}),
				null,
			),
			l(
				t,
				a(s, {
					get when() {
						return m(() => !!e.helperText)() && !e.error;
					},
					get children() {
						var r = x();
						return l(r, () => e.helperText), r;
					},
				}),
				null,
			),
			t
		);
	})();
}
function w(d) {
	const [e, c] = p(d, [
			"label",
			"error",
			"helperText",
			"class",
			"id",
			"children",
		]),
		i = e.id ?? `select-${Math.random().toString(36).slice(2)}`;
	return (() => {
		var t = q(),
			n = t.firstChild;
		return (
			l(
				t,
				a(s, {
					get when() {
						return e.label;
					},
					get children() {
						var r = _();
						return o(r, "for", i), l(r, () => e.label), r;
					},
				}),
				n,
			),
			o(n, "id", i),
			g(
				n,
				f(
					{
						get class() {
							return h(
								y,
								"bg-white",
								e.error
									? "border-red-300 focus:ring-red-500"
									: "border-gray-300 focus:ring-purple-500",
								"disabled:cursor-not-allowed disabled:bg-gray-50",
								e.class,
							);
						},
					},
					c,
				),
				!1,
				!0,
			),
			l(n, () => e.children),
			l(
				t,
				a(s, {
					get when() {
						return e.error;
					},
					get children() {
						var r = b();
						return l(r, () => e.error), r;
					},
				}),
				null,
			),
			l(
				t,
				a(s, {
					get when() {
						return m(() => !!e.helperText)() && !e.error;
					},
					get children() {
						var r = x();
						return l(r, () => e.helperText), r;
					},
				}),
				null,
			),
			t
		);
	})();
}
try {
	($.displayName = "Input"),
		($.__docgenInfo = {
			description: "",
			displayName: "Input",
			props: {
				label: {
					defaultValue: null,
					description: "",
					name: "label",
					required: !1,
					type: { name: "string | undefined" },
				},
				error: {
					defaultValue: null,
					description: "",
					name: "error",
					required: !1,
					type: { name: "string | undefined" },
				},
				helperText: {
					defaultValue: null,
					description: "",
					name: "helperText",
					required: !1,
					type: { name: "string | undefined" },
				},
			},
		});
} catch {}
try {
	(T.displayName = "Textarea"),
		(T.__docgenInfo = {
			description: "",
			displayName: "Textarea",
			props: {
				label: {
					defaultValue: null,
					description: "",
					name: "label",
					required: !1,
					type: { name: "string | undefined" },
				},
				error: {
					defaultValue: null,
					description: "",
					name: "error",
					required: !1,
					type: { name: "string | undefined" },
				},
				helperText: {
					defaultValue: null,
					description: "",
					name: "helperText",
					required: !1,
					type: { name: "string | undefined" },
				},
			},
		});
} catch {}
try {
	(w.displayName = "Select"),
		(w.__docgenInfo = {
			description: "",
			displayName: "Select",
			props: {
				label: {
					defaultValue: null,
					description: "",
					name: "label",
					required: !1,
					type: { name: "string | undefined" },
				},
				error: {
					defaultValue: null,
					description: "",
					name: "error",
					required: !1,
					type: { name: "string | undefined" },
				},
				helperText: {
					defaultValue: null,
					description: "",
					name: "helperText",
					required: !1,
					type: { name: "string | undefined" },
				},
			},
		});
} catch {}
export { $ as I, w as S, T };
