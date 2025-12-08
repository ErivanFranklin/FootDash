importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Replace with the same firebase config used on the page (only projectId is strictly required here for some setups)
firebase.initializeApp({
  apiKey: "AIzaSyCzjLYFxLRQecisIQBIHGuS2fHVFi3C24c",
  authDomain: "foot-dash.firebaseapp.com",
  projectId: "foot-dash",
  storageBucket: "foot-dash.firebasestorage.app",
  messagingSenderId: "905507573532",
  appId: "1:905507573532:web:10da0a80b9e3cf71e734d9"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = (payload && payload.notification && payload.notification.title) || 'Background message';
  const notificationOptions = {
    body: (payload && payload.notification && payload.notification.body) || JSON.stringify(payload),
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
