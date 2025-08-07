import { ScoreboardState } from '../../types/scoreboard.types';
import { RoundHistory } from '../../types/rounds.types';
import { RoundUISettings } from '../../types/ui.types';

// Placeholder helpers for rendering
function renderRoundSummary(): string {
    return '<div>Round Summary Placeholder</div>';
}

function renderCharts(): string {
    return '<div>Charts Placeholder</div>';
}

function renderRoundRow(round: RoundHistory): string {
    return `<tr>
        <td>${round.number}</td>
        <td>${round.type}</td>
        <td>${round.points.team1} - ${round.points.team2}</td>
        <td>${round.penalties.team1.major + round.penalties.team2.major}</td>
        <td>${round.timeLimit || ''}</td>
        <td>${round.theme}</td>
        <td>${round.type}</td>
    </tr>`;
}

export const generateHTMLReport = (
    state: ScoreboardState,
    ui: RoundUISettings
): string => `
<!DOCTYPE html>
<html class="${state.titleStyle?.color || 'theme-default'}">
  <head>
    <meta charset="utf-8" />
    <title>Improv Scoreboard Report</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  </head>
  <body class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    ${ui.showRoundHeader ? renderRoundSummary() : ''}
    ${renderCharts()}
    <table class="min-w-full mt-4">
      <thead>
        <tr>
          <th>Round</th>
          <th>Type</th>
          <th>Points</th>
          <th>Penalties</th>
          <th>Duration</th>
          <th>Theme</th>
          <th>Type</th>
        </tr>
      </thead>
      <tbody>
        ${state.rounds.history.map(renderRoundRow).join('')}
      </tbody>
    </table>
  </body>
</html>
`;
