import base64
import shutil
import os
import json
from flask import Flask, request, jsonify
from flask import Flask
from flask import request
from flask import json
from flask_cors import CORS
from datetime import datetime, timedelta
import base64
from io import BytesIO


app = Flask('GPT-Generate-Image')
cors = CORS(app,origins=['https://52.2.211.102','http://127.0.0.1:3000','http://127.0.0.1:3001']) # This will enable CORS for all routes in the Flask app and only allow requests from 'http://127.0.0.1:3000'

def extractpose_maincall(base64_img):
    from utils import save_image
    path_input, folder_path = save_image(base64_img)
    path_output = folder_path + '/output.png'
    from extract_pose_controlnet import do_inference
    output_array = do_inference(input_image = path_input, output_file_prefix = folder_path + '/controlnet', width=256, height=256)
    input_pose_path = folder_path + '/controlnet.txt'
    pose_vector_text = ''
    with open(input_pose_path, 'r') as f:
        pose_vector_text = f.read()

    with open(path_input, 'rb') as img:
         img_bytes_base64 = base64.b64encode(img.read()).decode()
    return pose_vector_text,img_bytes_base64

@app.route('/generate/extractpose/', methods=['POST'])
def extractpose():   
    try:
        # print(request.get_data())
        payload = json.loads(request.get_data().decode('utf-8'))
        pose_vector_text,prediction_pose = extractpose_maincall(payload['target_image'])
        return jsonify({"status": "success", "pose_vector_text": pose_vector_text,"prediction_pose":prediction_pose})
    except Exception as e:
        print(e)
        return jsonify({"status": "error","message": str(e)})
