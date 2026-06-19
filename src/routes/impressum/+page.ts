import { getImpressumContent } from '$lib/data/impressum';
import type { PageLoad } from './$types';

export const load: PageLoad = () => ({
	impressum: getImpressumContent()
});
