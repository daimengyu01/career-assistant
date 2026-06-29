import { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  Stack,
  Card,
  Button,
  Tabs,
  Table,
  ActionIcon,
  Tooltip,
  Badge,
  LoadingOverlay,
  Alert,
  Select,
  TextInput,
  Paper,
  List,
  ThemeIcon,
  Switch,
  Grid,
} from '@mantine/core';
import {
  IconSearch,
  IconHeart,
  IconBuilding,
  IconExternalLink,
  IconRefresh,
  IconBrain,
  IconSparkles,
  IconDatabase,
  IconNetwork,
} from '@tabler/icons-react';

type JobItem = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  tags: string[];
  source: 'crawler' | 'manual' | 'api';
  description?: string;
  requirements?: string[];
  url?: string;
};

type FavoriteItem = {
  id: string;
  job: JobItem;
};

const sampleJobs: JobItem[] = [
  { id: 'job-1', title: '前端工程师', company: '腾讯科技', location: '深圳', salary: '20k-40k', tags: ['React', 'TypeScript', 'Electron'], source: 'api', description: '负责腾讯文档桌面端和 Web 端的前端开发。', requirements: ['熟悉 React/TypeScript', '了解 Electron'], url: 'https://career.tencent.com' },
  { id: 'job-2', title: '产品经理', company: '字节跳动', location: '北京', salary: '25k-45k', tags: ['ToB', '用户增长', '数据驱动'], source: 'api', description: '负责企业服务方向的产品规划与迭代。', requirements: ['有 ToB 产品经验', '数据敏感'], url: 'https://jobs.bytedance.com' },
  { id: 'job-3', title: '算法工程师', company: '华为技术', location: '深圳', salary: '30k-50k', tags: ['推荐算法', 'NLP', 'PyTorch'], source: 'crawler', description: '参与推荐系统与知识增强大模型相关研发。', requirements: ['硕士及以上', '熟悉深度学习框架'] },
  { id: 'job-4', title: '数据分析师', company: '美团', location: '北京', salary: '18k-35k', tags: ['SQL', 'Python', '业务分析'], source: 'manual', description: '支持本地生活业务线的数据决策与指标体系搭建。', requirements: ['熟练 SQL', '会 Python 更佳'] },
  { id: 'job-5', title: '客户端开发工程师', company: '小米科技', location: '北京', salary: '22k-38k', tags: ['Android', 'Kotlin', '性能优化'], source: 'api', description: '负责 MIUI 及智能硬件配套客户端的开发与优化。', requirements: ['熟悉 Android', '了解性能优化'], url: 'https://hr.xiaomi.com' },
];

export default function JobDiscovery() {
  const [jobs, setJobs] = useState<JobItem[]>(sampleJobs);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [jobType, setJobType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'discover' | 'favorites' | 'settings'>('discover');

  const filteredJobs = jobs.filter((job) => {
    const query = searchQuery.trim().toLowerCase();
    const matchQuery = !query || job.title.toLowerCase().includes(query) || job.company.toLowerCase().includes(query) || job.location.toLowerCase().includes(query);
    const matchType = !jobType || job.source === jobType;
    return matchQuery && matchType;
  });

  const toggleFavorite = (job: JobItem) => {
    setFavorites((prev) => {
      const exists = prev.some((fav) => fav.job.id === job.id);
      if (exists) return prev.filter((fav) => fav.job.id !== job.id);
      return [...prev, { id: `fav-${Date.now()}`, job }];
    });
  };

  const discoverSourceBadge = (source: JobItem['source']) => {
    const map = { crawler: { label: '爬虫', color: 'orange' }, manual: { label: '手动', color: 'blue' }, api: { label: 'API', color: 'green' } };
    const item = map[source];
    return <Badge color={item.color} variant="light">{item.label}</Badge>;
  };

  return (
    <Container size="xl" py="md">
      <LoadingOverlay visible={loading} overlayBlur={2} />
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <div>
            <Title order={2}>💼 职位获取</Title>
            <Text c="dimmed" size="sm">通过联网搜索、爬虫或手动导入职位；支持收藏后一键评估对应企业。</Text>
          </div>
          <Group gap="xs">
            <Tabs value={activeTab} onChange={(value) => setActiveTab(value as any)}>
              <Tabs.List>
                <Tabs.Tab value="discover">职位发现</Tabs.Tab>
                <Tabs.Tab value="favorites">收藏({favorites.length})</Tabs.Tab>
                <Tabs.Tab value="settings">联网配置</Tabs.Tab>
              </Tabs.List>
            </Tabs>
            <Switch checked={online} onChange={(e) => setOnline(e.currentTarget.checked)} label={online ? '联网模式' : '离线模式'} size="xs" />
          </Group>
        </Group>

        {activeTab === 'discover' && (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="sm">
              <Group grow>
                <TextInput placeholder="搜索职位、公司或城市" value={searchQuery} onChange={(e) => setSearchQuery(e.currentTarget.value)} leftSection={<IconSearch size={16} />} />
                <Select placeholder="职位来源" value={jobType} onChange={setJobType} data={[{ value: '', label: '全部来源' }, { value: 'api', label: 'API/联网搜索' }, { value: 'crawler', label: '爬虫导入' }, { value: 'manual', label: '手动导入' }]} clearable />
                <Button variant="light" leftSection={<IconRefresh size={16} />} onClick={() => {}}>刷新职位</Button>
              </Group>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>职位</Table.Th>
                    <Table.Th>公司</Table.Th>
                    <Table.Th>城市</Table.Th>
                    <Table.Th>薪资</Table.Th>
                    <Table.Th>来源</Table.Th>
                    <Table.Th>操作</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredJobs.map((job) => {
                    const isFav = favorites.some((fav) => fav.job.id === job.id);
                    return (
                      <Table.Tr key={job.id}>
                        <Table.Td>
                          <Text fw={500}>{job.title}</Text>
                          {job.description && <Text size="xs" c="dimmed" lineClamp={1}>{job.description}</Text>}
                        </Table.Td>
                        <Table.Td>{job.company}</Table.Td>
                        <Table.Td>{job.location}</Table.Td>
                        <Table.Td>{job.salary || '-'}</Table.Td>
                        <Table.Td>{discoverSourceBadge(job.source)}</Table.Td>
                        <Table.Td>
                          <Group gap={6}>
                            <Tooltip label={isFav ? '取消收藏' : '加入收藏'}>
                              <ActionIcon variant={isFav ? 'filled' : 'light'} color={isFav ? 'red' : 'gray'} onClick={() => toggleFavorite(job)}><IconHeart size={16} /></ActionIcon>
                            </Tooltip>
                            {job.url && (
                              <Tooltip label="查看职位详情">
                                <ActionIcon variant="light" onClick={() => window.open(job.url, '_blank')}><IconExternalLink size={16} /></ActionIcon>
                              </Tooltip>
                            )}
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
              <Alert icon={<IconBrain size={16} />} title="职位获取说明" color="blue" variant="light">
                <List size="sm">
                  <List.Item><Text span fw={500}>API/联网搜索：</Text><Text span c="dimmed">需要联网并配置搜索服务；目前示例中使用静态示例职位。</Text></List.Item>
                  <List.Item><Text span fw={500}>爬虫导入：</Text><Text span c="dimmed">可在设置中配置爬虫策略，批量导入招聘网站职位。</Text></List.Item>
                  <List.Item><Text span fw={500}>手动导入：</Text><Text span c="dimmed">支持单个或批量 JSON/CSV 导入职位信息。</Text></List.Item>
                </List>
              </Alert>
            </Stack>
          </Card>
        )}

        {activeTab === 'favorites' && (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="sm">
              <Group justify="space-between">
                <Title order={4}>⭐ 收藏职位</Title>
                <Button size="xs" variant="light" onClick={() => alert('可跳转到企业评估批量评估收藏企业')}>一键批量评估企业</Button>
              </Group>
              {!favorites.length && <Alert color="yellow" variant="light">还没有收藏任何职位，先去“职位发现”中添加感兴趣的工作吧。</Alert>}
              {favorites.map((favorite) => (
                <Paper key={favorite.id} withBorder p="sm" radius="md">
                  <Group justify="space-between" align="flex-start">
                    <div style={{ flex: 1 }}>
                      <Group gap="xs" mb={4}>
                        <Text fw={600}>{favorite.job.title}</Text>
                        <Badge color="gray" variant="light">收藏</Badge>
                      </Group>
                      <Text size="sm" c="dimmed">{favorite.job.company} · {favorite.job.location}{favorite.job.salary ? ` · ${favorite.job.salary}` : ''}</Text>
                    </div>
                    <Group gap={6}>
                      <Button size="xs" variant="light" onClick={() => alert('可跳转到企业评估详情')}>企业评估</Button>
                      <ActionIcon variant="light" color="red" onClick={() => toggleFavorite(favorite.job)}><IconHeart size={16} /></ActionIcon>
                    </Group>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Card>
        )}

        {activeTab === 'settings' && (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="sm">
              <Title order={4}>🌐 联网与数据源配置</Title>
              <Text size="sm" c="dimmed">开启联网后，职位发现会优先使用你配置的搜索服务；关闭后仅使用本地导入与示例数据。</Text>
              <Grid>
                <Grid.Col span={6}>
                  <Paper withBorder p="sm" radius="md">
                    <Group justify="space-between" mb="xs">
                      <Group gap={6}><ThemeIcon color="blue" variant="light" size="sm"><IconNetwork size={16} /></ThemeIcon><Text fw={600}>联网搜索服务</Text></Group>
                      <Switch checked={online} onChange={(e) => setOnline(e.currentTarget.checked)} />
                    </Group>
                    <Select size="xs" placeholder="选择搜索服务" data={[{ value: 'builtin', label: '内置示例数据' }, { value: 'bing', label: 'Bing Web Search（需配置）' }, { value: 'serpapi', label: 'SerpApi（需配置）' }, { value: 'custom', label: '自定义搜索 API' }]} />
                    <Text size="xs" c="dimmed" mt="xs">当前选择“内置示例数据”可离线体验职位发现流程。</Text>
                  </Paper>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Paper withBorder p="sm" radius="md">
                    <Group justify="space-between" mb="xs"><Group gap={6}><ThemeIcon color="green" variant="light" size="sm"><IconDatabase size={16} /></ThemeIcon><Text fw={600}>职位导入</Text></Group></Group>
                    <Group gap="xs">
                      <Button size="xs" variant="light" leftSection={<IconRefresh size={14} />}>导入 JSON</Button>
                      <Button size="xs" variant="light" leftSection={<IconRefresh size={14} />}>导出职位</Button>
                    </Group>
                    <Text size="xs" c="dimmed" mt="xs">支持批量导入职位列表，导入后可进入收藏页评估企业。</Text>
                  </Paper>
                </Grid.Col>
              </Grid>
              <Alert icon={<IconSparkles size={16} />} title="联网说明" color="yellow" variant="light">
                <Text size="sm">若你后续配置了真实搜索 API，职位发现可扩展为联网搜索；当前已内置示例职位，方便你直接走通“职位发现 → 收藏 → 企业评估”全链路。</Text>
              </Alert>
            </Stack>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
