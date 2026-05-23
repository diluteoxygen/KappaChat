// DOM Elements
const apiKeyInput = document.getElementById('apiKey');
const toggleKeyBtn = document.getElementById('toggleKeyVisibility');
const targetInput = document.getElementById('targetInput');
const inputLabel = document.getElementById('inputLabel');
const inputPrefix = document.getElementById('inputPrefix');
const inputHelper = document.getElementById('inputHelper');
const searchBtn = document.getElementById('searchBtn');
const tabBtns = document.querySelectorAll('.tab-btn');
const terminalConsole = document.getElementById('terminalConsole');
const clearLogsBtn = document.getElementById('clearLogsBtn');

// State Views
const stateIdle = document.getElementById('stateIdle');
const stateLoading = document.getElementById('stateLoading');
const stateResult = document.getElementById('stateResult');
const stateError = document.getElementById('stateError');
const statusIndicator = document.getElementById('statusIndicator');
const loadingStatusText = document.getElementById('loadingStatusText');

// Result Elements
const resChannelAvatar = document.getElementById('resChannelAvatar');
const resChannelName = document.getElementById('resChannelName');
const resChannelId = document.getElementById('resChannelId');
const streamStatusBox = document.getElementById('streamStatusBox');
const streamStatusTitle = document.getElementById('streamStatusTitle');
const streamIcon = document.getElementById('streamIcon');
const streamDetails = document.getElementById('streamDetails');
const streamThumbnail = document.getElementById('streamThumbnail');
const streamTitle = document.getElementById('streamTitle');
const streamStartTime = document.getElementById('streamStartTime');
const streamLink = document.getElementById('streamLink');
const chatLink = document.getElementById('chatLink');
const offlineMessage = document.getElementById('offlineMessage');

// Error Elements
const errorTitle = document.getElementById('errorTitle');
const errorMessage = document.getElementById('errorMessage');

// App State
let activeTab = 'handle'; // 'handle' or 'channel'

// Initialize Page
document.addEventListener('DOMContentLoaded', () => {
    // Restore Saved API Key
    const savedKey = localStorage.getItem('yt_api_key');
    if (savedKey) {
        apiKeyInput.value = savedKey;
        log('Restored YouTube API Key from localStorage.', 'info');
    }

    // Set initial configuration parameters
    updateFormUI();
});

// Logger Function
function log(message, type = 'system') {
    const timestamp = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.className = `terminal-line ${type}-line`;
    
    let text = `[${timestamp}] `;
    if (type === 'request') text += `→ FETCH: `;
    if (type === 'response') text += `← RESPONSE: `;
    if (type === 'error') text += `⚠ ERROR: `;
    if (type === 'success') text += `✓ SUCCESS: `;
    if (type === 'warn') text += `⚠ WARNING: `;
    
    if (typeof message === 'object') {
        text += JSON.stringify(message, null, 2);
    } else {
        text += message;
    }
    
    line.textContent = text;
    terminalConsole.appendChild(line);
    
    // Auto Scroll to bottom
    terminalConsole.scrollTop = terminalConsole.scrollHeight;
}

// Clear Terminal Logs
clearLogsBtn.addEventListener('click', () => {
    terminalConsole.innerHTML = '<div class="terminal-line system-line">[SYSTEM] Console cleared. Ready.</div>';
});

// Toggle API Key Visibility
toggleKeyBtn.addEventListener('click', () => {
    const isPassword = apiKeyInput.type === 'password';
    apiKeyInput.type = isPassword ? 'text' : 'password';
    toggleKeyBtn.innerHTML = isPassword ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
});

// Handle Tab Switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTab = btn.dataset.type;
        updateFormUI();
    });
});

function updateFormUI() {
    if (activeTab === 'handle') {
        inputLabel.textContent = 'YouTube Handle';
        inputPrefix.style.display = 'block';
        targetInput.placeholder = 'LofiGirl';
        targetInput.style.paddingLeft = '2.5rem';
        inputHelper.textContent = 'Enter the handle (e.g. "LofiGirl" or "@LofiGirl").';
    } else {
        inputLabel.textContent = 'YouTube Channel ID';
        inputPrefix.style.display = 'none';
        targetInput.placeholder = 'UCtI0Hodo5Yg8AODLBiM_wVg';
        targetInput.style.paddingLeft = '1rem';
        inputHelper.textContent = 'Enter the explicit channel ID (starts with "UC").';
    }
}

// Switch UI State View
function switchView(viewName) {
    stateIdle.classList.add('hidden');
    stateLoading.classList.add('hidden');
    stateResult.classList.add('hidden');
    stateError.classList.add('hidden');
    
    if (viewName === 'idle') {
        stateIdle.classList.remove('hidden');
        statusIndicator.className = 'status-badge status-idle';
        statusIndicator.textContent = 'Ready';
    } else if (viewName === 'loading') {
        stateLoading.classList.remove('hidden');
        statusIndicator.className = 'status-badge status-loading';
        statusIndicator.textContent = 'Searching';
    } else if (viewName === 'result') {
        stateResult.classList.remove('hidden');
    } else if (viewName === 'error') {
        stateError.classList.remove('hidden');
        statusIndicator.className = 'status-badge status-error';
        statusIndicator.textContent = 'Error';
    }
}

// Main Search Action
searchBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    let target = targetInput.value.trim();

    // Validations
    if (!apiKey) {
        log('Search aborted: API key is missing.', 'error');
        alert('Please enter a YouTube Data API v3 key first.');
        apiKeyInput.focus();
        return;
    }

    if (!target) {
        log('Search aborted: Input field is empty.', 'error');
        alert(`Please enter a YouTube ${activeTab === 'handle' ? 'handle' : 'channel ID'}.`);
        targetInput.focus();
        return;
    }

    // Save API key
    localStorage.setItem('yt_api_key', apiKey);

    // Prepare search parameters
    let channelId = '';
    let channelName = '';
    let channelAvatar = '';

    // Set UI to loading
    switchView('loading');
    searchBtn.disabled = true;
    searchBtn.querySelector('.btn-text').textContent = 'Searching...';
    searchBtn.querySelector('.spinner').classList.remove('hidden');
    searchBtn.querySelector('.btn-icon-right').classList.add('hidden');

    try {
        if (activeTab === 'handle') {
            // Ensure the handle is properly formatted with '@'
            const handle = target.startsWith('@') ? target : '@' + target;
            loadingStatusText.textContent = `Resolving handle ${handle} to Channel ID...`;
            log(`Starting handle resolution for: ${handle}`, 'info');

            const resolveUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,id&forHandle=${encodeURIComponent(handle)}&key=${apiKey}`;
            log(resolveUrl.replace(apiKey, 'API_KEY_HIDDEN'), 'request');

            const resolveResponse = await fetch(resolveUrl);
            const resolveData = await resolveResponse.json();
            log(resolveData, 'response');

            if (!resolveResponse.ok) {
                const apiError = resolveData.error?.message || `HTTP ${resolveResponse.status}`;
                throw new Error(`Handle resolution failed: ${apiError}`);
            }

            if (!resolveData.items || resolveData.items.length === 0) {
                // If it failed, let's try WITHOUT the '@' prefix just in case the API has an edge case
                log(`No channel found with handle ${handle}. Retrying without '@' prefix...`, 'warn');
                const rawHandle = handle.replace('@', '');
                const retryUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,id&forHandle=${encodeURIComponent(rawHandle)}&key=${apiKey}`;
                log(retryUrl.replace(apiKey, 'API_KEY_HIDDEN'), 'request');
                
                const retryResponse = await fetch(retryUrl);
                const retryData = await retryResponse.json();
                log(retryData, 'response');

                if (!retryResponse.ok) {
                    const apiError = retryData.error?.message || `HTTP ${retryResponse.status}`;
                    throw new Error(`Handle resolution failed: ${apiError}`);
                }

                if (!retryData.items || retryData.items.length === 0) {
                    throw new Error(`No YouTube channel found with handle "${handle}". Make sure it is spelled correctly.`);
                }
                
                channelId = retryData.items[0].id;
                channelName = retryData.items[0].snippet.title;
                channelAvatar = retryData.items[0].snippet.thumbnails?.default?.url || '';
            } else {
                channelId = resolveData.items[0].id;
                channelName = resolveData.items[0].snippet.title;
                channelAvatar = resolveData.items[0].snippet.thumbnails?.default?.url || '';
            }

            log(`Successfully resolved handle to Channel ID: ${channelId}`, 'success');
        } else {
            // Channel ID entered directly
            channelId = target;
            if (!channelId.startsWith('UC')) {
                log(`Warning: Channel ID "${channelId}" does not start with "UC". This may fail.`, 'warn');
            }
            
            loadingStatusText.textContent = `Fetching channel info for ${channelId}...`;
            log(`Fetching channel info directly for: ${channelId}`, 'info');

            const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${encodeURIComponent(channelId)}&key=${apiKey}`;
            log(channelUrl.replace(apiKey, 'API_KEY_HIDDEN'), 'request');

            const channelResponse = await fetch(channelUrl);
            const channelData = await channelResponse.json();
            log(channelData, 'response');

            if (!channelResponse.ok) {
                const apiError = channelData.error?.message || `HTTP ${channelResponse.status}`;
                throw new Error(`Channel details fetch failed: ${apiError}`);
            }

            if (!channelData.items || channelData.items.length === 0) {
                throw new Error(`No YouTube channel found with ID "${channelId}".`);
            }

            channelName = channelData.items[0].snippet.title;
            channelAvatar = channelData.items[0].snippet.thumbnails?.default?.url || '';
            log(`Found channel details: "${channelName}"`, 'success');
        }

        // Render Channel Info immediately
        resChannelAvatar.src = channelAvatar || 'https://via.placeholder.com/80/1a202c/ffffff?text=Avatar';
        resChannelName.textContent = channelName;
        resChannelId.textContent = channelId;

        // Step 2: Search for live broadcast
        loadingStatusText.textContent = `Checking live broadcasts for ${channelName}...`;
        log(`Searching live broadcasts for channelId: ${channelId}`, 'info');

        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(channelId)}&eventType=live&type=video&key=${apiKey}`;
        log(searchUrl.replace(apiKey, 'API_KEY_HIDDEN'), 'request');

        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        log(searchData, 'response');

        if (!searchResponse.ok) {
            const apiError = searchData.error?.message || `HTTP ${searchResponse.status}`;
            throw new Error(`Live stream search failed: ${apiError}`);
        }

        switchView('result');

        if (searchData.items && searchData.items.length > 0) {
            // Live broadcast found!
            const item = searchData.items[0];
            const videoId = item.id.videoId;
            const title = item.snippet.title;
            const thumbUrl = item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || '';
            const publishedAt = new Date(item.snippet.publishedAt).toLocaleString();

            log(`Live stream detected! Video ID: ${videoId}`, 'success');

            // Update UI components
            statusIndicator.className = 'status-badge status-live';
            statusIndicator.textContent = 'Live';

            streamStatusBox.className = 'status-box status-box-live';
            streamStatusTitle.textContent = 'LIVE STREAM DETECTED';
            streamIcon.className = 'fa-solid fa-circle-dot status-box-icon animate-pulse';
            
            streamThumbnail.src = thumbUrl;
            streamTitle.textContent = title;
            streamStartTime.textContent = publishedAt;
            
            // Set links
            streamLink.href = `https://youtu.be/${videoId}`;
            
            // Generate embedded chat overlay link for testing
            chatLink.href = `https://www.youtube.com/live_chat?v=${videoId}`;
            
            offlineMessage.classList.add('hidden');
            streamDetails.classList.remove('hidden');
        } else {
            // No live broadcast found
            log(`Channel is offline (no live broadcasts found).`, 'info');

            statusIndicator.className = 'status-badge status-offline';
            statusIndicator.textContent = 'Offline';

            streamStatusBox.className = 'status-box status-box-offline';
            streamStatusTitle.textContent = 'OFFLINE';
            streamIcon.className = 'fa-solid fa-circle-play status-box-icon';
            
            offlineMessage.classList.remove('hidden');
            streamDetails.classList.add('hidden');
        }

    } catch (err) {
        log(err.message, 'error');
        errorMessage.textContent = err.message;
        switchView('error');
    } finally {
        // Reset Search Button UI
        searchBtn.disabled = false;
        searchBtn.querySelector('.btn-text').textContent = 'Find Live Stream';
        searchBtn.querySelector('.spinner').classList.add('hidden');
        searchBtn.querySelector('.btn-icon-right').classList.remove('hidden');
    }
});
