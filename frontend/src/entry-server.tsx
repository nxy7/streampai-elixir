import { StartServer, createHandler } from "@solidjs/start/server";

export default createHandler(() => (
	<StartServer
		document={({ assets, children, scripts }) => (
			<html lang="en">
				<head>
					<meta charset="utf-8" />
					<meta content="width=device-width, initial-scale=1" name="viewport" />
					<link href="/favicon.svg" rel="icon" type="image/svg+xml" />
					<link
						href="/favicon.ico"
						rel="icon"
						sizes="16x16 32x32 48x48"
						type="image/x-icon"
					/>
					{assets}
				</head>
				<body>
					<div id="app">{children}</div>
					{scripts}
				</body>
			</html>
		)}
	/>
));
