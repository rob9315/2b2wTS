<script lang="ts">
  import Particles from 'svelte-particles';
  import io from 'socket.io-client';
  const socket = io('/'); //.connect();
  let status: {
    state: 'idle' | 'condition' | 'auth' | 'connected' | 'afk' | 'reconnecting' | 'queue';
    queue?: {
      position: number;
      length: number;
      eta: number;
    };
  };
  socket.on('message', (s) => (status = s));
</script>

<div id="tsparticles">
  <Particles id="tsparticles" url="/particles.json" />
</div>

<div>
  <h1>2b2wTS</h1>
  <h2>"{status?.state}"</h2>
  {#if status?.queue}
    {status.queue.position}<br />{status.queue.length}<br />
    {Math.floor(status.queue.eta / 360)}:{Math.floor((status.queue.eta / 60) % 60)}h
  {/if}
</div>

<style lang="scss">
  #tsparticles {
    background: #111;
    height: 100%;
    width: 100%;
    top: 0;
    left: 0;
    position: absolute;
    overflow: hidden;
  }
</style>
