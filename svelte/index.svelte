<script lang="ts">
  import io from 'socket.io-client';
  const socket = io('/').connect();
  let status: {
    state: 'idle' | 'condition' | 'auth' | 'connected' | 'afk' | 'reconnecting' | 'queue';
    queue?: {
      position: number;
      length: number;
      eta: number;
    };
  };
  socket.on('update', (s) => {
    console.log(s);
    status = s;
  });
</script>

<div>
  <h1>2b2wTS</h1>
  <h2>"{status?.state}"</h2>
  {#if status?.queue}
    {status.queue.position}/{status.queue.length}<br />
    {`${Math.floor(status.queue.eta / 3600)}:`.padStart(3, '0') + `${Math.floor((status.queue.eta / 60) % 60)}`.padStart(2, '0')}h
  {/if}
</div>
