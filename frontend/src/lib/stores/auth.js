import { writable } from 'svelte/store';

function createAuthStore() {
	const { subscribe, set, update } = writable({
		user: null,
		token: null,
		isAuthenticated: false
	});

	return {
		subscribe,
		login: (user, token) => {
			localStorage.setItem('token', token);
			localStorage.setItem('user', JSON.stringify(user));
			set({ user, token, isAuthenticated: true });
		},
		logout: () => {
			localStorage.removeItem('token');
			localStorage.removeItem('user');
			set({ user: null, token: null, isAuthenticated: false });
		},
		init: () => {
			const token = localStorage.getItem('token');
			const userStr = localStorage.getItem('user');
			if (token && userStr) {
				try {
					const user = JSON.parse(userStr);
					set({ user, token, isAuthenticated: true });
				} catch {
					localStorage.removeItem('token');
					localStorage.removeItem('user');
				}
			}
		}
	};
}

export const auth = createAuthStore();
