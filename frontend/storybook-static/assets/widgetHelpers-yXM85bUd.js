const a = {
	standard: { small: "text-xs", medium: "text-sm", large: "text-lg" },
	content: { small: "text-sm", medium: "text-base", large: "text-lg" },
	alertbox: { small: "text-lg", medium: "text-2xl", large: "text-4xl" },
	counter: { small: "text-xl", medium: "text-3xl", large: "text-5xl" },
};
function m(t, e = "standard") {
	const n = t || "medium";
	return a[e][n] || a[e].medium;
}
const s = {
	in: {
		slide: "animate-slide-in",
		fade: "animate-fade-in",
		bounce: "animate-bounce-in",
	},
	out: {
		slide: "animate-slide-out",
		fade: "animate-fade-out",
		bounce: "animate-bounce-out",
	},
};
function o(t, e = "in") {
	const n = t || "fade";
	return s[e][n];
}
const i = {
	top: "items-start pt-8",
	center: "items-center",
	bottom: "items-end pb-8",
};
function l(t) {
	return i[t] || i.center;
}
function r(t, e) {
	return t ? `${e || "$"}${t.toFixed(2)}` : "";
}
export { l as a, o as b, r as f, m as g };
