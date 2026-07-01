import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Stack,
  Button,
  Group,
  PasswordInput,
  Card,
  Alert,
  TextInput,
  Select,
  Switch,
  Divider,
  LoadingOverlay,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconRobot, IconCheck, IconPlus, IconTrash, IconBolt } from '@tabler/icons-react';

interface AiProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

interface ProviderTemplate {
  name: string;
  baseUrl: string;
  model: string;
}

const PROVIDER_TEMPLATES: ProviderTemplate[] = [
  { name: 'DeepSeek', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
  { name: 'OpenAI', baseUrl: 'https://api.openai.com', model: 'gpt-4o' },
  { name: '智谱AI', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4' },
  { name: '通义千问', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode', model: 'qwen-plus' },
];

const genId = () => `prov-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const ApiKeySettings: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [activeProviderId, setActiveProviderId] = useState<string>('');

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; msg: string }>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const settings = (await window.electronAPI?.getSettings?.()) as {
        aiProviders?: AiProvider[];
        activeProviderId?: string;
      } | undefined;

      if (settings?.aiProviders && settings.aiProviders.length > 0) {
        setProviders(settings.aiProviders);
        setActiveProviderId(settings.activeProviderId || settings.aiProviders[0].id);
      } else {
        const initial: AiProvider = {
          id: genId(),
          name: 'DeepSeek',
          baseUrl: 'https://api.deepseek.com',
          apiKey: '',
          model: 'deepseek-chat',
        };
        setProviders([initial]);
        setActiveProviderId(initial.id);
      }
    } catch (err) {
      setError('加载配置失败：' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const addProvider = (template?: ProviderTemplate) => {
    const t = template || PROVIDER_TEMPLATES[0];
    const p: AiProvider = { id: genId(), name: t.name, baseUrl: t.baseUrl, apiKey: '', model: t.model };
    setProviders((prev) => [...prev, p]);
    if (!activeProviderId) setActiveProviderId(p.id);
  };

  const updateProvider = (id: string, patch: Partial<AiProvider>) => {
    setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const removeProvider = (id: string) => {
    setProviders((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (activeProviderId === id) {
        setActiveProviderId(next[0]?.id || '');
      }
      return next;
    });
  };

  const handleTest = async (provider: AiProvider) => {
    setTestingId(provider.id);
    setError(null);
    try {
      const res = await window.electronAPI?.verifyAIProvider?.(provider);
      if (res?.success) {
        setTestResults((prev) => ({ ...prev, [provider.id]: { ok: true, msg: `连接成功：${res.content}` } }));
      } else {
        setTestResults((prev) => ({ ...prev, [provider.id]: { ok: false, msg: '连接失败，请检查配置' } }));
      }
    } catch (err) {
      setTestResults((prev) => ({ ...prev, [provider.id]: { ok: false, msg: '连接失败：' + (err as Error).message } }));
    } finally {
      setTestingId(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const payload = { aiProviders: providers, activeProviderId };
      if (window.electronAPI?.saveSettings) {
        await window.electronAPI.saveSettings(payload);
      }
      if (window.electronAPI?.saveAIProviders) {
        await window.electronAPI.saveAIProviders(providers, activeProviderId);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('保存设置失败：' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container size="md" py="xl" pos="relative">
      <LoadingOverlay visible={loading} />
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} mb="xs">
            AI 配置
          </Title>
          <Text c="dimmed">配置 AI 服务提供商和模型，用于智能分析和推荐</Text>
        </div>
        <Button variant="default" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate(-1)}>
          返回
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

      {/* 活跃提供商 + 快速添加 */}
      <Card withBorder shadow="sm" radius="md" padding="lg" mb="lg">
        <Group gap="md" mb="md">
          <IconRobot size={24} color="blue" />
          <div>
            <Title order={4}>当前活跃提供商</Title>
            <Text size="sm" c="dimmed">
              选择默认使用的 AI 提供商，或快速添加预置模板
            </Text>
          </div>
        </Group>

        <Stack gap="md">
          <Select
            label="活跃提供商"
            placeholder="请选择活跃提供商"
            data={providers.map((p) => ({ value: p.id, label: `${p.name} · ${p.model}` }))}
            value={activeProviderId || undefined}
            onChange={(val) => val && setActiveProviderId(val)}
          />

          <Divider label="快速添加预置模板" labelPosition="center" />

          <Group gap="xs">
            {PROVIDER_TEMPLATES.map((t) => (
              <Button
                key={t.name}
                variant="light"
                leftSection={<IconPlus size={14} />}
                onClick={() => addProvider(t)}
              >
                {t.name}
              </Button>
            ))}
            <Button variant="outline" leftSection={<IconPlus size={14} />} onClick={() => addProvider()}>
              自定义
            </Button>
          </Group>
        </Stack>
      </Card>

      {/* Provider 列表 */}
      <Stack gap="md">
        {providers.length === 0 && (
          <Alert color="yellow" title="暂无提供商">
            点击上方按钮添加一个 AI 提供商配置。
          </Alert>
        )}

        {providers.map((p, index) => {
          const result = testResults[p.id];
          return (
            <Card key={p.id} withBorder shadow="sm" radius="md" padding="lg">
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Group gap="sm" align="center">
                    <Switch
                      checked={activeProviderId === p.id}
                      onChange={(e) => e.currentTarget.checked && setActiveProviderId(p.id)}
                      label={activeProviderId === p.id ? '活跃中' : '设为活跃'}
                    />
                    <BadgeStatic label={`#${index + 1}`} />
                  </Group>
                  <Button
                    variant="subtle"
                    color="red"
                    size="xs"
                    leftSection={<IconTrash size={14} />}
                    onClick={() => removeProvider(p.id)}
                  >
                    删除
                  </Button>
                </Group>

                <TextInput
                  label="名称"
                  placeholder="例如：DeepSeek"
                  value={p.name}
                  onChange={(e) => updateProvider(p.id, { name: e.currentTarget.value })}
                />

                <TextInput
                  label="Base URL"
                  placeholder="https://api.example.com"
                  value={p.baseUrl}
                  onChange={(e) => updateProvider(p.id, { baseUrl: e.currentTarget.value })}
                />

                <PasswordInput
                  label="API Key"
                  placeholder="请输入 API Key"
                  value={p.apiKey}
                  onChange={(e) => updateProvider(p.id, { apiKey: e.currentTarget.value })}
                />

                <TextInput
                  label="模型"
                  placeholder="例如：deepseek-chat"
                  value={p.model}
                  onChange={(e) => updateProvider(p.id, { model: e.currentTarget.value })}
                />

                <Group justify="flex-end">
                  <Button
                    variant="light"
                    leftSection={<IconBolt size={14} />}
                    loading={testingId === p.id}
                    onClick={() => handleTest(p)}
                  >
                    测试连接
                  </Button>
                </Group>

                {result && (
                  <Alert color={result.ok ? 'green' : 'red'} icon={<IconCheck size={16} />} title={result.ok ? '成功' : '失败'}>
                    {result.msg}
                  </Alert>
                )}
              </Stack>
            </Card>
          );
        })}
      </Stack>

      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={() => navigate(-1)}>
          取消
        </Button>
        <Button onClick={handleSave} loading={saving}>
          保存设置
        </Button>
      </Group>
    </Container>
  );
};

// 简单的内联 Badge 包装，避免额外 import 冲突
const BadgeStatic: React.FC<{ label: string }> = ({ label }) => (
  <Text size="xs" c="dimmed">
    {label}
  </Text>
);

export default ApiKeySettings;
