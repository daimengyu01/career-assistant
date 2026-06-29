/**
 * MBTI 计算逻辑
 * 28题 → 4个维度（E/I, S/N, T/F, J/P）
 */

import type { MBTIResult } from '../../types/assessment';

export interface MBTIQuestion {
  id: string;
  dimension: 'EI' | 'SN' | 'TF' | 'JP';
  direction: 'positive' | 'negative';
  text: string;
  options: Array<{
    value: number;
    label: string;
  }>;
}

export interface MBTIAnswer {
  questionId: string;
  value: number;
}

export interface MBTICalculationResult extends MBTIResult {
  scores: {
    extroversion: number;
    introversion: number;
    sensing: number;
    intuition: number;
    thinking: number;
    feeling: number;
    judging: number;
    perceiving: number;
  };
  rawScores: {
    dimension: string;
    score: number;
  }[];
}

/**
 * MBTI 计算器
 */
export class MBTICalculator {
  private questions: MBTIQuestion[] = [];
  private answers: Map<string, number> = new Map();

  /**
   * 加载题目
   */
  loadQuestions(questions: MBTIQuestion[]): void {
    this.questions = questions;
  }

  /**
   * 记录答案
   */
  recordAnswer(questionId: string, value: number): void {
    this.answers.set(questionId, value);
  }

  /**
   * 批量记录答案
   */
  recordAnswers(answers: MBTIAnswer[]): void {
    answers.forEach((answer) => {
      this.answers.set(answer.questionId, answer.value);
    });
  }

  /**
   * 计算 MBTI 类型
   */
  calculate(): MBTICalculationResult {
    if (this.questions.length === 0) {
      throw new Error('请先加载题目');
    }

    const scores = {
      extroversion: 0,
      introversion: 0,
      sensing: 0,
      intuition: 0,
      thinking: 0,
      feeling: 0,
      judging: 0,
      perceiving: 0,
    };

    // 计算每个维度的得分
    for (const question of this.questions) {
      const answerValue = this.answers.get(question.id) ?? 0;
      const weightedValue = answerValue * (question.direction === 'positive' ? 1 : -1);

      switch (question.dimension) {
        case 'EI':
          if (weightedValue > 0) {
            scores.extroversion += Math.abs(weightedValue);
          } else {
            scores.introversion += Math.abs(weightedValue);
          }
          break;
        case 'SN':
          if (weightedValue > 0) {
            scores.sensing += Math.abs(weightedValue);
          } else {
            scores.intuition += Math.abs(weightedValue);
          }
          break;
        case 'TF':
          if (weightedValue > 0) {
            scores.thinking += Math.abs(weightedValue);
          } else {
            scores.feeling += Math.abs(weightedValue);
          }
          break;
        case 'JP':
          if (weightedValue > 0) {
            scores.judging += Math.abs(weightedValue);
          } else {
            scores.perceiving += Math.abs(weightedValue);
          }
          break;
      }
    }

    // 确定每个维度的倾向
    const dimensions = {
      extroversion: scores.extroversion,
      openness: scores.intuition,
      conscientiousness: scores.judging,
      agreeableness: scores.feeling,
      neuroticism: 50, // 默认值，需要额外问卷计算
    };

    // 计算 MBTI 类型
    const type = this.determineType(scores);

    return {
      type,
      dimensions,
      scores,
      rawScores: [
        { dimension: 'EI', score: scores.extroversion - scores.introversion },
        { dimension: 'SN', score: scores.sensing - scores.intuition },
        { dimension: 'TF', score: scores.thinking - scores.feeling },
        { dimension: 'JP', score: scores.judging - scores.perceiving },
      ],
    };
  }

  /**
   * 确定 MBTI 类型
   */
  private determineType(scores: MBTICalculationResult['scores']): string {
    const type = [
      scores.extroversion >= scores.introversion ? 'E' : 'I',
      scores.sensing >= scores.intuition ? 'S' : 'N',
      scores.thinking >= scores.feeling ? 'T' : 'F',
      scores.judging >= scores.perceiving ? 'J' : 'P',
    ].join('');

    return type;
  }

  /**
   * 获取进度
   */
  getProgress(): { answered: number; total: number; percentage: number } {
    const answered = this.answers.size;
    const total = this.questions.length;
    const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;

    return { answered, total, percentage };
  }

  /**
   * 重置
   */
  reset(): void {
    this.answers.clear();
  }

  /**
   * 获取默认题目（28题标准版）
   */
  static getDefaultQuestions(): MBTIQuestion[] {
    return [
      // E/I 维度（7题）
      {
        id: 'ei-1',
        dimension: 'EI',
        direction: 'positive',
        text: '在社交聚会中，你通常会',
        options: [
          { value: 5, label: '主动与很多人交流，包括陌生人' },
          { value: 4, label: '只与少数熟悉的人交流' },
          { value: 3, label: '介于两者之间' },
          { value: 2, label: '倾向于保持低调' },
          { value: 1, label: '希望尽早离开' },
        ],
      },
      {
        id: 'ei-2',
        dimension: 'EI',
        direction: 'negative',
        text: '你更喜欢以下哪种工作方式？',
        options: [
          { value: 5, label: '与团队一起协作' },
          { value: 4, label: '与少数人合作' },
          { value: 3, label: '介于两者之间' },
          { value: 2, label: '独立完成' },
          { value: 1, label: '完全独立，不受打扰' },
        ],
      },
      {
        id: 'ei-3',
        dimension: 'EI',
        direction: 'positive',
        text: '当你需要充电时，你倾向于',
        options: [
          { value: 5, label: '和朋友出去聚会' },
          { value: 4, label: '与一两个好友相处' },
          { value: 3, label: '看情况而定' },
          { value: 2, label: '独自在家休息' },
          { value: 1, label: '完全独处' },
        ],
      },
      {
        id: 'ei-4',
        dimension: 'EI',
        direction: 'negative',
        text: '在会议上，你通常会',
        options: [
          { value: 5, label: '等别人先说' },
          { value: 4, label: '在想清楚后再发言' },
          { value: 3, label: '看情况而定' },
          { value: 2, label: '积极发表意见' },
          { value: 1, label: '主动主导讨论' },
        ],
      },
      {
        id: 'ei-5',
        dimension: 'EI',
        direction: 'positive',
        text: '你更愿意被描述为',
        options: [
          { value: 5, label: '外向且善于交际' },
          { value: 4, label: '比较外向' },
          { value: 3, label: '介于两者之间' },
          { value: 2, label: '比较内向' },
          { value: 1, label: '内向且善于思考' },
        ],
      },
      {
        id: 'ei-6',
        dimension: 'EI',
        direction: 'negative',
        text: '你如何处理压力？',
        options: [
          { value: 5, label: '找人倾诉' },
          { value: 4, label: '与亲密的朋友聊聊' },
          { value: 3, label: '看情况而定' },
          { value: 2, label: '自己思考处理' },
          { value: 1, label: '独自消化' },
        ],
      },
      {
        id: 'ei-7',
        dimension: 'EI',
        direction: 'positive',
        text: '在社交场合中，你通常感觉',
        options: [
          { value: 5, label: '精力充沛，充满活力' },
          { value: 4, label: '比较放松' },
          { value: 3, label: '看情况而定' },
          { value: 2, label: '有点疲惫' },
          { value: 1, label: '筋疲力尽' },
        ],
      },

      // S/N 维度（7题）
      {
        id: 'sn-1',
        dimension: 'SN',
        direction: 'positive',
        text: '你更关注',
        options: [
          { value: 5, label: '当下的现实和细节' },
          { value: 4, label: '偏现实' },
          { value: 3, label: '介于两者之间' },
          { value: 2, label: '偏未来的可能' },
          { value: 1, label: '未来的愿景和可能性' },
        ],
      },
      {
        id: 'sn-2',
        dimension: 'SN',
        direction: 'negative',
        text: '你更信任',
        options: [
          { value: 5, label: '确凿的事实和数据' },
          { value: 4, label: '偏事实' },
          { value: 3, label: '介于两者之间' },
          { value: 2, label: '偏直觉' },
          { value: 1, label: '直觉和灵感' },
        ],
      },
      {
        id: 'sn-3',
        dimension: 'SN',
        direction: 'positive',
        text: '你更喜欢的工作是',
        options: [
          { value: 5, label: '有明确流程和步骤的' },
          { value: 4, label: '偏明确' },
          { value: 3, label: '介于两者之间' },
          { value: 2, label: '偏创新' },
          { value: 1, label: '需要创新和想象力的' },
        ],
      },
      {
        id: 'sn-4',
        dimension: 'SN',
        direction: 'negative',
        text: '你通常被以下哪种描述吸引？',
        options: [
          { value: 5, label: '实用性和实用性' },
          { value: 4, label: '偏实用' },
          { value: 3, label: '介于两者之间' },
          { value: 2, label: '偏理论' },
          { value: 1, label: '理论和概念' },
        ],
      },
      {
        id: 'sn-5',
        dimension: 'SN',
        direction: 'positive',
        text: '在描述事情时，你倾向于',
        options: [
          { value: 5, label: '详细描述具体细节' },
          { value: 4, label: '偏详细' },
          { value: 3, label: '介于两者之间' },
          { value: 2, label: '偏概括' },
          { value: 1, label: '简洁概括要点' },
        ],
      },
      {
        id: 'sn-6',
        dimension: 'SN',
        direction: 'negative',
        text: '你更感兴趣的是',
        options: [
          { value: 5, label: '实际应用' },
          { value: 4, label: '偏实际' },
          { value: 3, label: '介于两者之间' },
          { value: 2, label: '偏理论' },
          { value: 1, label: '理论探索' },
        ],
      },
      {
        id: 'sn-7',
        dimension: 'SN',
        direction: 'positive',
        text: '你更看重',
        options: [
          { value: 5, label: '经验和 precedent' },
          { value: 4, label: '偏经验' },
          { value: 3, label: '介于两者之间' },
          { value: 2, label: '偏创新' },
          { value: 1, label: '创新和突破' },
        ],
      },

      // T/F 维度（7题）
      {
        id: 'tf-1',
        dimension: 'TF',
        direction: 'positive',
        text: '做决定时，你更看重',
        options: [
          { value: 5, label: '逻辑和客观分析' },
          { value: 4, label: '偏逻辑' },
          { value: 3, label: '介于两者之间' },
          { value: 2, label: '偏情感' },
          { value: 1, label: '个人价值观和情感' },
        ],
      },
      {
        id: 'tf-2',
        dimension: 'TF',
        direction: 'negative',
        text: '你认为哪种品质更重要？',
        options: [
          { value: 5, label: '公正和原则' },
          { value: 4, label: '偏公正' },
          { value: 3, label: '介于两者之间' },
          { value: 2, label: '偏同理心' },
          { value: 1, label: '同理心和关怀' },
        ],
      },
      {
        id: 'tf-3',
        dimension: 'TF',
        direction: 'positive',
        text: '当朋友遇到困难时，你通常会',
        options: [
          { value: 5, label: '提供解决方案和建议' },
          { value: 4, label: '偏解决' },
          { value: 3, label: '介于两者之间' },
          { value: 2, label: '偏安慰' },
          { value: 1, label: '提供情感支持' },
        ],
      },
      {
        id: 'tf-4',
        dimension: 'TF',
        direction: 'negative',
        text: '你更倾向于认为',
        options: [
          { value: 5, label: '真理就是真理，不管是否伤人' },
          { value: 4, label: '偏真理' },
          { value: 3, label: '介于两者之间' },
          { value: 2, label: '偏和谐' },
          { value: 1, label: '和谐比真理更重要' },
        ],
      },
      {
        id: 'tf-5',
        dimension: 'TF',
        direction: 'positive',
        text: '评价一个决定时，你更关注',
        options: [
          { value: 5, label: '是否合理有效' },
          { value: 4, label: '偏合理' },
          { value: 3, label: '介于两者之间' },
          { value: 2, label: '偏影响' },
          { value: 1, label: '对他人的影响' },
        ],
      },
      {
        id: 'tf-6',
        dimension: 'TF',
        direction: 'negative',
        text: '你更被什么打动？',
        options: [
          { value: 5, label: '精湛的逻辑论证' },
          { value: 4, label: '偏逻辑' },
          { value: 3, label: '介于两者之间' },
          { value: 2, label: '偏情感' },
          { value: 1, label: '真诚的情感表达' },
        ],
      },
      {
        id: 'tf-7',
        dimension: 'TF',
        direction: 'positive',
        text: '你认为领导应该',
        options: [
          { value: 5, label: '公正决策，即使让人不快' },
          { value: 4, label: '偏公正' },
          { value: 3, label: '介于两者之间' },
          { value: 2, label: '偏关怀' },
          { value: 1, label: '优先考虑团队感受' },
        ],
      },

      // J/P 维度（7题）
      {
        id: 'jp-1',
        dimension: 'JP',
        direction: 'positive',
        text: '你更喜欢的生活方式是',
        options: [
          { value: 5, label: '有计划、有结构' },
          { value: 4, label: '偏计划' },
          { value: 3, label: '介于两者之间' },
          { value: 2, label: '偏灵活' },
          { value: 1, label: '随性、灵活' },
        ],
      },
      {
        id: 'jp-2',
        dimension: 'JP',
        direction: 'negative',
        text: '对待截止日期，你通常',
        options: [
          { value: 5, label: '提前完成' },
          { value: 4, label: '偏提前' },
          { value: 3, label: '介于两者之间' },
          { value: 2, label: '偏临近' },
          { value: 1, label: '最后时刻冲刺' },
        ],
      },
      {
        id: 'jp-3',
        dimension: 'JP',
        direction: 'positive',
        text: '你更喜欢',
        options: [
          { value: 5, label: '明确的规定和规则' },
          { value: 4, label: '偏明确' },
          { value: 3, label: '介于两者之间' },
          { value: 2, label: '偏灵活' },
          { value: 1, label: '灵活处理' },
        ],
      },
      {
        id: 'jp-4',
        dimension: 'JP',
        direction: 'negative',
        text: '你更享受',
        options: [
          { value: 5, label: '完成任务后的放松' },
          { value: 4, label: '偏完成' },
          { value: 3, label: '介于两者之间' },
          { value: 2, label: '偏过程' },
          { value: 1, label: '探索新事物的过程' },
        ],
      },
      {
        id: 'jp-5',
        dimension: 'JP',
        direction: 'positive',
        text: '你的桌面/工作区通常是',
        options: [
          { value: 5, label: '井井有条，分类清晰' },
          { value: 4, label: '偏整洁' },
          { value: 3, label: '介于两者之间' },
          { value: 2, label: '偏随性' },
          { value: 1, label: '比较随意' },
        ],
      },
      {
        id: 'jp-6',
        dimension: 'JP',
        direction: 'negative',
        text: '旅行时，你倾向于',
        options: [
          { value: 5, label: '提前规划好每一天' },
          { value: 4, label: '偏规划' },
          { value: 3, label: '介于两者之间' },
          { value: 2, label: '偏随性' },
          { value: 1, label: '到了再说' },
        ],
      },
      {
        id: 'jp-7',
        dimension: 'JP',
        direction: 'positive',
        text: '你认为',
        options: [
          { value: 5, label: '遵守承诺很重要' },
          { value: 4, label: '偏重要' },
          { value: 3, label: '介于两者之间' },
          { value: 2, label: '偏灵活' },
          { value: 1, label: '随情况变化调整更好' },
        ],
      },
    ];
  }
}
