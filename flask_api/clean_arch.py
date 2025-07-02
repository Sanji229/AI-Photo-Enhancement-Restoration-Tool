import torch
import torch.nn as nn
import torch.nn.functional as F


class SimpleBlock(nn.Module):
    def __init__(self, in_nc, out_nc):
        super(SimpleBlock, self).__init__()
        self.conv1 = nn.Conv2d(in_nc, out_nc, 3, 1, 1)
        self.act = nn.ReLU(inplace=True)
        self.conv2 = nn.Conv2d(out_nc, out_nc, 3, 1, 1)

    def forward(self, x):
        out = self.act(self.conv1(x))
        out = self.conv2(out)
        return out + x


class CleanUNet(nn.Module):
    def __init__(self, in_nc=3, out_nc=3, nf=64, num_blocks=6):
        super(CleanUNet, self).__init__()
        self.head = nn.Conv2d(in_nc, nf, 3, 1, 1)
        self.body = nn.Sequential(*[SimpleBlock(nf, nf) for _ in range(num_blocks)])
        self.tail = nn.Conv2d(nf, out_nc, 3, 1, 1)

    def forward(self, x):
        fea = self.head(x)
        fea = self.body(fea)
        out = self.tail(fea)
        return out


def define_model(channel_multiplier=2):
    return CleanUNet(nf=64 * channel_multiplier)
