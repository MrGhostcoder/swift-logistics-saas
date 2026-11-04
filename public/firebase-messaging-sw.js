/* Firebase Cloud Messaging worker: shows SwiftTrack push notifications while the site is in the background.
   The server sends webpush.fcm_options.link, which the SDK opens when a notification is clicked. */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp(Object.fromEntries(new URL(self.location).searchParams));
firebase.messaging();
