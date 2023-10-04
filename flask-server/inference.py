from io import BytesIO
from tqdm import tqdm
import glob
import lmdb
import math
import numpy as np
import os
import shutil
import time
import warnings

from PIL import Image
import cv2

import torch
import torch.distributed as dist
import torch.nn as nn
import torchvision
import torchvision.transforms as transforms
import torchvision.transforms.functional as F
from torch.utils.data import Dataset
from torchvision.utils import save_image

from tensorfn import load_config as DiffConfig

from config.diffconfig import DiffusionConfig, get_model_conf
from data.fashion_base_function import get_random_params
from models.unet_autoenc import BeatGANsAutoencConfig
from diffusion import (create_gaussian_diffusion, make_beta_schedule,
                       ddim_steps)


def get_label_tensor(path, shape=[256, 256]):

    scale_param = 0.05

    param = get_random_params(shape, scale_param)

    limbSeq = [[2, 3], [2, 6], [3, 4], [4, 5], [6, 7], [7, 8], [2, 9], [9, 10], \
    [10, 11], [2, 12], [12, 13], [13, 14], [2, 1], [1, 15], [15, 17], \
    [1, 16], [16, 18], [3, 17], [6, 18]]


    colors = [[255, 0, 0], [255, 85, 0], [255, 170, 0], [255, 255, 0], [170, 255, 0], [85, 255, 0], [0, 255, 0], \
            [0, 255, 85], [0, 255, 170], [0, 255, 255], [0, 170, 255], [0, 85, 255], [0, 0, 255], [85, 0, 255], \
            [170, 0, 255], [255, 0, 255], [255, 0, 170], [255, 0, 85]]
    canvas = np.zeros((shape[0], shape[1], 3)).astype(np.uint8)
    keypoint = np.loadtxt(path)
    keypoint = trans_keypoins(keypoint, param, shape)
    stickwidth = 4
    for i in range(18):
        x, y = keypoint[i, 0:2]
        if x == -1 or y == -1:
            continue
        cv2.circle(canvas, (int(x), int(y)), 4, colors[i], thickness=-1)
    joints = []
    for i in range(17):
        Y = keypoint[np.array(limbSeq[i]) - 1, 0]
        X = keypoint[np.array(limbSeq[i]) - 1, 1]
        cur_canvas = canvas.copy()
        if -1 in Y or -1 in X:
            joints.append(np.zeros_like(cur_canvas[:, :, 0]))
            continue
        mX = np.mean(X)
        mY = np.mean(Y)
        length = ((X[0] - X[1])**2 + (Y[0] - Y[1])**2)**0.5
        angle = math.degrees(math.atan2(X[0] - X[1], Y[0] - Y[1]))
        polygon = cv2.ellipse2Poly(
            (int(mY), int(mX)), (int(length / 2), stickwidth), int(angle), 0,
            360, 1)
        cv2.fillConvexPoly(cur_canvas, polygon, colors[i])
        canvas = cv2.addWeighted(canvas, 0.4, cur_canvas, 0.6, 0)

        joint = np.zeros_like(cur_canvas[:, :, 0])
        cv2.fillConvexPoly(joint, polygon, 255)
        joint = cv2.addWeighted(joint, 0.4, joint, 0.6, 0)
        joints.append(joint)
    pose = F.to_tensor(Image.fromarray(cv2.cvtColor(canvas,
                                                    cv2.COLOR_BGR2RGB)))

    tensors_dist = 0
    e = 1
    for i in range(len(joints)):
        im_dist = cv2.distanceTransform(255 - joints[i], cv2.DIST_L1, 3)
        im_dist = np.clip((im_dist / 3), 0, 255).astype(np.uint8)
        tensor_dist = F.to_tensor(Image.fromarray(im_dist))
        tensors_dist = tensor_dist if e == 1 else torch.cat(
            [tensors_dist, tensor_dist])
        e += 1

    label_tensor = torch.cat((pose, tensors_dist), dim=0)
    if int(keypoint[14, 0]) != -1 and int(keypoint[15, 0]) != -1:
        y0, x0 = keypoint[14, 0:2]
        y1, x1 = keypoint[15, 0:2]
        face_center = torch.tensor([y0, x0, y1, x1]).float()
    else:
        face_center = torch.tensor([-1, -1, -1, -1]).float()
    return label_tensor, face_center


def get_npx_tensor(path):
    (label_tensor, face_center) = get_label_tensor(path=path, shape=[256, 256])
    return label_tensor.numpy().transpose((1, 2, 0))


def trans_keypoins(keypoints, param, img_size):
    missing_keypoint_index = keypoints == -1

    # crop the white line in the original dataset
    keypoints[:, 0] = (keypoints[:, 0] - 40)

    # resize the dataset
    img_h, img_w = img_size
    scale_w = 1.0 / 176.0 * img_w
    scale_h = 1.0 / 256.0 * img_h

    if 'scale_size' in param and param['scale_size'] is not None:
        new_h, new_w = param['scale_size']
        scale_w = scale_w / img_w * new_w
        scale_h = scale_h / img_h * new_h

    if 'crop_param' in param and param['crop_param'] is not None:
        w, h, _, _ = param['crop_param']
    else:
        w, h = 0, 0

    keypoints[:, 0] = keypoints[:, 0] * scale_w - w
    keypoints[:, 1] = keypoints[:, 1] * scale_h - h
    keypoints[missing_keypoint_index] = -1
    return keypoints

def do_infer(input_image, pose_array_path):
    tgt_pose = get_npx_tensor(path=pose_array_path)
    obj = Predictor()

    output_image = obj.predict_pose(image=input_image,
                                    tgt_pose=tgt_pose,
                                    sample_algorithm='ddim',
                                    nsteps=100)

    return output_image
