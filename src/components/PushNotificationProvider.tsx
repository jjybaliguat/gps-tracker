'use client';

import { useEffect } from 'react';

export default function PushNotificationInit() {
  useEffect(() => {
    const initPush = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          const existingSubscription = await registration.pushManager.getSubscription();

          if (existingSubscription) {
            console.log('✅ Already subscribed:', existingSubscription.endpoint);
            return;
          }

          const applicationServerKey = urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
          );

          const newSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          });

          await fetch('/api/save-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSubscription),
          });

          console.log('🔐 New subscription saved:', newSubscription.endpoint);
        } catch (err) {
          console.error('❌ Push registration failed:', err);
        }
      }
    };

    initPush();
  }, []);

  return null;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
