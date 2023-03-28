<script>
  import Svelecte from '../../src/Svelecte.svelte';
  import { dataset } from './data.js';

  let options = dataset.countries();

  let selection = null;
  let value = 'cz';

  setTimeout(() => {
    value = 'de';
  }, 4000);
</script>

<style lang="scss">
  .outer {
    overflow: scroll;
    width: 200px;
    border: 2px solid red;
    height: 800px;
  }
  .container {
    display: grid;
    gap: 90px;
    width: 300px;
    height: 4000px;
  }
</style>

<div class="outer">
  <div class="container">
  <div>1<Svelecte inputId={1} {options} 
    bind:readSelection={selection}
    bind:value={value}
    placeholder="Select country" /></div>
  <div>2<Svelecte inputId={2} {options} 
    bind:readSelection={selection}
    bind:value={value}
    placeholder="Select country" /></div>
  <div>3<Svelecte inputId={3} {options} 
    bind:readSelection={selection}
    bind:value={value}
    placeholder="Select country" /></div>
  <div>4<Svelecte inputId={4} {options} 
    bind:readSelection={selection}
    bind:value={value}
    placeholder="Select country" /></div>
  <div>5<Svelecte inputId={5} {options} 
    bind:readSelection={selection}
    bind:value={value}
    placeholder="Select country" /></div>
  <div>6<Svelecte inputId={6} {options} 
    bind:readSelection={selection}
    bind:value={value}
    placeholder="Select country" /></div>
</div>
</div>
