const API_URL = 'http://localhost:3000/ollama'; // Make sure this matches your backend server URL
const footer = document.querySelector("footer");
const main = document.querySelector("main");

window.addEventListener("scroll", function() {
  if (window.scrollY > main.offsetHeight) {
    footer.style.display = "none";
  } else {
    footer.style.display = "block";
  }
});

async function sendMessage() {
    const userInput = document.getElementById('user-input').value;
    if (!userInput) return;

    displayUserMessage(userInput, 'user');
    document.getElementById('user-input').value = ''; // Clear input field after sending message
    try {
        const chatContainer = document.getElementById('chat-window');
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message-bot')
        chatContainer.appendChild(messageDiv);
        const eventSource = new EventSource(`http://localhost:3000/ollama?message=${userInput}`);

        // Handle incoming messages from the server
        eventSource.onmessage = function(event) {
            if(event.data=== "END OF STREAM") {
                addVoiceButton(messageDiv);
                return
            }
            displayMessage(event.data,messageDiv)

        };

        // Handle errors or if the connection is closed
        eventSource.onerror = function(err) {
            console.log("inside onerror")
            eventSource.close(); // Close the connection on error
        };

    } catch (error) {
        console.error('Error communicating with the backend server:', error);
    }


}
function addVoiceButton(parent) {
    const playButton = document.createElement('button');
    playButton.innerText = '🔊';
    playButton.classList.add('play-button');
    playButton.onclick = () => speakText(parent.innerHTML);  // Trigger TTS on click
    parent.appendChild(playButton);
}
function speakText(text) {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'en-US'; // Set language, adjust if needed
    speech.rate = 1; // Set speed, adjust if needed
    window.speechSynthesis.speak(speech);
}

function displayMessage(text, parent) {
    const chatContainer = document.getElementById('chat-window');
    parent.innerHTML += text;
    chatContainer.scrollTop = chatContainer.scrollHeight; // Auto-scroll to the bottom
}
function Initialize(sender) {
    const chatContainer = document.getElementById('chat-window');
    const messageDiv = document.createElement('div');
    if (sender === 'user') {
        messageDiv.classList.add('chat-message-user')
    }
    else {
        messageDiv.classList.add('chat-message-bot')
    }
    chatContainer.appendChild(messageDiv);
    return messageDiv;
}
function displayUserMessage(text, sender) {
    const chatContainer = document.getElementById('chat-window');
    const messageDiv = document.createElement('div');
    if (sender === 'user') {
        messageDiv.classList.add('chat-message-user')
    }
    else {
        messageDiv.classList.add('chat-message-bot')
    }
    messageDiv.innerHTML = text;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight; // Auto-scroll to the bottom
}

document.getElementById('send-button').addEventListener('click', sendMessage);
document.getElementById('user-input').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});

// Function to handle PDF display
function handlePDFDisplay(pdfPath) {
    // Option 1: Open PDF in new window/tab
    window.open(pdfPath, '_blank');
    
    // OR Option 2: Display PDF in a modal
    const modal = document.createElement('div');
    modal.className = 'pdf-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <embed src="${pdfPath}" type="application/pdf" width="100%" height="100%">
        </div>
    `;
    document.body.appendChild(modal);
    
    // Close modal functionality
    const closeButton = modal.querySelector('.close-button');
    closeButton.onclick = () => modal.remove();
}

// Add click event listeners to all buttons
document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.grid-items button');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const pdfPath = button.getAttribute('data-pdf');
            if (pdfPath) {
                handlePDFDisplay(pdfPath);
            } else {
                console.warn('No PDF path specified for this button');
            }
        });
    });
});