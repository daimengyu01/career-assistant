import React, { useState, useEffect } from 'react';
import { Container, Title, Text, Stack, Button, Group, TextInput, NumberInput, Card, Alert, Table, ActionIcon, Tooltip, Grid, Badge } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconSettings, IconPlayerPlay, IconPlayerStop, IconTrash } from '@tabler/icons-react';

const CrawlerConfig: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crawlers, setCrawlers] = useState<Array<{ id: string; name: string; status: 'running' | 'stopped'; lastRun?: string }>>([]);

  const [form, setForm] = useState({
    crawlerName: '',
    targetUrl: '',
    schedule: '0 2 * * *',
    maxPages: 100,
    concurrentRequests: 5,
    useProxy: false,
    proxyUrl: '',
    userAgent: 'CareerAssistant-Crawler/1.0',
  });

  useEffect(() => {
    loadCrawlers();
  }, []);

  const loadCrawlers = async () => {
    try {
      if (window.electronAPI?.getDataSources) {
        const data = await window.electronAPI.getDataSources();
        const sources = data as Array<{ id: string; name: string; type: string }>;
        setCrawlers(
          sources.map((s) => ({
            id: s.id,
            name: s.name,
            status: 'stopped' as const,
          }))
        );
      }
    } catch (err) {
      setError('加载爬虫列表失败');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const crawlerConfig = {
        id: Date.now().toString(),
        name: form.crawlerName,
        type: 'script',
        config: {
          targetUrl: form.targetUrl,
          schedule: form.schedule,
          maxPages: form.maxPages,
          concurrentRequests: form.concurrentRequests,
          useProxy: form.useProxy,
          proxyUrl: form.proxyUrl,
          userAgent: form.userAgent,
        },
        createdAt: new Date().toISOString(),
      };

      if (window.electronAPI?.saveDataSource) {
        await window.electronAPI.saveDataSource(crawlerConfig);
      }

      setCrawlers((prev) => [...prev, { id: crawlerConfig.id, name: crawlerConfig.name, status: 'stopped' }]);
      setForm({
        crawlerName: '',
        targetUrl: '',
        schedule: '0 2 * * *',
        maxPages: 100,
        concurrentRequests: 5,
        useProxy: false,
        proxyUrl: '',
        userAgent: 'CareerAssistant-Crawler/1.0',
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('保存爬虫配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRun = (id: string) => {
    setCrawlers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'running' as const, lastRun: new Date().toLocaleString('zh-CN') } : c))
    );
  };

  const handleStop = (id: string) => {
    setCrawlers((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'stopped' as const } : c)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个爬虫配置吗？')) return;
    setCrawlers((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <Container size="md" py="xl">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} mb="xs">
            爬虫配置
          </Title>
          <Text c="dimmed">
            配置数据采集爬虫，自动抓取企业信息
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
        <Alert color="green" mb="lg" title="成功" icon={<IconPlayerPlay size={16} />}>
          爬虫配置已保存
        </Alert>
      )}

      <Card withBorder shadow="sm" radius="md" padding="lg" mb="lg">
        <Title order={4} mb="md">爬虫列表</Title>
        {crawlers.length === 0 ? (
          <Stack align="center" gap="md" py="xl">
            <IconSettings size={48} color="gray" />
            <Text c="dimmed">暂无爬虫配置</Text>
            <Button onClick={() => navigate('/settings/data-source')}>创建第一个</Button>
          </Stack>
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>名称</Table.Th>
                <Table.Th>状态</Table.Th>
                <Table.Th>上次运行</Table.Th>
                <Table.Th>操作</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {crawlers.map((crawler) => (
                <Table.Tr key={crawler.id}>
                  <Table.Td>{crawler.name}</Table.Td>
                  <Table.Td>
                    <Badge color={crawler.status === 'running' ? 'green' : 'gray'} variant="light">
                      {crawler.status === 'running' ? '运行中' : '已停止'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{crawler.lastRun || '-'}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {crawler.status === 'stopped' ? (
                        <Tooltip label="运行">
                          <ActionIcon variant="light" color="green" onClick={() => handleRun(crawler.id)}>
                            <IconPlayerPlay size={16} />
                          </ActionIcon>
                        </Tooltip>
                      ) : (
                        <Tooltip label="停止">
                          <ActionIcon variant="light" color="red" onClick={() => handleStop(crawler.id)}>
                            <IconPlayerStop size={16} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                      <Tooltip label="删除">
                        <ActionIcon variant="light" color="red" onClick={() => handleDelete(crawler.id)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      <form onSubmit={handleSave}>
        <Card withBorder shadow="sm" radius="md" padding="lg">
          <Title order={4} mb="md">新建爬虫</Title>

          <Stack gap="md">
            <TextInput
              label="爬虫名称"
              placeholder="例如：BOSS直聘职位采集"
              value={form.crawlerName}
              onChange={(e) => setForm({ ...form, crawlerName: e.currentTarget.value })}
              required
            />

            <TextInput
              label="目标 URL"
              placeholder="https://www.zhipin.com"
              value={form.targetUrl}
              onChange={(e) => setForm({ ...form, targetUrl: e.currentTarget.value })}
              required
            />

            <TextInput
              label="定时表达式 (Cron)"
              placeholder="0 2 * * *"
              description="每天凌晨 2 点执行"
              value={form.schedule}
              onChange={(e) => setForm({ ...form, schedule: e.currentTarget.value })}
            />

            <Grid>
              <Grid.Col span={6}>
                <NumberInput
                  label="最大页面数"
                  min={1}
                  max={1000}
                  value={form.maxPages}
                  onChange={(val) => setForm({ ...form, maxPages: Number(val) || 100 })}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  label="并发请求数"
                  min={1}
                  max={20}
                  value={form.concurrentRequests}
                  onChange={(val) => setForm({ ...form, concurrentRequests: Number(val) || 5 })}
                />
              </Grid.Col>
            </Grid>

            <Group justify="flex-end">
              <Button type="submit" loading={loading}>
                保存配置
              </Button>
            </Group>
          </Stack>
        </Card>
      </form>
    </Container>
  );
};

export default CrawlerConfig;
