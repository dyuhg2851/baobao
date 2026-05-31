(function() {
    const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

    let isSubscribed = false;
    let swRegistration = null;
    let pushSupported = true;

    function urlBase64ToUint8Array(base64String) {
        try {
            const padding = '='.repeat((4 - base64String.length % 4) % 4);
            const base64 = (base64String + padding)
                .replace(/-/g, '+')
                .replace(/_/g, '/');
            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
            }
            return outputArray;
        } catch (e) {
            console.error('VAPID key conversion error:', e);
            return null;
        }
    }

    function getServerUrl() {
        var protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
        var host = window.location.hostname || '192.168.1.198';
        var port = window.location.port || '3000';
        return protocol + '//' + host + ':' + port;
    }

    async function subscribePush() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.log('Push not supported');
            pushSupported = false;
            return false;
        }

        try {
            let registration;
            try {
                registration = await navigator.serviceWorker.register('/service-worker.js', {
                    scope: '/'
                });
            } catch (swErr) {
                console.warn('Service Worker registration failed, trying existing:', swErr);
                registration = await navigator.serviceWorker.ready;
            }
            
            swRegistration = registration;
            console.log('Service Worker registered:', registration.scope);

            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.log('Notification permission denied');
                return false;
            }

            const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
            if (!applicationServerKey) {
                return false;
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey
            });

            console.log('Push subscription:', subscription);

            const response = await fetch(getServerUrl() + '/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            });

            if (response.ok) {
                isSubscribed = true;
                console.log('Push subscription saved to server');
                return true;
            } else {
                console.error('Failed to save push subscription');
                return false;
            }
        } catch (err) {
            console.warn('Push subscription error:', err);
            console.log('Push notifications not available, continuing without push');
            pushSupported = false;
            return false;
        }
    }

    async function unsubscribePush() {
        if (!swRegistration) {
            try {
                swRegistration = await navigator.serviceWorker.ready;
            } catch (e) {
                console.error('SW registration error:', e);
                return;
            }
        }

        try {
            const subscription = await swRegistration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
            }

            await fetch(getServerUrl() + '/push/unsubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: subscription ? subscription.endpoint : '' })
            });

            isSubscribed = false;
            console.log('Push unsubscribed');
        } catch (err) {
            console.error('Unsubscribe error:', err);
        }
    }

    async function checkSubscription() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            return false;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            isSubscribed = !!subscription;
            return isSubscribed;
        } catch (err) {
            console.error('Check subscription error:', err);
            return false;
        }
    }

    async function initPush() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.log('Push not supported on this browser');
            pushSupported = false;
            return;
        }

        try {
            if (navigator.serviceWorker.controller) {
                swRegistration = await navigator.serviceWorker.ready;
            } else {
                try {
                    swRegistration = await navigator.serviceWorker.register('/service-worker.js', {
                        scope: '/'
                    });
                } catch (err) {
                    console.warn('Service Worker registration failed, continuing without push:', err);
                    pushSupported = false;
                    return;
                }
            }

            await checkSubscription();

            if (!isSubscribed) {
                await subscribePush();
            }

            navigator.serviceWorker.addEventListener('message', function(event) {
                if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
                    console.log('Notification clicked:', event.data.data);
                    if (event.data.data && event.data.data.url) {
                        window.location.href = event.data.data.url;
                    }
                }
            });
        } catch (err) {
            console.warn('Push init error:', err);
            pushSupported = false;
        }
    }

    window.PushManager = {
        subscribe: subscribePush,
        unsubscribe: unsubscribePush,
        checkSubscription: checkSubscription,
        isSubscribed: function() { return isSubscribed; },
        isSupported: function() { return pushSupported; }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPush);
    } else {
        initPush();
    }
})();