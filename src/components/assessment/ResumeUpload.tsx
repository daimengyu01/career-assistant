import React, { useState } from 'react';
import { Container, Title, Text, Button, Group, Stack, Card, Alert, TextInput, FileInput, Box, Textarea } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconArrowRight, IconUpload, IconFileText, IconCheck } from '@tabler/icons-react';
import { useUserStore } from '../../stores/useUserStore';

const ResumeUpload: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateProfile } = useUserStore();
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [saved, setSaved] = useState(false);

  const handleFileChange = (files: File[] | null) => {
    const selected = files?.[0] || null;
    setFile(selected);
    if (selected) {
      const reader = new FileReader();
      reader.onload = () => {
        setResumeText(reader.result as string);
      };
      reader.readAsText(selected);
    }
  };

  const handleSave = () => {
    updateProfile({
      resume: {
        fileName: file?.name,
        filePath: file ? URL.createObjectURL(file) : undefined,
        extractedText: resumeText || undefined,
      },
    });
    setSaved(true);
  };

  const handleContinue = () => {
    navigate('/recommendations');
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={2}>📄 简历上传</Title>
            <Text c="dimmed" size="sm">上传简历后，推荐系统会结合简历内容做更精准的职位推荐。</Text>
          </div>
          <Button variant="default" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate(-1)}>
            返回
          </Button>
        </Group>

        <Card withBorder shadow="sm" radius="md" padding="lg">
          <Stack gap="sm">
            <Text fw={600}>上传简历文件</Text>
            <Text size="sm" c="dimmed">支持 txt / markdown 文本简历；后续可扩展 PDF。</Text>
            <FileInput
              placeholder="点击选择简历文件"
              leftSection={<IconUpload size={16} />}
              accept=".txt,.md"
              onChange={handleFileChange}
            />
            {file && (
              <Alert icon={<IconFileText size={16} />} color="blue" variant="light">
                已选择：{file.name}
              </Alert>
            )}
          </Stack>
        </Card>

        <Card withBorder shadow="sm" radius="md" padding="lg">
          <Stack gap="sm">
            <Text fw={600}>简历内容</Text>
            <Text size="sm" c="dimmed">上传后会自动填充，你也可以手动粘贴或编辑。</Text>
            <Textarea
              placeholder="粘贴你的简历内容..."
              value={resumeText}
              onChange={(e) => setResumeText(e.currentTarget.value)}
              minRows={8}
              maxRows={20}
            />
            <Group justify="flex-end">
              <Button onClick={handleSave} leftSection={<IconCheck size={16} />}>
                保存简历
              </Button>
            </Group>
            {saved && (
              <Alert color="green" variant="light">简历已保存，推荐系统将结合你的评估结果、自我介绍和简历做综合推荐。</Alert>
            )}
          </Stack>
        </Card>

        <Group justify="flex-end">
          <Button onClick={handleContinue} rightSection={<IconArrowRight size={16} />}>
            进入智能推荐
          </Button>
        </Group>
      </Stack>
    </Container>
  );
};

export default ResumeUpload;
