import { writable } from 'svelte/store';

function createAuthStore() {
	const { subscribe, set, update } = writable({
		user: null,
		token: null,
		isAuthenticated: false,
		initialized: false
	});

	return {
		subscribe,
		login: (user, token) => {
			localStorage.setItem('token', token);
			localStorage.setItem('user', JSON.stringify(user));
			set({ user, token, isAuthenticated: true, initialized: true });
		},
		logout: () => {
			localStorage.removeItem('token');
			localStorage.removeItem('user');
			set({ user: null, token: null, isAuthenticated: false, initialized: true });
		},
		init: () => {
			const token = localStorage.getItem('token');
			const userStr = localStorage.getItem('user');
			if (token && userStr) {
				try {
					const user = JSON.parse(userStr);
					set({ user, token, isAuthenticated: true, initialized: true });
				} catch {
					localStorage.removeItem('token');
					localStorage.removeItem('user');
					set({ user: null, token: null, isAuthenticated: false, initialized: true });
				}
			} else {
				set({ user: null, token: null, isAuthenticated: false, initialized: true });
			}
		}
	};
}

export const auth = createAuthStore();
