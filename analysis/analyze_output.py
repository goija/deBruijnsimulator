#!/usr/bin/env python3
from __future__ import annotations
import argparse, csv, json, math
from collections import Counter
from pathlib import Path
from typing import Any, Dict, List

def shannon_entropy(values: List[str]) -> float:
    if not values: return 0.0
    n=len(values); c=Counter(values)
    return -sum((v/n)*math.log2(v/n) for v in c.values())

def bit_balance(words: List[str]) -> Dict[str, Any]:
    if not words: return {"count":0,"ones":[],"zeros":[],"one_fraction":[]}
    width=len(words[0]); ones=[sum(1 for w in words if w[i]=='1') for i in range(width)]
    zeros=[len(words)-x for x in ones]
    return {"count":len(words),"ones":ones,"zeros":zeros,"one_fraction":[x/len(words) for x in ones]}

def autocorrelation(xs: List[float], lag:int=1)->float:
    if len(xs)<=lag: return 0.0
    a=xs[:-lag]; b=xs[lag:]; ma=sum(a)/len(a); mb=sum(b)/len(b)
    num=sum((x-ma)*(y-mb) for x,y in zip(a,b))
    dena=math.sqrt(sum((x-ma)**2 for x in a)); denb=math.sqrt(sum((y-mb)**2 for y in b))
    return 0.0 if dena==0 or denb==0 else num/(dena*denb)

def load_records(path: Path) -> List[Dict[str, Any]]:
    if path.suffix.lower()=='.json':
        obj=json.loads(path.read_text(encoding='utf-8'))
        if isinstance(obj,dict) and 'records' in obj: return obj['records']
        if isinstance(obj,list): return obj
        raise ValueError('JSON must be object with records[] or list of records')
    if path.suffix.lower()=='.csv':
        with path.open(newline='',encoding='utf-8') as f: rows=list(csv.DictReader(f))
        for r in rows:
            for k in ['iteration','idxS','idxE','overlap_score']:
                if k in r and r[k] != '': r[k]=int(float(r[k]))
            if 'overlap_density' in r and r['overlap_density']!='': r['overlap_density']=float(r['overlap_density'])
            for k in ['real_overlap','random_mode','autoplay','hex_mode']:
                if k in r: r[k]=str(r[k]).lower() in ('true','1','yes')
        return rows
    raise ValueError('Input must be .json or .csv')

def transition_counts(values: List[str])->Dict[str,int]:
    return dict(Counter(f'{a}->{b}' for a,b in zip(values,values[1:])))

def analyze(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    s=[r['S'] for r in records]; e=[r['E'] for r in records]; p=[r['P'] for r in records]
    ov=[r['overlap'] for r in records]
    scores=[int(r.get('overlap_score',sum(ch!='-' for ch in r['overlap']))) for r in records]
    real=[bool(r.get('real_overlap',r['overlap'].startswith('1') or r['overlap'].endswith('1'))) for r in records]
    pairs=[f'{r["S"]}/{r["E"]}' for r in records]
    return {
        'n_records':len(records),
        'unique':{'S':len(set(s)),'E':len(set(e)),'P':len(set(p)),'S_E_pairs':len(set(pairs)),'overlap_strings':len(set(ov))},
        'entropy_bits':{'S_word':shannon_entropy(s),'E_word':shannon_entropy(e),'P_word':shannon_entropy(p),'S_E_pair':shannon_entropy(pairs),'overlap_string':shannon_entropy(ov)},
        'bit_balance':{'S':bit_balance(s),'E':bit_balance(e),'P':bit_balance(p)},
        'overlap':{'score_counts':dict(Counter(scores)),'mean_score':sum(scores)/len(scores) if scores else 0.0,'mean_density':sum(x/6 for x in scores)/len(scores) if scores else 0.0,'real_overlap_count':sum(real),'real_overlap_rate':sum(real)/len(real) if real else 0.0,'autocorrelation_lag1':autocorrelation([float(x) for x in scores],1),'autocorrelation_lag2':autocorrelation([float(x) for x in scores],2)},
        'top_counts':{'S':dict(Counter(s).most_common(10)),'E':dict(Counter(e).most_common(10)),'P':dict(Counter(p).most_common(10)),'overlap':dict(Counter(ov).most_common(10))},
        'transitions_top':{'P':dict(Counter(transition_counts(p)).most_common(20)),'overlap':dict(Counter(transition_counts(ov)).most_common(20))},
    }

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('input',type=Path); ap.add_argument('--out',type=Path)
    args=ap.parse_args(); report=analyze(load_records(args.input)); text=json.dumps(report,indent=2)
    if args.out: args.out.write_text(text,encoding='utf-8')
    print(text)
if __name__=='__main__': main()
