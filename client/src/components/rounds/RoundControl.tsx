import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, Badge } from '@mantine/core';
import { useScoreboard } from '../../contexts/ScoreboardContext';
import TemplateManager from './TemplateManager';
import PlaylistManager from './PlaylistManager';
import CurrentRound from './CurrentRound';

export const RoundControl: React.FC = () => {
    const { t } = useTranslation();
    const { state } = useScoreboard();
    const { rounds } = state || {};
    const activePlaylist = rounds?.activePlaylist;

    return (
        <Tabs defaultValue="current">
            <Tabs.List>
                <Tabs.Tab value="current">
                    {t('rounds.tabs.current', '🎯 Current Round')}
                </Tabs.Tab>
                <Tabs.Tab value="templates">
                    {t('rounds.tabs.templates', '📋 Templates')}
                </Tabs.Tab>
                <Tabs.Tab
                    value="playlists"
                    rightSection={
                        activePlaylist && (
                            <Badge size="sm" variant="filled" color="blue">
                                {t('rounds.tabs.playing', 'Playing')}
                            </Badge>
                        )
                    }
                >
                    {t('rounds.tabs.playlists', '📝 Playlists')}
                </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="current" pt="md">
                <CurrentRound />
            </Tabs.Panel>

            <Tabs.Panel value="templates" pt="md">
                <TemplateManager />
            </Tabs.Panel>

            <Tabs.Panel value="playlists" pt="md">
                <PlaylistManager />
            </Tabs.Panel>
        </Tabs>
    );
};

export default RoundControl;
