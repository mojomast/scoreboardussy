import React from 'react';
import { render, screen } from '@testing-library/react';
import { TeamDisplayPanel } from '../';
import { Team } from '@server-types/index';

describe('TeamDisplayPanel', () => {
  const mockTeam: Team = {
    id: 'team1',
    name: 'Test Team',
    color: '#FF5733',
    score: 5,
    penalties: { major: 2, minor: 1 }
  };

  test('renders team name correctly', () => {
    render(<TeamDisplayPanel team={mockTeam} />);
    expect(screen.getByText('Test Team')).toBeInTheDocument();
  });

  test('renders team score correctly', () => {
    render(<TeamDisplayPanel team={mockTeam} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('hides score when showScore is false', () => {
    render(<TeamDisplayPanel team={mockTeam} showScore={false} />);
    // The score should not be visible
    expect(screen.queryByText('5')).not.toBeInTheDocument();
  });

  test('hides penalties when showPenalties is false', () => {
    render(<TeamDisplayPanel team={mockTeam} showPenalties={false} />);
    // The penalties section should not be visible
    expect(screen.queryByText('scoreboardDisplay.majorPenaltyLabel')).not.toBeInTheDocument();
    expect(screen.queryByText('scoreboardDisplay.minorPenaltyLabel')).not.toBeInTheDocument();
  });

  test('displays emoji when provided', () => {
    render(<TeamDisplayPanel team={mockTeam} showEmojis={true} emoji="hand" />);
    // The hand emoji should be visible (✋)
    const emojiElement = screen.getByText('✋');
    expect(emojiElement).toBeInTheDocument();
  });

  test('applies team color as background', () => {
    const { container } = render(<TeamDisplayPanel team={mockTeam} />);
    const teamPanel = container.firstChild as HTMLElement;
    expect(teamPanel).toHaveStyle({ backgroundColor: '#FF5733' });
  });
});