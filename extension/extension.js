console.log('[English Helper] extension.js loaded');

document.getElementById('api-key-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const apiKey = document.getElementById('api-key').value;
  chrome.storage.sync.set({ openai_api_key: apiKey }, () => {
    alert('[English Helper] API Key saved.');
    window.close();
  });
});