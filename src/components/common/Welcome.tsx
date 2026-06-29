import React, { useState, useEffect } from 'react';
import { Container, Title, Text, Button, Group, Card, Stack, Alert, ThemeIcon, Progress, List } from '@mantine/core';
import { IconChecklist, IconBrain, IconBuilding, IconSparkles, IconSettings, IconArrowRight, IconInfoCircle } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

export default function Welcome() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);

  useEffect(() => {
    // 检查是否已经完成过新手引导
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    if (hasCompletedOnboarding) {
      setShowWelcome(false);
    }
  }, []);

  const steps: OnboardingStep[] = [
    {
      title: '欢迎使用 CareerAssistant',
      description: '你的个人求职辅助助手，帮助你了解自己、评估企业、找到适合的职业发展方向。',
      icon: <IconChecklist size={32} />,
      completed: false,
    },
    {
      title: '完成个人评估',
      description: '通过 MBTI 性格测试、五大人格分析、霍兰德职业兴趣测试，深入了解自己的职业倾向。',
      icon: <IconBrain size={32} />,
      completed: false,
    },
    {
      title: '评估目标企业',
      description: '添加你想了解的公司，评估公司稳定性、晋升路径、行业前景等关键因素。',
      icon: <IconBuilding size={32} />,
      completed: false,
    },
    {
      title: '获取智能推荐',
      description: '基于你的专业、性格、兴趣和年龄，AI 会为你推荐最适合的职业方向和发展路径。',
      icon: <IconSparkles size={32} />,
      completed: false,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // 完成引导
      localStorage.setItem('onboarding_completed', 'true');
      setShowWelcome(false);
      navigate('/assessment');
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setShowWelcome(false);
  };

  if (!showWelcome) {
    return (
      <Container size="md" py="xl">
        <Stack gap="lg">
          <Title order={1} ta="center">
            欢迎回来！
          </Title>
          <Text ta="center" c="dimmed" mb="xl">
            你已经完成了新手引导，可以直接开始使用 CareerAssistant
          </Text>
          <Group justify="center" gap="md">
            <Button size="lg" onClick={() => navigate('/assessment')}>
              开始评估
            </Button>
            <Button size="lg" variant="light" onClick={() => navigate('/companies')}>
              浏览公司
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/settings')}>
              配置设置
            </Button>
          </Group>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        {/* 进度指示器 */}
        <Progress value={(currentStep / (steps.length - 1)) * 100} size="lg" />
        
        {/* 步骤标题 */}
        <Group justify="space-between" align="center">
          <div>
            <Text size="sm" c="dimmed" mb="xs">
              步骤 {currentStep + 1} / {steps.length}
            </Text>
            <Title order={2}>{steps[currentStep].title}</Title>
          </div>
          <ThemeIcon size={60} radius="md" variant="light" color="blue">
            {steps[currentStep].icon}
          </ThemeIcon>
        </Group>

        {/* 步骤内容 */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Text size="lg">{steps[currentStep].description}</Text>
            
            {currentStep === 0 && (
              <Alert icon={<IconInfoCircle size={16} />} title="使用提示" color="blue">
                <List size="sm">
                  <List.Item>你可以随时在"设置"中配置 API Key</List.Item>
                  <List.Item>所有数据都保存在本地，保护你的隐私</List.Item>
                  <List.Item>建议先完成个人评估，再浏览公司列表</List.Item>
                </List>
              </Alert>
            )}

            {currentStep === 3 && (
              <Alert icon={<IconInfoCircle size={16} />} title="API 配置" color="yellow">
                <Text size="sm">
                  智能推荐功能需要配置 DeepSeek 或 OpenAI API Key。
                  你可以在"设置"页面中添加 API Key，或者直接使用基础推荐功能（无需 API Key）。
                </Text>
              </Alert>
            )}
          </Stack>
        </Card>

        {/* 操作按钮 */}
        <Group justify="space-between">
          <Button variant="subtle" onClick={handleSkip}>
            跳过引导
          </Button>
          <Group>
            {currentStep > 0 && (
              <Button variant="default" onClick={() => setCurrentStep(currentStep - 1)}>
                上一步
              </Button>
            )}
            <Button onClick={handleNext} rightSection={<IconArrowRight size={16} />}>
              {currentStep === steps.length - 1 ? '开始使用' : '下一步'}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Container>
  );
}
