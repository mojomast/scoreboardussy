import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useScoreboard } from '@/contexts/ScoreboardContext';
import { TeamControlPanel } from '../teams';
import { ScoreboardPreview } from './';
import { CategoryMappingEditor } from './CategoryMappingEditor';
import { CurrentRound, RoundControls } from '../rounds';
import { 
    Container, 
    Tabs, 
    TextInput, 
    Button, 
    ColorInput, 
    Group, 
    Stack, 
    NumberInput, 
    Text, 
    Title, 
    Paper, 
    Slider, 
    Checkbox, 
    SegmentedControl,
    Box,
    SimpleGrid,
    Switch
} from '@mantine/core';
// Removed unused server type imports

/**
 * Component for controlling the scoreboard settings.
 */

const ScoreboardControl: React.FC = () => {
    const { t, i18n } = useTranslation('translation');
    const {
        state,
        connectionState,
        resetAll,
        updateLogo,
        updateText,
        updateTextStyle,
        updateLogoSize,
        updateVisibility,
        updateRoundSetting,
        switchTeamEmojis, // Get the new function
        exportMatch, // Add exportMatch function
        setScoringMode,
    } = useScoreboard();
    const { team1, team2 } = state || {};
    
    const remote = (state as any)?.remoteControl;
    const remoteActive = remote?.source === 'mon-pacing';
    
    // Check if connected
    const isConnected = connectionState === 'connected';

    // Dock settings side-by-side preference (persist locally)
    const [dockSettings, setDockSettings] = useState<boolean>(() => {
        try { return localStorage.getItem('dockSettings') === 'true'; } catch { return false; }
    });
    useEffect(() => { try { localStorage.setItem('dockSettings', String(dockSettings)); } catch {} }, [dockSettings]);

    const [localTitleText, setLocalTitleText] = useState<string>('');
    const [localFooterText, setLocalFooterText] = useState<string>('');
    const [localTitleColor, setLocalTitleColor] = useState<string>('#000000');
    const [localTitleSize, setLocalTitleSize] = useState<number>(2);
    const [localFooterColor, setLocalFooterColor] = useState<string>('#000000');
    const [localFooterSize, setLocalFooterSize] = useState<number>(1.25);
    const [localLogoSize, setLocalLogoSize] = useState<number>(50);

    // Interop UI feedback states
    const [importStatus, setImportStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message?: string }>({ type: 'idle' });
    const [lockBusy, setLockBusy] = useState(false);
    const [lockMsg, setLockMsg] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({ type: 'idle' });

    // Timer local inputs
    const [localMinutes, setLocalMinutes] = useState<number>(2);
    const [localSeconds, setLocalSeconds] = useState<number>(0);
    // Initialize local state from context state
    useEffect(() => {
        if (state) {
            setLocalTitleText(state.titleText ?? '');
            setLocalFooterText(state.footerText ?? '');
            setLocalTitleColor(state.titleTextColor ?? '#000000');
            setLocalTitleSize(state.titleTextSize ?? 2);
            setLocalFooterColor(state.footerTextColor ?? '#000000');
            setLocalFooterSize(state.footerTextSize ?? 1.25);
            setLocalLogoSize(state.logoSize ?? 50);
        }
    }, [state]);

    // --- Input Handlers --- 
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => setLocalTitleText(e.target.value);
    const handleFooterChange = (e: React.ChangeEvent<HTMLInputElement>) => setLocalFooterText(e.target.value);

    // --- Update Button Handlers --- 
    const handleUpdateTextStyles = () => {
        updateTextStyle({ target: 'title', color: localTitleColor, size: localTitleSize });
        updateTextStyle({ target: 'footer', color: localFooterColor, size: localFooterSize });
    };

    const handleUpdateTitleClick = () => {
        updateText({ field: 'titleText', text: localTitleText });
    };

    const handleUpdateFooterClick = () => {
        updateText({ field: 'footerText', text: localFooterText });
    };

    // Handler for when a logo file is selected
    const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log('handleLogoFileChange triggered');
        const file = e.target.files?.[0];
        console.log('Selected file:', file);
        if (file) {
            const reader = new FileReader();
            console.log('FileReader created');
            reader.onload = (loadEvent) => {
                console.log('FileReader onload triggered');
                const result = loadEvent.target?.result;
                console.log('FileReader result:', result ? typeof result : 'null');
                if (typeof result === 'string') {
                    console.log('Updating logo with Data URL:', result.substring(0, 50) + '...');
                    updateLogo(result); 
                } else {
                    console.error('Failed to read file as Data URL.');
                }
            };
            reader.onerror = (error) => {
                console.error('FileReader error:', error);
            };
            reader.readAsDataURL(file); 
            console.log('Called reader.readAsDataURL');
        }
        // Reset the input value so the same file can be selected again if needed
        e.target.value = ''; 
        console.log('handleLogoFileChange finished');
    };

    // Send update to server when dragging stops
    const handleLogoSizeUpdate = (value: number) => {
        if (isConnected) {
            updateLogoSize({ size: value });
        }
    };

    // Timer control handlers (use interop event endpoint)
    const postEvent = async (body: any) => {
        try {
            await fetch('/api/interop/mon-pacing/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        } catch (e) {
            console.error('Timer event failed', e);
        }
    };
    const handleTimerStart = () => {
        const dur = Math.max(0, Math.floor(localMinutes) * 60 + Math.floor(localSeconds));
        postEvent({ type: 'timer', payload: { action: 'start', durationSec: dur } });
    };
    const handleTimerPause = () => postEvent({ type: 'pause' });
    const handleTimerResume = () => postEvent({ type: 'resume' });
    const handleTimerStop = () => postEvent({ type: 'timer', payload: { action: 'stop' } });

    const openScoreboardWindow = () => {
        window.open('#/display', '_blank', 'noopener,noreferrer');
    };

    // --- Language Toggle ---
    const handleLanguageChange = (value: string) => {
        i18n.changeLanguage(value);
    };

    if (!state) {
        // Display a loading or disconnected message
        return (
            <div className="p-4 text-center">
                <p>{isConnected ? t('scoreboardControl.loadingState') : t('scoreboardControl.disconnected')}</p>
            </div>
        );
    }

    // Pre-translate button text
    const uploadButtonText = t('scoreboardControl.uploadLogoBtn');
    const logoManagementTitleText = t('scoreboardControl.logoManagementTitle', 'Logo Management');

    // Scoring mode toggle + quick buttons (modular section)
    const ScoringModePanel: React.FC = () => (
        <Paper shadow="xs" p="md">
            <Title order={4} mb="sm">{t('scoreboardControl.scoringModeTitle', 'Scoring Mode')}</Title>
            <SegmentedControl
                data={[
                    { label: t('scoreboardControl.modeRound', 'Round Mode'), value: 'round' },
                    { label: t('scoreboardControl.modeManual', 'Manual Mode'), value: 'manual' },
                ]}
                value={(state?.scoringMode as 'round' | 'manual') || 'round'}
                onChange={(value) => {
                    if (value === 'round' || value === 'manual') {
                        setScoringMode(value);
                    }
                }}
                fullWidth
            />
            <Group mt="sm">
                <Button
                    variant={((state?.scoringMode as 'round' | 'manual') || 'round') === 'round' ? 'filled' : 'light'}
                    color="blue"
                    onClick={() => setScoringMode('round')}
                >
                    {t('scoreboardControl.modeRound', 'Round Mode')}
                </Button>
                <Button
                    variant={((state?.scoringMode as 'round' | 'manual') || 'round') === 'manual' ? 'filled' : 'light'}
                    color="grape"
                    onClick={() => setScoringMode('manual')}
                >
                    {t('scoreboardControl.modeManual', 'Manual Mode')}
                </Button>
            </Group>
        </Paper>
    );

    // Extract Settings into reusable panel for docking or tab usage
    const SettingsPanel: React.FC = () => (
        <Stack gap="xl">
            {/* Language Selector */}
            <Box>
                <Text size="sm" fw={500} mb={4}>{t('scoreboardControl.languageSelectLabel')}</Text>
                <SegmentedControl
                    data={[
                        { label: t('scoreboardControl.languageEnglish'), value: 'en' },
                        { label: t('scoreboardControl.languageFrench'), value: 'fr' },
                    ]}
                    value={i18n.language}
                    onChange={handleLanguageChange}
                    fullWidth
                />
            </Box>

            {/* Logo Management */}
            <Paper shadow="xs" p="md">
                <Title order={4} mb="sm">{logoManagementTitleText}</Title>
                <Group mb="sm">
                    <label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        {uploadButtonText}
                    </label>
                    <input id="logo-upload" name="logo-upload" type="file" className="sr-only" onChange={handleLogoFileChange} accept="image/*" />
                    <Button color="gray" onClick={() => updateLogo(null)} disabled={!isConnected || !state?.logoUrl}>
                        {t('scoreboardControl.removeLogoBtn')}
                    </Button>
                </Group>

                {state?.logoUrl && (
                    <Box mb="sm">
                        <Text size="sm" fw={500} mb={5}>{t('scoreboardControl.logoSizeLabel')}: {localLogoSize}%</Text>
                        <Slider
                            value={localLogoSize}
                            onChange={setLocalLogoSize}
                            onChangeEnd={handleLogoSizeUpdate}
                            min={10}
                            max={100}
                            step={1}
                            label={null}
                            disabled={!isConnected}
                        />
                    </Box>
                )}
            </Paper>

            {/* Title Text Management */}
            <Paper shadow="xs" p="md">
                <Title order={4} mb="sm">{t('scoreboardControl.titleManagementTitle')}</Title>
                <TextInput
                    label={t('scoreboardControl.titleTextLabel')}
                    value={localTitleText}
                    onChange={handleTitleChange}
                    disabled={!isConnected}
                    mb="xs"
                />
                <Button onClick={handleUpdateTitleClick} disabled={!isConnected} fullWidth>
                    {t('scoreboardControl.updateTitleBtn')}
                </Button>
            </Paper>

            {/* Footer Text Management */}
            <Paper shadow="xs" p="md">
                <Title order={4} mb="sm">{t('scoreboardControl.footerManagementTitle')}</Title>
                <TextInput
                    label={t('scoreboardControl.footerTextLabel')}
                    value={localFooterText}
                    onChange={handleFooterChange}
                    disabled={!isConnected}
                    mb="xs"
                />
                <Button onClick={handleUpdateFooterClick} disabled={!isConnected} fullWidth>
                    {t('scoreboardControl.updateFooterBtn')}
                </Button>
            </Paper>

            {/* Text Styles Management */}
            <Paper shadow="xs" p="md">
                <Title order={4} mb="sm">{t('scoreboardControl.textStylesTitle')}</Title>
                <Group grow align="flex-end">
                    <ColorInput label={t('scoreboardControl.titleColorLabel')} value={localTitleColor} onChange={setLocalTitleColor} disabled={!isConnected} />
                    <NumberInput
                        label={t('scoreboardControl.titleSizeLabel')}
                        value={localTitleSize}
                        onChange={(value) => setLocalTitleSize(typeof value === 'number' ? value : 1)}
                        min={0.5}
                        step={0.1}
                        decimalScale={2}
                        disabled={!isConnected}
                    />
                </Group>
                <Group grow align="flex-end" mt="sm">
                    <ColorInput label={t('scoreboardControl.footerColorLabel')} value={localFooterColor} onChange={setLocalFooterColor} disabled={!isConnected} />
                    <NumberInput
                        label={t('scoreboardControl.footerSizeLabel')}
                        value={localFooterSize}
                        onChange={(value) => setLocalFooterSize(typeof value === 'number' ? value : 1)}
                        min={0.5}
                        step={0.1}
                        decimalScale={2}
                        disabled={!isConnected}
                    />
                </Group>
                <Button onClick={handleUpdateTextStyles} disabled={!isConnected} fullWidth mt="md">
                    {t('scoreboardControl.updateStylesBtn')}
                </Button>
            </Paper>

 {/* Visibility Toggles */}
            <Paper shadow="xs" p="md">
                <Title order={4} mb="sm">{t('scoreboardControl.visibilityTitle')}</Title>
                <Checkbox
                    label={t('scoreboardControl.showScoreLabel')}
                    checked={state?.showScore ?? true}
                    onChange={(event) => updateVisibility({ target: 'score', visible: event.currentTarget.checked })}
                    disabled={!isConnected}
                    mb="xs"
                />
                <Checkbox
                    label={t('scoreboardControl.showPenaltiesLabel')}
                    checked={state?.showPenalties ?? true}
                    onChange={(event) => updateVisibility({ target: 'penalties', visible: event.currentTarget.checked })}
                    disabled={!isConnected}
                />
                <Checkbox
                    label={t('scoreboardControl.showTimerLabel', 'Show Timer on Display')}
                    checked={(state as any)?.showTimer ?? false}
                    onChange={(event) => updateVisibility({ target: 'timer', visible: event.currentTarget.checked })}
                    disabled={!isConnected}
                />
            </Paper>

            {/* Round Display Settings */}
            <Paper shadow="xs" p="md">
                <Title order={4} mb="sm">{t('scoreboardControl.roundDisplayTitle', 'Round Display')}</Title>
                <Checkbox
                    label={t('scoreboardControl.showRoundNumberLabel', 'Show Round Number')}
                    checked={state?.rounds?.settings?.showRoundNumber ?? true}
                    onChange={(event) => updateRoundSetting('showRoundNumber', event.currentTarget.checked)}
                    disabled={!isConnected}
                    mb="xs"
                />
                <Checkbox
                    label={t('scoreboardControl.showThemeLabel', 'Show Theme')}
                    checked={state?.rounds?.settings?.showTheme ?? true}
                    onChange={(event) => updateRoundSetting('showTheme', event.currentTarget.checked)}
                    disabled={!isConnected}
                    mb="xs"
                />
                <Checkbox
                    label={t('scoreboardControl.showTypeLabel', 'Show Round Type')}
                    checked={state?.rounds?.settings?.showType ?? true}
                    onChange={(event) => updateRoundSetting('showType', event.currentTarget.checked)}
                    disabled={!isConnected}
                    mb="xs"
                />
                <Checkbox
                    label={t('scoreboardControl.showMixedStatusLabel', 'Show Mixed/Compared Status')}
                    checked={state?.rounds?.settings?.showMixedStatus ?? true}
                    onChange={(event) => updateRoundSetting('showMixedStatus', event.currentTarget.checked)}
                    disabled={!isConnected}
                    mb="xs"
                />
                <Checkbox
                    label={t('scoreboardControl.showPlayerLimitsLabel', 'Show Player Limits')}
                    checked={state?.rounds?.settings?.showPlayerLimits ?? true}
                    onChange={(event) => updateRoundSetting('showPlayerLimits', event.currentTarget.checked)}
                    disabled={!isConnected}
                    mb="xs"
                />
                <Checkbox
                    label={t('scoreboardControl.showTimeLimitLabel', 'Show Time Limit')}
                    checked={state?.rounds?.settings?.showTimeLimit ?? true}
                    onChange={(event) => updateRoundSetting('showTimeLimit', event.currentTarget.checked)}
                    disabled={!isConnected}
                    mb="xs"
                />
                <Checkbox
                    label={t('scoreboardControl.showRoundHistoryLabel', 'Show Round History')}
                    checked={state?.rounds?.settings?.showRoundHistory ?? true}
                    onChange={(event) => updateRoundSetting('showRoundHistory', event.currentTarget.checked)}
                    disabled={!isConnected}
                />
            </Paper>

            {/* Export Match */}
            <Paper shadow="xs" p="md">
                <Title order={4} mb="sm">{t('scoreboardControl.exportTitle', 'Match Results')}</Title>
                <Stack>
                    <Text size="sm" c="dimmed">
                        {t('scoreboardControl.exportDescription', 'Export current match results and statistics to an HTML file.')}
                    </Text>
                    <Button 
                        onClick={exportMatch}
                        disabled={!isConnected || !state?.rounds?.history?.length}
                        leftSection={"📊"}
                        fullWidth
                    >
                        {t('scoreboardControl.exportButton', 'Export Match Results')}
                    </Button>
                </Stack>
            </Paper>

            {/* Mon-Pacing Plan Import */}
            <Paper shadow="xs" p="md">
                <Title order={4} mb="sm">Mon-Pacing Plan Import</Title>
                <Text size="sm" c="dimmed" mb="sm">Import a Mon-Pacing plan JSON to queue rounds and set teams.</Text>
                <input
                  type="file"
                  accept="application/json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    setImportStatus({ type: 'loading', message: 'Importing…' });
                    reader.onload = async () => {
                      try {
                        const body = reader.result as string;
                        const resp = await fetch('/api/interop/mon-pacing/plan', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body,
                        });
                        const text = await resp.text();
                        if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${text}`);
                        setImportStatus({ type: 'success', message: 'Plan imported successfully' });
                      } catch (err) {
                        console.error('Import failed', err);
                        setImportStatus({ type: 'error', message: 'Import failed' });
                      } finally {
                        e.currentTarget.value = '';
                      }
                    };
                    reader.onerror = () => {
                      setImportStatus({ type: 'error', message: 'Failed to read file' });
                    };
                    reader.readAsText(file);
                  }}
                />
                {importStatus.type !== 'idle' && (
                  <Text size="sm" c={importStatus.type === 'error' ? 'red' : importStatus.type === 'loading' ? 'dimmed' : 'green'} mt="xs">
                    {importStatus.message}
                  </Text>
                )}
            </Paper>

            {/* Timer Controls */}
            <Paper shadow="xs" p="md">
                <Title order={4} mb="sm">{t('scoreboardControl.timerTitle', 'Timer Controls')}</Title>
                <Group justify="space-between" align="end" mb="sm">
                    <div>
                        <Text size="sm" c="dimmed">
                            {t('scoreboardControl.timerStatus', 'Status')}: {(state as any)?.timer?.status ?? 'stopped'}
                        </Text>
                        {
                          (() => {
                            const total = Math.max(0, Math.floor(((state as any)?.timer?.remainingSec ?? 0)));
                            const mm = Math.floor(total / 60).toString().padStart(2, '0');
                            const ss = (total % 60).toString().padStart(2, '0');
                            return (
                              <Text size="xl" fw={700}>{mm}:{ss}</Text>
                            );
                          })()
                        }
                    </div>
                    <Group>
                        <NumberInput
                            label={t('scoreboardControl.timerMinutes', 'Minutes')}
                            min={0}
                            value={localMinutes}
                            onChange={(v) => setLocalMinutes(typeof v === 'number' ? v : 0)}
                        />
                        <NumberInput
                            label={t('scoreboardControl.timerSeconds', 'Seconds')}
                            min={0}
                            max={59}
                            value={localSeconds}
                            onChange={(v) => setLocalSeconds(typeof v === 'number' ? Math.min(59, Math.max(0, v)) : 0)}
                        />
                    </Group>
                </Group>
                <Group gap="sm">
                    <Button onClick={handleTimerStart} disabled={!isConnected}>{t('scoreboardControl.timerStart', 'Start')}</Button>
                    <Button onClick={handleTimerPause} disabled={!isConnected}>{t('scoreboardControl.timerPause', 'Pause')}</Button>
                    <Button onClick={handleTimerResume} disabled={!isConnected}>{t('scoreboardControl.timerResume', 'Resume')}</Button>
                    <Button color="red" onClick={handleTimerStop} disabled={!isConnected}>{t('scoreboardControl.timerStop', 'Stop')}</Button>
                </Group>
            </Paper>

            {/* Emoji Settings */}
            <Paper shadow="xs" p="md">
                <Title order={4} mb="sm">{t('scoreboardControl.emojiTitle')}</Title>
                <Stack>
                    <Checkbox
                        label={t('scoreboardControl.showEmojisLabel')}
                        checked={state?.showEmojis ?? true}
                        onChange={(event) => updateVisibility({ target: 'emojis', visible: event.currentTarget.checked })}
                    />
                    <Button onClick={switchTeamEmojis} disabled={!isConnected}>
                        {t('scoreboardControl.switchEmojisButton')}
                    </Button>
                </Stack>
            </Paper>

            {/* Restart Match */}
            <Paper shadow="xs" p="md">
                <Title order={4} mb="sm">{t('scoreboardControl.restartMatchTitle', 'Restart Match')}</Title>
                <Text c="dimmed" size="sm" mb="xs">{t('scoreboardControl.restartMatchHint', 'Resets scores, penalties, current round and history. Team names/colors are kept.')}</Text>
                <Button color="red" variant="filled" onClick={resetAll} disabled={!isConnected}>
                    {t('scoreboardControl.restartMatchBtn', 'Restart Match')}
                </Button>
            </Paper>
        </Stack>
    );

    return (
        <Container size="lg" py="xl">
            <Group justify="space-between" align="center" mb="xl"> 
                <Title order={2} ta="center">{t('scoreboardControl.title')}</Title>
                <Group>
                    <Switch
                        checked={dockSettings}
                        onChange={(e) => setDockSettings(e.currentTarget.checked)}
                        label={t('scoreboardControl.dockSettings', 'Dock Settings')}
                        size="sm"
                    />
                    <Button onClick={openScoreboardWindow}>
                        {t('scoreboardControl.openDisplayBtn')} 
                    </Button>
                </Group>
            </Group>

            {/* Remote control banner */}
            {remoteActive && (
                <Paper shadow="xs" p="sm" withBorder mb="md">
                    <Group justify="space-between" align="center">
                        <Text size="sm" fw={600}>Remote controlled by Mon-Pacing</Text>
                        <Group gap="sm">
                            <Switch
                                checked={!!remote?.locked}
                                disabled={lockBusy}
                                onChange={(e) => {
                                    const next = e.currentTarget.checked;
                                    setLockBusy(true);
                                    setLockMsg({ type: 'idle' });
                                    fetch('/api/interop/mon-pacing/lock', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ locked: next }),
                                    })
                                        .then(async (resp) => {
                                            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                                            setLockMsg({ type: 'success', message: next ? 'Locked' : 'Unlocked' });
                                        })
                                        .catch((err) => {
                                            console.error('Lock toggle failed', err);
                                            setLockMsg({ type: 'error', message: 'Failed to update lock' });
                                        })
                                        .finally(() => setLockBusy(false));
                                }}
                                label="Lock local overrides"
                            />
                            {lockMsg.type !== 'idle' && (
                                <Text size="xs" c={lockMsg.type === 'error' ? 'red' : 'green'}>
                                    {lockMsg.message}
                                </Text>
                            )}
                        </Group>
                    </Group>
                </Paper>
            )}

            {/* Scoreboard Preview - Always visible */}
            <Paper shadow="sm" p="md" mb="xl">
                <Title order={3} ta="center" mb="md">
                    {t('preview.title')}
                </Title>
                <ScoreboardPreview state={state} />
            </Paper>

            {/* Tabs for controls or docked layout */}
            {!dockSettings ? (
                <Tabs defaultValue="teams">
                    <Tabs.List grow>
                        <Tabs.Tab value="teams" disabled={!team1 || !team2}>{t('scoreboardControl.tabTeams')}</Tabs.Tab>
                        <Tabs.Tab value="settings">{t('scoreboardControl.tabSettings')}</Tabs.Tab>
                        <Tabs.Tab value="interop">Mon-Pacing</Tabs.Tab>
                    </Tabs.List>

                    {/* --- Teams Tab --- */}
                    <Tabs.Panel value="teams" pt="xs">
                        <Stack gap="lg">
                            <SimpleGrid cols={2} spacing="lg">
                                {team1 && (
                                    <TeamControlPanel
                                        key={i18n.language + '-team1'}
                                        teamId="team1"
                                        team={team1}
                                    />
                                )}
                                {team2 && (
                                    <TeamControlPanel
                                        key={i18n.language + '-team2'}
                                        teamId="team2"
                                        team={team2}
                                    />
                                )}
                            </SimpleGrid>
                            <Paper shadow="xs" p="md">
                                <Title order={4} mb="sm">{t('scoreboardControl.roundsSectionTitle', 'Rounds')}</Title>
                                <RoundControls />
                                <CurrentRound />
                            </Paper>
                        </Stack>
                    </Tabs.Panel>

                    {/* --- Settings Tab --- */}
                    <Tabs.Panel value="settings" pt="xs">
                        <Stack gap="xl">
                            <ScoringModePanel />
                            <SettingsPanel />
                            <Paper shadow="xs" p="md">
                                <Title order={4} mb="sm">Mon-Pacing Category Mapping</Title>
                                <CategoryMappingEditor />
                            </Paper>
                        </Stack>
                    </Tabs.Panel>

                    {/* --- Interop Tab --- */}
                    <Tabs.Panel value="interop" pt="xs">
                        <Paper shadow="xs" p="md">
                            <Title order={4} mb="sm">Mon-Pacing Category Mapping</Title>
                            <Text size="sm" c="dimmed" mb="sm">Map Mon-Pacing category strings to your Round types.</Text>
                            <CategoryMappingEditor />
                        </Paper>
                    </Tabs.Panel>
                </Tabs>
            ) : (
                <SimpleGrid cols={2} spacing="xl" mt="md">
                    <div>
                        <Tabs defaultValue="teams">
                            <Tabs.List grow>
                                <Tabs.Tab value="teams" disabled={!team1 || !team2}>{t('scoreboardControl.tabTeams')}</Tabs.Tab>
                            </Tabs.List>
                            <Tabs.Panel value="teams" pt="xs">
                                <Stack gap="lg">
                                    <SimpleGrid cols={2} spacing="lg">
                                        {team1 && (
                                            <TeamControlPanel key={i18n.language + '-team1'} teamId="team1" team={team1} />
                                        )}
                                        {team2 && (
                                            <TeamControlPanel key={i18n.language + '-team2'} teamId="team2" team={team2} />
                                        )}
                                    </SimpleGrid>
                                    <Paper shadow="xs" p="md">
                                        <Title order={4} mb="sm">{t('scoreboardControl.roundsSectionTitle', 'Rounds')}</Title>
                                        <RoundControls />
                                        <CurrentRound />
                                    </Paper>
                                </Stack>
                            </Tabs.Panel>
                        </Tabs>
                    </div>
                    <div>
                        <Stack gap="xl">
                            <ScoringModePanel />
                            <SettingsPanel />
                        </Stack>
                    </div>
                </SimpleGrid>
            )}

        </Container>
    );
};

export default ScoreboardControl;