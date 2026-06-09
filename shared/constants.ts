export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const FIELD_LEFT = 90;
export const FIELD_RIGHT = 1190;
export const FIELD_TOP = 60;
export const FIELD_BOTTOM = 660;
export const FIELD_WIDTH = FIELD_RIGHT - FIELD_LEFT;
export const FIELD_HEIGHT = FIELD_BOTTOM - FIELD_TOP;
export const FIELD_CENTER_X = (FIELD_LEFT + FIELD_RIGHT) / 2;
export const FIELD_CENTER_Y = (FIELD_TOP + FIELD_BOTTOM) / 2;

export const GOAL_HEIGHT = 130;
export const GOAL_DEPTH = 30;
export const GOAL_TOP = FIELD_CENTER_Y - GOAL_HEIGHT / 2;
export const GOAL_BOTTOM = FIELD_CENTER_Y + GOAL_HEIGHT / 2;

export const PLAYER_SPEED = 210;
export const PLAYER_CHARGE_SPEED = 100;
export const PLAYER_RADIUS = 14;
export const PLAYER_SIZE_W = 24;
export const PLAYER_SIZE_H = 36;
export const HEAD_RADIUS = 11;

export const BALL_RADIUS = 8;
export const BALL_FRICTION = 0.984;
export const BALL_MIN_SPEED = 8;
export const MAX_KICK_POWER = 950;
export const MIN_KICK_POWER = 200;
export const POWER_FILL_TIME = 1.4;

export const GK_ZONE_DEPTH = 60;

export const GOAL_CELEBRATION_DURATION = 3000;
export const KICKOFF_DELAY = 1500;

export const DEFAULT_MATCH_DURATION = 90;
export const EXTRA_TIME_DURATION = 15;
export const PENALTY_COUNT = 5;

export const TEAM_COLORS: Record<string, { primary: string; secondary: string; text: string }> = {
  Germany:       { primary: '#FFFFFF', secondary: '#000000', text: '#000000' },
  France:        { primary: '#003189', secondary: '#FFFFFF', text: '#FFFFFF' },
  Spain:         { primary: '#C60B1E', secondary: '#FFC300', text: '#FFFFFF' },
  England:       { primary: '#FFFFFF', secondary: '#C8102E', text: '#000000' },
  Portugal:      { primary: '#006600', secondary: '#FF0000', text: '#FFFFFF' },
  Netherlands:   { primary: '#FF6600', secondary: '#FFFFFF', text: '#FFFFFF' },
  Belgium:       { primary: '#000000', secondary: '#CC0000', text: '#FFFFFF' },
  Italy:         { primary: '#003399', secondary: '#FFFFFF', text: '#FFFFFF' },
  Croatia:       { primary: '#CC0000', secondary: '#FFFFFF', text: '#FFFFFF' },
  Denmark:       { primary: '#CC0000', secondary: '#FFFFFF', text: '#FFFFFF' },
  Austria:       { primary: '#CC0000', secondary: '#FFFFFF', text: '#FFFFFF' },
  Switzerland:   { primary: '#CC0000', secondary: '#FFFFFF', text: '#FFFFFF' },
  Scotland:      { primary: '#003399', secondary: '#FFFFFF', text: '#FFFFFF' },
  Serbia:        { primary: '#CC0000', secondary: '#003399', text: '#FFFFFF' },
  Turkey:        { primary: '#CC0000', secondary: '#FFFFFF', text: '#FFFFFF' },
  Poland:        { primary: '#FFFFFF', secondary: '#CC0000', text: '#000000' },
  Brazil:        { primary: '#FFD700', secondary: '#009900', text: '#000000' },
  Argentina:     { primary: '#74ACDF', secondary: '#FFFFFF', text: '#000000' },
  Colombia:      { primary: '#FFD700', secondary: '#003380', text: '#000000' },
  Uruguay:       { primary: '#74ACDF', secondary: '#FFFFFF', text: '#000000' },
  Ecuador:       { primary: '#FFD700', secondary: '#003380', text: '#000000' },
  Venezuela:     { primary: '#CC0000', secondary: '#FFD700', text: '#FFFFFF' },
  USA:           { primary: '#002868', secondary: '#FFFFFF', text: '#FFFFFF' },
  Canada:        { primary: '#CC0000', secondary: '#FFFFFF', text: '#FFFFFF' },
  Mexico:        { primary: '#006600', secondary: '#FFFFFF', text: '#FFFFFF' },
  Panama:        { primary: '#CC0000', secondary: '#003380', text: '#FFFFFF' },
  Honduras:      { primary: '#003380', secondary: '#FFFFFF', text: '#FFFFFF' },
  'Costa Rica':  { primary: '#CC0000', secondary: '#003380', text: '#FFFFFF' },
  Morocco:       { primary: '#CC0000', secondary: '#006600', text: '#FFFFFF' },
  Senegal:       { primary: '#006600', secondary: '#FFD700', text: '#FFFFFF' },
  Egypt:         { primary: '#CC0000', secondary: '#FFFFFF', text: '#FFFFFF' },
  Nigeria:       { primary: '#006600', secondary: '#FFFFFF', text: '#FFFFFF' },
  'Ivory Coast': { primary: '#FF6600', secondary: '#FFFFFF', text: '#FFFFFF' },
  Cameroon:      { primary: '#006600', secondary: '#CC0000', text: '#FFFFFF' },
  Ghana:         { primary: '#FFFFFF', secondary: '#000000', text: '#000000' },
  Tunisia:       { primary: '#CC0000', secondary: '#FFFFFF', text: '#FFFFFF' },
  Algeria:       { primary: '#006600', secondary: '#FFFFFF', text: '#FFFFFF' },
  'South Africa':{ primary: '#006600', secondary: '#FFD700', text: '#FFFFFF' },
  Japan:         { primary: '#003380', secondary: '#FFFFFF', text: '#FFFFFF' },
  'South Korea': { primary: '#CC0000', secondary: '#003380', text: '#FFFFFF' },
  'Saudi Arabia':{ primary: '#006600', secondary: '#FFFFFF', text: '#FFFFFF' },
  Iran:          { primary: '#FFFFFF', secondary: '#CC0000', text: '#000000' },
  Australia:     { primary: '#FFD700', secondary: '#006600', text: '#000000' },
  Iraq:          { primary: '#000000', secondary: '#CC0000', text: '#FFFFFF' },
  Qatar:         { primary: '#660033', secondary: '#FFFFFF', text: '#FFFFFF' },
  Jordan:        { primary: '#000000', secondary: '#FFFFFF', text: '#FFFFFF' },
  'New Zealand': { primary: '#FFFFFF', secondary: '#000000', text: '#000000' },
  Ukraine:       { primary: '#003380', secondary: '#FFD700', text: '#FFFFFF' },
  Uzbekistan:    { primary: '#003380', secondary: '#FFFFFF', text: '#FFFFFF' },
};

export const CONTROLS = {
  PLAYER1: {
    UP:     'W',
    DOWN:   'S',
    LEFT:   'A',
    RIGHT:  'D',
    ACTION: 'SPACE',
  },
  PLAYER2: {
    UP:     'UP',
    DOWN:   'DOWN',
    LEFT:   'LEFT',
    RIGHT:  'RIGHT',
    ACTION: 'ENTER',
  },
};
