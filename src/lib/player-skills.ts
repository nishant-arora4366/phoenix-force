import { supabase } from './supabaseClient';

export interface PlayerSkill {
  id: string;
  skill_name: string;
  skill_type: 'select' | 'multiselect';
  is_required: boolean;
  display_order: number;
  is_admin_managed: boolean;
  viewer_can_see: boolean;
}

export interface PlayerSkillValue {
  id: string;
  skill_id: string;
  value_name: string;
  display_order: number;
  is_active: boolean;
}

export interface PlayerSkillAssignment {
  id: string;
  player_id: string;
  skill_id: string;
  skill_value_id?: string;
  value_array?: string[];
  skill_value_ids?: string[];
}

export interface PlayerWithSkills {
  id: string;
  display_name: string;
  profile_pic_url?: string;
  bio?: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  user_id?: string;
  skills: Record<string, string[]>;
  base_price: number;
}

// Skill-based pricing configuration
const SKILL_PRICE_MULTIPLIERS: Record<string, Record<string, number>> = {
  'Role': {
    'Batter': 1.0,
    'Bowler': 1.0,
    'Wicket Keeper': 1.2,
    'All Rounder': 1.3
  },
  'Batting Style': {
    'Left Hand Batter': 1.1,
    'Right Hand Batter': 1.0
  },
  'Bowling Style': {
    'Left Arm Fast': 1.2,
    'Right Arm Fast': 1.1,
    'Left Arm Spin': 1.0,
    'Right Arm Spin': 1.0
  },
  'Community': {
    'iBlitz': 1.1,
    'Other': 1.0
  }
};

const BASE_PRICE = 10000; // Base price for all players

/**
 * Calculate base price for a player based on their skills
 */
export function calculateBasePrice(skills: Record<string, string[]>): number {
  let multiplier = 1.0;
  
  // Apply multipliers for each skill category
  Object.entries(skills).forEach(([skillName, values]) => {
    if (SKILL_PRICE_MULTIPLIERS[skillName]) {
      values.forEach(value => {
        if (SKILL_PRICE_MULTIPLIERS[skillName][value]) {
          multiplier *= SKILL_PRICE_MULTIPLIERS[skillName][value];
        }
      });
    }
  });
  
  return Math.round(BASE_PRICE * multiplier);
}

/**
 * Load all player skills and values
 */
export async function loadPlayerSkills(): Promise<{
  skills: PlayerSkill[];
  skillValues: PlayerSkillValue[];
}> {
  try {
    const [skillsResult, skillValuesResult] = await Promise.all([
      supabase
        .from('player_skills')
        .select('*')
        .order('display_order'),
      supabase
        .from('player_skill_values')
        .select('*')
        .eq('is_active', true)
        .order('display_order')
    ]);

    if (skillsResult.error) throw skillsResult.error;
    if (skillValuesResult.error) throw skillValuesResult.error;

    return {
      skills: skillsResult.data || [],
      skillValues: skillValuesResult.data || []
    };
  } catch (error) {
    return { skills: [], skillValues: [] };
  }
}

/**
 * Load skills for specific players
 */
export async function loadPlayerSkillsForPlayers(playerIds: string[]): Promise<Record<string, Record<string, string[]>>> {
  try {
    const { data: assignments, error } = await supabase
      .from('player_skill_assignments')
      .select(`
        player_id,
        skill_id,
        value_array,
        player_skills!inner(
          skill_name
        )
      `)
      .in('player_id', playerIds);

    if (error) throw error;

    const playerSkills: Record<string, Record<string, string[]>> = {};

    // Initialize skills for each player
    playerIds.forEach(playerId => {
      playerSkills[playerId] = {};
    });

    // Process assignments
    assignments?.forEach((assignment: any) => {
      const playerId = assignment.player_id;
      const skillName = assignment.player_skills.skill_name;
      const values = assignment.value_array || [];

      if (!playerSkills[playerId][skillName]) {
        playerSkills[playerId][skillName] = [];
      }
      playerSkills[playerId][skillName].push(...values);
    });

    return playerSkills;
  } catch (error) {
    return {};
  }
}

/**
 * Load players with their skills and calculated base prices
 */
export async function loadPlayersWithSkills(playerIds: string[]): Promise<PlayerWithSkills[]> {
  try {
    // Load basic player data
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, display_name, profile_pic_url, bio, status, created_at, updated_at, created_by, user_id')
      .in('id', playerIds);

    if (playersError) throw playersError;

    // Load skills for these players
    const playerSkills = await loadPlayerSkillsForPlayers(playerIds);

    // Combine data
    const playersWithSkills: PlayerWithSkills[] = (players || []).map((player: any) => {
      const skills = playerSkills[player.id] || {};
      const basePrice = calculateBasePrice(skills);

      return {
        ...player,
        skills,
        base_price: basePrice
      };
    });

    return playersWithSkills;
  } catch (error) {
    return [];
  }
}

/**
 * Sort players by skill criteria
 */
export function sortPlayersBySkill(
  players: PlayerWithSkills[], 
  skillName: string, 
  order: 'asc' | 'desc' = 'asc'
): PlayerWithSkills[] {
  return [...players].sort((a, b) => {
    const aValue = a.skills[skillName]?.[0] || '';
    const bValue = b.skills[skillName]?.[0] || '';
    
    if (order === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });
}

/**
 * Sort players by base price
 */
export function sortPlayersByBasePrice(
  players: PlayerWithSkills[], 
  order: 'asc' | 'desc' = 'desc'
): PlayerWithSkills[] {
  return [...players].sort((a, b) => {
    if (order === 'asc') {
      return a.base_price - b.base_price;
    } else {
      return b.base_price - a.base_price;
    }
  });
}

/**
 * Sort players by name
 */
export function sortPlayersByName(
  players: PlayerWithSkills[], 
  order: 'asc' | 'desc' = 'asc'
): PlayerWithSkills[] {
  return [...players].sort((a, b) => {
    if (order === 'asc') {
      return a.display_name.localeCompare(b.display_name);
    } else {
      return b.display_name.localeCompare(a.display_name);
    }
  });
}

/**
 * Get available sorting options based on available skills
 */
export function getPlayerSortOptions(players: PlayerWithSkills[]): Array<{
  value: string;
  label: string;
  type: 'skill' | 'price' | 'name';
}> {
  const options: Array<{
    value: string;
    label: string;
    type: 'skill' | 'price' | 'name';
  }> = [
    { value: 'name', label: 'Name', type: 'name' },
    { value: 'base_price', label: 'Base Price', type: 'price' }
  ];

  // Get unique skill names from all players
  const skillNames = new Set<string>();
  players.forEach(player => {
    Object.keys(player.skills).forEach(skillName => {
      skillNames.add(skillName);
    });
  });

  // Add skill-based sorting options
  skillNames.forEach(skillName => {
    options.push({
      value: `skill_${skillName}`,
      label: `By ${skillName}`,
      type: 'skill'
    });
  });

  return options;
}
