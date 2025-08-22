import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Button, Menu, Text } from '@mantine/core';
import {
  IconSun,
  IconMoon,
  IconDeviceDesktop,
  IconChevronDown
} from '@tabler/icons-react';

export const ThemeToggle: React.FC = () => {
  const { theme, actualTheme, setTheme } = useTheme();

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <IconSun size={16} />;
      case 'dark':
        return <IconMoon size={16} />;
      case 'system':
        return <IconDeviceDesktop size={16} />;
      default:
        return <IconDeviceDesktop size={16} />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'System';
    }
  };

  return (
    <Menu shadow="md" width={120} position="bottom-end">
      <Menu.Target>
        <Button
          variant="subtle"
          size="sm"
          rightSection={<IconChevronDown size={14} />}
          leftSection={getThemeIcon()}
        >
          {getThemeLabel()}
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Theme</Menu.Label>
        <Menu.Item
          leftSection={<IconSun size={14} />}
          onClick={() => setTheme('light')}
          disabled={theme === 'light'}
        >
          Light
        </Menu.Item>
        <Menu.Item
          leftSection={<IconMoon size={14} />}
          onClick={() => setTheme('dark')}
          disabled={theme === 'dark'}
        >
          Dark
        </Menu.Item>
        <Menu.Item
          leftSection={<IconDeviceDesktop size={14} />}
          onClick={() => setTheme('system')}
          disabled={theme === 'system'}
        >
          System
        </Menu.Item>

        <Menu.Divider />
        <Menu.Item disabled>
          <Text size="xs" c="dimmed">
            Current: {actualTheme === 'dark' ? 'Dark' : 'Light'}
          </Text>
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};

export default ThemeToggle;