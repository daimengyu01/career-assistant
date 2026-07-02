import React, { useState, useEffect } from 'react';
import { Container, Title, Text, Button, Group, Stack, Card, Alert, TextInput, FileInput, Box, Textarea } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconArrowRight, IconUpload, IconFileText, IconCheck } from '@tabler/icons-react';
import { useUserStore } from '../../stores/useUserStore';

const ResumeUpload: React.FC = () => {
  const navigate = useNavigate();
  const updateProfile = useUserStore((s) => s.updateProfile);
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (window.electronAPI?.getResume) {
        const resume = await window.electronAPI.getResume();
        if (!mounted) return;
        if (resume) {
          const r = resume as { parsedText?: string; filename?: string };
          if (r.parsedText) setResumeText(r.parsedText);
          if (r.filename) setFile(new File([], r.filename));
        }
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleFileChange = async (file: File | null) => {
    setFile(file);
    setExtractError(null);
    if (!file) return;

    // PDF 文件通过主进程提取文本
    if (file.name.toLowerCase().endsWith('.pdf')) {
      try {
        // Electron File 对象有 path 属性指向磁盘文件路径
        const filePath = (file as File & { path?: string }).path;
        if (filePath && window.electronAPI?.extractPdfText) {
          const result = await window.electronAPI.extractPdfText(filePath);
          if (result.success) {
            setResumeText(result.text);
          } else {
            setExtractError('无法提取 PDF 文本，请手动粘贴简历内容');
            setResumeText('');
          }
        } else {
          setExtractError('无法提取 PDF 文本，请手动粘贴简历内容');
          setResumeText('');
        }
      } catch (err) {
        setExtractError('PDF 提取失败：' + (err as Error).message + '，请手动粘贴');
        setResumeText('');
      }
      return;
    }

    // txt/md 文件用 FileReader 读
    const reader = new FileReader();
    reader.onload = () => {
      setResumeText(reader.result as string);
    };
    reader.readAsText(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      if (window.electronAPI?.saveResume) {
        await window.electronAPI.saveResume({
          fileName: file?.name,
          filePath: file?.name,
          extractedText: resumeText,
        });
      }
      updateProfile({
        resumeText: resumeText,
      });
      setSaved(true);
    } catch (err) {
      setSaveError('保存简历失败：' + (err as Error).message);
    } finally {
      setSaving(false);
    }
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
            <Text size="sm" c="dimmed">支持 txt / markdown / PDF 简历</Text>
            <FileInput
              placeholder="点击选择简历文件"
              leftSection={<IconUpload size={16} />}
              accept=".txt,.md,.pdf"
              onChange={handleFileChange}
            />
            {file && (
              <Alert icon={<IconFileText size={16} />} color="blue" variant="light">
                已选择：{file.name}
              </Alert>
            )}
            {extractError && (
              <Alert color="red" variant="light" title="提取失败">
                {extractError}
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
              <Button onClick={handleSave} leftSection={<IconCheck size={16} />} loading={saving} disabled={saving}>
                保存简历
              </Button>
            </Group>
            {saveError && (
              <Alert color="red" variant="light" title="保存失败">
                {saveError}
              </Alert>
            )}
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
