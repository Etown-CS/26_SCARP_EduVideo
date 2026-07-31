from kokoro import KPipeline
import soundfile as sf
import torch

### Clean text for tts
import re

'''
Functions in this file
- clean_text_for_tts
- tts_pipeline
- generate_audio
- get_audio_duration
'''

def clean_text_for_tts(text):
    '''Strip image tags (![](...)) from text before sending it to the TTS model.'''

    return re.sub(r'!\[\]\([^)]*\)', '', text).strip()

def tts_pipeline(lang_code="a"): # 'a' - American English
    '''Build the Kokoro TTS pipeline once, to be reused across all narration chunks.'''

    return KPipeline(lang_code=lang_code)

def generate_audio(pipeline, text, output_path, voice='af_bella'):
    '''
    Generate narration audio for the given text using the shared Kokoro
    pipeline, concatenating all returned audio chunks, and save it as a WAV file.
    '''

    generator = pipeline(text, voice=voice) # computing one by one when you actually ask for it

    ### Get results (gs: original text, ps: pronounciation)
    audio_chunks = []
    for i, (gs, ps, audio) in enumerate(generator):
        audio_chunks.append(audio)

    full_audio = torch.cat(audio_chunks, dim=0) # dim = the axis to concatenate along

    sf.write(output_path, full_audio, 24000) # 24000HZ (24kHz)

    return output_path

def get_audio_duration(file_path):
    '''Return the duration (in seconds) of the given audio file.'''
    info = sf.info(file_path)
    audio_length = info.frames / info.samplerate
    return audio_length
