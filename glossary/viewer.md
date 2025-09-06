In streampai Viewer is user interacting with streamer. Person donation to someone also
is considered a viewer. As you might imagine one real person can interact with streamer
on many platforms (YT/Twitch/Streampai<f.e. via donations>).
We try to make educated guess and link user activity from multiple platforms so it leads
to one person.
How do we do that?
Stream Events have AuthorId filled immediately (identifier used on platform) and ViewerId
(filled later by our oban job, but maybe it doesn't have to be column and can live in
another table).
This allows us to adjust our strategy of matching identities to viewers.   
