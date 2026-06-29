/**
 * 职业匹配算法
 * 多维加权计算用户与职业的匹配度
 */

import type { Company } from '../../types/company';
import type { UserProfile } from '../../types/user';
import type { BigFiveScores } from './PersonalityAnalyzer';

export interface CareerMatch {
  careerId: string;
  careerName: string;
  industry: string;
  matchScore: number;
  dimensionScores: {
    personality: number;
    skills: number;
    interests: number;
    values: number;
    market: number;
  };
  reasons: string[];
  risks: string[];
  suggestions: string[];
}

export interface MatchingWeights {
  personality: number;
  skills: number;
  interests: number;
  values: number;
  market: number;
}

export interface CareerMatcherConfig {
  weights: MatchingWeights;
  minMatchScore: number;
  maxResults: number;
}

const DEFAULT_WEIGHTS: MatchingWeights = {
  personality: 0.25,
  skills: 0.25,
  interests: 0.2,
  values: 0.15,
  market: 0.15,
};

const DEFAULT_CONFIG: CareerMatcherConfig = {
  weights: DEFAULT_WEIGHTS,
  minMatchScore: 40,
  maxResults: 10,
};

export interface CareerProfile {
  id: string;
  name: string;
  industry: string;
  requiredPersonality: Partial<BigFiveScores>;
  requiredSkills: string[];
  interests: string[];
  values: string[];
  marketDemand: number;
  salaryRange: [number, number];
}

/**
 * 职业匹配器
 */
export class CareerMatcher {
  private config: CareerMatcherConfig;
  private careerProfiles: CareerProfile[] = [];

  constructor(config?: Partial<CareerMatcherConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 加载职业画像库
   */
  loadCareerProfiles(profiles: CareerProfile[]): void {
    this.careerProfiles = profiles;
  }

  /**
   * 计算用户与职业的匹配度
   */
  match(_user: UserProfile, _companies?: Company[]): CareerMatch[] {
    const matches: CareerMatch[] = [];

    for (const career of this.careerProfiles) {
      const match = this.calculateMatch(_user, career);
      if (match.matchScore >= this.config.minMatchScore) {
        matches.push(match);
      }
    }

    // 按匹配度排序
    matches.sort((a, b) => b.matchScore - a.matchScore);

    // 返回前 N 个结果
    return matches.slice(0, this.config.maxResults);
  }

  /**
   * 计算单个职业的匹配度
   */
  private calculateMatch(user: UserProfile, career: CareerProfile): CareerMatch {
    const personalityScore = this.calculatePersonalityMatch(user, career);
    const skillsScore = this.calculateSkillsMatch(user, career);
    const interestsScore = this.calculateInterestsMatch(user, career);
    const valuesScore = this.calculateValuesMatch(user, career);
    const marketScore = this.calculateMarketMatch(career);

    const dimensionScores = {
      personality: personalityScore,
      skills: skillsScore,
      interests: interestsScore,
      values: valuesScore,
      market: marketScore,
    };

    const matchScore = this.calculateWeightedScore(dimensionScores);
    const reasons = this.generateReasons(dimensionScores, user, career);
    const risks = this.identifyRisks(user, career, dimensionScores);
    const suggestions = this.generateSuggestions(dimensionScores, user, career);

    return {
      careerId: career.id,
      careerName: career.name,
      industry: career.industry,
      matchScore,
      dimensionScores,
      reasons,
      risks,
      suggestions,
    };
  }

  /**
   * 计算人格匹配度
   */
  private calculatePersonalityMatch(user: UserProfile, career: CareerProfile): number {
    if (!user.personality || !career.requiredPersonality) {
      return 50; // 默认中等匹配
    }

    const userPersonality = user.personality;
    const required = career.requiredPersonality;

    let totalDiff = 0;
    let count = 0;

    const traits: Array<keyof BigFiveScores> = [
      'extroversion',
      'openness',
      'conscientiousness',
      'agreeableness',
      'neuroticism',
    ];

    for (const trait of traits) {
      if (required[trait] !== undefined && userPersonality[trait] !== undefined) {
        const diff = Math.abs(userPersonality[trait] - (required[trait] as number));
        totalDiff += diff;
        count++;
      }
    }

    if (count === 0) return 50;

    const avgDiff = totalDiff / count;
    // 差异越小，匹配度越高（100分制）
    return Math.round(100 - avgDiff);
  }

  /**
   * 计算技能匹配度
   */
  private calculateSkillsMatch(user: UserProfile, career: CareerProfile): number {
    if (career.requiredSkills.length === 0) {
      return 70; // 没有明确要求，给默认分
    }

    // 这里简化处理：基于专业匹配
    const userMajor = user.major.toLowerCase();
    const careerName = career.name.toLowerCase();

    // 简单的关键词匹配
    let matchCount = 0;
    for (const skill of career.requiredSkills) {
      if (userMajor.includes(skill.toLowerCase()) || careerName.includes(skill.toLowerCase())) {
        matchCount++;
      }
    }

    return Math.round((matchCount / career.requiredSkills.length) * 100);
  }

  /**
   * 计算兴趣匹配度
   */
  private calculateInterestsMatch(user: UserProfile, career: CareerProfile): number {
    if (user.interests.length === 0 || career.interests.length === 0) {
      return 50;
    }

    const userInterests = user.interests.map((i) => i.toLowerCase());
    const careerInterests = career.interests.map((i) => i.toLowerCase());

    let matchCount = 0;
    for (const careerInterest of careerInterests) {
      if (userInterests.some((ui) => ui.includes(careerInterest) || careerInterest.includes(ui))) {
        matchCount++;
      }
    }

    return Math.round((matchCount / career.interests.length) * 100);
  }

  /**
   * 计算价值观匹配度
   */
  private calculateValuesMatch(user: UserProfile, career: CareerProfile): number {
    const userValues = this.inferUserValues(user);
    const careerValues = career.values;

    if (careerValues.length === 0) {
      return 60;
    }

    let matchCount = 0;
    for (const careerValue of careerValues) {
      if (userValues.includes(careerValue.toLowerCase())) {
        matchCount++;
      }
    }

    return Math.round((matchCount / careerValues.length) * 100);
  }

  /**
   * 推断用户价值观
   */
  private inferUserValues(user: UserProfile): string[] {
    const values: string[] = [];

    if (user.riskPreference === 'aggressive') {
      values.push('创新', '成长', '挑战');
    } else if (user.riskPreference === 'conservative') {
      values.push('稳定', '安全', '工作生活平衡');
    } else {
      values.push('平衡', '发展', '稳定');
    }

    if (user.careerGoals?.includes('管理')) {
      values.push('领导力', '影响力');
    }
    if (user.careerGoals?.includes('技术')) {
      values.push('专业', '技术');
    }

    return values;
  }

  /**
   * 计算市场匹配度
   */
  private calculateMarketMatch(career: CareerProfile): number {
    // 市场匹配度基于职业画像中的市场需求
    return career.marketDemand;
  }

  /**
   * 计算加权总分
   */
  private calculateWeightedScore(dimensionScores: {
    personality: number;
    skills: number;
    interests: number;
    values: number;
    market: number;
  }): number {
    const { weights } = this.config;

    const weightedSum =
      dimensionScores.personality * weights.personality +
      dimensionScores.skills * weights.skills +
      dimensionScores.interests * weights.interests +
      dimensionScores.values * weights.values +
      dimensionScores.market * weights.market;

    const totalWeight =
      weights.personality + weights.skills + weights.interests + weights.values + weights.market;

    return Math.round(weightedSum / totalWeight);
  }

  /**
   * 生成匹配原因
   */
  private generateReasons(
    dimensionScores: ReturnType<typeof this.calculateMatch>['dimensionScores'],
    _user: UserProfile,
    _career: CareerProfile,
  ): string[] {
    const reasons: string[] = [];

    if (dimensionScores.personality > 70) {
      reasons.push('你的性格特质与该职业高度契合');
    }
    if (dimensionScores.skills > 60) {
      reasons.push('你的专业背景与该职业要求匹配');
    }
    if (dimensionScores.interests > 60) {
      reasons.push('你的兴趣方向与该职业一致');
    }
    if (dimensionScores.market > 70) {
      reasons.push('该职业市场需求旺盛');
    }

    if (reasons.length === 0) {
      reasons.push('整体匹配度良好');
    }

    return reasons;
  }

  /**
   * 识别风险
   */
  private identifyRisks(
    _user: UserProfile,
    _career: CareerProfile,
    dimensionScores: ReturnType<typeof this.calculateMatch>['dimensionScores'],
  ): string[] {
    const risks: string[] = [];

    if (dimensionScores.personality < 50) {
      risks.push('性格特质与该职业存在一定差异，需要调整');
    }
    if (dimensionScores.skills < 50) {
      risks.push('需要补充相关技能');
    }
    if (dimensionScores.market < 50) {
      risks.push('该职业市场竞争激烈');
    }

    if (risks.length === 0) {
      risks.push('无明显风险');
    }

    return risks;
  }

  /**
   * 生成建议
   */
  private generateSuggestions(
    dimensionScores: ReturnType<typeof this.calculateMatch>['dimensionScores'],
    _user: UserProfile,
    career: CareerProfile,
  ): string[] {
    const suggestions: string[] = [];

    if (dimensionScores.skills < 60) {
      suggestions.push(`建议补充 ${career.requiredSkills.slice(0, 3).join('、')} 等技能`);
    }
    if (dimensionScores.interests < 60) {
      suggestions.push('建议深入了解该职业的日常工作内容');
    }
    if (dimensionScores.market < 60) {
      suggestions.push('建议关注行业动态，把握市场机会');
    }

    if (suggestions.length === 0) {
      suggestions.push('保持学习，持续提升');
    }

    return suggestions;
  }

  /**
   * 根据公司列表匹配
   */
  matchCompanies(user: UserProfile, companies: Company[]): CareerMatch[] {
    const companyMatches: CareerMatch[] = [];

    for (const company of companies) {
      const match = this.matchCompany(user, company);
      if (match.matchScore >= this.config.minMatchScore) {
        companyMatches.push(match);
      }
    }

    companyMatches.sort((a, b) => b.matchScore - a.matchScore);
    return companyMatches.slice(0, this.config.maxResults);
  }

  /**
   * 计算用户与单个公司的匹配度
   */
  private matchCompany(user: UserProfile, company: Company): CareerMatch {
    const personalityScore = this.calculateCompanyPersonalityMatch(user, company);
    const skillsScore = this.calculateCompanySkillsMatch(user, company);
    const interestsScore = this.calculateCompanyInterestsMatch(user, company);
    const valuesScore = this.calculateCompanyValuesMatch(user, company);
    const marketScore = company.stabilityScore;

    const dimensionScores = {
      personality: personalityScore,
      skills: skillsScore,
      interests: interestsScore,
      values: valuesScore,
      market: marketScore,
    };

    const matchScore = this.calculateWeightedScore(dimensionScores);
    const reasons = this.generateCompanyReasons(company, dimensionScores);
    const risks = this.identifyCompanyRisks(company, dimensionScores);
    const suggestions = this.generateCompanySuggestions(company, dimensionScores);

    return {
      careerId: company.id,
      careerName: company.name,
      industry: company.industry,
      matchScore,
      dimensionScores,
      reasons,
      risks,
      suggestions,
    };
  }

  private calculateCompanyPersonalityMatch(user: UserProfile, company: Company): number {
    // 基于公司标签与用户特质的匹配
    const userTags = user.interests;
    const companyTags = company.tags;

    let matchCount = 0;
    for (const tag of companyTags) {
      if (userTags.some((ut) => ut.includes(tag) || tag.includes(ut))) {
        matchCount++;
      }
    }

    return companyTags.length > 0 ? Math.round((matchCount / companyTags.length) * 100) : 50;
  }

  private calculateCompanySkillsMatch(_user: UserProfile, _company: Company): number {
    // 简化处理
    return 60;
  }

  private calculateCompanyInterestsMatch(user: UserProfile, company: Company): number {
    // 基于用户职业目标与公司行业的匹配
    if (!user.careerGoals) return 50;

    const goalMatch = user.careerGoals.toLowerCase().includes(company.industry.toLowerCase());
    return goalMatch ? 80 : 40;
  }

  private calculateCompanyValuesMatch(user: UserProfile, company: Company): number {
    // 基于公司规模与用户风险偏好的匹配
    const riskScaleMap: Record<string, string> = {
      conservative: 'large',
      balanced: 'medium',
      aggressive: 'startup',
    };

    if (company.scale === riskScaleMap[user.riskPreference]) {
      return 80;
    }

    return 50;
  }

  private generateCompanyReasons(company: Company, dimensionScores: ReturnType<typeof this.matchCompany>['dimensionScores']): string[] {
    const reasons: string[] = [];

    if (company.stabilityScore > 70) {
      reasons.push('公司稳定性较高');
    }
    if (company.promotionClarity > 70) {
      reasons.push('晋升路径清晰');
    }
    if (dimensionScores.personality > 60) {
      reasons.push('公司文化与个人特质匹配');
    }

    return reasons.length > 0 ? reasons : ['整体匹配度良好'];
  }

  private identifyCompanyRisks(company: Company, dimensionScores: ReturnType<typeof this.matchCompany>['dimensionScores']): string[] {
    const risks: string[] = [];

    if (company.stabilityScore < 50) {
      risks.push('公司稳定性有待观察');
    }
    if (company.promotionClarity < 50) {
      risks.push('晋升机制可能不够清晰');
    }
    if (dimensionScores.market < 50) {
      risks.push('行业竞争可能较激烈');
    }

    return risks.length > 0 ? risks : ['无明显风险'];
  }

  private generateCompanySuggestions(company: Company, dimensionScores: ReturnType<typeof this.matchCompany>['dimensionScores']): string[] {
    const suggestions: string[] = [];

    if (dimensionScores.skills < 60) {
      suggestions.push('建议提升相关专业技能');
    }
    if (company.tags.length > 0) {
      suggestions.push(`建议关注 ${company.tags.slice(0, 2).join('、')} 等方向`);
    }

    return suggestions.length > 0 ? suggestions : ['保持学习'];
  }
}

/**
 * 内置职业画像库
 */
export const DEFAULT_CAREER_PROFILES: CareerProfile[] = [
  {
    id: 'frontend-dev',
    name: '前端开发工程师',
    industry: '互联网',
    requiredPersonality: {
      openness: 70,
      conscientiousness: 60,
    },
    requiredSkills: ['JavaScript', 'React', 'CSS', 'HTML'],
    interests: ['技术', '用户体验', '创意'],
    values: ['专业', '创新', '成长'],
    marketDemand: 85,
    salaryRange: [8000, 30000],
  },
  {
    id: 'product-manager',
    name: '产品经理',
    industry: '互联网',
    requiredPersonality: {
      openness: 75,
      extroversion: 65,
      conscientiousness: 70,
    },
    requiredSkills: ['需求分析', '产品设计', '数据分析'],
    interests: ['用户', '商业', '创新'],
    values: ['影响力', '成长', '平衡'],
    marketDemand: 80,
    salaryRange: [10000, 40000],
  },
  {
    id: 'data-analyst',
    name: '数据分析师',
    industry: '互联网',
    requiredPersonality: {
      openness: 65,
      conscientiousness: 75,
    },
    requiredSkills: ['SQL', 'Python', 'Excel', '统计学'],
    interests: ['数据', '分析', '商业'],
    values: ['专业', '准确', '效率'],
    marketDemand: 90,
    salaryRange: [9000, 25000],
  },
  {
    id: 'ux-designer',
    name: 'UI/UX 设计师',
    industry: '互联网',
    requiredPersonality: {
      openness: 85,
      agreeableness: 65,
    },
    requiredSkills: ['Figma', 'Sketch', '用户研究', '交互设计'],
    interests: ['设计', '用户体验', '创意'],
    values: ['美学', '用户价值', '创新'],
    marketDemand: 75,
    salaryRange: [10000, 35000],
  },
  {
    id: 'backend-dev',
    name: '后端开发工程师',
    industry: '互联网',
    requiredPersonality: {
      conscientiousness: 75,
      openness: 60,
    },
    requiredSkills: ['Java', 'Python', '数据库', '系统设计'],
    interests: ['技术', '架构', '性能'],
    values: ['专业', '稳定', '效率'],
    marketDemand: 85,
    salaryRange: [10000, 35000],
  },
  {
    id: 'project-manager',
    name: '项目经理',
    industry: '互联网',
    requiredPersonality: {
      conscientiousness: 80,
      extroversion: 70,
    },
    requiredSkills: ['项目管理', '沟通', '风险管理', 'Agile'],
    interests: ['组织', '协调', '结果'],
    values: ['效率', '团队', '成果'],
    marketDemand: 80,
    salaryRange: [15000, 40000],
  },
  {
    id: 'sales',
    name: '销售代表',
    industry: '销售',
    requiredPersonality: {
      extroversion: 80,
      conscientiousness: 60,
    },
    requiredSkills: ['沟通', '谈判', '客户关系'],
    interests: ['人际', '业绩', '挑战'],
    values: ['收入', '成就', '自由'],
    marketDemand: 75,
    salaryRange: [6000, 30000],
  },
  {
    id: 'hr',
    name: '人力资源',
    industry: '人力资源',
    requiredPersonality: {
      agreeableness: 80,
      conscientiousness: 65,
    },
    requiredSkills: ['招聘', '培训', '员工关系', 'HRM'],
    interests: ['人', '组织', '发展'],
    values: ['关怀', '公平', '成长'],
    marketDemand: 70,
    salaryRange: [8000, 25000],
  },
];
