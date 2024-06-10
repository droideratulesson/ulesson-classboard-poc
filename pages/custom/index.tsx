'use client';
import {
  formatChatMessageLinks,
  LiveKitRoom,
  Toast,
  useParticipantTracks,
  VideoConference,
} from '@livekit/components-react';
import {
  createLocalVideoTrack,
  ExternalE2EEKeyProvider,
  LocalParticipant,
  LocalTrackPublication,
  LogLevel,
  Room,
  RoomConnectOptions,
  RoomEvent,
  RoomOptions,
  Track,
  VideoCodec,
  VideoPresets,
} from 'livekit-client';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { decodePassphrase } from '../../lib/client-utils';
import { DebugMode } from '../../lib/Debug';
import { gestureDetectorFun, MediapipeTransformer } from '../../lib/processors';
import { CustomVideoConference } from '../../lib/CustomVideoConference';
import { readFileSync } from 'fs';

export default function CustomRoomConnection() {
  const router = useRouter();
  const { liveKitUrl, token, codec, useMediaPipe } = router.query;

  const e2eePassphrase =
    typeof window !== 'undefined' && decodePassphrase(window.location.hash.substring(1));
  const worker =
    typeof window !== 'undefined' &&
    new Worker(new URL('livekit-client/e2ee-worker', import.meta.url));
  const keyProvider = new ExternalE2EEKeyProvider();

  const [gestureDetectionDesc, setGestureDetectionDesc] = useState('Connecting...');

  useEffect(() => {
    gestureDetectorFun.func = (value) => {
      setGestureDetectionDesc(value);
    };

    return () => {
      gestureDetectorFun.func = (desc: string) => {
        console.log('Reverted default handler called');
      };
    };
  }, [0]);

  const e2eeEnabled = !!(e2eePassphrase && worker);

  const roomOptions = useMemo((): RoomOptions => {
    return {
      publishDefaults: {
        videoSimulcastLayers: [VideoPresets.h540, VideoPresets.h216],
        red: !e2eeEnabled,
        videoCodec: codec as VideoCodec | undefined,
      },
      adaptiveStream: { pixelDensity: 'screen' },
      dynacast: true,
      e2ee: e2eeEnabled
        ? {
            keyProvider,
            worker,
          }
        : undefined,
    };
  }, []);

  const room = useMemo(() => new Room(roomOptions), []);
  if (e2eeEnabled) {
    keyProvider.setKey(e2eePassphrase);
    room.setE2EEEnabled(true);
  }

  const connectOptions = useMemo((): RoomConnectOptions => {
    return {
      autoSubscribe: true,
    };
  }, []);

  if (typeof liveKitUrl !== 'string') {
    return <h2>Missing LiveKit URL</h2>;
  }
  if (typeof token !== 'string') {
    return <h2>Missing LiveKit token</h2>;
  }

  return (
    <main data-lk-theme="default" className="main-view">
      {liveKitUrl && (
        <LiveKitRoom
          room={room}
          token={token}
          connectOptions={connectOptions}
          serverUrl={liveKitUrl}
          audio={true}
          video={true}
        >
          <CustomVideoConference chatMessageFormatter={formatChatMessageLinks} />
          <DebugMode logLevel={LogLevel.debug} />
        </LiveKitRoom>
      )}

      <canvas
        className="output_canvas"
        id="output_canvas"
        width="1280"
        height="720"
        style={{ position: 'absolute', left: '0px', top: '0px', zIndex: 999 }}
      ></canvas>

      {useMediaPipe && <Toast style={{ marginTop: '100px' }}>{gestureDetectionDesc}</Toast>}
      {useMediaPipe && <RoomParticipantManager />}
    </main>
  );
}

function RoomParticipantManager(): JSX.Element {
  const [transformer, setTransformer] = useState<MediapipeTransformer | null>(null);

  useEffect(() => {
    function attachVideoListeners(videoElement: HTMLVideoElement) {
      console.log('[MEDIAPIPE] Setting up mediapipe');
      setTransformer(new MediapipeTransformer(videoElement));
      console.log('[MEDIAPIPE] Mediapipe transformer set');
    }

    function callback(mutations: MutationRecord[], observer: MutationObserver) {
      console.log('[MEDIAPIPE] Mutation callback');
      const videoElem = document.querySelector('video');
      if (videoElem) {
        attachVideoListeners(videoElem as HTMLVideoElement);
        observer.disconnect();
        return;
      }
    }

    const observer = new MutationObserver(callback);
    observer.observe(document.body, { childList: true, subtree: true });
    console.log('[MEDIAPIPE] Mutation observer set');
  }, [0]);

  return <></>;
}
