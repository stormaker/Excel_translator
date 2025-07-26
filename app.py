import os
import json
from flask import Flask, render_template, request, jsonify, send_file, Response
from werkzeug.utils import secure_filename
import pandas as pd
from openai import OpenAI
import tempfile
from datetime import datetime
import time
import threading

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Create uploads directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Translation history storage
translation_history = []

# Store active translation sessions
active_sessions = {}

def get_openai_client(api_key):
    """Initialize OpenAI client with provided API key"""
    return OpenAI(
        api_key=api_key,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
    )

def translate_text(client, text, source_lang, target_lang, domain="", session_id=None):
    """Translate text using OpenAI API"""
    try:
        messages = [{"role": "user", "content": text}]
        
        translation_options = {
            "source_lang": source_lang,
            "target_lang": target_lang,
            "domains": domain if domain else f"General translation from {source_lang} to {target_lang}"
        }
        
        # Send original input to session
        if session_id and session_id in active_sessions:
            active_sessions[session_id].append({
                'type': 'input',
                'text': text,
                'timestamp': datetime.now().strftime('%H:%M:%S')
            })
        
        completion = client.chat.completions.create(
            model="qwen-mt-turbo",
            messages=messages,
            extra_body={"translation_options": translation_options}
        )
        
        translated_text = completion.choices[0].message.content
        
        # Send translated output to session
        if session_id and session_id in active_sessions:
            active_sessions[session_id].append({
                'type': 'output',
                'text': translated_text,
                'timestamp': datetime.now().strftime('%H:%M:%S')
            })
        
        return translated_text
    except Exception as e:
        error_msg = f"Translation error: {str(e)}"
        if session_id and session_id in active_sessions:
            active_sessions[session_id].append({
                'type': 'error',
                'text': error_msg,
                'timestamp': datetime.now().strftime('%H:%M:%S')
            })
        return error_msg

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.lower().endswith(('.xlsx', '.xls')):
            return jsonify({'error': 'Please upload an Excel file (.xlsx or .xls)'}), 400
        
        # Get form data
        api_key = request.form.get('api_key')
        source_lang = request.form.get('source_lang')
        target_lang = request.form.get('target_lang')
        domain = request.form.get('domain', '')
        session_id = request.form.get('session_id', str(int(time.time())))
        
        if not api_key:
            return jsonify({'error': 'API key is required'}), 400
        
        # Read file content into memory before starting background thread
        filename = secure_filename(file.filename)
        file_content = file.read()
        
        # Initialize session for real-time updates
        active_sessions[session_id] = []
        
        # Start translation in background thread
        def translate_in_background():
            filepath = None
            try:
                # Save file content to disk
                unique_filename = f"translate_{session_id}_{filename}"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
                
                with open(filepath, 'wb') as f:
                    f.write(file_content)
                
                # Read Excel file
                df = pd.read_excel(filepath)
                
                if 'B' not in df.columns and len(df.columns) < 2:
                    active_sessions[session_id].append({
                        'type': 'error',
                        'text': 'Excel file must have at least 2 columns (B column for source text)',
                        'timestamp': datetime.now().strftime('%H:%M:%S')
                    })
                    return
                
                # Get column B data (index 1 if using numeric indexing)
                if 'B' in df.columns:
                    source_column = df['B']
                else:
                    source_column = df.iloc[:, 1]  # Second column (index 1)
                
                # Initialize OpenAI client
                client = get_openai_client(api_key)
                
                # Translate texts
                translated_texts = []
                total_rows = len(source_column)
                
                active_sessions[session_id].append({
                    'type': 'info',
                    'text': f'Starting translation of {total_rows} rows...',
                    'timestamp': datetime.now().strftime('%H:%M:%S')
                })
                
                for i, text in enumerate(source_column):
                    if pd.isna(text) or str(text).strip() == '':
                        translated_texts.append('')
                        active_sessions[session_id].append({
                            'type': 'info',
                            'text': f'Row {i+1}: Empty cell, skipping...',
                            'timestamp': datetime.now().strftime('%H:%M:%S')
                        })
                    else:
                        active_sessions[session_id].append({
                            'type': 'info',
                            'text': f'Row {i+1}/{total_rows}: Translating...',
                            'timestamp': datetime.now().strftime('%H:%M:%S')
                        })
                        
                        translated_text = translate_text(client, str(text), source_lang, target_lang, domain, session_id)
                        translated_texts.append(translated_text)
                
                # Add translations to column C
                if 'C' in df.columns:
                    df['C'] = translated_texts
                else:
                    # If column C doesn't exist, create it
                    if len(df.columns) >= 3:
                        df.iloc[:, 2] = translated_texts
                    else:
                        df['C'] = translated_texts
                
                # Save translated file
                output_filename = f"translated_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{filename}"
                output_filepath = os.path.join(app.config['UPLOAD_FOLDER'], output_filename)
                df.to_excel(output_filepath, index=False)
                
                # Add to translation history
                history_entry = {
                    'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'original_file': filename,
                    'translated_file': output_filename,
                    'source_lang': source_lang,
                    'target_lang': target_lang,
                    'domain': domain,
                    'rows_translated': total_rows
                }
                translation_history.append(history_entry)
                
                # Clean up original file
                active_sessions[session_id].append({
                    'type': 'success',
                    'text': f'Translation completed! {total_rows} rows translated. File: {output_filename}',
                    'timestamp': datetime.now().strftime('%H:%M:%S')
                })
                
            except Exception as e:
                active_sessions[session_id].append({
                    'type': 'error',
                    'text': f'Translation failed: {str(e)}',
                    'timestamp': datetime.now().strftime('%H:%M:%S')
                })
            finally:
                # Clean up original file
                if filepath and os.path.exists(filepath):
                    try:
                        os.remove(filepath)
                    except Exception as cleanup_error:
                        print(f"Warning: Could not clean up file {filepath}: {cleanup_error}")
        
        # Start background translation
        thread = threading.Thread(target=translate_in_background)
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'message': 'Translation started'
        })
        
    except Exception as e:
        return jsonify({'error': f'Translation failed: {str(e)}'}), 500

@app.route('/translation_progress/<session_id>')
def translation_progress(session_id):
    """Server-Sent Events endpoint for real-time translation progress"""
    def generate():
        last_sent = 0
        while session_id in active_sessions:
            current_messages = active_sessions[session_id]
            
            # Send new messages
            for i in range(last_sent, len(current_messages)):
                message = current_messages[i]
                yield f"data: {json.dumps(message)}\n\n"
            
            last_sent = len(current_messages)
            time.sleep(0.5)  # Check every 500ms
            
            # Check if translation is complete
            if current_messages and current_messages[-1]['type'] in ['success', 'error']:
                break
    
    return Response(generate(), mimetype='text/plain')

@app.route('/get_session_messages/<session_id>')
def get_session_messages(session_id):
    """Get all messages for a session"""
    if session_id in active_sessions:
        return jsonify(active_sessions[session_id])
    return jsonify([])

@app.route('/preview_excel', methods=['POST'])
def preview_excel():
    """Preview Excel file content (column B)"""
    filepath = None
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.lower().endswith(('.xlsx', '.xls')):
            return jsonify({'error': 'Please upload an Excel file (.xlsx or .xls)'}), 400
        
        # Save uploaded file temporarily with unique name
        filename = secure_filename(file.filename)
        unique_filename = f"preview_{int(time.time())}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        # Reset file pointer and save
        file.seek(0)
        file.save(filepath)
        
        # Read Excel file
        df = pd.read_excel(filepath)
        
        if 'B' not in df.columns and len(df.columns) < 2:
            return jsonify({'error': 'Excel file must have at least 2 columns (B column for source text)'}), 400
        
        # Get column B data
        if 'B' in df.columns:
            source_column = df['B']
        else:
            source_column = df.iloc[:, 1]  # Second column (index 1)
        
        # Convert to list and handle NaN values
        content = []
        for i, text in enumerate(source_column):
            if pd.isna(text):
                content.append({'row': i + 1, 'text': '', 'isEmpty': True})
            else:
                content.append({'row': i + 1, 'text': str(text), 'isEmpty': False})
        
        return jsonify({
            'success': True,
            'filename': filename,
            'total_rows': len(content),
            'content': content[:50]  # Limit to first 50 rows for preview
        })
                
    except Exception as e:
        return jsonify({'error': f'Failed to preview file: {str(e)}'}), 500
    finally:
        # Clean up preview file
        if filepath and os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception as cleanup_error:
                print(f"Warning: Could not clean up preview file {filepath}: {cleanup_error}")

@app.route('/download/<filename>')
def download_file(filename):
    try:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        return send_file(filepath, as_attachment=True)
    except Exception as e:
        return jsonify({'error': f'Download failed: {str(e)}'}), 500

@app.route('/history')
def get_history():
    # Return history with most recent entries first
    return jsonify(list(reversed(translation_history)))

@app.route('/clear_history', methods=['POST'])
def clear_history():
    global translation_history
    translation_history = []
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)