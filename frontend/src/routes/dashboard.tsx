import type { RouteSectionProps } from "@solidjs/router";
import DashboardLayout from "~/components/DashboardLayout";

export default function DashboardLayoutRoute(props: RouteSectionProps) {
	return <DashboardLayout>{props.children}</DashboardLayout>;
}
