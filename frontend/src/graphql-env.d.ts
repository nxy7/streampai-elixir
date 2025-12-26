/* eslint-disable */
/* prettier-ignore */

export type introspection_types = {
	AcceptRoleInvitationResult: {
		kind: "OBJECT";
		name: "AcceptRoleInvitationResult";
		fields: {
			errors: {
				name: "errors";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: { kind: "OBJECT"; name: "MutationError"; ofType: null };
						};
					};
				};
			};
			result: {
				name: "result";
				type: { kind: "OBJECT"; name: "UserRole"; ofType: null };
			};
		};
	};
	BannedViewer: {
		kind: "OBJECT";
		name: "BannedViewer";
		fields: {
			durationSeconds: {
				name: "durationSeconds";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
			};
			expiresAt: {
				name: "expiresAt";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
			};
			id: {
				name: "id";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
			};
			insertedAt: {
				name: "insertedAt";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				};
			};
			isActive: {
				name: "isActive";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				};
			};
			platform: {
				name: "platform";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
			};
			platformBanId: {
				name: "platformBanId";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			reason: {
				name: "reason";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			unbannedAt: {
				name: "unbannedAt";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
			};
			updatedAt: {
				name: "updatedAt";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				};
			};
			viewerPlatformId: {
				name: "viewerPlatformId";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
			};
			viewerUsername: {
				name: "viewerUsername";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
			};
		};
	};
	BannedViewerFilterDurationSeconds: {
		kind: "INPUT_OBJECT";
		name: "BannedViewerFilterDurationSeconds";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "Int"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
				defaultValue: null;
			},
		];
	};
	BannedViewerFilterExpiresAt: {
		kind: "INPUT_OBJECT";
		name: "BannedViewerFilterExpiresAt";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
		];
	};
	BannedViewerFilterId: {
		kind: "INPUT_OBJECT";
		name: "BannedViewerFilterId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
		];
	};
	BannedViewerFilterInput: {
		kind: "INPUT_OBJECT";
		name: "BannedViewerFilterInput";
		isOneOf: false;
		inputFields: [
			{
				name: "and";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "BannedViewerFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "or";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "BannedViewerFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "not";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "BannedViewerFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "id";
				type: {
					kind: "INPUT_OBJECT";
					name: "BannedViewerFilterId";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "platform";
				type: {
					kind: "INPUT_OBJECT";
					name: "BannedViewerFilterPlatform";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "viewerUsername";
				type: {
					kind: "INPUT_OBJECT";
					name: "BannedViewerFilterViewerUsername";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "viewerPlatformId";
				type: {
					kind: "INPUT_OBJECT";
					name: "BannedViewerFilterViewerPlatformId";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "reason";
				type: {
					kind: "INPUT_OBJECT";
					name: "BannedViewerFilterReason";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "durationSeconds";
				type: {
					kind: "INPUT_OBJECT";
					name: "BannedViewerFilterDurationSeconds";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "expiresAt";
				type: {
					kind: "INPUT_OBJECT";
					name: "BannedViewerFilterExpiresAt";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "isActive";
				type: {
					kind: "INPUT_OBJECT";
					name: "BannedViewerFilterIsActive";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "platformBanId";
				type: {
					kind: "INPUT_OBJECT";
					name: "BannedViewerFilterPlatformBanId";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "unbannedAt";
				type: {
					kind: "INPUT_OBJECT";
					name: "BannedViewerFilterUnbannedAt";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "insertedAt";
				type: {
					kind: "INPUT_OBJECT";
					name: "BannedViewerFilterInsertedAt";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "updatedAt";
				type: {
					kind: "INPUT_OBJECT";
					name: "BannedViewerFilterUpdatedAt";
					ofType: null;
				};
				defaultValue: null;
			},
		];
	};
	BannedViewerFilterInsertedAt: {
		kind: "INPUT_OBJECT";
		name: "BannedViewerFilterInsertedAt";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "DateTime"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
		];
	};
	BannedViewerFilterIsActive: {
		kind: "INPUT_OBJECT";
		name: "BannedViewerFilterIsActive";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
		];
	};
	BannedViewerFilterPlatform: {
		kind: "INPUT_OBJECT";
		name: "BannedViewerFilterPlatform";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "String"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	BannedViewerFilterPlatformBanId: {
		kind: "INPUT_OBJECT";
		name: "BannedViewerFilterPlatformBanId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "like";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "ilike";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	BannedViewerFilterReason: {
		kind: "INPUT_OBJECT";
		name: "BannedViewerFilterReason";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "like";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "ilike";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	BannedViewerFilterUnbannedAt: {
		kind: "INPUT_OBJECT";
		name: "BannedViewerFilterUnbannedAt";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
		];
	};
	BannedViewerFilterUpdatedAt: {
		kind: "INPUT_OBJECT";
		name: "BannedViewerFilterUpdatedAt";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "DateTime"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
		];
	};
	BannedViewerFilterViewerPlatformId: {
		kind: "INPUT_OBJECT";
		name: "BannedViewerFilterViewerPlatformId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "String"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "like";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "ilike";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	BannedViewerFilterViewerUsername: {
		kind: "INPUT_OBJECT";
		name: "BannedViewerFilterViewerUsername";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "String"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "like";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "ilike";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	BannedViewerSortField: {
		name: "BannedViewerSortField";
		enumValues:
			| "ID"
			| "PLATFORM"
			| "VIEWER_USERNAME"
			| "VIEWER_PLATFORM_ID"
			| "REASON"
			| "DURATION_SECONDS"
			| "EXPIRES_AT"
			| "IS_ACTIVE"
			| "PLATFORM_BAN_ID"
			| "UNBANNED_AT"
			| "INSERTED_AT"
			| "UPDATED_AT";
	};
	BannedViewerSortInput: {
		kind: "INPUT_OBJECT";
		name: "BannedViewerSortInput";
		isOneOf: false;
		inputFields: [
			{
				name: "order";
				type: { kind: "ENUM"; name: "SortOrder"; ofType: null };
				defaultValue: null;
			},
			{
				name: "field";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "ENUM"; name: "BannedViewerSortField"; ofType: null };
				};
				defaultValue: null;
			},
		];
	};
	Boolean: unknown;
	ChatMessage: {
		kind: "OBJECT";
		name: "ChatMessage";
		fields: {
			id: {
				name: "id";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
			};
			insertedAt: {
				name: "insertedAt";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				};
			};
			livestream: {
				name: "livestream";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "OBJECT"; name: "Livestream"; ofType: null };
				};
			};
			livestreamId: {
				name: "livestreamId";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
			};
			message: {
				name: "message";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
			};
			platform: {
				name: "platform";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
			};
			senderChannelId: {
				name: "senderChannelId";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
			};
			senderIsModerator: {
				name: "senderIsModerator";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
			};
			senderIsPatreon: {
				name: "senderIsPatreon";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
			};
			senderUsername: {
				name: "senderUsername";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
			};
			user: {
				name: "user";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "OBJECT"; name: "User"; ofType: null };
				};
			};
			userId: {
				name: "userId";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
			};
			viewerId: {
				name: "viewerId";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
		};
	};
	ChatMessageEvent: {
		kind: "OBJECT";
		name: "ChatMessageEvent";
		fields: {
			id: { name: "id"; type: { kind: "SCALAR"; name: "ID"; ofType: null } };
			isModerator: {
				name: "isModerator";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
			};
			isSubscriber: {
				name: "isSubscriber";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
			};
			message: {
				name: "message";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			platform: {
				name: "platform";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			timestamp: {
				name: "timestamp";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
			};
			username: {
				name: "username";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
		};
	};
	ChatMessageFilterId: {
		kind: "INPUT_OBJECT";
		name: "ChatMessageFilterId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "String"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "like";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "ilike";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	ChatMessageFilterInput: {
		kind: "INPUT_OBJECT";
		name: "ChatMessageFilterInput";
		isOneOf: false;
		inputFields: [
			{
				name: "and";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "ChatMessageFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "or";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "ChatMessageFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "not";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "ChatMessageFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "id";
				type: {
					kind: "INPUT_OBJECT";
					name: "ChatMessageFilterId";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "message";
				type: {
					kind: "INPUT_OBJECT";
					name: "ChatMessageFilterMessage";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "platform";
				type: {
					kind: "INPUT_OBJECT";
					name: "ChatMessageFilterPlatform";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "senderUsername";
				type: {
					kind: "INPUT_OBJECT";
					name: "ChatMessageFilterSenderUsername";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "senderChannelId";
				type: {
					kind: "INPUT_OBJECT";
					name: "ChatMessageFilterSenderChannelId";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "senderIsModerator";
				type: {
					kind: "INPUT_OBJECT";
					name: "ChatMessageFilterSenderIsModerator";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "senderIsPatreon";
				type: {
					kind: "INPUT_OBJECT";
					name: "ChatMessageFilterSenderIsPatreon";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "insertedAt";
				type: {
					kind: "INPUT_OBJECT";
					name: "ChatMessageFilterInsertedAt";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "viewerId";
				type: {
					kind: "INPUT_OBJECT";
					name: "ChatMessageFilterViewerId";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "userId";
				type: {
					kind: "INPUT_OBJECT";
					name: "ChatMessageFilterUserId";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "livestreamId";
				type: {
					kind: "INPUT_OBJECT";
					name: "ChatMessageFilterLivestreamId";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "user";
				type: { kind: "INPUT_OBJECT"; name: "UserFilterInput"; ofType: null };
				defaultValue: null;
			},
			{
				name: "livestream";
				type: {
					kind: "INPUT_OBJECT";
					name: "LivestreamFilterInput";
					ofType: null;
				};
				defaultValue: null;
			},
		];
	};
	ChatMessageFilterInsertedAt: {
		kind: "INPUT_OBJECT";
		name: "ChatMessageFilterInsertedAt";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "DateTime"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
		];
	};
	ChatMessageFilterLivestreamId: {
		kind: "INPUT_OBJECT";
		name: "ChatMessageFilterLivestreamId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
		];
	};
	ChatMessageFilterMessage: {
		kind: "INPUT_OBJECT";
		name: "ChatMessageFilterMessage";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "String"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "like";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "ilike";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	ChatMessageFilterPlatform: {
		kind: "INPUT_OBJECT";
		name: "ChatMessageFilterPlatform";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "String"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	ChatMessageFilterSenderChannelId: {
		kind: "INPUT_OBJECT";
		name: "ChatMessageFilterSenderChannelId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "String"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "like";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "ilike";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	ChatMessageFilterSenderIsModerator: {
		kind: "INPUT_OBJECT";
		name: "ChatMessageFilterSenderIsModerator";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
		];
	};
	ChatMessageFilterSenderIsPatreon: {
		kind: "INPUT_OBJECT";
		name: "ChatMessageFilterSenderIsPatreon";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
		];
	};
	ChatMessageFilterSenderUsername: {
		kind: "INPUT_OBJECT";
		name: "ChatMessageFilterSenderUsername";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "String"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "like";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "ilike";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	ChatMessageFilterUserId: {
		kind: "INPUT_OBJECT";
		name: "ChatMessageFilterUserId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
		];
	};
	ChatMessageFilterViewerId: {
		kind: "INPUT_OBJECT";
		name: "ChatMessageFilterViewerId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "like";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "ilike";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	ChatMessageSortField: {
		name: "ChatMessageSortField";
		enumValues:
			| "ID"
			| "MESSAGE"
			| "PLATFORM"
			| "SENDER_USERNAME"
			| "SENDER_CHANNEL_ID"
			| "SENDER_IS_MODERATOR"
			| "SENDER_IS_PATREON"
			| "INSERTED_AT"
			| "VIEWER_ID"
			| "USER_ID"
			| "LIVESTREAM_ID";
	};
	ChatMessageSortInput: {
		kind: "INPUT_OBJECT";
		name: "ChatMessageSortInput";
		isOneOf: false;
		inputFields: [
			{
				name: "order";
				type: { kind: "ENUM"; name: "SortOrder"; ofType: null };
				defaultValue: null;
			},
			{
				name: "field";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "ENUM"; name: "ChatMessageSortField"; ofType: null };
				};
				defaultValue: null;
			},
		];
	};
	CheerEvent: {
		kind: "OBJECT";
		name: "CheerEvent";
		fields: {
			bits: {
				name: "bits";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
			};
			id: { name: "id"; type: { kind: "SCALAR"; name: "ID"; ofType: null } };
			message: {
				name: "message";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			platform: {
				name: "platform";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			timestamp: {
				name: "timestamp";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
			};
			username: {
				name: "username";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
		};
	};
	ConfirmUploadResponse: {
		kind: "OBJECT";
		name: "ConfirmUploadResponse";
		fields: {
			id: {
				name: "id";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
			};
			url: {
				name: "url";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
			};
		};
	};
	CreateNotificationInput: {
		kind: "INPUT_OBJECT";
		name: "CreateNotificationInput";
		isOneOf: false;
		inputFields: [
			{
				name: "userId";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "content";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
				defaultValue: null;
			},
		];
	};
	CreateNotificationResult: {
		kind: "OBJECT";
		name: "CreateNotificationResult";
		fields: {
			errors: {
				name: "errors";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: { kind: "OBJECT"; name: "MutationError"; ofType: null };
						};
					};
				};
			};
			result: {
				name: "result";
				type: { kind: "OBJECT"; name: "Notification"; ofType: null };
			};
		};
	};
	DateTime: unknown;
	DeclineRoleInvitationResult: {
		kind: "OBJECT";
		name: "DeclineRoleInvitationResult";
		fields: {
			errors: {
				name: "errors";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: { kind: "OBJECT"; name: "MutationError"; ofType: null };
						};
					};
				};
			};
			result: {
				name: "result";
				type: { kind: "OBJECT"; name: "UserRole"; ofType: null };
			};
		};
	};
	DeleteNotificationResult: {
		kind: "OBJECT";
		name: "DeleteNotificationResult";
		fields: {
			errors: {
				name: "errors";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: { kind: "OBJECT"; name: "MutationError"; ofType: null };
						};
					};
				};
			};
			result: {
				name: "result";
				type: { kind: "OBJECT"; name: "Notification"; ofType: null };
			};
		};
	};
	DisconnectStreamingAccountResult: {
		kind: "OBJECT";
		name: "DisconnectStreamingAccountResult";
		fields: {
			errors: {
				name: "errors";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: { kind: "OBJECT"; name: "MutationError"; ofType: null };
						};
					};
				};
			};
			result: {
				name: "result";
				type: { kind: "OBJECT"; name: "StreamingAccount"; ofType: null };
			};
		};
	};
	DonationEvent: {
		kind: "OBJECT";
		name: "DonationEvent";
		fields: {
			amount: {
				name: "amount";
				type: { kind: "SCALAR"; name: "Float"; ofType: null };
			};
			currency: {
				name: "currency";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			id: { name: "id"; type: { kind: "SCALAR"; name: "ID"; ofType: null } };
			message: {
				name: "message";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			platform: {
				name: "platform";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			timestamp: {
				name: "timestamp";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
			};
			username: {
				name: "username";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
		};
	};
	FileUploadResponse: {
		kind: "OBJECT";
		name: "FileUploadResponse";
		fields: {
			id: {
				name: "id";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
			};
			maxSize: {
				name: "maxSize";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "Int"; ofType: null };
				};
			};
			uploadHeaders: {
				name: "uploadHeaders";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "OBJECT";
							name: "UploadHeaderOutput";
							ofType: null;
						};
					};
				};
			};
			uploadUrl: {
				name: "uploadUrl";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
			};
		};
	};
	Float: unknown;
	FollowerEvent: {
		kind: "OBJECT";
		name: "FollowerEvent";
		fields: {
			id: { name: "id"; type: { kind: "SCALAR"; name: "ID"; ofType: null } };
			platform: {
				name: "platform";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			timestamp: {
				name: "timestamp";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
			};
			username: {
				name: "username";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
		};
	};
	GoalProgressEvent: {
		kind: "OBJECT";
		name: "GoalProgressEvent";
		fields: {
			currentAmount: {
				name: "currentAmount";
				type: { kind: "SCALAR"; name: "Float"; ofType: null };
			};
			goalId: {
				name: "goalId";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
			};
			percentage: {
				name: "percentage";
				type: { kind: "SCALAR"; name: "Float"; ofType: null };
			};
			targetAmount: {
				name: "targetAmount";
				type: { kind: "SCALAR"; name: "Float"; ofType: null };
			};
			timestamp: {
				name: "timestamp";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
			};
		};
	};
	GrantProAccessInput: {
		kind: "INPUT_OBJECT";
		name: "GrantProAccessInput";
		isOneOf: false;
		inputFields: [
			{
				name: "durationDays";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "Int"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "reason";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
				defaultValue: null;
			},
		];
	};
	GrantProAccessResult: {
		kind: "OBJECT";
		name: "GrantProAccessResult";
		fields: {
			errors: {
				name: "errors";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: { kind: "OBJECT"; name: "MutationError"; ofType: null };
						};
					};
				};
			};
			result: {
				name: "result";
				type: { kind: "OBJECT"; name: "User"; ofType: null };
			};
		};
	};
	ID: unknown;
	Int: unknown;
	InviteUserRoleInput: {
		kind: "INPUT_OBJECT";
		name: "InviteUserRoleInput";
		isOneOf: false;
		inputFields: [
			{
				name: "userId";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "granterId";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "roleType";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
				defaultValue: null;
			},
		];
	};
	InviteUserRoleResult: {
		kind: "OBJECT";
		name: "InviteUserRoleResult";
		fields: {
			errors: {
				name: "errors";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: { kind: "OBJECT"; name: "MutationError"; ofType: null };
						};
					};
				};
			};
			result: {
				name: "result";
				type: { kind: "OBJECT"; name: "UserRole"; ofType: null };
			};
		};
	};
	Json: unknown;
	JsonString: unknown;
	KeysetPageOfChatMessage: {
		kind: "OBJECT";
		name: "KeysetPageOfChatMessage";
		fields: {
			count: {
				name: "count";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
			};
			endKeyset: {
				name: "endKeyset";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			results: {
				name: "results";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "OBJECT"; name: "ChatMessage"; ofType: null };
					};
				};
			};
			startKeyset: {
				name: "startKeyset";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
		};
	};
	KeysetPageOfStreamViewer: {
		kind: "OBJECT";
		name: "KeysetPageOfStreamViewer";
		fields: {
			count: {
				name: "count";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
			};
			endKeyset: {
				name: "endKeyset";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			results: {
				name: "results";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "OBJECT"; name: "StreamViewer"; ofType: null };
					};
				};
			};
			startKeyset: {
				name: "startKeyset";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
		};
	};
	KeysetPageOfUser: {
		kind: "OBJECT";
		name: "KeysetPageOfUser";
		fields: {
			count: {
				name: "count";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
			};
			endKeyset: {
				name: "endKeyset";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			results: {
				name: "results";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "OBJECT"; name: "User"; ofType: null };
					};
				};
			};
			startKeyset: {
				name: "startKeyset";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
		};
	};
	Livestream: {
		kind: "OBJECT";
		name: "Livestream";
		fields: {
			averageViewers: {
				name: "averageViewers";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
			};
			category: {
				name: "category";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			chatMessages: {
				name: "chatMessages";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: { kind: "OBJECT"; name: "ChatMessage"; ofType: null };
						};
					};
				};
			};
			description: {
				name: "description";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			durationSeconds: {
				name: "durationSeconds";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
			};
			endedAt: {
				name: "endedAt";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
			};
			id: {
				name: "id";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
			};
			language: {
				name: "language";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			legacyThumbnailUrl: {
				name: "legacyThumbnailUrl";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			messagesAmount: {
				name: "messagesAmount";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
			};
			peakViewers: {
				name: "peakViewers";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
			};
			platforms: {
				name: "platforms";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "String"; ofType: null };
					};
				};
			};
			startedAt: {
				name: "startedAt";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				};
			};
			streamEvents: {
				name: "streamEvents";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: { kind: "OBJECT"; name: "StreamEvent"; ofType: null };
						};
					};
				};
			};
			subcategory: {
				name: "subcategory";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			tags: {
				name: "tags";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "String"; ofType: null };
					};
				};
			};
			thumbnailFileId: {
				name: "thumbnailFileId";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
			};
			thumbnailUrl: {
				name: "thumbnailUrl";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			title: {
				name: "title";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
			};
			userId: {
				name: "userId";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
			};
		};
	};
	LivestreamFilterCategory: {
		kind: "INPUT_OBJECT";
		name: "LivestreamFilterCategory";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	LivestreamFilterDescription: {
		kind: "INPUT_OBJECT";
		name: "LivestreamFilterDescription";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "like";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "ilike";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	LivestreamFilterEndedAt: {
		kind: "INPUT_OBJECT";
		name: "LivestreamFilterEndedAt";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
		];
	};
	LivestreamFilterId: {
		kind: "INPUT_OBJECT";
		name: "LivestreamFilterId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
		];
	};
	LivestreamFilterInput: {
		kind: "INPUT_OBJECT";
		name: "LivestreamFilterInput";
		isOneOf: false;
		inputFields: [
			{
				name: "and";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "LivestreamFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "or";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "LivestreamFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "not";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "LivestreamFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "id";
				type: {
					kind: "INPUT_OBJECT";
					name: "LivestreamFilterId";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "title";
				type: {
					kind: "INPUT_OBJECT";
					name: "LivestreamFilterTitle";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "description";
				type: {
					kind: "INPUT_OBJECT";
					name: "LivestreamFilterDescription";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "category";
				type: {
					kind: "INPUT_OBJECT";
					name: "LivestreamFilterCategory";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "subcategory";
				type: {
					kind: "INPUT_OBJECT";
					name: "LivestreamFilterSubcategory";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "language";
				type: {
					kind: "INPUT_OBJECT";
					name: "LivestreamFilterLanguage";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "legacyThumbnailUrl";
				type: {
					kind: "INPUT_OBJECT";
					name: "LivestreamFilterLegacyThumbnailUrl";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "thumbnailFileId";
				type: {
					kind: "INPUT_OBJECT";
					name: "LivestreamFilterThumbnailFileId";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "startedAt";
				type: {
					kind: "INPUT_OBJECT";
					name: "LivestreamFilterStartedAt";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "endedAt";
				type: {
					kind: "INPUT_OBJECT";
					name: "LivestreamFilterEndedAt";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "userId";
				type: {
					kind: "INPUT_OBJECT";
					name: "LivestreamFilterUserId";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "chatMessages";
				type: {
					kind: "INPUT_OBJECT";
					name: "ChatMessageFilterInput";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "streamEvents";
				type: {
					kind: "INPUT_OBJECT";
					name: "StreamEventFilterInput";
					ofType: null;
				};
				defaultValue: null;
			},
		];
	};
	LivestreamFilterLanguage: {
		kind: "INPUT_OBJECT";
		name: "LivestreamFilterLanguage";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "like";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "ilike";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	LivestreamFilterLegacyThumbnailUrl: {
		kind: "INPUT_OBJECT";
		name: "LivestreamFilterLegacyThumbnailUrl";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "like";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "ilike";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	LivestreamFilterStartedAt: {
		kind: "INPUT_OBJECT";
		name: "LivestreamFilterStartedAt";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "DateTime"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
		];
	};
	LivestreamFilterSubcategory: {
		kind: "INPUT_OBJECT";
		name: "LivestreamFilterSubcategory";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	LivestreamFilterThumbnailFileId: {
		kind: "INPUT_OBJECT";
		name: "LivestreamFilterThumbnailFileId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
		];
	};
	LivestreamFilterTitle: {
		kind: "INPUT_OBJECT";
		name: "LivestreamFilterTitle";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "String"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "like";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "ilike";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	LivestreamFilterUserId: {
		kind: "INPUT_OBJECT";
		name: "LivestreamFilterUserId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
		];
	};
	LivestreamSortField: {
		name: "LivestreamSortField";
		enumValues:
			| "ID"
			| "TITLE"
			| "DESCRIPTION"
			| "CATEGORY"
			| "SUBCATEGORY"
			| "LANGUAGE"
			| "LEGACY_THUMBNAIL_URL"
			| "THUMBNAIL_FILE_ID"
			| "STARTED_AT"
			| "ENDED_AT"
			| "USER_ID";
	};
	LivestreamSortInput: {
		kind: "INPUT_OBJECT";
		name: "LivestreamSortInput";
		isOneOf: false;
		inputFields: [
			{
				name: "order";
				type: { kind: "ENUM"; name: "SortOrder"; ofType: null };
				defaultValue: null;
			},
			{
				name: "field";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "ENUM"; name: "LivestreamSortField"; ofType: null };
				};
				defaultValue: null;
			},
		];
	};
	MarkNotificationReadInput: {
		kind: "INPUT_OBJECT";
		name: "MarkNotificationReadInput";
		isOneOf: false;
		inputFields: [
			{
				name: "notificationId";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
				defaultValue: null;
			},
		];
	};
	MarkNotificationReadResult: {
		kind: "OBJECT";
		name: "MarkNotificationReadResult";
		fields: {
			errors: {
				name: "errors";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: { kind: "OBJECT"; name: "MutationError"; ofType: null };
						};
					};
				};
			};
			result: {
				name: "result";
				type: { kind: "OBJECT"; name: "NotificationRead"; ofType: null };
			};
		};
	};
	MarkNotificationUnreadInput: {
		kind: "INPUT_OBJECT";
		name: "MarkNotificationUnreadInput";
		isOneOf: false;
		inputFields: [
			{
				name: "notificationId";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
				defaultValue: null;
			},
		];
	};
	MutationError: {
		kind: "OBJECT";
		name: "MutationError";
		fields: {
			code: {
				name: "code";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			fields: {
				name: "fields";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "String"; ofType: null };
					};
				};
			};
			message: {
				name: "message";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			shortMessage: {
				name: "shortMessage";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			vars: {
				name: "vars";
				type: { kind: "SCALAR"; name: "Json"; ofType: null };
			};
		};
	};
	Notification: {
		kind: "OBJECT";
		name: "Notification";
		fields: {
			content: {
				name: "content";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
			};
			id: {
				name: "id";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
			};
			insertedAt: {
				name: "insertedAt";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				};
			};
			reads: {
				name: "reads";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: {
								kind: "OBJECT";
								name: "NotificationRead";
								ofType: null;
							};
						};
					};
				};
			};
			user: {
				name: "user";
				type: { kind: "OBJECT"; name: "User"; ofType: null };
			};
			userId: {
				name: "userId";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
			};
		};
	};
	NotificationFilterContent: {
		kind: "INPUT_OBJECT";
		name: "NotificationFilterContent";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "String"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "like";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "ilike";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	NotificationFilterId: {
		kind: "INPUT_OBJECT";
		name: "NotificationFilterId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
		];
	};
	NotificationFilterInput: {
		kind: "INPUT_OBJECT";
		name: "NotificationFilterInput";
		isOneOf: false;
		inputFields: [
			{
				name: "and";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "NotificationFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "or";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "NotificationFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "not";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "NotificationFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "id";
				type: {
					kind: "INPUT_OBJECT";
					name: "NotificationFilterId";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "userId";
				type: {
					kind: "INPUT_OBJECT";
					name: "NotificationFilterUserId";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "content";
				type: {
					kind: "INPUT_OBJECT";
					name: "NotificationFilterContent";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "insertedAt";
				type: {
					kind: "INPUT_OBJECT";
					name: "NotificationFilterInsertedAt";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "user";
				type: { kind: "INPUT_OBJECT"; name: "UserFilterInput"; ofType: null };
				defaultValue: null;
			},
			{
				name: "reads";
				type: {
					kind: "INPUT_OBJECT";
					name: "NotificationReadFilterInput";
					ofType: null;
				};
				defaultValue: null;
			},
		];
	};
	NotificationFilterInsertedAt: {
		kind: "INPUT_OBJECT";
		name: "NotificationFilterInsertedAt";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "DateTime"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
		];
	};
	NotificationFilterUserId: {
		kind: "INPUT_OBJECT";
		name: "NotificationFilterUserId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
		];
	};
	NotificationRead: {
		kind: "OBJECT";
		name: "NotificationRead";
		fields: {
			id: {
				name: "id";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
			};
			notification: {
				name: "notification";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "OBJECT"; name: "Notification"; ofType: null };
				};
			};
			notificationId: {
				name: "notificationId";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
			};
			seenAt: {
				name: "seenAt";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				};
			};
			user: {
				name: "user";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "OBJECT"; name: "User"; ofType: null };
				};
			};
			userId: {
				name: "userId";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
			};
		};
	};
	NotificationReadFilterInput: {
		kind: "INPUT_OBJECT";
		name: "NotificationReadFilterInput";
		isOneOf: false;
		inputFields: [
			{
				name: "and";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "NotificationReadFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "or";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "NotificationReadFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "not";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "NotificationReadFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "userId";
				type: {
					kind: "INPUT_OBJECT";
					name: "NotificationReadFilterUserId";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "notificationId";
				type: {
					kind: "INPUT_OBJECT";
					name: "NotificationReadFilterNotificationId";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "seenAt";
				type: {
					kind: "INPUT_OBJECT";
					name: "NotificationReadFilterSeenAt";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "user";
				type: { kind: "INPUT_OBJECT"; name: "UserFilterInput"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notification";
				type: {
					kind: "INPUT_OBJECT";
					name: "NotificationFilterInput";
					ofType: null;
				};
				defaultValue: null;
			},
		];
	};
	NotificationReadFilterNotificationId: {
		kind: "INPUT_OBJECT";
		name: "NotificationReadFilterNotificationId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
		];
	};
	NotificationReadFilterSeenAt: {
		kind: "INPUT_OBJECT";
		name: "NotificationReadFilterSeenAt";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "DateTime"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
		];
	};
	NotificationReadFilterUserId: {
		kind: "INPUT_OBJECT";
		name: "NotificationReadFilterUserId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
		];
	};
	NotificationReadSortField: {
		name: "NotificationReadSortField";
		enumValues: "USER_ID" | "NOTIFICATION_ID" | "SEEN_AT";
	};
	NotificationReadSortInput: {
		kind: "INPUT_OBJECT";
		name: "NotificationReadSortInput";
		isOneOf: false;
		inputFields: [
			{
				name: "order";
				type: { kind: "ENUM"; name: "SortOrder"; ofType: null };
				defaultValue: null;
			},
			{
				name: "field";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "ENUM";
						name: "NotificationReadSortField";
						ofType: null;
					};
				};
				defaultValue: null;
			},
		];
	};
	NotificationSortField: {
		name: "NotificationSortField";
		enumValues: "ID" | "USER_ID" | "CONTENT" | "INSERTED_AT";
	};
	NotificationSortInput: {
		kind: "INPUT_OBJECT";
		name: "NotificationSortInput";
		isOneOf: false;
		inputFields: [
			{
				name: "order";
				type: { kind: "ENUM"; name: "SortOrder"; ofType: null };
				defaultValue: null;
			},
			{
				name: "field";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "ENUM"; name: "NotificationSortField"; ofType: null };
				};
				defaultValue: null;
			},
		];
	};
	RaidEvent: {
		kind: "OBJECT";
		name: "RaidEvent";
		fields: {
			id: { name: "id"; type: { kind: "SCALAR"; name: "ID"; ofType: null } };
			platform: {
				name: "platform";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			timestamp: {
				name: "timestamp";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
			};
			username: {
				name: "username";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			viewerCount: {
				name: "viewerCount";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
			};
		};
	};
	RevokeProAccessResult: {
		kind: "OBJECT";
		name: "RevokeProAccessResult";
		fields: {
			errors: {
				name: "errors";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: { kind: "OBJECT"; name: "MutationError"; ofType: null };
						};
					};
				};
			};
			result: {
				name: "result";
				type: { kind: "OBJECT"; name: "User"; ofType: null };
			};
		};
	};
	RevokeUserRoleResult: {
		kind: "OBJECT";
		name: "RevokeUserRoleResult";
		fields: {
			errors: {
				name: "errors";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: { kind: "OBJECT"; name: "MutationError"; ofType: null };
						};
					};
				};
			};
			result: {
				name: "result";
				type: { kind: "OBJECT"; name: "UserRole"; ofType: null };
			};
		};
	};
	RootMutationType: {
		kind: "OBJECT";
		name: "RootMutationType";
		fields: {
			acceptRoleInvitation: {
				name: "acceptRoleInvitation";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "OBJECT";
						name: "AcceptRoleInvitationResult";
						ofType: null;
					};
				};
			};
			confirmFileUpload: {
				name: "confirmFileUpload";
				type: { kind: "OBJECT"; name: "ConfirmUploadResponse"; ofType: null };
			};
			createNotification: {
				name: "createNotification";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "OBJECT";
						name: "CreateNotificationResult";
						ofType: null;
					};
				};
			};
			declineRoleInvitation: {
				name: "declineRoleInvitation";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "OBJECT";
						name: "DeclineRoleInvitationResult";
						ofType: null;
					};
				};
			};
			deleteNotification: {
				name: "deleteNotification";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "OBJECT";
						name: "DeleteNotificationResult";
						ofType: null;
					};
				};
			};
			disconnectStreamingAccount: {
				name: "disconnectStreamingAccount";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "OBJECT";
						name: "DisconnectStreamingAccountResult";
						ofType: null;
					};
				};
			};
			grantProAccess: {
				name: "grantProAccess";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "OBJECT";
						name: "GrantProAccessResult";
						ofType: null;
					};
				};
			};
			inviteUserRole: {
				name: "inviteUserRole";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "OBJECT";
						name: "InviteUserRoleResult";
						ofType: null;
					};
				};
			};
			markNotificationRead: {
				name: "markNotificationRead";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "OBJECT";
						name: "MarkNotificationReadResult";
						ofType: null;
					};
				};
			};
			markNotificationUnread: {
				name: "markNotificationUnread";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				};
			};
			requestFileUpload: {
				name: "requestFileUpload";
				type: { kind: "OBJECT"; name: "FileUploadResponse"; ofType: null };
			};
			revokeProAccess: {
				name: "revokeProAccess";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "OBJECT";
						name: "RevokeProAccessResult";
						ofType: null;
					};
				};
			};
			revokeUserRole: {
				name: "revokeUserRole";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "OBJECT";
						name: "RevokeUserRoleResult";
						ofType: null;
					};
				};
			};
			saveDonationSettings: {
				name: "saveDonationSettings";
				type: { kind: "OBJECT"; name: "UserPreferences"; ofType: null };
			};
			saveSmartCanvasLayout: {
				name: "saveSmartCanvasLayout";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "OBJECT";
						name: "SaveSmartCanvasLayoutResult";
						ofType: null;
					};
				};
			};
			saveWidgetConfig: {
				name: "saveWidgetConfig";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "OBJECT";
						name: "SaveWidgetConfigResult";
						ofType: null;
					};
				};
			};
			toggleEmailNotifications: {
				name: "toggleEmailNotifications";
				type: { kind: "OBJECT"; name: "UserPreferences"; ofType: null };
			};
			updateAvatar: {
				name: "updateAvatar";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "OBJECT"; name: "UpdateAvatarResult"; ofType: null };
				};
			};
			updateName: {
				name: "updateName";
				type: { kind: "OBJECT"; name: "UpdateNameResult"; ofType: null };
			};
			updateSmartCanvasLayout: {
				name: "updateSmartCanvasLayout";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "OBJECT";
						name: "UpdateSmartCanvasLayoutResult";
						ofType: null;
					};
				};
			};
		};
	};
	RootQueryType: {
		kind: "OBJECT";
		name: "RootQueryType";
		fields: {
			bannedViewers: {
				name: "bannedViewers";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: { kind: "OBJECT"; name: "BannedViewer"; ofType: null };
						};
					};
				};
			};
			chatHistory: {
				name: "chatHistory";
				type: { kind: "OBJECT"; name: "KeysetPageOfChatMessage"; ofType: null };
			};
			currentUser: {
				name: "currentUser";
				type: { kind: "OBJECT"; name: "User"; ofType: null };
			};
			listGlobalNotifications: {
				name: "listGlobalNotifications";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: { kind: "OBJECT"; name: "Notification"; ofType: null };
						};
					};
				};
			};
			listNotificationReads: {
				name: "listNotificationReads";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: {
								kind: "OBJECT";
								name: "NotificationRead";
								ofType: null;
							};
						};
					};
				};
			};
			listNotifications: {
				name: "listNotifications";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: { kind: "OBJECT"; name: "Notification"; ofType: null };
						};
					};
				};
			};
			listUsers: {
				name: "listUsers";
				type: { kind: "OBJECT"; name: "KeysetPageOfUser"; ofType: null };
			};
			livestream: {
				name: "livestream";
				type: { kind: "OBJECT"; name: "Livestream"; ofType: null };
			};
			livestreamChat: {
				name: "livestreamChat";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: { kind: "OBJECT"; name: "ChatMessage"; ofType: null };
						};
					};
				};
			};
			livestreamEvents: {
				name: "livestreamEvents";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: { kind: "OBJECT"; name: "StreamEvent"; ofType: null };
						};
					};
				};
			};
			myGrantedRoles: {
				name: "myGrantedRoles";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: { kind: "OBJECT"; name: "UserRole"; ofType: null };
						};
					};
				};
			};
			myPendingInvitations: {
				name: "myPendingInvitations";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: { kind: "OBJECT"; name: "UserRole"; ofType: null };
						};
					};
				};
			};
			publicProfile: {
				name: "publicProfile";
				type: { kind: "OBJECT"; name: "User"; ofType: null };
			};
			rolesIGranted: {
				name: "rolesIGranted";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: { kind: "OBJECT"; name: "UserRole"; ofType: null };
						};
					};
				};
			};
			searchViewers: {
				name: "searchViewers";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: { kind: "OBJECT"; name: "StreamViewer"; ofType: null };
						};
					};
				};
			};
			smartCanvasLayout: {
				name: "smartCanvasLayout";
				type: { kind: "OBJECT"; name: "SmartCanvasLayout"; ofType: null };
			};
			streamHistory: {
				name: "streamHistory";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: { kind: "OBJECT"; name: "Livestream"; ofType: null };
						};
					};
				};
			};
			userByName: {
				name: "userByName";
				type: { kind: "OBJECT"; name: "User"; ofType: null };
			};
			userInfo: {
				name: "userInfo";
				type: { kind: "OBJECT"; name: "User"; ofType: null };
			};
			viewerChat: {
				name: "viewerChat";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: { kind: "OBJECT"; name: "ChatMessage"; ofType: null };
						};
					};
				};
			};
			viewerEvents: {
				name: "viewerEvents";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: { kind: "OBJECT"; name: "StreamEvent"; ofType: null };
						};
					};
				};
			};
			viewers: {
				name: "viewers";
				type: {
					kind: "OBJECT";
					name: "KeysetPageOfStreamViewer";
					ofType: null;
				};
			};
			widgetConfig: {
				name: "widgetConfig";
				type: { kind: "OBJECT"; name: "WidgetConfig"; ofType: null };
			};
		};
	};
	RootSubscriptionType: {
		kind: "OBJECT";
		name: "RootSubscriptionType";
		fields: {
			chatMessage: {
				name: "chatMessage";
				type: { kind: "OBJECT"; name: "ChatMessageEvent"; ofType: null };
			};
			cheerReceived: {
				name: "cheerReceived";
				type: { kind: "OBJECT"; name: "CheerEvent"; ofType: null };
			};
			donationReceived: {
				name: "donationReceived";
				type: { kind: "OBJECT"; name: "DonationEvent"; ofType: null };
			};
			followerAdded: {
				name: "followerAdded";
				type: { kind: "OBJECT"; name: "FollowerEvent"; ofType: null };
			};
			goalProgress: {
				name: "goalProgress";
				type: { kind: "OBJECT"; name: "GoalProgressEvent"; ofType: null };
			};
			raidReceived: {
				name: "raidReceived";
				type: { kind: "OBJECT"; name: "RaidEvent"; ofType: null };
			};
			subscriberAdded: {
				name: "subscriberAdded";
				type: { kind: "OBJECT"; name: "SubscriberEvent"; ofType: null };
			};
			viewerCountUpdated: {
				name: "viewerCountUpdated";
				type: { kind: "OBJECT"; name: "ViewerCountEvent"; ofType: null };
			};
		};
	};
	SaveSmartCanvasLayoutInput: {
		kind: "INPUT_OBJECT";
		name: "SaveSmartCanvasLayoutInput";
		isOneOf: false;
		inputFields: [
			{
				name: "userId";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "widgets";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "JsonString"; ofType: null };
					};
				};
				defaultValue: null;
			},
		];
	};
	SaveSmartCanvasLayoutResult: {
		kind: "OBJECT";
		name: "SaveSmartCanvasLayoutResult";
		fields: {
			errors: {
				name: "errors";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: { kind: "OBJECT"; name: "MutationError"; ofType: null };
						};
					};
				};
			};
			result: {
				name: "result";
				type: { kind: "OBJECT"; name: "SmartCanvasLayout"; ofType: null };
			};
		};
	};
	SaveWidgetConfigInput: {
		kind: "INPUT_OBJECT";
		name: "SaveWidgetConfigInput";
		isOneOf: false;
		inputFields: [
			{
				name: "userId";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "type";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "config";
				type: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				defaultValue: null;
			},
		];
	};
	SaveWidgetConfigResult: {
		kind: "OBJECT";
		name: "SaveWidgetConfigResult";
		fields: {
			errors: {
				name: "errors";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: { kind: "OBJECT"; name: "MutationError"; ofType: null };
						};
					};
				};
			};
			result: {
				name: "result";
				type: { kind: "OBJECT"; name: "WidgetConfig"; ofType: null };
			};
		};
	};
	SmartCanvasLayout: {
		kind: "OBJECT";
		name: "SmartCanvasLayout";
		fields: {
			id: {
				name: "id";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
			};
			user: {
				name: "user";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "OBJECT"; name: "User"; ofType: null };
				};
			};
			userId: {
				name: "userId";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
			};
			widgets: {
				name: "widgets";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: { kind: "SCALAR"; name: "JsonString"; ofType: null };
						};
					};
				};
			};
		};
	};
	SmartCanvasLayoutFilterId: {
		kind: "INPUT_OBJECT";
		name: "SmartCanvasLayoutFilterId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
		];
	};
	SmartCanvasLayoutFilterInput: {
		kind: "INPUT_OBJECT";
		name: "SmartCanvasLayoutFilterInput";
		isOneOf: false;
		inputFields: [
			{
				name: "and";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "SmartCanvasLayoutFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "or";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "SmartCanvasLayoutFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "not";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "SmartCanvasLayoutFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "id";
				type: {
					kind: "INPUT_OBJECT";
					name: "SmartCanvasLayoutFilterId";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "userId";
				type: {
					kind: "INPUT_OBJECT";
					name: "SmartCanvasLayoutFilterUserId";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "user";
				type: { kind: "INPUT_OBJECT"; name: "UserFilterInput"; ofType: null };
				defaultValue: null;
			},
		];
	};
	SmartCanvasLayoutFilterUserId: {
		kind: "INPUT_OBJECT";
		name: "SmartCanvasLayoutFilterUserId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
		];
	};
	SortOrder: {
		name: "SortOrder";
		enumValues:
			| "DESC"
			| "DESC_NULLS_FIRST"
			| "DESC_NULLS_LAST"
			| "ASC"
			| "ASC_NULLS_FIRST"
			| "ASC_NULLS_LAST";
	};
	StreamEvent: {
		kind: "OBJECT";
		name: "StreamEvent";
		fields: {
			authorId: {
				name: "authorId";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
			};
			data: {
				name: "data";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				};
			};
			dataRaw: {
				name: "dataRaw";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				};
			};
			id: {
				name: "id";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
			};
			insertedAt: {
				name: "insertedAt";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				};
			};
			livestreamId: {
				name: "livestreamId";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
			};
			platform: {
				name: "platform";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			type: {
				name: "type";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
			};
			userId: {
				name: "userId";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
			};
			viewerId: {
				name: "viewerId";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
		};
	};
	StreamEventFilterAuthorId: {
		kind: "INPUT_OBJECT";
		name: "StreamEventFilterAuthorId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "String"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "like";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "ilike";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	StreamEventFilterData: {
		kind: "INPUT_OBJECT";
		name: "StreamEventFilterData";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "JsonString"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				defaultValue: null;
			},
		];
	};
	StreamEventFilterDataRaw: {
		kind: "INPUT_OBJECT";
		name: "StreamEventFilterDataRaw";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "JsonString"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				defaultValue: null;
			},
		];
	};
	StreamEventFilterId: {
		kind: "INPUT_OBJECT";
		name: "StreamEventFilterId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
		];
	};
	StreamEventFilterInput: {
		kind: "INPUT_OBJECT";
		name: "StreamEventFilterInput";
		isOneOf: false;
		inputFields: [
			{
				name: "and";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "StreamEventFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "or";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "StreamEventFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "not";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "StreamEventFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "id";
				type: {
					kind: "INPUT_OBJECT";
					name: "StreamEventFilterId";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "type";
				type: {
					kind: "INPUT_OBJECT";
					name: "StreamEventFilterType";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "data";
				type: {
					kind: "INPUT_OBJECT";
					name: "StreamEventFilterData";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "dataRaw";
				type: {
					kind: "INPUT_OBJECT";
					name: "StreamEventFilterDataRaw";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "authorId";
				type: {
					kind: "INPUT_OBJECT";
					name: "StreamEventFilterAuthorId";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "livestreamId";
				type: {
					kind: "INPUT_OBJECT";
					name: "StreamEventFilterLivestreamId";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "userId";
				type: {
					kind: "INPUT_OBJECT";
					name: "StreamEventFilterUserId";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "platform";
				type: {
					kind: "INPUT_OBJECT";
					name: "StreamEventFilterPlatform";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "viewerId";
				type: {
					kind: "INPUT_OBJECT";
					name: "StreamEventFilterViewerId";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "insertedAt";
				type: {
					kind: "INPUT_OBJECT";
					name: "StreamEventFilterInsertedAt";
					ofType: null;
				};
				defaultValue: null;
			},
		];
	};
	StreamEventFilterInsertedAt: {
		kind: "INPUT_OBJECT";
		name: "StreamEventFilterInsertedAt";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "DateTime"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
		];
	};
	StreamEventFilterLivestreamId: {
		kind: "INPUT_OBJECT";
		name: "StreamEventFilterLivestreamId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
		];
	};
	StreamEventFilterPlatform: {
		kind: "INPUT_OBJECT";
		name: "StreamEventFilterPlatform";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	StreamEventFilterType: {
		kind: "INPUT_OBJECT";
		name: "StreamEventFilterType";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "String"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	StreamEventFilterUserId: {
		kind: "INPUT_OBJECT";
		name: "StreamEventFilterUserId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
		];
	};
	StreamEventFilterViewerId: {
		kind: "INPUT_OBJECT";
		name: "StreamEventFilterViewerId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "like";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "ilike";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	StreamEventSortField: {
		name: "StreamEventSortField";
		enumValues:
			| "ID"
			| "TYPE"
			| "DATA"
			| "DATA_RAW"
			| "AUTHOR_ID"
			| "LIVESTREAM_ID"
			| "USER_ID"
			| "PLATFORM"
			| "VIEWER_ID"
			| "INSERTED_AT";
	};
	StreamEventSortInput: {
		kind: "INPUT_OBJECT";
		name: "StreamEventSortInput";
		isOneOf: false;
		inputFields: [
			{
				name: "order";
				type: { kind: "ENUM"; name: "SortOrder"; ofType: null };
				defaultValue: null;
			},
			{
				name: "field";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "ENUM"; name: "StreamEventSortField"; ofType: null };
				};
				defaultValue: null;
			},
		];
	};
	StreamViewer: {
		kind: "OBJECT";
		name: "StreamViewer";
		fields: {
			aiSummary: {
				name: "aiSummary";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			avatarUrl: {
				name: "avatarUrl";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			channelUrl: {
				name: "channelUrl";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			displayName: {
				name: "displayName";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
			};
			firstSeenAt: {
				name: "firstSeenAt";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				};
			};
			id: {
				name: "id";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
			};
			isModerator: {
				name: "isModerator";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
			};
			isOwner: {
				name: "isOwner";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
			};
			isPatreon: {
				name: "isPatreon";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
			};
			isVerified: {
				name: "isVerified";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
			};
			lastSeenAt: {
				name: "lastSeenAt";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				};
			};
			notes: {
				name: "notes";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			platform: {
				name: "platform";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
			};
			userId: {
				name: "userId";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
			};
			viewerId: {
				name: "viewerId";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
			};
		};
	};
	StreamViewerFilterAiSummary: {
		kind: "INPUT_OBJECT";
		name: "StreamViewerFilterAiSummary";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "like";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "ilike";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	StreamViewerFilterAvatarUrl: {
		kind: "INPUT_OBJECT";
		name: "StreamViewerFilterAvatarUrl";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "like";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "ilike";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	StreamViewerFilterChannelUrl: {
		kind: "INPUT_OBJECT";
		name: "StreamViewerFilterChannelUrl";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "like";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "ilike";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	StreamViewerFilterDisplayName: {
		kind: "INPUT_OBJECT";
		name: "StreamViewerFilterDisplayName";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "String"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "like";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "ilike";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	StreamViewerFilterFirstSeenAt: {
		kind: "INPUT_OBJECT";
		name: "StreamViewerFilterFirstSeenAt";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "DateTime"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
		];
	};
	StreamViewerFilterInput: {
		kind: "INPUT_OBJECT";
		name: "StreamViewerFilterInput";
		isOneOf: false;
		inputFields: [
			{
				name: "and";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "StreamViewerFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "or";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "StreamViewerFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "not";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "StreamViewerFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "viewerId";
				type: {
					kind: "INPUT_OBJECT";
					name: "StreamViewerFilterViewerId";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "userId";
				type: {
					kind: "INPUT_OBJECT";
					name: "StreamViewerFilterUserId";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "platform";
				type: {
					kind: "INPUT_OBJECT";
					name: "StreamViewerFilterPlatform";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "displayName";
				type: {
					kind: "INPUT_OBJECT";
					name: "StreamViewerFilterDisplayName";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "avatarUrl";
				type: {
					kind: "INPUT_OBJECT";
					name: "StreamViewerFilterAvatarUrl";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "channelUrl";
				type: {
					kind: "INPUT_OBJECT";
					name: "StreamViewerFilterChannelUrl";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "isVerified";
				type: {
					kind: "INPUT_OBJECT";
					name: "StreamViewerFilterIsVerified";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "isOwner";
				type: {
					kind: "INPUT_OBJECT";
					name: "StreamViewerFilterIsOwner";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "isModerator";
				type: {
					kind: "INPUT_OBJECT";
					name: "StreamViewerFilterIsModerator";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "isPatreon";
				type: {
					kind: "INPUT_OBJECT";
					name: "StreamViewerFilterIsPatreon";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "notes";
				type: {
					kind: "INPUT_OBJECT";
					name: "StreamViewerFilterNotes";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "aiSummary";
				type: {
					kind: "INPUT_OBJECT";
					name: "StreamViewerFilterAiSummary";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "firstSeenAt";
				type: {
					kind: "INPUT_OBJECT";
					name: "StreamViewerFilterFirstSeenAt";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "lastSeenAt";
				type: {
					kind: "INPUT_OBJECT";
					name: "StreamViewerFilterLastSeenAt";
					ofType: null;
				};
				defaultValue: null;
			},
		];
	};
	StreamViewerFilterIsModerator: {
		kind: "INPUT_OBJECT";
		name: "StreamViewerFilterIsModerator";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
		];
	};
	StreamViewerFilterIsOwner: {
		kind: "INPUT_OBJECT";
		name: "StreamViewerFilterIsOwner";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
		];
	};
	StreamViewerFilterIsPatreon: {
		kind: "INPUT_OBJECT";
		name: "StreamViewerFilterIsPatreon";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
		];
	};
	StreamViewerFilterIsVerified: {
		kind: "INPUT_OBJECT";
		name: "StreamViewerFilterIsVerified";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
		];
	};
	StreamViewerFilterLastSeenAt: {
		kind: "INPUT_OBJECT";
		name: "StreamViewerFilterLastSeenAt";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "DateTime"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
		];
	};
	StreamViewerFilterNotes: {
		kind: "INPUT_OBJECT";
		name: "StreamViewerFilterNotes";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "like";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "ilike";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	StreamViewerFilterPlatform: {
		kind: "INPUT_OBJECT";
		name: "StreamViewerFilterPlatform";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "String"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	StreamViewerFilterUserId: {
		kind: "INPUT_OBJECT";
		name: "StreamViewerFilterUserId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
		];
	};
	StreamViewerFilterViewerId: {
		kind: "INPUT_OBJECT";
		name: "StreamViewerFilterViewerId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "String"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "like";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "ilike";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	StreamViewerSortField: {
		name: "StreamViewerSortField";
		enumValues:
			| "VIEWER_ID"
			| "USER_ID"
			| "PLATFORM"
			| "DISPLAY_NAME"
			| "AVATAR_URL"
			| "CHANNEL_URL"
			| "IS_VERIFIED"
			| "IS_OWNER"
			| "IS_MODERATOR"
			| "IS_PATREON"
			| "NOTES"
			| "AI_SUMMARY"
			| "FIRST_SEEN_AT"
			| "LAST_SEEN_AT";
	};
	StreamViewerSortInput: {
		kind: "INPUT_OBJECT";
		name: "StreamViewerSortInput";
		isOneOf: false;
		inputFields: [
			{
				name: "order";
				type: { kind: "ENUM"; name: "SortOrder"; ofType: null };
				defaultValue: null;
			},
			{
				name: "field";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "ENUM"; name: "StreamViewerSortField"; ofType: null };
				};
				defaultValue: null;
			},
		];
	};
	StreamingAccount: {
		kind: "OBJECT";
		name: "StreamingAccount";
		fields: {
			id: {
				name: "id";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
			};
		};
	};
	String: unknown;
	SubscriberEvent: {
		kind: "OBJECT";
		name: "SubscriberEvent";
		fields: {
			id: { name: "id"; type: { kind: "SCALAR"; name: "ID"; ofType: null } };
			message: {
				name: "message";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			months: {
				name: "months";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
			};
			platform: {
				name: "platform";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			tier: {
				name: "tier";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			timestamp: {
				name: "timestamp";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
			};
			username: {
				name: "username";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
		};
	};
	UpdateAvatarInput: {
		kind: "INPUT_OBJECT";
		name: "UpdateAvatarInput";
		isOneOf: false;
		inputFields: [
			{
				name: "avatarFileId";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "fileId";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
				defaultValue: null;
			},
		];
	};
	UpdateAvatarResult: {
		kind: "OBJECT";
		name: "UpdateAvatarResult";
		fields: {
			errors: {
				name: "errors";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: { kind: "OBJECT"; name: "MutationError"; ofType: null };
						};
					};
				};
			};
			result: {
				name: "result";
				type: { kind: "OBJECT"; name: "User"; ofType: null };
			};
		};
	};
	UpdateNameResult: {
		kind: "OBJECT";
		name: "UpdateNameResult";
		fields: {
			id: {
				name: "id";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
			};
			name: {
				name: "name";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
			};
		};
	};
	UpdateSmartCanvasLayoutInput: {
		kind: "INPUT_OBJECT";
		name: "UpdateSmartCanvasLayoutInput";
		isOneOf: false;
		inputFields: [
			{
				name: "widgets";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "JsonString"; ofType: null };
					};
				};
				defaultValue: null;
			},
		];
	};
	UpdateSmartCanvasLayoutResult: {
		kind: "OBJECT";
		name: "UpdateSmartCanvasLayoutResult";
		fields: {
			errors: {
				name: "errors";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: {
						kind: "LIST";
						name: never;
						ofType: {
							kind: "NON_NULL";
							name: never;
							ofType: { kind: "OBJECT"; name: "MutationError"; ofType: null };
						};
					};
				};
			};
			result: {
				name: "result";
				type: { kind: "OBJECT"; name: "SmartCanvasLayout"; ofType: null };
			};
		};
	};
	UploadHeaderOutput: {
		kind: "OBJECT";
		name: "UploadHeaderOutput";
		fields: {
			key: {
				name: "key";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
			};
			value: {
				name: "value";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
			};
		};
	};
	User: {
		kind: "OBJECT";
		name: "User";
		fields: {
			avatarFileId: {
				name: "avatarFileId";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
			};
			avatarUrl: {
				name: "avatarUrl";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			confirmedAt: {
				name: "confirmedAt";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
			};
			defaultVoice: {
				name: "defaultVoice";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			displayAvatar: {
				name: "displayAvatar";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			donationCurrency: {
				name: "donationCurrency";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
			};
			email: {
				name: "email";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
			};
			emailNotifications: {
				name: "emailNotifications";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				};
			};
			extraData: {
				name: "extraData";
				type: { kind: "SCALAR"; name: "JsonString"; ofType: null };
			};
			hoursStreamedLast30Days: {
				name: "hoursStreamedLast30Days";
				type: { kind: "SCALAR"; name: "Float"; ofType: null };
			};
			id: {
				name: "id";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
			};
			isModerator: {
				name: "isModerator";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
			};
			maxDonationAmount: {
				name: "maxDonationAmount";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
			};
			minDonationAmount: {
				name: "minDonationAmount";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
			};
			name: {
				name: "name";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
			};
			role: {
				name: "role";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			storageQuota: {
				name: "storageQuota";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
			};
			storageUsedPercent: {
				name: "storageUsedPercent";
				type: { kind: "SCALAR"; name: "Float"; ofType: null };
			};
			tier: {
				name: "tier";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
		};
	};
	UserFilterAvatarFileId: {
		kind: "INPUT_OBJECT";
		name: "UserFilterAvatarFileId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
		];
	};
	UserFilterAvatarUrl: {
		kind: "INPUT_OBJECT";
		name: "UserFilterAvatarUrl";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "like";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "ilike";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	UserFilterConfirmedAt: {
		kind: "INPUT_OBJECT";
		name: "UserFilterConfirmedAt";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
		];
	};
	UserFilterDefaultVoice: {
		kind: "INPUT_OBJECT";
		name: "UserFilterDefaultVoice";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "like";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "ilike";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	UserFilterDonationCurrency: {
		kind: "INPUT_OBJECT";
		name: "UserFilterDonationCurrency";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "String"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "like";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "ilike";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	UserFilterEmail: {
		kind: "INPUT_OBJECT";
		name: "UserFilterEmail";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "String"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "like";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "ilike";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	UserFilterEmailNotifications: {
		kind: "INPUT_OBJECT";
		name: "UserFilterEmailNotifications";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
		];
	};
	UserFilterExtraData: {
		kind: "INPUT_OBJECT";
		name: "UserFilterExtraData";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				defaultValue: null;
			},
		];
	};
	UserFilterId: {
		kind: "INPUT_OBJECT";
		name: "UserFilterId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
		];
	};
	UserFilterInput: {
		kind: "INPUT_OBJECT";
		name: "UserFilterInput";
		isOneOf: false;
		inputFields: [
			{
				name: "and";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "UserFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "or";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "UserFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "not";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "UserFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "id";
				type: { kind: "INPUT_OBJECT"; name: "UserFilterId"; ofType: null };
				defaultValue: null;
			},
			{
				name: "email";
				type: { kind: "INPUT_OBJECT"; name: "UserFilterEmail"; ofType: null };
				defaultValue: null;
			},
			{
				name: "name";
				type: { kind: "INPUT_OBJECT"; name: "UserFilterName"; ofType: null };
				defaultValue: null;
			},
			{
				name: "extraData";
				type: {
					kind: "INPUT_OBJECT";
					name: "UserFilterExtraData";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "confirmedAt";
				type: {
					kind: "INPUT_OBJECT";
					name: "UserFilterConfirmedAt";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "emailNotifications";
				type: {
					kind: "INPUT_OBJECT";
					name: "UserFilterEmailNotifications";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "minDonationAmount";
				type: {
					kind: "INPUT_OBJECT";
					name: "UserFilterMinDonationAmount";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "maxDonationAmount";
				type: {
					kind: "INPUT_OBJECT";
					name: "UserFilterMaxDonationAmount";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "donationCurrency";
				type: {
					kind: "INPUT_OBJECT";
					name: "UserFilterDonationCurrency";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "defaultVoice";
				type: {
					kind: "INPUT_OBJECT";
					name: "UserFilterDefaultVoice";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "avatarUrl";
				type: {
					kind: "INPUT_OBJECT";
					name: "UserFilterAvatarUrl";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "avatarFileId";
				type: {
					kind: "INPUT_OBJECT";
					name: "UserFilterAvatarFileId";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "tier";
				type: { kind: "INPUT_OBJECT"; name: "UserFilterTier"; ofType: null };
				defaultValue: null;
			},
			{
				name: "role";
				type: { kind: "INPUT_OBJECT"; name: "UserFilterRole"; ofType: null };
				defaultValue: null;
			},
			{
				name: "isModerator";
				type: {
					kind: "INPUT_OBJECT";
					name: "UserFilterIsModerator";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "storageQuota";
				type: {
					kind: "INPUT_OBJECT";
					name: "UserFilterStorageQuota";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "storageUsedPercent";
				type: {
					kind: "INPUT_OBJECT";
					name: "UserFilterStorageUsedPercent";
					ofType: null;
				};
				defaultValue: null;
			},
		];
	};
	UserFilterIsModerator: {
		kind: "INPUT_OBJECT";
		name: "UserFilterIsModerator";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
		];
	};
	UserFilterMaxDonationAmount: {
		kind: "INPUT_OBJECT";
		name: "UserFilterMaxDonationAmount";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "Int"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
				defaultValue: null;
			},
		];
	};
	UserFilterMinDonationAmount: {
		kind: "INPUT_OBJECT";
		name: "UserFilterMinDonationAmount";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "Int"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
				defaultValue: null;
			},
		];
	};
	UserFilterName: {
		kind: "INPUT_OBJECT";
		name: "UserFilterName";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "String"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "like";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "ilike";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	UserFilterRole: {
		kind: "INPUT_OBJECT";
		name: "UserFilterRole";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "String"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	UserFilterStorageQuota: {
		kind: "INPUT_OBJECT";
		name: "UserFilterStorageQuota";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "Int"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
				defaultValue: null;
			},
		];
	};
	UserFilterStorageUsedPercent: {
		kind: "INPUT_OBJECT";
		name: "UserFilterStorageUsedPercent";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "Float"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "Float"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "Float"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "Float"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "Float"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "Float"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "Float"; ofType: null };
				defaultValue: null;
			},
		];
	};
	UserFilterTier: {
		kind: "INPUT_OBJECT";
		name: "UserFilterTier";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "String"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	UserPreferences: {
		kind: "OBJECT";
		name: "UserPreferences";
		fields: {
			defaultVoice: {
				name: "defaultVoice";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			donationCurrency: {
				name: "donationCurrency";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
			};
			emailNotifications: {
				name: "emailNotifications";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				};
			};
			insertedAt: {
				name: "insertedAt";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				};
			};
			maxDonationAmount: {
				name: "maxDonationAmount";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
			};
			minDonationAmount: {
				name: "minDonationAmount";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
			};
			updatedAt: {
				name: "updatedAt";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				};
			};
			userId: {
				name: "userId";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
			};
		};
	};
	UserRole: {
		kind: "OBJECT";
		name: "UserRole";
		fields: {
			acceptedAt: {
				name: "acceptedAt";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
			};
			grantedAt: {
				name: "grantedAt";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				};
			};
			granterId: {
				name: "granterId";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
			};
			id: {
				name: "id";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
			};
			revokedAt: {
				name: "revokedAt";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
			};
			roleStatus: {
				name: "roleStatus";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
			};
			roleType: {
				name: "roleType";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
			};
			userId: {
				name: "userId";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
			};
		};
	};
	UserRoleFilterAcceptedAt: {
		kind: "INPUT_OBJECT";
		name: "UserRoleFilterAcceptedAt";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
		];
	};
	UserRoleFilterGrantedAt: {
		kind: "INPUT_OBJECT";
		name: "UserRoleFilterGrantedAt";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "DateTime"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
		];
	};
	UserRoleFilterGranterId: {
		kind: "INPUT_OBJECT";
		name: "UserRoleFilterGranterId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
		];
	};
	UserRoleFilterId: {
		kind: "INPUT_OBJECT";
		name: "UserRoleFilterId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
		];
	};
	UserRoleFilterInput: {
		kind: "INPUT_OBJECT";
		name: "UserRoleFilterInput";
		isOneOf: false;
		inputFields: [
			{
				name: "and";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "UserRoleFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "or";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "UserRoleFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "not";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "UserRoleFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "id";
				type: { kind: "INPUT_OBJECT"; name: "UserRoleFilterId"; ofType: null };
				defaultValue: null;
			},
			{
				name: "userId";
				type: {
					kind: "INPUT_OBJECT";
					name: "UserRoleFilterUserId";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "granterId";
				type: {
					kind: "INPUT_OBJECT";
					name: "UserRoleFilterGranterId";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "roleType";
				type: {
					kind: "INPUT_OBJECT";
					name: "UserRoleFilterRoleType";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "roleStatus";
				type: {
					kind: "INPUT_OBJECT";
					name: "UserRoleFilterRoleStatus";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "grantedAt";
				type: {
					kind: "INPUT_OBJECT";
					name: "UserRoleFilterGrantedAt";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "acceptedAt";
				type: {
					kind: "INPUT_OBJECT";
					name: "UserRoleFilterAcceptedAt";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "revokedAt";
				type: {
					kind: "INPUT_OBJECT";
					name: "UserRoleFilterRevokedAt";
					ofType: null;
				};
				defaultValue: null;
			},
		];
	};
	UserRoleFilterRevokedAt: {
		kind: "INPUT_OBJECT";
		name: "UserRoleFilterRevokedAt";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
				defaultValue: null;
			},
		];
	};
	UserRoleFilterRoleStatus: {
		kind: "INPUT_OBJECT";
		name: "UserRoleFilterRoleStatus";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "String"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	UserRoleFilterRoleType: {
		kind: "INPUT_OBJECT";
		name: "UserRoleFilterRoleType";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "String"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	UserRoleFilterUserId: {
		kind: "INPUT_OBJECT";
		name: "UserRoleFilterUserId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
		];
	};
	UserRoleSortField: {
		name: "UserRoleSortField";
		enumValues:
			| "ID"
			| "USER_ID"
			| "GRANTER_ID"
			| "ROLE_TYPE"
			| "ROLE_STATUS"
			| "GRANTED_AT"
			| "ACCEPTED_AT"
			| "REVOKED_AT";
	};
	UserRoleSortInput: {
		kind: "INPUT_OBJECT";
		name: "UserRoleSortInput";
		isOneOf: false;
		inputFields: [
			{
				name: "order";
				type: { kind: "ENUM"; name: "SortOrder"; ofType: null };
				defaultValue: null;
			},
			{
				name: "field";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "ENUM"; name: "UserRoleSortField"; ofType: null };
				};
				defaultValue: null;
			},
		];
	};
	UserSortField: {
		name: "UserSortField";
		enumValues:
			| "ID"
			| "EMAIL"
			| "NAME"
			| "EXTRA_DATA"
			| "CONFIRMED_AT"
			| "EMAIL_NOTIFICATIONS"
			| "MIN_DONATION_AMOUNT"
			| "MAX_DONATION_AMOUNT"
			| "DONATION_CURRENCY"
			| "DEFAULT_VOICE"
			| "AVATAR_URL"
			| "AVATAR_FILE_ID"
			| "TIER"
			| "ROLE"
			| "IS_MODERATOR"
			| "STORAGE_QUOTA"
			| "STORAGE_USED_PERCENT";
	};
	UserSortInput: {
		kind: "INPUT_OBJECT";
		name: "UserSortInput";
		isOneOf: false;
		inputFields: [
			{
				name: "order";
				type: { kind: "ENUM"; name: "SortOrder"; ofType: null };
				defaultValue: null;
			},
			{
				name: "field";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "ENUM"; name: "UserSortField"; ofType: null };
				};
				defaultValue: null;
			},
		];
	};
	ViewerCountEvent: {
		kind: "OBJECT";
		name: "ViewerCountEvent";
		fields: {
			count: {
				name: "count";
				type: { kind: "SCALAR"; name: "Int"; ofType: null };
			};
			platform: {
				name: "platform";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
			};
			timestamp: {
				name: "timestamp";
				type: { kind: "SCALAR"; name: "DateTime"; ofType: null };
			};
		};
	};
	WidgetConfig: {
		kind: "OBJECT";
		name: "WidgetConfig";
		fields: {
			config: {
				name: "config";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				};
			};
			id: {
				name: "id";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
			};
			type: {
				name: "type";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "String"; ofType: null };
				};
			};
			user: {
				name: "user";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "OBJECT"; name: "User"; ofType: null };
				};
			};
			userId: {
				name: "userId";
				type: {
					kind: "NON_NULL";
					name: never;
					ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
				};
			};
		};
	};
	WidgetConfigFilterConfig: {
		kind: "INPUT_OBJECT";
		name: "WidgetConfigFilterConfig";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "JsonString"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "JsonString"; ofType: null };
				defaultValue: null;
			},
		];
	};
	WidgetConfigFilterId: {
		kind: "INPUT_OBJECT";
		name: "WidgetConfigFilterId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
		];
	};
	WidgetConfigFilterInput: {
		kind: "INPUT_OBJECT";
		name: "WidgetConfigFilterInput";
		isOneOf: false;
		inputFields: [
			{
				name: "and";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "WidgetConfigFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "or";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "WidgetConfigFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "not";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: {
							kind: "INPUT_OBJECT";
							name: "WidgetConfigFilterInput";
							ofType: null;
						};
					};
				};
				defaultValue: null;
			},
			{
				name: "id";
				type: {
					kind: "INPUT_OBJECT";
					name: "WidgetConfigFilterId";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "userId";
				type: {
					kind: "INPUT_OBJECT";
					name: "WidgetConfigFilterUserId";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "type";
				type: {
					kind: "INPUT_OBJECT";
					name: "WidgetConfigFilterType";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "config";
				type: {
					kind: "INPUT_OBJECT";
					name: "WidgetConfigFilterConfig";
					ofType: null;
				};
				defaultValue: null;
			},
			{
				name: "user";
				type: { kind: "INPUT_OBJECT"; name: "UserFilterInput"; ofType: null };
				defaultValue: null;
			},
		];
	};
	WidgetConfigFilterType: {
		kind: "INPUT_OBJECT";
		name: "WidgetConfigFilterType";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "String"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "String"; ofType: null };
				defaultValue: null;
			},
		];
	};
	WidgetConfigFilterUserId: {
		kind: "INPUT_OBJECT";
		name: "WidgetConfigFilterUserId";
		isOneOf: false;
		inputFields: [
			{
				name: "isNil";
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null };
				defaultValue: null;
			},
			{
				name: "eq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "notEq";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "in";
				type: {
					kind: "LIST";
					name: never;
					ofType: {
						kind: "NON_NULL";
						name: never;
						ofType: { kind: "SCALAR"; name: "ID"; ofType: null };
					};
				};
				defaultValue: null;
			},
			{
				name: "lessThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThan";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "lessThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
			{
				name: "greaterThanOrEqual";
				type: { kind: "SCALAR"; name: "ID"; ofType: null };
				defaultValue: null;
			},
		];
	};
};

/** An IntrospectionQuery representation of your schema.
 *
 * @remarks
 * This is an introspection of your schema saved as a file by GraphQLSP.
 * It will automatically be used by `gql.tada` to infer the types of your GraphQL documents.
 * If you need to reuse this data or update your `scalars`, update `tadaOutputLocation` to
 * instead save to a .ts instead of a .d.ts file.
 */
export type introspection = {
	name: never;
	query: "RootQueryType";
	mutation: "RootMutationType";
	subscription: "RootSubscriptionType";
	types: introspection_types;
};

declare module "gql.tada" {
	interface setupSchema {
		introspection: introspection;
	}
}
