import React, { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Stack,
  Button,
  Group,
  TextInput,
  NumberInput,
  Card,
  Alert,
  Badge,
  Grid,
  Divider,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import {
  IconArrowLeft,
  IconPlayerPlay,
  IconPlayerStop,
  IconBug,
  IconCheck,
} from '@tabler/icons-react';

interface CrawlerForm {
  name: string;
  targetUrl: string;
  maxPages: number;
  cardSelector: string;
  requestInterval: number;
  userAgent: string;
}

const DEFAULT_FORM: CrawlerForm = {
  name: '',
  targetUrl: '',
  maxPages: 5,
  cardSelector: '',
  requestInterval: 1500,
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

const PRESETS: Record<string, { label: string; form: Partial<CrawlerForm> }> = {
  boss: {
    label: 'Boss直聘',
    form: {
      name: 'Boss直聘',
      targetUrl: 'https://www.zhipin.com/web/geek/job?query=前端&city=101010100',
      cardSelector: '.job-card-wrapper',
    },
  },
  lagou: {
    label: '拉勾',
    form: {
      name: '拉勾',
      targetUrl: 'https://www.lagou.com/wn/zhaopin?city=%E5%85%A8%E5%9B%BD&pn=1',
      cardSelector: '.item__10RTO',
    },
  },
  zhilian: {
    label: '智联',
    form: {
      name: '智联',
      targetUrl: 'https://sou.zhaopin.com/?jl=530&kw=前端&p=1',
      cardSelector: '.joblist-box__item',
    },
  },
};

const CrawlerConfig: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<CrawlerForm>(DEFAULT_FORM);
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [resultCount, setResultCount] = useState<number>(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const applyPreset = (key: string) => {
    const preset = PRESETS[key];
    if (!preset) return;
    setForm((prev) => ({ ...prev, ...preset.form }));
    setError(null);
    setSuccess(null);
  };

  const handleRun = async () => {
    if (!form.targetUrl || !form.cardSelector) {
      setError('请填写目标 URL 和职位卡片 CSS 选择器');
      return;
    }
    setError(null);
    setSuccess(null);
    setRunning(true);
    setStatus('running');
    setResultCount(0);

    try {
      const config = {
        name: form.name,
        targetUrl: form.targetUrl,
        maxPages: form.maxPages,
        cardSelector: form.cardSelector,
        requestInterval: form.requestInterval,
        userAgent: form.userAgent,
      };
      const result = await window.electronAPI?.runCrawler?.(config);
      const count = Number(result?.count) || 0;
      setResultCount(count);
      setStatus('done');
      setSuccess(`爬虫运行完成，共抓取 ${count} 条结果。`);
    } catch (err) {
      setStatus('idle');
      setError('爬虫运行失败：' + (err as Error).message);
    } finally {
      setRunning(false);
    }
  };

  const handleStop = () => {
    setStatus('idle');
    setRunning(false);
    setSuccess('已停止爬虫。');
  };

  const statusBadge = () => {
    switch (status) {
      case 'running':
        return <Badge color="green" variant="light" size="lg">运行中</Badge>;
      case 'done':
        return <Badge color="blue" variant="light" size="lg">已完成</Badge>;
      default:
        return <Badge color="gray" variant="light" size="lg">空闲</Badge>;
    }
  };

  return (
    <Container size="md" py="xl">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} mb="xs">
            爬虫配置
          </Title>
          <Text c="dimmed">配置数据采集爬虫，自动抓取企业信息与职位</Text>
        </div>
        <Button variant="default" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate('/settings')}>
          返回设置
        </Button>
      </Group>

      {error && (
        <Alert color="red" mb="lg" title="错误" icon={<IconBug size={16} />}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert color="green" mb="lg" title="成功" icon={<IconCheck size={16} />}>
          {success}
        </Alert>
      )}

      {/* 预置模板 */}
      <Card withBorder shadow="sm" radius="md" padding="lg" mb="lg">
        <Group gap="md" mb="md">
          <IconBug size={24} color="orange" />
          <div>
            <Title order={4}>预置模板</Title>
            <Text size="sm" c="dimmed">
              选择模板自动填充目标 URL 和 CSS 选择器
            </Text>
          </div>
        </Group>
        <Group gap="xs">
          {Object.entries(PRESETS).map(([key, preset]) => (
            <Button key={key} variant="light" onClick={() => applyPreset(key)}>
              {preset.label}
            </Button>
          ))}
        </Group>
      </Card>

      {/* 配置表单 */}
      <Card withBorder shadow="sm" radius="md" padding="lg" mb="lg">
        <Stack gap="md">
          <TextInput
            label="爬虫名称"
            placeholder="例如：Boss直聘职位采集"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
          />

          <TextInput
            label="目标 URL"
            placeholder="https://www.zhipin.com"
            value={form.targetUrl}
            onChange={(e) => setForm({ ...form, targetUrl: e.currentTarget.value })}
            required
          />

          <TextInput
            label="职位卡片 CSS 选择器"
            placeholder="例如：.job-card-wrapper"
            description="用于定位页面中单个职位卡片的 CSS 选择器"
            value={form.cardSelector}
            onChange={(e) => setForm({ ...form, cardSelector: e.currentTarget.value })}
            required
          />

          <Grid>
            <Grid.Col span={6}>
              <NumberInput
                label="最大页数"
                min={1}
                max={1000}
                value={form.maxPages}
                onChange={(val) => setForm({ ...form, maxPages: Number(val) || 1 })}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                label="请求间隔 (ms)"
                min={0}
                max={60000}
                step={100}
                value={form.requestInterval}
                onChange={(val) => setForm({ ...form, requestInterval: Number(val) || 0 })}
              />
            </Grid.Col>
          </Grid>

          <TextInput
            label="User-Agent"
            placeholder="Mozilla/5.0 ..."
            value={form.userAgent}
            onChange={(e) => setForm({ ...form, userAgent: e.currentTarget.value })}
          />
        </Stack>
      </Card>

      {/* 运行状态与控制 */}
      <Card withBorder shadow="sm" radius="md" padding="lg">
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Group gap="md">
              <div>
                <Text size="sm" c="dimmed">
                  运行状态
                </Text>
                <Group gap="sm" mt={4}>
                  {statusBadge()}
                  {status === 'done' && (
                    <Text size="sm" fw={500}>
                      结果数量：{resultCount}
                    </Text>
                  )}
                </Group>
              </div>
            </Group>
            <Group>
              {status === 'running' ? (
                <Button color="red" leftSection={<IconPlayerStop size={16} />} onClick={handleStop}>
                  停止
                </Button>
              ) : (
                <Button leftSection={<IconPlayerPlay size={16} />} loading={running} onClick={handleRun}>
                  运行爬虫
                </Button>
              )}
            </Group>
          </Group>

          <Divider />

          <Alert color="blue" variant="light" title="使用说明">
            <Text size="sm">
              填写目标 URL 与职位卡片 CSS 选择器后点击“运行爬虫”。运行过程中可随时点击“停止”将状态重置为空闲。运行完成后会显示抓取到的结果数量。
            </Text>
          </Alert>
        </Stack>
      </Card>
    </Container>
  );
};

export default CrawlerConfig;
