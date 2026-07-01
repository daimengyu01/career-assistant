import React from 'react';
import { Container, Title, Text, Stack, Button, Group, Card, Badge, SimpleGrid, Divider, List } from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { IconArrowLeft, IconHome, IconBrain, IconHeart, IconChartBar, IconBulb, IconBriefcase, IconAlertTriangle } from '@tabler/icons-react';
import type { AssessmentResult } from '../../types/assessment';

const typeConfig = {
  personality: {
    title: '性格评估',
    icon: IconBrain,
    color: 'blue',
  },
  interest: {
    title: '职业兴趣',
    icon: IconHeart,
    color: 'red',
  },
  career_match: {
    title: '职业匹配',
    icon: IconChartBar,
    color: 'green',
  },
};

const AssessmentResult: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const result = location.state?.result as AssessmentResult | undefined;

  if (!result) {
    return (
      <Container size="md" py="xl">
        <Stack align="center" gap="md">
          <Text c="dimmed">没有找到评估结果</Text>
          <Button onClick={() => navigate('/assessment')}>返回评估中心</Button>
        </Stack>
      </Container>
    );
  }

  const config = typeConfig[result.type];
  const data = result.data as Record<string, unknown>;

  // 从 router state 或结果对象中读取 AI insights
  const aiInsightsRaw =
    (location.state as { aiInsights?: string } | null)?.aiInsights || result.aiInsights;
  let aiInsights: { strengths?: string[]; careers?: string[]; cautions?: string[] } | null = null;
  let parseFailed = false;
  if (aiInsightsRaw) {
    try {
      let jsonStr = aiInsightsRaw.trim();
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      }
      aiInsights = JSON.parse(jsonStr);
    } catch {
      parseFailed = true;
    }
  }

  return (
    <Container size="md" py="xl">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} mb="xs">
            {config.title}结果
          </Title>
          <Text c="dimmed" size="sm">
            评估时间: {new Date(result.createdAt).toLocaleString('zh-CN')}
          </Text>
        </div>
        <Group>
          <Button variant="default" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <Button leftSection={<IconHome size={16} />} onClick={() => navigate('/')}>
            首页
          </Button>
        </Group>
      </Group>

      <Card withBorder shadow="sm" radius="md" padding="lg" mb="lg">
        <Stack gap="md">
          <Group>
            <config.icon size={40} color={config.color} />
            <div>
              <Title order={3}>
                {result.type === 'personality' && `你的性格类型: ${(data as { type?: string }).type || '未知'}`}
                {result.type === 'interest' && `主要兴趣类型: ${(data as { primaryType?: string }).primaryType || '未知'}`}
                {result.type === 'career_match' && '职业匹配分析'}
              </Title>
              {result.type === 'interest' && (data as { scores?: Array<{ label: string }> }).scores && (
                <Badge color={config.color} size="lg" mt="xs">
                  {(data as { scores: Array<{ label: string }> }).scores[0]?.label}
                </Badge>
              )}
            </div>
          </Group>

          <Divider label="AI 洞察" labelPosition="left" />
          {aiInsights ? (
            <Stack gap="md">
              {aiInsights.strengths && aiInsights.strengths.length > 0 && (
                <Card withBorder p="md" radius="md">
                  <Group gap="xs" mb="xs">
                    <IconBulb size={18} color="var(--mantine-color-green-filled)" />
                    <Text fw={500}>职业优势</Text>
                  </Group>
                  <List size="sm" spacing="xs">
                    {aiInsights.strengths.map((item, idx) => (
                      <List.Item key={idx}>{item}</List.Item>
                    ))}
                  </List>
                </Card>
              )}

              {aiInsights.careers && aiInsights.careers.length > 0 && (
                <Card withBorder p="md" radius="md">
                  <Group gap="xs" mb="xs">
                    <IconBriefcase size={18} color="var(--mantine-color-blue-filled)" />
                    <Text fw={500}>适合的职业方向</Text>
                  </Group>
                  <List size="sm" spacing="xs">
                    {aiInsights.careers.map((item, idx) => (
                      <List.Item key={idx}>{item}</List.Item>
                    ))}
                  </List>
                </Card>
              )}

              {aiInsights.cautions && aiInsights.cautions.length > 0 && (
                <Card withBorder p="md" radius="md">
                  <Group gap="xs" mb="xs">
                    <IconAlertTriangle size={18} color="var(--mantine-color-orange-filled)" />
                    <Text fw={500}>需要注意的短板</Text>
                  </Group>
                  <List size="sm" spacing="xs">
                    {aiInsights.cautions.map((item, idx) => (
                      <List.Item key={idx}>{item}</List.Item>
                    ))}
                  </List>
                </Card>
              )}
            </Stack>
          ) : parseFailed && aiInsightsRaw ? (
            <Card bg="gray.0" p="md" radius="md">
              <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                {aiInsightsRaw}
              </Text>
            </Card>
          ) : (
            <Card bg="gray.0" p="md" radius="md">
              <Text size="sm" c="dimmed" ta="center">
                暂无 AI 分析
              </Text>
            </Card>
          )}
        </Stack>
      </Card>

      {result.type === 'personality' && (data as { dimensions?: Record<string, number> }).dimensions && (
        <Card withBorder shadow="sm" radius="md" padding="lg" mb="lg">
          <Title order={4} mb="md">性格维度分析</Title>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            {Object.entries((data as { dimensions: Record<string, number> }).dimensions).map(([key, value]) => (
              <div key={key}>
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={500}>
                    {key === 'extroversion' && '外向性 (E/I)'}
                    {key === 'openness' && '开放性 (S/N)'}
                    {key === 'conscientiousness' && '尽责性 (J/P)'}
                    {key === 'agreeableness' && '宜人性 (T/F)'}
                    {key === 'neuroticism' && '情绪稳定性'}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {Math.round(Number(value) * 20)}%
                  </Text>
                </Group>
                <div style={{ height: 8, background: '#e9ecef', borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.round(Number(value) * 20))}%`,
                      background: 'var(--mantine-color-blue-filled)',
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            ))}
          </SimpleGrid>
        </Card>
      )}

      {result.type === 'interest' && (data as { scores?: Array<{ category: string; label: string; score: number }> }).scores && (
        <Card withBorder shadow="sm" radius="md" padding="lg" mb="lg">
          <Title order={4} mb="md">兴趣类型得分</Title>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {(data as { scores: Array<{ category: string; label: string; score: number }> }).scores.map((item) => (
              <Card key={item.category} withBorder p="md" radius="md">
                <Group justify="space-between">
                  <div>
                    <Text fw={500}>{item.label}</Text>
                    <Text size="xs" c="dimmed">
                      {item.category}
                    </Text>
                  </div>
                  <Badge color="blue" variant="light" size="lg">
                    {item.score} 分
                  </Badge>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        </Card>
      )}

      <Group justify="center" mt="xl">
        <Button onClick={() => navigate('/assessment')} variant="light">
          返回评估中心
        </Button>
        <Button onClick={() => navigate('/assessment/self-intro')}>
          完善个人情况
        </Button>
        <Button onClick={() => navigate('/recommendations')}>
          查看推荐
        </Button>
      </Group>
    </Container>
  );
};

export default AssessmentResult;
