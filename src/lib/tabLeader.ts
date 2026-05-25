type LeaderListener = (isLeader: boolean) => void;

export interface TabLeader {
  isLeader(): boolean;
  start(): void;
  stop(): void;
  subscribe(listener: LeaderListener): () => void;
  broadcast(message: unknown): void;
  onMessage(handler: (message: unknown) => void): () => void;
}

interface ChannelLike {
  onmessage: ((event: { data: unknown }) => void) | null;
  postMessage(message: unknown): void;
  close(): void;
}

class MemoryBroadcastChannel implements ChannelLike {
  private static channels = new Map<string, Set<MemoryBroadcastChannel>>();
  onmessage: ((event: { data: unknown }) => void) | null = null;
  private readonly name: string;

  constructor(name: string) {
    this.name = name;
    const channel = MemoryBroadcastChannel.channels.get(name) ?? new Set();
    channel.add(this);
    MemoryBroadcastChannel.channels.set(name, channel);
  }

  postMessage(message: unknown): void {
    const channel = MemoryBroadcastChannel.channels.get(this.name);
    if (!channel) return;
    for (const peer of channel) {
      if (peer !== this) peer.onmessage?.({ data: message });
    }
  }

  close(): void {
    MemoryBroadcastChannel.channels.get(this.name)?.delete(this);
  }
}

function createChannel(name: string): ChannelLike {
  if ('BroadcastChannel' in window) return new BroadcastChannel(name) as unknown as ChannelLike;
  return new MemoryBroadcastChannel(name);
}

export function createTabLeader(channelName: string): TabLeader {
  const id = Math.random().toString(36).slice(2);
  let leader = false;
  let channel: ChannelLike | null = null;
  const listeners = new Set<LeaderListener>();
  const messageHandlers = new Set<(message: unknown) => void>();
  let electionTimer: ReturnType<typeof setTimeout> | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let lastHeartbeat = 0;

  function setLeader(value: boolean) {
    if (leader === value) return;
    leader = value;
    for (const listener of listeners) listener(value);
  }

  function startHeartbeat() {
    if (heartbeat) return;
    heartbeat = setInterval(() => {
      channel?.postMessage({ __type: 'heartbeat', from: id });
    }, 250);
  }

  function stopHeartbeat() {
    if (!heartbeat) return;
    clearInterval(heartbeat);
    heartbeat = null;
  }

  function elect() {
    if (electionTimer) clearTimeout(electionTimer);
    electionTimer = setTimeout(() => {
      if (Date.now() - lastHeartbeat > 400) {
        setLeader(true);
        startHeartbeat();
      }
    }, 400);
  }

  return {
    isLeader: () => leader,
    start() {
      if (channel) return;
      channel = createChannel(channelName);
      channel.onmessage = event => {
        const message = event.data as { __type?: string; from?: string };
        if (message?.__type === 'heartbeat' && message.from !== id) {
          lastHeartbeat = Date.now();
          if (leader && message.from && message.from < id) {
            setLeader(false);
            stopHeartbeat();
          }
        } else if (message?.__type === 'leader-quit') {
          elect();
        } else {
          for (const handler of messageHandlers) handler(event.data);
        }
      };
      elect();
    },
    stop() {
      if (!channel) return;
      if (leader) channel.postMessage({ __type: 'leader-quit' });
      channel.close();
      channel = null;
      stopHeartbeat();
      if (electionTimer) clearTimeout(electionTimer);
      setLeader(false);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    broadcast(message) {
      channel?.postMessage(message);
    },
    onMessage(handler) {
      messageHandlers.add(handler);
      return () => messageHandlers.delete(handler);
    },
  };
}
