# tri3d-openpose-editor
NextJS application to upload an image, extract the open pose and edit the keypoints.

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
