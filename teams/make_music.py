"""Generate a quiet, original looping instrumental bed for the Teams short."""
import math, struct, wave
rate=22050
with wave.open('out/teams-music.wav','wb') as w:
    w.setparams((1,2,rate,rate*65,'NONE','not compressed'))
    chords=[[261.63,329.63,392],[220,261.63,329.63],[174.61,220,261.63],[196,246.94,293.66]]
    block=bytearray()
    for i in range(rate*65):
        t=i/rate; chord=chords[int(t/2)%4]; phase=t%0.5; note=chord[int(t*2)%3]*2
        bell=math.exp(-phase*5)*(math.sin(2*math.pi*note*t)+.28*math.sin(2*math.pi*note*2*t))*.06
        pad=sum(math.sin(2*math.pi*f*t) for f in chord)*.018
        fade=min(1,t/2,(65-t)/3)
        sample=max(-1,min(1,(bell+pad)*fade))
        block+=struct.pack('<h',int(sample*32767))
        if len(block)>65536: w.writeframesraw(block);block.clear()
    w.writeframesraw(block)
