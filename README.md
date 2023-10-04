# tri3d-openpose-editor
NextJS application to upload an image, extract the open pose and edit the keypoints.


<img width="1046" alt="Screenshot 2023-10-04 at 8 42 01 AM" src="https://github.com/TRI3D-LC/tri3d-openpose-editor/assets/120464367/ba175235-d3c6-4a30-b1fc-a49c5dfb8c7b">


# setting up nextJS application
cd my-app
npm install 
npm run dev (runs on port 3000)

# setting up flask-server 
cd flask-server/
python -m virtualenv venv
source venv/bin/activate
pip install -r requirements.txt 
export FLASK_APP=main (SET for windows)
flask run

open - 127.0.0.1:3000/


