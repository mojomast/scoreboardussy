import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    Paper, 
    Title, 
    TextInput, 
    Group, 
    Button, 
    Stack,
    Text,
    Badge,
    ActionIcon,
    Menu,
    Modal,
    Textarea,
    Select,
    ScrollArea
} from '@mantine/core';
// Using emojis instead of icon library
import { useScoreboard } from '../../contexts/ScoreboardContext';

interface PlaylistFormData {
    name: string;
    description: string;
    selectedTemplates: string[];
}

export const PlaylistManager: React.FC = () => {
    const { t } = useTranslation();
    const { 
        state, 
        createPlaylist, 
        updatePlaylist, 
        deletePlaylist,
        startPlaylist,
        stopPlaylist,
        nextInPlaylist,
        previousInPlaylist
    } = useScoreboard();
    
    const { rounds } = state || {};
    const templates = rounds?.templates || [];
    const playlists = rounds?.playlists || [];
    const activePlaylist = rounds?.activePlaylist;

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingPlaylist, setEditingPlaylist] = useState<string | null>(null);
    const [formData, setFormData] = useState<PlaylistFormData>({
        name: '',
        description: '',
        selectedTemplates: []
    });

    const handleCreatePlaylist = () => {
        createPlaylist({
            name: formData.name,
            description: formData.description,
            rounds: formData.selectedTemplates
        });
        setShowCreateModal(false);
        setFormData({ name: '', description: '', selectedTemplates: [] });
    };


    return (
        <Stack gap="md">
            <Group justify="space-between">
                <Title order={4}>{t('rounds.playlists.title', 'Match Playlists')}</Title>
                <Button 
                    leftSection={"➕"}
                    onClick={() => setShowCreateModal(true)}
                >
                    {t('rounds.playlists.create', 'Create Playlist')}
                </Button>
            </Group>

            <Stack>
                {playlists.map((playlist) => (
                    <Paper key={playlist.id} shadow="xs" p="md">
                        <Stack gap="sm">
                            <Group justify="space-between">
<Stack gap={4}>
                                    <Text fw={500} size="lg">{playlist.name}</Text>
                                    {playlist.description && (
                                        <Text size="sm" c="dimmed">{playlist.description}</Text>
                                    )}
                                </Stack>
                                <Group>
                                    {activePlaylist?.id === playlist.id ? (
                                        <>
                                            <ActionIcon onClick={() => previousInPlaylist()}>
                                                ⬅️
                                            </ActionIcon>
                                            <ActionIcon color="red" onClick={() => stopPlaylist()}>
                                                ⏹️
                                            </ActionIcon>
                                            <ActionIcon onClick={() => nextInPlaylist()}>
                                                ➡️
                                            </ActionIcon>
                                        </>
                                    ) : (
                                        <ActionIcon 
                                            color="blue" 
                                            variant="filled"
                                            onClick={() => startPlaylist(playlist.id)}
                                        >
                                            ▶️
                                        </ActionIcon>
                                    )}
                                    <Menu>
                                        <Menu.Target>
                                            <ActionIcon>
                                                ⋮
                                            </ActionIcon>
                                        </Menu.Target>
                                        <Menu.Dropdown>
<Menu.Item 
                                                leftSection={"✏️"}
                                                onClick={() => setEditingPlaylist(playlist.id)}
                                            >
                                                {t('rounds.playlists.edit', 'Edit')}
                                            </Menu.Item>
<Menu.Item 
                                                leftSection={"🗑️"}
                                                color="red"
                                                onClick={() => deletePlaylist(playlist.id)}
                                            >
                                                {t('rounds.playlists.delete', 'Delete')}
                                            </Menu.Item>
                                        </Menu.Dropdown>
                                    </Menu>
                                </Group>
                            </Group>

                            <Stack gap={8}>
                                {playlist.rounds.map((template, index) => (
                                    <Paper
                                        key={template.id}
                                        withBorder
                                        p="xs"
                                    >
                                        <Group justify="space-between">
                                            <Group>
                                                <Text>
                                                    {index + 1}. {template.name}
                                                </Text>
                                                <Badge>{template.config.type}</Badge>
                                            </Group>
                                            <Group gap={4}>
                                                {index > 0 && (
                                                    <ActionIcon 
                                                        size="sm"
                                                        onClick={() => {
                                                            const newRounds = [...playlist.rounds];
                                                            [newRounds[index - 1], newRounds[index]] = [newRounds[index], newRounds[index - 1]];
                                                            updatePlaylist(playlist.id, { rounds: newRounds });
                                                        }}
                                                    >
                                                        ⬆️
                                                    </ActionIcon>
                                                )}
                                                {index < playlist.rounds.length - 1 && (
                                                    <ActionIcon 
                                                        size="sm"
                                                        onClick={() => {
                                                            const newRounds = [...playlist.rounds];
                                                            [newRounds[index], newRounds[index + 1]] = [newRounds[index + 1], newRounds[index]];
                                                            updatePlaylist(playlist.id, { rounds: newRounds });
                                                        }}
                                                    >
                                                        ⬇️
                                                    </ActionIcon>
                                                )}
                                            </Group>
                                        </Group>
                                    </Paper>
                                ))}
                            </Stack>
                        </Stack>
                    </Paper>
                ))}
            </Stack>

            {/* Create/Edit Modal */}
            <Modal
                opened={showCreateModal || editingPlaylist !== null}
                onClose={() => {
                    setShowCreateModal(false);
                    setEditingPlaylist(null);
                    setFormData({ name: '', description: '', selectedTemplates: [] });
                }}
                title={editingPlaylist 
                    ? t('rounds.playlists.editTitle', 'Edit Playlist')
                    : t('rounds.playlists.createTitle', 'Create New Playlist')
                }
            >
                <Stack>
                    <TextInput
                        label={t('rounds.playlists.nameLabel', 'Playlist Name')}
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                    />
                    <Textarea
                        label={t('rounds.playlists.descriptionLabel', 'Description')}
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                    <Select
                        label={t('rounds.playlists.templatesLabel', 'Add Templates')}
                        placeholder={t('rounds.playlists.selectTemplate', 'Select a template')}
                        data={templates.map(t => ({ value: t.id, label: t.name }))}
                        value={null}
                        onChange={(value) => {
                            if (value) {
                                setFormData(prev => ({
                                    ...prev,
                                    selectedTemplates: [...prev.selectedTemplates, value]
                                }));
                            }
                        }}
                    />
                    <ScrollArea h={200}>
                        <Stack gap={8}>
                            {formData.selectedTemplates.map((templateId, index) => {
                                const template = templates.find(t => t.id === templateId);
                                if (!template) return null;
                                
                                return (
                                    <Group key={templateId} justify="space-between">
                                        <Group>
                                            <Text>{index + 1}. {template.name}</Text>
                                            <Badge>{template.config.type}</Badge>
                                        </Group>
                                        <ActionIcon 
                                            color="red" 
                                            onClick={() => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    selectedTemplates: prev.selectedTemplates.filter(id => id !== templateId)
                                                }));
                                            }}
                                        >
                                            🗑️
                                        </ActionIcon>
                                    </Group>
                                );
                            })}
                        </Stack>
                    </ScrollArea>
                    <Group justify="flex-end" mt="md">
                        <Button variant="subtle" onClick={() => {
                            setShowCreateModal(false);
                            setEditingPlaylist(null);
                            setFormData({ name: '', description: '', selectedTemplates: [] });
                        }}>
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button 
                            onClick={handleCreatePlaylist}
                            disabled={!formData.name || formData.selectedTemplates.length === 0}
                        >
                            {editingPlaylist 
                                ? t('common.save', 'Save')
                                : t('rounds.playlists.create', 'Create Playlist')
                            }
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
};

export default PlaylistManager;

