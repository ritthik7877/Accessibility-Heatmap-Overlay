async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error('No active browser tab was found.');
  return tab;
}

async function sendToActivePage(message) {
  const tab = await getActiveTab();
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['assets/content.js'] });
  return { tab, response: await chrome.tabs.sendMessage(tab.id, message) };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'SCAN_UPDATED') return false;
  if (message?.type === 'SCAN_ACTIVE_TAB') {
    sendToActivePage({ type: 'SCAN' })
      .then(({ tab, response }) => sendResponse({
        ...response,
        page: { url: response.page?.url || tab.url || '', title: response.page?.title || tab.title || '' },
      }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === 'GET_ACTIVE_STATE') {
    sendToActivePage({ type: 'GET_STATE' })
      .then(({ tab, response }) => sendResponse({
        ...response,
        page: { url: response.page?.url || tab.url || '', title: response.page?.title || tab.title || '' },
      }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === 'PAGE_COMMAND') {
    sendToActivePage(message.command)
      .then(({ response }) => sendResponse(response))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  return false;
});
