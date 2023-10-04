def get_device():
    import torch 
    device = "cpu"
    if torch.cuda.is_available():
        torch.backends.cudnn.benchmark = True
        device = "cuda:0"
    device = torch.device(device)
    return device

def generate_random_string():
    import string
    import random
    N = 10
    res = ''.join(random.choices(string.ascii_uppercase +
                                string.digits, k=N))
    return res

def save_image(base64_string, image_folder = "tmp/", image_name="input.jpg"):
    import os
    import base64
    # from utils import generate_random_string
    base64_string  = base64_string.replace("data:image/jpeg;base64,", "")
    base64_string = base64_string.replace("data:image/png;base64,", "")

    random_path = generate_random_string()    
    folder_path = image_folder + random_path + "/"
    if not os.path.exists(image_folder):
        os.mkdir(image_folder)

    if not os.path.exists(folder_path):
        os.mkdir(folder_path)

    path_input = folder_path + image_name
    if(len(base64_string) > 0):
        with open(path_input, 'wb') as img:
            img.write(base64.b64decode(base64_string))
    
    return path_input, folder_path

def save_target_pose(input_string, path):
    #Write input_string to path
    with open(path, 'w') as f:
        f.write(input_string.replace("\n\n", "\n"))

def print_text_file(path):
    #Write input_string to path
    with open(path, 'r') as f:
        print(f.read())
