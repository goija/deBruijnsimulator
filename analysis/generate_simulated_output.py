#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, random
from datetime import datetime, timezone
from pathlib import Path
CYCLE='0000001000011000101000111001001011001101001111010101110110111111'
def get_word_at(idx:int)->int:
    w=0
    for k in range(6): w=(w<<1)|int(CYCLE[(idx+k)%64])
    return w
def bin6(w:int)->str: return format(w,'06b')
def overlap_string(s:str,e:str)->str: return ''.join(a if a==b else '-' for a,b in zip(s,e))
def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--steps',type=int,default=1000); ap.add_argument('--mode',choices=['sequential','random'],default='random'); ap.add_argument('--out',type=Path,required=True)
    args=ap.parse_args(); idx_s=0; idx_e=0; records=[]
    for i in range(1,args.steps+1):
        if args.mode=='random': idx_s=random.randrange(64); idx_e=random.randrange(64)
        else: idx_s=(idx_s+1)%64; idx_e=(idx_e+1)%64
        s=get_word_at(idx_s); e=get_word_at(idx_e); p=s^e; sb=bin6(s); eb=bin6(e); pb=bin6(p); ov=overlap_string(sb,eb); score=sum(ch!='-' for ch in ov)
        records.append({'iteration':i,'timestamp':datetime.now(timezone.utc).isoformat(),'idxS':idx_s,'idxE':idx_e,'S':sb,'E':eb,'P':pb,'overlap':ov,'overlap_score':score,'overlap_density':score/6,'real_overlap':ov.startswith('1') or ov.endswith('1'),'random_mode':args.mode=='random','autoplay':False,'hex_mode':False,'orientation':'top-to-bottom'})
    args.out.write_text(json.dumps({'schema':'debruijn-sep-output-v1','cycle':CYCLE,'records':records},indent=2),encoding='utf-8')
    print(args.out)
if __name__=='__main__': main()
