import { getMobileContent } from '$lib/data/mobile';

export const load = () => ({
	mobile: getMobileContent()
});
