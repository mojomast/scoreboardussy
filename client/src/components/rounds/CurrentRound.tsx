import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    Stack,
    Paper,
    Title,
    Text,
    Badge,
    Group,
    Button,
    TextInput,
    NumberInput,
    Switch,
    Select,
    Divider,
    ActionIcon
} from '@mantine/core';
import { useScoreboard } from '../../contexts/ScoreboardContext';
import { RoundType } from '@server-types/rounds.types';

const CurrentRound: React.FC = () => {
    const { t } = useTranslation();
    const { state, startRound, endRound, startGame, finishGame, setNextRoundDraft, enqueueUpcoming, dequeueUpcoming } = useScoreboard();
    const { rounds } = state || {};
    const currentRound = rounds?.current;
    const isBetweenRounds = rounds?.isBetweenRounds === true;
    const roundHistory = rounds?.history || [];
    const scoringMode = (state as any)?.scoringMode ?? 'round';
    const gameStatus = (rounds as any)?.gameStatus ?? 'notStarted';
    const nextRoundDraft = (rounds as any)?.nextRoundDraft ?? null;
    const upcoming = ((rounds as any)?.upcoming ?? []) as any[];

    // Local state for new round form
    const [roundType, setRoundType] = useState<RoundType>(RoundType.SHORTFORM);
    const [theme, setTheme] = useState('');
    const [isMixed, setIsMixed] = useState(false);
    const [minPlayers, setMinPlayers] = useState(2);
    const [maxPlayers, setMaxPlayers] = useState(8);
    const [timeLimit, setTimeLimit] = useState<number | null>(null);

    // Round results form state
    const [team1Points, setTeam1Points] = useState(0);
    const [team2Points, setTeam2Points] = useState(0);
    const [roundNotes, setRoundNotes] = useState('');

    const handleStartRound = () => {
        const nextRoundNumber = roundHistory.length + 1;
        const newRound = {
            number: nextRoundNumber,
            type: roundType,
            isMixed,
            theme,
            minPlayers,
            maxPlayers,
            timeLimit
        };
        startRound(newRound);
        // Reset form
        setTheme('');
        setIsMixed(false);
    };

    const handleEndRound = () => {
        if (!currentRound) return;
        
        // Send just the points scored in this round
        const results = {
            points: {
                team1: team1Points,  // Just the points scored in this round
                team2: team2Points   // Just the points scored in this round
            },
            penalties: {
                team1: state?.team1.penalties || { major: 0, minor: 0 },
                team2: state?.team2.penalties || { major: 0, minor: 0 }
            },
            notes: roundNotes
        };
        
        endRound(results);
        
        // Reset form
        setTeam1Points(0);
        setTeam2Points(0);
        setRoundNotes('');
        
        // Let server drive next round or user manually start next round.
        // We optimistically set between-rounds state in context.
    };

    const roundTypeOptions = Object.values(RoundType).map(type => ({
        value: type,
        label: type.charAt(0).toUpperCase() + type.slice(1)
    }));

    // Hide round constructs in manual mode
    if (scoringMode === 'manual') {
        return (
            <Paper shadow="xs" p="md">
                <Title order={4} mb="md">{t('rounds.manualModeTitle', 'Rounds disabled in Manual Mode')}</Title>
                <Text c="dimmed">{t('rounds.manualModeHint', 'Switch to Round mode to plan and run rounds.')}</Text>
            </Paper>
        );
    }

    return (
        <Stack gap="xl">
            {/* Lifecycle controls (visible in round mode) */}
            <Paper shadow="xs" p="md">
                <Group justify="space-between" mb="sm">
                    <Title order={4}>{t('rounds.lifecycle', 'Match Lifecycle')}</Title>
                    <Group>
                        <Button color="green" onClick={startGame} disabled={!isBetweenRounds || gameStatus === 'live'}>
                            {t('rounds.startGame', 'Start Game')}
                        </Button>
                        <Button color="red" variant="filled" onClick={finishGame} disabled={gameStatus !== 'live'}>
                            {t('rounds.finishGame', 'Finish Game')}
                        </Button>
                    </Group>
                </Group>

                {/* Next Round Draft editor */}
                <Title order={5} mb="sm">{t('rounds.nextDraft', 'Next Round Draft')}</Title>
                <Group grow mb="md">
                    <Select
                        label={t('rounds.typeLabel', 'Round Type')}
                        value={roundType}
                        onChange={(value) => value && setRoundType(value as RoundType)}
                        data={roundTypeOptions}
                        required
                    />
                    
                    <TextInput
                        label={t('rounds.themeLabel', 'Theme')}
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        placeholder={t('rounds.themePlaceholder', 'Optional theme')}
                    />
                </Group>
                
                <Group grow mb="md">
                    <NumberInput
                        label={t('rounds.minPlayersLabel', 'Min Players')}
                        value={minPlayers}
                        onChange={(value) => setMinPlayers(typeof value === 'number' ? value : 2)}
                        min={1}
                        max={20}
                    />
                    
                    <NumberInput
                        label={t('rounds.maxPlayersLabel', 'Max Players')}
                        value={maxPlayers}
                        onChange={(value) => setMaxPlayers(typeof value === 'number' ? value : 8)}
                        min={1}
                        max={20}
                    />
                    
                    <NumberInput
                        label={t('rounds.timeLimitLabel', 'Time Limit (seconds)')}
                        value={timeLimit ?? ''}
                        onChange={(value) => setTimeLimit(typeof value === 'number' ? value : null)}
                        min={0}
                        placeholder="No limit"
                    />
                </Group>

                <Group align="flex-end" justify="space-between">
                    <Switch
                        label={t('rounds.mixedTeamsLabel', 'Mixed Teams')}
                        checked={isMixed}
                        onChange={(e) => setIsMixed(e.currentTarget.checked)}
                    />
                    <Group>
                        <Button
                            onClick={() => {
                                const nextNumber = roundHistory.length + 1;
                                const config = {
                                    number: nextNumber,
                                    type: roundType,
                                    isMixed,
                                    theme,
                                    minPlayers,
                                    maxPlayers,
                                    timeLimit
                                };
                                setNextRoundDraft(config);
                            }}
                            color="blue"
                        >
                            {t('rounds.saveDraft', 'Save Draft')}
                        </Button>
                        <Button
                            onClick={() => {
                                const nextNumber = roundHistory.length + 1;
                                const config = {
                                    number: nextNumber,
                                    type: roundType,
                                    isMixed,
                                    theme,
                                    minPlayers,
                                    maxPlayers,
                                    timeLimit
                                };
                                enqueueUpcoming(config);
                            }}
                            variant="light"
                        >
                            {t('rounds.enqueue', 'Enqueue')}
                        </Button>
                    </Group>
                </Group>

                {nextRoundDraft && (
                    <Text size="sm" c="dimmed" mt="sm">
                        {t('rounds.draftSaved', 'Draft saved')}: {nextRoundDraft.type} {nextRoundDraft.theme ? `- ${nextRoundDraft.theme}` : ''}
                    </Text>
                )}

                {upcoming.length > 0 && (
                    <Group mt="sm" gap="xs">
                        {upcoming.map((u, idx) => (
                            <Badge key={idx} variant="outline">{u.type}{u.theme ? `: ${u.theme}` : ''}</Badge>
                        ))}
                        <ActionIcon onClick={() => dequeueUpcoming()} title={t('rounds.dequeue', 'Dequeue next')}>↙️</ActionIcon>
                    </Group>
                )}
            </Paper>

            {/* New Round Form (only for Manual scoring mode) */}
            {scoringMode === 'manual' && (!currentRound || isBetweenRounds) && (
                <Paper shadow="xs" p="md">
                    <Title order={4} mb="md">{t('rounds.newRound', 'New Round')}</Title>
                    
                    <Group grow mb="md">
                        <Select
                            label={t('rounds.typeLabel', 'Round Type')}
                            value={roundType}
                            onChange={(value) => value && setRoundType(value as RoundType)}
                            data={roundTypeOptions}
                            required
                        />
                        
                        <TextInput
                            label={t('rounds.themeLabel', 'Theme')}
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                            placeholder={t('rounds.themePlaceholder', 'Optional theme')}
                        />
                    </Group>
                    
                    <Group grow mb="md">
                        <NumberInput
                            label={t('rounds.minPlayersLabel', 'Min Players')}
                            value={minPlayers}
                            onChange={(value) => setMinPlayers(typeof value === 'number' ? value : 2)}
                            min={1}
                            max={20}
                        />
                        
                        <NumberInput
                            label={t('rounds.maxPlayersLabel', 'Max Players')}
                            value={maxPlayers}
                            onChange={(value) => setMaxPlayers(typeof value === 'number' ? value : 8)}
                            min={1}
                            max={20}
                        />
                        
                        <NumberInput
                            label={t('rounds.timeLimitLabel', 'Time Limit (seconds)')}
                            value={timeLimit ?? ''}
                            onChange={(value) => setTimeLimit(typeof value === 'number' ? value : null)}
                            min={0}
                            placeholder="No limit"
                        />
                    </Group>
                    
                    <Group mb="md">
                        <Switch
                            label={t('rounds.mixedTeamsLabel', 'Mixed Teams')}
                            checked={isMixed}
                            onChange={(e) => setIsMixed(e.currentTarget.checked)}
                        />
                    </Group>
                    
                    <Button 
                        onClick={handleStartRound} 
                        color="blue" 
                        fullWidth
                    >
                        {t('rounds.startRoundButton', 'Start Round')}
                    </Button>
                </Paper>
            )}

            {/* Current Round Section */}
            <Paper shadow="xs" p="md">
                <Title order={4} mb="md">{t('rounds.currentRound', 'Current Round')}</Title>
                {gameStatus === 'live' && currentRound && !isBetweenRounds ? (
                    <>
                        <Group>
                            <Badge size="lg">
                                {t('rounds.numberLabel', 'Round {{number}}', { number: currentRound.number })}
                            </Badge>
                            <Text fw={500}>
                                {currentRound.type.charAt(0).toUpperCase() + currentRound.type.slice(1)}
                            </Text>
                            {currentRound.theme && (
                                <Text c="dimmed">
                                    {t('rounds.theme', 'Theme')}: {currentRound.theme}
                                </Text>
                            )}
                            {currentRound.timeLimit && (
                                <Badge color="yellow">
                                    {t('rounds.timeLimit', 'Time Limit')}: {currentRound.timeLimit}s
                                </Badge>
                            )}
                        </Group>

                        <Divider my="md" />

                        <Title order={5} mb="md">{t('rounds.endRound', 'End Round & Record Results')}</Title>
                        
                        <Group grow mb="md">
                            <NumberInput
                                label={`${state?.team1?.name || 'Team 1'} ${t('rounds.pointsLabel', 'Points')}`}
                                value={team1Points}
                                onChange={(value) => setTeam1Points(typeof value === 'number' ? value : 0)}
                                min={0}
                            />
                            
                            <NumberInput
                                label={`${state?.team2?.name || 'Team 2'} ${t('rounds.pointsLabel', 'Points')}`}
                                value={team2Points}
                                onChange={(value) => setTeam2Points(typeof value === 'number' ? value : 0)}
                                min={0}
                            />
                        </Group>
                        
                        <TextInput
                            label={t('rounds.notesLabel', 'Round Notes')}
                            value={roundNotes}
                            onChange={(e) => setRoundNotes(e.target.value)}
                            placeholder={t('rounds.notesPlaceholder', 'Optional notes about this round')}
                            mb="md"
                        />
                        
                        <Button 
                            onClick={handleEndRound} 
                            color="red" 
                            fullWidth
                            disabled={gameStatus !== 'live'}
                        >
                            {t('rounds.endRoundButton', 'End Round & Save Results')}
                        </Button>
                    </>
                ) : (
                    <Text c="dimmed">{t('rounds.noActiveRound', 'No active round')}</Text>
                )}
            </Paper>

            {/* Round History Section */}
            <Paper shadow="xs" p="md">
                <Title order={4} mb="md">{t('rounds.history', 'Round History')}</Title>
                {roundHistory.length > 0 ? (
                    <Stack gap="sm">
                        {roundHistory.map((round, index) => {
                            // Calculate cumulative score up to this round
                            const cumulativeScore = {
                                team1: roundHistory.slice(0, index + 1).reduce((sum, r) => sum + r.points.team1, 0),
                                team2: roundHistory.slice(0, index + 1).reduce((sum, r) => sum + r.points.team2, 0)
                            };

                            return (
                                <Paper key={index} withBorder p="sm">
                                    <Group justify="space-between">
                                        <Group gap="md">
                                            <Badge size="lg">
                                                {t('rounds.numberLabel', 'Round {{number}}', { number: round.number })}
                                            </Badge>
                                            <Text fw={500}>
                                                {round.type.charAt(0).toUpperCase() + round.type.slice(1)}
                                            </Text>
                                        </Group>
                                        <Group gap="xs">
                                            <Text size="sm">
                                                {t('rounds.roundPoints', 'Points')}: +{round.points.team1}/+{round.points.team2}
                                            </Text>
                                            <Text size="sm" c="dimmed">
                                                ({t('rounds.totalScore', 'Total')}: {cumulativeScore.team1}-{cumulativeScore.team2})
                                            </Text>
                                        </Group>
                                    </Group>
                                    {round.notes && (
                                        <Text size="sm" mt="xs" c="dimmed">
                                            {round.notes}
                                        </Text>
                                    )}
                                </Paper>
                            );
                        })}
                    </Stack>
                ) : (
                    <Text c="dimmed">{t('rounds.noHistory', 'No rounds completed')}</Text>
                )}
            </Paper>
        </Stack>
    );
};

export default CurrentRound;

