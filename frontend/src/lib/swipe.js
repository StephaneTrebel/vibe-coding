/**
 * createSwipeHandler — détection de swipe horizontal touch
 *
 * @param {object} [options]
 * @param {() => void} [options.onSwipeLeft]  — appelé quand swipe gauche détecté
 * @param {() => void} [options.onSwipeRight] — appelé quand swipe droite détecté
 * @param {number}     [options.threshold=50] — distance minimale en px pour déclencher
 *
 * @returns {{
 *   handleTouchStart: (e: TouchEvent) => void,
 *   handleTouchMove:  (e: TouchEvent) => number|null,
 *   handleTouchEnd:   (e: TouchEvent) => void,
 *   handleTouchCancel: () => void
 * }}
 *
 * Usage dans onMount avec { passive: true } :
 *   const handler = createSwipeHandler({ onSwipeLeft: () => {}, onSwipeRight: () => {} })
 *   el.addEventListener('touchstart',  handler.handleTouchStart,  { passive: true })
 *   el.addEventListener('touchmove',   handler.handleTouchMove,   { passive: true })
 *   el.addEventListener('touchend',    handler.handleTouchEnd,    { passive: true })
 *   el.addEventListener('touchcancel', handler.handleTouchCancel, { passive: true })
 *   // Cleanup dans le return de onMount :
 *   return () => {
 *     el.removeEventListener('touchstart',  handler.handleTouchStart)
 *     el.removeEventListener('touchmove',   handler.handleTouchMove)
 *     el.removeEventListener('touchend',    handler.handleTouchEnd)
 *     el.removeEventListener('touchcancel', handler.handleTouchCancel)
 *   }
 */
export function createSwipeHandler({ onSwipeLeft, onSwipeRight, threshold = 50 } = {}) {
	let touchStartX
	let touchStartY

	function handleTouchStart(e) {
		if (!e.touches?.length) return
		touchStartX = e.touches[0].clientX
		touchStartY = e.touches[0].clientY
	}

	/**
	 * Retourne le deltaX courant si le geste est horizontal, null sinon.
	 * Permet au consommateur d'appliquer un retour visuel en temps réel.
	 *
	 * @param {TouchEvent} e
	 * @returns {number|null}
	 */
	function handleTouchMove(e) {
		if (touchStartX === undefined || !e.touches?.length) return null
		const deltaX = e.touches[0].clientX - touchStartX
		// Optimisation : ne calculer l'angle que si le mouvement est significatif
		if (Math.abs(deltaX) > 10) {
			const deltaY = e.touches[0].clientY - touchStartY
			// Ignorer si le geste est trop vertical (scroll prioritaire, angle > ~27°)
			if (Math.abs(deltaX) < Math.abs(deltaY) * 0.5) return null
		}
		return deltaX
	}

	function handleTouchEnd(e) {
		if (touchStartX === undefined || !e.changedTouches?.length) return
		const deltaX = e.changedTouches[0].clientX - touchStartX
		const deltaY = e.changedTouches[0].clientY - touchStartY
		// Reset avant les callbacks pour éviter un état corrompu en cas d'erreur
		touchStartX = undefined
		touchStartY = undefined
		// Ignorer si le geste est trop vertical
		if (Math.abs(deltaX) < Math.abs(deltaY) * 0.5) return
		if (deltaX < -threshold) onSwipeLeft?.()
		else if (deltaX > threshold) onSwipeRight?.()
	}

	/**
	 * Reset l'état en cas d'interruption OS (appel entrant, notification).
	 * Évite un deltaX corrompu au prochain touch.
	 */
	function handleTouchCancel() {
		touchStartX = undefined
		touchStartY = undefined
	}

	return { handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel }
}
