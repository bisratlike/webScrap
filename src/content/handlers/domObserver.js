/**
 * DOM mutation observer handler
 * @module domObserver
 */

/** @type {MutationObserver|null} */
let observer = null;
const nodeAddedCallbacks = [];
const nodeRemovedCallbacks = [];

/**
 * Starts observing DOM mutations
 * @param {Function} [callback] - Called for any mutation
 */
export function startObserving(callback) {
  if (observer) return;
  observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (callback) callback(mutation);
      mutation.addedNodes.forEach(node => {
        nodeAddedCallbacks.forEach(cb => cb(node, mutation));
      });
      mutation.removedNodes.forEach(node => {
        nodeRemovedCallbacks.forEach(cb => cb(node, mutation));
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * Stops the observer
 */
export function stopObserving() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

/**
 * Registers a callback for added nodes
 * @param {Function} callback
 */
export function onNodeAdded(callback) {
  nodeAddedCallbacks.push(callback);
}

/**
 * Registers a callback for removed nodes
 * @param {Function} callback
 */
export function onNodeRemoved(callback) {
  nodeRemovedCallbacks.push(callback);
}
