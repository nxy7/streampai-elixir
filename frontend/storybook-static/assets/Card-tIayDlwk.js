import { l as n, t as m, n as s, p as d, i as l } from "./iframe-BQDcX1su.js";
import { d as o } from "./design-system-CwcdUVvG.js";
var i = m("<div>"),
	g = m("<h3>");
const v = {
		default: "bg-white border border-gray-200 shadow-sm",
		interactive:
			"bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer",
		gradient: "bg-linear-to-r from-purple-600 to-pink-600 shadow-sm text-white",
		outline: "bg-transparent border border-gray-200",
	},
	f = { none: "", sm: "p-3", md: "p-6", lg: "p-8" };
function c(a) {
	const [r, t] = n(a, ["variant", "padding", "children", "class"]);
	return (() => {
		var e = i();
		return (
			s(
				e,
				d(
					{
						get class() {
							return o(
								"rounded-2xl",
								v[r.variant ?? "default"],
								f[r.padding ?? "md"],
								r.class,
							);
						},
					},
					t,
				),
				!1,
				!0,
			),
			l(e, () => r.children),
			e
		);
	})();
}
function p(a) {
	const [r, t] = n(a, ["children", "class"]);
	return (() => {
		var e = i();
		return (
			s(
				e,
				d(
					{
						get class() {
							return o("border-gray-200 border-b px-6 py-4", r.class);
						},
					},
					t,
				),
				!1,
				!0,
			),
			l(e, () => r.children),
			e
		);
	})();
}
function u(a) {
	const [r, t] = n(a, ["children", "class"]);
	return (() => {
		var e = g();
		return (
			s(
				e,
				d(
					{
						get class() {
							return o("font-medium text-gray-900 text-lg", r.class);
						},
					},
					t,
				),
				!1,
				!0,
			),
			l(e, () => r.children),
			e
		);
	})();
}
function _(a) {
	const [r, t] = n(a, ["children", "class"]);
	return (() => {
		var e = i();
		return (
			s(
				e,
				d(
					{
						get class() {
							return o("p-6", r.class);
						},
					},
					t,
				),
				!1,
				!0,
			),
			l(e, () => r.children),
			e
		);
	})();
}
try {
	(c.displayName = "Card"),
		(c.__docgenInfo = {
			description: "",
			displayName: "Card",
			props: {
				variant: {
					defaultValue: null,
					description: "",
					name: "variant",
					required: !1,
					type: {
						name: "enum",
						value: [
							{ value: "undefined" },
							{ value: '"default"' },
							{ value: '"interactive"' },
							{ value: '"gradient"' },
							{ value: '"outline"' },
						],
					},
				},
				padding: {
					defaultValue: null,
					description: "",
					name: "padding",
					required: !1,
					type: {
						name: "enum",
						value: [
							{ value: "undefined" },
							{ value: '"sm"' },
							{ value: '"md"' },
							{ value: '"lg"' },
							{ value: '"none"' },
						],
					},
				},
			},
		});
} catch {}
try {
	(p.displayName = "CardHeader"),
		(p.__docgenInfo = {
			description: "",
			displayName: "CardHeader",
			props: {},
		});
} catch {}
try {
	(u.displayName = "CardTitle"),
		(u.__docgenInfo = { description: "", displayName: "CardTitle", props: {} });
} catch {}
try {
	(_.displayName = "CardContent"),
		(_.__docgenInfo = {
			description: "",
			displayName: "CardContent",
			props: {},
		});
} catch {}
export { c as C, p as a, u as b, _ as c };
