import { CacheableResponsePlugin } from 'workbox-cacheable-response/CacheableResponsePlugin';
import { CacheFirst } from 'workbox-strategies/CacheFirst';
import { NetworkFirst } from 'workbox-strategies/NetworkFirst';
import { ExpirationPlugin } from 'workbox-expiration/ExpirationPlugin';
import { NavigationRoute } from 'workbox-routing/NavigationRoute';
import { precacheAndRoute } from 'workbox-precaching/precacheAndRoute';
import { registerRoute } from 'workbox-routing/registerRoute';
import { setCacheNameDetails } from 'workbox-core/setCacheNameDetails';
import {createHandlerBoundToURL} from 'workbox-precaching/createHandlerBoundToURL';

setCacheNameDetails({
  prefix: 'pyramid-client',
  suffix: 'v2',
  precache: 'pyramid-precache',
  runtime: 'pyramid-runtime-cache',
});
	
precacheAndRoute(self.__WB_MANIFEST);

const handler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(handler);
registerRoute(navigationRoute, new NetworkFirst());

registerRoute(
  /^https:\/\/googletagmanager\.com/,
  new CacheFirst({
	cacheName: 'pyramid-tagmanager',
	matchOptions: {
	  ignoreVary: true,
	},
	plugins: [
	  new ExpirationPlugin({
		maxEntries: 500,
		maxAgeSeconds: 86400,
		purgeOnQuotaError: true,
	  }),
	  new CacheableResponsePlugin({
		statuses: [0, 200]
	  }),
	],
  })
);

registerRoute(/^https:\/\/us-central1-pyramid-ninja.cloudfunctions.net\/avatars/, new CacheFirst({
  cacheName: 'pyramid-avatars',
  matchOptions: {
	ignoreVary: true,
  },
  plugins: [new ExpirationPlugin({
	maxEntries: 500,
	maxAgeSeconds: 63072e3,
	purgeOnQuotaError: true,
  }), new CacheableResponsePlugin({
	statuses: [0, 200]
  })]
}));

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
	self.skipWaiting();
  }
});