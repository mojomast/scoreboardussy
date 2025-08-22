import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTournament } from '../../contexts/TournamentContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Container,
  Title,
  Button,
  Group,
  Paper,
  Text,
  Badge,
  Tabs,
  Table,
  ActionIcon,
  Menu,
  TextInput,
  Select,
  Stack,
  Card,
  Progress,
  Grid,
  Modal
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconPlayerPlay,
  IconCheck,
  IconX,
  IconTrophy,
  IconUsers,
  IconCalendar,
  IconDots,
  IconFilter,
  IconSortAscending,
  IconSortDescending
} from '@tabler/icons-react';
import { Tournament, TournamentView } from '../../types/tournament.types';
import TournamentForm from './TournamentForm';
import TournamentBracket from './TournamentBracket';
import TournamentStats from './TournamentStats';

const TournamentManager: React.FC = () => {
  const { t } = useTranslation();
  const { actualTheme } = useTheme();
  const {
    tournaments,
    currentTournament,
    loading,
    error,
    getSortedTournaments,
    setCurrentTournament,
    deleteTournament,
    startTournament,
    completeTournament,
    cancelTournament,
    setFilters,
    setSortOptions,
    clearError
  } = useTournament();

  const [view, setView] = useState<TournamentView>('overview');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');

  const sortedTournaments = getSortedTournaments();

  const filteredTournaments = sortedTournaments.filter(tournament => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tournament.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tournament.status === statusFilter;
    const matchesFormat = formatFilter === 'all' || tournament.format === formatFilter;

    return matchesSearch && matchesStatus && matchesFormat;
  });

  const getStatusColor = (status: Tournament['status']) => {
    switch (status) {
      case 'draft': return 'gray';
      case 'in_progress': return 'blue';
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const getFormatLabel = (format: Tournament['format']) => {
    switch (format) {
      case 'single_elimination': return 'Single Elimination';
      case 'double_elimination': return 'Double Elimination';
      case 'round_robin': return 'Round Robin';
      case 'swiss': return 'Swiss';
      default: return format;
    }
  };

  const handleEditTournament = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setEditModalOpen(true);
  };

  const handleDeleteTournament = async (tournamentId: string) => {
    if (window.confirm('Are you sure you want to delete this tournament?')) {
      try {
        await deleteTournament(tournamentId);
      } catch (error) {
        console.error('Failed to delete tournament:', error);
      }
    }
  };

  const handleStartTournament = async (tournamentId: string) => {
    try {
      await startTournament(tournamentId);
    } catch (error) {
      console.error('Failed to start tournament:', error);
    }
  };

  const handleCompleteTournament = async (tournamentId: string) => {
    try {
      await completeTournament(tournamentId);
    } catch (error) {
      console.error('Failed to complete tournament:', error);
    }
  };

  const handleCancelTournament = async (tournamentId: string) => {
    if (window.confirm('Are you sure you want to cancel this tournament?')) {
      try {
        await cancelTournament(tournamentId);
      } catch (error) {
        console.error('Failed to cancel tournament:', error);
      }
    }
  };

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

  return (
    <Container size="xl" py="xl">
      {/* Header */}
      <Group justify="space-between" align="center" mb="xl" className="flex-col sm:flex-row gap-4">
        <Group align="center" gap="sm">
          <IconTrophy size={32} style={{ color: themeColors.primary }} />
          <div>
            <Title style={{ color: themeColors.text }}>Tournament Manager</Title>
            <Text size="sm" style={{ color: themeColors.textSecondary }}>
              Manage improv tournaments and competitions
            </Text>
          </div>
        </Group>

        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setCreateModalOpen(true)}
          style={{
            backgroundColor: themeColors.primary,
            color: 'white'
          }}
        >
          Create Tournament
        </Button>
      </Group>

      {/* Error Display */}
      {error && (
        <Paper p="md" mb="lg" style={{ backgroundColor: '#fee', border: '1px solid #fcc' }}>
          <Group justify="space-between">
            <Text c="red">{error}</Text>
            <Button size="sm" variant="outline" onClick={clearError}>
              Dismiss
            </Button>
          </Group>
        </Paper>
      )}

      {/* Filters and Search */}
      <Paper p="md" mb="lg" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
        <Stack gap="md">
          <Group justify="space-between" align="center" className="flex-col sm:flex-row gap-4">
            <Text fw={500} style={{ color: themeColors.text }}>Filters & Search</Text>
            <Button
              variant="subtle"
              size="sm"
              leftSection={<IconFilter size={16} />}
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setFormatFilter('all');
                setFilters({});
              }}
            >
              Clear Filters
            </Button>
          </Group>

          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <TextInput
                placeholder="Search tournaments..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.currentTarget.value)}
                leftSection={<IconFilter size={16} />}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3, md: 2 }}>
              <Select
                placeholder="Status"
                value={statusFilter}
                onChange={(value) => setStatusFilter(value || 'all')}
                data={[
                  { value: 'all', label: 'All Status' },
                  { value: 'draft', label: 'Draft' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' }
                ]}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3, md: 2 }}>
              <Select
                placeholder="Format"
                value={formatFilter}
                onChange={(value) => setFormatFilter(value || 'all')}
                data={[
                  { value: 'all', label: 'All Formats' },
                  { value: 'single_elimination', label: 'Single Elim' },
                  { value: 'double_elimination', label: 'Double Elim' },
                  { value: 'round_robin', label: 'Round Robin' },
                  { value: 'swiss', label: 'Swiss' }
                ]}
              />
            </Grid.Col>
          </Grid>
        </Stack>
      </Paper>

      {/* Tournament List */}
      <Paper style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
        <Tabs value={view} onChange={(value) => setView(value as TournamentView)}>
          <Tabs.List grow mb="md">
            <Tabs.Tab value="overview">Overview</Tabs.Tab>
            <Tabs.Tab value="bracket" disabled={!currentTournament}>Bracket</Tabs.Tab>
            <Tabs.Tab value="teams" disabled={!currentTournament}>Teams</Tabs.Tab>
            <Tabs.Tab value="matches" disabled={!currentTournament}>Matches</Tabs.Tab>
            <Tabs.Tab value="stats" disabled={!currentTournament}>Statistics</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <Text style={{ color: themeColors.textSecondary }}>Loading tournaments...</Text>
              </div>
            ) : filteredTournaments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <IconTrophy size={48} style={{ color: themeColors.textSecondary, marginBottom: '1rem' }} />
                <Text size="lg" style={{ color: themeColors.text }}>No tournaments found</Text>
                <Text size="sm" style={{ color: themeColors.textSecondary, marginTop: '0.5rem' }}>
                  {tournaments.length === 0 ? 'Create your first tournament to get started!' : 'Try adjusting your filters.'}
                </Text>
                {tournaments.length === 0 && (
                  <Button
                    mt="md"
                    leftSection={<IconPlus size={16} />}
                    onClick={() => setCreateModalOpen(true)}
                    style={{
                      backgroundColor: themeColors.primary,
                      color: 'white'
                    }}
                  >
                    Create Tournament
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ color: themeColors.text }}>Name</Table.Th>
                    <Table.Th style={{ color: themeColors.text }}>Format</Table.Th>
                    <Table.Th style={{ color: themeColors.text }}>Teams</Table.Th>
                    <Table.Th style={{ color: themeColors.text }}>Status</Table.Th>
                    <Table.Th style={{ color: themeColors.text }}>Progress</Table.Th>
                    <Table.Th style={{ color: themeColors.text }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredTournaments.map((tournament) => (
                    <Table.Tr key={tournament.id}>
                      <Table.Td>
                        <div>
                          <Text fw={500} style={{ color: themeColors.text }}>{tournament.name}</Text>
                          {tournament.description && (
                            <Text size="sm" style={{ color: themeColors.textSecondary }} lineClamp={1}>
                              {tournament.description}
                            </Text>
                          )}
                        </div>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" style={{ color: themeColors.textSecondary }}>
                          {getFormatLabel(tournament.format)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <IconUsers size={16} style={{ color: themeColors.textSecondary }} />
                          <Text size="sm" style={{ color: themeColors.text }}>
                            {tournament.teams.length}
                          </Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={getStatusColor(tournament.status)} variant="light">
                          {tournament.status.replace('_', ' ')}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <div style={{ minWidth: '120px' }}>
                          <Text size="sm" style={{ color: themeColors.textSecondary, marginBottom: '4px' }}>
                            Round {tournament.currentRound} of {tournament.maxRounds}
                          </Text>
                          <Progress
                            value={(tournament.currentRound / tournament.maxRounds) * 100}
                            size="sm"
                            color={getStatusColor(tournament.status)}
                          />
                        </div>
                      </Table.Td>
                      <Table.Td>
                        <Menu shadow="md" width={200}>
                          <Menu.Target>
                            <ActionIcon variant="subtle">
                              <IconDots size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item onClick={() => setCurrentTournament(tournament)}>
                              View Details
                            </Menu.Item>
                            <Menu.Item onClick={() => handleEditTournament(tournament)}>
                              Edit
                            </Menu.Item>
                            <Menu.Divider />
                            {tournament.status === 'draft' && (
                              <Menu.Item
                                leftSection={<IconPlayerPlay size={14} />}
                                onClick={() => handleStartTournament(tournament.id)}
                              >
                                Start Tournament
                              </Menu.Item>
                            )}
                            {tournament.status === 'in_progress' && (
                              <>
                                <Menu.Item
                                  leftSection={<IconCheck size={14} />}
                                  onClick={() => handleCompleteTournament(tournament.id)}
                                >
                                  Complete Tournament
                                </Menu.Item>
                                <Menu.Item
                                  leftSection={<IconX size={14} />}
                                  onClick={() => handleCancelTournament(tournament.id)}
                                >
                                  Cancel Tournament
                                </Menu.Item>
                              </>
                            )}
                            <Menu.Divider />
                            <Menu.Item
                              leftSection={<IconTrash size={14} />}
                              onClick={() => handleDeleteTournament(tournament.id)}
                              style={{ color: 'var(--mantine-color-red-6)' }}
                            >
                              Delete
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="bracket">
            {currentTournament && <TournamentBracket tournament={currentTournament} />}
          </Tabs.Panel>

          <Tabs.Panel value="teams">
            {currentTournament && <div>Teams view for {currentTournament.name}</div>}
          </Tabs.Panel>

          <Tabs.Panel value="matches">
            {currentTournament && <div>Matches view for {currentTournament.name}</div>}
          </Tabs.Panel>

          <Tabs.Panel value="stats">
            {currentTournament && <TournamentStats tournament={currentTournament} />}
          </Tabs.Panel>
        </Tabs>
      </Paper>

      {/* Create Tournament Modal */}
      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Tournament"
        size="lg"
        centered
      >
        <TournamentForm onClose={() => setCreateModalOpen(false)} />
      </Modal>

      {/* Edit Tournament Modal */}
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Tournament"
        size="lg"
        centered
      >
        <TournamentForm tournament={editingTournament} onClose={() => setEditModalOpen(false)} />
      </Modal>
    </Container>
  );
};

export default TournamentManager;