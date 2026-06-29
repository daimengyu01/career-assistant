/**
 * 五大人格分析（Big Five）
 * 基于 OCEAN 模型分析人格特质
 */

export interface BigFiveScores {
  openness: number;
  conscientiousness: number;
  extroversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface BigFiveResult extends BigFiveScores {
  profile: string;
  strengths: string[];
  weaknesses: string[];
  careerFit: string[];
  workStyle: string;
  developmentAreas: string[];
}

export interface PersonalityAnalyzerConfig {
  opennessWeight: number;
  conscientiousnessWeight: number;
  extroversionWeight: number;
  agreeablenessWeight: number;
  neuroticismWeight: number;
}

const DEFAULT_CONFIG: PersonalityAnalyzerConfig = {
  opennessWeight: 1,
  conscientiousnessWeight: 1,
  extroversionWeight: 1,
  agreeablenessWeight: 1,
  neuroticismWeight: 1,
};

export class PersonalityAnalyzer {
  private config: PersonalityAnalyzerConfig;

  constructor(config?: Partial<PersonalityAnalyzerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 分析人格特质
   */
  analyze(scores: BigFiveScores): BigFiveResult {
    const { openness, conscientiousness, extroversion, agreeableness, neuroticism } = scores;

    // 标准化分数到 0-100
    const normalizedScores: BigFiveScores = {
      openness: this.normalizeScore(openness),
      conscientiousness: this.normalizeScore(conscientiousness),
      extroversion: this.normalizeScore(extroversion),
      agreeableness: this.normalizeScore(agreeableness),
      neuroticism: this.normalizeScore(neuroticism),
    };

    // 确定主导特质
    const dominantTrait = this.getDominantTrait(normalizedScores);

    // 生成分析结果
    const profile = this.generateProfile(dominantTrait, normalizedScores);
    const strengths = this.identifyStrengths(normalizedScores);
    const weaknesses = this.identifyWeaknesses(normalizedScores);
    const careerFit = this.recommendCareers(normalizedScores);
    const workStyle = this.describeWorkStyle(normalizedScores);
    const developmentAreas = this.identifyDevelopmentAreas(normalizedScores);

    return {
      ...normalizedScores,
      profile,
      strengths,
      weaknesses,
      careerFit,
      workStyle,
      developmentAreas,
    };
  }

  /**
   * 标准化分数
   */
  private normalizeScore(score: number): number {
    // 假设原始分数范围是 0-100，直接返回
    return Math.min(100, Math.max(0, score));
  }

  /**
   * 获取主导特质
   */
  private getDominantTrait(scores: BigFiveScores): keyof BigFiveScores {
    const entries = Object.entries(scores) as [keyof BigFiveScores, number][];
    return entries.reduce((a, b) => (a[1] > b[1] ? a : b))[0];
  }

  /**
   * 生成人格画像
   */
  private generateProfile(dominantTrait: keyof BigFiveScores, _scores: BigFiveScores): string {
    const traits: Record<string, string> = {
      openness: '创意探索型',
      conscientiousness: '稳健可靠型',
      extroversion: '社交活力型',
      agreeableness: '合作共情型',
      neuroticism: '敏感谨慎型',
    };

    const descriptions: Record<string, string> = {
      openness: `你是一个富有创造力和好奇心的人，喜欢探索新思想和可能性。你对艺术、文化和抽象概念有浓厚兴趣，善于从不同角度看问题。`,
      conscientiousness: `你是一个自律、有条理、负责任的人。你注重细节，善于规划和执行，是团队中可靠的中坚力量。`,
      extroversion: `你是一个外向、充满活力的人，善于社交和表达。你从与人互动中获得能量，是天生的沟通者和领导者。`,
      agreeableness: `你是一个善良、合作、富有同理心的人。你重视和谐，善于倾听和支持他人，是团队中的粘合剂。`,
      neuroticism: `你是一个敏感、谨慎、深思熟虑的人。你对情绪有深刻感知，善于预见风险，但需要注意情绪管理。`,
    };

    return `${traits[dominantTrait]}：${descriptions[dominantTrait]}`;
  }

  /**
   * 识别优势
   */
  private identifyStrengths(scores: BigFiveScores): string[] {
    const strengths: string[] = [];

    if (scores.openness > 70) {
      strengths.push('创新思维和创造力');
    }
    if (scores.conscientiousness > 70) {
      strengths.push('高度的自律和组织能力');
    }
    if (scores.extroversion > 70) {
      strengths.push('出色的沟通和社交能力');
    }
    if (scores.agreeableness > 70) {
      strengths.push('优秀的团队协作和同理心');
    }
    if (scores.neuroticism < 40) {
      strengths.push('情绪稳定和抗压能力');
    }

    if (strengths.length === 0) {
      strengths.push('平衡的综合能力');
    }

    return strengths;
  }

  /**
   * 识别劣势
   */
  private identifyWeaknesses(scores: BigFiveScores): string[] {
    const weaknesses: string[] = [];

    if (scores.openness < 40) {
      weaknesses.push('对变革和新事物的接受度较低');
    }
    if (scores.conscientiousness < 40) {
      weaknesses.push('需要提升时间管理和计划能力');
    }
    if (scores.extroversion < 40) {
      weaknesses.push('在社交场合中可能显得拘谨');
    }
    if (scores.agreeableness < 40) {
      weaknesses.push('可能在团队合作中显得过于直接');
    }
    if (scores.neuroticism > 60) {
      weaknesses.push('容易焦虑和情绪波动');
    }

    if (weaknesses.length === 0) {
      weaknesses.push('无明显短板');
    }

    return weaknesses;
  }

  /**
   * 推荐职业方向
   */
  private recommendCareers(scores: BigFiveScores): string[] {
    const careers: string[] = [];

    if (scores.openness > 70) {
      careers.push('产品经理', 'UI/UX 设计师', '数据分析师', '研发工程师');
    }
    if (scores.conscientiousness > 70) {
      careers.push('项目经理', '财务分析师', '法务顾问', '质量管理');
    }
    if (scores.extroversion > 70) {
      careers.push('销售代表', '市场营销', '公关专员', '人力资源');
    }
    if (scores.agreeableness > 70) {
      careers.push('心理咨询师', '教师', '社会工作者', '客户成功');
    }
    if (scores.neuroticism > 60) {
      careers.push('研究员', '作家', '艺术家', '独立开发者');
    }

    // 去重
    return [...new Set(careers)];
  }

  /**
   * 描述工作风格
   */
  private describeWorkStyle(scores: BigFiveScores): string {
    const styles: string[] = [];

    if (scores.conscientiousness > 70) {
      styles.push('你倾向于按计划行事，注重细节和交付质量');
    }
    if (scores.extroversion > 70) {
      styles.push('你喜欢在团队中工作，善于协作和沟通');
    }
    if (scores.openness > 70) {
      styles.push('你乐于接受新挑战，善于创新思维');
    }
    if (scores.agreeableness > 70) {
      styles.push('你注重团队和谐，乐于助人');
    }
    if (scores.neuroticism > 60) {
      styles.push('你做事谨慎，善于风险评估');
    }

    if (styles.length === 0) {
      return '你的工作风格比较平衡，能够适应不同的工作环境。';
    }

    return styles.join('。') + '。';
  }

  /**
   * 识别发展领域
   */
  private identifyDevelopmentAreas(scores: BigFiveScores): string[] {
    const areas: string[] = [];

    if (scores.openness < 50) {
      areas.push('提升对新鲜事物的开放度，培养创新思维');
    }
    if (scores.conscientiousness < 50) {
      areas.push('加强自律和时间管理能力');
    }
    if (scores.extroversion < 50) {
      areas.push('提升社交自信和表达能力');
    }
    if (scores.agreeableness < 50) {
      areas.push('培养同理心和团队协作意识');
    }
    if (scores.neuroticism > 50) {
      areas.push('学习情绪管理和压力应对技巧');
    }

    if (areas.length === 0) {
      areas.push('保持现有优势，持续精进');
    }

    return areas;
  }

  /**
   * 计算综合得分
   */
  calculateOverallScore(scores: BigFiveScores): number {
    const weightedSum =
      scores.openness * this.config.opennessWeight +
      scores.conscientiousness * this.config.conscientiousnessWeight +
      scores.extroversion * this.config.extroversionWeight +
      scores.agreeableness * this.config.agreeablenessWeight +
      scores.neuroticism * this.config.neuroticismWeight;

    const totalWeight =
      this.config.opennessWeight +
      this.config.conscientiousnessWeight +
      this.config.extroversionWeight +
      this.config.agreeablenessWeight +
      this.config.neuroticismWeight;

    return Math.round(weightedSum / totalWeight);
  }

  /**
   * 生成人格类型标签
   */
  generateTypeLabels(scores: BigFiveScores): string[] {
    const labels: string[] = [];

    if (scores.openness > 70) labels.push('创新者');
    if (scores.conscientiousness > 70) labels.push('执行者');
    if (scores.extroversion > 70) labels.push('社交家');
    if (scores.agreeableness > 70) labels.push('合作者');
    if (scores.neuroticism > 60) labels.push('思考者');

    if (labels.length === 0) {
      labels.push('全能型');
    }

    return labels;
  }
}
