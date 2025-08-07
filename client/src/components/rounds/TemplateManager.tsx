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
    Tooltip,
    Modal,
    Textarea
} from '@mantine/core';
// Using emojis instead of icon library
import { useScoreboard } from '../../contexts/ScoreboardContext';
import { RoundTemplate } from '@server-types/rounds.types';

interface TemplateFormData {
    name: string;
    description: string;
    tags: string;
}

export const TemplateManager: React.FC = () => {
    const { t } = useTranslation();
    const { state, saveTemplate, deleteTemplate, startRound, updateTemplate } = useScoreboard();
    const { rounds } = state || {};
    const templates = rounds?.templates || [];

    const [searchQuery, setSearchQuery] = useState('');
    const [editingTemplate, setEditingTemplate] = useState<RoundTemplate | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [formData, setFormData] = useState<TemplateFormData>({
        name: '',
        description: '',
        tags: ''
    });

    // Filter templates based on search query
    const filteredTemplates = templates.filter(template => 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleSaveCurrentAsTemplate = () => {
        if (!rounds?.current) return;
        
        const { number, ...configWithoutNumber } = rounds.current;
        saveTemplate({
            name: formData.name,
            description: formData.description,
            config: configWithoutNumber,
            tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        });
        
        setFormData({ name: '', description: '', tags: '' });
    };

    const handleStartFromTemplate = (template: RoundTemplate) => {
        const nextRoundNumber = (rounds?.history.length || 0) + 1;
        startRound({
            ...template.config,
            number: nextRoundNumber
        });
    };

    const handleEditTemplate = (template: RoundTemplate) => {
        setEditingTemplate(template);
        setFormData({
            name: template.name,
            description: template.description || '',
            tags: template.tags?.join(', ') || ''
        });
        setShowEditModal(true);
    };

    const handleDuplicateTemplate = (template: RoundTemplate) => {
        saveTemplate({
            name: `${template.name} (Copy)`,
            description: template.description,
            config: template.config,
            tags: template.tags
        });
    };

    const handleSaveEditedTemplate = () => {
        if (!editingTemplate) return;
        
        updateTemplate(editingTemplate.id, {
            name: formData.name,
            description: formData.description,
            tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        });
        
        setShowEditModal(false);
    };

    return (
        <Stack gap="md">
            <Paper shadow="xs" p="md">
                <Title order={4} mb="md">{t('rounds.templates.saveAsTemplate', 'Save Current Round as Template')}</Title>
                {rounds?.current ? (
                    <Stack>
                        <TextInput
                            label={t('rounds.templates.nameLabel', 'Template Name')}
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            required
                        />
                        <Textarea
                            label={t('rounds.templates.descriptionLabel', 'Description')}
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
                        <TextInput
                            label={t('rounds.templates.tagsLabel', 'Tags (comma-separated)')}
                            value={formData.tags}
                            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                            placeholder="tag1, tag2, tag3"
                        />
                        <Button onClick={handleSaveCurrentAsTemplate} disabled={!formData.name}>
                            {t('rounds.templates.saveButton', 'Save as Template')}
                        </Button>
                    </Stack>
                ) : (
                    <Text c="dimmed">{t('rounds.templates.noCurrentRound', 'No active round to save')}</Text>
                )}
            </Paper>

            <Paper shadow="xs" p="md">
                <Group justify="space-between" mb="md">
                    <Title order={4}>{t('rounds.templates.savedTemplates', 'Saved Templates')}</Title>
                    <TextInput
                        placeholder={t('rounds.templates.search', 'Search templates...')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '200px' }}
                    />
                </Group>

                <Stack gap="sm">
                    {filteredTemplates.length > 0 ? (
                        filteredTemplates.map((template) => (
                            <Paper key={template.id} withBorder p="sm">
                                <Group justify="space-between">
                                    <Stack gap={4}>
                                        <Group>
                                            <Text fw={500}>{template.name}</Text>
                                            <Badge>{template.config.type}</Badge>
                                        </Group>
                                        {template.description && (
                                            <Text size="sm" c="dimmed">{template.description}</Text>
                                        )}
                                        {template.tags && template.tags.length > 0 && (
                                            <Group gap={4}>
                                                {template.tags.map((tag) => (
                                                    <Badge key={tag} size="sm" variant="dot">{tag}</Badge>
                                                ))}
                                            </Group>
                                        )}
                                    </Stack>
                                    <Group>
                                        <Tooltip label={t('rounds.templates.start', 'Start Round')}>
                                            <ActionIcon 
                                                variant="filled" 
                                                color="blue"
                                                onClick={() => handleStartFromTemplate(template)}
                                            >
                                                ▶️
                                            </ActionIcon>
                                        </Tooltip>
                                        <Menu>
                                            <Menu.Target>
                                                <ActionIcon>
                                                    ⋮
                                                </ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Item 
                                                    leftSection={"✏️"}
                                                    onClick={() => handleEditTemplate(template)}
                                                >
                                                    {t('rounds.templates.edit', 'Edit')}
                                                </Menu.Item>
                                                <Menu.Item 
                                                    leftSection={"📋"}
                                                    onClick={() => handleDuplicateTemplate(template)}
                                                >
                                                    {t('rounds.templates.duplicate', 'Duplicate')}
                                                </Menu.Item>
                                                <Menu.Item 
                                                    leftSection={"🗑️"}
                                                    color="red"
                                                    onClick={() => deleteTemplate(template.id)}
                                                >
                                                    {t('rounds.templates.delete', 'Delete')}
                                                </Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Group>
                                </Group>
                            </Paper>
                        ))
                    ) : (
                        <Text c="dimmed" ta="center">
                            {searchQuery 
                                ? t('rounds.templates.noSearchResults', 'No templates match your search')
                                : t('rounds.templates.noTemplates', 'No saved templates yet')
                            }
                        </Text>
                    )}
                </Stack>
            </Paper>

            <Modal
                opened={showEditModal}
                onClose={() => setShowEditModal(false)}
                title={t('rounds.templates.editTemplate', 'Edit Template')}
            >
                {editingTemplate && (
                    <Stack>
                        <TextInput
                            label={t('rounds.templates.nameLabel', 'Template Name')}
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            required
                        />
                        <Textarea
                            label={t('rounds.templates.descriptionLabel', 'Description')}
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
                        <TextInput
                            label={t('rounds.templates.tagsLabel', 'Tags (comma-separated)')}
                            value={formData.tags}
                            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                            placeholder="tag1, tag2, tag3"
                        />
<Group justify="flex-end">
                            <Button variant="subtle" onClick={() => setShowEditModal(false)}>
                                {t('common.cancel', 'Cancel')}
                            </Button>
                            <Button onClick={handleSaveEditedTemplate}>
                                {t('common.save', 'Save')}
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Stack>
    );
};

export default TemplateManager;
