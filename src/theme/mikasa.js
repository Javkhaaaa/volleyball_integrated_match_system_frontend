// Volley Live design system. Light editorial palette: #2732D4 for frames,
// hero panels, subheadings, links; #FF5744 for main headings and key
// highlights; #EBEFF0 for the page background. Cards sit on pure white.
import { theme as antdAlgo } from 'antd';

export const TOKENS = {
  // Brand
  primary:        '#2732D4',
  primaryHover:   '#3D49EC',
  primaryActive:  '#1F28B8',
  accent:         '#FF5744',
  accentHover:    '#FF7264',
  accentActive:   '#E54530',

  // Surfaces (cool slate — Stripe-like)
  bg:             '#F4F6F9',  // page background
  bgElevated:     '#FFFFFF',  // cards, panels, header
  bgRaised:       '#ECEFF4',  // hover/raised inside cards
  bgHover:        '#DDE2EA',
  bgInput:        '#FFFFFF',

  // Borders & dividers
  border:         '#E2E6ED',
  borderStrong:   '#2732D4',

  // Text
  text:           '#0E1230',
  textSubtle:     '#2A3055',
  textMuted:      '#5A6080',
  textDim:        '#8A91AA',
  textOnAccent:   '#FFFFFF',
  textOnPrimary:  '#FFFFFF',

  // Semantic
  success:        '#1E9D4E',
  warning:        '#C97A04',
  danger:         '#DC2626',
  info:           '#0EA5E9',
  live:           '#FF3B30',

  // Radii
  radiusSm: 6,
  radiusMd: 10,
  radiusLg: 16,
  radiusXl: 24,

  // Shadows (lighter for light theme)
  shadowMd:  '0 6px 18px rgba(14,18,48,0.08)',
  shadowLg:  '0 18px 48px rgba(14,18,48,0.14)',
  shadowGlow:'0 0 24px rgba(39,50,212,0.30)',
};

// Back-compat — older files reference MIKASA.* constants. Mapped to the new
// tokens so we don't have to touch every legacy spot at once.
export const MIKASA = {
  blueVivid:     TOKENS.primary,
  blueVividDark: TOKENS.primaryActive,
  blue:          TOKENS.primary,
  blueDark:      TOKENS.primaryActive,
  blueLight:     TOKENS.primaryHover,
  yellow:        TOKENS.accent,
  yellowDark:    TOKENS.accentActive,
  flame:         TOKENS.accent,
  white:         TOKENS.bgElevated,
  textOnBlue:    TOKENS.textOnPrimary,
  bg:            TOKENS.bg,
  ink:           TOKENS.text,
};

export const antdTheme = {
  algorithm: antdAlgo.defaultAlgorithm,
  token: {
    colorPrimary:    TOKENS.primary,
    colorInfo:       TOKENS.info,
    colorSuccess:    TOKENS.success,
    colorWarning:    TOKENS.warning,
    colorError:      TOKENS.danger,
    colorBgBase:     TOKENS.bgElevated,
    colorBgLayout:   TOKENS.bg,
    colorBgContainer:TOKENS.bgElevated,
    colorBgElevated: TOKENS.bgElevated,
    colorBorder:     TOKENS.border,
    colorBorderSecondary: TOKENS.border,
    colorText:       TOKENS.text,
    colorTextSecondary: TOKENS.textSubtle,
    colorTextTertiary:  TOKENS.textMuted,
    colorTextQuaternary:TOKENS.textDim,
    colorLink:       TOKENS.primary,
    colorLinkHover:  TOKENS.primaryHover,
    borderRadius:    TOKENS.radiusMd,
    borderRadiusLG:  TOKENS.radiusLg,
    fontFamily: 'Inter, "Helvetica Neue", system-ui, -apple-system, Arial, sans-serif',
    fontSize: 14,
    controlHeight: 38,
  },
  components: {
    Layout: {
      headerBg:    TOKENS.bgElevated,
      bodyBg:      TOKENS.bg,
      headerColor: TOKENS.text,
      siderBg:     TOKENS.bgElevated,
      footerBg:    TOKENS.bgElevated,
    },
    Button: {
      controlHeightLG: 50,
      borderRadius: TOKENS.radiusMd,
      defaultBg: TOKENS.bgElevated,
      defaultBorderColor: TOKENS.border,
      defaultColor: TOKENS.text,
      primaryColor: TOKENS.textOnPrimary,
      fontWeight: 600,
    },
    Card: {
      colorBgContainer: TOKENS.bgElevated,
      headerBg: 'transparent',
      colorBorderSecondary: TOKENS.border,
      borderRadiusLG: TOKENS.radiusLg,
    },
    Modal: {
      contentBg: TOKENS.bgElevated,
      headerBg:  TOKENS.bgElevated,
      titleColor: TOKENS.text,
      borderRadiusLG: TOKENS.radiusLg,
    },
    Drawer: {
      colorBgElevated: TOKENS.bgElevated,
    },
    Table: {
      colorBgContainer: TOKENS.bgElevated,
      headerBg: TOKENS.bgRaised,
      headerColor: TOKENS.primary,
      headerSortActiveBg: TOKENS.bgHover,
      rowHoverBg: TOKENS.bgRaised,
      borderColor: TOKENS.border,
    },
    Tabs: {
      itemActiveColor:    TOKENS.accent,
      itemSelectedColor:  TOKENS.accent,
      itemHoverColor:     TOKENS.text,
      inkBarColor:        TOKENS.accent,
      itemColor:          TOKENS.textMuted,
    },
    Input: {
      colorBgContainer: TOKENS.bgInput,
      activeBorderColor: TOKENS.primary,
      hoverBorderColor: TOKENS.primaryHover,
    },
    Select: {
      colorBgContainer: TOKENS.bgInput,
      optionSelectedBg: TOKENS.primary,
      optionSelectedColor: TOKENS.textOnPrimary,
    },
    InputNumber: {
      colorBgContainer: TOKENS.bgInput,
    },
    DatePicker: {
      colorBgContainer: TOKENS.bgInput,
    },
    Menu: {
      itemBg:               'transparent',
      itemColor:            TOKENS.textSubtle,
      itemHoverColor:       TOKENS.primary,
      itemSelectedColor:    TOKENS.accent,
      itemSelectedBg:       'transparent',
      itemHoverBg:          TOKENS.bgRaised,
    },
    Tag: {
      defaultBg: TOKENS.bgRaised,
      defaultColor: TOKENS.textSubtle,
    },
    Switch: {
      colorPrimary: TOKENS.primary,
    },
    Empty: {
      colorTextDescription: TOKENS.textMuted,
    },
    Statistic: {
      colorTextDescription: TOKENS.textMuted,
      colorText: TOKENS.text,
    },
    Alert: {
      colorInfoBg: 'rgba(14,165,233,0.08)',
      colorInfoBorder: 'rgba(14,165,233,0.30)',
      colorWarningBg: 'rgba(201,122,4,0.08)',
      colorWarningBorder: 'rgba(201,122,4,0.30)',
      colorErrorBg: 'rgba(220,38,38,0.08)',
      colorErrorBorder: 'rgba(220,38,38,0.30)',
      colorSuccessBg: 'rgba(30,157,78,0.08)',
      colorSuccessBorder: 'rgba(30,157,78,0.30)',
    },
  },
};
