// Import necessary modules
import axios from "axios";

// Define the AnkiConnect API URL
const ANKI_CONNECT_URL = "http://localhost:8765";

// Updated function to add a card to a local Anki deck
export async function addCard(
  deckName: string,
  front: string,
  back: string
): Promise<void> {
  try {
    const response = await axios.post(ANKI_CONNECT_URL, {
      action: "addNote",
      version: 6,
      params: {
        note: {
          deckName: deckName,
          modelName: "Basic",
          fields: {
            Front: front,
            Back: back,
          },
          tags: [],
        },
      },
    });

    if (response.data.error) {
      console.error("Error adding card:", response.data.error);
    } else {
      console.log("Card added successfully:", response.data.result);
    }
  } catch (error) {
    console.error("Error connecting to Anki:", error);
  }
}
