import type { MarkdownColumn } from '$lib/shared/utils/llm/components.js';

// Component data for the Fields page. The page renders it and the Markdown
// mirror serializes it, so both show the same thing.

type FieldInfo = {
	field: string;
	kind: string;
	/** Plain-language explanation. *Italics* and `code` render like they do in Markdown. */
	checks: string;
	seeAlso?: { label: string; href: string };
};

// Fields both Radarr and Sonarr filters can use.
export const sharedFields: FieldInfo[] = [
	{
		field: 'Monitored',
		kind: 'Boolean',
		checks: "Whether Radarr or Sonarr is monitoring the item. For a series, it's the series-level setting only, so seasons you've unmonitored don't change it."
	},
	{
		field: 'Cutoff Met',
		kind: 'Boolean',
		checks: "Whether the item's score has reached the target set by its quality profile and the filter's Cutoff %.",
		seeAlso: { label: 'Cutoff Met', href: '#cutoff-met' }
	},
	{
		field: 'Title',
		kind: 'Text',
		checks: 'The title, as Radarr or Sonarr shows it.'
	},
	{
		field: 'Quality Profile',
		kind: 'Text',
		checks: 'The quality profile the item is assigned to. You pick it from a list, so the only operators are *is* and *is not*.'
	},
	{
		field: 'Original Language',
		kind: 'Text',
		checks: "The language the movie or show was originally made in, not the audio on your file. Any language Radarr or Sonarr doesn't recognise shows up as English, and Radarr lists Cantonese and Mandarin both as Chinese. Picked from a list, with *is* and *is not*."
	},
	{
		field: 'Genres',
		kind: 'List',
		checks: "The genres from the item's metadata in Radarr or Sonarr."
	},
	{
		field: 'Tags',
		kind: 'List',
		checks: "The tags on the item in Radarr or Sonarr, including ones added by Auto Tagging rules. Profilarr's own cooldown tags show up here too."
	},
	{
		field: 'Rating',
		kind: 'Number',
		checks: "In Radarr, the movie's TMDb rating. In Sonarr, the series rating from Sonarr's metadata. Both are out of 10, but Radarr and Sonarr show them as a percentage, so a rating shown as 83% is 8.3 here. Unrated items count as 0."
	},
	{
		field: 'Year',
		kind: 'Number',
		checks: "The movie's year according to TMDb, or the year a series first aired. Unknown years count as 0."
	},
	{
		field: 'Runtime',
		kind: 'Number',
		checks: "The runtime listed in the item's metadata, in minutes, not your file's length. For a series, that's one episode."
	},
	{
		field: 'Size on Disk',
		kind: 'Number',
		checks: "The size of the item's video files in GiB, the same number Radarr and Sonarr show. For a movie that's its file, and for a series it's every imported episode file, specials included. Subtitles and extras don't count."
	},
	{
		field: 'Date Added',
		kind: 'Date',
		checks: 'When the item was added to Radarr or Sonarr, not when it was released or when its current file was downloaded.'
	}
];

// Fields only Radarr filters can use.
export const radarrFields: FieldInfo[] = [
	{
		field: 'Status',
		kind: 'Status',
		checks: "Announced until the movie's cinema date passes, then In Cinemas, then Released once its digital or physical release date passes, or 90 days after cinemas if neither is known. Radarr works this out from TMDb's dates each time it refreshes the movie. A movie TMDb has removed becomes Deleted, which counts as past Released."
	},
	{
		field: 'Minimum Availability',
		kind: 'Status',
		checks: "The stage at which Radarr starts searching for the movie, which you choose when you add it: Announced, In Cinemas, or Released. It doesn't change when the movie comes out. To filter on whether a movie is actually in cinemas or released, use Status."
	},
	{
		field: 'Collection',
		kind: 'Text',
		checks: "The TMDb collection the movie belongs to, like The Matrix Collection. Empty if it isn't part of one."
	},
	{
		field: 'Studio',
		kind: 'Text',
		checks: 'The studio Radarr lists for the movie. TMDb often credits several companies, but Radarr only keeps one.'
	},
	{
		field: 'Keywords',
		kind: 'Text',
		checks: "The movie's TMDb keywords, matched as one long piece of text, so *contains* war also matches post-war. Radarr only has keywords from version `5.24`, for movies it has refreshed since."
	},
	{
		field: 'Release Group',
		kind: 'Text',
		checks: 'The release group of the file on disk, as Radarr recorded it when the file was imported. You pick it from a list, so the only operators are *is* and *is not*.'
	},
	{
		field: 'Custom Format',
		kind: 'List',
		checks: 'Every custom format the file on disk matches right now.'
	},
	{
		field: 'Popularity',
		kind: 'Number',
		checks: "TMDb's popularity score, based on activity like views, votes, and watchlist additions. It has no fixed range, and Radarr only updates it when it refreshes the movie."
	},
	{
		field: 'TMDb Rating',
		kind: 'Number',
		checks: "TMDb's rating out of 10, the same value as Rating."
	},
	{
		field: 'IMDb Rating',
		kind: 'Number',
		checks: "IMDb's rating out of 10."
	},
	{
		field: 'Rotten Tomatoes',
		kind: 'Number',
		checks: 'The Rotten Tomatoes score, out of 100.'
	},
	{
		field: 'Trakt Rating',
		kind: 'Number',
		checks: "Trakt's rating out of 10. Radarr shows it as a percentage, so 83% is 8.3 here."
	},
	{
		field: 'Digital Release',
		kind: 'Date',
		checks: "The movie's digital release date from TMDb."
	},
	{
		field: 'Physical Release',
		kind: 'Date',
		checks: "The movie's physical release date from TMDb, such as its Blu-ray release."
	}
];

// Fields only Sonarr filters can use.
export const sonarrFields: FieldInfo[] = [
	{
		field: 'Status',
		kind: 'Status',
		checks: "Upcoming before the series premieres, Continuing while it's still airing, and Ended once it's finished, according to Sonarr's metadata. A series TheTVDB has removed becomes Deleted, which counts as past Ended, so *has reached* Ended matches it too."
	},
	{
		field: 'Network',
		kind: 'Text',
		checks: 'The network the series airs on. A show that moved networks lists its latest one, like The Expanse on Prime Video. You pick it from a list, so the only operators are *is* and *is not*.'
	},
	{
		field: 'Certification',
		kind: 'Text',
		checks: "The series' content rating, like TV-MA or TV-14. Picked from a list, with *is* and *is not*."
	},
	{
		field: 'Series Type',
		kind: 'Text',
		checks: "Whether you've set the series up in Sonarr as Standard, Daily, or Anime, which changes how Sonarr numbers and searches its episodes. Sonarr never sets Anime on its own, so an anime series can still be Standard. Picked from a list, with *is* and *is not*."
	},
	{
		field: 'Season Count',
		kind: 'Number',
		checks: "How many seasons the series has, not counting specials. Unmonitored seasons and seasons that haven't aired yet still count."
	},
	{
		field: 'Episode Count',
		kind: 'Number',
		checks: "The episodes Sonarr expects you to have: monitored episodes that have aired, plus any episode with a file. It's the second number in Sonarr's progress bar, not the show's total."
	},
	{
		field: 'Episode File Count',
		kind: 'Number',
		checks: 'How many episodes have a file, including specials and unmonitored seasons. A file holding two episodes counts as two.'
	},
	{
		field: 'First Aired',
		kind: 'Date',
		checks: 'The date the series premiered. A series without one never matches a date rule.'
	},
	{
		field: 'Last Aired',
		kind: 'Date',
		checks: "The air date of the series' latest episode. When Sonarr's metadata doesn't have one, Sonarr uses the latest episode it knows about, which can be one that hasn't aired yet."
	}
];

export const fieldColumns: MarkdownColumn<FieldInfo>[] = [
	{ key: 'field', header: 'Field', markdown: (row) => `**${row.field}**` },
	{ key: 'kind', header: 'Kind', markdown: (row) => `\`${row.kind}\`` },
	{
		key: 'checks',
		header: 'What it checks',
		markdown: (row) =>
			row.seeAlso
				? `${row.checks} See [${row.seeAlso.label}](${row.seeAlso.href}).`
				: row.checks
	}
];
