import { error } from '@sveltejs/kit';
import { getAllEducationModes, getEducationModeBySlug } from '$lib/data/education-modes';

import type { PageLoad } from './$types';

export const entries = () =>
	getAllEducationModes().map((mode) => ({ slug: mode.slug }));

export const load: PageLoad = ({ params }) => {
	const mode = getEducationModeBySlug(params.slug);

	if (!mode) {
		throw error(404, 'Ausbildungsmodus nicht gefunden');
	}

	return { mode };
};
