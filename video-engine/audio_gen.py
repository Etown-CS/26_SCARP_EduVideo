from kokoro import KPipeline
import soundfile as sf
import torch

### Clean text for tts
import re

def clean_text_for_tts(text):
    return re.sub(r'!\[\]\([^)]*\)', '', text).strip()

### Build a pipeline Once
def tts_pipeline(lang_code="a"): # 'a' - American English
    return KPipeline(lang_code=lang_code)

def generate_audio(pipeline, text, output_path, voice='af_bella'):
    generator = pipeline(text, voice=voice) # computing one by one when you actually ask for it

    ### Get results (gs: original text, ps: pronounciation)
    audio_chunks = []
    for i, (gs, ps, audio) in enumerate(generator):
        audio_chunks.append(audio)

    full_audio = torch.cat(audio_chunks, dim=0) # dim = the axis to concatenate along

    sf.write(output_path, full_audio, 24000) # 24000HZ (24kHz)

    return output_path

def get_audio_duration(file_path):
    info = sf.info(file_path)
    audio_length = info.frames / info.samplerate
    return audio_length
