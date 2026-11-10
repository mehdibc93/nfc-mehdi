import type { Locale } from '../lib/i18n';

// Catalogue léger des jeux (sans leur code) : utilisé par la salle de jeux et par les réglages du
// tableau de bord. Les jeux d'ambiance existent en français, anglais et chinois.

export type PartyLocale = 'fr' | 'en' | 'zh';

/** Langue des jeux : français et chinois si choisis, anglais pour toutes les autres langues. */
export function toPartyLocale(locale: Locale): PartyLocale {
  return locale === 'fr' || locale === 'zh' ? locale : 'en';
}

type Localized = Record<PartyLocale, string>;

export type CatalogEntry = {
  id: string;
  emoji: string;
  kind: 'fun' | 'brain' | 'classic';
  tint: string;
  title: Localized;
  text: Localized;
  players: Localized;
  /** Langues où le jeu a du sens (le petit bac repose sur l'alphabet latin). */
  locales?: PartyLocale[];
};

const FROM2: Localized = { fr: 'Dès 2 joueurs', en: '2+ players', zh: '2人起' };
const FROM3: Localized = { fr: 'Dès 3 joueurs', en: '3+ players', zh: '3人起' };

export const PARTY_CATALOG: CatalogEntry[] = [
  {
    id: 'rather',
    emoji: '⚖️',
    kind: 'fun',
    tint: '#e0f4f4',
    title: { fr: 'Tu préfères ?', en: 'Would you rather?', zh: '你更愿意？' },
    text: { fr: 'De vrais dilemmes qui font débattre', en: 'Real dilemmas that spark debate', zh: '让全桌争论不休的两难选择' },
    players: FROM2,
  },
  {
    id: 'price',
    emoji: '🏷️',
    kind: 'brain',
    tint: '#dcf7e6',
    title: { fr: 'Devine le prix', en: 'Guess the price', zh: '猜价格' },
    text: { fr: 'Le plus proche du prix de la carte gagne', en: 'Closest to the menu price wins', zh: '最接近菜单价格的人得分' },
    players: FROM2,
  },
  {
    id: 'roulette',
    emoji: '👆',
    kind: 'fun',
    tint: '#fde2e4',
    title: { fr: 'Qui paie ?', en: 'Who pays?', zh: '谁买单？' },
    text: { fr: 'Un doigt chacun, le hasard désigne', en: 'One finger each, fate decides', zh: '每人按住一根手指，命运来决定' },
    players: FROM2,
  },
  {
    id: 'potato',
    emoji: '💣',
    kind: 'fun',
    tint: '#ffe8d6',
    title: { fr: 'La patate chaude', en: 'Hot potato', zh: '烫手山芋' },
    text: { fr: 'Un mot, on passe… avant que ça explose', en: 'Say a word, pass it on… before it blows', zh: '说一个词，快传下去……别让它爆炸' },
    players: FROM3,
  },
  {
    id: 'undercover',
    emoji: '🕵️',
    kind: 'fun',
    tint: '#ece4ff',
    title: { fr: 'Undercover', en: 'Undercover', zh: '谁是卧底' },
    text: { fr: 'Tous le même mot… sauf un', en: 'Everyone has the same word… except one', zh: '大家词语相同……除了一个人' },
    players: FROM3,
  },
  {
    id: 'reflex',
    emoji: '🎯',
    kind: 'fun',
    tint: '#e0ecff',
    title: { fr: 'Duel de réflexes', en: 'Reflex duel', zh: '反应对决' },
    text: { fr: 'Face à face : le plus rapide au vert', en: 'Face to face: fastest on green wins', zh: '面对面：变绿时最快的人获胜' },
    players: { fr: '2 joueurs', en: '2 players', zh: '2人' },
  },
  {
    id: 'forehead',
    emoji: '🤔',
    kind: 'fun',
    tint: '#fff4cc',
    title: { fr: 'Le mot sur le front', en: 'Word on your forehead', zh: '额头猜词' },
    text: { fr: 'Faites deviner le mot sans le dire', en: 'Make them guess without saying it', zh: '不说出词语，让对方猜出来' },
    players: FROM2,
  },
  {
    id: 'quiz',
    emoji: '🧠',
    kind: 'brain',
    tint: '#fde2e4',
    title: { fr: 'Quiz éclair', en: 'Lightning quiz', zh: '闪电问答' },
    text: { fr: 'Le premier qui répond marque', en: 'First to answer scores', zh: '最先答对的人得分' },
    players: FROM2,
  },
  {
    id: 'cursed',
    emoji: '🔮',
    kind: 'brain',
    tint: '#ece4ff',
    title: { fr: 'Le nombre maudit', en: 'The cursed number', zh: '诅咒数字' },
    text: { fr: 'Ne tombe pas dessus… sinon gage !', en: 'Don’t land on it… or take a dare!', zh: '千万别猜中……否则要接受惩罚！' },
    players: FROM2,
  },
  {
    id: 'whoofus',
    emoji: '👉',
    kind: 'fun',
    tint: '#e0f4f4',
    title: { fr: 'Qui de nous ?', en: 'Who among us?', zh: '我们之中谁？' },
    text: { fr: '3, 2, 1… tout le monde pointe', en: '3, 2, 1… everyone points', zh: '3、2、1……大家一起指' },
    players: FROM3,
  },
  {
    id: 'letters',
    emoji: '🔤',
    kind: 'brain',
    tint: '#ffe8d6',
    title: { fr: 'Petit bac express', en: 'Letter rush', zh: '字母挑战' },
    text: { fr: 'Une lettre, une catégorie, 8 secondes', en: 'One letter, one category, 8 seconds', zh: '一个字母，一个类别，8秒' },
    players: FROM2,
    locales: ['fr', 'en'],
  },
];

/** Jeux classiques (plateau et cartes), pour les réglages du tableau de bord. */
export const CLASSIC_CATALOG: { id: string; emoji: string; fr: string; en: string }[] = [
  { id: 'cards', emoji: '🃏', fr: 'Couleurs (jeu de cartes)', en: 'Colours (card game)' },
  { id: 'billiards', emoji: '🎱', fr: 'Billard', en: 'Pool' },
  { id: 'connect4', emoji: '🔴', fr: 'Puissance 4', en: 'Connect 4' },
  { id: 'tictactoe', emoji: '❌', fr: 'Morpion', en: 'Tic-tac-toe' },
];
