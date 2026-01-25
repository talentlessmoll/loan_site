// Chat client implementation (moved from chat.html)
const faqTranslations = {
    en: {
        toggleText: 'Common Questions',
        questions: [
            'What products does H-Fin offer?',
            'What is the maximum funding amount?',
            'How long are your terms?',
            'How do I qualify?',
            'How quickly can I receive funding?',
            'What documents do I need?',
            'What are your interest rates?',
            'Do you affect credit scores?'
        ]
    },
    af: {
        toggleText: 'Algemene Vrae',
        questions: [
            'Watter produkte bied H-Fin aan?',
            'Wat is die maksimum befondsingsberag?',
            'Hoe lank is julle terme?',
            'Hoe kwalifiseer ek?',
            'Hoe vinnig kan ek befondsing ontvang?',
            'Watter dokumente benodig ek?',
            'Wat is julle rentekoerse?',
            'Beïnvloed julle kredietpunte?'
        ]
    }
};

export function initChatUI(SUPABASE_URL, SUPABASE_ANON_KEY) {
    let currentLanguage = localStorage.getItem('hfin_language') || 'en';
    let userName = '';
    let userEmail = '';
    let chatId = null;
    let pollInterval = null;
    let selectedImage = null;
    let pendingMessages = [];
    let messageIdCounter = 0;
    
    const cachedName = localStorage.getItem('hfin_chat_name');
    const cachedEmail = localStorage.getItem('hfin_chat_email');
    const cachedChatId = localStorage.getItem('hfin_chat_id');
    
    if (cachedName && cachedEmail) {
        userName = cachedName;
        userEmail = cachedEmail;
        chatId = cachedChatId;
        document.getElementById('userInfoForm').style.display = 'none';
        document.getElementById('chatContainer').classList.add('active');
        loadChatHistory();
        startPolling();
    }
    
    document.getElementById('startChatBtn').addEventListener('click', async () => {
        const nameInput = document.getElementById('userName');
        const emailInput = document.getElementById('userEmail');
        
        if (!nameInput.value || !emailInput.value) {
            alert('Please fill in all fields');
            return;
        }
        
        userName = nameInput.value;
        userEmail = emailInput.value;
        
        if (userName.toLowerCase() === 'admin daddy') {
            window.location.href = './admin.html';
            return;
        }
        
        localStorage.setItem('hfin_chat_name', userName);
        localStorage.setItem('hfin_chat_email', userEmail);
        
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/loan?name=eq.${encodeURIComponent(userName)}&email=eq.${encodeURIComponent(userEmail)}`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            const data = await response.json();
            
            if (data.length > 0) {
                chatId = data[0].id;
                localStorage.setItem('hfin_chat_id', chatId);
            } else {
                const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/loan`, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        name: userName,
                        email: userEmail,
                        chat: []
                    })
                });
                
                const newData = await createResponse.json();
                chatId = newData[0].id;
                localStorage.setItem('hfin_chat_id', chatId);
            }
            
            document.getElementById('userInfoForm').style.display = 'none';
            document.getElementById('chatContainer').classList.add('active');
            loadChatHistory();
            startPolling();
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to connect. Please try again.');
        }
    });
    
    async function loadChatHistory() {
        if (!chatId) return;
        
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/loan?id=eq.${chatId}`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            const data = await response.json();
            if (data.length > 0 && data[0].chat) {
                const messages = data[0].chat;
                const messagesContainer = document.getElementById('chatMessages');
                const quickReplies = document.getElementById('quickReplies');
                
                if (messages.length === 0) {
                    messagesContainer.innerHTML = '<div class="chat-message bot-message"><div class="message-sender">H-Fin Bot</div><div class="message-bubble"><p>Thank you for contacting H-Fin! A customer support representative will reach out to you soon. In the meantime, how can we assist you?</p></div></div>';
                    if (quickReplies) quickReplies.style.display = 'flex';
                } else {
                    messagesContainer.innerHTML = '';
                    if (quickReplies) quickReplies.style.display = 'none';
                    
                    let needsUpdate = false;
                    const updatedMessages = messages.map(msg => {
                        if (msg.sender === 'support' && !msg.read) {
                            needsUpdate = true;
                            return { ...msg, read: true };
                        }
                        return msg;
                    });
                    
                    if (needsUpdate) {
                        fetch(`${SUPABASE_URL}/rest/v1/loan?id=eq.${chatId}`, {
                            method: 'PATCH',
                            headers: {
                                'apikey': SUPABASE_ANON_KEY,
                                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ chat: updatedMessages })
                        });
                    }
                    
                    updatedMessages.forEach(msg => {
                        const status = msg.sender === 'user' ? (msg.read ? 'delivered' : 'sent') : null;
                        addMessageToUI(msg.text, msg.sender, msg.timestamp, false, msg.image, status);
                    });
                }
            }
        } catch (error) {
            console.error('Error loading chat:', error);
        }
    }
    
    function startPolling() {
        pollInterval = setInterval(loadChatHistory, 3000);
    }
    
    async function sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message && !selectedImage) return;
        
        const timestamp = new Date().toISOString();
        const tempId = `temp_${messageIdCounter++}`;
        
        const messageDiv = addMessageToUI(message, 'user', timestamp, true, null, 'sending', tempId);
        input.value = '';
        
        const pendingMessage = {
            tempId,
            text: message,
            image: selectedImage,
            timestamp
        };
        pendingMessages.push(pendingMessage);
        
        try {
            let imageUrl = null;
            if (selectedImage) {
                imageUrl = await uploadImage(selectedImage);
            }
            
            if (imageUrl && messageDiv) {
                const bubble = messageDiv.querySelector('.message-bubble');
                const existingContent = bubble.querySelector('p');
                if (existingContent) {
                    existingContent.insertAdjacentHTML('afterend', `<img src="${imageUrl}" class="message-image" onclick="window.open('${imageUrl}', '_blank')" alt="Attached image">`);
                }
            }
            
            selectedImage = null;
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/loan?id=eq.${chatId}`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            const data = await response.json();
            const currentChat = data[0].chat || [];
            
            currentChat.push({
                text: message,
                sender: 'user',
                timestamp: timestamp,
                read: false,
                image: imageUrl
            });
            
            await fetch(`${SUPABASE_URL}/rest/v1/loan?id=eq.${chatId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ chat: currentChat })
            });
            
            updateMessageStatus(tempId, 'sent');
            pendingMessages = pendingMessages.filter(m => m.tempId !== tempId);
            
        } catch (error) {
            console.error('Error sending message:', error);
            updateMessageStatus(tempId, 'failed');
        }
    }
    
    function updateMessageStatus(tempId, status) {
        const messageDiv = document.querySelector(`[data-temp-id="${tempId}"]`);
        if (messageDiv) {
            const statusDiv = messageDiv.querySelector('.message-status');
            if (statusDiv) {
                const statusIcons = {
                    sending: '⏳',
                    sent: '✓',
                    delivered: '✓✓',
                    failed: '✗'
                };
                const statusText = {
                    sending: 'Sending...',
                    sent: 'Sent',
                    delivered: 'Delivered',
                    failed: 'Failed'
                };
                statusDiv.className = `message-status ${status}`;
                statusDiv.innerHTML = `${statusIcons[status]} ${statusText[status]}${status === 'failed' ? `<button class="retry-btn" onclick="retryMessage('${tempId}')">Retry</button>` : ''}`;
            }
        }
    }
    
    async function retryMessage(tempId) {
        const pending = pendingMessages.find(m => m.tempId === tempId);
        if (!pending) return;
        
        updateMessageStatus(tempId, 'sending');
        
        try {
            let imageUrl = null;
            if (pending.image) {
                imageUrl = await uploadImage(pending.image);
            }
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/loan?id=eq.${chatId}`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            const data = await response.json();
            const currentChat = data[0].chat || [];
            
            currentChat.push({
                text: pending.text,
                sender: 'user',
                timestamp: pending.timestamp,
                read: false,
                image: imageUrl
            });
            
            await fetch(`${SUPABASE_URL}/rest/v1/loan?id=eq.${chatId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ chat: currentChat })
            });
            
            updateMessageStatus(tempId, 'sent');
            pendingMessages = pendingMessages.filter(m => m.tempId !== tempId);
            
        } catch (error) {
            console.error('Error retrying message:', error);
            updateMessageStatus(tempId, 'failed');
        }
    }
    
    window.retryMessage = retryMessage;
    
    async function uploadImage(file) {
        try {
            const fileName = `${chatId}_${Date.now()}_${file.name}`;
            const response = await fetch(`${SUPABASE_URL}/storage/v1/object/chat-images/${fileName}`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: file
            });
            
            if (response.ok) {
                return `${SUPABASE_URL}/storage/v1/object/public/chat-images/${fileName}`;
            }
            
            return await fileToBase64(file);
        } catch (error) {
            console.error('Error uploading image:', error);
            return await fileToBase64(file);
        }
    }
    
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    function addMessageToUI(text, sender, timestamp, scroll = true, imageUrl = null, status = null, tempId = null) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        const senderClass = sender === 'user' ? 'user-message' : sender === 'support' ? 'support-message' : 'bot-message';
        messageDiv.className = `chat-message ${senderClass}`;
        if (tempId) {
            messageDiv.dataset.tempId = tempId;
        }
        
        const time = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        let senderName = 'H-Fin Bot';
        if (sender === 'user') {
            senderName = userName || 'You';
        } else if (sender === 'support') {
            senderName = 'Customer Support';
        }
        
        const imageHTML = imageUrl ? `<img src="${imageUrl}" class="message-image" onclick="window.open('${imageUrl}', '_blank')" alt="Attached image">` : '';
        
        let statusHTML = '';
        if (status && sender === 'user') {
            const statusIcons = {
                sending: '⏳',
                sent: '✓',
                delivered: '✓✓',
                failed: '✗'
            };
            const statusText = {
                sending: 'Sending...',
                sent: 'Sent',
                delivered: 'Delivered',
                failed: 'Failed'
            };
            statusHTML = `<div class="message-status ${status}">
                ${statusIcons[status]} ${statusText[status]}
                ${status === 'failed' ? `<button class="retry-btn" onclick="retryMessage('${tempId}')">Retry</button>` : ''}
            </div>`;
        }
        
        messageDiv.innerHTML = `
            <div class="message-sender">${senderName}</div>
            <div class="message-bubble">
                ${text ? `<p>${text}</p>` : ''}
                ${imageHTML}
                ${time ? `<div class="timestamp">${time}</div>` : ''}
                ${statusHTML}
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        if (scroll) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        return messageDiv;
    }
    
    document.getElementById('sendMessage').addEventListener('click', sendMessage);
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    document.getElementById('attachButton').addEventListener('click', () => {
        document.getElementById('imageInput').click();
    });
    
    document.getElementById('imageInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            selectedImage = file;
            document.getElementById('chatInput').placeholder = `📎 ${file.name} - Type message or press send`;
        }
    });
    
    document.querySelectorAll('.quick-reply-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const message = btn.dataset.message;
            document.getElementById('chatInput').value = message;
            sendMessage();
            document.getElementById('quickReplies').style.display = 'none';
        });
    });
    
    function updateFAQLanguage() {
        const faqData = faqTranslations[currentLanguage];
        document.getElementById('faqToggleText').textContent = faqData.toggleText;
        
        const faqSection = document.getElementById('faqSection');
        faqSection.innerHTML = faqData.questions.map(q => 
            `<button class="faq-question-btn" onclick="selectFAQ('${q.replace(/'/g, "\\'")}')">${q}</button>`
        ).join('');
    }
    
    document.getElementById('faqToggleBtn').addEventListener('click', () => {
        const faqSection = document.getElementById('faqSection');
        const arrow = document.getElementById('arrowIcon');
        faqSection.classList.toggle('active');
        arrow.classList.toggle('rotated');
    });
    
    function selectFAQ(question) {
        document.getElementById('chatInput').value = question;
        document.getElementById('faqSection').classList.remove('active');
        document.getElementById('arrowIcon').classList.remove('rotated');
    }
    
    window.selectFAQ = selectFAQ;
    
    window.addEventListener('storage', (e) => {
        if (e.key === 'hfin_language') {
            currentLanguage = e.newValue || 'en';
            updateFAQLanguage();
        }
    });
    
    updateFAQLanguage();
    
    window.addEventListener('beforeunload', () => {
        if (pollInterval) clearInterval(pollInterval);
    });
}