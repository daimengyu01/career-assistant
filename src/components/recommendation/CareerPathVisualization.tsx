import React, { useMemo } from 'react';
import { Container, Title, Text, Stack, Card, SimpleGrid, Badge, Group, Timeline, Alert } from '@mantine/core';
import { IconBriefcase, IconTrendingUp, IconStar, IconTarget } from '@tabler/icons-react';
import { useUserStore } from '../../stores/useUserStore';
import { useAssessmentStore } from '../../stores/useAssessmentStore';
import { useCompanyStore } from '../../stores/useCompanyStore';

const CareerPathVisualization: React.FC = () => {
  const profile = useUserStore((state) => state.profile);
  const assessmentResults = useAssessmentStore((state) => state.results);
  const companies = useCompanyStore((state) => state.companies);

  const mbtiResult = assessmentResults.find((r) => r.type === 'mbti');
  const interestResult = assessmentResults.find((r) => r.type === 'interest');

  const getCareerSuggestions = () => {
    const suggestions: Array<{ title: string; description: string; color: string; icon: React.ReactNode }> = [];

    if (!mbtiResult && !interestResult) {
      return suggestions;
    }

    const mbtiType = mbtiResult?.data as { type?: string };
    const interestScores = interestResult?.data as { primaryType?: string; scores?: Array<{ category: string }> };

    if (mbtiType?.type) {
      const type = mbtiType.type;
      
      if (type.startsWith('E')) {
        suggestions.push({
          title: '销售/市场/公关',
          description: '外向型性格适合需要频繁沟通的岗位',
          color: 'blue',
          icon: <IconBriefcase size={24} />,
        });
      }
      if (type.startsWith('I')) {
        suggestions.push({
          title: '研发/技术/分析',
          description: '内向型性格适合需要深度思考的专业岗位',
          color: 'teal',
          icon: <IconBriefcase size={24} />,
        });
      }
      if (type.startsWith('N')) {
        suggestions.push({
          title: '产品/创新/战略',
          description: '直觉型思维适合需要前瞻性思考的岗位',
          color: 'violet',
          icon: <IconBriefcase size={24} />,
        });
      }
      if (type.startsWith('S')) {
        suggestions.push({
          title: '运营/财务/法务',
          description: '实感型思维适合需要细致和规范的岗位',
          color: 'orange',
          icon: <IconBriefcase size={24} />,
        });
      }
      if (type.startsWith('T')) {
        suggestions.push({
          title: '工程/数据/金融',
          description: '思考型决策适合需要逻辑分析的岗位',
          color: 'cyan',
          icon: <IconBriefcase size={24} />,
        });
      }
      if (type.startsWith('F')) {
        suggestions.push({
          title: 'HR/教育/咨询',
          description: '情感型决策适合需要人际关商的岗位',
          color: 'pink',
          icon: <IconBriefcase size={24} />,
        });
      }
    }

    if (interestScores?.primaryType) {
      const primary = interestScores.primaryType;
      const interestMap: Record<string, { title: string; description: string; color: string }> = {
        R: { title: '技术/工程/制造', description: '动手能力强，适合技术类岗位', color: 'orange' },
        I: { title: '研发/数据/学术', description: '喜欢研究，适合科研和技术岗位', color: 'blue' },
        A: { title: '设计/创意/媒体', description: '富有创造力，适合创意类岗位', color: 'pink' },
        S: { title: '服务/教育/医疗', description: '善于沟通，适合服务类岗位', color: 'green' },
        E: { title: '管理/销售/创业', description: '有领导力，适合管理和创业', color: 'yellow' },
        C: { title: '行政/财务/审计', description: '注重规范，适合事务类岗位', color: 'gray' },
      };

      const interest = interestMap[primary];
      if (interest) {
        suggestions.push({
          title: interest.title,
          description: interest.description,
          color: interest.color,
          icon: <IconStar size={24} />,
        });
      }
    }

    return suggestions;
  };

  const suggestions = useMemo(() => getCareerSuggestions(), [mbtiResult, interestResult, companies]);

  const getEducationStage = () => {
    if (!profile?.graduationYear) return 'unknown';
    const currentYear = new Date().getFullYear();
    const diff = profile.graduationYear - currentYear;
    if (diff > 2) return 'early';
    if (diff > 0) return 'mid';
    if (diff === 0) return 'graduating';
    return 'experienced';
  };

  const stage = getEducationStage();

  const stageConfig = {
    early: { label: '早期阶段', color: 'blue', description: '探索期，重点在于实习和技能积累' },
    mid: { label: '中期阶段', color: 'yellow', description: '成长期，重点在于提升专业能力' },
    graduating: { label: '即将毕业', color: 'orange', description: '求职期，重点在于找到第一份工作' },
    experienced: { label: '工作阶段', color: 'green', description: '发展期，重点在于晋升和转型' },
    unknown: { label: '未知阶段', color: 'gray', description: '请完善个人信息' },
  };

  const currentStage = stageConfig[stage];

  const targetCompanies = companies
    .slice()
    .sort((a, b) => b.stabilityScore - a.stabilityScore)
    .slice(0, 3);

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="xs">
        职业路径可视化
      </Title>
      <Text c="dimmed" mb="xl">
        基于你的评估结果，规划职业发展路径
      </Text>

      <Stack gap="lg">
        {!profile && (
          <Alert color="yellow" title="提示">
            请先完善个人档案，获取更精准的职业建议
          </Alert>
        )}

        <Card withBorder shadow="sm" radius="md" padding="lg">
          <Group gap="md" mb="md">
            <IconTarget size={32} color="blue" />
            <div>
              <Title order={4}>当前阶段</Title>
              <Text size="sm" c="dimmed">
                {currentStage.description}
              </Text>
            </div>
            <Badge color={currentStage.color} size="lg" ml="auto">
              {currentStage.label}
            </Badge>
          </Group>
        </Card>

        <Card withBorder shadow="sm" radius="md" padding="lg">
          <Title order={4} mb="md">职业建议</Title>
          {suggestions.length === 0 ? (
            <Text c="dimmed" size="sm">
              完成性格和兴趣测试后，将为你生成个性化职业建议
            </Text>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              {suggestions.map((item, index) => (
                <Card key={index} withBorder p="md" radius="md">
                  <Group gap="md">
                    <div style={{ color: `var(--mantine-color-${item.color}-6)` }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <Text fw={500} mb="xs">
                        {item.title}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {item.description}
                      </Text>
                    </div>
                  </Group>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Card>

        <Card withBorder shadow="sm" radius="md" padding="lg">
          <Title order={4} mb="md">发展路径</Title>
          <Timeline active={2} bulletSize={24} lineWidth={2}>
            <Timeline.Item bullet={<IconBriefcase size={12} />} title="基础能力建设">
              <Text c="dimmed" size="sm">
                掌握核心专业技能，完成学业要求
              </Text>
              <Text size="xs" mt={4}>阶段: 0-1年</Text>
            </Timeline.Item>

            <Timeline.Item bullet={<IconTrendingUp size={12} />} title="实践与成长">
              <Text c="dimmed" size="sm">
                通过实习和初级岗位积累实战经验
              </Text>
              <Text size="xs" mt={4}>阶段: 1-3年</Text>
            </Timeline.Item>

            <Timeline.Item bullet={<IconStar size={12} />} title="专业深化">
              <Text c="dimmed" size="sm">
                成为领域专家，建立个人品牌
              </Text>
              <Text size="xs" mt={4}>阶段: 3-5年</Text>
            </Timeline.Item>

            <Timeline.Item bullet={<IconTarget size={12} />} title="职业突破">
              <Text c="dimmed" size="sm">
                晋升管理岗或创业，实现职业目标
              </Text>
              <Text size="xs" mt={4}>阶段: 5年以上</Text>
            </Timeline.Item>
          </Timeline>
        </Card>

        {targetCompanies.length > 0 && (
          <Card withBorder shadow="sm" radius="md" padding="lg">
            <Title order={4} mb="md">目标公司</Title>
            <Stack gap="sm">
              {targetCompanies.map((company) => (
                <Card key={company.id} withBorder p="md" radius="md">
                  <Group justify="space-between">
                    <div>
                      <Text fw={500}>{company.name}</Text>
                      <Text size="sm" c="dimmed">
                        {company.industry} · {company.location.city}
                      </Text>
                    </div>
                    <Badge color={company.stabilityScore >= 80 ? 'green' : 'yellow'} variant="light">
                      稳定性 {company.stabilityScore}
                    </Badge>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Card>
        )}
      </Stack>
    </Container>
  );
};

export default CareerPathVisualization;
