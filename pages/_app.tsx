import '../styles/globals.css';
import type { AppProps } from 'next/app';
import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';
import { DefaultSeo } from 'next-seo';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <DefaultSeo
        title="ULesson Classboard Conference App"
        titleTemplate="%s"
        defaultTitle="ULesson Classboard Conference App"
        description="uLesson classboard POC that implements Conference calling with gesture/face recognition using LiveKit open source."
        twitter={{
          handle: '@livekitted',
          site: '@livekitted',
          cardType: 'summary_large_image',
        }}
        openGraph={{
          url: 'https://meet.livekit.io',
          images: [
            {
              url: 'https://ulesson-classboard-poc.vercel.app/images/livekit-meet-open-graph.jpeg',
              width: 2000,
              height: 1000,
              type: 'image/jpeg',
            },
          ],
          site_name: 'LiveKit Meet',
        }}
        additionalMetaTags={[
          {
            property: 'theme-color',
            content: '#070707',
          },
        ]}
        additionalLinkTags={[
          {
            rel: 'icon',
            href: '/favicon.ico',
          },
          {
            rel: 'apple-touch-icon',
            href: '/images/livekit-apple-touch.png',
            sizes: '180x180',
          },
          {
            rel: 'mask-icon',
            href: '/images/livekit-safari-pinned-tab.svg',
            color: '#070707',
          },
        ]}
      />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
