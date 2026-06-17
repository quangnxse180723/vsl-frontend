import { User, Lesson, Vocabulary, Achievement, RecentResult } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user1',
    name: 'Felix Chen',
    email: 'felix@example.com',
    status: 'Active',
    proficiency: 75,
    lastActive: '2 mins ago',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWsT0oeHAXqfc9q0eg85_tPVicDAVPE6t13mhdT5qD6Q-qIxiflTazH1peWH3XQWiX-mIlts_D1EcDCG05wF9fcMWHpfvdkQZLu5CrBc1oIQHhQj9Hv464KzYDhxjfmVsqRqL6CdL5rqcme7w6Hmsdfhl44Ck-E739bqY6fHNmrjbjbJvUpiAHlPSjuCOHiyaY30k6sbPpY_q8cI0ur4gtAy_da_D1MIdMsrqcfUkwBCHPUgXXfPMPfH7ryz5IO-X-CJkW5ilVzR9v'
  },
  {
    id: 'user2',
    name: 'Sara Jenkins',
    email: 'sara.j@work.com',
    status: 'Idle',
    proficiency: 25,
    lastActive: '1 hour ago',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsAfr8J0L-IcFhi2okn3mXskeiA-YqMvG3tndNz1chEklSV-oIRTpaBhRE4qNRb1c3XF9HNlyFoqwNHC2BDuh2Y-D-G3CJm16hhtmcmGjYc1OrYyGGzBm_RrfNNwtdc5RTdLagYMFuzQAx7Dz73XUZPK148vBEslKZIq3g5A4Bpu6ItWPVPXEhnBJhX4A5oYEumpVc12rFJU-XtKYLEVVLsV3UCaOblCNJ55kRFbI22_o14DgDJJafABcOQ2rhKT7SunmMuDm9NX0B'
  },
  {
    id: 'user3',
    name: 'Marcus Thorne',
    email: 'm.thorne@edu.com',
    status: 'Active',
    proficiency: 50,
    lastActive: 'Just now',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyLrRvlhT6FKymmFT-VDnK3LIZwWB39vlEHsMPEH1-4gQgrwlmLqAm3TSWyD2qHJnz943UXM-Ob5MbPh80jd1c13PcDqUtOPvhRUBXaFCjmBNbc7Q8oP03Y-bLyrpFkOBoAr4I0LE3cyaxLHcvNp6ZunlzI0QE5ZYrcwZmPBIIhJ5yHiYOjwBKT3WTotwbNeMUDYEd6KavUWsuUALMiFq5x6Ztep2lN61dRD16sVxC1xuHOBBAHlUKhvxTM4jMK1obkjWUBr25jDdJ'
  }
];

export const INITIAL_VOCABULARY: Vocabulary[] = [
  {
    id: 'vocab-a',
    name: 'Letter A',
    category: 'Alphabet',
    attribute: 'Static',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQWEeu8v6m1RfZp7M2iV6ZBjVa6anpaR2mz0WWuoFM_V24mxI2nNq0mxuI1p3xo3pPuS2XGS7lUivEChCX4rjJn13Gl4ljHdr8aW5WJx7L5HSwEXK-xEia6R7Xyh9kSE_Pjp7oCpF_CkcqjS4EkYpROxpiCGMi9SfHd1fCQnpxpNA8Mkgb_tFBv1yhiD-ex0R5U4aT3_VJ7bja7bFStsaIRRuaOp7TZ9khQGyrODxDVzsXjV04eopJy7JEywzrWpBvR297y6RxDkxj',
    description: 'To sign "A", make a fist and keep your thumb resting on the side of your index finger. Palm faces out.'
  },
  {
    id: 'vocab-apple',
    name: 'Apple',
    category: 'Food',
    attribute: 'Movement',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCoKYzPFx3Xn0vGAwpzYP9EjYQp3pWd5lx0xWN3n3UtgoIs0U6cytkejgaHc6kUvTPYgciONKdeYXtweQ9rI33qK6MTZvo6g_x4YepsJNyVGFWFhBAuvLldc2lPqi0pPLJYmZvP6oyEIeO0jm1SLnaNVrpF3zf6hEjDPGOORbtmZ4OmXE23r-ZKv4d0D3FkfG1HAbfwMP59fODnS_mfCjG5-U319CjGAKJiEQ_pnb2imWqILcKfBGHaLCNxcVFsZu2jCVSQ904QK7Ml',
    description: 'Make a fist with index knuckle protruding, pivot it back and forth against your cheek.'
  },
  {
    id: 'vocab-aunt',
    name: 'Aunt',
    category: 'Family',
    attribute: 'Circular',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDb17_q0zG8Vx1WT8bF26hpTBtoExzmnveYbGCwaMuv-Vma3ydfC1KhUmnQQZ2StEH2By4yBGReLtx1ztfytPdca4o7UoWX0XQH6B7oZv_2IRD2Kx6CqudQ7heGa0Dn6q_vgg7BH6IEy0KXSezjxmmD-yFOsJ83PF6Od8zqCFDAgZLkMi3jYJLgKGH8zoKT3ui2Yf3nrdtYVntg0ayI15xnZeBT6QCHJIL-bzzPEkplqmmieZVzoGsjOfQUSceb2hKe7-YMfgvnZ5q5',
    description: 'Place the handshape for Letter A beside your jawline and make small circles forward.'
  },
  {
    id: 'vocab-environment',
    name: 'Environment',
    category: 'Nature',
    attribute: 'Circular',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCddU3mMyGdlS8JOaiVitzb61dFzmZdk0fUPC3TZzWMPFBW9fzRam6CbSrNI348OsV7UULpcM1I5MpzEdcJGF2elvd2u7h2kg7m6K9g-YI4FQv9LZStjWB885AFXFR_qYa63_THJFnJylZTjdfPURHvX_tL4hJQXkYtqFCEdGtpvs_3hibX5AGiaueGpEdsBMTWIcB1Y5p8GxCUqnvX0YoDTUVSn5m5AujnEzXSHhA0yl7e7pjHmtUJJ3Y2OJ7-S0KbC_v1v0dOSsMw',
    description: 'Form the "E" hand shape with your dominant hand and move it in a circular motion around the non-dominant index finger.'
  },
  {
    id: 'vocab-collaboration',
    name: 'Collaboration',
    category: 'Work',
    attribute: 'Movement',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9sxhmR2ju26zSRa0PJd5SlJ7k8ur8USG1T1ppoit0c7_n_YFmSx-onIVStyIeC5D0TxSLAWoRT21nD9FE8pBd5YHp-PNmP23ABZ57lZXOp6cDbOQO2-P7-9z0aTRPQ5Iqq2_KuNSpb-Cc0Jvedws7Y_DHmBOsiZOh_uvsKLwhykh0Z2jDLcoRHACMvl4dZBTPqZqR_8fdhZd-PKQXk8C-2DYH9DaPowp4iNwbJrLoO8Wx4h1ixBAllYDMn6Fa-FmjWcGiH2rTvlIp',
    description: 'Interlock the fingers of both hands and move them in a horizontal circle in front of you.'
  }
];

export const INITIAL_LESSONS: Lesson[] = [
  {
    id: 'lesson1',
    title: 'The ABCs of ASL',
    category: 'Alphabet',
    level: 'Beginner',
    progress: 100,
    status: 'Mastered',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBM80mRlp9f86fVHC09nRipAJ_X322XguZ1iOhW9kRSB3ITeUIBO4LwcT3g0WUV680UoTOnhQB1M5V_Dvc0DTSN6Gfz-PYrZIa4JSqLbb8gi9R2O26zepW7zwMvguh57Kqm-BQUmBkw5lYzUReM5ScqUIXJ_7dYHSOWHmARTQHhrUn2hbA_2sSvOj812j-sSh2nTRyFTkEB0rSIsiurJP_nrBLsu884oHy3ZKCfRZUncXuXxevuZyTpGclQ1JFRx4GXscrPZolkDHka',
    description: 'Master the 26 signs of the ASL alphabet with visual feedback and practical tutorials.',
    duration: '15 mins',
    rating: 4.9,
    breadcrumbs: ['Alphabet', 'Letter A'],
    tips: "Keep your thumb aligned with the index finger. Don't wrap it over your knuckles, as that can be confused with the letter 'S'.",
    mistakes: 'Avoid excessive tension in your wrist. Relax the hand while maintaining a firm fist shape for better clarity.',
    vocabulary: ['vocab-a', 'vocab-apple', 'vocab-aunt']
  },
  {
    id: 'lesson2',
    title: 'Essential Hello & Goodbye',
    category: 'Greetings',
    level: 'Beginner',
    progress: 45,
    status: 'In Progress',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7cwo1rYsW7jomessTXN6uoNl1Xql2peRtICxrxm5C6i3AbMJAtpfIpGb-Wye98UG0MfIXiYdkuXdilEdNtN-n7QFXf5ezuSnCfWt4EcBHvcZYT1C1-LvY9_IQKBMo6AJf0MTeELJpYrNiYBWOfKvHKlNg_4o-Msgb09RJMEmmQWoKC0Y4jN_pbRpFfhm6L_tpZAQJ-tcSnSYFCU9EgW7dTlW95bdgASzPb4bbptIqe9tg04vMlXacmO6BJzR8byN4Sdf40hcZVCkR',
    description: 'Learn the primary greeting hand placements, thumb gestures, and body language to make a great first impression.',
    duration: '12 mins',
    rating: 4.8,
    breadcrumbs: ['Greetings', 'Basics'],
    tips: 'Ensure your head mimics a friendly greeting pose; facial expressions represent 50% of the signed delivery.',
    mistakes: 'Do not raise your arm too high, keep the arm and shoulder natural and relaxed.',
    vocabulary: ['vocab-collaboration']
  },
  {
    id: 'lesson3',
    title: 'Counting: 1 to 20',
    category: 'Numbers',
    level: 'Beginner',
    progress: 0,
    status: 'Not Started',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGaNQAbWncOW0toC2uUKkiIK2L2GNuEbqdcXmVZaZHN2PYazuk6tap5oaNH0_hx-H7zwjI7kBmxmkwgSuap7UM_xOEBdGpjbQ1L0vzmOxyVLknPibUzT6dXAI15U9fL8ouZmZNQ9vIPFkWN5fuZCzj1ASdX5fyH_eG8PjPVQBIyGNWSaWPCGnucK8az0H5suhequ1l1rTs6xXWSVCgkpLN823L5hGT-n1sIF0oWkPuRJrpB3-pMob5ZMPY8SpSgo2kzkmbsRwb_Z4t',
    description: 'Learn to count and express quantities fluently, understanding finger arrangement from 1 to 20.',
    duration: '10 mins',
    rating: 4.8,
    breadcrumbs: ['Numbers', 'Basic Counting'],
    tips: 'For numbers 1 to 5, the palm normally faces inwards toward yourself. For 6 to 10, the palm faces outwards.',
    mistakes: 'Do not curl your fingers too much; try to present flat, clean positions.',
    vocabulary: []
  },
  {
    id: 'lesson4',
    title: 'Family Relationships',
    category: 'Family',
    level: 'Intermediate',
    progress: 12,
    status: 'In Progress',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDf6d8w3eMxfVZgyfNpoPqd7HnX7g7AoDDritr343oKOyXHM79QTtiXJ92xq5QYT3zdU633XvDOlIoMbZnOV4OUq4wvPHkULBUsbpxVUxSqq3bNtg15NTyFwPyrcgsfvhdUFiLsra7Pvwm00iPhBvLke1uyzUnNfYgjYECT8rqI_JsMeA6hMwZDQXMLMVq_6IgV6fePc_FTxEEO3aayx5gG0i9ilUD4MgFnKtC_BKhcQDUH7sU0hvN0B235zBpWy-veBC5mDEPPSSq8',
    description: 'Build your vocabulary for defining family members: Mother, Father, Aunt, Uncle, and others in real-life contexts.',
    duration: '18 mins',
    rating: 4.9,
    breadcrumbs: ['Family', 'Connections'],
    tips: 'Female signs are usually made near the chin/jaw, and male signs are made near the forehead.',
    mistakes: 'Be gentle with circling; making massive circles can distort the meaning to outer family descriptors.',
    vocabulary: ['vocab-aunt']
  },
  {
    id: 'lesson5',
    title: 'At the Restaurant',
    category: 'Food',
    level: 'Beginner',
    progress: 0,
    status: 'Not Started',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSL48Dbovf6JFwXNxNQU5ZuriMVjFaUZWFRRcoS9xQtcxB7tfbCFbwzULGxq_cXUCMwJQpccf7y3V_Sh1y2NCJVNb6IpriTLESUha9NL-yF4NYWNzWiden-n5Ure5XGMQEV555tLiv_mw5FxKIMNcvNBAhhN5BYRlsPt56jl9xPfF4AxG8-NjKnRADSe5rn4KSwzLTiTJTCqfSO1X4eNSvsp4l5kJzD7h60UZuh8SIDvpd0x3boEQp3L1AdUjpjhOP2by8c8C7TP5f',
    description: 'Order food, ask for water, express hunger, or give compliments to the chef using standard ASL food system verbs.',
    duration: '14 mins',
    rating: 4.7,
    breadcrumbs: ['Food', 'Dining out'],
    tips: 'Tap twice to confirm restaurant adjectives (e.g. food, water). Single long motion represents verbs.',
    vocabulary: []
  },
  {
    id: 'lesson6',
    title: 'Introducing Yourself',
    category: 'Greetings',
    level: 'Beginner',
    progress: 78,
    status: 'In Progress',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR8RZJgOGVACqkFVeYQiAswShhVYVn4Dk8-xTwZi2D6q5jywTHmr1Z63t3F_Nl88RdmEKfyK_1Qx9HzqjdAOkznXIsY-XSQS1cmJwlceHv-kdnn4S2JziWG4Xmae_h5gIh9-gSIW-wuZssFE5P5PlSYv-TZ0FuaP-lsOsxCpmCNTPmkh69ZES5ZVoB9v0TZtBBrM389hRAVGvsfUevouv0zToppd7xiHMYZaGxSh95qgEmx_eDcQL6sT84kNSMxTeoozYp4CADk2G2',
    description: 'Start simple conversational exchanges, including telling your name, finger spelling alias, and asking how others are.',
    duration: '16 mins',
    rating: 4.9,
    breadcrumbs: ['Greetings', 'Intros'],
    tips: 'Smile and tilt your head slightly when asking personal questions; they make you look friendly and genuine.',
    vocabulary: ['vocab-collaboration']
  },
  {
    id: 'lesson7',
    title: 'Finger Spelling Mastery',
    category: 'Alphabet',
    level: 'Intermediate',
    progress: 0,
    status: 'Not Started',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMOsgqF8a4ySnyW5xzBxltyzdY-06KJL1BesVIcumk4VKyun1fBms2H4PozarmRQxWGEll4vySSBpKRpbsXEvmypG_KRq-SjF5urDVc756MAppWr2whmQ0JE15aKvpP_pwWdbRSeimAC8MqGCMOtOkIIFsQQafuio_pes7OgQgrZ_rQVuCBZrTB2hPHmDS2L4PAIaRJfe20lV4ksTHwesNylddDe5_eQ2cnsMi-ejKQvpqXu4xKJb86yc9H4r2j3kMzTV1w_WY-Mne',
    description: 'Boost your transition speed and clarity when spelling complete words. Includes double-letter techniques.',
    duration: '20 mins',
    rating: 5.0,
    breadcrumbs: ['Alphabet', 'Speed Spelling'],
    tips: 'Slide your hand slightly outward for double letters to represent correct length spelling.',
    vocabulary: ['vocab-a', 'vocab-environment']
  },
  {
    id: 'lesson8',
    title: 'Expressing Emotions',
    category: 'Feelings',
    level: 'Beginner',
    progress: 0,
    status: 'Not Started',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCJRPVsJ882VYd8ohUOH7y5e1Pjv67ptIZxd8L3VgxnQpmYec3J_a9frFkINbWDlKybrG9yDxd3wN1yIGW8KiumewUUBHXbzeEwokc3m_8J3c4jZ30E3WHS6reiM8PeRb5DIqWIvJoBqMosgcCs3tFCovn_t4A-1WXQSTuJFShDoSwSO6nC93YVc5fWys55yTczaFdkJ6LdGLrC-Y5jdXpzDy6FckZ29oSiMBlpsWZbG9c_dh0BsjIfbp_3WbKMIJwl4g4w3V4qUFHR',
    description: 'Express happiness, excitement, sadness, and surprise clearly, combining expressive fingers with rich facial values.',
    duration: '15 mins',
    rating: 4.8,
    breadcrumbs: ['Feelings', 'Basic expression'],
    tips: 'Your facial expressions must match the sign! Do not sign "happy" with a monotonous or sad face.',
    vocabulary: []
  }
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach-streak',
    title: 'Daily Streak',
    description: '10 Days Hero',
    icon: 'workspace_premium',
    color: 'from-orange-500 to-amber-500',
    secured: true
  },
  {
    id: 'ach-learner',
    title: 'Fast Learner',
    description: '3 Lessons/Day',
    icon: 'auto_awesome',
    color: 'from-blue-500 to-cyan-500',
    secured: true
  },
  {
    id: 'ach-score',
    title: 'Perfect Score',
    description: '100% Accuracy',
    icon: 'stars',
    color: 'from-green-500 to-emerald-500',
    secured: true
  },
  {
    id: 'ach-lock',
    title: 'Mystery Badge',
    description: 'Locked',
    icon: 'lock',
    color: 'from-gray-400 to-slate-500',
    secured: false
  }
];

export const INITIAL_RECENT_RESULTS: RecentResult[] = [
  {
    id: 'res-hello',
    sign: "ASL 'Hello'",
    accuracy: 92,
    icon: 'front_hand',
    statusText: 'Practiced today',
    timeAgo: 'Added today'
  },
  {
    id: 'res-thanks',
    sign: "ASL 'Thank You'",
    accuracy: 88,
    icon: 'back_hand',
    statusText: 'Yesterday',
    timeAgo: 'Yesterday'
  },
  {
    id: 'res-a',
    sign: "ASL 'A'",
    accuracy: 100,
    icon: 'waving_hand',
    statusText: 'Mastered',
    timeAgo: '2 days ago'
  }
];
