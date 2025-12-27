function a(t) {
	const o = new Date(t),
		n = new Date().getTime() - o.getTime(),
		e = Math.floor(n / 6e4),
		r = Math.floor(n / 36e5),
		f = Math.floor(n / 864e5);
	return e < 1
		? "just now"
		: e < 60
			? `${e}m ago`
			: r < 24
				? `${r}h ago`
				: f < 7
					? `${f}d ago`
					: o.toLocaleDateString();
}
function s(t) {
	return (t instanceof Date ? t : new Date(t)).toLocaleTimeString("en-US", {
		hour12: !1,
		hour: "2-digit",
		minute: "2-digit",
	});
}
function c(t, o) {
	return t ? `${o || "$"}${t.toFixed(2)}` : "";
}
export { s as a, a as b, c as f };
