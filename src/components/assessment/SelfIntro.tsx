import React, { useState } from 'react';
import { Container, Title, Text, Textarea, Button, Group, Stack, Card, Alert, Select, NumberInput } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconArrowRight, IconUser } from '@tabler/icons-react';
import { useUserStore } from '../../stores/useUserStore';

const templates = [
  { value: 'student', label: '在校学生' },
  { value: 'fresh_grad', label: '应届毕业生' },
  { value: 'career_switcher', label: '转行求职者' },
  { value: 'experienced', label: '有工作经验' },
];

const SelfIntro: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateProfile } = useUserStore();
  const [identity, setIdentity] = useState<string | null>(null);
  const [intro, setIntro] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!intro.trim()) {
      setError('请先填写你的自我介绍');
      return;
    }
    updateProfile({
      selfIntro: intro.trim(),
      assessmentUnlocked: true,
    });
    navigate('/jobs');
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={2}>📝 个人情况说明</Title>
            <Text c="dimmed" size="sm">让系统更了解你，从而给出更精准的职位推荐。</Text>
          </div>
          <Button variant="default" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate(-1)}>
            返回
          </Button>
        </Group>

        <Card withBorder shadow="sm" radius="md" padding="lg">
          <Stack gap="sm">
            <Text fw={600}>第一步：选择你的当前身份</Text>
            <Select placeholder="选择最贴近你的身份" data={templates} value={identity} onChange={setIdentity} />
            {identity && (
              <Alert color="blue" variant="light">
                {identity === 'student' && '你正在校就读，推荐优先看实习和校招岗位。'}
                {identity === 'fresh_grad' && '你刚毕业，推荐优先看应届生岗位和校招补录。'}
                {identity === 'career_switcher' && '你正在转行，推荐会兼顾可迁移能力与转型岗位。'}
                {identity === 'experienced' && '你有工作经验，推荐会更关注职级匹配和晋升路径。'}
              </Alert>
            )}
          </Stack>
        </Card>

        <Card withBorder shadow="sm" radius="md" padding="lg">
          <Stack gap="sm">
            <Text fw={600}>第二步：自我介绍</Text>
            <Text size="sm" c="dimmed">可以包括：专业背景、实习/项目经历、技能栈、目标行业、期望岗位、地域偏好等。</Text>
            <Textarea
              placeholder="例如：我是计算机科学专业大三学生，主要使用 React/TypeScript，做过两个前端项目，希望在深圳找一份前端实习..."
              value={intro}
              onChange={(e) => setIntro(e.currentTarget.value)}
              minRows={6}
              maxRows={12}
              error={error}
            />
          </Stack>
        </Card>

        <Group justify="flex-end">
        <Button variant="default" onClick={() => navigate('/assessment/resume')}>
          跳过，稍后补充
        </Button>
        <Button onClick={() => { handleSave(); }} rightSection={<IconArrowRight size={16} />}>
          保存并继续
        </Button>
      </Group>
      </Stack>
    </Container>
  );
};

export default SelfIntro;
