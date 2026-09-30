import { FlaskConical, SlidersVertical, type LucideIcon } from '@lucide/svelte';

// Icons an authored page can show inline with InlineIcon, keyed by the name
// the page writes. Each one matches the icon Profilarr shows on the control the
// page is describing.

export const INLINE_ICONS = {
	flask: FlaskConical,
	sliders: SlidersVertical
} satisfies Record<string, LucideIcon>;

export type InlineIconName = keyof typeof INLINE_ICONS;
