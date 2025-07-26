// Global variables
let selectedFile = null;
let currentTheme = 'light';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadSettings();
    loadHistory();
    setupEventListeners();
});

function initializeApp() {
    // Set up file upload area
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // Drag and drop functionality
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });
}

function setupEventListeners() {
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('settings-modal');
        if (e.target === modal) {
            closeSettings();
        }
    });
    
    // Theme change listener
    document.querySelectorAll('input[name="theme"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                applyTheme(e.target.value);
            }
        });
    });
}

async function handleFileSelect(file) {
    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
        showNotification('Please select an Excel file (.xlsx or .xls)', 'error');
        return;
    }
    
    selectedFile = file;
    
    // Show file info
    document.getElementById('upload-area').style.display = 'none';
    document.getElementById('file-info').style.display = 'flex';
    document.getElementById('file-name').textContent = file.name;
    
    // Enable translate button
    document.getElementById('translate-btn').disabled = false;
    
    // Preview Excel content
    await previewExcelContent(file);
}

async function previewExcelContent(file) {
    try {
        showNotification('Loading Excel preview...', 'info');
        
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/preview_excel', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayExcelPreview(result);
            showNotification('Excel content loaded successfully', 'success');
        } else {
            showNotification(result.error || 'Failed to preview Excel file', 'error');
        }
    } catch (error) {
        showNotification('Error loading Excel preview: ' + error.message, 'error');
    }
}

function displayExcelPreview(data) {
    const previewSection = document.getElementById('excel-preview');
    const previewInfo = document.getElementById('preview-info');
    const previewTable = document.getElementById('preview-table');
    
    // Show preview section
    previewSection.style.display = 'block';
    
    // Update preview info
    const nonEmptyRows = data.content.filter(row => !row.isEmpty).length;
    const emptyRows = data.content.filter(row => row.isEmpty).length;
    
    previewInfo.innerHTML = `
        <div class="preview-stats">
            <div class="stat-item">
                <i class="fas fa-file-excel"></i>
                <span><strong>File:</strong> ${data.filename}</span>
            </div>
            <div class="stat-item">
                <i class="fas fa-list-ol"></i>
                <span><strong>Total Rows:</strong> ${data.total_rows}</span>
            </div>
            <div class="stat-item">
                <i class="fas fa-check-circle"></i>
                <span><strong>Non-empty:</strong> ${nonEmptyRows}</span>
            </div>
            <div class="stat-item">
                <i class="fas fa-circle"></i>
                <span><strong>Empty:</strong> ${emptyRows}</span>
            </div>
        </div>
        ${data.total_rows > 50 ? '<p><i class="fas fa-info-circle"></i> Showing first 50 rows for preview</p>' : ''}
    `;
    
    // Update preview table
    previewTable.innerHTML = data.content.map(row => `
        <div class="preview-row">
            <div class="row-number">Row ${row.row}</div>
            <div class="row-content ${row.isEmpty ? 'empty' : ''}">
                ${row.isEmpty ? '(Empty cell)' : escapeHtml(row.text)}
            </div>
        </div>
    `).join('');
}

function togglePreview() {
    const previewContent = document.getElementById('preview-content');
    const toggleIcon = document.getElementById('preview-toggle-icon');
    
    if (previewContent.classList.contains('collapsed')) {
        previewContent.classList.remove('collapsed');
        previewContent.style.maxHeight = '400px';
        toggleIcon.className = 'fas fa-chevron-up';
    } else {
        previewContent.classList.add('collapsed');
        previewContent.style.maxHeight = '0';
        toggleIcon.className = 'fas fa-chevron-down';
    }
}

function clearFile() {
    selectedFile = null;
    document.getElementById('upload-area').style.display = 'block';
    document.getElementById('file-info').style.display = 'none';
    document.getElementById('excel-preview').style.display = 'none';
    document.getElementById('translate-btn').disabled = true;
    document.getElementById('file-input').value = '';
}

function openSettings() {
    document.getElementById('settings-modal').style.display = 'block';
}

function closeSettings() {
    document.getElementById('settings-modal').style.display = 'none';
}

function toggleApiKeyVisibility() {
    const apiKeyInput = document.getElementById('api-key');
    const toggleIcon = document.getElementById('api-key-toggle');
    
    if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        toggleIcon.className = 'fas fa-eye-slash';
    } else {
        apiKeyInput.type = 'password';
        toggleIcon.className = 'fas fa-eye';
    }
}

function saveSettings() {
    const settings = {
        apiKey: document.getElementById('api-key').value,
        defaultSource: document.getElementById('default-source').value,
        defaultTarget: document.getElementById('default-target').value,
        theme: document.querySelector('input[name="theme"]:checked').value
    };
    
    // Save to localStorage
    localStorage.setItem('translatorSettings', JSON.stringify(settings));
    
    // Apply settings
    document.getElementById('source-lang').value = settings.defaultSource;
    document.getElementById('target-lang-1').value = settings.defaultTarget;
    // Set second target language to a different default
    const secondLang = settings.defaultTarget === 'English' ? 'Japanese' : 'English';
    document.getElementById('target-lang-2').value = secondLang;
    applyTheme(settings.theme);
    
    closeSettings();
    showNotification('Settings saved successfully!', 'success');
}

function loadSettings() {
    const savedSettings = localStorage.getItem('translatorSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        
        document.getElementById('api-key').value = settings.apiKey || '';
        document.getElementById('default-source').value = settings.defaultSource || 'Chinese';
        document.getElementById('default-target').value = settings.defaultTarget || 'English';
        document.getElementById('source-lang').value = settings.defaultSource || 'Chinese';
        document.getElementById('target-lang-1').value = settings.defaultTarget || 'English';
        
        // Set second target language to a different default
        const secondLang = (settings.defaultTarget || 'English') === 'English' ? 'Japanese' : 'English';
        document.getElementById('target-lang-2').value = secondLang;
        
        // Set theme radio button
        const themeRadio = document.querySelector(`input[name="theme"][value="${settings.theme || 'light'}"]`);
        if (themeRadio) {
            themeRadio.checked = true;
        }
        
        applyTheme(settings.theme || 'light');
    }
}

function applyTheme(theme) {
    currentTheme = theme;
    document.body.setAttribute('data-theme', theme);
}

async function translateFile() {
    if (!selectedFile) {
        showNotification('Please select a file first', 'error');
        return;
    }
    
    const apiKey = document.getElementById('api-key').value;
    if (!apiKey) {
        showNotification('Please set your API key in settings', 'error');
        openSettings();
        return;
    }
    
    const sourceLang = document.getElementById('source-lang').value;
    const targetLang1 = document.getElementById('target-lang-1').value;
    const targetLang2 = document.getElementById('target-lang-2').value;
    const domain = document.getElementById('domain').value;
    const sessionId = Date.now().toString();
    
    // Show progress bar and processing info
    document.getElementById('progress-bar').style.display = 'block';
    document.getElementById('processing-info').style.display = 'block';
    document.getElementById('translate-btn').disabled = true;
    
    // Clear previous processing info
    clearProcessingInfo();
    
    // Initialize processing info
    updateProcessingInfo('🚀 Starting dual-language translation process...', 'info');
    updateProcessingInfo(`📁 File: ${selectedFile.name}`, 'info');
    updateProcessingInfo(`🌐 Translation 1: ${sourceLang} → ${targetLang1} (Column C)`, 'info');
    updateProcessingInfo(`🌐 Translation 2: ${sourceLang} → ${targetLang2} (Column D)`, 'info');
    if (domain) {
        updateProcessingInfo(`🎯 Domain: ${domain}`, 'info');
    }
    updateProcessingInfo('📤 Uploading file to server...', 'info');
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('api_key', apiKey);
    formData.append('source_lang', sourceLang);
    formData.append('target_lang_1', targetLang1);
    formData.append('target_lang_2', targetLang2);
    formData.append('domain', domain);
    formData.append('session_id', sessionId);
    
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Start listening for real-time updates
            startProgressListener(sessionId);
        } else {
            updateProcessingInfo('❌ Translation failed', 'error');
            updateProcessingInfo(`Error: ${result.error}`, 'error');
            showNotification(result.error || 'Translation failed', 'error');
            document.getElementById('progress-bar').style.display = 'none';
            document.getElementById('translate-btn').disabled = false;
        }
    } catch (error) {
        updateProcessingInfo('❌ Network error occurred', 'error');
        updateProcessingInfo(`Error: ${error.message}`, 'error');
        showNotification('Network error: ' + error.message, 'error');
        document.getElementById('progress-bar').style.display = 'none';
        document.getElementById('translate-btn').disabled = false;
    }
}

function startProgressListener(sessionId) {
    // Poll for updates every second
    const pollInterval = setInterval(async () => {
        try {
            const response = await fetch(`/get_session_messages/${sessionId}`);
            const messages = await response.json();
            
            // Clear and rebuild processing info
            const processingContent = document.getElementById('processing-content');
            processingContent.innerHTML = '';
            
            let isComplete = false;
            
            messages.forEach(message => {
                const messageElement = document.createElement('div');
                messageElement.className = `processing-message ${message.type}`;
                
                if (message.type === 'input') {
                    messageElement.innerHTML = `
                        <div class="message-header">[${message.timestamp}] 📝 Original Input:</div>
                        <div class="message-content input-text">${escapeHtml(message.text)}</div>
                    `;
                } else if (message.type === 'output') {
                    messageElement.innerHTML = `
                        <div class="message-header">[${message.timestamp}] ✅ Translation Output:</div>
                        <div class="message-content output-text">${escapeHtml(message.text)}</div>
                    `;
                } else {
                    messageElement.innerHTML = `
                        <div class="message-header">[${message.timestamp}] ${getMessageIcon(message.type)} ${message.text}</div>
                    `;
                }
                
                processingContent.appendChild(messageElement);
                
                if (message.type === 'success' || message.type === 'error') {
                    isComplete = true;
                }
            });
            
            // Auto-scroll to bottom
            processingContent.scrollTop = processingContent.scrollHeight;
            
            if (isComplete) {
                clearInterval(pollInterval);
                document.getElementById('progress-bar').style.display = 'none';
                document.getElementById('translate-btn').disabled = false;
                
                // Check if successful
                const lastMessage = messages[messages.length - 1];
                if (lastMessage.type === 'success') {
                    showNotification('Translation completed successfully!', 'success');
                    
                    // Extract filename from success message
                    const successText = lastMessage.text;
                    const fileMatch = successText.match(/File: (.+)$/);
                    if (fileMatch) {
                        const filename = fileMatch[1];
                        showDownloadButton(filename);
                    }
                    
                    // Load history to show the new translation
                    setTimeout(() => {
                        loadHistory();
                    }, 1000);
                    
                    clearFile();
                } else {
                    showNotification('Translation failed', 'error');
                }
                
                // Hide processing info after 15 seconds
                setTimeout(() => {
                    document.getElementById('processing-info').style.display = 'none';
                }, 15000);
            }
            
        } catch (error) {
            console.error('Error polling progress:', error);
            clearInterval(pollInterval);
            document.getElementById('progress-bar').style.display = 'none';
            document.getElementById('translate-btn').disabled = false;
        }
    }, 1000);
}

function getMessageIcon(type) {
    switch (type) {
        case 'info': return 'ℹ️';
        case 'success': return '✅';
        case 'error': return '❌';
        case 'warning': return '⚠️';
        default: return '📝';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateProcessingInfo(message, type = 'info') {
    const processingContent = document.getElementById('processing-content');
    const timestamp = new Date().toLocaleTimeString();
    const messageElement = document.createElement('p');
    messageElement.className = type;
    messageElement.textContent = `[${timestamp}] ${message}`;
    processingContent.appendChild(messageElement);
    
    // Auto-scroll to bottom
    processingContent.scrollTop = processingContent.scrollHeight;
}

function clearProcessingInfo() {
    document.getElementById('processing-content').innerHTML = '<p>Preparing translation...</p>';
}

function showDownloadButton(filename) {
    const processingContent = document.getElementById('processing-content');
    const downloadElement = document.createElement('div');
    downloadElement.className = 'processing-message success';
    downloadElement.innerHTML = `
        <div class="message-header">✅ Translation Complete - Download Ready</div>
        <div class="message-content" style="text-align: center; padding: 15px;">
            <button class="download-btn" onclick="downloadFile('${filename}')" style="font-size: 1.1rem; padding: 12px 25px;">
                <i class="fas fa-download"></i> Download Translated File
            </button>
        </div>
    `;
    processingContent.appendChild(downloadElement);
    processingContent.scrollTop = processingContent.scrollHeight;
}

async function loadHistory() {
    try {
        const response = await fetch('/history');
        const history = await response.json();
        
        const historyList = document.getElementById('history-list');
        
        if (history.length === 0) {
            historyList.innerHTML = '<p class="no-history">No translation history yet.</p>';
            return;
        }
        
        historyList.innerHTML = history.map(item => {
            const translation2 = item.target_lang_2 ? 
                `<br><strong>Translation 2:</strong> ${item.source_lang} → ${item.target_lang_2} (Column D)` : '';
            
            return `
                <div class="history-item">
                    <div class="history-item-header">
                        <span class="history-item-time">${item.timestamp}</span>
                        <button class="download-btn" onclick="downloadFile('${item.translated_file}')">
                            <i class="fas fa-download"></i> Download
                        </button>
                    </div>
                    <div class="history-item-details">
                        <strong>File:</strong> ${item.original_file}<br>
                        <strong>Translation:</strong> ${item.source_lang} → ${item.target_lang_1 || item.target_lang} (Column C)${translation2}<br>
                        <strong>Domain:</strong> ${item.domain || 'General'}<br>
                        <strong>Rows:</strong> ${item.rows_translated}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load history:', error);
    }
}

async function clearHistory() {
    if (!confirm('Are you sure you want to clear all translation history?')) {
        return;
    }
    
    try {
        const response = await fetch('/clear_history', {
            method: 'POST'
        });
        
        if (response.ok) {
            loadHistory();
            showNotification('History cleared successfully', 'success');
        }
    } catch (error) {
        showNotification('Failed to clear history', 'error');
    }
}

function downloadFile(filename) {
    window.open(`/download/${filename}`, '_blank');
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}