# —-----------------------------------------------------------
# – IMPORTACIONES / IMPORTS
# —---------------------------------------------------------
import os
import json
import base64
import wave
import io
from flask import Flask, jsonify, send_from_directory
from flask_sock import Sock
from google import genai
from google.genai import types

# —-----------------------------------------------------------
# – CONFIGURACIÓN GLOBAL / GLOBAL CONFIGURATION
# —---------------------------------------------------------
base_dir = os.path.dirname(os.path.abspath(__file__))
dist_dir = os.path.join(base_dir, 'dist')

app = Flask(__name__, static_folder=dist_dir, static_url_path='')
sock = Sock(app)

print("--- AGENTE BITTONGUE: Streaming de Alta Velocidad Activado ---", flush=True)

# —-----------------------------------------------------------
# – RUTAS API / API ROUTES
# —---------------------------------------------------------
@app.route('/api/health')
def health_check():
    return jsonify({"status": "ready"})

# —-----------------------------------------------------------
# – WEBSOCKETS / WEBSOCKETS
# —---------------------------------------------------------
@sock.route('/api/stream')
def stream_audio(ws):
    print("--- CONEXIÓN WS ABIERTA ---", flush=True)
    
    api_key = os.environ.get("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)
    model_id = 'gemini-2.5-flash'
    target_language = "Spanish"
    translation_context = []

    while True:
        try:
            raw_message = ws.receive()
            if raw_message is None: break
            message = json.loads(raw_message)
            
            if message.get('type') == 'config':
                target_language = message.get('language')
                continue
            
            if message.get('type') == 'audio':
                audio_bytes = base64.b64decode(message.get('data'))
                
                wav_io = io.BytesIO()
                with wave.open(wav_io, 'wb') as wav_file:
                    wav_file.setnchannels(1)
                    wav_file.setsampwidth(2)
                    wav_file.setframerate(16000)
                    wav_file.writeframes(audio_bytes)
                
                wav_data = wav_io.getvalue()
                
                prompt = f"""
                You are a professional dubbing interpreter. Translate to {target_language}.
                Context: {translation_context}. 
                Return ONLY the translation text. If noise, return [SILENCE].
                """
                
                contents = [
                    prompt,
                    types.Part.from_bytes(data=wav_data, mime_type='audio/wav')
                ]
                
                full_text = ""
                for chunk in client.models.generate_content_stream(
                    model=model_id, 
                    contents=contents,
                    config=types.GenerateContentConfig(
                        temperature=0.0,
                        candidate_count=1
                    )
                ):
                    if chunk.text:
                        clean_chunk = chunk.text.replace("[SILENCE]", "").strip()
                        if clean_chunk:
                            ws.send(json.dumps({'type': 'text', 'data': clean_chunk}))
                            full_text += " " + clean_chunk

                if full_text.strip():
                    translation_context.append(full_text.strip())
                    if len(translation_context) > 3: translation_context.pop(0)

        except Exception as e:
            print(f"Error: {e}", flush=True)
            break

# —-----------------------------------------------------------
# – SERVIDOR DE ARCHIVOS ESTATICOS / STATIC FILE SERVER
# —---------------------------------------------------------
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

# —-----------------------------------------------------------
# – INICIALIZACIÓN / INITIALIZATION
# —---------------------------------------------------------
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))