import {
  BookMarked,
  Crosshair,
  FlaskConical,
  Home,
  Library,
  Trophy,
  Wallet,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  shortLabel: string;
  icon: typeof Home;
  /** Shown in the top bar as the page's subtitle. */
  blurb: string;
  inBottomNav: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    label: 'Home',
    shortLabel: 'Home',
    icon: Home,
    blurb: 'Your route from first candle to first trade',
    inBottomNav: true,
  },
  {
    to: '/candlesticks',
    label: 'Candle Lab',
    shortLabel: 'Lab',
    icon: FlaskConical,
    blurb: 'Build the shapes yourself, then hunt them down',
    inBottomNav: true,
  },
  {
    to: '/patterns',
    label: 'Shape Hunt',
    shortLabel: 'Hunt',
    icon: Crosshair,
    blurb: 'Find the shape hiding in the chart — then see if it works',
    inBottomNav: true,
  },
  {
    to: '/case-studies',
    label: 'Story Time',
    shortLabel: 'Story',
    icon: Library,
    blurb: 'Four true market stories, told candle by candle',
    inBottomNav: true,
  },
  {
    to: '/simulator',
    label: 'Trading Floor',
    shortLabel: 'Trade',
    icon: Wallet,
    blurb: 'Your own desk: orders, size, stops and P&L',
    inBottomNav: true,
  },
  {
    to: '/progress',
    label: 'Trophy Room',
    shortLabel: 'You',
    icon: Trophy,
    blurb: 'Levels, badges, and what to play next',
    inBottomNav: false,
  },
  {
    to: '/glossary',
    label: 'Cheat Sheet',
    shortLabel: 'Terms',
    icon: BookMarked,
    blurb: 'Every bit of jargon, in plain English',
    inBottomNav: false,
  },
];

export function navItemFor(pathname: string): NavItem {
  if (pathname.startsWith('/case-studies')) return NAV_ITEMS[3];
  return NAV_ITEMS.find((item) => item.to === pathname) ?? NAV_ITEMS[0];
}
