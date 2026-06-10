/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  type: 'meaning' | 'spelling' | 'webcam';
}

export interface Lesson {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string; // Alphabet, Numbers, Greetings, Food, Family, Feelings
  progress: number;
  status: 'Not Started' | 'In Progress' | 'Mastered';
  imageUrl: string;
  description: string;
  signGuide: string;
  steps: string[];
  letterTarget: string; // The specific sign/letter we want to train (e.g. "A", "Y", "Hello")
  quizQuestions: QuizQuestion[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  unlockedAt?: string;
}

export interface UserStats {
  xp: number;
  level: number;
  lessonsCompleted: number;
  practiceTimeMinutes: number;
  streakDays: number;
  lastPracticedDate?: string;
  achievements: Achievement[];
}

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_step',
    title: 'First Contact',
    description: 'Completed your very first sign language lesson!',
    icon: 'Sparkles',
  },
  {
    id: 'streak_3',
    title: 'Consistent Learner',
    description: 'Maintained a practice run of 3 consecutive days.',
    icon: 'Flame',
  },
  {
    id: 'alphabet_master',
    title: 'Finger Spelling Legend',
    description: 'Achieve 100% progress on all Alphabet category lessons.',
    icon: 'Award',
  },
  {
    id: 'ai_pioneer',
    title: 'AI Sign Novice',
    description: 'Run your first successful hand sign evaluation using the AI Camera.',
    icon: 'Brain',
  },
];

export const INITIAL_LESSONS: Lesson[] = [
  {
    id: 'lesson_1',
    title: 'The ABCs of ASL',
    difficulty: 'Beginner',
    category: 'Alphabet',
    progress: 100,
    status: 'Mastered',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBM80mRlp9f86fVHC09nRipAJ_X322XguZ1iOhW9kRSB3ITeUIBO4LwcT3g0WUV680UoTOnhQB1M5V_Dvc0DTSN6Gfz-PYrZIa4JSqLbb8gi9R2O26zepW7zwMvguh57Kqm-BQUmBkw5lYzUReM5ScqUIXJ_7dYHSOWHmARTQHhrUn2hbA_2sSvOj812j-sSh2nTRyFTkEB0rSIsiurJP_nrBLsu884oHy3ZKCfRZUncXuXxevuZyTpGclQ1JFRx4GXscrPZolkDHka',
    description: 'Learn to spell your name, understand finger placements, and master essential letters from A to Z.',
    signGuide: 'Keep your hand upright. For letter "A", clench your fist and place your thumb pressed tightly along the side of the index finger. For "Y", tuck down index, middle, and ring fingers, keeping only the thumb and pinky extended.',
    steps: [
      'Position your hand and wrist comfortable at shoulder height.',
      'Letter A: Clench fist with the thumb resting vertically on the side of the index finger.',
      'Letter B: Open flat palm, fingers together, thumb crossed in front of your palm.',
      'Letter C: Curve all fingers and thumb to form a large semi-circular "C" shape.',
    ],
    letterTarget: 'A',
    quizQuestions: [
      {
        id: 'q1_1',
        type: 'meaning',
        question: 'Which of these is the correct thumb placement for the letter "A" in ASL?',
        options: [
          'Pressed flat on top of the fingernails',
          'Tucked completely inside the clenched fist',
          'Pressed vertically flat against the outer side of the index finger',
          'Extended completely outward pointing sideways',
        ],
        correctAnswer: 'Pressed vertically flat against the outer side of the index finger',
      },
      {
        id: 'q1_2',
        type: 'spelling',
        question: 'How do you form the ASL sign for the letter "Y"?',
        options: [
          'Extend only the index and middle finger',
          'Extend only the thumb and pinky finger, folding down the middle 3 fingers',
          'Make a fist and circle your wrist clockwise',
          'Make a flat hand and place it on your chest',
        ],
        correctAnswer: 'Extend only the thumb and pinky finger, folding down the middle 3 fingers',
      },
    ],
  },
  {
    id: 'lesson_2',
    title: 'Essential Hello & Goodbye',
    difficulty: 'Beginner',
    category: 'Greetings',
    progress: 45,
    status: 'In Progress',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7cwo1rYsW7jomessTXN6uoNl1Xql2peRtICxrxm5C6i3AbMJAtpfIpGb-Wye98UG0MfIXiYdkuXdilEdNtN-n7QFXf5ezuSnCfWt4EcBHvcZYT1C1-LvY9_IQKBMo6AJf0MTeELJpYrNiYBWOfKvHKlNg_4o-Msgb09RJMEmmQWoKC0Y4jN_pbRpFfhm6L_tpZAQJ-tcSnSYFCU9EgW7dTlW95bdgASzPb4bbptIqe9tg04vMlXacmO6BJzR8byN4Sdf40hcZVCkR',
    description: 'Greetings form the foundation of communication. Master polite phrases to start your first visual conversations.',
    signGuide: 'For "Hello", place your hand near your forehead like a salute, and move it slightly out and away. For "Thank You", touch the tips of your open hand fingers to your lips, then move the hand down and forward toward the person you are speaking with.',
    steps: [
      'Hello: Touch the index-finger edge of your flat hand near your temple.',
      'Hello: Pivot or salute outward in a friendly, gentle motion.',
      'Thank You: Touch the flat fingers of your dominant hand to your bottom lip.',
      'Thank You: Move the hand straight forward and slightly down, palm facing up.',
    ],
    letterTarget: 'Hello',
    quizQuestions: [
      {
        id: 'q2_1',
        type: 'meaning',
        question: 'What gesture resembles a gentle, friendly "salute" starting from your temple?',
        options: ['Goodbye', 'Please', 'Hello', 'Excuse me'],
        correctAnswer: 'Hello',
      },
      {
        id: 'q2_2',
        type: 'meaning',
        question: 'To sign "Thank you", where do you place your flat hand fingers first?',
        options: [
          'On your forehead',
          'On your throat',
          'Against your bottom lip or chin',
          'Covering your heart',
        ],
        correctAnswer: 'Against your bottom lip or chin',
      },
    ],
  },
  {
    id: 'lesson_3',
    title: 'Counting: 1 to 20',
    difficulty: 'Beginner',
    category: 'Numbers',
    progress: 0,
    status: 'Not Started',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGaNQAbWncOW0toC2uUKkiIK2L2GNuEbqdcXmVZaZHN2PYazuk6tap5oaNH0_hx-H7zwjI7kBmxmkwgSuap7UM_xOEBdGpjbQ1L0vzmOxyVLknPibUzT6dXAI15U9fL8ouZmZNQ9vIPFkWN5fuZCzj1ASdX5fyH_eG8PjPVQBIyGNWSaWPCGnucK8az0H5suhequ1l1rTs6xXWSVCgkpLN823L5hGT-n1sIF0oWkPuRJrpB3-pMob5ZMPY8SpSgo2kzkmbsRwb_Z4t',
    description: 'Learn the cardinal numbers from 1 to 20 with precise spacing, palm facing rules, and count flow.',
    signGuide: 'For numbers 1 to 5, your palm should face INWARD toward your face. For 1, raise only your index finger. For 2, raise index and middle. For 3, raise index, middle, and thumb (not ring!). For 4, raise 4 fingers hiding thumb. For 5, raise all fingers.',
    steps: [
      'Palm faces inward (towards yourself) for numbers 1 to 5.',
      'Sign 1: Raise index finger.',
      'Sign 2: Raise index and middle fingers.',
      'Sign 3: Raise index, middle, AND thumb (be careful not to raise the ring instead of thumb).',
    ],
    letterTarget: '3',
    quizQuestions: [
      {
        id: 'q3_1',
        type: 'meaning',
        question: 'Which way should your palm face when signing the numbers 1 through 5 in ASL?',
        options: [
          'Facing outward towards the other person',
          'Facing inward towards your own face',
          'Facing sideways pointing left',
          'Facing down towards the floor',
        ],
        correctAnswer: 'Facing inward towards your own face',
      },
      {
        id: 'q3_2',
        type: 'spelling',
        question: 'Which specific three fingers are raised to sign the number "3"?',
        options: [
          'Index, middle, and ring fingers',
          'Thumb, index, and pinky fingers',
          'Thumb, index, and middle fingers',
          'Middle, ring, and pinky fingers',
        ],
        correctAnswer: 'Thumb, index, and middle fingers',
      },
    ],
  },
  {
    id: 'lesson_4',
    title: 'Family Relationships',
    difficulty: 'Intermediate',
    category: 'Family',
    progress: 12,
    status: 'In Progress',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDf6d8w3eMxfVZgyfNpoPqd7HnX7g7AoDDritr343oKOyXHM79QTtiXJ92xq5QYT3zdU633XvDOlIoMbZnOV4OUq4wvPHkULBUsbpxVUxSqq3bNtg15NTyFwPyrcgsfvhdUFiLsra7Pvwm00iPhBvLke1uyzUnNfYgjYECT8rqI_JsMeA6hMwZDQXMLMVq_6IgV6fePc_FTxEEO3aayx5gG0i9ilUD4MgFnKtC_BKhcQDUH7sU0hvN0B235zBpWy-veBC5mDEPPSSq8',
    description: 'Understand spatial zones for gender markers in ASL. Signs above the nose denote masculine, below the nose denote feminine.',
    signGuide: 'For "Mother", place an open "5"-hand with thumb touching your chin. For "Father", touch the thumb of the open "5"-hand to your forehead.',
    steps: [
      'Notice gender locations: upper face equals male, lower face equals female.',
      'Mother: Double-tap thumb of relaxed open palm near chin.',
      'Father: Double-tap thumb of relaxed open palm near forehead.',
      'Family: Form "F" hands (index & thumb touching, other fingers up) with both hands, touching thumbs, then sweep in a circle till pinkies touch.',
    ],
    letterTarget: 'Father',
    quizQuestions: [
      {
        id: 'q4_1',
        type: 'meaning',
        question: 'In ASL, masculine-gendered signs (like Father or Brother) are typically located near which region of the face?',
        options: [
          'Under the chin / neck area',
          'The lower jaw and mouth area',
          'The upper face / forehead area',
          'The cheeks and ears area',
        ],
        correctAnswer: 'The upper face / forehead area',
      },
      {
        id: 'q4_2',
        type: 'meaning',
        question: 'How is the ASL sign for "Mother" physically formed?',
        options: [
          'A flat palm rubbing your chest in a circle',
          'A closed fist striking the forehead',
          'Touch thumb of open "5" hand with spread fingers to the chin',
          'Pinching the nose with your index finger and thumb',
        ],
        correctAnswer: 'Touch thumb of open "5" hand with spread fingers to the chin',
      },
    ],
  },
  {
    id: 'lesson_5',
    title: 'At the Restaurant',
    difficulty: 'Beginner',
    category: 'Food & Drink',
    progress: 0,
    status: 'Not Started',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSL48Dbovf6JFwXNxNQU5ZuriMVjFaUZWFRRcoS9xQtcxB7tfbCFbwzULGxq_cXUCMwJQpccf7y3V_Sh1y2NCJVNb6IpriTLESUha9NL-yF4NYWNzWiden-n5Ure5XGMQEV555tLiv_mw5FxKIMNcvNBAhhN5BYRlsPt56jl9xPfF4AxG8-NjKnRADSe5rn4KSwzLTiTJTCqfSO1X4eNSvsp4l5kJzD7h60UZuh8SIDvpd0x3boEQp3L1AdUjpjhOP2by8c8C7TP5f',
    description: 'Learn foods, drinks, verbs like eat, drink, order, and how to politly ask for the check in sign language.',
    signGuide: 'For "Eat", bring a curved hand (fingertips touching thumb) to your mouth twice. For "Water", form a "W" hand with 3 middle fingers up, and tap your index finger to your chin.',
    steps: [
      'Eat: Form flat-O hand (like holding a taco) and tap it against your lips twice.',
      'Drink: Form a "C" shape with dominant hand, mimicking holding a glass, tipped up towards lips.',
      'Water: Form a "W" with index, middle, ring fingers. Tap index finger on chin.',
    ],
    letterTarget: 'Water',
    quizQuestions: [
      {
        id: 'q5_1',
        type: 'meaning',
        question: 'To sign "Water" in ASL, what shape do you hold and where do you tap it?',
        options: [
          'An "O" shape tapped against your nose',
          'A "W" shape (index, middle, ring fingers pointing up) tapped against your chin',
          'A flat palm rubbed down your neck',
          'Pointing your index finger into your ear',
        ],
        correctAnswer: 'A "W" shape (index, middle, ring fingers pointing up) tapped against your chin',
      },
    ],
  },
  {
    id: 'lesson_6',
    title: 'Introducing Yourself',
    difficulty: 'Beginner',
    category: 'Greetings',
    progress: 78,
    status: 'In Progress',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR8RZJgOGVACqkFVeYQiAswShhVYVn4Dk8-xTwZi2D6q5jywTHmr1Z63t3F_Nl88RdmEKfyK_1Qx9HzqjdAOkznXIsY-XSQS1cmJwlceHv-kdnn4S2JziWG4Xmae_h5gIh9-gSIW-wuZssFE5P5PlSYv-TZ0FuaP-lsOsxCpmCGTPmkh69ZES5ZVoB9v0TZtBBrM389hRAVGvsfUevouv0zToppd7xiHMYZaGxSh95qgEmx_eDcQL6sT84kNSMxTeoozYp4CADk2G2',
    description: 'Combine vocabulary into statements. Sign "My name is..." and understand how to ask "What is your name?".',
    signGuide: 'For "My", place your flat palm against your chest. For "Name", tap your dominant hand`s middle & index fingers crosswise twice over the non-dominant hand`s corresponding fingers.',
    steps: [
      'My: Press flat palm firmly to center of chest.',
      'Name: Extend index & middle fingers together on both hands ("H" shapes).',
      'Name: Tap dominant hand H over non-dominant hand H twice crosswise to form an X pattern.',
      'Nice to meet you: Slide flat palm of dominant hand across flat palm of non-dominant hand, then make 1-hand gestures pointing together.',
    ],
    letterTarget: 'My Name',
    quizQuestions: [
      {
        id: 'q6_1',
        type: 'meaning',
        question: 'How do you represent the possessive pronoun "My" in ASL?',
        options: [
          'Pointing directly at the listener',
          'Placing a flat palm firmly against the center of your own chest',
          'Pointing at your eyes with your index finger',
          'Shaking your fist vertically',
        ],
        correctAnswer: 'Placing a flat palm firmly against the center of your own chest',
      },
    ],
  },
  {
    id: 'lesson_7',
    title: 'Finger Spelling Mastery',
    difficulty: 'Intermediate',
    category: 'Alphabet',
    progress: 0,
    status: 'Not Started',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMOsgqF8a4ySnyW5xzBxltyzdY-06KJL1BesVIcumk4VKyun1fBms2H4PozarmRQxWGEll4vySSBpKRpbsXEvmypG_KRq-SjF5urDVc756MAppWr2whmQ0JE15aKvpP_pwWdbRSeimAC8MqGCMOtOkIIFsQQafuio_pes7OgQgrZ_rQVuCBZrTB2hPHmDS2L4PAIaRJfe20lV4ksTHwesNylddDe5_eQ2cnsMi-ejKQvpqXu4xKJb86yc9H4r2j3kMzTV1w_WY-Mne',
    description: 'Transition from single letter sign posture to fluent transitional spelling. Speed up your hand shapes!',
    signGuide: 'Spelling fluidly requires keeping your hand centered, relaxing your wrist, and avoiding bouncing your hand between characters.',
    steps: [
      'Keep arm steady, do not push your hand forward on each individual letter.',
      'Let your wrist flow naturally between transitions without jerking motions.',
      'Maintain stable shoulder-height presentation for visual clarity.',
    ],
    letterTarget: 'ASL',
    quizQuestions: [
      {
        id: 'q7_1',
        type: 'meaning',
        question: 'What is a major error to avoid when finger-spelling words in ASL?',
        options: [
          'Keeping your hand at shoulder height',
          'Bouncing or pushing your hand forward aggressively with each letter',
          'Looking at the person you are communicating with',
          'Transitioning smoothly without pausing',
        ],
        correctAnswer: 'Bouncing or pushing your hand forward aggressively with each letter',
      },
    ],
  },
  {
    id: 'lesson_8',
    title: 'Expressing Emotions',
    difficulty: 'Beginner',
    category: 'Feelings',
    progress: 0,
    status: 'Not Started',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCJRPVsJ882VYd8ohUOH7y5e1Pjv67ptIZxd8L3VgxnQpmYec3J_a9frFkINbWDlKybrG9yDxd3wN1yIGW8KiumewUUBHXbzeEwokc3m_8J3c4jZ30E3WHS6reiM8PeRb5DIqWIvJoBqMosgcCs3tFCovn_t4A-1WXQSTuJFShDoSwSO6nC93YVc5fWys55yTczaFdkJ6LdGLrC-Y5jdXpzDy6FckZ29oSiMBlpsWZbG9c_dh0BsjIfbp_3WbKMIJwl4g4w3V4qUFHR',
    description: 'Facial expressions are 50% of American Sign Language. Master signs for happy, sad, angry, and brave while aligning your facial indicators.',
    signGuide: 'For "Happy", circle flat hands brush upwards against your chest twice without striking hard, accompanied by a big, warm smile.',
    steps: [
      'Facial expression check: your face must match the emotion you are signing!',
      'Happy: Place flat palm(s) near chest, brushing up in circular motions.',
      'Sad: Bring both hands open (palms toward face, fingers spread) down slowly in front of face, while dropping head and eyes.',
    ],
    letterTarget: 'Happy',
    quizQuestions: [
      {
        id: 'q8_1',
        type: 'meaning',
        question: 'What is the role of facial expressions when signing emotions in ASL?',
        options: [
          'They are fully optional and mostly ignored in real conversations',
          'They represent minor accents but do not affect the literal meaning',
          'They are crucial elements of grammar and tone, equal in importance to hand signs',
          'They are only used by stage actors and not in everyday ASL',
        ],
        correctAnswer: 'They are crucial elements of grammar and tone, equal in importance to hand signs',
      },
    ],
  },
];
