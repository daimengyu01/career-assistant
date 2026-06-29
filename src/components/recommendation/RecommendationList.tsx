import React, { useState, useEffect } from 'react';
import { Container, Title, Text, Stack, Button, Group, Card, Badge, SimpleGrid, Alert, Tabs } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { IconSparkles, IconRefresh } from '@tabler/icons-react';
import { useCompanyStore } from '../../stores/useCompanyStore';
import { useUserStore } from '../../stores/useUserStore';
import Loading from '../common/Loading';
import MatchScoreCard from './MatchScoreCard';

const RecommendationList: React.FC = () => {
  const navigate = useNavigate();
  const companies = useCompanyStore((state) => state.companies);
  const profile = useUserStore((state) => state.profile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [recommendations, setRecommendations] = useState<Array<{ company: typeof companies[0]; matchScore: number; reasons: string[] }>>([]);
  const [activeTab, setActiveTab] = useState<string | null>('match');

  useEffect(() => {
    const generateRecommendations = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!companies.length) {
          setRecommendations([]);
          return;
        }

        const scored = companies.map((company) => {
          let score = 50;
          const reasons: string[] = [];

          if (company.stabilityScore >= 80) {
            score += 15;
            reasons.push('公司稳定性高');
          } else if (company.stabilityScore >= 60) {
            score += 8;
            reasons.push('公司稳定性较好');
          }

          if (company.promotionClarity >= 80) {
            score += 15;
            reasons.push('晋升路径清晰');
          } else if (company.promotionClarity >= 60) {
            score += 8;
            reasons.push('晋升机制较为明确');
          }

          if (profile?.personality.mbti) {
            const mbti = profile.personality.mbti;
            if ((mbti.includes('E') || mbti.includes('N')) && company.industry === '互联网/科技') {
              score += 5;
              reasons.push('与你的性格类型匹配');
            }
            if (mbti.includes('J') && company.scale === 'large') {
              score += 5;
              reasons.push('适合追求稳定的你');
            }
          }

          if (profile?.riskPreference === 'conservative' && company.stabilityScore >= 75) {
            score += 10;
            reasons.push('符合你的风险偏好');
          }

          if (company.tags.some((tag) => profile?.interests?.includes(tag))) {
            score += 10;
            reasons.push('符合你的兴趣方向');
          }

          return {
            company,
            matchScore: Math.min(100, score),
            reasons,
          };
        });

        scored.sort((a, b) => b.matchScore - a.matchScore);
        setRecommendations(scored);
      } catch (err) {
        setError('生成推荐失败');
      } finally {
        setLoading(false);
      }
    };

    generateRecommendations();
  }, [companies, profile]);

  const handleRefresh = async () => {
    setGenerating(true);
    try {
      if (window.electronAPI?.chatWithAI && profile) {
        const prompt = `基于以下用户信息和公司列表，生成职业推荐建议。用户MBTI: ${profile.personality.mbti || '未知'}, 兴趣: ${profile.interests?.join(', ') || '未知'}, 风险偏好: ${profile.riskPreference || '未知'}。公司列表: ${companies.map(c => c.name).join(', ')}。请为每个公司给出匹配度评分(0-100)和推荐理由。`;
        
        const response = await window.electronAPI.chatWithAI([
          { role: 'user', content: prompt },
        ]);

        try {
          const aiRecommendations = JSON.parse(response);
          setRecommendations(aiRecommendations);
        } catch {
          setError('AI 返回格式错误');
        }
      }
    } catch (err) {
      setError('刷新推荐失败');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <Loading message="正在生成推荐..." />;
  }

  if (error) {
    return (
      <Container size="md" py="xl">
        <Stack align="center" gap="md">
          <Alert color="red" title="错误" w="100%">
            {error}
          </Alert>
          <Button onClick={() => navigate('/companies')}>添加公司</Button>
        </Stack>
      </Container>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Container size="md" py="xl">
        <Stack align="center" gap="md">
          <IconSparkles size={48} color="gray" />
          <Text c="dimmed">暂无推荐数据</Text>
          <Button onClick={() => navigate('/companies')}>添加公司</Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} mb="xs">
            智能推荐
          </Title>
          <Text c="dimmed">
            基于你的性格、兴趣和风险偏好的个性化推荐
          </Text>
        </div>
        <Button
          leftSection={<IconRefresh size={16} />}
          onClick={handleRefresh}
          loading={generating}
        >
          AI 刷新
        </Button>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} mb="lg">
        <Tabs.List>
          <Tabs.Tab value="match">匹配推荐</Tabs.Tab>
          <Tabs.Tab value="career">职业路径</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {activeTab === 'match' && (
        <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
          {recommendations.map((item) => (
            <MatchScoreCard
              key={item.company.id}
              company={item.company}
              matchScore={item.matchScore}
              reasons={item.reasons}
              onClick={() => navigate(`/companies/${item.company.id}`)}
            />
          ))}
        </SimpleGrid>
      )}

      {activeTab === 'career' && (
        <Card withBorder shadow="sm" radius="md" padding="lg">
          <Stack gap="md">
            <Title order={4}>职业发展路径建议</Title>
            <Text c="dimmed" size="sm">
              基于你的评估结果和当前市场情况，为你规划职业发展路径
            </Text>

            <Stack gap="md">
              <Card withBorder p="md" radius="md">
                <Group gap="md">
                  <div style={{ flex: 1 }}>
                    <Text fw={500} mb="xs">短期目标 (1-2年)</Text>
                    <Text size="sm" c="dimmed">
                      进入行业头部公司积累经验，建立专业能力
                    </Text>
                  </div>
                  <Badge color="blue" variant="light">成长阶段</Badge>
                </Group>
              </Card>

              <Card withBorder p="md" radius="md">
                <Group gap="md">
                  <div style={{ flex: 1 }}>
                    <Text fw={500} mb="xs">中期目标 (3-5年)</Text>
                    <Text c="dimmed">
                      晋升到管理岗位或成为领域专家，提升行业影响力
                    </Text>
                  </div>
                  <Badge color="green" variant="light">发展阶段</Badge>
                </Group>
              </Card>

              <Card withBorder p="md" radius="md">
                <Group gap="md">
                  <div style={{ flex: 1 }}>
                    <Text fw={500} mb="xs">长期目标 (5年以上)</Text>
                    <Text c="dimmed">
                      成为行业资深人士或创业，实现职业理想
                    </Text>
                  </div>
                  <Badge color="violet" variant="light">成熟阶段</Badge>
                </Group>
              </Card>
            </Stack>
          </Stack>
        </Card>
      )}
    </Container>
  );
};

export default RecommendationList;
