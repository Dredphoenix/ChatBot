const chatHistory = document.getElementById('chatHistory');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const voiceButton = document.getElementById('voiceButton');
const attachButton = document.getElementById('attachButton');

// Configuration
const CONFIG = {
    saveHistory: true,          // Save chat history to localStorage
    maxHistoryItems: 50,        // Maximum number of messages to keep in history
    aiResponseTimeout: 15000,   // Timeout for AI responses (15 seconds)
    aiModel: "gpt-3.5-turbo",   // Model to use for OpenAI API
    aiTemperature: 0.7,         // Temperature for AI responses (0.0-1.0)
    aiMaxTokens: 150            // Maximum tokens for AI responses
};

// FAQ Database
const faqDatabase = {
    "how do i send a photo on whatsapp": {
        answer: "Here's how to send a photo on WhatsApp:",
        steps: [
            "Open the WhatsApp chat where you want to send the photo.",
            "Tap the attachment icon (paperclip or + symbol) at the bottom.",
            "Select 'Gallery' or 'Camera' depending on whether you want to send an existing photo or take a new one.",
            "Choose your photo or take a picture.",
            "Add a caption if you want (optional).",
            "Tap the send button (arrow icon)."
        ],
        image: "https://t4.ftcdn.net/jpg/05/10/86/17/360_F_510861794_VrS3F2Vq5C17vgJWrY6vrI16qWJ4BqF8.jpg"
    },
    "what is google pay": {
        answer: "Google Pay is a digital wallet and online payment system developed by Google. It allows users to:",
        steps: [
            "Make contactless payments using their Android phones, tablets, or watches.",
            "Send and receive money from friends and family.",
            "Store credit/debit cards, loyalty cards, and tickets digitally.",
            "Pay online at websites and in apps that accept Google Pay.",
            "Track your spending and view transaction history."
        ]
    },
    "how to use google maps for navigation": {
        answer: "To use Google Maps for navigation, follow these steps:",
        steps: [
            "Open the Google Maps app on your device.",
            "Enter your destination in the search bar at the top.",
            "Tap 'Directions' and choose your starting point (or use current location).",
            "Select your mode of transportation (car, public transit, walking, etc.).",
            "Tap 'Start' to begin turn-by-turn navigation.",
            "Follow the voice instructions and visual guides to reach your destination."
        ],
        image: "https://th.bing.com/th/id/OIP.3jDixoxmHPEocyCkTwbvxAHaEK?rs=1&pid=ImgDetMain"
    },
    "how to set up google pay": {
        answer: "Setting up Google Pay is simple:",
        steps: [
            "Download the Google Pay app from your app store.",
            "Open the app and sign in with your Google account.",
            "Tap 'Payment' and then the '+' button to add a payment method.",
            "Add your credit or debit card by scanning it or entering details manually.",
            "Verify your card if prompted (via SMS, email, or bank app).",
            "Once verified, your card is ready to use for payments."
        ],
        image:"https://static.vecteezy.com/system/resources/previews/014/938/359/non_2x/26-11-2022-chonburi-thailand-google-gpay-wallet-is-starting-to-use-and-is-an-application-that-combines-financial-matters-purchasing-and-shopping-online-free-photo.jpg"
    },
    "how to share location on whatsapp": {
        answer: "To share your current location on WhatsApp:",
        steps: [
            "Open the WhatsApp chat where you want to share your location.",
            "Tap the attachment icon (paperclip or + symbol).",
            "Select 'Location' from the options.",
            "Choose between 'Share live location' or 'Send your current location'.",
            "For live location, select the duration you want to share it.",
            "Tap send to share your location with the contact."
        ]
    
    }
};

// OpenAI API configuration
//const OPENAI_API_KEY = "https://api.openai.com/v1/chat/completions"; // Replace with your actual API key
const AI_ENABLED = true; // Set to true to enable AI responses (requires valid API key)



// Speech synthesis setup
let isSpeaking = false;
const synth = window.speechSynthesis;

// Initialize chat
document.addEventListener('DOMContentLoaded', () => {
    // Load any saved settings
    loadSettings();
    
    // Restore chat history if enabled
    if (CONFIG.saveHistory) {
        restoreHistory();
    }
    
    chatInput.focus();
    
    // Event listeners
    sendButton.addEventListener('click', handleUserInput);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleUserInput();
        }
    });

    voiceButton.addEventListener('click', toggleSpeech);
    attachButton.addEventListener('click', handleAttachment);
    
    // Settings panel handlers
    const settingsButton = document.getElementById('settingsButton');
    const settingsPanel = document.getElementById('settingsPanel');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const aiToggle = document.getElementById('aiToggle');
    const historyToggle = document.getElementById('historyToggle');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    
    // Set initial toggle states
    aiToggle.checked = AI_ENABLED;
    historyToggle.checked = CONFIG.saveHistory;
    
    // Toggle settings panel
    settingsButton.addEventListener('click', () => {
        settingsPanel.style.display = 
            settingsPanel.style.display === 'none' ? 'block' : 'none';
    });
    
    // Close settings panel
    closeSettingsBtn.addEventListener('click', () => {
        settingsPanel.style.display = 'none';
    });
    
    // AI toggle
    aiToggle.addEventListener('change', () => {
        AI_ENABLED = aiToggle.checked;
        localStorage.setItem('aiEnabled', AI_ENABLED);
        if (AI_ENABLED) {
            alert("AI has been enabled. Make sure your backend server is running.");
        }
    });
    
    
    // History toggle
    historyToggle.addEventListener('change', () => {
        CONFIG.saveHistory = historyToggle.checked;
        localStorage.setItem('saveHistory', CONFIG.saveHistory);
    });
    
    // Clear history button
    clearHistoryBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to clear your chat history?")) {
            localStorage.removeItem('chatHistory');
            chatHistory.innerHTML = '';
            
            // Add welcome message back
            const welcomeDiv = document.createElement('div');
            welcomeDiv.className = 'bot-bubble';
            welcomeDiv.textContent = "Hello! I'm your digital assistant. Ask me questions about WhatsApp, Google Pay, Google Maps, and more. How can I help you today?";
            chatHistory.appendChild(welcomeDiv);
            
            // Add suggestion chips
            addSuggestions();
        }
    });
    
    // Click outside to close settings
    document.addEventListener('click', (e) => {
        if (!settingsButton.contains(e.target) && 
            !settingsPanel.contains(e.target) && 
            settingsPanel.style.display === 'block') {
            settingsPanel.style.display = 'none';
        }
    });
});

// Load settings from localStorage
function loadSettings() {
    try {
        const savedSettings = JSON.parse(localStorage.getItem('chatSettings'));
        if (savedSettings) {
            // Restore voice settings
            if (savedSettings.isSpeaking) {
                isSpeaking = true;
                voiceButton.classList.add('active');
            }
        }
    } catch (error) {
        console.warn('Failed to load settings:', error);
    }
}

// Restore chat history from localStorage
function restoreHistory() {
    try {
        const history = JSON.parse(localStorage.getItem('chatHistory'));
        if (history && history.length > 0) {
            // Clear welcome message
            chatHistory.innerHTML = '';
            
            // Restore messages
            history.forEach(item => {
                const messageDiv = document.createElement('div');
                messageDiv.className = item.sender === 'user' ? 'chat-bubble user-bubble' : 'chat-bubble bot-bubble';
                
                if (item.sender === 'user') {
                    messageDiv.textContent = item.message;
                } else {
                    messageDiv.innerHTML = item.message;
                }
                
                chatHistory.appendChild(messageDiv);
            });
            
            // Add suggestions after history is restored
            addSuggestions();
            scrollToBottom();
        }
    } catch (error) {
        console.warn('Failed to restore chat history:', error);
    }
}

// Handle user suggestions
function handleSuggestion(text) {
    chatInput.value = text;
    handleUserInput();
}

// Main function to handle user input
function handleUserInput() {
    const userMessage = chatInput.value.trim();
    if (userMessage === '') return;

    // Add user message to chat
    addMessageToChat(userMessage, 'user');
    chatInput.value = '';

    // Show typing indicator
    showTypingIndicator();

    // Process after a delay to simulate thinking
    setTimeout(() => {
        processUserInput(userMessage);
    }, 1500);
}

// Process the user's input and find a response
async function processUserInput(userMessage) {
    // Convert to lowercase for case-insensitive matching
    const normalizedInput = userMessage.toLowerCase();
    
    // Find the best match in our FAQ database
    let bestMatch = findBestMatch(normalizedInput);
    
    // If we found a match in our database
    if (bestMatch) {
        // Hide typing indicator
        hideTypingIndicator();
        
        // We found a matching FAQ
        const response = constructResponse(bestMatch);
        addMessageToChat(response.html, 'bot', response.text);
        
        // Show follow-up suggestions after a response
        setTimeout(() => {
            addSuggestions();
        }, 500);
    } else {
        // No match found - Try AI if enabled
        if (AI_ENABLED) {
            try {
                // Keep typing indicator visible while waiting for AI response
                const aiResponse = await getAIResponse(userMessage);
                
                // Hide typing indicator
                hideTypingIndicator();
                
                // Add AI response to chat
                addMessageToChat(aiResponse, 'bot', aiResponse);
                
                // Show follow-up suggestions after AI response
                setTimeout(() => {
                    addSuggestions();
                }, 500);
            } catch (error) {
                console.error("AI error:", error);
                // Fall back to default responses if AI fails
                useDefaultFallback();
            }
        } else {
            // AI not enabled, use default fallback
            hideTypingIndicator();
            useDefaultFallback();
        }
    }
}

// Default fallback responses when no match is found and AI is not used
function useDefaultFallback() {
    const fallbackResponses = [
        "I'm not sure I understand. Could you rephrase your question?",
        "I don't have information on that topic yet. I can help with WhatsApp, Google Pay, and Google Maps questions.",
        "I couldn't find an exact answer to your question. Would you like to know about sending photos on WhatsApp, Google Pay, or Google Maps navigation instead?"
    ];
    const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    addMessageToChat(randomResponse, 'bot');
    
    // Always show suggestions after fallback
    setTimeout(() => {
        addSuggestions();
    }, 500);
}

// Find the best matching FAQ for the user's input
function findBestMatch(userInput) {
    // Simple fuzzy matching algorithm
    for (const [key, value] of Object.entries(faqDatabase)) {
        // Exact match
        if (userInput === key) {
            return value;
        }
        
        // Contains all words (in any order)
        const keyWords = key.split(' ');
        let allWordsFound = true;
        
        for (const word of keyWords) {
            // Skip very short words for matching
            if (word.length <= 2) continue;
            
            // Check if the word is in the user input (allowing for minor typos)
            const found = fuzzyMatch(userInput, word);
            if (!found) {
                allWordsFound = false;
                break;
            }
        }
        
        if (allWordsFound) {
            return value;
        }
    }
    
    return null;
}

// Simple fuzzy matching to handle minor typos and variations
function fuzzyMatch(text, word) {
    if (text.includes(word)) return true;
    
    // Allow for one character difference (very simple edit distance)
    for (let i = 0; i < word.length; i++) {
        const typo = word.substring(0, i) + word.substring(i + 1);
        if (text.includes(typo)) return true;
    }
    
    return false;
}

// Construct HTML response from FAQ data
function constructResponse(faqItem) {
    let html = `<p>${faqItem.answer}</p>`;
    let plainText = faqItem.answer + " ";
    
    if (faqItem.steps && faqItem.steps.length > 0) {
        html += '<ol class="steps-list">';
        for (const step of faqItem.steps) {
            html += `<li>${step}</li>`;
            plainText += step + ". ";
        }
        html += '</ol>';
    }
    
    if (faqItem.image) {
        html += `<img src="${faqItem.image}" alt="Instructional image" />`;
    }
    
    return { html, text: plainText };
}

// Add a message to the chat history
function addMessageToChat(message, sender, speakText = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = sender === 'user' ? 'chat-bubble user-bubble' : 'chat-bubble bot-bubble';
    
    // For user messages, just set the text
    if (sender === 'user') {
        messageDiv.textContent = message;
    } else {
        // For bot messages, we might have HTML content
        messageDiv.innerHTML = message;
    }
    
    chatHistory.appendChild(messageDiv);
    scrollToBottom();
    
    // If it's a bot message and we should speak it
    if (sender === 'bot' && isSpeaking && speakText) {
        speak(speakText);
    }
    
    // Save to history if enabled
    if (CONFIG.saveHistory) {
        saveMessageToHistory(message, sender);
    }
}

// Save message to localStorage history
function saveMessageToHistory(message, sender) {
    try {
        // Get existing history or create new array
        let history = JSON.parse(localStorage.getItem('chatHistory')) || [];
        
        // Add new message
        history.push({
            message: message,
            sender: sender,
            timestamp: new Date().toISOString()
        });
        
        // Limit history size
        if (history.length > CONFIG.maxHistoryItems) {
            history = history.slice(-CONFIG.maxHistoryItems);
        }
        
        // Save back to localStorage
        localStorage.setItem('chatHistory', JSON.stringify(history));
    } catch (error) {
        console.warn('Failed to save chat history:', error);
    }
}

// Show typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typingIndicator';
    
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'typing-dot';
        typingDiv.appendChild(dot);
    }
    
    chatHistory.appendChild(typingDiv);
    scrollToBottom();
}

// Hide typing indicator
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Add suggestion chips
function addSuggestions() {
    // Don't add suggestions if they're already present at the bottom
    const lastElement = chatHistory.lastElementChild;
    if (lastElement && lastElement.className === 'suggestions') {
        return;
    }
    
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'suggestions';
    
    // Random different suggestions each time
    const allSuggestions = Object.keys(faqDatabase);
    const shuffled = allSuggestions.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(3, shuffled.length));
    
    for (const suggestion of selected) {
        const chip = document.createElement('div');
        chip.className = 'suggestion-chip';
        chip.textContent = suggestion.charAt(0).toUpperCase() + suggestion.slice(1) + '?';
        chip.addEventListener('click', () => handleSuggestion(chip.textContent));
        suggestionsDiv.appendChild(chip);
    }
    
    chatHistory.appendChild(suggestionsDiv);
    scrollToBottom();
}

// Scroll chat to bottom
function scrollToBottom() {
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Toggle speech functionality
function toggleSpeech() {
    isSpeaking = !isSpeaking;
    voiceButton.classList.toggle('active', isSpeaking);
    
    // Save setting
    try {
        localStorage.setItem('chatSettings', JSON.stringify({ isSpeaking }));
    } catch (error) {
        console.warn('Failed to save settings:', error);
    }
    
    if (isSpeaking) {
        // Visual feedback
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'bot-bubble';
        feedbackDiv.textContent = "Voice output is now enabled. I'll read my responses aloud.";
        chatHistory.appendChild(feedbackDiv);
        scrollToBottom();
        
        // Speak the feedback
        speak("Voice output is now enabled. I'll read my responses aloud.");
    } else {
        // Stop any ongoing speech
        synth.cancel();
        
        // Visual feedback
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'bot-bubble';
        feedbackDiv.textContent = "Voice output is now disabled.";
        chatHistory.appendChild(feedbackDiv);
        scrollToBottom();
    }
}

// Text-to-speech function
function speak(text) {
    // Cancel any ongoing speech
    synth.cancel();
    
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set properties
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Speak
    synth.speak(utterance);
}

// Handle file attachments
function handleAttachment() {
    // Create a hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    // Add to document and trigger click
    document.body.appendChild(fileInput);
    fileInput.click();
    
    // Handle file selection
    fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files[0]) {
            // Show a message that we received the file
            const fileName = fileInput.files[0].name;
            addMessageToChat(`I've attached: ${fileName}`, 'user');
            
            // Process after a delay
            showTypingIndicator();
            setTimeout(() => {
                hideTypingIndicator();
                addMessageToChat(`I see you've uploaded "${fileName}". Currently, I can't analyze images, but you can ask me questions about WhatsApp, Google Pay, or Google Maps!`, 'bot');
                
                // Show suggestions
                setTimeout(() => {
                    addSuggestions();
                }, 500);
            }, 1500);
        }
        
        // Clean up
        document.body.removeChild(fileInput);
    });
}

// Enhance accessibility - announce new messages to screen readers
function announceToScreenReader(message) {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.classList.add('sr-only');
    document.body.appendChild(announcer);
    
    setTimeout(() => {
        announcer.textContent = message;
        
        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(announcer);
        }, 1000);
    }, 100);
}

// Get AI response from OpenAI API
// async function getAIResponse(userMessage) {
//     try {
//         const response = await fetch("http://localhost:3000/chat", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({ message: userMessage })
//         });

//         const data = await response.json();

//         // Defensive check: log full response
//         console.log("Backend reply:", data);

//         if (data && data.reply) {
//             return `<p>${data.reply}</p>`;
//         } else {
//             return "<p>Sorry, I didn't get a valid response from the AI server.</p>";
//         }
//     } catch (error) {
//         console.error("Proxy server error:", error);
//         return "<p>Sorry, I couldn't reach the AI server. Please try again later.</p>";
//     }
// }

async function getAIResponse(userMessage) {
    try {
        const response = await fetch("http://localhost:3000/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: userMessage })
        });

        const data = await response.json();
        console.log("Backend reply:", data);

        if (data && data.reply) {
            return `<p>${data.reply}</p>`;
        } else {
            return "<p>Sorry, I didn't get a valid response from the AI server.</p>";
        }
    } catch (error) {
        console.error("AI fetch error:", error);
        return "<p>Sorry, I couldn't connect to the AI server.</p>";
    }
}

// Function to load FAQ data from JSON file or API
function loadFAQData(url) {
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load FAQ data: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Merge with existing FAQ database
            Object.assign(faqDatabase, data);
            console.log("FAQ database updated with external data");
            return true;
        })
        .catch(error => {
            console.error("Error loading FAQ data:", error);
            return false;
        });
}

// Example of extending FAQ database from external source
// Uncomment to use - put your JSON file URL here

document.addEventListener('DOMContentLoaded', () => {
    loadFAQData('path/to/your/faq-data.json');
});