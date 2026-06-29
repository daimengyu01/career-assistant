import React, { useState } from 'react';
import { Container, Title, Text, Stack, Button, Group, TextInput, Select, Textarea, NumberInput, Card, Alert, Grid } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconPlus } from '@tabler/icons-react';
import { useCompanyStore } from '../../stores/useCompanyStore';
import type { Company } from '../../types/company';

const industries = [
  '互联网/科技',
  '金融/银行',
  '教育/培训',
  '医疗/健康',
  '制造业',
  '咨询/服务',
  '零售/电商',
  '媒体/广告',
  '房地产/建筑',
  '能源/环保',
  '其他',
];

const scales = [
  { value: 'startup', label: '初创公司' },
  { value: 'medium', label: '中型企业' },
  { value: 'large', label: '大型企业' },
];

const fundingStages = [
  '种子轮',
  '天使轮',
  'A轮',
  'B轮',
  'C轮',
  'D轮及以上',
  '已上市',
  '未融资',
];

const CompanyForm: React.FC = () => {
  const navigate = useNavigate();
  const addCompany = useCompanyStore((state) => state.addCompany);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    industry: '',
    scale: 'startup',
    fundingStage: '',
    location: { city: '', district: '' },
    stabilityScore: 70,
    promotionClarity: 70,
    tags: '',
    description: '',
  });

  const handleChange = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLocationChange = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      location: { ...prev.location, [field]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!form.name.trim()) {
        setError('请输入公司名称');
        return;
      }
      if (!form.industry) {
        setError('请选择行业');
        return;
      }
      if (!form.location.city.trim()) {
        setError('请输入城市');
        return;
      }

      const company: Company = {
        id: Date.now().toString(),
        name: form.name,
        industry: form.industry,
        scale: form.scale as Company['scale'],
        fundingStage: form.fundingStage || undefined,
        location: form.location,
        stabilityScore: form.stabilityScore,
        promotionClarity: form.promotionClarity,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        description: form.description || undefined,
        source: 'manual',
        createdAt: new Date().toISOString(),
      };

      addCompany(company);

      if (window.electronAPI?.saveCompany) {
        await window.electronAPI.saveCompany(company);
      }

      navigate('/companies');
    } catch (err) {
      setError('保存公司信息失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="md" py="xl">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} mb="xs">
            录入公司信息
          </Title>
          <Text c="dimmed">
            添加目标公司信息，便于后续评估和推荐
          </Text>
        </div>
        <Button variant="default" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate('/companies')}>
          返回列表
        </Button>
      </Group>

      {error && (
        <Alert color="red" mb="lg" title="错误">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack gap="lg">
          <Card withBorder shadow="sm" radius="md" padding="lg">
            <Title order={4} mb="md">基本信息</Title>
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="公司名称"
                  placeholder="例如：字节跳动"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.currentTarget.value)}
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label="所属行业"
                  placeholder="请选择行业"
                  data={industries}
                  searchable
                  value={form.industry}
                  onChange={(val) => handleChange('industry', val)}
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label="公司规模"
                  placeholder="请选择规模"
                  data={scales}
                  value={form.scale}
                  onChange={(val) => handleChange('scale', val)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label="融资阶段"
                  placeholder="请选择融资阶段"
                  data={fundingStages}
                  clearable
                  value={form.fundingStage}
                  onChange={(val) => handleChange('fundingStage', val)}
                />
              </Grid.Col>
            </Grid>
          </Card>

          <Card withBorder shadow="sm" radius="md" padding="lg">
            <Title order={4} mb="md">地理位置</Title>
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="城市"
                  placeholder="例如：北京"
                  value={form.location.city}
                  onChange={(e) => handleLocationChange('city', e.currentTarget.value)}
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="区域（选填）"
                  placeholder="例如：海淀区"
                  value={form.location.district}
                  onChange={(e) => handleLocationChange('district', e.currentTarget.value)}
                />
              </Grid.Col>
            </Grid>
          </Card>

          <Card withBorder shadow="sm" radius="md" padding="lg">
            <Title order={4} mb="md">评估指标</Title>
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <NumberInput
                  label="稳定性评分 (0-100)"
                  min={0}
                  max={100}
                  value={form.stabilityScore}
                  onChange={(val) => handleChange('stabilityScore', Number(val) || 0)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <NumberInput
                  label="晋升清晰度 (0-100)"
                  min={0}
                  max={100}
                  value={form.promotionClarity}
                  onChange={(val) => handleChange('promotionClarity', Number(val) || 0)}
                />
              </Grid.Col>
            </Grid>
          </Card>

          <Card withBorder shadow="sm" radius="md" padding="lg">
            <Title order={4} mb="md">其他信息</Title>
            <Stack gap="md">
              <TextInput
                label="标签"
                placeholder="用逗号分隔，例如：大厂, 稳定, 高薪"
                value={form.tags}
                onChange={(e) => handleChange('tags', e.currentTarget.value)}
              />
              <Textarea
                label="公司简介"
                placeholder="简要描述公司业务、文化等..."
                minRows={3}
                value={form.description}
                onChange={(e) => handleChange('description', e.currentTarget.value)}
              />
            </Stack>
          </Card>

          <Group justify="flex-end">
            <Button variant="default" onClick={() => navigate('/companies')}>
              取消
            </Button>
            <Button type="submit" leftSection={<IconPlus size={16} />} loading={loading}>
              保存公司
            </Button>
          </Group>
        </Stack>
      </form>
    </Container>
  );
};

export default CompanyForm;
