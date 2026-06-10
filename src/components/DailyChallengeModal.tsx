/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { X, Award, Flame, Star, Sparkles, Check, HelpCircle, RefreshCw } from 'lucide-react';

interface DailyChallengeModalProps {
  onClose: () => void;
  onSuccess: (xpReward: number) => void;
}

export default function DailyChallengeModal({ onClose, onSuccess }: DailyChallengeModalProps) {
  const targetWord = 'ASL';
  
  // Hand representations
  const options = [
    { 
      char: 'S', 
      desc: 'Clenched knuckles, thumb crossed horizontally flat',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMOsgqF8a4ySnyW5xzBxltyzdY-06KJL1BesVIcumk4VKyun1fBms2H4PozarmRQxWGEll4vySSBpKRpbsXEvmypG_KRq-SjF5urDVc756MAppWr2whmQ0JE15aKvpP_pwWdbRSeimAC8MqGCMOtOkIIFsQQafuio_pes7OgQgrZ_rQVuCBZrTB2hPHmDS2L4PAIaRJfe20lV4ksTHwesNylddDe5_eQ2cnsMi-ejKQvpqXu4xKJb86yc9H4r2j3kMzTV1w_WY-Mne' 
    },
    { 
      char: 'Y', 
      desc: 'Thumb and pinky extended wide',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7cwo1rYsW7jomessTXN6uoNl1Xql2peRtICxrxm5C6i3AbMJAtpfIpGb-Wye98UG0MfIXiYdkuXdilEdNtN-n7QFXf5ezuSnCfWt4EcBHvcZYT1C1-LvY9_IQKBMo6AJf0MTeELJpYrNiYBWOfKvHKlNg_4o-Msgb09RJMEmmQWoKC0Y4jN_pbRpFfhm6L_tpZAQJ-tcSnSYFCU9EgW7dTlW95bdgASzPb4bbptIqe9tg04vMlXacmO6BJzR8byN4Sdf40hcZVCkR' 
    },
    { 
      char: 'L', 
      desc: 'Index straight up, thumb pointing sideways forming L',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDf6d8w3eMxfVZgyfNpoPqd7HnX7g7AoDDritr343oKOyXHM79QTtiXJ92xq5QYT3zdU633XvDOlIoMbZnOV4OUq4wvPHkULBUsbpxVUxSqq3bNtg15NTyFwPyrcgsfvhdUFiLsra7Pvwm00iPhBvLke1uyzUnNfYgjYECT8rqI_JsMeA6hMwZDQXMLMVq_6IgV6fePc_FTxEEO3aayx5gG0i9ilUD4MgFnKtC_BKhcQDUH7sU0hvN0B235zBpWy-veBC5mDEPPSSq8' 
    },
    { 
      char: 'A', 
      desc: 'Fist with thumb placed vertically flat on knuckle side',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBM80mRlp9f86fVHC09nRipAJ_X322XguZ1iOhW9kRSB3ITeUIBO4LwcT3g0WUV680UoTOnhQB1M5V_Dvc0DTSN6Gfz-PYrZIa4JSqLbb8gi9R2O26zepW7zwMvguh57Kqm-BQUmBkw5lYzUReM5ScqUIXJ_7dYHSOWHmARTQHhrUn2hbA_2sSvOj812j-sSh2nTRyFTkEB0rSIsiurJP_nrBLsu884oHy3ZKCfRZUncXuXxevuZyTpGclQ1JFRx4GXscrPZolkDHka' 
    },
    { 
      char: 'W', 
      desc: 'Index, middle, and ring vertical up',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSL48Dbovf6JFwXNxNQU5ZuriMVjFaUZWFRRcoS9xQtcxB7tfbCFbwzULGxq_cXUCMwJQpccf7y3V_Sh1y2NCJVNb6IpriTLESUha9NL-yF4NYWNzWiden-n5Ure5XGMQEV555tLiv_mw5FxKIMNcvNBAhhN5BYRlsPt56jl9xPfF4AxG8-NjKnRADSe5rn4KSwzLTiTJTCqfSO1X4eNSvsp4l5kJzD7h60UZuh8SIDvpd0x3boEQp3L1AdUjpjhOP2by8c8C7TP5f' 
    }
  ];

  const [tappedSequence, setTappedSequence] = useState<string[]>([]);
  const [completeState, setCompleteState] = useState<'playing' | 'wrong' | 'solved'>('playing');

  const handleTapOption = (char: string) => {
    if (completeState !== 'playing') return;

    const nextSeq = [...tappedSequence, char];
    setTappedSequence(nextSeq);

    // Check if correct order so far
    const partOfWord = targetWord.slice(0, nextSeq.length);
    if (nextSeq.join('') !== partOfWord) {
      setCompleteState('wrong');
    } else if (nextSeq.length === targetWord.length) {
      setCompleteState('solved');
      onSuccess(100); // Grand +100 XP bonus for perfect daily achievements!
    }
  };

  const handleReset = () => {
    setTappedSequence([]);
    setCompleteState('playing');
  };

  return (
    <div className="fixed inset-0 bg-on-surface/50 backdrop-blur-sm z-50 flex items-center justify-center p-md text-on-surface animate-fade-in">
      <div className="bg-surface-container-lowest border border-outline-variant max-w-xl w-full rounded-2xl p-lg shadow-2xl flex flex-col space-y-md relative overflow-hidden animate-scale-up">
        
        {/* Sparkles effects when solved */}
        {completeState === 'solved' && (
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute top-4 left-6 animate-pulse text-yellow-400">
              <Sparkles className="w-8 h-8 fill-yellow-400" />
            </div>
            <div className="absolute bottom-6 right-8 animate-bounce text-primary">
              <Sparkles className="w-6 h-6 fill-primary" />
            </div>
          </div>
        )}

        <div className="flex justify-between items-center bg-white border-b border-outline-variant/30 pb-md">
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500 fill-orange-400" />
            <div>
              <h3 className="font-headline font-bold text-lg leading-tight">Daily ASL Challenge</h3>
              <p className="text-[10px] text-on-surface-variant font-medium">Test your rapid ASL spelling coordination!</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-outline hover:text-on-surface hover:bg-surface-container rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Game instructions */}
        <div className="space-y-sm text-center py-sm">
          <p className="text-xs font-semibold text-outline uppercase tracking-wider font-mono">SPELL THE TARGET WORD</p>
          <div className="flex justify-center items-center gap-xs font-black font-headline text-3xl">
            {targetWord.split('').map((val, idx) => {
              const tapped = tappedSequence[idx];
              return (
                <div 
                  key={idx} 
                  className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 ${tapped ? 'border-primary bg-primary/10 text-primary animate-scale-up' : 'border-outline-variant text-outline/40'}`}
                >
                  {tapped || '?'}
                </div>
              );
            })}
          </div>
          
          <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed mt-2 font-medium">
            Tap the coordinate cards in index sequence to spell out the abbreviation <strong>"A-S-L"</strong>!
          </p>
        </div>

        {/* Grid layout options */}
        <div className="grid grid-cols-5 gap-sm pt-md">
          {options.map((opt) => {
            const hasTapped = tappedSequence.includes(opt.char);
            return (
              <button
                key={opt.char}
                disabled={hasTapped || completeState !== 'playing'}
                onClick={() => handleTapOption(opt.char)}
                className={`flex flex-col items-center p-1 rounded-xl border-2 bg-white flex-1 transition-all ${
                  hasTapped 
                    ? 'border-outline-variant/20 opacity-30 text-outline' 
                    : 'border-outline-variant hover:border-primary shadow-sm hover:scale-[1.03] active:scale-95'
                }`}
                title={opt.desc}
              >
                <div className="aspect-square w-full rounded-lg overflow-hidden bg-surface mb-xs border border-outline-variant/20">
                  <img 
                    alt={opt.char} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                    src={opt.img}
                  />
                </div>
                <span className="font-headline font-bold text-sm">{opt.char}</span>
              </button>
            );
          })}
        </div>

        {/* Evaluation state status message */}
        <div className="pt-md text-center">
          {completeState === 'playing' && (
            <span className="text-xs text-outline font-medium">Tap first character...</span>
          )}

          {completeState === 'wrong' && (
            <div className="space-y-sm bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl p-md">
              <p className="font-bold">❌ Incorrect Spelling Sequence!</p>
              <button 
                onClick={handleReset}
                className="px-4 py-1.5 bg-red-600 text-white text-[11px] font-bold rounded-lg hover:bg-red-700 active:scale-95 flex items-center gap-1 mx-auto"
              >
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                <span>Reset sequence</span>
              </button>
            </div>
          )}

          {completeState === 'solved' && (
            <div className="bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl p-md space-y-sm">
              <div className="flex items-center justify-center gap-xs font-bold font-headline text-sm">
                <Check className="w-4 h-4 text-green-600 stroke-[3.5]" />
                <span>CHALLENGE SOLVED PERFECTLY!</span>
              </div>
              <p className="text-[11px] font-medium text-green-700">
                Congratulations! You spelling coordinates align correctly. Placed <strong>+100 XP</strong> into your balance.
              </p>
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-primary text-white text-[11px] font-bold rounded-lg hover:bg-primary-container active:scale-95 pointer-events-auto"
              >
                Claim reward & dismiss
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
