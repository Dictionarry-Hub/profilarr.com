/** A caption split into plain text and inline code, so a caption written with
    backticks, like Markdown, renders its code spans as `<code>`. */
export interface CaptionPart {
	text: string;
	code: boolean;
}

export function captionParts(caption: string): CaptionPart[] {
	return caption
		.split('`')
		.map((text, index) => ({ text, code: index % 2 === 1 }))
		.filter((part) => part.text !== '');
}
