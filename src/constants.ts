import { LiturgicalSeason, LiturgicalColor } from './types';

export const SEASON_COLORS: Record<LiturgicalSeason, LiturgicalColor> = {
  ORDINARY: {
    primary: '#059669', // Green 600
    secondary: '#D1FAE5',
    text: '#064E3B',
  },
  LENT: {
    primary: '#7C3AED', // Violet 600
    secondary: '#EDE9FE',
    text: '#4C1D95',
  },
  ADVENT: {
    primary: '#7C3AED', // Violet 600
    secondary: '#EDE9FE',
    text: '#4C1D95',
  },
  EASTER: {
    primary: '#D97706', // Amber 600 (Gold/White)
    secondary: '#FEF3C7',
    text: '#78350F',
  },
  CHRISTMAS: {
    primary: '#D97706', // Amber 600
    secondary: '#FEF3C7',
    text: '#78350F',
  },
  FEAST: {
    primary: '#DC2626', // Red 600
    secondary: '#FEE2E2',
    text: '#7F1D1D',
  },
};

export const MASS_SECTIONS_ORDER = [
  'Entrée',
  'Kyrie',
  'Gloria',
  'Liturgie de la parole',
  'Acclamation',
  'Credo',
  'Prière des fidèles',
  'Offertoire',
  'Sanctus',
  'Agnus Dei',
  'Communion',
  'Action de grâce',
  'Renvoi',
];
