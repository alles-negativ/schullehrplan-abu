import { getQvContent } from '$lib/data/qv';
import type { PageLoad } from './$types';

export const load: PageLoad = () => ({
	qv: getQvContent()
});
