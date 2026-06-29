import React, { useState, useEffect } from 'react';
import { Container, Title, Text, Stack, Button, Group, PasswordInput, Card, Alert, Select } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconRobot, IconCheck, IconX } from '@tabler/icons-react';
import { useSettingsStore } from '../../stores/useSettingsStore';

const aiProviders = [
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'zhipu', label: '智谱 AI' },
  { value: 'baidu', label: '百度文心一言' },
  { value: 'aliyun', label: '阿里通义千问' },
];

const models: Record<string, string[]> = {
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229'],
  zhipu: ['glm-4', 'glm-4-flash'],
  baidu: ['ernie-4.0', 'ernie-3.5-turbo'],
  aliyun: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
};

const ApiKeySettings: React.FC = () => {
  const navigate = useNavigate();
  const { apiKeys, aiProvider, aiModel, setApiKeys, setAiProvider, setAiModel } = useSettingsStore();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [provider, setProvider] = useState(aiProvider);
  const [model, setModel] = useState(aiModel);
  const [keys, setKeys] = useState({
    deepseek: apiKeys['deepseek'] || '',
    openai: apiKeys['openai'] || '',
    anthropic: apiKeys['anthropic'] || '',
    zhipu: apiKeys['zhipu'] || '',
    baidu: apiKeys['baidu'] || '',
    aliyun: apiKeys['aliyun'] || '',
  });

  const currentModels = models[provider] || [];

  useEffect(() => {
    if (currentModels.length > 0 && !currentModels.includes(model)) {
      setModel(currentModels[0]);
    }
  }, [provider, currentModels, model]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      setApiKeys(keys);
      setAiProvider(provider);
      setAiModel(model);

      if (window.electronAPI?.saveSettings) {
        await window.electronAPI.saveSettings({
          apiKeys: keys,
          aiProvider: provider,
          aiModel: model,
        });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('保存设置失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="md" py="xl">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} mb="xs">
            AI 配置
          </Title>
          <Text c="dimmed">
            配置 AI 服务提供商和模型，用于智能分析和推荐
          </Text>
        </div>
        <Button variant="default" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate('/settings')}>
          返回设置
        </Button>
      </Group>

      {error && (
        <Alert color="red" mb="lg" title="错误">
          {error}
        </Alert>
      )}

      {saved && (
        <Alert color="green" mb="lg" title="成功" icon={<IconCheck size={16} />}>
          设置已保存
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack gap="lg">
          <Card withBorder shadow="sm" radius="md" padding="lg">
            <Group gap="md" mb="md">
              <IconRobot size={28} color="blue" />
              <div>
                <Title order={4}>AI 模型配置</Title>
                <Text size="sm" c="dimmed">
                  选择 AI 提供商和模型
                </Text>
              </div>
            </Group>

            <Group grow>
              <Select
                label="AI 提供商"
                placeholder="请选择提供商"
                data={aiProviders}
                value={provider}
                onChange={(val) => val && setProvider(val)}
              />
              <Select
                label="模型"
                placeholder="请选择模型"
                data={currentModels.map((m) => ({ value: m, label: m }))}
                value={model}
                onChange={(val) => val && setModel(val)}
              />
            </Group>
          </Card>

          <Card withBorder shadow="sm" radius="md" padding="lg">
            <Group gap="md" mb="md">
              <IconRobot size={28} color="orange" />
              <div>
                <Title order={4}>API Keys</Title>
                <Text size="sm" c="dimmed">
                  配置各 AI 提供商的 API 密钥
                </Text>
              </div>
            </Group>

            <Stack gap="md">
              {Object.entries(keys).map(([key, value]) => {
                const providerInfo = aiProviders.find((p) => p.value === key);
                if (!providerInfo) return null;

                return (
                  <PasswordInput
                    key={key}
                    label={providerInfo.label}
                    placeholder={`请输入 ${providerInfo.label} API Key`}
                    value={value}
                    onChange={(e) => setKeys((prev) => ({ ...prev, [key]: e.currentTarget.value }))}
                    visibilityToggleIcon={({ reveal }) =>
                      reveal ? <IconX size={16} /> : <IconRobot size={16} />
                    }
                  />
                );
              })}
            </Stack>
          </Card>

          <Group justify="flex-end">
            <Button variant="default" onClick={() => navigate('/settings')}>
              取消
            </Button>
            <Button type="submit" loading={loading}>
              保存设置
            </Button>
          </Group>
        </Stack>
      </form>
    </Container>
  );
};

export default ApiKeySettings;
