import { Routes, Route, Navigate } from 'react-router-dom';
import { Container, Title, Text, Group, Card, SimpleGrid, ThemeIcon } from '@mantine/core';
import { IconBrain, IconBuilding, IconSparkles, IconSettings } from '@tabler/icons-react';
import PersonalAssessment from './components/assessment/PersonalAssessment';
import MBTIQuestionnaire from './components/assessment/MBTIQuestionnaire';
import InterestSurvey from './components/assessment/InterestSurvey';
import AssessmentResult from './components/assessment/AssessmentResult';
import CompanyList from './components/company/CompanyList';
import CompanyForm from './components/company/CompanyForm';
import CompanyDetail from './components/company/CompanyDetail';
import RecommendationList from './components/recommendation/RecommendationList';
import ApiKeySettings from './components/settings/ApiKeySettings';
import CrawlerConfig from './components/settings/CrawlerConfig';
import DataSourceManager from './components/settings/DataSourceManager';

function HomePage() {
  const features = [
    {
      title: '个人评估',
      description: 'MBTI、性格、兴趣全方位测评，深度了解自己',
      icon: IconBrain,
      color: 'blue',
      link: '/assessment',
    },
    {
      title: '企业评估',
      description: '公司稳定性、晋升路径、地域发展多维分析',
      icon: IconBuilding,
      color: 'green',
      link: '/companies',
    },
    {
      title: '智能推荐',
      description: '结合专业、年龄、人生路径的个性化推荐',
      icon: IconSparkles,
      color: 'violet',
      link: '/recommendations',
    },
    {
      title: '系统设置',
      description: 'AI 配置、数据源管理、爬虫接入',
      icon: IconSettings,
      color: 'orange',
      link: '/settings',
    },
  ];

  return (
    <Container size="md" py="xl">
      <Title order={1} ta="center" mb="xs">
        CareerAssistant
      </Title>
      <Text ta="center" c="dimmed" mb="xl">
        大学生求职辅助工具 - 了解自己，找到适合的公司
      </Text>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
        {features.map((feature) => (
          <Card
            key={feature.title}
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            component="a"
            href={feature.link}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Group justify="center" mb="md">
              <ThemeIcon size={60} radius="md" color={feature.color} variant="light">
                <feature.icon size={30} />
              </ThemeIcon>
            </Group>
            <Text fw={500} size="lg" ta="center" mb="xs">
              {feature.title}
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              {feature.description}
            </Text>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/assessment" element={<PersonalAssessment />} />
      <Route path="/assessment/mbti" element={<MBTIQuestionnaire />} />
      <Route path="/assessment/interest" element={<InterestSurvey />} />
      <Route path="/assessment/result" element={<AssessmentResult />} />
      <Route path="/companies" element={<CompanyList />} />
      <Route path="/companies/new" element={<CompanyForm />} />
      <Route path="/companies/:id" element={<CompanyDetail />} />
      <Route path="/recommendations" element={<RecommendationList />} />
      <Route path="/settings" element={<ApiKeySettings />} />
      <Route path="/settings/crawler" element={<CrawlerConfig />} />
      <Route path="/settings/data-source" element={<DataSourceManager />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
