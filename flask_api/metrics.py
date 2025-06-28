import torch
import torch.nn.functional as F
from pytorch_msssim import ssim

def calculate_ssim(img1, img2):
    """Expects torch tensors of shape (1, 3, H, W), values in [0, 1]."""
    return ssim(img1, img2, data_range=1.0, size_average=True).item()

def calculate_psnr(img1, img2):
    """Computes PSNR between two torch tensors with shape (1, 3, H, W)."""
    mse = F.mse_loss(img1, img2)
    if mse == 0:
        return float('inf')
    return 20 * torch.log10(1.0 / torch.sqrt(mse)).item()
