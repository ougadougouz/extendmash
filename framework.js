/**
 * Chat Logger Extension
 * 
 * An extension for the Menu Extension Framework that adds chat logging functionality.
 */

// Create the Chat Logger module
const ChatLogger = {
  logContainer: null,
  
  /**
   * Initialize the chat logger
   */
  init: function() {
    // Create log container
    this.logContainer = document.createElement('div');
    this.logContainer.id = 'chat-log-container';
    this.logContainer.style.display = 'none';
    document.body.appendChild(this.logContainer);
    
    // Hook into the chat system
    this.hookChatSystem();
    
    console.log('Chat Logger initialized');
    
    // Create a page with chat options
    window.GameMenuExtension.addPage('Chat Options', [
      {
        id: 'download-chat',
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>',
        text: 'Download Chat',
        keybind: 'D',
        onClick: function() {
          console.log('Download chat button clicked');
          ChatLogger.downloadLog();
        }
      },
      {
        id: 'clear-chat',
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>',
        text: 'Clear Chat',
        keybind: 'C',
        onClick: function() {
          console.log('Clear chat button clicked');
          ChatLogger.clearLog();
        }
      }
    ]);
    
    return true;
  },
  
  /**
   * Hook into the game's chat system
   */
  hookChatSystem: function() {
    if (typeof UI !== 'undefined' && UI.addChatLine) {
      const originalAddChatLine = UI.addChatLine;
      
      // Override the addChatLine function
      UI.addChatLine = (player, text, chatType) => {
        // Call the original function
        originalAddChatLine.call(UI, player, text, chatType);
        
        // Log the message
        this.logMessage(player, text, chatType);
      };
      
      console.log('Successfully hooked into chat system');
    } else {
      console.error('UI.addChatLine not found, chat logging not available');
    }
  },
  
  /**
   * Log a chat message
   * @param {Object} player - Player object
   * @param {string} text - Message text
   * @param {number} chatType - Chat type (0: normal, 1: whisper to, 2: whisper from, 3: team)
   */
  logMessage: function(player, text, chatType) {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let typeText = '';
    
    switch(chatType) {
      case 1:
        typeText = 'WHISPER_TO';
        break;
      case 2:
        typeText = 'WHISPER_FROM';
        break;
      case 3:
        typeText = 'TEAM';
        break;
      default:
        typeText = '';
    }
    
    const playerName = player ? player.name : 'Unknown';
    const logEntry = document.createElement('div');
    logEntry.setAttribute('data-timestamp', timestamp);
    logEntry.setAttribute('data-player', playerName);
    logEntry.setAttribute('data-type', typeText);
    logEntry.setAttribute('data-text', text);
    this.logContainer.appendChild(logEntry);
  },
  
  /**
   * Clear the chat log
   */
  clearLog: function() {
    console.log('Clearing chat log...');
    this.logContainer.innerHTML = '';
    alert('Chat log cleared');
  },
  
  /**
   * Download the chat log
   */
  downloadLog: function() {
    console.log('Attempting to download chat log...');
    
    const entries = this.logContainer.querySelectorAll('div');
    if (entries.length === 0) {
      console.log('No logged entries found, falling back to DOM extraction');
      return this.downloadCurrentChat();
    }
    
    const messages = [];
    entries.forEach(entry => {
      const timestamp = entry.getAttribute('data-timestamp');
      const player = entry.getAttribute('data-player');
      const type = entry.getAttribute('data-type');
      const text = entry.getAttribute('data-text');
      
      let formattedMessage = '';
      if (type) {
        formattedMessage = `[${timestamp}] [${type}] ${player}: ${text}`;
      } else {
        formattedMessage = `[${timestamp}] ${player}: ${text}`;
      }
      
      messages.push(formattedMessage);
    });
    
    console.log(`Found ${messages.length} messages to download`);
    this.downloadTextFile(messages.join('\n'), `game-chat-log-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`);
  },
  
  /**
   * Download the current chat visible in the DOM
   */
  downloadCurrentChat: function() {
    console.log('Downloading current chat from DOM...');
    const chatLines = document.getElementById('chatlines');
    if (!chatLines) {
      console.error('Chat container not found');
      alert('Chat container not found');
      return;
    }
    
    const messages = [];
    const chatDivs = chatLines.querySelectorAll('div.line');
    
    chatDivs.forEach(div => {
      let sender = '';
      let message = '';
      let tag = '';
      
      // Extract tag if exists (whisper, etc)
      const tagElement = div.querySelector('.tag');
      if (tagElement) {
        tag = tagElement.textContent;
      }
      
      // Extract sender name
      const nickElement = div.querySelector('.nick');
      if (nickElement) {
        sender = nickElement.textContent;
      }
      
      // Extract message text
      const textElement = div.querySelector('.text');
      if (textElement) {
        message = textElement.textContent;
      }
      
      // Format the message with current timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
      let formattedMessage = '';
      if (tag) {
        formattedMessage = `[${timestamp}] [${tag}] ${sender}: ${message}`;
      } else {
        formattedMessage = `[${timestamp}] ${sender}: ${message}`;
      }
      
      messages.push(formattedMessage);
    });
    
    if (messages.length === 0) {
      console.log('No chat messages found');
      alert('No chat messages found');
      return;
    }
    
    console.log(`Found ${messages.length} messages in DOM`);
    this.downloadTextFile(messages.join('\n'), `game-chat-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`);
  },
  
  /**
   * Download text as a file
   * @param {string} text - Text content
   * @param {string} filename - File name
   */
  downloadTextFile: function(text, filename) {
    console.log(`Downloading text file: ${filename}`);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    
    console.log('Triggering download...');
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('Download cleanup complete');
    }, 100);
  }
};

// Initialize the chat logger when the framework is ready
if (window.GameMenuExtension) {
  ChatLogger.init();
} else {
  // Wait for the framework to be ready
  const checkInterval = setInterval(() => {
    if (window.GameMenuExtension) {
      clearInterval(checkInterval);
      ChatLogger.init();
    }
  }, 100);
}

// Expose the chat logger globally
window.ChatLogger = ChatLogger;
