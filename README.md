# Excel Translator - Dual Language Translation Tool

A powerful web-based application that translates Excel files from one source language to two target languages simultaneously using AI translation services. Built with Python Flask backend and modern HTML/CSS/JavaScript frontend.

## 🌟 Features

### Core Functionality
- **Dual-Language Translation**: Translate Excel column B content to two different target languages simultaneously
- **Real-time Progress Tracking**: Watch translation progress with live input/output display
- **Excel File Preview**: Preview column B content before translation
- **Translation History**: Track all translations with download links
- **Immediate Download**: Get download button right after translation completes

### Supported Languages
- Chinese
- English
- Japanese
- Korean
- French
- German
- Spanish
- Russian

### User Interface
- **Modern Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Themes**: User preference with persistent storage
- **Drag & Drop Upload**: Easy file upload with visual feedback
- **Settings Panel**: Configure API keys, default languages, and themes
- **Real-time Notifications**: Success/error messages with visual feedback

## 🚀 Quick Start

### Prerequisites
- Python 3.7+
- DashScope API Key from Alibaba Cloud

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Excel_translator
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python app.py
   ```
   
   Or on Windows, double-click:
   ```bash
   run.bat
   ```

4. **Access the application**
   Open your browser and go to: `http://localhost:5000`

## 📋 Usage Guide

### Step 1: Configure Settings
1. Click the **Settings** button (⚙️) in the top-right corner
2. Enter your **DashScope API Key**
3. Set your **default source and target languages**
4. Choose your preferred **theme** (Light/Dark)
5. Click **Save Settings**

### Step 2: Upload Excel File
1. **Drag and drop** your Excel file or **click to browse**
2. Supported formats: `.xlsx`, `.xls`
3. The application will automatically **preview column B content**
4. Review the file statistics and content preview

### Step 3: Configure Translation
1. Select **Source Language** (language of content in column B)
2. Choose **Target Language 1** (will be saved to column C)
3. Choose **Target Language 2** (will be saved to column D)
4. Optionally enter a **Translation Domain** for better accuracy

### Step 4: Start Translation
1. Click the **Translate** button
2. Watch **real-time progress** with input/output display
3. See each API call's original text and translation result
4. Get **immediate download button** when complete

### Step 5: Download Results
- Use the **immediate download button** after translation
- Or access **Translation History** for all past translations
- Download files contain original data plus translations in columns C and D

## 🏗️ Project Structure

```
Excel_translator/
├── app.py                 # Flask backend application
├── requirements.txt       # Python dependencies
├── run.bat               # Windows startup script
├── README.md             # This file
├── templates/
│   └── index.html        # Main web interface
├── static/
│   ├── style.css         # Responsive CSS with themes
│   └── script.js         # Interactive JavaScript
└── uploads/              # Temporary file storage (auto-created)
```

## 🔧 Technical Details

### Backend (Python Flask)
- **File Processing**: Pandas for Excel file handling
- **AI Translation**: OpenAI-compatible API with DashScope
- **Real-time Updates**: Background threading with session tracking
- **File Management**: Secure file upload/download with cleanup
- **API Endpoints**: RESTful design with JSON responses

### Frontend (HTML/CSS/JavaScript)
- **Responsive Design**: CSS Grid and Flexbox layouts
- **Modern UI**: Font Awesome icons, smooth animations
- **Theme System**: CSS custom properties for dark/light modes
- **Real-time Updates**: Polling mechanism for live progress
- **Local Storage**: Persistent user settings

### Translation API
- **Service**: Alibaba Cloud DashScope (Qwen-MT-Turbo model)
- **Features**: Multi-language support with domain specialization
- **Error Handling**: Comprehensive error catching and user feedback

## 📊 Excel File Requirements

### Input Format
- **Column B**: Contains source text to be translated
- **File Types**: `.xlsx` or `.xls` formats
- **Size Limit**: Maximum 16MB per file

### Output Format
- **Column A**: Original data (unchanged)
- **Column B**: Source text (unchanged)
- **Column C**: First target language translation
- **Column D**: Second target language translation
- **Other Columns**: Preserved as-is

## 🔑 API Configuration

### Getting DashScope API Key
1. Visit [Alibaba Cloud DashScope](https://dashscope.aliyuncs.com/)
2. Create an account and get your API key
3. Enter the key in the application settings

### Translation Options
- **Domain Specialization**: IT, Medical, Legal, etc.
- **Language Pairs**: Any combination of supported languages
- **Batch Processing**: Handles multiple rows efficiently

## 🎨 Customization

### Themes
- **Light Theme**: Clean, professional appearance
- **Dark Theme**: Easy on the eyes for extended use
- **Automatic Persistence**: Settings saved in browser storage

### Languages
Add new languages by updating the language options in:
- `templates/index.html` (dropdown options)
- `static/script.js` (default settings)

## 🐛 Troubleshooting

### Common Issues
1. **"API key is required"**: Configure your DashScope API key in settings
2. **"Translation failed"**: Check API key validity and internet connection
3. **"File upload failed"**: Ensure file is Excel format and under 16MB
4. **Buttons not responding**: Check browser console for JavaScript errors

### File Issues
- Ensure Excel file has at least 2 columns
- Column B should contain the text to translate
- Empty cells are skipped during translation

### Performance Tips
- Large files (1000+ rows) may take several minutes
- Translation speed depends on API response time
- Use domain specification for better translation quality

## 📈 Features Roadmap

- [ ] Batch file processing
- [ ] Additional translation services
- [ ] Export to different formats
- [ ] Translation quality scoring
- [ ] User authentication system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source. Please check the license file for details.

## 🆘 Support

For issues, questions, or feature requests:
1. Check the troubleshooting section above
2. Review the browser console for error messages
3. Ensure all dependencies are properly installed
4. Verify your DashScope API key is valid

---

**Built with ❤️ using Flask, Pandas, and modern web technologies**