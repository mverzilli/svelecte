<script>
  import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte';
  import VirtualList from 'svelte-tiny-virtual-list';

  export let lazyDropdown;
  export let creatable;
  export let maxReached = false;
  export let dropdownIndex = 0;
  export let renderer;
  export let disableHighlight;
  export let items= [];
  export let alreadyCreated;
  export let virtualList;
  export let vlItemSize;
  export let vlHeight;
  /** internal props */
  export let inputValue;  // value only, not store
  export let multiple;
  export let listIndex;
  export let hasDropdownOpened;
  export let listMessage;
  export let disabledField;
  export let createLabel;
  export let metaKey;
  export let itemComponent;
  export let selection = null;
  export let control;

  export function getDimensions() {
    if (virtualList) {
      return [
        scrollContainer.offsetHeight,
        vl_itemSize
      ];
    }
    return [
      scrollContainer.offsetHeight,
      container.firstElementChild.offsetHeight
    ];
  }

  const dispatch = createEventDispatcher();

  let dim;
  let dropdown;
  let outOfViewport;
  let container;
  let scrollContainer;
  let isMounted = false;
  let hasEmptyList = false;
  let renderDropdown = !lazyDropdown;
  $: currentListLength = items.length; 

  let vl_height = vlHeight;
  let vl_itemSize = vlItemSize;
  $: vl_listHeight = Math.min(vl_height, Array.isArray(vl_itemSize) 
    ? vl_itemSize.reduce((res, num) => {
      res+= num;
      return res;
    }, 0)
    : items.length * vl_itemSize
  );
  let vl_autoMode = vlHeight === null && vlItemSize === null;
  let refVirtualList;

  $: {
    hasEmptyList = items.length < 1 && (creatable 
      ? !inputValue
      : true
    );
    // required when changing item list 'on-the-fly' for VL
    if (virtualList && vl_autoMode && isMounted && renderDropdown) {
      if (hasEmptyList) dropdownIndex = null;
      vl_itemSize = 0;
      tick()
        .then(virtualListDimensionsResolver)
        .then(positionDropdown);
    }
  }

  function positionDropdown() {
    if(!document.body.contains(dropdown) || !control) return
    const controlBounds = control.getBoundingClientRect();
    const dropdownBounds = dropdown.getBoundingClientRect();
    if(outOfViewport === undefined) {
      outOfViewport = controlBounds.bottom + dropdownBounds.height > window.innerHeight;
    }
    dropdown.setAttribute("style", `
      top: ${controlBounds.bottom - (outOfViewport? controlBounds.height + dropdownBounds.height : 0)}px;
      left: ${controlBounds.left}px;
      width: ${controlBounds.width}px;`)
  }

  function virtualListDimensionsResolver() {
    if (!refVirtualList) return;
    const pixelGetter = (el, prop) => {
      const styles = window.getComputedStyle(el);
      let { groups: { value, unit } } = styles[prop].match(/(?<value>\d+)(?<unit>[a-zA-Z]+)/);
      value = parseFloat(value);
      if (unit !== 'px') {
        const el = unit === 'rem'
          ? document.documentElement
          : scrollContainer.parentElement.parentElement;
        const multipler = parseFloat(window.getComputedStyle(el).fontSize.match(/\d+/).shift());
        value = multipler * value; 
      }
      return value;
    }
    vl_height = pixelGetter(scrollContainer, 'maxHeight')
      - pixelGetter(scrollContainer, 'paddingTop')
      - pixelGetter(scrollContainer, 'paddingBottom');
    // get item size (hacky style)
    scrollContainer.parentElement.style = 'opacity: 0; display: block';
    const firstItem = refVirtualList.$$.ctx[1].firstElementChild.firstElementChild;
    if (firstItem) {

      firstItem.style = '';
      const firstSize = firstItem.getBoundingClientRect().height;
      const secondItem = refVirtualList.$$.ctx[1].firstElementChild.firstElementChild.nextElementSibling;
      let secondSize;
      if (secondItem) {
        secondItem.style = '';
        secondSize = secondItem.getBoundingClientRect().height;
      }
      if (firstSize !== secondSize) {
        const groupHeaderSize = items[0].$isGroupHeader ? firstSize : secondSize;
        const regularItemSize = items[0].$isGroupHeader ? secondSize : firstSize;
        vl_itemSize = items.map(opt => opt.$isGroupHeader ? groupHeaderSize : regularItemSize);
      } else {
        vl_itemSize = firstSize;
      }
    }
    scrollContainer.parentElement.style = '';
  }

  const appendDropdown = () => {
    if(!control) control = dropdown.parentElement;
    if(document?.body) {
      control.scrollIntoView({ block: "nearest", inline: "nearest" });
      document.body.appendChild(dim);
      document.body.appendChild(dropdown);
    }
  }

  const removeDropdown = () => {
    if(document?.body.contains(dim)) document.body.removeChild(dim);
    if(document?.body.contains(dropdown)) document.body.removeChild(dropdown);
  }

  const disableScroll = () => {
    if (!window) return;
    const scrollTop = window.pageYOffset || window.document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || window.document.documentElement.scrollLeft;
    window.onscroll = () => window.scrollTo(scrollLeft, scrollTop);
  }

  const enableScroll = () => {
    if (!window) return;
    window.onscroll = () => {};
  }

  const resizeHandler = () => {
    hasDropdownOpened.set(false);
  }

  let dropdownStateSubscription = () => {};

  onMount(() => {
    dropdownStateSubscription = hasDropdownOpened.subscribe(val => {
      if (!renderDropdown && val) renderDropdown = true;
      window.removeEventListener("resize", resizeHandler)
      enableScroll();
      tick().then(() => {
        if(val) {
          window.addEventListener("resize", resizeHandler)
          disableScroll();
          appendDropdown();
          positionDropdown(true);
        } else {
          outOfViewport = undefined;
          removeDropdown();
        }
      });
    });
    isMounted = true;
  });

  onDestroy(() => {
    dropdownStateSubscription();
    removeDropdown();
  })
</script>

{#if isMounted && renderDropdown}
<div bind:this={dim} class="dim" />
<div bind:this={dropdown} class="sv-dropdown" class:is-virtual={virtualList} aria-expanded={$hasDropdownOpened}
  on:mousedown|preventDefault
>
  {#if selection}
  <div class="sv-content has-multiSelection alwaysCollapsed-selection">
    {#each selection as opt, i (i)}
      <svelte:component this={itemComponent} formatter={renderer} item={opt} isSelected={true} on:deselect isMultiple={multiple} {inputValue}/>
    {/each}
  </div>
  {/if}
  <div class="sv-dropdown-scroll" class:is-empty={!items.length}  bind:this={scrollContainer} tabindex="-1" >
    <div class="sv-dropdown-content" bind:this={container} class:max-reached={maxReached}>
    {#if items.length}
      {#if virtualList}
        <VirtualList bind:this={refVirtualList}
          width="100%"
          height={vl_listHeight}
          itemCount={items.length}
          itemSize={vl_itemSize}
          scrollToAlignment="auto"
          scrollToIndex={!multiple && dropdownIndex ? parseInt(dropdownIndex) : null}
        >
          <div slot="item" let:index let:style {style}
            class="sv-dd-item"
            class:sv-dd-item-active={index == dropdownIndex}
            class:sv-group-item={items[index].$isGroupItem}
            class:sv-group-header={items[index].$isGroupHeader}
          >
            <svelte:component this={itemComponent} formatter={renderer}
              index={listIndex.map[index]}
              isDisabled={items[index][disabledField]}
              item={items[index]}
              {inputValue}
              {disableHighlight}
              on:hover
              on:select/>
          </div>
        </VirtualList>
      {:else}
        {#each items as opt, i}
          <div data-pos={listIndex.map[i]}
            class="sv-dd-item"
            class:sv-dd-item-active={listIndex.map[i] == dropdownIndex}
            class:sv-group-item={opt.$isGroupItem}
            class:sv-group-header={opt.$isGroupHeader}
          >
            <svelte:component this={itemComponent} formatter={renderer}
              index={listIndex.map[i]}
              isDisabled={opt[disabledField]}
              item={opt}
              {inputValue}
              {disableHighlight}
              on:hover
              on:select/>
          </div>
        {/each}
      {/if}
    {/if}
    {#if hasEmptyList || maxReached}
      <div class="empty-list-row">{listMessage}</div>
    {/if}
    </div>
  </div> <!-- scroll container end -->
  {#if inputValue && creatable && !maxReached}
    <div class="creatable-row-wrap">
      <div class="creatable-row" on:click={dispatch('select', inputValue)} on:mouseenter={dispatch('hover', listIndex.last)}
        class:active={currentListLength == dropdownIndex}
        class:is-disabled={alreadyCreated.includes(inputValue)}
        on:keypress={() => {}}
      >
      {@html createLabel(inputValue)}
      {#if currentListLength != dropdownIndex}
        <span class="shortcut"><kbd>{metaKey}</kbd>+<kbd>Enter</kbd></span>
      {/if}
      </div>
    </div>
  {/if}
</div>
{/if}

<style>
.dim {
  content: '';
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999;
  background-color: transparent;
}
.sv-dropdown {
  box-sizing: border-box;
  position: fixed;
  background-color: var(--sv-bg);
  width: 100%;
  display: none;
  overflow-y: auto;
  overflow-x: hidden;
  border: 1px solid rgba(0,0,0,0.15);
  border-radius: .25rem;
  box-shadow: var(--sv-dropdown-shadow);
  z-index: 1000;
}
.sv-dropdown.is-virtual .sv-dropdown-scroll {
  overflow-y: hidden;
}
.sv-dropdown-scroll {
  /* min-height: 40px; */
  padding: 4px;
  box-sizing: border-box;
  max-height: var(--sv-dropdown-height);
  overflow-y: auto;
  overflow-x: hidden;
  
}
.sv-dropdown-scroll.is-empty {
  padding: 0;
}
.sv-dropdown[aria-expanded="true"] { display: block; }
.sv-dropdown-content.max-reached { opacity: 0.75; cursor: not-allowed; }

.sv-dropdown-scroll:not(.is-empty) + .creatable-row-wrap {
  border-top: 1px solid #efefef;
}
.creatable-row-wrap {
  padding: 4px;
}
.creatable-row {
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 2px;
  padding: 3px 3px 3px 6px;
}
.creatable-row:hover,
.creatable-row:active,
.creatable-row.active {
  background-color: var(--sv-item-active-bg);
}
.creatable-row.active.is-disabled {
  opacity: 0.5;
  background-color: rgb(252, 186, 186);
}
.creatable-row.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.shortcut {
  display: flex;
  align-items: center;
  align-content: center;
}
.shortcut > kbd {
    border: 1px solid #efefef;
    border-radius: 4px;
    padding: 0px 6px;
    margin: -1px 0;
    background-color: white;
    line-height: 1.6;
    height: 22px;
}

.empty-list-row {
  min-width: 0px;
  box-sizing: border-box;
  border-radius: 2px;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-sizing: border-box;
  border-radius: 2px;
  overflow: hidden;
  padding: 7px 7px 7px 10px;
  text-align: left;
}
.alwaysCollapsed-selection.has-multiSelection {
  padding: 4px 4px 0;
  display: flex;
  flex-wrap: wrap;
}
</style>