import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Container, Title, Text, Stack, Card, SimpleGrid, ThemeIcon, Button } from '@mantine/core';
import { IconBrain, IconBuilding, IconSparkles, IconSettings } from '@tabler/icons-react';

const features = [
  { title: '个人评估', description: 'MBTI、性格、兴趣全方位测评', icon: IconBrain, color: 'blue', link: '/assessment' },
  { title: '企业评估', description: '公司稳定性、晋升路径、行业前景', icon: IconBuilding, color: 'green', link: '/companies' },
  { title: '智能推荐', description: '结合专业、年龄、人生路径的个性化推荐', icon: IconSparkles, color: 'violet', link: '/recommendations' },
  { title: '系统设置', description: 'AI 配置、数据源管理、爬虫接入', icon: IconSettings, color: 'orange', link: '/settings' },
];

function HomePage() {
  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Title order={1} ta="center">CareerAssistant</Title>
        <Text ta="center" c="dimmed" mb="xl">大学生求职辅助工具 - 了解自己，找到适合的公司</Text>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
          {features.map((feature) => (
            <Card key={feature.title} shadow="sm" padding="lg" radius="md" withBorder component={Link} to={feature.link} style={{ textDecoration: 'none', color: 'inherit' }}>
              <Stack align="center" gap="sm">
                <ThemeIcon size={60} radius="md" color={feature.color} variant="light">
                  <feature.icon size={30} />
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

function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Button variant="subtle" component={Link} to="/">← 返回首页</Button>
        <Title order={2}>{title}</Title>
        <Text c="dimmed">{description}</Text>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Text>该页面已接入 React 路由，后续继续完善真实业务逻辑。</Text>
        </Card>
      </Stack>
    </Container>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/assessment" element={<PlaceholderPage title="个人评估" description="MBTI、五大人格、霍兰德职业兴趣、AI 洞察分析" />} />
      <Route path="/companies" element={<PlaceholderPage title="企业评估" description="公司稳定性、晋升清晰度、行业前景、地域发展评估" />} />
      <Route path="/recommendations" element={<PlaceholderPage title="智能推荐" description="基于已评估企业推荐、API 智能推荐、综合推荐" />} />
      <Route path="/settings" element={<PlaceholderPage title="系统设置" description="AI 配置、数据源管理、爬虫接入" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
