import pandas as pd
import numpy as np
import matplotlib.pylab as plt1
import matplotlib.pyplot as plt
import seaborn as sns
import librosa.display
import numpy as np
import soundfile as sf
# from spleeter.separator import Separator

from glob import glob

import librosa
import librosa.display
import IPython.display as ipd

from itertools import cycle

audio_files = glob("/Users/paulgarces/Desktop/theysayitswonderful.mp3")
ipd.Audio(audio_files[0])

# y is the raw data of our audio file
# sr is the sample rate. a higher sample rate is better since we get better "resolution or quality" of the audio
# according to online, a sample rate of 44,100 is the best
# 22050 is decent, like right in the middle


y, sr = librosa.load(audio_files[0], sr = 41000)
print(f'y: {y[:15]}')
print(f'shape y: {y.shape}')
print(f'sr: {sr}')

pd.Series(y).plot(figsize=(10, 5),
                  lw=1,
                  title="Raw Audio",
                 )
plt.show()

# actually zooming into a specific part of the audio
# can change the range of values

pd.Series(y[0:200000]).plot(figsize=(10, 5),
                  lw=1,
                  title="Raw Audio Zoomed In",
                 )
plt.show()

changing_pitch = librosa.effects.pitch_shift(y, sr=sr, n_steps = 4)
ipd.Audio(changing_pitch, rate = sr)

from pydub import AudioSegment
from pydub.playback import play

song = AudioSegment.from_mp3("/Users/paulgarces/Desktop/theysayitswonderful.mp3")