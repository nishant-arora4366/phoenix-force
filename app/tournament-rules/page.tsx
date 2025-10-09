'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function TournamentRules() {
  const [selectedTournamentType, setSelectedTournamentType] = useState('auction')

  const tournamentTypes = [
    { id: 'auction', name: 'Auction Tournament', description: 'Players are acquired through live auction bidding' },
    { id: 'draft', name: 'Draft Tournament', description: 'Players are selected through a draft system' },
    { id: 'league', name: 'League Tournament', description: 'Round-robin format with multiple matches' },
    { id: 'knockout', name: 'Knockout Tournament', description: 'Single elimination bracket format' },
    { id: 't20', name: 'T20 Tournament', description: 'Fast-paced 20-over format' },
    { id: 'test', name: 'Test Tournament', description: 'Traditional 5-day format' }
  ]

  const rules = {
    auction: {
      title: 'Auction Tournament Rules',
      sections: [
        {
          title: 'Registration & Eligibility',
          rules: [
            'All players must be registered on the platform before auction day',
            'Players must have a valid player profile with skills and ratings',
            'Minimum age requirement: 16 years',
            'Players can only participate in one auction tournament at a time'
          ]
        },
        {
          title: 'Auction Process',
          rules: [
            'Auctions are conducted in real-time with live bidding',
            'Each team has a maximum budget of ₹1,00,00,000 (1 crore)',
            'Minimum bid increment: ₹10,000',
            'Bidding time limit: 30 seconds per player',
            'Teams can bid on any available player',
            'No proxy bidding or automated systems allowed'
          ]
        },
        {
          title: 'Team Formation',
          rules: [
            'Each team must have exactly 11 players',
            'Minimum 1 wicket-keeper required',
            'Minimum 3 batsmen, 3 bowlers, and 2 all-rounders',
            'Maximum 4 overseas players allowed',
            'Team must have players from at least 3 different states'
          ]
        },
        {
          title: 'Match Rules',
          rules: [
            'T20 format: 20 overs per side',
            'Powerplay: First 6 overs (2 fielders outside 30-yard circle)',
            'DRS (Decision Review System) available for each team',
            'Super Over in case of tie',
            'Rain rule: DLS method applies'
          ]
        }
      ]
    },
    draft: {
      title: 'Draft Tournament Rules',
      sections: [
        {
          title: 'Draft Order',
          rules: [
            'Draft order determined by random lottery',
            'Snake draft format (1-8, 8-1, 1-8, etc.)',
            'Each team gets 2 minutes per pick',
            'Auto-pick if time expires (highest rated available player)'
          ]
        },
        {
          title: 'Player Categories',
          rules: [
            'Batsmen: Minimum 3 required',
            'Bowlers: Minimum 3 required',
            'All-rounders: Minimum 2 required',
            'Wicket-keepers: Minimum 1 required',
            'Overseas players: Maximum 4 allowed'
          ]
        },
        {
          title: 'Trading & Transfers',
          rules: [
            'Trading window opens 24 hours after draft completion',
            'Maximum 3 trades per team during trading window',
            'All trades must be approved by tournament officials',
            'No trades allowed after first match begins'
          ]
        }
      ]
    },
    league: {
      title: 'League Tournament Rules',
      sections: [
        {
          title: 'Format',
          rules: [
            'Round-robin format: Each team plays every other team once',
            'Points system: Win = 2 points, Tie = 1 point, Loss = 0 points',
            'Top 4 teams qualify for playoffs',
            'Net Run Rate (NRR) used for tie-breaking'
          ]
        },
        {
          title: 'Playoffs',
          rules: [
            'Semi-final 1: 1st vs 4th',
            'Semi-final 2: 2nd vs 3rd',
            'Final: Winners of both semi-finals',
            'All playoff matches are knockout format'
          ]
        },
        {
          title: 'Scheduling',
          rules: [
            'Matches scheduled every 2-3 days',
            'Teams must confirm availability 24 hours before match',
            'Rescheduling allowed only in case of weather issues',
            'Forfeit if team fails to show up within 30 minutes of scheduled time'
          ]
        }
      ]
    },
    knockout: {
      title: 'Knockout Tournament Rules',
      sections: [
        {
          title: 'Bracket Format',
          rules: [
            'Single elimination bracket',
            'Seeding based on team ratings and past performance',
            'Higher seeded team gets home advantage',
            'No second chances - one loss eliminates team'
          ]
        },
        {
          title: 'Match Rules',
          rules: [
            'T20 format unless specified otherwise',
            'No reserve day for early rounds',
            'Semi-finals and finals have reserve day',
            'Coin toss determines batting/bowling choice'
          ]
        },
        {
          title: 'Advancement',
          rules: [
            'Winner advances to next round',
            'Loser is eliminated from tournament',
            'Third place match for semi-final losers',
            'Champion determined by final match winner'
          ]
        }
      ]
    },
    t20: {
      title: 'T20 Tournament Rules',
      sections: [
        {
          title: 'Match Format',
          rules: [
            '20 overs per side',
            'Maximum 4 overs per bowler',
            'Powerplay: First 6 overs (2 fielders outside circle)',
            'Time limit: 90 minutes per innings'
          ]
        },
        {
          title: 'Fielding Restrictions',
          rules: [
            'Powerplay (overs 1-6): Maximum 2 fielders outside 30-yard circle',
            'Middle overs (7-15): Maximum 4 fielders outside circle',
            'Death overs (16-20): Maximum 5 fielders outside circle',
            'Minimum 2 fielders in catching positions during powerplay'
          ]
        },
        {
          title: 'Special Rules',
          rules: [
            'Free hit after no-ball',
            'DRS available: 1 review per team per innings',
            'Super Over in case of tie',
            'Strategic timeout: 2.5 minutes after 10 overs'
          ]
        }
      ]
    },
    test: {
      title: 'Test Tournament Rules',
      sections: [
        {
          title: 'Match Format',
          rules: [
            '5-day format with 4 innings',
            '90 overs per day (minimum)',
            'Follow-on rule: 200 runs behind after first innings',
            'Declaration allowed after 60 overs in first innings'
          ]
        },
        {
          title: 'Playing Conditions',
          rules: [
            'New ball available after 80 overs',
            'DRS available: 2 reviews per team per innings',
            'Bad light and rain rules apply',
            'Minimum 15 overs per hour required'
          ]
        },
        {
          title: 'Result Conditions',
          rules: [
            'Win: Team with higher total runs across both innings',
            'Draw: Match not completed within 5 days',
            'Tie: Both teams score exactly same runs (rare)',
            'No result: Less than 20 overs bowled due to weather'
          ]
        }
      ]
    }
  }

  return (
    <div className="min-h-screen bg-[#19171b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#DBD0C0] mb-4">Tournament Rules</h1>
          <p className="text-xl text-[#CEA17A] max-w-3xl mx-auto">
            Comprehensive rules and regulations for different tournament formats. 
            Select a tournament type to view specific rules and guidelines.
          </p>
        </div>

        {/* Tournament Type Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[#DBD0C0] mb-6">Select Tournament Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournamentTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedTournamentType(type.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                  selectedTournamentType === type.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-[#CEA17A]/20 bg-[#09171F]/50 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <h3 className="font-semibold text-[#DBD0C0] mb-2">{type.name}</h3>
                <p className="text-sm text-[#CEA17A]">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Rules Display */}
        <div className="bg-[#09171F]/50 rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-[#DBD0C0] mb-8">
            {rules[selectedTournamentType as keyof typeof rules].title}
          </h2>
          
          <div className="space-y-8">
            {rules[selectedTournamentType as keyof typeof rules].sections.map((section, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-6">
                <h3 className="text-xl font-semibold text-[#DBD0C0] mb-4">{section.title}</h3>
                <ul className="space-y-3">
                  {section.rules.map((rule, ruleIndex) => (
                    <li key={ruleIndex} className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                        {ruleIndex + 1}
                      </span>
                      <span className="text-gray-700 leading-relaxed">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-12 bg-blue-50 rounded-lg p-8">
          <h3 className="text-xl font-semibold text-[#DBD0C0] mb-4">Important Notes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-[#DBD0C0] mb-2">General Rules</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• All matches follow ICC playing conditions</li>
                <li>• Fair play and sportsmanship expected</li>
                <li>• Disciplinary action for code violations</li>
                <li>• Tournament officials' decisions are final</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-[#DBD0C0] mb-2">Contact Information</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Tournament Director: +91-9876543210</li>
                <li>• Email: tournaments@phoenixforcecricket.com</li>
                <li>• Support: Available 24/7 during tournaments</li>
                <li>• Emergency: +91-9876543211</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Back to Tournaments */}
        <div className="mt-8 text-center">
          <Link
            href="/tournaments"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Tournaments
          </Link>
        </div>
      </div>
    </div>
  )
}
