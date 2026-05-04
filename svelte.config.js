import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
	},
	kit: {
		adapter: adapter(),
		prerender: {
			handleHttpError: ({ path, status, message }) => {
				// Decap lives at static/admin; prerender has no Svelte route for /admin
				if (status === 404 && (path === '/admin' || path.startsWith('/admin/'))) {
					return;
				}
				throw new Error(message);
			}
		}
	}
};

export default config;
