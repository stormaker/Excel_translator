# Excel Translator

A web application for translating Excel files using AI translation services. This application allows you to upload Excel files, translate content in column B to various languages, and save the results in column C.

## Features

- **Multi-language Support**: Translate between Chinese, English, Japanese, Korean, French, German, Spanish, and Russian
- **Domain-specific Translation**: Specify translation domains for better accuracy (IT, Medical, Legal, etc.)
- **Drag & Drop Interface**: Easy file upload with drag and drop functionality
- **Translation History**: Keep track of all your translation jobs
- **Dark/Light Theme**: Choose between light and dark themes
- **Settings Management**: Save API keys and default language preferences
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Python 3.7 or higher
- DashScope API key from Alibaba Cloud

## Installation

1. Clone or download this repository
2. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

1. Start the application:
   ```bash
   python app.py
   ```

2. Open your web browser and go to `http://localhost:5000`

3. Configure your settings:
   - Click the "Settings" button
   - Enter your DashScope API key
   - Set your default source and target languages
   - Choose your preferred theme

4. Upload and translate:
   - Select source and target languages
   - Optionally specify a translation domain
   - Upload your Excel file (drag & drop or click to browse)
   - Click "Translate" to start the process

5. Download results:
   - Once translation is complete, download the translated file
   - View your translation history for previous jobs

## File Format Requirements

- Excel files must be in .xlsx or .xls format
- Content to be translated should be in column B
- Translated content will be saved in column C
- The application preserves all other data in the Excel file

## API Configuration

This application uses Alibaba Cloud's DashScope API for translation. You need to:

1. Sign up for Alibaba Cloud DashScope service
2. Get your API key
3. Enter the API key in the application settings

## File Structure

```
Excel_translator/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── templates/
│   └── index.html        # Main HTML template
├── static/
│   ├── style.css         # CSS styles
│   └── script.js         # JavaScript functionality
└── uploads/              # Temporary file storage (created automatically)
```

## Troubleshooting

- **Translation fails**: Check your API key and internet connection
- **File upload issues**: Ensure the file is a valid Excel format (.xlsx or .xls)
- **Large files**: The application has a 16MB file size limit
- **Browser compatibility**: Use modern browsers (Chrome, Firefox, Safari, Edge)

## Security Notes

- API keys are stored locally in your browser
- Uploaded files are temporarily stored on the server and deleted after processing
- No translation data is permanently stored on the server

## License

This project is open source and available under the MIT License.