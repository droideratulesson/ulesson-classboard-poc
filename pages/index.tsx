import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { useRouter } from 'next/router';
import React, { ReactElement, useState } from 'react';
import { encodePassphrase, generateRoomId, randomString } from '../lib/client-utils';
import styles from '../styles/Home.module.css';

interface TabsProps {
  children: ReactElement[];
  selectedIndex?: number;
  onTabSelected?: (index: number) => void;
}

function Tabs(props: TabsProps) {
  const activeIndex = props.selectedIndex ?? 0;
  if (!props.children) {
    return <></>;
  }

  let tabs = React.Children.map(props.children, (child, index) => {
    return (
      <button
        className="lk-button"
        onClick={() => {
          if (props.onTabSelected) props.onTabSelected(index);
        }}
        aria-pressed={activeIndex === index}
      >
        {child?.props.label}
      </button>
    );
  });
  return (
    <div className={styles.tabContainer}>
      <div className={styles.tabSelect}>{tabs}</div>
      {props.children[activeIndex]}
    </div>
  );
}

function SmartBoardTab({ label }: { label: string }) {
  const router = useRouter();

  const [name, setName] = useState('');

  const onSelect = async (roomId: string) => {
    let livekitUrl = 'https://livekit.bughandler.app';
    let request = await fetch(
      `http://77.37.49.143:3000/createToken?username=Smart%20Board&room=${roomId}`,
    );
    let token = await request.text();
    router.push(`/custom/?liveKitUrl=${livekitUrl}&token=${token}`);
  };

  return (
    <div className={styles.tabContent}>
      <p style={{ marginTop: 0 }}>Create a SmartBoard with an ID</p>
      <input
        id="name"
        name="name"
        type="text"
        placeholder="Enter SmartBoard ID"
        onChange={(e) => setName(e.target.value)}
        value={name}
      />

      <hr
        style={{ width: '100%', borderColor: 'rgba(255, 255, 255, 0.15)', marginBlock: '1rem' }}
      />

      <button
        style={{ paddingInline: '1.25rem', width: '100%' }}
        className="lk-button"
        type="button"
        onClick={() => onSelect(name)}
        disabled={name.trim() === ''}
      >
        Connect
      </button>
    </div>
  );
}

function AdminTab({ label }: { label: string }) {
  const router = useRouter();

  const [name, setName] = useState('');
  const [connectedSmartBoards, selectConnectedSmartBoards] = useState<string[]>([]);

  const onSelect = async (roomId: string) => {
    let livekitUrl = 'https://livekit.bughandler.app';
    let request = await fetch(
      `http://77.37.49.143:3000/createToken?username=${name}&room=${roomId}`,
    );
    let token = await request.text();
    router.push(`/custom/?liveKitUrl=${livekitUrl}&token=${token}&useMediaPipe=1`);
  };

  const loadConnectedSBs = async () => {
    let request = await fetch('http://77.37.49.143:3000/rooms');
    let result = await request.text();
    let rooms = JSON.parse(result) as string[];
    selectConnectedSmartBoards(rooms);
  };

  React.useEffect(() => {
    loadConnectedSBs();
  }, []);

  return (
    <div className={styles.tabContent}>
      <p style={{ marginTop: 0 }}>Connect to a SmartBoard using its ID</p>
      <input
        id="name"
        name="name"
        type="text"
        placeholder="Enter your name"
        onChange={(e) => setName(e.target.value)}
        value={name}
      />

      <hr
        style={{ width: '100%', borderColor: 'rgba(255, 255, 255, 0.15)', marginBlock: '1rem' }}
      />

      <h5 style={{ textAlign: 'center', marginTop: '0' }}>
        Connected Smartboards ({connectedSmartBoards.length})
      </h5>

      {connectedSmartBoards.map((room) => (
        <button
          style={{ paddingInline: '1.25rem', width: '100%' }}
          className="lk-button"
          type="button"
          onClick={() => onSelect(room)}
          disabled={name.trim() === ''}
        >
          {room}
        </button>
      ))}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<{ tabIndex: number }> = async ({
  query,
  res,
}) => {
  res.setHeader('Cache-Control', 'public, max-age=7200');
  const tabIndex = query.tab === 'custom' ? 1 : 0;
  return { props: { tabIndex } };
};

const Home = ({ tabIndex }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();
  function onTabSelected(index: number) {
    const tab = index === 1 ? 'custom' : 'demo';
    router.push({ query: { tab } });
  }
  return (
    <>
      <main className={styles.main} data-lk-theme="default">
        <Tabs selectedIndex={tabIndex} onTabSelected={onTabSelected}>
          <SmartBoardTab label="Smart Board" />
          <AdminTab label="Admin" />
        </Tabs>
      </main>
      <footer data-lk-theme="default">uLesson Classboard conference POC</footer>
    </>
  );
};

export default Home;
