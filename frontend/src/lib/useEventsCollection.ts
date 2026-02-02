import { createUserScopedStreamEventsCollection } from "~/lib/electric";

const eventCollections = new Map<
	string,
	ReturnType<typeof createUserScopedStreamEventsCollection>
>();

export function getEventsCollection(userId: string) {
	let collection = eventCollections.get(userId);
	if (!collection) {
		collection = createUserScopedStreamEventsCollection(userId);
		eventCollections.set(userId, collection);
	}
	return collection;
}
