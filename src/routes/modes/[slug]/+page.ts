import { error } from '@sveltejs/kit';
import { getEducationModeBySlug } from '$lib/data/education-modes';

import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const mode = getEducationModeBySlug(params.slug);

	if (!mode) {
		throw error(404, 'Ausbildungsmodus nicht gefunden');
	}

	return { mode };
};
