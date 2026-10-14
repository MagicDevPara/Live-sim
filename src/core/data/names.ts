import type { BaseLang } from '../types';

/** Имена в латинской транслитерации — так выглядит большинство реальных ников. */
export const FIRST_NAMES: Record<BaseLang, readonly string[]> = {
  ru: [
    'alex', 'sasha', 'dima', 'maks', 'artem', 'nikita', 'ivan', 'kirill', 'egor', 'misha',
    'denis', 'roma', 'vlad', 'pasha', 'sergey', 'andrey', 'anton', 'ilya', 'oleg', 'zhenya',
    'masha', 'dasha', 'katya', 'nastya', 'polina', 'alina', 'sonya', 'lera', 'vika', 'yulia',
    'kristina', 'anya', 'liza', 'vera', 'olya', 'diana', 'karina', 'marina', 'tanya', 'sveta',
    'timur', 'gleb', 'stas', 'lesha', 'kostya', 'arina', 'milana', 'eva', 'ksyusha', 'nadya',
  ],
  uk: [
    'oleksandr', 'olena', 'taras', 'bohdan', 'yaroslav', 'ostap', 'mykola', 'andrii', 'dmytro', 'serhii',
    'yurii', 'vasyl', 'petro', 'ivanka', 'solomiia', 'oksana', 'kateryna', 'khrystyna', 'iryna', 'nataliia',
    'yana', 'zlata', 'marichka', 'bohdana', 'sofiia', 'nastia', 'vitalii', 'maksym', 'danylo', 'nazar',
    'roman', 'orest', 'lesia', 'halyna', 'viktoriia', 'mariia', 'yuliia', 'denys', 'ihor', 'olia',
    'stepan', 'markiian', 'svyatoslav', 'vlada', 'dariia', 'uliana', 'myroslava', 'yevhen', 'tymofii', 'zakhar',
  ],
  en: [
    'jake', 'emma', 'liam', 'olivia', 'noah', 'ava', 'ethan', 'mia', 'lucas', 'chloe',
    'mason', 'sophia', 'logan', 'grace', 'ryan', 'ella', 'tyler', 'zoe', 'dylan', 'lily',
    'jack', 'ruby', 'leo', 'amelia', 'max', 'harper', 'owen', 'nora', 'evan', 'jess',
    'kyle', 'megan', 'sam', 'alexis', 'cole', 'hannah', 'luke', 'kate', 'josh', 'sarah',
    'aiden', 'bella', 'carter', 'daisy', 'finn', 'ivy', 'jayden', 'maya', 'nate', 'paige',
  ],
};

export const LAST_NAMES: Record<BaseLang, readonly string[]> = {
  ru: [
    'ivanov', 'petrov', 'smirnov', 'kuznetsov', 'popova', 'volkova', 'sokolov', 'lebedev', 'kozlova', 'novikov',
    'morozov', 'orlova', 'pavlov', 'fedorova', 'belov', 'egorova', 'zaitsev', 'romanov', 'markov', 'gromova',
  ],
  uk: [
    'shevchenko', 'kovalenko', 'bondarenko', 'tkachenko', 'kravchenko', 'melnyk', 'boiko', 'kovalchuk', 'oliinyk', 'lysenko',
    'marchenko', 'savchenko', 'rudenko', 'moroz', 'petrenko', 'hnatiuk', 'kostiuk', 'didenko', 'pavlenko', 'yatsenko',
  ],
  en: [
    'smith', 'johnson', 'brown', 'miller', 'davis', 'wilson', 'moore', 'taylor', 'clark', 'lewis',
    'walker', 'hall', 'young', 'king', 'wright', 'scott', 'green', 'baker', 'adams', 'turner',
  ],
};

export const NICK_WORDS: readonly string[] = [
  'sunny', 'vibes', 'life', 'daily', 'art', 'photo', 'travel', 'fit', 'music', 'coffee',
  'moon', 'star', 'wave', 'night', 'gold', 'cloud', 'pixel', 'ghost', 'lucky', 'wild',
  'cozy', 'mint', 'neon', 'vlog', 'pro', 'real', 'just', 'its', 'mood', 'dream',
  'cherry', 'velvet', 'honey', 'storm', 'chill', 'blue', 'retro', 'cat', 'fox', 'bear',
];

export const AVATAR_GLYPHS: readonly string[] = [
  '🌸', '🐱', '⚡', '🌙', '🔥', '🦊', '🍒', '🌊', '🎧', '🐻', '🌻', '💫', '🍀', '🎮', '♠️', '🐶',
];

export const CITIES: Record<BaseLang, readonly string[]> = {
  ru: ['Киева', 'Харькова', 'Одессы', 'Днепра', 'Минска', 'Алматы', 'Варшавы', 'Берлина', 'Праги', 'Тбилиси', 'Батуми', 'Риги'],
  uk: ['Києва', 'Львова', 'Харкова', 'Одеси', 'Дніпра', 'Вінниці', 'Полтави', 'Запоріжжя', 'Ужгорода', 'Варшави', 'Кракова', 'Тернополя'],
  en: ['London', 'NYC', 'Toronto', 'Berlin', 'Warsaw', 'LA', 'Dublin', 'Sydney', 'Chicago', 'Miami', 'Prague', 'Lisbon'],
};
