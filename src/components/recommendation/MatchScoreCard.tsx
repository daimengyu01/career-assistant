import React from 'react';
import { Card, Text, Badge, Stack, Group, Progress, Divider } from '@mantine/core';
import type { Company } from '../../types/company';

interface MatchScoreCardProps {
  company: Company;
  matchScore: number;
  reasons: string[];
  onClick?: () => void;
}

const MatchScoreCard: React.FC<MatchScoreCardProps> = ({ company, matchScore, reasons, onClick }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '高度匹配';
    if (score >= 60) return '较为匹配';
    return '一般匹配';
  };

  return (
    <Card
      withBorder
      shadow="sm"
      padding="lg"
      radius="md"
      style={{ cursor: onClick ? 'pointer' : 'default', height: '100%' }}
      onClick={onClick}
    >
      <Stack gap="sm">
        <Group justify="space-between">
          <div>
            <Text fw={500} size="lg" lineClamp={1}>
              {company.name}
            </Text>
            <Text size="sm" c="dimmed">
              {company.industry}
            </Text>
          </div>
          <Badge color={getScoreColor(matchScore)} size="lg" variant="filled">
            {matchScore} 分
          </Badge>
        </Group>

        <Group gap="xs">
          <Badge color="blue" variant="light" size="sm">
            {company.scale === 'large' ? '大型' : company.scale === 'medium' ? '中型' : '初创'}
          </Badge>
          <Badge variant="light" color="gray" size="sm">
            {company.location.city}
          </Badge>
        </Group>

        <Progress value={matchScore} color={getScoreColor(matchScore)} size="sm" radius="xl" />

        <Text size="xs" c="dimmed" ta="center">
          {getScoreLabel(matchScore)}
        </Text>

        {reasons.length > 0 && (
          <>
            <Divider my="xs" />
            <Stack gap="xs">
              <Text size="xs" fw={500} c="dimmed">
                推荐理由:
              </Text>
              {reasons.slice(0, 3).map((reason, index) => (
                <Text key={index} size="xs" c="dimmed">
                  • {reason}
                </Text>
              ))}
            </Stack>
          </>
        )}
      </Stack>
    </Card>
  );
};

export default MatchScoreCard;
