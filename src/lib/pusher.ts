import Pusher from 'pusher-js';

class PusherService {
  private pusher: Pusher | null = null;
  private channel: any = null;

  connect() {
    if (!this.pusher) {
      this.pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      });
    }
    return this.pusher;
  }

  subscribeToChannel(channelName: string) {
    if (!this.pusher) {
      this.connect();
    }
    this.channel = this.pusher!.subscribe(channelName);
    return this.channel;
  }

  unsubscribeFromChannel(channelName: string) {
    if (this.pusher) {
      this.pusher.unsubscribe(channelName);
    }
  }

  disconnect() {
    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
      this.channel = null;
    }
  }

  getChannel() {
    return this.channel;
  }
}

export const pusherService = new PusherService();