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
  .container {
    margin: 100px;
    width: 300px;
    height: 150px;
    overflow: scroll;
  }
</style>

<div class="container">
  <Svelecte {options} 
  inputId="country"
  bind:readSelection={selection}
  bind:value={value}
  placeholder="Select country"
></Svelecte>

</div>
