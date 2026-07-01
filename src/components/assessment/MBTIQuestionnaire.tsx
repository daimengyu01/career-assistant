import React, { useState, useMemo } from 'react';
import { Container, Title, Text, Stack, Button, Group, Progress, Radio, Card, Alert } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { useAssessmentStore } from '../../stores/useAssessmentStore';
import { useUserStore } from '../../stores/useUserStore';

interface Question {
  id: number;
  text: string;
  dimension: 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';
  reverse?: boolean;
}

const questions: Question[] = [
  { id: 1, text: '在社交聚会中，你通常会主动与陌生人交谈。', dimension: 'E' },
  { id: 2, text: '你更喜欢独处的时间来充电和反思。', dimension: 'I', reverse: true },
  { id: 3, text: '在做决定时，你更依赖逻辑分析而非情感。', dimension: 'T' },
  { id: 4, text: '你很容易注意到周围人的情绪变化。', dimension: 'F' },
  { id: 5, text: '你喜欢按照计划行事，而不是随机应变。', dimension: 'J' },
  { id: 6, text: '你更喜欢灵活应对变化，而不是严格遵循计划。', dimension: 'P', reverse: true },
  { id: 7, text: '你更关注大局和整体概念，而非细节。', dimension: 'N' },
  { id: 8, text: '你更喜欢具体、实际的信息而非抽象理论。', dimension: 'S' },
  { id: 9, text: '在团队中，你通常是那个发起话题的人。', dimension: 'E' },
  { id: 10, text: '你更喜欢观察和倾听，而不是主导对话。', dimension: 'I', reverse: true },
  { id: 11, text: '你认为保持和谐的人际关系非常重要。', dimension: 'F' },
  { id: 12, text: '你更看重公平和真理，即使会伤害感情。', dimension: 'T', reverse: true },
  { id: 13, text: '你喜欢提前做好安排，避免最后一刻的匆忙。', dimension: 'J' },
  { id: 14, text: '你享受即兴和随性的生活方式。', dimension: 'P' },
  { id: 15, text: '你经常思考事物的可能性和潜在联系。', dimension: 'N' },
  { id: 16, text: '你更相信已经验证过的事实和经验。', dimension: 'S', reverse: true },
  { id: 17, text: '在人群中，你感觉精力充沛。', dimension: 'E' },
  { id: 18, text: '长时间社交后，你需要独处来恢复精力。', dimension: 'I' },
  { id: 19, text: '你倾向于基于价值观做出判断。', dimension: 'F' },
  { id: 20, text: '你倾向于基于客观标准做出判断。', dimension: 'T' },
  { id: 21, text: '你喜欢有明确的时间表和截止日期。', dimension: 'J' },
  { id: 22, text: '你更喜欢开放式、没有严格时间限制的环境。', dimension: 'P', reverse: true },
  { id: 23, text: '你经常想象未来的各种可能性。', dimension: 'N' },
  { id: 24, text: '你更相信已经验证过的事实和经验。', dimension: 'S' },
  { id: 25, text: '你很容易结识新朋友。', dimension: 'E' },
  { id: 26, text: '你只有在小圈子里才感到舒适自在。', dimension: 'I', reverse: true },
  { id: 27, text: '你经常帮助他人解决问题。', dimension: 'F' },
  { id: 28, text: '你更注重效率和效果，而不是他人的感受。', dimension: 'T', reverse: true },
];

const MBTIQuestionnaire: React.FC = () => {
  const navigate = useNavigate();
  const addResult = useAssessmentStore((state) => state.addResult);
  const profile = useUserStore((state) => state.profile);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);

  const progress = useMemo(() => {
    return Math.round(((currentQuestion + 1) / questions.length) * 100);
  }, [currentQuestion]);

  const calculateResult = () => {
    const scores: Record<string, number> = {
      E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0,
    };

    questions.forEach((q) => {
      const answer = answers[q.id];
      if (answer !== undefined) {
        const value = q.reverse ? (6 - answer) : answer;
        scores[q.dimension] += value;
      }
    });

    const type = [
      scores.E >= scores.I ? 'E' : 'I',
      scores.S >= scores.N ? 'S' : 'N',
      scores.T >= scores.F ? 'T' : 'F',
      scores.J >= scores.P ? 'J' : 'P',
    ].join('');

    return {
      type,
      dimensions: {
        extroversion: scores.E,
        openness: scores.N,
        conscientiousness: scores.J,
        agreeableness: scores.F,
        neuroticism: scores.I,
      },
    };
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== questions.length) {
      setError('请回答所有问题');
      return;
    }

    setError(null);

    try {
      const result = calculateResult();

      // 生成 AI insights（不阻塞主流程）
      let aiInsights: string | undefined;
      try {
        if (window.electronAPI?.chatWithAI) {
          const dimensionDesc = `外向性:${result.dimensions.extroversion}, 开放性:${result.dimensions.openness}, 尽责性:${result.dimensions.conscientiousness}, 宜人性:${result.dimensions.agreeableness}, 情绪稳定性:${result.dimensions.neuroticism}`;
          const prompt = `你是一位职业规划专家。用户完成了 MBTI 测评，结果是：${result.type}（${dimensionDesc}）。请用中文分析：1. 该性格类型的职业优势 2. 适合的职业方向 3. 需要注意的短板。请用 JSON 格式返回：{"strengths": [...], "careers": [...], "cautions": [...]}`;
          const aiResponse = await window.electronAPI.chatWithAI([
            { role: 'user', content: prompt },
          ]);
          // 验证返回内容为合法 JSON（兼容 markdown 代码块包裹）
          let jsonStr = aiResponse.trim();
          const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1].trim();
          }
          JSON.parse(jsonStr);
          aiInsights = jsonStr;
        }
      } catch (aiErr) {
        // AI 调用失败，不阻塞跳转
        console.warn('AI insights 生成失败:', aiErr);
      }

      const assessmentResult = {
        id: Date.now().toString(),
        userId: profile?.id || 'guest',
        type: 'personality' as const,
        data: result,
        aiInsights,
        createdAt: new Date().toISOString(),
      };

      addResult(assessmentResult);

      if (window.electronAPI?.saveAssessment) {
        await window.electronAPI.saveAssessment(assessmentResult);
      }

      if (profile) {
        useUserStore.getState().updateProfile({
          personality: {
            ...profile.personality,
            mbti: result.type,
            ...result.dimensions,
          },
        });
      }

      navigate('/assessment/result', { state: { result: assessmentResult, aiInsights } });
    } catch (err) {
      setError('保存评估结果失败，请重试');
    }
  };

  const handleNext = () => {
    if (answers[currentQuestion] === undefined) {
      setError('请选择一个答案');
      return;
    }
    setError(null);
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    setError(null);
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const question = questions[currentQuestion];

  return (
    <Container size="md" py="xl">
      <Title order={2} mb="xs">
        MBTI 性格测试
      </Title>
      <Text c="dimmed" mb="lg">
        请根据你的真实情况选择最符合的选项
      </Text>

      <Progress value={progress} mb="xl" size="lg" radius="xl" />
      <Group justify="space-between" mb="md">
        <Text size="sm" c="dimmed">
          问题 {currentQuestion + 1} / {questions.length}
        </Text>
        <Text size="sm" c="dimmed">
          完全同意 / 不同意
        </Text>
      </Group>

      <Card withBorder shadow="sm" radius="md" padding="xl" mb="lg">
        <Stack gap="lg">
          <Text size="lg" fw={500}>
            {question.text}
          </Text>

          <Radio.Group
            value={answers[question.id]?.toString()}
            onChange={(val) => {
              setAnswers((prev) => ({ ...prev, [question.id]: Number(val) }));
              setError(null);
            }}
          >
            <Stack gap="sm">
              {[1, 2, 3, 4, 5].map((val) => (
                <Radio.Card
                  key={val}
                  value={val.toString()}
                  p="md"
                  style={{ cursor: 'pointer' }}
                >
                  <Group justify="space-between">
                    <Text size="sm">
                      {val === 1 && '完全不同意'}
                      {val === 2 && '不太同意'}
                      {val === 3 && '中立'}
                      {val === 4 && '比较同意'}
                      {val === 5 && '完全同意'}
                    </Text>
                  </Group>
                </Radio.Card>
              ))}
            </Stack>
          </Radio.Group>

          {error && (
            <Alert color="red" title="提示">
              {error}
            </Alert>
          )}
        </Stack>
      </Card>

      <Group justify="space-between">
        <Button
          variant="default"
          leftSection={<IconArrowLeft size={16} />}
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          上一题
        </Button>
        <Group>
          <Button variant="subtle" onClick={() => navigate('/assessment')}>
            退出测试
          </Button>
          {currentQuestion === questions.length - 1 ? (
            <Button onClick={handleSubmit} color="green">
              查看结果
            </Button>
          ) : (
            <Button
              rightSection={<IconArrowRight size={16} />}
              onClick={handleNext}
            >
              下一题
            </Button>
          )}
        </Group>
      </Group>
    </Container>
  );
};

export default MBTIQuestionnaire;
