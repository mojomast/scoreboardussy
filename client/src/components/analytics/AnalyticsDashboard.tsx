import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Container,
  Title,
  Paper,
  Grid,
  Card,
  Text,
  Group,
  Stack,
  Progress,
  Select,
  Button,
  Tabs,
  Badge,
  Table
} from '@mantine/core';
import {
  IconChartBar,
  IconUsers,
  IconTrophy,
  IconClock,
  IconTrendingUp,
  IconDownload,
  IconRefresh,
  IconFilter
} from '@tabler/icons-react';
import { AnalyticsView, AnalyticsFilters } from '../../types/analytics.types';

const AnalyticsDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { actualTheme } = useTheme();
  const {
    dashboard,
    matchAnalytics,
    teamAnalytics,
    playerAnalytics,
    tournamentAnalytics,
    loading,
    error,
    currentView,
    setCurrentView,
    getTopTeams,
    getTopPlayers,
    getMatchTrends,
    refreshData,
    clearError
  } = useAnalytics();

  const [timeRange, setTimeRange] = useState<AnalyticsFilters['timeRange']>('month');
  const [metricType, setMetricType] = useState<AnalyticsFilters['metricType']>('matches');

  const themeColors = actualTheme === 'dark' ? {
    background: 'var(--mantine-color-dark-6)',
    surface: 'var(--mantine-color-dark-7)',
    text: 'var(--mantine-color-gray-0)',
    textSecondary: 'var(--mantine-color-gray-3)',
    border: 'var(--mantine-color-dark-4)',
    primary: 'var(--mantine-color-blue-4)'
  } : {
    background: 'var(--mantine-color-gray-0)',
    surface: 'var(--mantine-color-white)',
    text: 'var(--mantine-color-gray-9)',
    textSecondary: 'var(--mantine-color-gray-6)',
    border: 'var(--mantine-color-gray-2)',
    primary: 'var(--mantine-color-blue-6)'
  };

  const handleViewChange = (viewType: AnalyticsView['type']) => {
    const newView: AnalyticsView = {
      ...currentView,
      type: viewType,
      filters: {
        ...currentView.filters,
        timeRange,
        metricType
      }
    };
    setCurrentView(newView);
  };

  const handleRefresh = async () => {
    await refreshData();
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (loading && !dashboard) {
    return (
      <Container size="xl" py="xl">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <Text style={{ color: themeColors.textSecondary }}>Loading analytics...</Text>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Paper p="xl" style={{ backgroundColor: '#fee', border: '1px solid #fcc' }}>
          <Group justify="space-between" align="center" mb="md">
            <Text size="lg" fw={500} c="red">Analytics Error</Text>
            <Button variant="outline" size="sm" onClick={clearError}>
              Dismiss
            </Button>
          </Group>
          <Text c="red">{error}</Text>
          <Button mt="md" onClick={handleRefresh}>
            Try Again
          </Button>
        </Paper>
      </Container>
    );
  }

  const topTeams = getTopTeams(5);
  const topPlayers = getTopPlayers(5);
  const trends = getMatchTrends(7);

  return (
    <Container size="xl" py="xl">
      {/* Header */}
      <Group justify="space-between" align="center" mb="xl" className="flex-col sm:flex-row gap-4">
        <Group align="center" gap="sm">
          <IconChartBar size={32} style={{ color: themeColors.primary }} />
          <div>
            <Title style={{ color: themeColors.text }}>Analytics Dashboard</Title>
            <Text size="sm" style={{ color: themeColors.textSecondary }}>
              Comprehensive insights into your improv performances
            </Text>
          </div>
        </Group>

        <Group gap="sm">
          <Select
            placeholder="Time Range"
            value={timeRange}
            onChange={(value) => setTimeRange(value as AnalyticsFilters['timeRange'])}
            data={[
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'This Month' },
              { value: 'year', label: 'This Year' }
            ]}
            size="sm"
          />
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={handleRefresh}
            loading={loading}
            size="sm"
          >
            Refresh
          </Button>
        </Group>
      </Group>

      {/* Overview Cards */}
      {dashboard && (
        <Grid gutter="md" mb="xl">
          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <Card padding="lg" radius="md" style={{ backgroundColor: themeColors.surface }}>
              <Group align="center" gap="sm">
                <IconTrophy size={24} style={{ color: themeColors.primary }} />
                <div>
                  <Text size="xs" style={{ color: themeColors.textSecondary }} tt="uppercase" fw={700}>
                    Total Matches
                  </Text>
                  <Text size="xl" fw={700} style={{ color: themeColors.text }}>
                    {dashboard.overview.totalMatches.toLocaleString()}
                  </Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <Card padding="lg" radius="md" style={{ backgroundColor: themeColors.surface }}>
              <Group align="center" gap="sm">
                <IconTrendingUp size={24} style={{ color: themeColors.primary }} />
                <div>
                  <Text size="xs" style={{ color: themeColors.textSecondary }} tt="uppercase" fw={700}>
                    Total Points
                  </Text>
                  <Text size="xl" fw={700} style={{ color: themeColors.text }}>
                    {dashboard.overview.totalPoints.toLocaleString()}
                  </Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <Card padding="lg" radius="md" style={{ backgroundColor: themeColors.surface }}>
              <Group align="center" gap="sm">
                <IconUsers size={24} style={{ color: themeColors.primary }} />
                <div>
                  <Text size="xs" style={{ color: themeColors.textSecondary }} tt="uppercase" fw={700}>
                    Active Tournaments
                  </Text>
                  <Text size="xl" fw={700} style={{ color: themeColors.text }}>
                    {dashboard.overview.activeTournaments}
                  </Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <Card padding="lg" radius="md" style={{ backgroundColor: themeColors.surface }}>
              <Group align="center" gap="sm">
                <IconClock size={24} style={{ color: themeColors.primary }} />
                <div>
                  <Text size="xs" style={{ color: themeColors.textSecondary }} tt="uppercase" fw={700}>
                    Avg Match Duration
                  </Text>
                  <Text size="xl" fw={700} style={{ color: themeColors.text }}>
                    {formatDuration(dashboard.overview.averageMatchDuration)}
                  </Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>
      )}

      {/* Main Content */}
      <Paper style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
        <Tabs value={currentView.type} onChange={(value) => handleViewChange(value as AnalyticsView['type'])}>
          <Tabs.List grow mb="md">
            <Tabs.Tab value="overview">Overview</Tabs.Tab>
            <Tabs.Tab value="matches">Matches</Tabs.Tab>
            <Tabs.Tab value="teams">Teams</Tabs.Tab>
            <Tabs.Tab value="players">Players</Tabs.Tab>
            <Tabs.Tab value="tournaments">Tournaments</Tabs.Tab>
            <Tabs.Tab value="trends">Trends</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview">
            <Grid gutter="lg">
              {/* Top Teams */}
              <Grid.Col span={{ base: 12, lg: 6 }}>
                <Card padding="lg" radius="md" style={{ backgroundColor: themeColors.background }}>
                  <Title order={3} mb="md" style={{ color: themeColors.text }}>
                    Top Performing Teams
                  </Title>
                  <Stack gap="sm">
                    {topTeams.map((team, index) => (
                      <Group key={team.teamId} justify="space-between" align="center">
                        <Group align="center" gap="sm">
                          <Badge size="sm" color="blue">#{index + 1}</Badge>
                          <div>
                            <Text fw={500} style={{ color: team.teamColor }}>
                              {team.teamName}
                            </Text>
                            <Text size="xs" style={{ color: themeColors.textSecondary }}>
                              {team.matchesPlayed} matches • {formatPercentage(team.winRate)} win rate
                            </Text>
                          </div>
                        </Group>
                        <Text fw={700} style={{ color: themeColors.text }}>
                          {team.averagePoints.toFixed(1)} pts
                        </Text>
                      </Group>
                    ))}
                  </Stack>
                </Card>
              </Grid.Col>

              {/* Top Players */}
              <Grid.Col span={{ base: 12, lg: 6 }}>
                <Card padding="lg" radius="md" style={{ backgroundColor: themeColors.background }}>
                  <Title order={3} mb="md" style={{ color: themeColors.text }}>
                    Top Performing Players
                  </Title>
                  <Stack gap="sm">
                    {topPlayers.map((player, index) => (
                      <Group key={player.playerId} justify="space-between" align="center">
                        <Group align="center" gap="sm">
                          <Badge size="sm" color="green">#{index + 1}</Badge>
                          <div>
                            <Text fw={500} style={{ color: themeColors.text }}>
                              {player.playerName}
                            </Text>
                            <Text size="xs" style={{ color: themeColors.textSecondary }}>
                              {player.matchesPlayed} matches • {player.wins} wins
                            </Text>
                          </div>
                        </Group>
                        <Text fw={700} style={{ color: themeColors.text }}>
                          {player.averagePoints.toFixed(1)} pts
                        </Text>
                      </Group>
                    ))}
                  </Stack>
                </Card>
              </Grid.Col>

              {/* Recent Activity */}
              <Grid.Col span={12}>
                <Card padding="lg" radius="md" style={{ backgroundColor: themeColors.background }}>
                  <Title order={3} mb="md" style={{ color: themeColors.text }}>
                    Recent Match Activity
                  </Title>
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th style={{ color: themeColors.text }}>Match</Table.Th>
                        <Table.Th style={{ color: themeColors.text }}>Duration</Table.Th>
                        <Table.Th style={{ color: themeColors.text }}>Points</Table.Th>
                        <Table.Th style={{ color: themeColors.text }}>Winner</Table.Th>
                        <Table.Th style={{ color: themeColors.text }}>Date</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {matchAnalytics.slice(0, 5).map((match) => (
                        <Table.Tr key={match.matchId}>
                          <Table.Td>
                            <Text fw={500} style={{ color: themeColors.text }}>
                              Match #{match.matchId.slice(-6)}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text style={{ color: themeColors.textSecondary }}>
                              {formatDuration(match.duration)}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text fw={500} style={{ color: themeColors.text }}>
                              {match.totalPoints}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge color={match.highestScoringTeam ? 'green' : 'gray'}>
                              {match.highestScoringTeam || 'Draw'}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" style={{ color: themeColors.textSecondary }}>
                              {new Date(match.timestamp).toLocaleDateString()}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Card>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          <Tabs.Panel value="matches">
            <div>Matches analytics view coming soon...</div>
          </Tabs.Panel>

          <Tabs.Panel value="teams">
            <div>Teams analytics view coming soon...</div>
          </Tabs.Panel>

          <Tabs.Panel value="players">
            <div>Players analytics view coming soon...</div>
          </Tabs.Panel>

          <Tabs.Panel value="tournaments">
            <div>Tournaments analytics view coming soon...</div>
          </Tabs.Panel>

          <Tabs.Panel value="trends">
            <div>Trends analytics view coming soon...</div>
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Container>
  );
};

export default AnalyticsDashboard;