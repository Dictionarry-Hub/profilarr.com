import {
	Activity,
	CircleQuestionMark,
	FlaskConical,
	GitPullRequest,
	Hammer,
	Heart,
	Rocket,
	Send,
	SquareTerminal,
	Users
} from '@lucide/svelte';

// Sidebar icons for top-level docs pages, keyed by slug. Pages without one
// render label only.
export const docIcons: Record<string, typeof Rocket> = {
	'quick-start': Rocket,
	'installation': SquareTerminal,
	'build': Hammer,
	'deploy': Send,
	'test': FlaskConical,
	'monitoring': Activity,
	'faq': CircleQuestionMark,
	'community': Users,
	'contributing': GitPullRequest,
	'sponsor': Heart
};
