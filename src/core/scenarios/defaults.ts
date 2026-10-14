import type { Scenario } from './ScenarioManager';

export const DEFAULT_SCENARIOS: Scenario[] = [
  {
    id: 'demo-start',
    name: 'Начало эфира',
    initialViewers: 340,
    chatMode: 'calm',
    speed: 1,
    updatedAt: 0,
    script: `# Постепенный рост аудитории в начале эфира
0:00 !viewers 340
0:02 anya.koval: привет!! 👋
0:04 dima_93: о, эфир
0:06 !viewers 1800 20s
0:08 !chat active
0:09 sasha.lebedev: давно ждал
0:12 marichka_ua: привіт з Києва ❤️
0:15 !hearts 25
0:18 jake.miller: hi from London
0:24 !viewers 4200 15s
0:26 its.nastya: вас уже так много 😳
0:30 !chat hyper
0:31 !hearts 40`,
  },
  {
    id: 'demo-poker',
    name: 'Покер: олл-ин на финалке',
    initialViewers: 12400,
    chatMode: 'active',
    speed: 1,
    updatedAt: 0,
    script: `# Напряжённая раздача: чат ускоряется, зрители растут
0:00 !chat active
0:03 maks_pko: финалка!! удачи
0:05 olena.boiko: скільки баунті зараз?
0:08 kirill.v: пуш или фолд?
0:10 !chat hyper
0:10 !viewers 18500 12s
0:12 taras_77: ОЛЛ-ІН 🔥🔥
0:13 vlad.petrov: колл!!!
0:15 !hearts 50
0:17 nastya.daily: молимся на ривер 🙏
0:20 egor__pro: ДААААА
0:21 lily.scott: insane call
0:24 !hearts 60
0:27 !viewers 15200 20s
0:30 !chat active
0:32 dmytro.melnyk: оце хіро-колл, респект`,
  },
  {
    id: 'demo-qa',
    name: 'Вопрос-ответ',
    initialViewers: 2600,
    chatMode: 'calm',
    speed: 1,
    updatedAt: 0,
    script: `# Зрители задают вопросы, остальное — спокойный фон
0:02 karina.s: а сколько ты уже на ютубе?
+8 roman.k: какой у тебя сетап?
+10 sofiia_lviv: а будет розіграш? 🙏
+9 max_wright: when is the next live?
+12 dasha_2004: спасибо за ответы ❤️
+3 !hearts 20`,
  },
];
