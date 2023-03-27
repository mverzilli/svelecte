
import BasicExample from './src/01-basic.svelte';

[BasicExample]
  .forEach(
    (component, index) => new component({
      target: document.getElementById(`example-${index +1}`),
    })
  );

/** FETCH example sources */
const promises = [];
document.querySelectorAll('pre[data-src]')
  .forEach(codeBlock => promises.push(
    fetch(`src/${codeBlock.dataset.src}.svelte`)
      .then(resp => resp.text())
      .then(html => {
        const codeEl = document.createElement('code');
        codeEl.className = 'svelte';
        codeEl.innerText = html.replaceAll(/(<\/?script>)/g, '<!-- $1 -->');;
        codeBlock.appendChild(codeEl);
      })
  ));
Promise.all(promises).then(() => hljs.highlightAll());
