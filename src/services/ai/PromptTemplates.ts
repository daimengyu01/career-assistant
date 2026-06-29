/**
 * Prompt 模板集合
 * 包含个人评估、企业评估、职业推荐、风险分析四个内置模板
 */

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
  temperature?: number;
  maxTokens?: number;
  variables: string[];
}

export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  personal_assessment: {
    id: 'personal_assessment',
    name: '个人评估',
    description: '基于用户画像和测评结果，生成全面的个人职业能力评估报告',
    systemPrompt: `你是一位资深的职业规划顾问和心理学测评专家。你的任务是根据用户提供的个人信息和测评数据，生成一份专业、客观、有深度的个人职业评估报告。

要求：
1. 分析用户的 MBTI 人格类型与职业倾向的匹配度
2. 结合五大人格特质（大五人格）分析其职业优势与潜在风险
3. 基于专业背景和兴趣方向，评估当前职业发展路径的合理性
4. 提供具体、可执行的个人成长建议
5. 使用专业但易懂的语言，避免过度学术化`,
    userPromptTemplate: `请基于以下用户信息进行个人职业评估：

## 用户基本信息
- 姓名：{{name}}
- 年龄：{{age}}岁
- 专业：{{major}}
- 学历：{{education}}
- 毕业年份：{{graduationYear}}

## MBTI 人格类型
- 类型：{{mbtiType}}
- 外向性 (E/I)：{{extroversion}}（{{extroversionLevel}}）
- 开放性 (O)：{{openness}}（{{opennessLevel}}）
- 尽责性 (C)：{{conscientiousness}}（{{conscientiousnessLevel}}）
- 宜人性 (A)：{{agreeableness}}（{{agreeablenessLevel}}）
- 神经质 (N)：{{neuroticism}}（{{neuroticismLevel}}）

## 五大人格特质得分
- 外向性：{{opennessScore}}/100
- 尽责性：{{conscientiousnessScore}}/100
- 外向性：{{extroversionScore}}/100
- 宜人性：{{agreeablenessScore}}/100
- 神经质：{{neuroticismScore}}/100

## 职业相关偏好
- 职业目标：{{careerGoals}}
- 风险偏好：{{riskPreference}}
- 兴趣爱好：{{interests}}

请按以下结构输出评估报告：
1. 人格特质综合分析（300字以内）
2. 职业优势与适合岗位方向（200字以内）
3. 潜在发展风险与注意事项（200字以内）
4. 具体行动计划建议（3-5条）`,
    temperature: 0.7,
    maxTokens: 2000,
    variables: [
      'name',
      'age',
      'major',
      'education',
      'graduationYear',
      'mbtiType',
      'extroversion',
      'openness',
      'conscientiousness',
      'agreeableness',
      'neuroticism',
      'opennessScore',
      'conscientiousnessScore',
      'extroversionScore',
      'agreeablenessScore',
      'neuroticismScore',
      'careerGoals',
      'riskPreference',
      'interests',
    ],
  },

  company_evaluation: {
    id: 'company_evaluation',
    name: '企业评估',
    description: '对目标公司进行全面评估，分析稳定性、发展前景和适配度',
    systemPrompt: `你是一位企业战略分析师和人力资源顾问。你的任务是对用户关注的公司进行全面、客观的评估分析。

要求：
1. 从公司规模、融资阶段、行业地位等维度分析稳定性
2. 评估晋升机制清晰度和职业成长空间
3. 分析公司文化与用户个人特质的匹配度
4. 识别潜在风险因素（如行业周期、政策风险等）
5. 提供客观的风险评级和决策建议`,
    userPromptTemplate: `请对以下公司进行全面评估分析：

## 公司基本信息
- 公司名称：{{companyName}}
- 所属行业：{{industry}}
- 公司规模：{{scale}}
- 融资阶段：{{fundingStage}}
- 所在城市：{{location}}

## 用户背景
- 专业背景：{{userMajor}}
- MBTI 类型：{{mbtiType}}
- 职业目标：{{careerGoals}}
- 风险偏好：{{riskPreference}}

## 现有评估数据
- 稳定性评分：{{stabilityScore}}/100
- 晋升清晰度：{{promotionClarity}}/100
- 标签：{{tags}}

请按以下结构输出评估报告：
1. 公司综合稳定性分析（200字以内）
2. 职业发展与晋升空间评估（200字以内）
3. 与用户特质的匹配度分析（200字以内）
4. 主要风险点提示（100字以内）
5. 总体建议与评级（S/A/B/C/D）`,
    temperature: 0.6,
    maxTokens: 1800,
    variables: [
      'companyName',
      'industry',
      'scale',
      'fundingStage',
      'location',
      'userMajor',
      'mbtiType',
      'careerGoals',
      'riskPreference',
      'stabilityScore',
      'promotionClarity',
      'tags',
    ],
  },

  career_recommendation: {
    id: 'career_recommendation',
    name: '智能推荐',
    description: '基于用户画像和测评数据，智能推荐适合的职业方向',
    systemPrompt: `你是一位专业的职业规划顾问，熟悉各类行业发展趋势和岗位要求。你的任务是根据用户的个人特质、技能背景和兴趣偏好，推荐最匹配的职业方向。

要求：
1. 结合 MBTI 和大五人格分析职业适配性
2. 考虑专业背景、技能储备和兴趣方向
3. 推荐 3-5 个具体职业方向
4. 每个方向包含匹配度分析、发展路径、所需能力提升建议
5. 提供短期（1年）、中期（3年）、长期（5年）的职业规划建议`,
    userPromptTemplate: `请基于以下信息，为用户生成职业方向推荐报告：

## 用户画像
- 姓名：{{name}}
- 年龄：{{age}}岁
- 专业：{{major}}
- 学历：{{education}}
- MBTI 类型：{{mbtiType}}

## 人格特质
- 外向性：{{extroversionScore}}/100
- 开放性：{{opennessScore}}/100
- 尽责性：{{conscientiousnessScore}}/100
- 宜人性：{{agreeablenessScore}}/100
- 神经质：{{neuroticismScore}}/100

## 职业偏好
- 职业目标：{{careerGoals}}
- 风险偏好：{{riskPreference}}
- 兴趣爱好：{{interests}}

## 当前状态
- 毕业年份：{{graduationYear}}
- 当前阶段：{{currentStage}}

请按以下结构输出推荐报告：
1. 职业方向总览（3-5个方向，含匹配度百分比）
2. 每个方向的详细分析（岗位描述、适配原因、发展前景）
3. 能力提升路径建议
4. 短期/中期/长期规划建议`,
    temperature: 0.8,
    maxTokens: 2500,
    variables: [
      'name',
      'age',
      'major',
      'education',
      'mbtiType',
      'extroversionScore',
      'opennessScore',
      'conscientiousnessScore',
      'agreeablenessScore',
      'neuroticismScore',
      'careerGoals',
      'riskPreference',
      'interests',
      'graduationYear',
      'currentStage',
    ],
  },

  risk_analysis: {
    id: 'risk_analysis',
    name: '风险分析',
    description: '分析求职过程中的潜在风险，提供风险缓解策略',
    systemPrompt: `你是一位风险管理顾问和职业规划专家。你的任务是识别用户在求职过程中可能面临的各类风险，并提供专业的风险缓解建议。

要求：
1. 从行业、企业、个人三个维度识别风险
2. 评估风险发生概率和影响程度
3. 针对不同风险等级提供差异化应对策略
4. 结合用户风险偏好给出个性化建议
5. 提供具体的风险监控指标和预警机制`,
    userPromptTemplate: `请对以下求职场景进行风险分析：

## 用户背景
- 专业：{{major}}
- 学历：{{education}}
- MBTI 类型：{{mbtiType}}
- 风险偏好：{{riskPreference}}

## 目标岗位/公司
- 目标行业：{{targetIndustry}}
- 目标公司类型：{{targetCompanyType}}
- 期望薪资范围：{{expectedSalary}}
- 目标城市：{{targetCity}}

## 当前市场环境
- 行业景气度：{{industryTrend}}
- 竞争激烈程度：{{competitionLevel}}

## 已有Offer情况
- 当前Offer数量：{{offerCount}}
- 当前最优Offer：{{currentBestOffer}}

请按以下结构输出风险分析报告：
1. 行业层面风险分析（200字以内）
2. 企业层面风险分析（200字以内）
3. 个人层面风险分析（200字以内）
4. 风险矩阵（概率×影响度）
5. 风险缓解策略与应对方案`,
    temperature: 0.6,
    maxTokens: 2000,
    variables: [
      'major',
      'education',
      'mbtiType',
      'riskPreference',
      'targetIndustry',
      'targetCompanyType',
      'expectedSalary',
      'targetCity',
      'industryTrend',
      'competitionLevel',
      'offerCount',
      'currentBestOffer',
    ],
  },
};

export function getPromptTemplate(id: string): PromptTemplate | undefined {
  return PROMPT_TEMPLATES[id];
}

export function renderPrompt(template: PromptTemplate, variables: Record<string, string>): string {
  let prompt = template.userPromptTemplate;

  for (const key of template.variables) {
    const value = variables[key] ?? `[${key}]`;
    prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  }

  return prompt;
}

export function listPromptTemplates(): PromptTemplate[] {
  return Object.values(PROMPT_TEMPLATES);
}
