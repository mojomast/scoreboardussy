import React from 'react';
import { useAccessibility } from './AccessibilityProvider';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Button,
  Paper,
  Title,
  Text,
  Switch,
  Group,
  Stack,
  Divider,
  Box
} from '@mantine/core';
import {
  IconEye,
  IconEyeOff,
  IconContrast,
  IconKeyboard,
  IconVolume,
  IconVolumeOff,
  IconFocus,
  IconAccessible,
  IconCheck
} from '@tabler/icons-react';

interface AccessibilitySettingsProps {
  onClose?: () => void;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({ onClose }) => {
  const {
    enableKeyboardNavigation,
    toggleKeyboardNavigation,
    highContrastMode,
    toggleHighContrastMode,
    showFocusIndicators,
    toggleFocusIndicators,
    announceToScreenReader
  } = useAccessibility();

  const { actualTheme } = useTheme();

  const handleTestAnnouncement = () => {
    announceToScreenReader('This is a test announcement for screen readers', 'assertive');
  };

  const handleResetToDefaults = () => {
    // Reset all accessibility settings to defaults
    if (!enableKeyboardNavigation) toggleKeyboardNavigation();
    if (highContrastMode) toggleHighContrastMode();
    if (!showFocusIndicators) toggleFocusIndicators();

    announceToScreenReader('Accessibility settings reset to defaults', 'assertive');
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
    <Box style={{ maxWidth: '500px', margin: '0 auto', padding: '1rem' }}>
      <Paper
        shadow="md"
        p="xl"
        style={{
          backgroundColor: themeColors.surface,
          border: `1px solid ${themeColors.border}`,
          borderRadius: '12px'
        }}
      >
        <Group justify="space-between" align="center" mb="lg">
          <Group align="center" gap="sm">
            <IconAccessible size={24} style={{ color: themeColors.primary }} />
            <Title order={2} style={{ color: themeColors.text, margin: 0 }}>
              Accessibility Settings
            </Title>
          </Group>
          {onClose && (
            <Button
              variant="subtle"
              size="sm"
              onClick={onClose}
              aria-label="Close accessibility settings"
            >
              ✕
            </Button>
          )}
        </Group>

        <Stack gap="lg">
          {/* High Contrast Mode */}
          <Box>
            <Group justify="space-between" align="center" mb="xs">
              <Group align="center" gap="sm">
                <IconContrast size={18} style={{ color: themeColors.primary }} />
                <Text fw={500} style={{ color: themeColors.text }}>
                  High Contrast Mode
                </Text>
              </Group>
              <Switch
                checked={highContrastMode}
                onChange={toggleHighContrastMode}
                aria-label="Toggle high contrast mode"
                size="md"
              />
            </Group>
            <Text size="sm" style={{ color: themeColors.textSecondary }}>
              Increases contrast between text and background for better readability
            </Text>
          </Box>

          <Divider style={{ borderColor: themeColors.border }} />

          {/* Focus Indicators */}
          <Box>
            <Group justify="space-between" align="center" mb="xs">
              <Group align="center" gap="sm">
                <IconFocus size={18} style={{ color: themeColors.primary }} />
                <Text fw={500} style={{ color: themeColors.text }}>
                  Focus Indicators
                </Text>
              </Group>
              <Switch
                checked={showFocusIndicators}
                onChange={toggleFocusIndicators}
                aria-label="Toggle focus indicators"
                size="md"
              />
            </Group>
            <Text size="sm" style={{ color: themeColors.textSecondary }}>
              Shows visible focus rings around interactive elements when navigating with keyboard
            </Text>
          </Box>

          <Divider style={{ borderColor: themeColors.border }} />

          {/* Keyboard Navigation */}
          <Box>
            <Group justify="space-between" align="center" mb="xs">
              <Group align="center" gap="sm">
                <IconKeyboard size={18} style={{ color: themeColors.primary }} />
                <Text fw={500} style={{ color: themeColors.text }}>
                  Enhanced Keyboard Navigation
                </Text>
              </Group>
              <Switch
                checked={enableKeyboardNavigation}
                onChange={toggleKeyboardNavigation}
                aria-label="Toggle enhanced keyboard navigation"
                size="md"
              />
            </Group>
            <Text size="sm" style={{ color: themeColors.textSecondary }}>
              Enables advanced keyboard shortcuts and navigation features
            </Text>
          </Box>

          <Divider style={{ borderColor: themeColors.border }} />

          {/* Screen Reader Test */}
          <Box>
            <Text fw={500} mb="xs" style={{ color: themeColors.text }}>
              Screen Reader Test
            </Text>
            <Text size="sm" mb="md" style={{ color: themeColors.textSecondary }}>
              Test if screen reader announcements are working
            </Text>
            <Button
              variant="light"
              onClick={handleTestAnnouncement}
              leftSection={<IconVolume size={16} />}
              size="sm"
              style={{
                backgroundColor: themeColors.primary + '20',
                color: themeColors.primary
              }}
            >
              Test Announcement
            </Button>
          </Box>

          <Divider style={{ borderColor: themeColors.border }} />

          {/* Action Buttons */}
          <Group justify="space-between" mt="lg">
            <Button
              variant="outline"
              onClick={handleResetToDefaults}
              size="sm"
              style={{
                borderColor: themeColors.border,
                color: themeColors.text
              }}
            >
              Reset to Defaults
            </Button>

            <Group gap="xs">
              <Button
                variant="subtle"
                size="sm"
                onClick={onClose}
                style={{ color: themeColors.textSecondary }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={onClose}
                leftSection={<IconCheck size={16} />}
                style={{
                  backgroundColor: themeColors.primary,
                  color: 'white'
                }}
              >
                Apply Settings
              </Button>
            </Group>
          </Group>
        </Stack>
      </Paper>
    </Box>
  );
};

export default AccessibilitySettings;