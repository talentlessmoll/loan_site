// Admin panel implementation (moved from admin.html - chat and callback management)
export function initAdminUI(SUPABASE_URL, SUPABASE_ANON_KEY) {
    let users = [];
    let selectedUserId = null;
    let pollInterval = null;
    let callbacks = [];
    let currentTab = 'chats';
    
    async function loadUsers() {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/loan?select=*&chat=not.is.null`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            users = await response.json();
            displayUsers();
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }
    
    function displayUsers() {
        const usersList = document.getElementById('usersList');
        
        if (users.length === 0) {
            usersList.innerHTML = '<div class="empty-state">No active chats</div>';
            return;
        }
        
        usersList.innerHTML = users.map(user => {
            const unreadCount = user.chat ? user.chat.filter(m => m.sender === 'user' && !m.read).length : 0;
            return `
                <div class="user-item" data-user-id="${user.id}">
                    <h3>${user.name}${unreadCount > 0 ? `<span class="user-badge">${unreadCount}</span>` : ''}</h3>
                    <p>${user.email}</p>
                </div>
            `;
        }).join('');
        
        document.querySelectorAll('.user-item').forEach(item => {
            item.addEventListener('click', () => {
                selectUser(parseInt(item.dataset.userId));
            });
        });
    }
    
    function selectUser(userId) {
        selectedUserId = userId;
        const user = users.find(u => u.id === userId);
        
        if (!user) return;
        
        document.querySelectorAll('.user-item').forEach(item => {
            item.classList.toggle('active', parseInt(item.dataset.userId) === userId);
        });
        
        document.getElementById('chatInfo').style.display = 'block';
        document.getElementById('selectedUserName').textContent = user.name;
        document.getElementById('selectedUserEmail').textContent = user.email;
        document.getElementById('chatInputContainer').style.display = 'flex';
        
        displayChat(user.chat || []);
    }
    
    function displayChat(messages) {
        const chatMessages = document.getElementById('chatMessages');
        
        if (messages.length === 0) {
            chatMessages.innerHTML = '<div class="empty-state"><p>No messages yet</p></div>';
            return;
        }
        
        const user = users.find(u => u.id === selectedUserId);
        
        let needsUpdate = false;
        const updatedMessages = messages.map(msg => {
            if (msg.sender === 'user' && !msg.read) {
                needsUpdate = true;
                return { ...msg, read: true };
            }
            return msg;
        });
        
        if (needsUpdate) {
            fetch(`${SUPABASE_URL}/rest/v1/loan?id=eq.${selectedUserId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ chat: updatedMessages })
            });
            user.chat = updatedMessages;
        }
        
        chatMessages.innerHTML = updatedMessages.map((msg, index) => {
            const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            const className = msg.sender === 'user' ? 'user-message' : 'support-message';
            const senderName = msg.sender === 'user' ? (user?.name || 'Customer') : 'Customer Support';
            const imageHTML = msg.image ? `<img src="${msg.image}" class="message-image" onclick="window.open('${msg.image}', '_blank')" alt="Attached image">` : '';
            const reactionsHTML = msg.reactions && msg.reactions.length > 0 ? `
                <div class="message-reactions">
                    ${msg.reactions.map(r => `<span class="reaction">${r.emoji}<span class="reaction-count">${r.count}</span></span>`).join('')}
                </div>
            ` : '';
            
            const statusHTML = msg.sender === 'support' && msg.read ? 
                '<div class="message-status delivered">✓✓ Delivered</div>' : '';
            
            return `
                <div class="chat-message ${className}">
                    <div style="font-size: 12px; font-weight: 600; margin-bottom: 4px; opacity: 0.7; display: flex; align-items: center; justify-content: space-between;">
                        <span>${senderName}</span>
                        <div class="message-options">
                            <button class="options-button" onclick="toggleOptions(${index}, event)">⋮</button>
                            <div class="options-dropdown" id="options-${index}">
                                <div class="options-item delete" onclick="deleteMessage(${index})">
                                    🗑️ Delete
                                </div>
                                <div class="options-item" onclick="toggleEmojiPicker(${index})">
                                    😊 React with emoji
                                </div>
                                <div id="emoji-picker-${index}" style="display: none;">
                                    <div class="emoji-picker">
                                        ${['👍', '❤️', '😊', '😂', '🎉', '🔥', '👏', '✨', '💯', '🙌', '😍', '🤔'].map(emoji => 
                                            `<button class="emoji-btn" onclick="addReaction(${index}, '${emoji}')">${emoji}</button>`
                                        ).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    ${msg.text ? `<p>${msg.text}</p>` : ''}
                    ${imageHTML}
                    ${reactionsHTML}
                    ${time ? `<div class="timestamp">${time}</div>` : ''}
                    ${statusHTML}
                </div>
            `;
        }).join('');
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    async function sendMessage() {
        if (!selectedUserId) return;
        
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        const user = users.find(u => u.id === selectedUserId);
        const currentChat = user.chat || [];
        
        currentChat.push({
            text: message,
            sender: 'support',
            timestamp: new Date().toISOString(),
            read: false
        });
        
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/loan?id=eq.${selectedUserId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ chat: currentChat })
            });
            
            input.value = '';
            user.chat = currentChat;
            displayChat(currentChat);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }
    
    document.getElementById('sendMessage').addEventListener('click', sendMessage);
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    async function deleteMessage(index) {
        if (!selectedUserId) return;
        if (!confirm('Are you sure you want to delete this message?')) return;
        
        const user = users.find(u => u.id === selectedUserId);
        const currentChat = [...(user.chat || [])];
        
        currentChat.splice(index, 1);
        
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/loan?id=eq.${selectedUserId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ chat: currentChat })
            });
            
            user.chat = currentChat;
            displayChat(currentChat);
        } catch (error) {
            console.error('Error deleting message:', error);
            alert('Failed to delete message. Please try again.');
        }
    }
    
    function toggleOptions(index, event) {
        event.stopPropagation();
        const dropdown = document.getElementById(`options-${index}`);
        
        document.querySelectorAll('.options-dropdown').forEach(d => {
            if (d !== dropdown) d.classList.remove('active');
        });
        
        dropdown.classList.toggle('active');
    }
    
    function toggleEmojiPicker(index) {
        const picker = document.getElementById(`emoji-picker-${index}`);
        picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
    }
    
    async function addReaction(index, emoji) {
        if (!selectedUserId) return;
        
        const user = users.find(u => u.id === selectedUserId);
        const currentChat = [...(user.chat || [])];
        const message = currentChat[index];
        
        if (!message.reactions) {
            message.reactions = [];
        }
        
        const existingReaction = message.reactions.find(r => r.emoji === emoji);
        if (existingReaction) {
            existingReaction.count++;
        } else {
            message.reactions.push({ emoji, count: 1 });
        }
        
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/loan?id=eq.${selectedUserId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ chat: currentChat })
            });
            
            user.chat = currentChat;
            displayChat(currentChat);
        } catch (error) {
            console.error('Error adding reaction:', error);
        }
    }
    
    window.deleteMessage = deleteMessage;
    window.toggleOptions = toggleOptions;
    window.toggleEmojiPicker = toggleEmojiPicker;
    window.addReaction = addReaction;
    
    document.addEventListener('click', () => {
        document.querySelectorAll('.options-dropdown').forEach(d => {
            d.classList.remove('active');
        });
    });
    
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('hfin_chat_name');
        localStorage.removeItem('hfin_chat_email');
        localStorage.removeItem('hfin_chat_id');
        window.close();
    });
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            currentTab = tabName;
            
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
            document.getElementById(`${tabName}Tab`).classList.add('active');
            
            if (tabName === 'callbacks') {
                loadCallbacks();
            }
        });
    });
    
    async function loadCallbacks() {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/loan?select=*&intro=not.is.null&order=created_at.desc`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            callbacks = await response.json();
            displayCallbacks();
        } catch (error) {
            console.error('Error loading callbacks:', error);
        }
    }
    
    function displayCallbacks() {
        const callbacksList = document.getElementById('callbacksList');
        
        if (callbacks.length === 0) {
            callbacksList.innerHTML = '<div class="empty-state">No callback requests</div>';
            return;
        }
        
        callbacksList.innerHTML = callbacks.map((cb, index) => {
            const date = cb.created_at ? new Date(cb.created_at).toLocaleString() : 'Unknown date';
            const deviceInfo = cb.device_info || {};
            
            return `
                <div class="callback-card">
                    <div class="callback-header">
                        <div>
                            <div class="callback-name">${cb.name}</div>
                            <div class="callback-meta">
                                📧 ${cb.email} | 📱 ${cb.phone || 'No phone'} | 📅 ${date}
                            </div>
                        </div>
                    </div>
                    
                    <div class="callback-intro">
                        <strong>Message:</strong><br>
                        ${cb.intro || 'No message provided'}
                    </div>
                    
                    <div class="callback-actions">
                        <button class="callback-btn" onclick="window.location.href='mailto:${cb.email}'">✉️ Email</button>
                        ${cb.phone ? `<button class="callback-btn" onclick="window.location.href='tel:${cb.phone}'">📞 Call</button>` : ''}
                        <button class="callback-btn delete" onclick="deleteCallback(${cb.id})">🗑️ Delete</button>
                    </div>
                    
                    ${Object.keys(deviceInfo).length > 0 ? `
                        <div class="device-info-toggle" onclick="toggleDeviceInfo(${index})">
                            📊 View Device & Location Info
                        </div>
                        <div class="device-info" id="device-info-${index}">
                            <div class="device-info-grid">
                                ${deviceInfo.ip_address ? `<div class="device-info-item"><span class="device-info-label">IP:</span><span>${deviceInfo.ip_address}</span></div>` : ''}
                                ${deviceInfo.country ? `<div class="device-info-item"><span class="device-info-label">Country:</span><span>${deviceInfo.country}</span></div>` : ''}
                                ${deviceInfo.city ? `<div class="device-info-item"><span class="device-info-label">City:</span><span>${deviceInfo.city}</span></div>` : ''}
                                ${deviceInfo.device_type ? `<div class="device-info-item"><span class="device-info-label">Device:</span><span>${deviceInfo.device_type}</span></div>` : ''}
                                ${deviceInfo.os ? `<div class="device-info-item"><span class="device-info-label">OS:</span><span>${deviceInfo.os} ${deviceInfo.os_version || ''}</span></div>` : ''}
                                ${deviceInfo.browser ? `<div class="device-info-item"><span class="device-info-label">Browser:</span><span>${deviceInfo.browser} ${deviceInfo.browser_version || ''}</span></div>` : ''}
                                ${deviceInfo.screen_width ? `<div class="device-info-item"><span class="device-info-label">Screen:</span><span>${deviceInfo.screen_width}x${deviceInfo.screen_height}</span></div>` : ''}
                                ${deviceInfo.timezone ? `<div class="device-info-item"><span class="device-info-label">Timezone:</span><span>${deviceInfo.timezone}</span></div>` : ''}
                                ${deviceInfo.language ? `<div class="device-info-item"><span class="device-info-label">Language:</span><span>${deviceInfo.language}</span></div>` : ''}
                                ${deviceInfo.referrer ? `<div class="device-info-item"><span class="device-info-label">Referrer:</span><span>${deviceInfo.referrer}</span></div>` : ''}
                                ${deviceInfo.time_spent_seconds ? `<div class="device-info-item"><span class="device-info-label">Time on Site:</span><span>${deviceInfo.time_spent_seconds}s</span></div>` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }
    
    function toggleDeviceInfo(index) {
        const info = document.getElementById(`device-info-${index}`);
        info.classList.toggle('visible');
    }
    
    async function deleteCallback(id) {
        if (!confirm('Are you sure you want to delete this callback request?')) return;
        
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/loan?id=eq.${id}`, {
                method: 'DELETE',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            loadCallbacks();
        } catch (error) {
            console.error('Error deleting callback:', error);
            alert('Failed to delete callback request. Please try again.');
        }
    }
    
    window.toggleDeviceInfo = toggleDeviceInfo;
    window.deleteCallback = deleteCallback;
    
    loadUsers();
    pollInterval = setInterval(() => {
        if (currentTab === 'chats') {
            loadUsers();
        } else if (currentTab === 'callbacks') {
            loadCallbacks();
        }
    }, 3000);
    
    window.addEventListener('beforeunload', () => {
        if (pollInterval) clearInterval(pollInterval);
    });
}