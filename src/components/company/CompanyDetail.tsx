import React, { useState, useEffect } from 'react';
import { Container, Title, Text, Stack, Button, Group, Card, Badge, Grid, NumberInput, Textarea, Alert, Tabs, Rating, Divider } from '@mantine/core';
import { useNavigate, useParams } from 'react-router-dom';
import { IconArrowLeft, IconEdit, IconTrash, IconMapPin, IconCurrencyYen } from '@tabler/icons-react';
import { useCompanyStore } from '../../stores/useCompanyStore';
import Loading from '../common/Loading';
import type { Company } from '../../types/company';

const CompanyDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const companies = useCompanyStore((state) => state.companies);
  const updateCompany = useCompanyStore((state) => state.updateCompany);
  const removeCompany = useCompanyStore((state) => state.removeCompany);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localCompany, setLocalCompany] = useState<Partial<Company>>({});

  const company = companies.find((c) => c.id === id);

  useEffect(() => {
    const loadCompany = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!company && window.electronAPI?.getCompany) {
          const data = await window.electronAPI.getCompany(id!);
          const found = data as Company;
          if (found) {
            setLocalCompany(found);
          } else {
            setError('公司不存在');
          }
        } else if (company) {
          setLocalCompany(company);
        } else {
          setError('公司不存在');
        }
      } catch (err) {
        setError('加载公司详情失败');
      } finally {
        setLoading(false);
      }
    };

    loadCompany();
  }, [id, company]);

  const handleSave = async () => {
    if (!id || !localCompany) return;

    setSaving(true);
    try {
      updateCompany(id, localCompany as Company);

      if (window.electronAPI?.saveCompany) {
        await window.electronAPI.saveCompany(localCompany);
      }

      setIsEditing(false);
    } catch (err) {
      setError('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('确定要删除这家公司吗？')) return;

    try {
      if (window.electronAPI?.deleteCompany) {
        await window.electronAPI.deleteCompany(id);
      }
      removeCompany(id);
      navigate('/companies');
    } catch (err) {
      setError('删除失败');
    }
  };

  const getScaleLabel = (scale?: string) => {
    switch (scale) {
      case 'large': return '大型企业';
      case 'medium': return '中型企业';
      case 'startup': return '初创公司';
      default: return scale || '未知';
    }
  };

  const getStabilityColor = (score?: number) => {
    if (!score) return 'gray';
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
  };

  if (loading) {
    return <Loading message="加载公司详情..." />;
  }

  if (error || !company) {
    return (
      <Container size="md" py="xl">
        <Stack align="center" gap="md">
          <Text c="dimmed">{error || '公司不存在'}</Text>
          <Button onClick={() => navigate('/companies')}>返回列表</Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Group justify="space-between" mb="xl">
        <Button variant="default" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate('/companies')}>
          返回列表
        </Button>
        <Group>
          {!isEditing ? (
            <>
              <Button variant="light" leftSection={<IconEdit size={16} />} onClick={() => setIsEditing(true)}>
                编辑
              </Button>
              <Button variant="light" color="red" leftSection={<IconTrash size={16} />} onClick={handleDelete}>
                删除
              </Button>
            </>
          ) : (
            <>
              <Button variant="default" onClick={() => setIsEditing(false)}>
                取消
              </Button>
              <Button onClick={handleSave} loading={saving}>
                保存
              </Button>
            </>
          )}
        </Group>
      </Group>

      <Tabs defaultValue="info">
        <Tabs.List mb="lg">
          <Tabs.Tab value="info">基本信息</Tabs.Tab>
          <Tabs.Tab value="evaluation">评估分析</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="info">
          <Card withBorder shadow="sm" radius="md" padding="lg">
            <Stack gap="md">
              <Group justify="space-between">
                <div>
                  <Title order={3}>{company.name}</Title>
                  <Text c="dimmed">{company.industry}</Text>
                </div>
                <Badge size="lg" color="blue" variant="light">
                  {getScaleLabel(company.scale)}
                </Badge>
              </Group>

              {isEditing ? (
                <Stack gap="md">
                  <Textarea
                    label="公司简介"
                    value={localCompany.description || ''}
                    onChange={(e) => setLocalCompany({ ...localCompany, description: e.currentTarget.value })}
                    minRows={3}
                  />
                  <NumberInput
                    label="稳定性评分"
                    min={0}
                    max={100}
                    value={localCompany.stabilityScore}
                    onChange={(val) => setLocalCompany({ ...localCompany, stabilityScore: Number(val) || 0 })}
                  />
                  <NumberInput
                    label="晋升清晰度"
                    min={0}
                    max={100}
                    value={localCompany.promotionClarity}
                    onChange={(val) => setLocalCompany({ ...localCompany, promotionClarity: Number(val) || 0 })}
                  />
                </Stack>
              ) : (
                <Stack gap="sm">
                  {company.description && (
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                      {company.description}
                    </Text>
                  )}
                  <Group gap="lg">
                    <Group gap="xs">
                      <IconMapPin size={16} />
                      <Text size="sm">{company.location.city}{company.location.district ? ` · ${company.location.district}` : ''}</Text>
                    </Group>
                    {company.fundingStage && (
                      <Group gap="xs">
                        <IconCurrencyYen size={16} />
                        <Text size="sm">{company.fundingStage}</Text>
                      </Group>
                    )}
                  </Group>
                </Stack>
              )}

              <Divider />

              <Grid>
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">稳定性评分</Text>
                  <Group gap="xs">
                    <Rating value={Math.round(company.stabilityScore / 20)} readOnly fractions={2} />
                    <Text fw={500}>{company.stabilityScore} 分</Text>
                  </Group>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">晋升清晰度</Text>
                  <Group gap="xs">
                    <Rating value={Math.round(company.promotionClarity / 20)} readOnly fractions={2} />
                    <Text fw={500}>{company.promotionClarity} 分</Text>
                  </Group>
                </Grid.Col>
              </Grid>

              {company.tags.length > 0 && (
                <>
                  <Divider />
                  <Group gap="xs">
                    {company.tags.map((tag) => (
                      <Badge key={tag} variant="light" color="gray">
                        {tag}
                      </Badge>
                    ))}
                  </Group>
                </>
              )}
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="evaluation">
          <Card withBorder shadow="sm" radius="md" padding="lg">
            <Stack gap="md">
              <Title order={4}>综合评估</Title>
              <Text c="dimmed" size="sm">
                基于公司稳定性、晋升路径、行业前景等维度的综合评估
              </Text>

              <Grid>
                <Grid.Col span={6}>
                  <Card withBorder p="md" radius="md">
                    <Text size="sm" c="dimmed" mb="xs">稳定性指数</Text>
                    <Group justify="space-between">
                      <Text fw={700} size="xl">{company.stabilityScore}</Text>
                      <Badge color={getStabilityColor(company.stabilityScore)} size="lg">
                        {company.stabilityScore >= 80 ? '高' : company.stabilityScore >= 60 ? '中' : '低'}
                      </Badge>
                    </Group>
                  </Card>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Card withBorder p="md" radius="md">
                    <Text size="sm" c="dimmed" mb="xs">晋升清晰度</Text>
                    <Group justify="space-between">
                      <Text fw={700} size="xl">{company.promotionClarity}</Text>
                      <Badge color={company.promotionClarity >= 80 ? 'green' : company.promotionClarity >= 60 ? 'yellow' : 'red'} size="lg">
                        {company.promotionClarity >= 80 ? '清晰' : company.promotionClarity >= 60 ? '一般' : '模糊'}
                      </Badge>
                    </Group>
                  </Card>
                </Grid.Col>
              </Grid>

              <Alert color="blue" title="建议">
                <Text size="sm">
                  该公司适合追求{company.stabilityScore >= 80 ? '稳定' : '成长'}发展的求职者。
                  {company.promotionClarity >= 80 ? '晋升路径清晰，长期发展潜力良好。' : '晋升机制可能需要进一步了解。'}
                </Text>
              </Alert>
            </Stack>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
};

export default CompanyDetail;
