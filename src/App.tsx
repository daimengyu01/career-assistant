import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Container, Title, Text, Stack, Card, SimpleGrid, ThemeIcon, Button, AppShell, NavLink, Box, Group, Burger, ScrollArea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconBrain, IconBuilding, IconSparkles, IconSettings,
  IconUser, IconFileText, IconBriefcase, IconStar,
  IconDatabase, IconRobot, IconDownload, IconChartBar,
  IconMapPin, IconUsers, IconHome,
} from '@tabler/icons-react';
import { useState } from 'react';

import PersonalAssessment from './components/assessment/PersonalAssessment';
import MBTIQuestionnaire from './components/assessment/MBTIQuestionnaire';
import BigFiveQuestionnaire from './components/assessment/BigFiveQuestionnaire';
import InterestSurvey from './components/assessment/InterestSurvey';
import SelfIntro from './components/assessment/SelfIntro';
import ResumeUpload from './components/assessment/ResumeUpload';
import CompanyList from './components/company/CompanyList';
import CompanyDetail from './components/company/CompanyDetail';
import CompanyForm from './components/company/CompanyForm';
import JobDiscovery from './components/recommendation/JobDiscovery';
import RecommendationList from './components/recommendation/RecommendationList';
import CareerPathVisualization from './components/recommendation/CareerPathVisualization';
import AssessmentResult from './components/assessment/AssessmentResult';
import ApiKeySettings from './components/settings/ApiKeySettings';
import DataSourceManager from './components/settings/DataSourceManager';
import DataBackup from './components/settings/DataBackup';

const navItems = [
  { label: '首页', icon: IconHome, link: '/' },
  { label: '个人评估', icon: IconBrain, link: '/assessment' },
  { label: '个人情况', icon: IconUser, link: '/self-intro' },
  { label: '简历上传', icon: IconFileText, link: '/resume' },
  { label: '职位获取', icon: IconBriefcase, link: '/jobs' },
  { label: '企业评估', icon: IconBuilding, link: '/companies' },
  { label: '智能推荐', icon: IconSparkles, link: '/recommendations' },
  { label: 'AI 配置', icon: IconRobot, link: '/settings/api' },
  { label: '数据源管理', icon: IconDatabase, link: '/settings/datasource' },
  { label: '数据备份', icon: IconDownload, link: '/settings/backup' },
];

function HomePage() {
  const features = [
    { title: '个人评估', description: 'MBTI、五大人格、霍兰德职业兴趣、AI 洞察分析', icon: IconBrain, color: 'blue', link: '/assessment' },
    { title: '个人情况', description: '填写身份、自我介绍，帮助推荐更精准', icon: IconUser, color: 'cyan', link: '/self-intro' },
    { title: '简历上传', description: '上传简历，解锁完整推荐功能', icon: IconFileText, color: 'teal', link: '/resume' },
    { title: '职位获取', description: '联网搜索、爬虫导入、手动添加职位', icon: IconBriefcase, color: 'indigo', link: '/jobs' },
    { title: '企业评估', description: '公司稳定性、晋升路径、行业前景', icon: IconBuilding, color: 'green', link: '/companies' },
    { title: '智能推荐', description: '结合专业、性格、兴趣的个性化推荐', icon: IconSparkles, color: 'violet', link: '/recommendations' },
    { title: 'AI 配置', description: 'API Key、服务商、模型管理', icon: IconRobot, color: 'orange', link: '/settings/api' },
    { title: '数据备份', description: '导入导出数据，防止丢失', icon: IconDownload, color: 'gray', link: '/settings/backup' },
  ];

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Title order={1} ta="center">CareerAssistant</Title>
        <Text ta="center" c="dimmed" mb="xl">大学生求职辅助工具 - 了解自己，找到适合的公司</Text>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {features.map((feature) => (
            <Card key={feature.title} shadow="sm" padding="lg" radius="md" withBorder component={Link} to={feature.link} style={{ textDecoration: 'none', color: 'inherit' }}>
              <Stack align="center" gap="sm">
                <ThemeIcon size={56} radius="md" color={feature.color} variant="light">
                  <feature.icon size={28} />
                </ThemeIcon>
                <Text fw={500} size="lg" ta="center">{feature.title}</Text>
                <Text size="sm" c="dimmed" ta="center">{feature.description}</Text>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Container size="lg" py="xl">
      {children}
    </Container>
  );
}

function NotFound() {
  return (
    <PageWrapper>
      <Stack align="center" gap="md">
        <Title order={2}>页面不存在</Title>
        <Button component={Link} to="/" variant="subtle">← 返回首页</Button>
      </Stack>
    </PageWrapper>
  );
}

export default function App() {
  const [opened, { toggle }] = useDisclosure();
  const location = useLocation();

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 220, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={toggle} size="sm" hiddenFrom="sm" />
            <Text fw={700} size="lg">CareerAssistant</Text>
          </Group>
          <Text size="xs" c="dimmed">大学生求职辅助</Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        <ScrollArea>
          <Stack gap="xs">
            {navItems.map((item) => (
              <NavLink
                key={item.link}
                component={Link}
                to={item.link}
                label={item.label}
                leftSection={<item.icon size={18} />}
                active={location.pathname === item.link || (item.link !== '/' && location.pathname.startsWith(item.link))}
                onClick={() => { if (window.innerWidth < 768) toggle(); }}
              />
            ))}
          </Stack>
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/assessment" element={<PersonalAssessment />} />
          <Route path="/assessment/mbti" element={<MBTIQuestionnaire />} />
          <Route path="/assessment/bigfive" element={<BigFiveQuestionnaire />} />
          <Route path="/assessment/interest" element={<InterestSurvey />} />
          <Route path="/assessment/result" element={<AssessmentResult />} />
          <Route path="/assessment/career-match" element={<CareerPathVisualization />} />
          <Route path="/self-intro" element={<SelfIntro />} />
          <Route path="/resume" element={<ResumeUpload />} />
          <Route path="/jobs" element={<JobDiscovery />} />
          <Route path="/companies" element={<CompanyList />} />
          <Route path="/companies/new" element={<CompanyForm />} />
          <Route path="/companies/:id" element={<CompanyDetail />} />
          <Route path="/companies/:id/edit" element={<CompanyForm />} />
          <Route path="/recommendations" element={<RecommendationList />} />
          <Route path="/settings/api" element={<ApiKeySettings />} />
          <Route path="/settings/datasource" element={<DataSourceManager />} />
          <Route path="/settings/backup" element={<DataBackup />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}
