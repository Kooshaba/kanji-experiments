console.log('[English Helper] extension loaded');

document.addEventListener('mouseup', async () => {
  const selectedText = getSelectedText();
  if (selectedText) {
    // Call OpenAI API to translate the text
    const translatedText = await translateToJapanese(selectedText);

    let popup = document.getElementById('text-popup');
    if (!popup) {
      popup = document.createElement('div');
      popup.id = 'text-popup';
      popup.style.position = 'absolute';
      popup.style.backgroundColor = 'white';
      popup.style.color = 'black';
      popup.style.border = '1px solid black';
      popup.style.padding = '5px';

      // Create the close button
      const closeButton = document.createElement('button');
      closeButton.textContent = 'X';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '5px';
      closeButton.style.right = '5px';
      closeButton.onclick = () => {
        popup.style.display = 'none';
      };

      popup.appendChild(closeButton);
      document.body.appendChild(popup);
    }

    // Display the translated text
    popup.textContent = translatedText;

    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    popup.style.left = `${rect.left + window.scrollX}px`;
    popup.style.top = `${rect.bottom + window.scrollY}px`;
    popup.style.display = 'block';
  } else {
    const popup = document.getElementById('text-popup');
    if (popup) {
      popup.style.display = 'none';
    }
  }
});

// Function to call OpenAI API
async function translateToJapanese(text) {
  const apiKey = await getApiKey();
  if (!apiKey) {
    alert('API Key is not set. Please enter your API Key.');
    return;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that helps a native English speaker learn Japanese. You respond in English intended for use by a native English speaker. You are a native English speaker. You explain Japanese words, grammar, phrases, and culture found in the text provided to you.' },
        { role: 'user', content: `Translate the following Japanese into English: "${text}". Break down key words and phrases and provide context. Provide examples of how to use the words and phrases in context.
        Provide a list of Kanji characters used in the text. Include meanings and readings. I can read Hiragana and Katakana.
        ` }
      ],
      max_tokens: 500
    })
  });

  const responseData = await response.json();
  return responseData.choices[0].message.content.trim();
}

function getSelectedText() {
  const selection = window.getSelection();
  return selection.toString().trim();
}

function getApiKey() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get('openai_api_key', (data) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(data.openai_api_key);
      }
    });
  });
}
