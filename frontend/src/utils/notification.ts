'use client';

// Simple bell sound generator using Web Audio API
export function playBellSound() {
    try {
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

        // Create oscillator for the bell sound
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Bell-like frequency
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.type = 'sine';

        // Envelope for bell sound
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);

        // Play a second tone for more "bell-like" sound
        setTimeout(() => {
            const osc2 = audioContext.createOscillator();
            const gain2 = audioContext.createGain();

            osc2.connect(gain2);
            gain2.connect(audioContext.destination);

            osc2.frequency.setValueAtTime(600, audioContext.currentTime);
            osc2.type = 'sine';

            gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            osc2.start(audioContext.currentTime);
            osc2.stop(audioContext.currentTime + 0.3);
        }, 100);

    } catch (error) {
        console.log('Audio not supported:', error);
    }
}

// Notification sound with visual toast
export function showNotificationToast(message: string, type: 'success' | 'info' | 'warning' = 'info') {
    // Play bell sound
    playBellSound();

    // Show visual notification
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-[100] p-4 rounded-xl shadow-lg animate-fade-in-up ${type === 'success' ? 'bg-emerald-600' :
            type === 'warning' ? 'bg-amber-600' : 'bg-violet-600'
        } text-white max-w-sm`;
    toast.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="p-2 bg-white/20 rounded-lg">
                ${type === 'success' ? '✓' : type === 'warning' ? '⚠' : '🔔'}
            </div>
            <p class="text-sm font-medium">${message}</p>
        </div>
    `;

    document.body.appendChild(toast);

    // Remove after 4 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
