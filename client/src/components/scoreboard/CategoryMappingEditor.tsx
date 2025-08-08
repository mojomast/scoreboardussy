import React, { useEffect, useState } from 'react';
import { Paper, Group, TextInput, Select, Button, Stack, Text } from '@mantine/core';

const roundTypes = [
  { value: 'shortform', label: 'Shortform' },
  { value: 'longform', label: 'Longform' },
  { value: 'musical', label: 'Musical' },
  { value: 'character', label: 'Character' },
  { value: 'narrative', label: 'Narrative' },
  { value: 'challenge', label: 'Challenge' },
  { value: 'custom', label: 'Custom' },
];

export const CategoryMappingEditor: React.FC = () => {
  const [map, setMap] = useState<Record<string, string>>({});
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('shortform');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/interop/mon-pacing/category-map')
      .then(r => r.json())
      .then(d => {
        if (d?.ok) setMap(d.map || {});
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const save = () => {
    setLoading(true);
    setSaved(false);
    setError(null);
    fetch('/api/interop/mon-pacing/category-map', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ map }),
    })
      .then(r => r.json())
      .then(d => {
        if (!d?.ok) throw new Error(d?.error || 'Save failed');
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  const add = () => {
    if (!newKey.trim()) return;
    setMap(prev => ({ ...prev, [newKey.trim()]: newVal }));
    setNewKey('');
    setNewVal('shortform');
  };

  const remove = (k: string) => {
    const copy = { ...map };
    delete copy[k];
    setMap(copy);
  };

  return (
    <Stack>
      {error && <Text c="red">{error}</Text>}
      <Group align="end">
        <TextInput label="Mon-Pacing Category" placeholder="e.g., Shortform" value={newKey} onChange={(e) => setNewKey(e.currentTarget.value)} />
        <Select label="Maps to Round Type" data={roundTypes} value={newVal} onChange={(v) => setNewVal(v || 'shortform')} />
        <Button onClick={add} disabled={loading}>Add</Button>
      </Group>
      <Stack>
        {Object.entries(map).map(([k, v]) => (
          <Paper withBorder p="xs" key={k}>
            <Group justify="space-between">
              <Text>{k} -&gt; {v}</Text>
              <Group>
                <Select data={roundTypes} value={v} onChange={(val) => setMap(prev => ({ ...prev, [k]: val || 'shortform' }))} />
                <Button color="red" variant="light" onClick={() => remove(k)}>Remove</Button>
              </Group>
            </Group>
          </Paper>
        ))}
      </Stack>
      <Group>
        <Button onClick={save} loading={loading}>Save Mapping</Button>
        {saved && <Text c="green">Saved</Text>}
      </Group>
    </Stack>
  );
};

