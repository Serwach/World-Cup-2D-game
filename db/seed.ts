import * as fs from 'fs';
import * as path from 'path';
import * as mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

interface TeamSeed {
  name: string;
  group_name: string;
  primary_color: string;
  secondary_color: string;
  confederation: string;
  flag_emoji: string;
  players: { name: string; position: 'GK' | 'DEF' | 'MID' | 'FWD'; shirt_number: number }[];
}

const TEAMS: TeamSeed[] = [
  // GROUP A
  {
    name: 'Germany', group_name: 'A',
    primary_color: '#FFFFFF', secondary_color: '#000000', confederation: 'UEFA', flag_emoji: '🇩🇪',
    players: [
      { name: 'M. Neuer', position: 'GK', shirt_number: 1 },
      { name: 'J. Kimmich', position: 'MID', shirt_number: 6 },
      { name: 'F. Wirtz', position: 'MID', shirt_number: 10 },
      { name: 'K. Havertz', position: 'FWD', shirt_number: 9 },
    ],
  },
  {
    name: 'Morocco', group_name: 'A',
    primary_color: '#CC0000', secondary_color: '#006600', confederation: 'CAF', flag_emoji: '🇲🇦',
    players: [
      { name: 'Y. Bono', position: 'GK', shirt_number: 1 },
      { name: 'A. Hakimi', position: 'DEF', shirt_number: 2 },
      { name: 'H. Ziyech', position: 'MID', shirt_number: 22 },
      { name: 'Y. En-Nesyri', position: 'FWD', shirt_number: 19 },
    ],
  },
  {
    name: 'Australia', group_name: 'A',
    primary_color: '#FFD700', secondary_color: '#006600', confederation: 'AFC', flag_emoji: '🇦🇺',
    players: [
      { name: 'M. Ryan', position: 'GK', shirt_number: 1 },
      { name: 'M. Leckie', position: 'MID', shirt_number: 7 },
      { name: 'A. Hrustic', position: 'MID', shirt_number: 10 },
      { name: 'M. Duke', position: 'FWD', shirt_number: 9 },
    ],
  },
  {
    name: 'Costa Rica', group_name: 'A',
    primary_color: '#CC0000', secondary_color: '#003380', confederation: 'CONCACAF', flag_emoji: '🇨🇷',
    players: [
      { name: 'K. Navas', position: 'GK', shirt_number: 1 },
      { name: 'B. Campbell', position: 'FWD', shirt_number: 9 },
      { name: 'C. Contreras', position: 'MID', shirt_number: 10 },
      { name: 'O. Duarte', position: 'DEF', shirt_number: 4 },
    ],
  },
  // GROUP B
  {
    name: 'Spain', group_name: 'B',
    primary_color: '#C60B1E', secondary_color: '#FFC300', confederation: 'UEFA', flag_emoji: '🇪🇸',
    players: [
      { name: 'U. Simon', position: 'GK', shirt_number: 1 },
      { name: 'Pedri', position: 'MID', shirt_number: 8 },
      { name: 'Gavi', position: 'MID', shirt_number: 9 },
      { name: 'A. Morata', position: 'FWD', shirt_number: 7 },
    ],
  },
  {
    name: 'Senegal', group_name: 'B',
    primary_color: '#006600', secondary_color: '#FFD700', confederation: 'CAF', flag_emoji: '🇸🇳',
    players: [
      { name: 'E. Mendy', position: 'GK', shirt_number: 1 },
      { name: 'S. Mane', position: 'FWD', shirt_number: 10 },
      { name: 'I. Sarr', position: 'FWD', shirt_number: 9 },
      { name: 'P. Gueye', position: 'MID', shirt_number: 6 },
    ],
  },
  {
    name: 'Japan', group_name: 'B',
    primary_color: '#003380', secondary_color: '#FFFFFF', confederation: 'AFC', flag_emoji: '🇯🇵',
    players: [
      { name: 'S. Gonda', position: 'GK', shirt_number: 1 },
      { name: 'T. Kubo', position: 'MID', shirt_number: 10 },
      { name: 'T. Minamino', position: 'MID', shirt_number: 9 },
      { name: 'R. Doan', position: 'FWD', shirt_number: 8 },
    ],
  },
  {
    name: 'Canada', group_name: 'B',
    primary_color: '#CC0000', secondary_color: '#FFFFFF', confederation: 'CONCACAF', flag_emoji: '🇨🇦',
    players: [
      { name: 'M. Borjan', position: 'GK', shirt_number: 18 },
      { name: 'A. Davies', position: 'DEF', shirt_number: 3 },
      { name: 'J. David', position: 'FWD', shirt_number: 9 },
      { name: 'T. Buchanan', position: 'MID', shirt_number: 11 },
    ],
  },
  // GROUP C
  {
    name: 'France', group_name: 'C',
    primary_color: '#003189', secondary_color: '#FFFFFF', confederation: 'UEFA', flag_emoji: '🇫🇷',
    players: [
      { name: 'M. Maignan', position: 'GK', shirt_number: 16 },
      { name: 'K. Mbappe', position: 'FWD', shirt_number: 10 },
      { name: 'A. Griezmann', position: 'FWD', shirt_number: 7 },
      { name: 'O. Dembele', position: 'MID', shirt_number: 11 },
    ],
  },
  {
    name: 'Nigeria', group_name: 'C',
    primary_color: '#006600', secondary_color: '#FFFFFF', confederation: 'CAF', flag_emoji: '🇳🇬',
    players: [
      { name: 'S. Nwabali', position: 'GK', shirt_number: 22 },
      { name: 'V. Osimhen', position: 'FWD', shirt_number: 9 },
      { name: 'A. Lookman', position: 'FWD', shirt_number: 10 },
      { name: 'S. Chukwueze', position: 'MID', shirt_number: 11 },
    ],
  },
  {
    name: 'South Korea', group_name: 'C',
    primary_color: '#CC0000', secondary_color: '#003380', confederation: 'AFC', flag_emoji: '🇰🇷',
    players: [
      { name: 'J. Hyeon-woo', position: 'GK', shirt_number: 1 },
      { name: 'H. Son', position: 'FWD', shirt_number: 7 },
      { name: 'K. Lee', position: 'MID', shirt_number: 9 },
      { name: 'I. Hwang', position: 'FWD', shirt_number: 11 },
    ],
  },
  {
    name: 'Mexico', group_name: 'C',
    primary_color: '#006600', secondary_color: '#FFFFFF', confederation: 'CONCACAF', flag_emoji: '🇲🇽',
    players: [
      { name: 'G. Ochoa', position: 'GK', shirt_number: 13 },
      { name: 'H. Lozano', position: 'FWD', shirt_number: 22 },
      { name: 'R. Jimenez', position: 'FWD', shirt_number: 9 },
      { name: 'H. Herrera', position: 'MID', shirt_number: 16 },
    ],
  },
  // GROUP D
  {
    name: 'England', group_name: 'D',
    primary_color: '#FFFFFF', secondary_color: '#C8102E', confederation: 'UEFA', flag_emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    players: [
      { name: 'J. Pickford', position: 'GK', shirt_number: 1 },
      { name: 'H. Kane', position: 'FWD', shirt_number: 9 },
      { name: 'J. Bellingham', position: 'MID', shirt_number: 10 },
      { name: 'B. Saka', position: 'MID', shirt_number: 7 },
    ],
  },
  {
    name: 'Brazil', group_name: 'D',
    primary_color: '#FFD700', secondary_color: '#009900', confederation: 'CONMEBOL', flag_emoji: '🇧🇷',
    players: [
      { name: 'Alisson', position: 'GK', shirt_number: 1 },
      { name: 'Vinicius Jr.', position: 'FWD', shirt_number: 7 },
      { name: 'Rodrygo', position: 'FWD', shirt_number: 9 },
      { name: 'L. Paqueta', position: 'MID', shirt_number: 10 },
    ],
  },
  {
    name: 'Saudi Arabia', group_name: 'D',
    primary_color: '#006600', secondary_color: '#FFFFFF', confederation: 'AFC', flag_emoji: '🇸🇦',
    players: [
      { name: 'M. Al-Owais', position: 'GK', shirt_number: 21 },
      { name: 'S. Al-Dawsari', position: 'FWD', shirt_number: 10 },
      { name: 'F. Al-Buraikan', position: 'FWD', shirt_number: 9 },
      { name: 'A. Kanno', position: 'MID', shirt_number: 6 },
    ],
  },
  {
    name: 'Panama', group_name: 'D',
    primary_color: '#CC0000', secondary_color: '#003380', confederation: 'CONCACAF', flag_emoji: '🇵🇦',
    players: [
      { name: 'L. Mosquera', position: 'GK', shirt_number: 1 },
      { name: 'E. Godoy', position: 'MID', shirt_number: 8 },
      { name: 'A. Adames', position: 'DEF', shirt_number: 4 },
      { name: 'G. Fajardo', position: 'FWD', shirt_number: 9 },
    ],
  },
  // GROUP E
  {
    name: 'Portugal', group_name: 'E',
    primary_color: '#006600', secondary_color: '#FF0000', confederation: 'UEFA', flag_emoji: '🇵🇹',
    players: [
      { name: 'D. Costa', position: 'GK', shirt_number: 1 },
      { name: 'C. Ronaldo', position: 'FWD', shirt_number: 7 },
      { name: 'B. Fernandes', position: 'MID', shirt_number: 8 },
      { name: 'B. Silva', position: 'MID', shirt_number: 10 },
    ],
  },
  {
    name: 'Colombia', group_name: 'E',
    primary_color: '#FFD700', secondary_color: '#003380', confederation: 'CONMEBOL', flag_emoji: '🇨🇴',
    players: [
      { name: 'C. Vargas', position: 'GK', shirt_number: 1 },
      { name: 'J. Rodriguez', position: 'MID', shirt_number: 10 },
      { name: 'L. Diaz', position: 'FWD', shirt_number: 7 },
      { name: 'D. Arias', position: 'MID', shirt_number: 8 },
    ],
  },
  {
    name: 'Denmark', group_name: 'E',
    primary_color: '#CC0000', secondary_color: '#FFFFFF', confederation: 'UEFA', flag_emoji: '🇩🇰',
    players: [
      { name: 'K. Schmeichel', position: 'GK', shirt_number: 1 },
      { name: 'C. Eriksen', position: 'MID', shirt_number: 10 },
      { name: 'P. Hojbjerg', position: 'MID', shirt_number: 8 },
      { name: 'R. Hojlund', position: 'FWD', shirt_number: 9 },
    ],
  },
  {
    name: 'Tunisia', group_name: 'E',
    primary_color: '#CC0000', secondary_color: '#FFFFFF', confederation: 'CAF', flag_emoji: '🇹🇳',
    players: [
      { name: 'A. Dahmen', position: 'GK', shirt_number: 16 },
      { name: 'W. Khazri', position: 'FWD', shirt_number: 10 },
      { name: 'Y. Msakni', position: 'MID', shirt_number: 7 },
      { name: 'N. Slimane', position: 'MID', shirt_number: 8 },
    ],
  },
  // GROUP F
  {
    name: 'Netherlands', group_name: 'F',
    primary_color: '#FF6600', secondary_color: '#FFFFFF', confederation: 'UEFA', flag_emoji: '🇳🇱',
    players: [
      { name: 'M. Flekken', position: 'GK', shirt_number: 1 },
      { name: 'V. van Dijk', position: 'DEF', shirt_number: 4 },
      { name: 'F. de Jong', position: 'MID', shirt_number: 21 },
      { name: 'C. Gakpo', position: 'FWD', shirt_number: 11 },
    ],
  },
  {
    name: 'Argentina', group_name: 'F',
    primary_color: '#74ACDF', secondary_color: '#FFFFFF', confederation: 'CONMEBOL', flag_emoji: '🇦🇷',
    players: [
      { name: 'E. Martinez', position: 'GK', shirt_number: 23 },
      { name: 'L. Messi', position: 'FWD', shirt_number: 10 },
      { name: 'A. Di Maria', position: 'MID', shirt_number: 11 },
      { name: 'R. De Paul', position: 'MID', shirt_number: 7 },
    ],
  },
  {
    name: 'Switzerland', group_name: 'F',
    primary_color: '#CC0000', secondary_color: '#FFFFFF', confederation: 'UEFA', flag_emoji: '🇨🇭',
    players: [
      { name: 'G. Kobel', position: 'GK', shirt_number: 1 },
      { name: 'G. Xhaka', position: 'MID', shirt_number: 10 },
      { name: 'X. Shaqiri', position: 'MID', shirt_number: 23 },
      { name: 'B. Embolo', position: 'FWD', shirt_number: 7 },
    ],
  },
  {
    name: 'Algeria', group_name: 'F',
    primary_color: '#006600', secondary_color: '#FFFFFF', confederation: 'CAF', flag_emoji: '🇩🇿',
    players: [
      { name: 'R. Benayad', position: 'GK', shirt_number: 1 },
      { name: 'R. Mahrez', position: 'FWD', shirt_number: 7 },
      { name: 'I. Bennacer', position: 'MID', shirt_number: 8 },
      { name: 'R. Bensebaini', position: 'DEF', shirt_number: 3 },
    ],
  },
  // GROUP G
  {
    name: 'Belgium', group_name: 'G',
    primary_color: '#000000', secondary_color: '#CC0000', confederation: 'UEFA', flag_emoji: '🇧🇪',
    players: [
      { name: 'K. Casteels', position: 'GK', shirt_number: 1 },
      { name: 'K. De Bruyne', position: 'MID', shirt_number: 7 },
      { name: 'R. Lukaku', position: 'FWD', shirt_number: 9 },
      { name: 'Y. Tielemans', position: 'MID', shirt_number: 8 },
    ],
  },
  {
    name: 'Uruguay', group_name: 'G',
    primary_color: '#74ACDF', secondary_color: '#FFFFFF', confederation: 'CONMEBOL', flag_emoji: '🇺🇾',
    players: [
      { name: 'S. Rochet', position: 'GK', shirt_number: 1 },
      { name: 'L. Suarez', position: 'FWD', shirt_number: 9 },
      { name: 'F. Valverde', position: 'MID', shirt_number: 14 },
      { name: 'E. Cavani', position: 'FWD', shirt_number: 21 },
    ],
  },
  {
    name: 'Ghana', group_name: 'G',
    primary_color: '#FFFFFF', secondary_color: '#000000', confederation: 'CAF', flag_emoji: '🇬🇭',
    players: [
      { name: 'J. Wollacott', position: 'GK', shirt_number: 1 },
      { name: 'A. Ayew', position: 'FWD', shirt_number: 10 },
      { name: 'M. Kudus', position: 'MID', shirt_number: 8 },
      { name: 'A. Semenyo', position: 'FWD', shirt_number: 11 },
    ],
  },
  {
    name: 'Honduras', group_name: 'G',
    primary_color: '#003380', secondary_color: '#FFFFFF', confederation: 'CONCACAF', flag_emoji: '🇭🇳',
    players: [
      { name: 'L. Moreira', position: 'GK', shirt_number: 1 },
      { name: 'A. Elis', position: 'FWD', shirt_number: 10 },
      { name: 'R. Lozano', position: 'MID', shirt_number: 9 },
      { name: 'J. Bengtson', position: 'FWD', shirt_number: 9 },
    ],
  },
  // GROUP H
  {
    name: 'Italy', group_name: 'H',
    primary_color: '#003399', secondary_color: '#FFFFFF', confederation: 'UEFA', flag_emoji: '🇮🇹',
    players: [
      { name: 'G. Donnarumma', position: 'GK', shirt_number: 1 },
      { name: 'N. Barella', position: 'MID', shirt_number: 18 },
      { name: 'L. Pellegrini', position: 'MID', shirt_number: 10 },
      { name: 'G. Scamacca', position: 'FWD', shirt_number: 9 },
    ],
  },
  {
    name: 'Ecuador', group_name: 'H',
    primary_color: '#FFD700', secondary_color: '#003380', confederation: 'CONMEBOL', flag_emoji: '🇪🇨',
    players: [
      { name: 'H. Dominguez', position: 'GK', shirt_number: 12 },
      { name: 'P. Estupinan', position: 'DEF', shirt_number: 3 },
      { name: 'A. Plata', position: 'FWD', shirt_number: 11 },
      { name: 'J. Preciado', position: 'FWD', shirt_number: 9 },
    ],
  },
  {
    name: 'Croatia', group_name: 'H',
    primary_color: '#CC0000', secondary_color: '#FFFFFF', confederation: 'UEFA', flag_emoji: '🇭🇷',
    players: [
      { name: 'D. Livakovic', position: 'GK', shirt_number: 1 },
      { name: 'L. Modric', position: 'MID', shirt_number: 10 },
      { name: 'M. Kovacic', position: 'MID', shirt_number: 8 },
      { name: 'I. Perisic', position: 'FWD', shirt_number: 4 },
    ],
  },
  {
    name: 'New Zealand', group_name: 'H',
    primary_color: '#FFFFFF', secondary_color: '#000000', confederation: 'OFC', flag_emoji: '🇳🇿',
    players: [
      { name: 'O. Sail', position: 'GK', shirt_number: 1 },
      { name: 'C. Wood', position: 'FWD', shirt_number: 9 },
      { name: 'L. Taylor', position: 'MID', shirt_number: 10 },
      { name: 'A. Haber', position: 'MID', shirt_number: 11 },
    ],
  },
  // GROUP I
  {
    name: 'Austria', group_name: 'I',
    primary_color: '#CC0000', secondary_color: '#FFFFFF', confederation: 'UEFA', flag_emoji: '🇦🇹',
    players: [
      { name: 'P. Pentz', position: 'GK', shirt_number: 1 },
      { name: 'D. Alaba', position: 'DEF', shirt_number: 8 },
      { name: 'M. Sabitzer', position: 'MID', shirt_number: 7 },
      { name: 'M. Gregoritsch', position: 'FWD', shirt_number: 11 },
    ],
  },
  {
    name: 'Cameroon', group_name: 'I',
    primary_color: '#006600', secondary_color: '#CC0000', confederation: 'CAF', flag_emoji: '🇨🇲',
    players: [
      { name: 'A. Onana', position: 'GK', shirt_number: 1 },
      { name: 'A. Anguissa', position: 'MID', shirt_number: 8 },
      { name: 'K. Toko Ekambi', position: 'FWD', shirt_number: 11 },
      { name: 'V. Aboubakar', position: 'FWD', shirt_number: 10 },
    ],
  },
  {
    name: 'Iran', group_name: 'I',
    primary_color: '#FFFFFF', secondary_color: '#CC0000', confederation: 'AFC', flag_emoji: '🇮🇷',
    players: [
      { name: 'A. Beiranvand', position: 'GK', shirt_number: 1 },
      { name: 'A. Gholizadeh', position: 'MID', shirt_number: 7 },
      { name: 'S. Azmoun', position: 'FWD', shirt_number: 9 },
      { name: 'M. Taremi', position: 'FWD', shirt_number: 9 },
    ],
  },
  {
    name: 'South Africa', group_name: 'I',
    primary_color: '#006600', secondary_color: '#FFD700', confederation: 'CAF', flag_emoji: '🇿🇦',
    players: [
      { name: 'I. Khune', position: 'GK', shirt_number: 16 },
      { name: 'P. Tau', position: 'FWD', shirt_number: 10 },
      { name: 'K. Dolly', position: 'MID', shirt_number: 11 },
      { name: 'B. Tau', position: 'FWD', shirt_number: 7 },
    ],
  },
  // GROUP J
  {
    name: 'Serbia', group_name: 'J',
    primary_color: '#CC0000', secondary_color: '#003399', confederation: 'UEFA', flag_emoji: '🇷🇸',
    players: [
      { name: 'P. Rajkovic', position: 'GK', shirt_number: 12 },
      { name: 'D. Tadic', position: 'MID', shirt_number: 10 },
      { name: 'S. Milinkovic-Savic', position: 'MID', shirt_number: 11 },
      { name: 'L. Jovic', position: 'FWD', shirt_number: 9 },
    ],
  },
  {
    name: 'Ivory Coast', group_name: 'J',
    primary_color: '#FF6600', secondary_color: '#FFFFFF', confederation: 'CAF', flag_emoji: '🇨🇮',
    players: [
      { name: 'F. Sangare', position: 'GK', shirt_number: 16 },
      { name: 'W. Zaha', position: 'FWD', shirt_number: 10 },
      { name: 'S. Haller', position: 'FWD', shirt_number: 9 },
      { name: 'F. Kessie', position: 'MID', shirt_number: 8 },
    ],
  },
  {
    name: 'Iraq', group_name: 'J',
    primary_color: '#000000', secondary_color: '#CC0000', confederation: 'AFC', flag_emoji: '🇮🇶',
    players: [
      { name: 'B. Resan', position: 'GK', shirt_number: 1 },
      { name: 'M. Ali', position: 'FWD', shirt_number: 9 },
      { name: 'A. Adnan', position: 'DEF', shirt_number: 3 },
      { name: 'H. Ali', position: 'MID', shirt_number: 7 },
    ],
  },
  {
    name: 'USA', group_name: 'J',
    primary_color: '#002868', secondary_color: '#FFFFFF', confederation: 'CONCACAF', flag_emoji: '🇺🇸',
    players: [
      { name: 'M. Turner', position: 'GK', shirt_number: 1 },
      { name: 'C. Pulisic', position: 'MID', shirt_number: 10 },
      { name: 'G. Reyna', position: 'MID', shirt_number: 7 },
      { name: 'W. McKennie', position: 'MID', shirt_number: 8 },
    ],
  },
  // GROUP K
  {
    name: 'Poland', group_name: 'K',
    primary_color: '#FFFFFF', secondary_color: '#CC0000', confederation: 'UEFA', flag_emoji: '🇵🇱',
    players: [
      { name: 'W. Szczesny', position: 'GK', shirt_number: 1 },
      { name: 'R. Lewandowski', position: 'FWD', shirt_number: 9 },
      { name: 'P. Zielinski', position: 'MID', shirt_number: 10 },
      { name: 'A. Milik', position: 'FWD', shirt_number: 7 },
    ],
  },
  {
    name: 'Venezuela', group_name: 'K',
    primary_color: '#CC0000', secondary_color: '#FFD700', confederation: 'CONMEBOL', flag_emoji: '🇻🇪',
    players: [
      { name: 'W. Farez', position: 'GK', shirt_number: 1 },
      { name: 'Y. Soteldo', position: 'FWD', shirt_number: 7 },
      { name: 'J. Arango', position: 'MID', shirt_number: 10 },
      { name: 'A. Penaranda', position: 'FWD', shirt_number: 9 },
    ],
  },
  {
    name: 'Qatar', group_name: 'K',
    primary_color: '#660033', secondary_color: '#FFFFFF', confederation: 'AFC', flag_emoji: '🇶🇦',
    players: [
      { name: 'S. Al-Sheeb', position: 'GK', shirt_number: 1 },
      { name: 'Al-Moez Ali', position: 'FWD', shirt_number: 19 },
      { name: 'H. Al-Haydos', position: 'MID', shirt_number: 10 },
      { name: 'A. Afif', position: 'FWD', shirt_number: 11 },
    ],
  },
  {
    name: 'Jordan', group_name: 'K',
    primary_color: '#000000', secondary_color: '#FFFFFF', confederation: 'AFC', flag_emoji: '🇯🇴',
    players: [
      { name: 'M. Abu Zema', position: 'GK', shirt_number: 1 },
      { name: 'M. Al-Taamari', position: 'FWD', shirt_number: 11 },
      { name: 'Y. Al-Naimat', position: 'MID', shirt_number: 10 },
      { name: 'O. Rashid', position: 'FWD', shirt_number: 9 },
    ],
  },
  // GROUP L
  {
    name: 'Turkey', group_name: 'L',
    primary_color: '#CC0000', secondary_color: '#FFFFFF', confederation: 'UEFA', flag_emoji: '🇹🇷',
    players: [
      { name: 'A. Cakir', position: 'GK', shirt_number: 12 },
      { name: 'H. Calhanoglu', position: 'MID', shirt_number: 10 },
      { name: 'A. Guler', position: 'MID', shirt_number: 7 },
      { name: 'M. Demiral', position: 'DEF', shirt_number: 3 },
    ],
  },
  {
    name: 'Scotland', group_name: 'L',
    primary_color: '#003399', secondary_color: '#FFFFFF', confederation: 'UEFA', flag_emoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    players: [
      { name: 'C. Gordon', position: 'GK', shirt_number: 1 },
      { name: 'A. Robertson', position: 'DEF', shirt_number: 3 },
      { name: 'S. McTominay', position: 'MID', shirt_number: 8 },
      { name: 'L. Dykes', position: 'FWD', shirt_number: 9 },
    ],
  },
  {
    name: 'Ukraine', group_name: 'L',
    primary_color: '#003380', secondary_color: '#FFD700', confederation: 'UEFA', flag_emoji: '🇺🇦',
    players: [
      { name: 'G. Bushchan', position: 'GK', shirt_number: 1 },
      { name: 'M. Mudryk', position: 'FWD', shirt_number: 10 },
      { name: 'O. Zinchenko', position: 'MID', shirt_number: 35 },
      { name: 'A. Dovbyk', position: 'FWD', shirt_number: 9 },
    ],
  },
  {
    name: 'Uzbekistan', group_name: 'L',
    primary_color: '#003380', secondary_color: '#FFFFFF', confederation: 'AFC', flag_emoji: '🇺🇿',
    players: [
      { name: 'O. Nematov', position: 'GK', shirt_number: 1 },
      { name: 'E. Shomurodov', position: 'FWD', shirt_number: 9 },
      { name: 'J. Khasanov', position: 'MID', shirt_number: 10 },
      { name: 'B. Tursunov', position: 'MID', shirt_number: 8 },
    ],
  },
];

async function seed(connection: mysql.Connection) {
  console.log('Seeding groups...');
  const groups = ['A','B','C','D','E','F','G','H','I','J','K','L'];
  for (const g of groups) {
    await connection.execute(
      'INSERT IGNORE INTO groups_table (name) VALUES (?)',
      [g]
    );
  }

  console.log('Seeding teams and players...');
  for (const team of TEAMS) {
    const [result] = await connection.execute<mysql.ResultSetHeader>(
      `INSERT INTO teams (name, group_name, primary_color, secondary_color, confederation, flag_emoji)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [team.name, team.group_name, team.primary_color, team.secondary_color, team.confederation, team.flag_emoji]
    );
    const teamId = result.insertId;

    for (const p of team.players) {
      await connection.execute(
        'INSERT INTO players (name, team_id, position, shirt_number) VALUES (?, ?, ?, ?)',
        [p.name, teamId, p.position, p.shirt_number]
      );
    }
  }

  console.log('Seeding group stage matches...');
  // Fetch teams from DB to get their IDs
  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    'SELECT id, name, group_name FROM teams ORDER BY group_name, id'
  );
  const teamsByGroup: Record<string, { id: number; name: string }[]> = {};
  for (const row of rows) {
    if (!teamsByGroup[row.group_name]) teamsByGroup[row.group_name] = [];
    teamsByGroup[row.group_name].push({ id: row.id, name: row.name });
  }

  let matchOrder = 0;
  for (const groupName of Object.keys(teamsByGroup)) {
    const gTeams = teamsByGroup[groupName];
    // Round-robin: each pair plays once
    for (let i = 0; i < gTeams.length; i++) {
      for (let j = i + 1; j < gTeams.length; j++) {
        await connection.execute(
          `INSERT INTO matches (team_a, team_b, stage, played, match_order)
           VALUES (?, ?, 'group', 0, ?)`,
          [gTeams[i].id, gTeams[j].id, matchOrder++]
        );
      }
    }
  }

  console.log('Seeding standings...');
  for (const groupName of Object.keys(teamsByGroup)) {
    for (const team of teamsByGroup[groupName]) {
      await connection.execute(
        `INSERT IGNORE INTO standings (group_name, team_id, points, played, won, drawn, lost, goals_for, goals_against)
         VALUES (?, ?, 0, 0, 0, 0, 0, 0, 0)`,
        [groupName, team.id]
      );
    }
  }

  await connection.execute(
    `INSERT INTO tournament_config (current_stage) VALUES ('group')
     ON DUPLICATE KEY UPDATE current_stage='group'`
  );

  console.log('Seed complete! 48 teams, 192 players, group stage matches ready.');
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'worldcup2026',
    multipleStatements: true,
  });

  try {
    await seed(connection);
  } finally {
    await connection.end();
  }
}

main().catch(console.error);

export { seed };
